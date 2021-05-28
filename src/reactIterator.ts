import traverse, { NodePath } from "@babel/traverse";
import * as t from "@babel/types";
import ReactVisitor from "./reactVisitor";
import { App, ITransformOptions } from "./utils/types";

export default function reactIterator(
  rast: t.Node,
  app: App,
  options: ITransformOptions
) {
  const visitor = new ReactVisitor(app, options);

  traverse(rast, {
    Program(path: NodePath<t.Program>) {
      visitor.genTopStatement(path); // no.3
      visitor.genLepusImports(path, visitor.app.lepus); // no.2
      visitor.genImports(path, Boolean(options.hasStyle)); // no.1
      visitor.genComments(path); // no.0
      visitor.genStaticProps(path);
    },

    ClassBody(path: NodePath<t.ClassBody>) {
      visitor.genPropertyObserverMethods(path);
      visitor.genConfigProperty(path);
      visitor.genClassMethods(path);
      visitor.genRenderMethods(path);
    },
  });

  traverse(rast, {
    MemberExpression(path: NodePath<t.MemberExpression>) {
      visitor.remapLepusMemberExpression(path);
    },
  });

  traverse(rast, {
    JSXElement(path: NodePath<t.JSXElement>) {
      visitor.genSelfClosingElement(path);
    },
  });

  return rast;
}
