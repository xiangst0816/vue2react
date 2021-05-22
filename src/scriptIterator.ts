import { parse } from "@babel/parser";
import traverse, { NodePath } from "@babel/traverse";
import * as t from "@babel/types";

import ScriptVisitor from "./scriptVisitor";
import { identifier, Identifier, objectMethod } from "babel-types/ts3.6";

export default function scriptIterator(script: string) {
  // AST for script in lynx
  const vast = parse(script, {
    sourceType: "module",
  });

  const visitor = new ScriptVisitor();

  // Processing function notation
  // { onError: function () {} } -> { onError () {} }
  // { onError: () => {} } -> { onError () {} }
  traverse(vast, {
    ObjectProperty(path: NodePath<t.ObjectProperty>) {
      const name = (path.node.key as t.Identifier).name;
      if (t.isFunctionExpression(path.node.value)) {
        const params = path.node.value.params;
        const body = path.node.value.body;

        path.replaceWith(
          t.objectMethod("method", t.identifier(name), params, body)
        );
      } else if (t.isArrowFunctionExpression(path.node.value)) {
        const params = path.node.value.params;
        const body = path.node.value.body;

        if (t.isBlockStatement(body)) {
          path.replaceWith(
            t.objectMethod("method", t.identifier(name), params, body)
          );
        }
      }
    },
  });

  // collect props and data key firstly
  traverse(vast, {
    ObjectProperty(path: NodePath<t.ObjectProperty>) {
      const parent = path.parentPath.parent;
      const name = (path.node.key as t.Identifier).name;
      if (
        parent &&
        t.isCallExpression(parent) &&
        ((parent.callee as Identifier).name === "Component" ||
          (parent.callee as Identifier).name === "Card")
      ) {
        switch (name) {
          // opt.data
          case "data":
            const node = path.node.value;
            if (t.isObjectExpression(node)) {
              // Support following syntax:
              // data: {a: 1}
              visitor.dataHandler(node.properties, true);
            }
            break;
          // opt.props
          case "properties":
            visitor.propsHandler(path);
            break;
          default:
            break;
        }
      }
    },
  });

  // collect import, name, methods, computed, cycle...
  traverse(vast, {
    ImportDeclaration(path: NodePath<t.ImportDeclaration>) {
      visitor.importHandler(path);
    },

    VariableDeclaration(path: NodePath<t.VariableDeclaration>) {
      if (t.isProgram(path.parent)) {
        visitor.variableDeclarationHandler(path);
      }
    },

    ObjectMethod(path: NodePath<t.ObjectMethod>) {
      // isTopLevelMethod -> Component({ m(){} })
      const isTopLevelMethod = Boolean(
        t.isProgram(path?.parentPath?.parentPath?.parentPath?.parent)
      );
      const parent = path.parentPath.parent;
      const name = (path.node.key as t.Identifier).name;

      if (parent && t.isCallExpression(parent) && isTopLevelMethod) {
        if ((parent.callee as Identifier).name === "Component") {
          const LynxComponentCycle = [
            "created",
            "detached",
            "attached",
            "ready",
            "moved",
            "error",
          ];
          if (LynxComponentCycle.includes(name)) {
            visitor.cycleMethodHandler(path);
          } else {
            // Support following syntax:
            // treat as a normal method
            // { outerMethods () {} }
            visitor.objectMethodHandler(path);
          }
        } else if ((parent.callee as Identifier).name === "Card") {
          const LynxCardCycle = [
            "onLoad",
            "onShow",
            "onHide",
            "onReady",
            "onDestroy",
            "onFirstScreen",
          ];
          if (LynxCardCycle.includes(name)) {
            visitor.cycleMethodHandler(path);
          } else {
            // Support following syntax:
            // treat as a normal method
            // { outerMethods () {} }
            visitor.objectMethodHandler(path);
          }
        }
      } else if (parent && t.isObjectProperty(parent)) {
        const parentName = (parent.key as t.Identifier).name;
        switch (parentName) {
          case "methods":
            // Support following syntax:
            // methods: { handleClick() {...} }
            visitor.objectMethodHandler(path);
            break;
          case "computed":
            // Support following syntax:
            // computed: { reverseName() {...} }
            visitor.computedHandler(path);
            break;
          default:
            break;
        }
      }
    },

    ObjectProperty(path: NodePath<t.ObjectProperty>) {
      const parent = path.parentPath.parent;
      const name = (path.node.key as t.Identifier).name;
      if (
        parent &&
        t.isCallExpression(parent) &&
        ((parent.callee as Identifier).name === "Component" ||
          (parent.callee as Identifier).name === "Card")
      ) {
        switch (name) {
          case "name":
            visitor.nameHandler(path);
            break;
          default:
            break;
        }
      }
    },
  });

  return visitor.script;
}
