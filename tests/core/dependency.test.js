import { describe, test, expect } from "@jest/globals";

import { invalidResult } from "../fixtures/core.fixtures.js";

describe("Core - Dependency Validations", () => {
  test("Dependency detects maxSalary minimum violation", () => {
    expect(invalidResult.errors).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          path: "maxSalary",
          code: "MIN_VALUE",
          message: "maxSalary must be more than minSalary",
        }),
      ]),
    );
  });

  test("Dependency detects minSalary maximum violation", () => {
    expect(invalidResult.errors).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          path: "minSalary",
          code: "MAX_VALUE",
          message: "minSalary must be less than maxSalary",
        }),
      ]),
    );
  });
});
