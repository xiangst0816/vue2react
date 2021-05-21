import { anyObject, NodeType } from "../utils/types";
import * as t from "@babel/types";
import jsxElementGenerator from "../jsxElementGenerator";

export function genRootElement(
  vnode: anyObject,
  attrsCollector: Readonly<Set<string>>, // 用于在 render 中设置 state/props 等的映射
  templateCollector: Readonly<Set<t.ClassMethod>>
): t.JSXElement {
  let element = t.jSXElement(
    t.jSXOpeningElement(t.jSXIdentifier("View"), []),
    t.jSXClosingElement(t.jSXIdentifier("View")),
    []
  );

  const elementList = (vnode.children || []).filter(
    (node: anyObject) => node.type === NodeType.Element
  );

  if (elementList.length === 1) {
    const { ast: _element } = jsxElementGenerator(
      elementList[0],
      element,
      attrsCollector,
      templateCollector
    );
    if (!_element) throw new Error("根节点解析异常！");

    element = _element;
  } else {
    element = t.jSXElement(
      t.jSXOpeningElement(t.jSXIdentifier("View"), []),
      t.jSXClosingElement(t.jSXIdentifier("View")),
      []
    );

    console.log("[root] ReactLynx 不支持多个根节点，这里会包裹一层 View");
    (vnode.children || []).forEach((child: anyObject) => {
      // wrappedElement 对外， element 是内部的东西，看下要往 element 中塞入 children
      jsxElementGenerator(child, element, attrsCollector, templateCollector);
    });
  }

  return element;
}
