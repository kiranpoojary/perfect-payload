import { describe, test, expect } from "@jest/globals";

import { invalidResult } from "../fixtures/core.fixtures.js";

const hasError = (result, { path, code }) =>
  result?.errors?.some((error) => error.path === path && error.code === code);

describe("Core - Required / Null / Empty", () => {
  test("mandatory -> REQUIRED", () => {
    expect(
      hasError(invalidResult, {
        path: "requiredField",
        code: "REQUIRED",
      }),
    ).toBe(true);
  });

  test("allowNull -> NULL_NOT_ALLOWED", () => {
    expect(
      hasError(invalidResult, {
        path: "nullNotAllowed",
        code: "NULL_NOT_ALLOWED",
      }),
    ).toBe(true);
  });

  test("allowEmptyObject -> EMPTY_OBJECT_NOT_ALLOWED", () => {
    expect(
      hasError(invalidResult, {
        path: "emptyObjectNotAllowed",
        code: "EMPTY_OBJECT_NOT_ALLOWED",
      }),
    ).toBe(true);
  });

  test("allowEmptyArray -> EMPTY_ARRAY_NOT_ALLOWED", () => {
    expect(
      hasError(invalidResult, {
        path: "emptyArrayNotAllowed",
        code: "EMPTY_ARRAY_NOT_ALLOWED",
      }),
    ).toBe(true);
  });
});
