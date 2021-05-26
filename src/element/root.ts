import {
  anyObject,
  EventsCollector,
  NodeType,
  ScriptProps,
} from "../utils/types";
import * as t from "@babel/types";
import jsxElementGenerator from "../jsxElementGenerator";

export function genRootElement(
  vnode: anyObject,
  attrsCollector: Set<string>, // 用于在 render 中设置 state/props 等的映射
  templateCollector: Set<t.ClassMethod>,
  eventsCollector: EventsCollector,
  slotsCollector: Map<string, ScriptProps>
): t.JSXElement {
  let element: t.JSXElement;

  const elementList = (vnode.children || []).filter(
    (node: anyObject) => node.type === NodeType.Element
  );

  if (elementList.length === 1) {
    const { ast: _element } = jsxElementGenerator(
      elementList[0],
      undefined,
      attrsCollector,
      templateCollector,
      eventsCollector,
      slotsCollector
    );
    if (!_element) throw new Error("根节点解析异常！");

    element = _element;
  } else {
    element = t.jSXElement(
      t.jSXOpeningElement(t.jSXIdentifier("View"), []),
      t.jSXClosingElement(t.jSXIdentifier("View")),
      []
    );

    console.log("[root] ReactLynx 不支持多个根节点，这里会包裹一层 View"); // TODO:DOC
    (vnode.children || []).forEach((child: anyObject) => {
      // wrappedElement 对外， element 是内部的东西，看下要往 element 中塞入 children
      jsxElementGenerator(
        child,
        element,
        attrsCollector,
        templateCollector,
        eventsCollector,
        slotsCollector
      );
    });
  }

  // 根节点自动加 onClick 属性；外部绑定 bindtap 这里通过这个方式触发
  // <View onClick={this.props.onClick}>{}</View>
  if (
    element &&
    element.openingElement &&
    element.openingElement.attributes &&
    !element.openingElement.attributes.find(
      (node) => node.name.name === "onClick"
    )
  ) {
    element.openingElement.attributes.push(
      t.jSXAttribute(
        t.jSXIdentifier("onClick"),
        t.jSXExpressionContainer(
          t.memberExpression(
            t.memberExpression(t.thisExpression(), t.identifier("props")),
            t.identifier("onClick")
          )
        )
      )
    );
  }

  return element;
}
