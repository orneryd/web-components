export default function setupConnect(nodeList, context) {
  nodeList.connect = function (root) {
    if (typeof HTMLElement === "undefined") {
      return;
    }

    if (root) {
      // Explicit root provided — clear and append nodes.
      root.innerHTML = "";
      nodeList.forEach((node) => root.appendChild(node));
      return root;
    }

    // No root provided — derive from context.
    if (context instanceof HTMLElement) {
      if (
        context.shadowRoot &&
        context.shadowRoot.mode === "open"
      ) {
        root = context.shadowRoot;
      } else {
        root = document.createElement("div");
      }
      root.innerHTML = "";
      nodeList.forEach((node) => root.appendChild(node));
      return root;
    }
  };
  return nodeList;
}
