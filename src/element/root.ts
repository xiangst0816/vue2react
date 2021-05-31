import {
  anyObject,
  EventsCollector,
  NodeType,
  ScriptProps,
} from "../utils/types";
import logger from "../utils/logUtil";
import * as t from "@babel/types";
import jsxElementGenerator from "../jsxElementGenerator";
import { EmptyTag } from "../common";

export function genRootElement(
  vnode: anyObject,
  attrsCollector: Set<string>, // 用于在 render 中设置 state/props 等的映射
  templateCollector: Set<t.ClassMethod>,
  eventsCollector: EventsCollector,
  slotsCollector: Map<string, ScriptProps>,
  tagCollector: Set<string>
): t.JSXElement | t.JSXExpressionContainer {
  let element: t.JSXElement | t.JSXExpressionContainer;

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
      slotsCollector,
      tagCollector
    );
    if (!_element) throw new Error("根节点解析异常！");

    element = _element;
  } else {
    element = t.jSXElement(
      t.jSXOpeningElement(t.jSXIdentifier(EmptyTag), []),
      t.jSXClosingElement(t.jSXIdentifier(EmptyTag)),
      []
    );

    (vnode.children || []).forEach((child: anyObject) => {
      // wrappedElement 对外， element 是内部的东西，看下要往 element 中塞入 children
      jsxElementGenerator(
        child,
        element,
        attrsCollector,
        templateCollector,
        eventsCollector,
        slotsCollector,
        tagCollector
      );
    });
  }

  return element;
}
