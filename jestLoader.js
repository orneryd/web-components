import { transformHTML } from './src/loaders/html-loader.js';

export default {
  processAsync: async (src, filename) => ({
    code: await transformHTML(src, filename),
  }),
};
