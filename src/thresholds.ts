// src/thresholds.ts
export const thresholds = {
  one_leg_left: {
    pass: 5,   // seconds
    warn: 3,   // <3 = fail, 3-5 = warn, ≥5 = pass  (tune later)
  },
  arm_raise_right: {
    pass: true, // boolean raised
  },
};

export function statusForOneLeg(seconds: number): "pass" | "warn" | "fail" {
  if (seconds >= thresholds.one_leg_left.pass) return "pass";
  if (seconds >= thresholds.one_leg_left.warn) return "warn";
  return "fail";
}
