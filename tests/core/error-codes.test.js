import { describe, test, expect } from "@jest/globals";

import { invalidResult } from "../fixtures/core.fixtures.js";

describe("Core - Public Validation Error Codes", () => {
  const expectedErrorCodes = [
    "REQUIRED",
    "NULL_NOT_ALLOWED",
    "EMPTY_OBJECT_NOT_ALLOWED",
    "EMPTY_ARRAY_NOT_ALLOWED",
    "INVALID_ARRAY_ELEMENT",
    "REGEX_MISMATCH",
    "INVALID_TYPE",
    "INVALID_EMAIL",
    "INVALID_URL",
    "INVALID_ENUM",
    "INVALID_UUID",
    "INVALID_UUID_V1",
    "INVALID_UUID_V3",
    "INVALID_UUID_V4",
    "INVALID_UUID_V5",
    "INVALID_OBJECT_ID",
    "MIN_LENGTH",
    "MAX_LENGTH",
    "DECIMAL_NOT_ALLOWED",
    "MIN_VALUE",
    "MAX_VALUE",
    "OUT_OF_RANGE",
  ];

  test.each(expectedErrorCodes)("Public error code %s is generated", (code) => {
    expect(invalidResult.errors).toEqual(
      expect.arrayContaining([expect.objectContaining({ code })]),
    );
  });
});
