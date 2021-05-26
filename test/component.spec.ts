import test from "ava";
import path from "path";

import { readCode, transform } from "./utils";

test("data-props", ({ snapshot }) => {
  snapshot(
    transform("data-props", path.resolve(__dirname, `components/data-props`))
  );
});

test("life-cycle", ({ snapshot }) => {
  snapshot(
    transform("life-cycle", path.resolve(__dirname, `components/life-cycle`))
  );
});

test("methods-events", ({ snapshot }) => {
  snapshot(
    transform(
      "methods-events",
      path.resolve(__dirname, `components/methods-events`)
    )
  );
});

test("custom-attrs", ({ snapshot }) => {
  snapshot(
    transform(
      "custom-attrs",
      path.resolve(__dirname, `components/custom-attrs`)
    )
  );
});

test("class-style", ({ snapshot }) => {
  snapshot(
    transform(
      "class-style",
      path.resolve(__dirname, `components/class-style`)
    )
  );
});
