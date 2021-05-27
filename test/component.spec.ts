import test from "ava";
import path from "path";
import { transform } from "../src";

test("life-cycle", ({ snapshot }) => {
  snapshot(
    transform({
      baseDir: path.resolve(__dirname, `components/life-cycle`),
      filename: "life-cycle",
    })
  );
});

test("methods-events", ({ snapshot }) => {
  snapshot(
    transform({
      baseDir: path.resolve(__dirname, `components/methods-events`),
      filename: "methods-events",
    })
  );
});

test("observer", ({ snapshot }) => {
  snapshot(
    transform({
      baseDir: path.resolve(__dirname, `components/observer`),
      filename: "observer",
    })
  );
});

test("slot", ({ snapshot }) => {
  snapshot(
    transform({
      baseDir: path.resolve(__dirname, `components/slot`),
      filename: "slot",
    })
  );
});
