import * as t from "@babel/types";
import {
  anyObject,
  Template,
  NodeType,
  EventsCollector,
  ScriptProps,
} from "./utils/types";
import { genSlotElement } from "./element/slot";
import {
  collectTemplateRenderMethods,
  genTemplateElement,
  isTemplateIsAttr,
  isTemplateNameAttr,
} from "./element/template";
import { genCommonElement } from "./element/common";
import { genRootElement } from "./element/root";
import { wrapIfCommand } from "./command/if";
import { injectElseCommand } from "./command/else";
import { wrapForCommand } from "./command/for";
import { transformTextToExpression } from "./utils/tools";
import { EmptyTag } from "./common";

export default function jsxElementGenerator(
  vnode: anyObject,
  parentElement: t.JSXElement | t.JSXExpressionContainer | undefined,
  attrsCollector: Set<string>, // 用于在 render 中设置 state/props 等的映射
  templateCollector: Set<t.ClassMethod>, // 用于在 render 中设置 XxTemplateComponent 等子模板
  eventsCollector: EventsCollector, // 用于在 class 中设置 事件处理函数，stopPropagation+bindThis
  slotsCollector: Map<string, ScriptProps>, // 用于搜集 slot 信息，将 slot-name 转为 renderXx props
  tagCollector: Set<string>
): Template {
  let element: t.JSXElement | t.JSXExpressionContainer | undefined = undefined; // 当前 element
  let wrappedElement:
    | t.JSXExpressionContainer
    | t.JSXElement
    // | t.JSXText
    | undefined = undefined; // element 可能进行包裹
  let ast: t.JSXElement | t.JSXExpressionContainer | undefined;

  switch (vnode.type) {
    case NodeType.Root:
      // Root
      element = genRootElement(
        vnode,
        attrsCollector,
        templateCollector,
        eventsCollector,
        slotsCollector,
        tagCollector
      );
      wrappedElement = element;
      break;
    case NodeType.Element:
      switch (vnode.tag) {
        case "slot":
          element = genSlotElement(vnode, attrsCollector, slotsCollector);
          wrappedElement = element;
          break;
        case "template":
          if (isTemplateNameAttr(vnode)) {
            collectTemplateRenderMethods(vnode, templateCollector);
          } else if (isTemplateIsAttr(vnode)) {
            element = genTemplateElement(vnode);
            wrappedElement = element;
          }

          break;
        default:
          // Element
          element = genCommonElement(
            vnode,
            attrsCollector,
            eventsCollector,
            tagCollector
          );
          wrappedElement = element;
          break;
      }

      // 所有元素都可以加 commands
      // tt:if/tt:for 等操作，需要在 element 外再包裹一层指令(element 必须存在)
      let commands = vnode.commands;
      if (
        element &&
        // t.isJSXElement(element) &&
        commands &&
        commands.length > 0
      ) {
        for (let ci = 0; commands.length > ci; ci++) {
          const command: anyObject = commands[ci];
          if (command.type === NodeType.Attribute) {
            switch (command.name) {
              case "if":
                wrappedElement = wrapIfCommand(
                  command,
                  element,
                  attrsCollector
                );
                break;
              case "elif":
              case "else":
                injectElseCommand(
                  command,
                  vnode,
                  element,
                  parentElement,
                  attrsCollector,
                  templateCollector,
                  eventsCollector,
                  slotsCollector,
                  tagCollector
                );

                // else/elif 不需要独立的 element；这里直接返回
                return {
                  ast: element,
                  attrsCollector,
                  templateCollector,
                  eventsCollector,
                  slotsCollector,
                  tagCollector,
                };
              case "for":
                wrappedElement = wrapForCommand(
                  command,
                  vnode,
                  element,
                  attrsCollector
                );
                break;
              case "for-item":
              case "for-index":
                // Processed in the 'for' branch
                break;
              default:
                debugger;
                break;
            }
          } else {
            debugger;
          }
        }
      }

      // 递归一次子组件
      if (vnode.children && vnode.children.length > 0) {
        vnode.children.forEach((child: anyObject) => {
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
      break;
    case NodeType.Text:
      // TODO: 看下这个是什么

      // @ts-ignore
      wrappedElement = t.jSXText(vnode.text);

      break;
    case NodeType.Mustache:
      const { identifiers, expression } = transformTextToExpression(vnode.text);
      identifiers.forEach((i) => attrsCollector.add(i));
      wrappedElement = t.jSXExpressionContainer(expression);
      break;
    case NodeType.Comment:
      wrappedElement = t.jSXExpressionContainer(t.jSXEmptyExpression());
      break;
    default:
      debugger;
  }

  if (parentElement && wrappedElement) {
    if (t.isJSXElement(parentElement)) {
      parentElement.children.push(wrappedElement);
    } else if (t.isJSXExpressionContainer(parentElement)) {
      // 包裹一个 view，然后 push
      // const wrapper = t.jSXElement(
      //     t.jSXOpeningElement(t.jSXIdentifier("View"), []),
      //     t.jSXClosingElement(t.jSXIdentifier("View")),
      //     []
      // );
      // // const tmp = parentElement;
      // wrapper.children.push(parentElement);
      debugger;
    }
  }

  // if (!wrappedElement) {
  //   debugger;
  //   // 需要断点看看这里少处理了哪些 tag
  //   // throw new Error("check");
  // }

  ast = wrappedElement;

  return {
    ast,
    attrsCollector,
    templateCollector,
    eventsCollector,
    slotsCollector,
    tagCollector,
  };
}
