import test from "ava";
import path from "path";

import { readCode, transform } from "./utils";

test("data-props", ({ snapshot }) => {
  snapshot(transform("data-props", path.resolve(__dirname, `components/data-props`)));
});
