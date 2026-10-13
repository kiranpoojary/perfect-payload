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
});
