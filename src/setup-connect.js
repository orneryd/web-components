module.exports = function(nodeList, context) {
  nodeList.connect = function(root) {
    if (!root && context instanceof HTMLElement) {
      root = context;
    }
    if (root instanceof HTMLElement && root.shadowRoot && root.shadowRoot.mode === 'open') {
      root = root.shadowRoot;
    } else {
      root = document.createElement('div');
    }
    root.innerHTML = '';
    nodeList.forEach((node) => root.appendChild(node));
    return root;
  };
  return nodeList;
};
