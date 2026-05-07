declare module '*.html' {
  type ConnectableNodeList = Node[] & {
    connect(root?: Element | DocumentFragment): Element | DocumentFragment | undefined;
  };
  const template: (props?: Record<string, unknown>) => ConnectableNodeList;
  export default template;
}
