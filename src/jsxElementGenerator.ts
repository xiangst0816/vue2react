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
  parentElement: t.JSXElement | undefined,
  attrsCollector: Set<string>, // 用于在 render 中设置 state/props 等的映射
  templateCollector: Set<t.ClassMethod>, // 用于在 render 中设置 XxTemplateComponent 等子模板
  eventsCollector: EventsCollector, // 用于在 class 中设置 事件处理函数，stopPropagation+bindThis
  slotsCollector: Map<string, ScriptProps> // 用于搜集 slot 信息，将 slot-name 转为 renderXx props
): Template {
  let element: t.JSXElement | undefined = undefined; // 当前 element
  let wrappedElement:
    | t.JSXExpressionContainer
    | t.JSXElement
    | t.JSXText
    | undefined = undefined; // element 可能进行包裹
  let ast: t.JSXElement | undefined;

  switch (vnode.type) {
    case NodeType.Root:
      // Root
      element = genRootElement(
        vnode,
        attrsCollector,
        templateCollector,
        eventsCollector,
        slotsCollector
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
          if (vnode.tag === "block") {
            console.warn(
              `[log] ReactLynx 没有 Fragment 组件, <block> 这里会替换成 <${EmptyTag}>`
            );
            vnode.tag = EmptyTag; // view
          }

          // Element
          element = genCommonElement(vnode, attrsCollector, eventsCollector);
          wrappedElement = element;
          break;
      }

      // 所有元素都可以加 commands

      // tt:if/tt:for 等操作，需要在 element 外再包裹一层指令(element 必须存在)
      let commands = vnode.commands;
      if (element && commands && commands.length > 0) {
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
                  slotsCollector
                );

                // else/elif 不需要独立的 element；这里直接返回
                return {
                  ast: element,
                  attrsCollector,
                  templateCollector,
                  eventsCollector,
                  slotsCollector,
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
            slotsCollector
          );
        });
      }
      break;
    case NodeType.Text:
      wrappedElement = t.jSXText(vnode.text);
      break;
    case NodeType.Mustache:
      const { identifiers, expression } = transformTextToExpression(vnode.text);
      identifiers.forEach((i) => attrsCollector.add(i));
      wrappedElement = t.jSXExpressionContainer(expression);
      break;
    case NodeType.Comment:
      wrappedElement = t.jSXEmptyExpression() as any;
      break;
    default:
      debugger;
  }

  if (parentElement && wrappedElement) {
    parentElement.children.push(wrappedElement);
  }

  if (!wrappedElement) {
    debugger;
    // 需要断点看看这里少处理了哪些 tag
    // throw new Error("check");
  }

  ast = (wrappedElement as any) as t.JSXElement;

  return {
    ast,
    attrsCollector,
    templateCollector,
    eventsCollector,
    slotsCollector,
  };
}
