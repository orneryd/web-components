import { describe, it, before } from 'node:test';
import assert from 'node:assert/strict';
import { readFile, writeFile, mkdir, rm } from 'node:fs/promises';
import path from 'node:path';
import { pathToFileURL, fileURLToPath } from 'node:url';
import { JSDOM } from 'jsdom';

import vitePlugin from '@ornery/web-components/vite';
import webpackPlugin from '@ornery/web-components/webpack';
import rollupPlugin from '@ornery/web-components/rollup';
import esbuildPlugin from '@ornery/web-components/esbuild';
import rspackPlugin from '@ornery/web-components/rspack';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const fixture = path.join(__dirname, 'fixtures', 'list.html');

// Exercise the bundler plugin's transform hook the same way Vite/Webpack would.
async function runTransform(id) {
  const plugin = vitePlugin();
  const code = await readFile(id, 'utf8');
  assert.equal(plugin.transformInclude(id), true, 'plugin opts into .html files');
  const result = await plugin.transform.call({}, code, id);
  return typeof result === 'string' ? result : result.code;
}

describe('@ornery/web-components loader', () => {
  let dom;
  before(() => {
    dom = new JSDOM('<!doctype html><html><body></body></html>');
    globalThis.window = dom.window;
    globalThis.document = dom.window.document;
    globalThis.DOMParser = dom.window.DOMParser;
    globalThis.HTMLElement = dom.window.HTMLElement;
    globalThis.Node = dom.window.Node;
    globalThis.Element = dom.window.Element;
    globalThis.Event = dom.window.Event;
  });

  it('transforms an HTML file into an ESM module that matches the documented shape', async () => {
    const html = await readFile(fixture, 'utf8');
    const out = await runTransform(fixture);

    assert.match(
      out,
      /import \{bindEvents, setupConnect\} from "@ornery\/web-components\/templates"/,
      'output imports bindEvents/setupConnect from the public entry',
    );
    assert.match(out, /export default \(p = \{\}\)\s*=>/, 'default-exports a props-taking function');
    assert.match(out, /new DOMParser\(\)\.parseFromString/, 'uses DOMParser for template assembly');
    assert.match(out, /<style>/, 'inlines a <style> tag');

    assert.match(out, /\.example-list/, 'compiled SCSS selector is present');
    assert.match(out, /\.example-list-item\s*\{[^}]*color:\s*#2563eb/, 'SCSS was compiled to CSS with resolved $accent');

    assert.doesNotMatch(out, /\$accent/, 'SCSS variables are resolved');
    assert.doesNotMatch(out, /<link[^>]+\.scss/, 'link tag is stripped after SCSS inline');
  });

  it('exposes instantiable plugins for every supported bundler', () => {
    for (const factory of [vitePlugin, webpackPlugin, rollupPlugin, esbuildPlugin, rspackPlugin]) {
      const plugin = factory({});
      assert.ok(plugin, `${factory.name || 'plugin'} returned a value`);
    }
  });

  it('evaluating the module and calling it with props renders nodes, styles, and wires events', async () => {
    const out = await runTransform(fixture);

    // Write the compiled module inside the repo so Node can resolve
    // `@ornery/web-components/templates` through the symlinked node_modules entry
    // — exactly what a consumer project would see after `npm install`.
    const outDir = path.join(__dirname, '.compiled');
    await rm(outDir, { recursive: true, force: true });
    await mkdir(outDir, { recursive: true });
    const modFile = path.join(outDir, 'list.compiled.mjs');
    await writeFile(modFile, out, 'utf8');
    const mod = await import(pathToFileURL(modFile).href);

    assert.equal(typeof mod.default, 'function', 'default export is a function');

    let clicks = 0;
    const props = {
      headerText: 'List of fruits.',
      subtitle: 'Fresh picks',
      items: ['apple', 'orange', 'banana'],
      onAdd() { clicks++; },
    };
    const result = mod.default(props);

    assert.ok(Array.isArray(result), 'returns an array-like node list');
    assert.equal(typeof result.connect, 'function', 'node list carries a connect() function (setupConnect)');

    const host = document.createElement('div');
    host.append(...result);

    const title = host.querySelector('#list-title');
    assert.ok(title, 'rendered header');
    assert.equal(title.textContent, 'List of fruits.', 'interpolated ${this.headerText}');

    // Per docs: ${this.X}, ${props.X}, and ${X} are interchangeable.
    assert.equal(host.querySelector('#subtitle-props').textContent, 'Fresh picks', '${props.subtitle} interpolates');
    assert.equal(host.querySelector('#subtitle-bare').textContent, 'Fresh picks', '${subtitle} (bare) interpolates');

    const items = host.querySelectorAll('.example-list-item');
    assert.equal(items.length, 3, 'rendered all mapped items');
    assert.deepEqual(
      Array.from(items, (li) => li.textContent),
      ['apple', 'orange', 'banana'],
      'each item value interpolated inside the mapped template',
    );

    for (const id of ['add-this', 'add-props', 'add-bare']) {
      const button = host.querySelector('#' + id);
      assert.ok(button, `rendered ${id}`);
      assert.equal(button.getAttribute('onclick'), null, `onclick stripped on ${id}`);
    }

    host.querySelector('#add-this').dispatchEvent(new dom.window.Event('click'));
    host.querySelector('#add-props').dispatchEvent(new dom.window.Event('click'));
    host.querySelector('#add-bare').dispatchEvent(new dom.window.Event('click'));
    assert.equal(clicks, 3, '${this.fn}, ${props.fn}, and ${fn} all bind the same handler');

    const style = Array.from(host.children).find((n) => n.tagName === 'STYLE');
    assert.ok(style, '<style> landed in the connected output');
    assert.match(style.textContent, /\.example-list-item/, 'compiled CSS reached the DOM');
  });
});
