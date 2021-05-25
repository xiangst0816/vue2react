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
}

export type EventsCollector = Map<
  string,
  { name: string; stopPropagation: boolean }
>;

export interface Template {
  ast: t.JSXElement | undefined;
  attrsCollector: Set<string>;
  templateCollector: Set<t.ClassMethod>;
  eventsCollector: EventsCollector;
  slotsCollector: Map<string, ScriptProps>;
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
