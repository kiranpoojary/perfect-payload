import { describe, test, expect } from "@jest/globals";
import { perfectPayload } from "../../dist/index.js";
import { invalidResult } from "../fixtures/core.fixtures.js";

describe("Core - Number Validations", () => {
  test.each([
    [
      "preventDecimal -> DECIMAL_NOT_ALLOWED",
      "integerField",
      "DECIMAL_NOT_ALLOWED",
    ],
    ["min -> MIN_VALUE", "minField", "MIN_VALUE"],
    ["max -> MAX_VALUE", "maxField", "MAX_VALUE"],
    ["range -> OUT_OF_RANGE", "rangeField", "OUT_OF_RANGE"],
  ])("%s", (_description, path, code) => {
    expect(invalidResult.errors).toEqual(
      expect.arrayContaining([expect.objectContaining({ path, code })]),
    );
  });
  test("number type rejects NaN", () => {
    const result = perfectPayload(
      { mark: NaN },
      {
        mark: {
          type: "number",
        },
      },
    );

    expect(result.valid).toBe(false);

    expect(result.errors).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          path: "mark",
          code: "INVALID_TYPE",
        }),
      ]),
    );
  });
});

describe("Core - NaN Hardening", () => {
  test.each([
    ["NaN with min is rejected as INVALID_TYPE", { min: 1 }],
    ["NaN with max is rejected as INVALID_TYPE", { max: 100 }],
    ["NaN with range is rejected as INVALID_TYPE", { range: "1-100" }],
  ])("%s", (_description, additionalRules) => {
    const result = perfectPayload(
      { price: NaN },
      {
        price: {
          mandatory: true,
          type: "number",
          ...additionalRules,
        },
      },
    );

    expect(result.valid).toBe(false);
    expect(result.errors?.[0]).toEqual(
      expect.objectContaining({
        path: "price",
        code: "INVALID_TYPE",
      }),
    );
  });

  test("NaN inside elementConstraints is rejected with indexed path", () => {
    const result = perfectPayload(
      { prices: [10, NaN, 30] },
      {
        prices: {
          type: "array",
          elementConstraints: {
            type: "number",
            min: 1,
          },
        },
      },
    );

    expect(result.valid).toBe(false);
    expect(result.errors?.[0]).toEqual(
      expect.objectContaining({
        path: "prices[1]",
        code: "INVALID_TYPE",
      }),
    );
  });

  test("finite numbers remain valid after NaN hardening", () => {
    const result = perfectPayload(
      { price: 50 },
      {
        price: {
          mandatory: true,
          type: "number",
          min: 1,
          max: 100,
          range: "1-100",
        },
      },
    );

    expect(result.valid).toBe(true);
    expect(result.validatedPayload?.price).toBe(50);
  });
});

describe("Core - Signed and Decimal Range Boundaries", () => {
  test("range supports negative minimum", () => {
    const result = perfectPayload(
      { temperature: -10 },
      {
        temperature: {
          type: "number",
          range: "-20-100",
        },
      },
    );

    expect(result.valid).toBe(true);
    expect(result.validatedPayload.temperature).toBe(-10);
  });

  test("range rejects value below negative minimum", () => {
    const result = perfectPayload(
      { temperature: -21 },
      {
        temperature: {
          type: "number",
          range: "-20-100",
        },
      },
    );

    expect(result.valid).toBe(false);
    expect(result.errors?.[0]?.code).toBe("OUT_OF_RANGE");
  });

  test("range supports two negative boundaries", () => {
    const result = perfectPayload(
      { temperature: -10 },
      {
        temperature: {
          type: "number",
          range: "-20--1",
        },
      },
    );

    expect(result.valid).toBe(true);
  });

  test("range supports explicit positive boundary", () => {
    const result = perfectPayload(
      { temperature: 50 },
      {
        temperature: {
          type: "number",
          range: "-20-+100",
        },
      },
    );

    expect(result.valid).toBe(true);
  });

  test("range supports signed decimal boundaries", () => {
    const result = perfectPayload(
      { temperature: -10.25 },
      {
        temperature: {
          type: "number",
          range: "-20.5-10.5",
        },
      },
    );

    expect(result.valid).toBe(true);
  });
  test("range rejects malformed format with Node-style configuration error", () => {
    expect(() =>
      perfectPayload(
        { value: 10 },
        {
          value: {
            type: "number",
            range: "10-",
          },
        },
      ),
    ).toThrow(
      expect.objectContaining({
        name: "TypeError [ERR_INVALID_RANGE]",
        code: "ERR_INVALID_RANGE",
        message: 'Invalid range format for attribute "value"',
      }),
    );
  });
  test("range supports reversed legacy boundaries", () => {
    const result = perfectPayload(
      { value: 10 },
      {
        value: {
          type: "number",
          range: "100--20",
        },
      },
    );

    expect(result.valid).toBe(true);
    expect(result.validatedPayload.value).toBe(10);
  });
});

describe("Core - Range Boundary Order Independence", () => {
  test.each([
    ["ascending positive", 50, "20:100"],
    ["descending positive", 50, "100:20"],
    ["ascending negative", -50, "-100:-20"],
    ["descending negative", -50, "-20:-100"],
    ["ascending mixed-sign", 0, "-20:100"],
    ["descending mixed-sign", 0, "100:-20"],
  ])("range supports %s boundaries", (_scenario, value, range) => {
    const result = perfectPayload(
      { value },
      {
        value: {
          type: "number",
          range,
        },
      },
    );

    expect(result.valid).toBe(true);
  });
});

describe("Core - Numeric and Numeric-String Ranges", () => {
  test.each([
    ["numeric value", -22, "number", true, null],
    ["numeric string value", "-22", "string", true, null],
    ["numeric string below minimum", "-101", "string", false, "OUT_OF_RANGE"],
    ["numeric string above maximum", "101", "string", false, "OUT_OF_RANGE"],
    ["non-numeric string value", "abc", "string", false, "OUT_OF_RANGE"],
  ])(
    "range validates %s",
    (_scenario, value, type, expectedValid, expectedErrorCode) => {
      const result = perfectPayload(
        { value },
        {
          value: {
            type,
            range: "-100:100",
          },
        },
      );

      expect(result.valid).toBe(expectedValid);

      if (expectedValid) {
        expect(result.validatedPayload.value).toBe(value);
      } else {
        expect(result.errors?.[0]?.code).toBe(expectedErrorCode);
      }
    },
  );
});
