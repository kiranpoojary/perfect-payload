import { describe, test, expect } from "@jest/globals";

import { invalidResult } from "../fixtures/core.fixtures.js";

describe("Core - Regex Validation", () => {
  test("regex -> REGEX_MISMATCH", () => {
    expect(invalidResult.errors).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          path: "regexField",
          code: "REGEX_MISMATCH",
        }),
      ]),
    );
  });
});

describe("Core - String Length Validation", () => {
  test.each([
    ["minLength -> MIN_LENGTH", "minLengthField", "MIN_LENGTH"],
    ["maxLength -> MAX_LENGTH", "maxLengthField", "MAX_LENGTH"],
  ])("%s", (_description, path, code) => {
    expect(invalidResult.errors).toEqual(
      expect.arrayContaining([expect.objectContaining({ path, code })]),
    );
  });
});
