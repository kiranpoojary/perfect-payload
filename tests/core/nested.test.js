import { describe, test, expect } from "@jest/globals";

import { invalidResult } from "../fixtures/core.fixtures.js";

describe("Core - Nested Object Validations", () => {
  test.each([
    [
      "Nested path address.country works",
      "address.country",
      "NULL_NOT_ALLOWED",
    ],
    ["Nested path address.city works", "address.city", "MIN_LENGTH"],
    ["Nested path address.zip works", "address.zip", "REGEX_MISMATCH"],
    [
      "Deep nested path address.location.latitude works",
      "address.location.latitude",
      "INVALID_TYPE",
    ],
  ])("%s", (_description, path, code) => {
    expect(invalidResult.errors).toEqual(
      expect.arrayContaining([expect.objectContaining({ path, code })]),
    );
  });
});
