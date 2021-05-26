import test from "ava";
import path from "path";

import { transform } from "./utils";

test("data-props", ({ snapshot }) => {
  snapshot(
    transform("data-props", path.resolve(__dirname, `common/data-props`))
  );
});

test("custom-attrs", ({ snapshot }) => {
  snapshot(
    transform("custom-attrs", path.resolve(__dirname, `common/custom-attrs`))
  );
});

test("class-style", ({ snapshot }) => {
  snapshot(
    transform("class-style", path.resolve(__dirname, `common/class-style`))
  );
});

test("if-else", ({ snapshot }) => {
  snapshot(transform("if-else", path.resolve(__dirname, `common/if-else`)));
});

test("for", ({ snapshot }) => {
  snapshot(transform("for", path.resolve(__dirname, `common/for`)));
});

test("mustache", ({ snapshot }) => {
  snapshot(transform("mustache", path.resolve(__dirname, `common/mustache`)));
});

test("template", ({ snapshot }) => {
  snapshot(transform("template", path.resolve(__dirname, `common/template`)));
});

test("lepus", ({ snapshot }) => {
  snapshot(transform("lepus", path.resolve(__dirname, `common/lepus`)));
});

test("config", ({ snapshot }) => {
  snapshot(transform("config", path.resolve(__dirname, `common/config`)));
});

test("using-components", ({ snapshot }) => {
  snapshot(transform("using-components", path.resolve(__dirname, `common/using-components`)));
});
