import { describe, test, expect } from "@jest/globals";
import { perfectPayload } from "../../dist/index.js";
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

  test("invalid dependency rule throws Node-style configuration error", () => {
    expect(() =>
      perfectPayload(
        {
          minSalary: 10,
          maxSalary: 20,
        },
        {
          minSalary: {
            type: "number",
            dependency: {
              maxSalary: {
                setDependencyRule: "invalid",
              },
            },
          },
          maxSalary: {
            type: "number",
          },
        },
      ),
    ).toThrow(
      expect.objectContaining({
        name: "TypeError [ERR_INVALID_DEPENDENCY_RULE]",
        code: "ERR_INVALID_DEPENDENCY_RULE",
        message:
          'setDependencyRule must be a function for dependency "maxSalary"',
      }),
    );
  });
});
