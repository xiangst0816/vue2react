import test from "ava";
import path from "path";

import { transform } from "./utils";

test("life-cycle", ({ snapshot }) => {
  snapshot(transform("life-cycle", path.resolve(__dirname, `cards/life-cycle`)));
});

test("show-hide", ({ snapshot }) => {
  snapshot(transform("show-hide", path.resolve(__dirname, `cards/show-hide`)));
});
