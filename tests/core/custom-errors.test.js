import { describe, test, expect } from "@jest/globals";

import { invalidResult } from "../fixtures/core.fixtures.js";

describe("Core - Custom Error Messages", () => {
  test.each([
    [
      "Custom mandatory error works",
      "customMandatoryError",
      "REQUIRED",
      "CUSTOM_REQUIRED_ERROR",
    ],
    [
      "Custom null error works",
      "customNullError",
      "NULL_NOT_ALLOWED",
      "CUSTOM_NULL_ERROR",
    ],
    [
      "Custom empty object error works",
      "customEmptyObjectError",
      "EMPTY_OBJECT_NOT_ALLOWED",
      "CUSTOM_EMPTY_OBJECT_ERROR",
    ],
    [
      "Custom empty array error works",
      "customEmptyArrayError",
      "EMPTY_ARRAY_NOT_ALLOWED",
      "CUSTOM_EMPTY_ARRAY_ERROR",
    ],
    [
      "Custom array element error works",
      "customElementConstraintError[1]",
      "INVALID_ARRAY_ELEMENT",
      "CUSTOM_ARRAY_ELEMENT_ERROR",
    ],
    [
      "Custom regex error works",
      "customRegexError",
      "REGEX_MISMATCH",
      "CUSTOM_REGEX_ERROR",
    ],
    [
      "Custom type error works",
      "customTypeError",
      "INVALID_TYPE",
      "CUSTOM_TYPE_ERROR",
    ],
    [
      "Custom minLength error works",
      "customMinLengthError",
      "MIN_LENGTH",
      "CUSTOM_MIN_LENGTH_ERROR",
    ],
    [
      "Custom maxLength error works",
      "customMaxLengthError",
      "MAX_LENGTH",
      "CUSTOM_MAX_LENGTH_ERROR",
    ],
    [
      "Custom decimal error works",
      "customDecimalError",
      "DECIMAL_NOT_ALLOWED",
      "CUSTOM_DECIMAL_ERROR",
    ],
    [
      "Custom min error works",
      "customMinError",
      "MIN_VALUE",
      "CUSTOM_MIN_ERROR",
    ],
    [
      "Custom max error works",
      "customMaxError",
      "MAX_VALUE",
      "CUSTOM_MAX_ERROR",
    ],
    [
      "Custom range error works",
      "customRangeError",
      "OUT_OF_RANGE",
      "CUSTOM_RANGE_ERROR",
    ],
  ])("%s", (_description, path, code, message) => {
    expect(invalidResult.errors).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          path,
          code,
          message,
        }),
      ]),
    );
  });
});
