import { anyObject } from "./types";

export const lynxEventReMap: anyObject = {
  tap: "onClick",
  touchstart: "onTouchStart",
  touchend: "onTouchEnd",
  touchcancel: "onTouchCancel",
  touchmove: "onTouchMove",
  longpress: "onLongPress",
  longtap: "onLongTap",
  transitionend: "onTransitionEnd",
  animationstart: "onAnimationStart",
  animationiteration: "onAnimationIteration",
  animationend: "onAnimationEnd",
};
