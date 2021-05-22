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
      visitor.genLepusImports(path, visitor.app.lepus);
      visitor.genImports(path, hasStyle);
    },

    // TODO：全局变量，这个检查下
    ClassBody(path: NodePath<t.ClassBody>) {
      visitor.genConfigProperty(path);
      visitor.genStaticProps(path);
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
