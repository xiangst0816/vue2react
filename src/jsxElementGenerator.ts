import * as t from "@babel/types";

import _ from "lodash";
import eventMap from "./utils/eventMap";
import logger from "./utils/logUtil";
import { anyObject, Template, NodeType } from "./utils/types";
import { getCollectedProperty } from "./utils/generatorUtils";

export default function jsxElementGenerator(
  vnode: anyObject,
  parentElement: t.JSXElement | null,
  attrsCollector: Set<string>
): Template {
  let element: t.JSXElement; // 当前 element
  let wrappedElement:
    | t.JSXExpressionContainer
    | t.JSXElement
    | t.JSXText
    | undefined = undefined; // element 可能进行包裹
  let ast: t.JSXElement;

  switch (vnode.type) {
    case NodeType.Root:
      // Root
      if (vnode.children && vnode.children.length > 0) {
        element = t.jSXElement(
          t.jSXOpeningElement(t.jSXIdentifier("div"), []),
          t.jSXClosingElement(t.jSXIdentifier("div")),
          []
        );
        vnode.children.forEach((child: anyObject) => {
          // wrappedElement 对外， element 是内部的东西，看下要往 element 中塞入 children
          jsxElementGenerator(child, element, attrsCollector);
        });
        wrappedElement = element;
      } else {
        debugger;
      }
      break;
    case NodeType.Element:
      // Element
      // 1 搜集元素属性；一种是表达式，一种是字面量
      // let commonAttrs: t.JSXAttribute[] = [];
      let styleAttrs: t.JSXAttribute[] = [];
      let classAttrs: t.JSXAttribute[] = [];

      let attrs = vnode.attrs;
      if (attrs && attrs.length > 0) {
        attrs.forEach((attr: anyObject) => {
          switch (attr.type) {
            case NodeType.StyleAttribute:
              // StyleAttribute
              const styleDeclarations = attr.children;
              if (styleDeclarations && styleDeclarations.length > 0) {
                const objectProperties: (
                  | t.ObjectProperty
                  | t.SpreadElement
                )[] = [];

                styleDeclarations.forEach((styleDeclaration: anyObject) => {
                  if (styleDeclaration.type === NodeType.StyleDeclaration) {
                    // StyleDeclaration
                    if (styleDeclaration.property && styleDeclaration.value) {
                      // Support following syntax:
                      // <view style="color:red;flex-direction:column;"/> -> <div style={{color:'red',flexDirection:'column'}}/>
                      // <view style="{{color}}:red;flex-direction:{{column}};"/> -> <div style={{[color+'']:'red',flexDirection:column}}/>
                      // <view style="{{color}}_1:red;flex-direction:{{column}}_2;"/> -> <div style={{[color+'_1']:'red',flexDirection:column+'_2'}}/>
                      let property = getCollectedProperty(
                        styleDeclaration.property.map((node: anyObject) => {
                          if (node.type === NodeType.Mustache) {
                            // Mustache
                            attrsCollector.add(node.text);
                            return t.identifier(node.text);
                          } else if (node.type === NodeType.Text) {
                            // Text
                            return t.stringLiteral(node.text);
                          } else if (node.type === NodeType.WhiteSpace) {
                            // WhiteSpace
                            return t.stringLiteral(" ");
                          }

                          debugger;
                          return "";
                        }),
                        true
                      );

                      let value = getCollectedProperty(
                        styleDeclaration.value.map((node: anyObject) => {
                          if (node.type === NodeType.Mustache) {
                            // Mustache
                            attrsCollector.add(node.text);
                            return t.identifier(node.text);
                          } else if (node.type === NodeType.Text) {
                            // Text
                            return t.stringLiteral(node.text);
                          } else if (node.type === NodeType.WhiteSpace) {
                            // WhiteSpace
                            return t.stringLiteral(" ");
                          } else {
                            debugger;
                          }
                          return "";
                        }),
                        false
                      );

                      objectProperties.push(
                        t.objectProperty(
                          property,
                          value,
                          t.isBinaryExpression(property)
                        )
                      );
                    } else if (
                      styleDeclaration.property &&
                      styleDeclaration.property[0]
                    ) {
                      // Support following syntax:
                      // TODO: 实现 styleStringToObject 函数
                      // <view style=";{{customStyleString}};"/> -> <view style={{...this.styleStringToObject(customStyleString)}}/>
                      const text = styleDeclaration.property[0].text;
                      attrsCollector.add(text);
                      objectProperties.push(
                        t.spreadElement(
                          t.callExpression(
                            t.memberExpression(
                              t.thisExpression(),
                              t.identifier("styleStringToObject")
                            ),
                            [t.identifier(text)]
                          )
                        )
                      );
                    }
                  } else {
                    // 当前 case 不支持；
                    debugger;
                  }
                });

                styleAttrs.push(
                  t.jSXAttribute(
                    t.jSXIdentifier("style"),
                    t.jSXExpressionContainer(
                      t.objectExpression(objectProperties as any)
                    )
                  )
                );
              }
              break;
            case 9:
              // ClassAttribute
              const classNames = attr.children;
              if (classNames && classNames.length > 0) {
                const constValue: (t.StringLiteral | t.Identifier)[] = [];
                classNames.forEach((className: anyObject) => {
                  if (className.type === NodeType.ClassName) {
                    // className
                    // <view class="class-name1 class-name2 {{cusClassName}} {{name}}_with_name"/> -> <View className={"class-name1" + " " + "class-name2" + " " + cusClassName + " " + name + "_with_name"}/>
                    if (className.children && className.children.length > 0) {
                      className.children.forEach((node: anyObject) => {
                        if (node.type === NodeType.Text) {
                          // Text
                          constValue.push(t.stringLiteral(node.text));
                        } else if (node.type === NodeType.Mustache) {
                          // Mustache
                          attrsCollector.add(node.text);
                          constValue.push(t.identifier(node.text));
                        } else {
                          // 当前 case 不支持；
                          debugger;
                        }
                      });
                    }
                  } else if (className.type === NodeType.WhiteSpace) {
                    // WhiteSpace
                    constValue.push(t.stringLiteral(" "));
                  } else {
                    // 当前 case 不支持；
                    debugger;
                  }
                });

                // add
                classAttrs.push(
                  t.jSXAttribute(
                    t.jSXIdentifier("className"),
                    t.jSXExpressionContainer(getCollectedProperty(constValue))
                  )
                );
              }
              break;
            default:
              // 当前 case 不支持；
              debugger;
              break;
          }
        });
      }

      // 制作原始的 element；
      // 使用搜集的信息创建这个 element
      const tagName = _.capitalize(vnode.tag);
      element = t.jSXElement(
        t.jSXOpeningElement(t.jSXIdentifier(tagName), [
          ...styleAttrs,
          ...classAttrs,
        ]),
        t.jSXClosingElement(t.jSXIdentifier(tagName)),
        []
      );

      wrappedElement = element;

      // TODO: 看下这个 element 是否有 tt:if 等操作，需要在包裹一层东西
      let commands = vnode.commands;
      if (commands && commands.length > 0) {
        for (let ci = 0; commands.length > ci; ci++) {
          const command: anyObject = commands[ci];
          // command
          if (command.type === NodeType.Attribute) {
            // Attribute
            switch (command.name) {
              case "if":
                // Support following syntax:
                // <div tt:if="show"/> -> {show ? <div/> : null}
                const test = getCollectedProperty(
                  command.children.map((node: anyObject) => {
                    if (node.type === NodeType.Mustache) {
                      // Mustache
                      attrsCollector.add(node.text);
                      return t.identifier(node.text);
                    } else if (node.type === NodeType.Text) {
                      // Text
                      return t.stringLiteral(node.text);
                    } else if (node.type === NodeType.WhiteSpace) {
                      // WhiteSpace
                      return t.stringLiteral(" ");
                    }

                    debugger;
                    return "";
                  })
                );

                wrappedElement = t.jSXExpressionContainer(
                  t.conditionalExpression(test, element, t.nullLiteral())
                );
                break;
              case "elif":
              case "else":
                // Support following syntax:
                // <div tt:if="{show}"/><div tt:else/> -> {show ? <div/> : <div/>}
                // <div tt:if="{show1}"/><div tt:elif="{show2}"/><div tt:else/> -> {show1 ? <div/>: show2 ? <div/> : <div/>}
                const parentJsxElementChildren = parentElement?.children || [];

                // if-else 最合适的挂载点
                let previousConditionalExpression:
                  | t.ConditionalExpression
                  | undefined;
                if (
                  parentJsxElementChildren &&
                  parentJsxElementChildren.length > 0
                ) {
                  // 从后向前找， 在 if 中挂载 else、elis
                  for (let i = parentJsxElementChildren.length; i > 0; i--) {
                    const node = parentJsxElementChildren[i - 1];
                    if (
                      node.type === "JSXExpressionContainer" &&
                      node.expression &&
                      node.expression.type === "ConditionalExpression"
                    ) {
                      previousConditionalExpression = node.expression;

                      // 找到不是 ConditionalExpression 的位置（也就是 nullLiteral）
                      while (
                        previousConditionalExpression &&
                        t.isConditionalExpression(
                          previousConditionalExpression?.alternate
                        )
                      ) {
                        previousConditionalExpression =
                          previousConditionalExpression?.alternate;
                      }

                      // 再次检查
                      if (
                        !t.isNullLiteral(
                          previousConditionalExpression?.alternate
                        )
                      ) {
                        previousConditionalExpression = undefined;
                        debugger;
                      } else {
                        // 找到合法的 if 挂载点
                        break;
                      }
                    }
                  }
                }

                if (previousConditionalExpression) {
                  if (command.name === "else") {
                    previousConditionalExpression.alternate = element;
                  } else if (command.name === "elif") {
                    const test = getCollectedProperty(
                      command.children.map((node: anyObject) => {
                        if (node.type === NodeType.Mustache) {
                          // Mustache
                          attrsCollector.add(node.text);
                          return t.identifier(node.text);
                        } else if (node.type === NodeType.Text) {
                          // Text
                          return t.stringLiteral(node.text);
                        } else if (node.type === NodeType.WhiteSpace) {
                          // WhiteSpace
                          return t.stringLiteral(" ");
                        }

                        debugger;
                        return "";
                      })
                    );

                    previousConditionalExpression.alternate = t.conditionalExpression(
                      test,
                      element,
                      previousConditionalExpression.alternate
                    );
                  } else {
                    debugger;
                  }

                  // 递归一次子组件
                  // TODO: 要重构
                  if (vnode.children && vnode.children.length > 0) {
                    vnode.children.forEach((child: anyObject) => {
                      // wrappedElement 对外， element 是内部的东西，看下要往 element 中塞入 children
                      jsxElementGenerator(child, element, attrsCollector);
                    });
                  }

                  return {
                    ast: element,
                    attrsCollector,
                  };
                }

                break;
              case "for":
                const forIdentifier = getCollectedProperty(
                  command.children.map((node: anyObject) => {
                    if (node.type === NodeType.Mustache) {
                      // Mustache
                      attrsCollector.add(node.text);
                      return t.identifier(node.text);
                    } else if (node.type === NodeType.Text) {
                      // Text
                      return t.stringLiteral(node.text);
                    } else if (node.type === NodeType.WhiteSpace) {
                      // WhiteSpace
                      return t.stringLiteral(" ");
                    }

                    debugger;
                    return "";
                  })
                );

                let forItemName = "item";
                const forItemNode: anyObject = vnode.commands.find(
                  (i: anyObject) => i.name === "for-item"
                );
                if (
                  forItemNode &&
                  forItemNode.children &&
                  forItemNode.children.length > 0
                ) {
                  const firstTextNode = forItemNode.children[0];
                  if (firstTextNode.type === NodeType.Text) {
                    forItemName = firstTextNode.text;
                  } else {
                    debugger;
                  }
                }

                let forIndexName = "index";
                const forIndexNode: anyObject = vnode.commands.find(
                  (i: anyObject) => i.name === "for-index"
                );
                if (
                  forIndexNode &&
                  forIndexNode.children &&
                  forIndexNode.children.length > 0
                ) {
                  const firstTextNode = forIndexNode.children[0];
                  if (firstTextNode.type === NodeType.Text) {
                    forIndexName = firstTextNode.text;
                  } else {
                    debugger;
                  }
                }

                wrappedElement = t.jSXExpressionContainer(
                  t.callExpression(
                    t.memberExpression(forIdentifier, t.identifier("map")),
                    [
                      t.arrowFunctionExpression(
                        [t.identifier(forItemName), t.identifier(forIndexName)],
                        element
                      ),
                    ]
                  )
                );

                break;
              case "for-item":
                // 在 for 分支已处理
                break;
              case "for-index":
                // 在 for 分支已处理
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
      // TODO: 要重构
      if (vnode.children && vnode.children.length > 0) {
        vnode.children.forEach((child: anyObject) => {
          // wrappedElement 对外， element 是内部的东西，看下要往 element 中塞入 children
          jsxElementGenerator(child, element, attrsCollector);
        });
      }

      break;
    case NodeType.ContentElement:
      // ContentElement
      debugger;
      break;
    case NodeType.ImportElement:
      // ImportElement
      debugger;
      break;
    case NodeType.Comment:
      // Comment 什么也不做
      break;
    case NodeType.Text:
      // Text
      wrappedElement = t.jSXText(vnode.text);
      break;
    case NodeType.Mustache:
      // Mustache
      debugger;
      break;
    case NodeType.WhiteSpace:
      // WhiteSpace
      debugger;
      break;
    case NodeType.Attribute:
      // Attribute
      debugger;
      break;
    case NodeType.ClassAttribute:
      // ClassAttribute
      debugger;
      break;
    case NodeType.StyleAttribute:
      // StyleAttribute
      debugger;
      break;
    case NodeType.ClassName:
      // ClassName
      debugger;
      break;
    case NodeType.StyleDeclaration:
      // StyleDeclaration
      debugger;
      break;
  }

  if (!wrappedElement) {
    wrappedElement = t.jSXElement(
      t.jSXOpeningElement(t.jSXIdentifier("div"), []),
      t.jSXClosingElement(t.jSXIdentifier("div")),
      []
    );
  }

  if (parentElement) {
    parentElement.children.push(wrappedElement);
  }

  // if (vnode.children && vnode.children.length > 0) {
  //   vnode.children.forEach((child: anyObject) => {
  //     // wrappedElement 对外， element 是内部的东西，看下要往 element 中塞入 children
  //     jsxElementGenerator(child, element, attrsCollector);
  //   });
  // }

  // 文本或表达式额外包裹一层 div；
  if (
    t.isJSXExpressionContainer(wrappedElement) ||
    t.isJSXText(wrappedElement)
  ) {
    ast = t.jSXElement(
      t.jSXOpeningElement(t.jSXIdentifier("div"), []),
      t.jSXClosingElement(t.jSXIdentifier("div")),
      [wrappedElement]
    );
  } else {
    ast = wrappedElement;
  }

  return {
    ast,
    attrsCollector,
  };
}

function jsxElementGenerator2(
  vnode: anyObject,
  parentElement: t.JSXElement | null,
  attrsCollector: Set<string>
): Template {
  const {
    type,
    events,
    key,
    directives,
    attrs,
    staticClass,
    ifConditions,
    alias,
  } = vnode;
  let element: t.JSXElement;
  let wrappedElement: t.JSXExpressionContainer | t.JSXElement | t.JSXText;
  let ast: t.JSXElement;

  // for node
  if (type === 1) {
    // 1 -> ASTElement
    // 1 搜集元素属性；一种是表达式，一种是字面量
    let commonAttrs: t.JSXAttribute[] = [];
    if (attrs) {
      commonAttrs = attrs.map((attr: anyObject) => {
        if (attr.dynamic === false) {
          // 搜集变量？
          // attr.dynamic === false
          // Support following syntax:
          // <div :data="list" v-bind:content="content"/> -> <div data={list} content={content}/>
          attrsCollector.add(attr.value);
          return t.jSXAttribute(
            t.jSXIdentifier(attr.name),
            t.jSXExpressionContainer(t.identifier(attr.value))
          );
        } else {
          // attr.dynamic === undefined
          // Support following syntax:
          // <div id="34we3"/> -> <div id="34we3"/>
          return t.jSXAttribute(
            t.jSXIdentifier(attr.name),
            t.stringLiteral(JSON.parse(attr.value))
          );
        }
      });
    }

    // 2 搜集 classname
    // Support following syntax:
    // <div class="wrapper"/> -> <div className="wrapper"/>
    let staticClassAttrs: t.JSXAttribute[] = [];
    if (staticClass) {
      staticClassAttrs.push(
        t.jSXAttribute(
          t.jSXIdentifier("className"),
          t.stringLiteral(JSON.parse(staticClass))
        )
      );
    }

    // 3 搜集事件部分（原生事件）
    // Support following syntax:
    // <div v-on:blur="handleBlur" @click="handleClick"/> -> <div onClick={handleClick} onBlur={handleBlur}/>
    let eventAttrs: t.JSXAttribute[] = [];
    if (events) {
      Object.keys(events).forEach((key) => {
        const eventName = eventMap[key];
        if (!eventName) {
          return logger.log(`Not support event name: ${key}`, "info");
        }
        attrsCollector.add(events[key].value);
        eventAttrs.push(
          t.jSXAttribute(
            t.jSXIdentifier(eventName),
            t.jSXExpressionContainer(t.identifier(events[key].value))
          )
        );
      });
    }

    // 4 搜集处理 key 这个关键词
    // Support following syntax:
    // <div :key="item.id"/> -> <div key={item.id}/>
    let keyAttrs: t.JSXAttribute[] = [];
    if (key) {
      attrsCollector.add(key);
      keyAttrs.push(
        t.jSXAttribute(
          t.jSXIdentifier("key"),
          t.jSXExpressionContainer(t.identifier(key))
        )
      );
    }

    // 5 搜集指令部分 v-show 等
    let directivesAttr: t.JSXAttribute[] = [];
    if (directives) {
      directives.forEach((directive: anyObject) => {
        attrsCollector.add(directive.value);
        switch (directive.rawName) {
          case "v-show":
            // Support following syntax:
            // <div v-show="isLoading"/> -> <div style={{display: isLoading ? 'block' : 'none'}}/>
            directivesAttr.push(
              t.jSXAttribute(
                t.jSXIdentifier("style"),
                t.jSXExpressionContainer(
                  t.objectExpression([
                    t.objectProperty(
                      t.identifier("display"),
                      t.conditionalExpression(
                        t.identifier(directive.value),
                        t.stringLiteral("block"),
                        t.stringLiteral("none")
                      )
                    ),
                  ])
                )
              )
            );
            break;
          case "v-html":
            // Support following syntax:
            // <div v-html="template"/> -> <div dangerouslySetInnerHTML={{__html: template}}/>
            directivesAttr.push(
              t.jSXAttribute(
                t.jSXIdentifier("dangerouslySetInnerHTML"),
                t.jSXExpressionContainer(
                  t.objectExpression([
                    t.objectProperty(
                      t.identifier("__html"),
                      t.identifier(directive.value)
                    ),
                  ])
                )
              )
            );
            break;
          default:
            break;
        }
      });
    }

    // 6 使用搜集的信息创建这个组件
    element = t.jSXElement(
      t.jSXOpeningElement(t.jSXIdentifier(vnode.tag), [
        ...commonAttrs,
        ...staticClassAttrs,
        ...eventAttrs,
        ...keyAttrs,
        ...directivesAttr,
      ]),
      t.jSXClosingElement(t.jSXIdentifier(vnode.tag)),
      []
    );

    // 7 需要对 element 变化的处理，
    if (ifConditions) {
      // 如果有条件语句，进行处理
      // Support following syntax:
      // <div v-if="show"/> -> {show && <div/>}
      wrappedElement = t.jSXExpressionContainer(
        t.logicalExpression("&&", t.identifier(ifConditions[0].exp), element)
      );
    } else if (alias) {
      // alias 就是下面的 item
      // Support following syntax:
      // <div v-for="item in list"/> -> {list.map(item => <div/>)}
      wrappedElement = t.jSXExpressionContainer(
        t.callExpression(
          t.memberExpression(t.identifier(vnode.for), t.identifier("map")),
          [t.arrowFunctionExpression([t.identifier(alias)], element)]
        )
      );
    } else {
      wrappedElement = element;
    }
  } else if (type === 2) {
    // 2 -> ASTExpression
    // Support following syntax:
    // {{name}} -> {name}
    attrsCollector.add(vnode.text.replace(/{{/g, "").replace(/}}/g, ""));
    wrappedElement = t.jSXText(
      vnode.text.replace(/{{/g, "{").replace(/}}/g, "}")
    );
  } else {
    // 3 -> ASTText
    wrappedElement = t.jSXText(vnode.text);
  }

  if (parentElement) {
    parentElement.children.push(wrappedElement);
  }

  if (vnode.children && vnode.children.length > 0) {
    vnode.children.forEach((child: anyObject) => {
      // wrappedElement 对外， element 是内部的东西，看下要往 element 中塞入 children
      jsxElementGenerator(child, element, attrsCollector);
    });
  }

  // 文本或表达式额外包裹一层 div；
  if (
    t.isJSXExpressionContainer(wrappedElement) ||
    t.isJSXText(wrappedElement)
  ) {
    ast = t.jSXElement(
      t.jSXOpeningElement(t.jSXIdentifier("div"), []),
      t.jSXClosingElement(t.jSXIdentifier("div")),
      [wrappedElement]
    );
  } else {
    ast = wrappedElement;
  }

  return {
    ast,
    attrsCollector,
  };
}
