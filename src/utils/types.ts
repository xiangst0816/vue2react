import * as t from "@babel/types";

export type anyObject = { [name: string]: any };

export type ScriptProps = {
  type: string;
  typeValue: string | string[];
  defaultValue: any;
  required: boolean;
  validator: boolean;
  observer: boolean;
};

// observer function info collect
export type ScriptObserver = {
  name: string;
  newValNode: t.Identifier | undefined;
  oldValNode: t.Identifier | undefined;
  bodyExpression: t.Statement[];
};

export interface Script {
  component: boolean;
  name: string;
  data: anyObject; // todo: to map
  props: Map<string, ScriptProps>;
  methods: anyObject; // todo: to map
  computed: anyObject; // todo: to map
  topStatement: (t.ModuleDeclaration | t.Statement)[];
  observer: ScriptObserver[];
}

export interface Lepus {
  name: string; // _styleFn
  specifiers: string[][]; // [[local,exported]]
  path: string; // './test.lepus'
  functionDeclarations: Map<string, t.FunctionDeclaration>;
}

export type EventsCollector = Map<
  string,
  { name: string; stopPropagation: boolean; withData: boolean }
>;

export interface Template {
  ast: t.JSXElement | t.JSXExpressionContainer | undefined;
  attrsCollector: Set<string>;
  templateCollector: Set<t.ClassMethod>;
  eventsCollector: EventsCollector;
  slotsCollector: Map<string, ScriptProps>;
  tagCollector: Set<string>;
}

export interface App {
  template: Template;
  script: Script;
  lepus: Lepus[];
  config: Record<string, any>; // index.js
}

export interface Log {
  msg: string;
  type: string;
}

export enum NodeType {
  Root,
  Element,
  ContentElement,
  ImportElement,
  Comment,
  Text,
  Mustache,
  WhiteSpace,
  Attribute,
  ClassAttribute,
  StyleAttribute,
  ClassName,
  StyleDeclaration,
}

export interface ITransformOptions {
  passTapEvent?: boolean; // 自定义 component 是否自动补充 onClick 进行事件绑定透传， 默认 true
  addTopComments?: boolean;
  hasStyle?: boolean;
  componentPathRewrite?: (name: string, path: string) => string;
  importCssPath?: string; // ./index.scss
  reactRuntimeImportDeclaration?: string; // import ReactLynx, { Component } from '@byted-lynx/react-runtime'
  // reactComponentsImportDeclaration?: string; // import { Text } from '@byted-lynx/react-components'
  reactComponentsImportSpecifiers?:string[]; // ['Text','View']
  reactComponentsImportSource?:string; // @byted-lynx/react-components
  inlineLepus?: boolean;

  // TODO: add more
  // TODO: 增加内置参数控制，各类默认行为给一个可控入口
}
