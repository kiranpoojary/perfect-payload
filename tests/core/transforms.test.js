import { describe, test, expect } from "@jest/globals";
import { perfectPayload } from "../../dist/index.js";
import { validResult, validPayload } from "../fixtures/core.fixtures.js";

describe("Core - Transformations", () => {
  test.each([
    [
      "trim transforms string before validation",
      "transformTrim",
      "Kiran Poojary",
    ],
    ["lowercase transforms string", "transformLowercase", "kiran"],
    ["uppercase transforms string", "transformUppercase", "KIRAN"],
    ["transformations follow fixed order", "transformCombined", "PP-100"],
    ["custom transform changes value", "transformCustom", "9876543210"],
    ["transform receives current payload", "transformPayload", 200],
  ])("%s", (_description, field, expected) => {
    expect(validResult.validatedPayload?.[field]).toBe(expected);
  });

  test("transform works inside nested object", () => {
    expect(validResult.validatedPayload?.transformNested?.name).toBe("KIRAN");
  });

  test("custom transform works inside nested object", () => {
    expect(validResult.validatedPayload?.transformNested?.code).toBe("PP100");
  });

  test("nested transformations do not mutate original payload", () => {
    expect(validPayload.transformNested).toEqual({
      name: "   kiran   ",
      code: "  PP-100  ",
    });
  });

  test("transform works inside elementConstraints", () => {
    expect(validResult.validatedPayload?.transformArray).toEqual([
      "APPLE",
      "BANANA",
      "MANGO",
    ]);
  });

  test("array transformations do not mutate original payload", () => {
    expect(validPayload.transformArray).toEqual([
      "  apple  ",
      "banana",
      "  mango",
    ]);
  });
  test("transform does not run for missing optional field", () => {
    let transformExecuted = false;

    const result = perfectPayload(
      {},
      {
        username: {
          transform: (value) => {
            transformExecuted = true;
            return value;
          },
        },
      },
    );

    expect(result.valid).toBe(true);
    expect(transformExecuted).toBe(false);
  });

  test("transform does not run when value is null and allowNull is true", () => {
    let transformExecuted = false;

    const result = perfectPayload(
      { username: null },
      {
        username: {
          allowNull: true,
          transform: () => {
            transformExecuted = true;
            return "changed";
          },
        },
      },
    );

    expect(result.valid).toBe(true);
    expect(result.validatedPayload?.username).toBeNull();
    expect(transformExecuted).toBe(false);
  });

  test("transform throws when transformer is not a function", () => {
    expect(() =>
      perfectPayload(
        { username: "kiran" },
        {
          username: {
            type: "string",
            transform: "not-a-function",
          },
        },
      ),
    ).toThrow(
      expect.objectContaining({
        name: "TypeError [ERR_INVALID_TRANSFORM]",
        code: "ERR_INVALID_TRANSFORM",
        message: 'transform must be a function for attribute "username"',
      }),
    );
  });

  test("transform throws when transformer returns a Promise", () => {
    expect(() =>
      perfectPayload(
        { username: "kiran" },
        {
          username: {
            type: "string",
            transform: async (value) => value.toUpperCase(),
          },
        },
      ),
    ).toThrow(
      expect.objectContaining({
        name: "TypeError [ERR_ASYNC_TRANSFORM]",
        code: "ERR_ASYNC_TRANSFORM",
        message: 'transform must be synchronous for attribute "username"',
      }),
    );
  });
  test("transform propagates transformer exceptions", () => {
    expect(() =>
      perfectPayload(
        { username: "kiran" },
        {
          username: {
            type: "string",
            transform: () => {
              throw new Error("CUSTOM_TRANSFORM_ERROR");
            },
          },
        },
      ),
    ).toThrow("CUSTOM_TRANSFORM_ERROR");
  });
  test("regex validates transformed value", () => {
    expect(validResult.validatedPayload?.transformBeforeRegex).toBe("PP-100");
  });

  test("length rules validate transformed value", () => {
    expect(validResult.validatedPayload?.transformBeforeLength).toBe("KIRAN");
  });

  test("customValidator receives transformed value", () => {
    expect(validResult.validatedPayload?.transformBeforeCustomValidator).toBe(
      "KIRAN",
    );
  });

  test("transform can convert string to number before validation", () => {
    const value = validResult.validatedPayload?.transformStringToNumber;

    expect(value).toBe(250);
    expect(typeof value).toBe("number");
  });

  test("numeric rules validate transformed number", () => {
    const value = validResult.validatedPayload?.transformStringToNumber;

    expect(value).toBeGreaterThanOrEqual(100);
    expect(value).toBeLessThanOrEqual(500);
  });

  test("transform can convert number to string before validation", () => {
    const value = validResult.validatedPayload?.transformNumberToString;

    expect(value).toBe("12345");
    expect(typeof value).toBe("string");
  });

  test("customValidator receives transformed data type", () => {
    const value = validResult.validatedPayload?.transformTypeCustomValidator;

    expect(value).toBe(500);
    expect(typeof value).toBe("number");
  });
  test("invalid transformed type is rejected", () => {
    const result = perfectPayload(
      { age: "abc" },
      {
        age: {
          transform: () => "not-a-number",
          type: "number",
        },
      },
    );

    expect(result.errors).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          path: "age",
          code: "INVALID_TYPE",
        }),
      ]),
    );
  });

  test("numeric validation rejects transformed value", () => {
    const result = perfectPayload(
      { quantity: "50" },
      {
        quantity: {
          transform: (value) => Number(value),
          type: "number",
          max: 10,
        },
      },
    );

    expect(result.errors).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          path: "quantity",
          code: "MAX_VALUE",
        }),
      ]),
    );
  });
  test("transform behavior does not depend on rule property order", () => {
    const payload = { code: "   pp-100   " };

    const resultA = perfectPayload(payload, {
      code: {
        trim: true,
        uppercase: true,
        type: "string",
        regex: /^PP-100$/,
      },
    });

    const resultB = perfectPayload(payload, {
      code: {
        regex: /^PP-100$/,
        type: "string",
        uppercase: true,
        trim: true,
      },
    });

    expect(resultA.valid).toBe(true);
    expect(resultB.valid).toBe(true);

    expect(resultA.validatedPayload?.code).toBe("PP-100");
    expect(resultB.validatedPayload?.code).toBe("PP-100");
  });

  test("custom transform runs after built-in transformations regardless of rule order", () => {
    const result = perfectPayload(
      { code: "   pp-100   " },
      {
        code: {
          transform: (value) => value.replace("-", ""),
          regex: /^PP100$/,
          uppercase: true,
          type: "string",
          trim: true,
        },
      },
    );

    expect(result.valid).toBe(true);
    expect(result.validatedPayload?.code).toBe("PP100");
  });
  test("transform returning undefined throws configuration error", () => {
    expect(() =>
      perfectPayload(
        { username: "kiran" },
        {
          username: {
            transform: () => undefined,
            type: "string",
          },
        },
      ),
    ).toThrow(
      expect.objectContaining({
        name: "TypeError [ERR_UNDEFINED_TRANSFORM_RESULT]",
        code: "ERR_UNDEFINED_TRANSFORM_RESULT",
        message: 'transform must not return undefined for attribute "username"',
      }),
    );
  });
  test("transform returning null is validated normally", () => {
    const result = perfectPayload(
      { username: "kiran" },
      {
        username: {
          transform: () => null,
          allowNull: false,
          type: "string",
        },
      },
    );

    expect(result.valid).toBe(false);

    expect(result.errors).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          path: "username",
          code: "NULL_NOT_ALLOWED",
        }),
      ]),
    );
  });
  test("mandatory rejects value that becomes empty after trim", () => {
    const result = perfectPayload(
      { username: "     " },
      {
        username: {
          mandatory: true,
          trim: true,
          type: "string",
        },
      },
    );

    expect(result.errors).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          path: "username",
          code: "REQUIRED",
        }),
      ]),
    );
  });

  test("optional string can become empty after trim", () => {
    const result = perfectPayload(
      { nickname: "     " },
      {
        nickname: {
          trim: true,
          type: "string",
        },
      },
    );

    expect(result.valid).toBe(true);
    expect(result.validatedPayload?.nickname).toBe("");
  });

  test("customValidator receives empty string produced by trim", () => {
    let receivedEmptyString = false;

    const result = perfectPayload(
      { nickname: "     " },
      {
        nickname: {
          trim: true,
          customValidator: (value) => {
            receivedEmptyString = value === "";
            return true;
          },
        },
      },
    );

    expect(result.valid).toBe(true);
    expect(receivedEmptyString).toBe(true);
    expect(result.validatedPayload?.nickname).toBe("");
  });
  test("lowercase and uppercase conflict reports nested path", () => {
    expect(() =>
      perfectPayload(
        {
          profile: {
            username: "Kiran",
          },
        },
        {
          profile: {
            type: "object",
            objectAttr: {
              username: {
                type: "string",
                lowercase: true,
                uppercase: true,
              },
            },
          },
        },
      ),
    ).toThrow(
      expect.objectContaining({
        name: "TypeError [ERR_CONFLICTING_TRANSFORMS]",
        code: "ERR_CONFLICTING_TRANSFORMS",
        message:
          'lowercase and uppercase cannot both be enabled for attribute "profile.username"',
      }),
    );
  });

  test("lowercase and uppercase conflict works inside elementConstraints", () => {
    expect(() =>
      perfectPayload(
        {
          names: ["Kiran"],
        },
        {
          names: {
            type: "array",
            elementConstraints: {
              type: "string",
              lowercase: true,
              uppercase: true,
            },
          },
        },
      ),
    ).toThrow(
      expect.objectContaining({
        name: "TypeError [ERR_CONFLICTING_TRANSFORMS]",
        code: "ERR_CONFLICTING_TRANSFORMS",
        message:
          'lowercase and uppercase cannot both be enabled for attribute "names"',
      }),
    );
  });
  test("transform returning undefined throws for mandatory field", () => {
    expect(() =>
      perfectPayload(
        { username: "kiran" },
        {
          username: {
            mandatory: true,
            type: "string",
            transform: () => undefined,
          },
        },
      ),
    ).toThrow(
      expect.objectContaining({
        name: "TypeError [ERR_UNDEFINED_TRANSFORM_RESULT]",
        code: "ERR_UNDEFINED_TRANSFORM_RESULT",
        message: 'transform must not return undefined for attribute "username"',
      }),
    );
  });
  test("transform returning undefined throws before customValidator executes", () => {
    let customValidatorExecuted = false;

    expect(() =>
      perfectPayload(
        { username: "kiran" },
        {
          username: {
            type: "string",
            transform: () => undefined,
            customValidator: () => {
              customValidatorExecuted = true;
              return true;
            },
          },
        },
      ),
    ).toThrow(
      expect.objectContaining({
        name: "TypeError [ERR_UNDEFINED_TRANSFORM_RESULT]",
        code: "ERR_UNDEFINED_TRANSFORM_RESULT",
        message: 'transform must not return undefined for attribute "username"',
      }),
    );

    expect(customValidatorExecuted).toBe(false);
  });
});
