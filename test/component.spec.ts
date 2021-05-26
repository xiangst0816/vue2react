import test from "ava";
import path from "path";

import { transform } from "./utils";

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

test("observer", ({ snapshot }) => {
  snapshot(
    transform("observer", path.resolve(__dirname, `components/observer`))
  );
});

test("slot", ({ snapshot }) => {
  snapshot(transform("slot", path.resolve(__dirname, `components/slot`)));
});
