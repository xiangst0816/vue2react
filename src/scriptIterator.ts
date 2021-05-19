import { parse } from "@babel/parser";
import traverse, { NodePath } from "@babel/traverse";
import * as t from "@babel/types";

import ScriptVisitor from "./scriptVisitor";
import { Identifier } from "babel-types/ts3.6";

export default function scriptIterator(script: string) {
  // AST for script in Vue
  const vast = parse(script, {
    sourceType: "module",
  });

  const visitor = new ScriptVisitor();

  // collect props and data key firstly
  traverse(vast, {
    // ObjectMethod(path: NodePath<t.ObjectMethod>) {
    //   const parent = path.parentPath.parent;
    //   const name = (path.node.key as t.Identifier).name;
    //
    //   if (parent && t.isCallExpression(parent)) {
    //     switch (name) {
    //       case "data":
    //         // Support following syntax:
    //         // data() => { return {a: 1}}
    //         visitor.dataHandler(path.node.body.body, false);
    //         break;
    //       default:
    //         break;
    //     }
    //   }
    // },

    ObjectProperty(path: NodePath<t.ObjectProperty>) {
      const parent = path.parentPath.parent;
      const name = (path.node.key as t.Identifier).name;
      if (
        parent &&
        t.isCallExpression(parent) &&
        (parent.callee as Identifier).name === "Component"
      ) {
        switch (name) {
          // instance.data
          case "data":
            const node = path.node.value;
            // if (t.isArrowFunctionExpression(node)) {
            //   if ((node.body as t.BlockStatement).body) {
            //     // Support following syntax:
            //     // data: () => { return {a: 1}}
            //     visitor.dataHandler(
            //       (node.body as t.BlockStatement).body,
            //       false
            //     );
            //   } else {
            //     // Support following syntax:
            //     // data: () => ({a: 1})
            //     visitor.dataHandler(
            //       (node.body as t.ObjectExpression).properties,
            //       true
            //     );
            //   }
            // } else if (t.isFunctionExpression(node)) {
            //   // Support following syntax:
            //   // data: function () => { return {a: 1}}
            //   visitor.dataHandler(node.body.body, false);
            // } else

            if (t.isObjectExpression(node)) {
              // Support following syntax:
              // data: {a: 1}
              visitor.dataHandler(node.properties, true);
            }
            break;
          // instance.props
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

    ObjectMethod(path: NodePath<t.ObjectMethod>) {
      const parent = path.parentPath.parent;
      const name = (path.node.key as t.Identifier).name;
      if (
        parent &&
        t.isCallExpression(parent) &&
        (parent.callee as Identifier).name === "Component"
      ) {
        switch (name) {
          // LynxComponent
          case "created":
          case "detached":
          case "attached":
          case "ready":
          case "moved":
          case "error":
            // TODO: LynxCard
            // TODO: LynxComponentLifeTimes
            // TODO: delete this from vue
            // case "created":
            // case "mounted":
            // case "update":
            // case "beforeDestroy":
            // case "errorCaptured":

            // Support following syntax:
            // created() {...}
            visitor.methodsHandler(path, true);
            break;
          default:
            break;
        }
      } else if (parent && t.isObjectProperty(parent)) {
        const parentName = (parent.key as t.Identifier).name;
        switch (parentName) {
          case "methods":
            // Support following syntax:
            // methods: { handleClick() {...} }
            visitor.methodsHandler(path, false);
            break;
          // case "computed":
          //   // Support following syntax:
          //   // computed: { reverseName() {...} }
          //   visitor.computedHandler(path);
          //   break;
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
        (parent.callee as Identifier).name === "Component"
      ) {
        switch (name) {
          case "name":
            visitor.nameHandler(path);
            break;
          default:
            break;
        }
      }

      if (
        parent &&
        t.isObjectProperty(parent) &&
        (parent.key as Identifier).name === "methods"
      ) {
        // TODO: Support following syntax:
        // methods: { onError: function () {} }
      }
    },
  });

  return visitor.script;
}
