import test from "ava";
import path from "path";
import { transform } from "../src";

test("data-props", ({ snapshot }) => {
  snapshot(
    transform({
      baseDir: path.resolve(__dirname, `common/data-props`),
      filename: "data-props",
    })
  );
});

test("custom-attrs", ({ snapshot }) => {
  snapshot(
    transform({
      baseDir: path.resolve(__dirname, `common/custom-attrs`),
      filename: "custom-attrs",
    })
  );
});

test("class-style", ({ snapshot }) => {
  snapshot(
    transform({
      baseDir: path.resolve(__dirname, `common/class-style`),
      filename: "class-style",
    })
  );
});

test("if-else", ({ snapshot }) => {
  snapshot(
    transform({
      baseDir: path.resolve(__dirname, `common/if-else`),
      filename: "if-else",
    })
  );
});

test("for", ({ snapshot }) => {
  snapshot(
    transform({
      baseDir: path.resolve(__dirname, `common/for`),
      filename: "for",
    })
  );
});

test("mustache", ({ snapshot }) => {
  snapshot(
    transform({
      baseDir: path.resolve(__dirname, `common/mustache`),
      filename: "mustache",
    })
  );
});

test("template", ({ snapshot }) => {
  snapshot(
    transform({
      baseDir: path.resolve(__dirname, `common/template`),
      filename: "template",
    })
  );
});

test("lepus", ({ snapshot }) => {
  snapshot(
    transform({
      baseDir: path.resolve(__dirname, `common/lepus`),
      filename: "lepus",
    })
  );
});

test("config", ({ snapshot }) => {
  snapshot(
    transform({
      baseDir: path.resolve(__dirname, `common/config`),
      filename: "config",
    })
  );
});

test("using-components", ({ snapshot }) => {
  snapshot(
    transform({
      baseDir: path.resolve(__dirname, `common/using-components`),
      filename: "using-components",
    })
  );
});
