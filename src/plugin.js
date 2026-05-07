import { createUnplugin } from 'unplugin';
import { transformHTML } from './loaders/html-loader.js';

export const unplugin = createUnplugin((options = {}) => ({
  name: 'ornery-web-components',
  transformInclude(id) {
    return (options.include || /\.html$/).test(id);
  },
  transform(code, id) {
    return transformHTML(code, id, options);
  },
}));

export default unplugin;
