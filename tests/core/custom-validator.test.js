import { describe, test, expect } from "@jest/globals";
import { perfectPayload } from "../../dist/index.js";
import { invalidResult, validResult } from "../fixtures/core.fixtures.js";

describe("Core - Custom Validator", () => {
  test.each([
    [
      "customValidator default error -> CUSTOM_VALIDATION_FAILED",
      "customValidatorDefault",
      "CUSTOM_VALIDATION_FAILED",
      "Custom validation failed for attribute customValidatorDefault",
    ],
    [
      "customValidator custom error message",
      "customValidatorWithError",
      "CUSTOM_VALIDATION_FAILED",
      "Value must be an even number",
    ],
    [
      "customValidator custom code and message",
      "customValidatorWithCode",
      "RESERVED_USERNAME",
      "Username cannot contain admin",
    ],
    [
      "customValidator receives complete payload",
      "customValidatorPayload",
      "LIMIT_EXCEEDED",
      "Value cannot exceed customValidatorLimit",
    ],
    [
      "customValidator works inside nested object",
      "customValidatorNested.code",
      "INVALID_CUSTOM_CODE",
      "Code must start with PP-",
    ],
    [
      "customValidator works inside elementConstraints",
      "customValidatorArray[1]",
      "NOT_EVEN",
      "Array value must be even",
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

  test("customValidator does not run for missing optional field", () => {
    expect(
      invalidResult.errors?.some(
        (error) => error.path === "customValidatorOptional",
      ) ?? false,
    ).toBe(false);

    expect(
      validResult.errors?.some(
        (error) => error.path === "customValidatorOptional",
      ) ?? false,
    ).toBe(false);
  });

  test("customValidator throws when validator is not a function", () => {
    expect(() =>
      perfectPayload(
        { username: "kiran" },
        {
          username: {
            type: "string",
            customValidator: "not-a-function",
          },
        },
      ),
    ).toThrow(
      expect.objectContaining({
        name: "TypeError [ERR_INVALID_CUSTOM_VALIDATOR]",
        code: "ERR_INVALID_CUSTOM_VALIDATOR",
        message: 'customValidator must be a function for attribute "username"',
      }),
    );
  });

  test("customValidator throws when validator returns a Promise", () => {
    expect(() =>
      perfectPayload(
        { username: "kiran" },
        {
          username: {
            type: "string",
            customValidator: async (value) => value === "kiran",
          },
        },
      ),
    ).toThrow(
      expect.objectContaining({
        name: "TypeError [ERR_ASYNC_CUSTOM_VALIDATOR]",
        code: "ERR_ASYNC_CUSTOM_VALIDATOR",
        message: 'customValidator must be synchronous for attribute "username"',
      }),
    );
  });

  test("customValidator passes only when validator returns strict true", () => {
    const cases = [
      { returnedValue: false, shouldPass: false },
      { returnedValue: undefined, shouldPass: false },
      { returnedValue: null, shouldPass: false },
      { returnedValue: 1, shouldPass: false },
      { returnedValue: "true", shouldPass: false },
      { returnedValue: {}, shouldPass: false },
      { returnedValue: true, shouldPass: true },
    ];

    for (const { returnedValue, shouldPass } of cases) {
      const result = perfectPayload(
        { username: "kiran" },
        {
          username: {
            type: "string",
            customValidator: () => returnedValue,
          },
        },
      );

      if (shouldPass) {
        expect(result.valid).toBe(true);
      } else {
        expect(result.errors).toEqual(
          expect.arrayContaining([
            expect.objectContaining({
              path: "username",
              code: "CUSTOM_VALIDATION_FAILED",
            }),
          ]),
        );
      }
    }
  });
  test("customValidator does not run when value is null and allowNull is true", () => {
    let validatorExecuted = false;

    const result = perfectPayload(
      { username: null },
      {
        username: {
          allowNull: true,
          customValidator: () => {
            validatorExecuted = true;
            return false;
          },
        },
      },
    );

    expect(result.valid).toBe(true);
    expect(result.validatedPayload?.username).toBeNull();
    expect(validatorExecuted).toBe(false);
  });

  test("valid payload passes all customValidators", () => {
    expect(validResult.errors).toBeUndefined();

    expect(validResult.validatedPayload).toEqual(
      expect.objectContaining({
        customValidatorDefault: "VALID",
        customValidatorWithError: 10,
        customValidatorWithCode: "kiran",
        customValidatorPayload: 50,
      }),
    );
  });
  test("customValidator throws when validator returns a Promise", () => {
    expect(() =>
      perfectPayload(
        { username: "kiran" },
        {
          username: {
            type: "string",
            customValidator: async (value) => value === "kiran",
          },
        },
      ),
    ).toThrow(
      expect.objectContaining({
        name: "TypeError [ERR_ASYNC_CUSTOM_VALIDATOR]",
        code: "ERR_ASYNC_CUSTOM_VALIDATOR",
        message: 'customValidator must be synchronous for attribute "username"',
      }),
    );
  });
});
