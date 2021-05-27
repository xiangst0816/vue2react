import test from "ava";
import path from "path";

import { transform } from "../src";

test("life-cycle", ({ snapshot }) => {
  snapshot(
    transform({
      baseDir: path.resolve(__dirname, `cards/life-cycle`),
      filename: "life-cycle",
    })
  );
});

test("show-hide", ({ snapshot }) => {
  snapshot(
    transform({
      baseDir: path.resolve(__dirname, `cards/show-hide`),
      filename: "show-hide",
    })
  );
});

test("data-changed", ({ snapshot }) => {
  snapshot(
    transform({
      baseDir: path.resolve(__dirname, `cards/data-changed`),
      filename: "data-changed",
    })
  );
});
