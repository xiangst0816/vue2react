import traverse, { NodePath } from "@babel/traverse";
import * as t from "@babel/types";
import ReactVisitor from "./reactVisitor";
import { App } from "./utils/types";

export default function reactIterator(
  rast: t.Node,
  app: App,
  hasStyle: boolean
) {
  const visitor = new ReactVisitor(app);

  traverse(rast, {
    Program(path: NodePath<t.Program>) {
      visitor.genVariableDeclaration(path); // no.3
      visitor.genLepusImports(path, visitor.app.lepus); // no.2
      visitor.genImports(path, hasStyle); // no.1
      visitor.genComments(path); // no.0
      visitor.genStaticProps(path);
    },

    ClassBody(path: NodePath<t.ClassBody>) {
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

  return rast;
}
