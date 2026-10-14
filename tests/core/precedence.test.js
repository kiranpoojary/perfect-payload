import { describe, test, expect } from "@jest/globals";
import { perfectPayload } from "../../dist/index.js";

describe("Core - Validation Precedence", () => {
  test("type validation runs before regex and customValidator regardless of property order", () => {
    let customValidatorExecuted = false;

    const result = perfectPayload(
      { value: 123 },
      {
        value: {
          customValidator: () => {
            customValidatorExecuted = true;
            return false;
          },
          regex: /^[A-Z]+$/,
          type: "string",
        },
      },
    );

    expect(result.valid).toBe(false);
    expect(result.errors?.[0]?.code).toBe("INVALID_TYPE");
    expect(customValidatorExecuted).toBe(false);
  });

  test("regex failure prevents customValidator from running", () => {
    let customValidatorExecuted = false;

    const result = perfectPayload(
      { value: "abc" },
      {
        value: {
          customValidator: () => {
            customValidatorExecuted = true;
            return false;
          },
          regex: /^[A-Z]+$/,
          type: "string",
        },
      },
    );

    expect(result.valid).toBe(false);
    expect(result.errors?.[0]?.code).toBe("REGEX_MISMATCH");
    expect(customValidatorExecuted).toBe(false);
  });

  test("mandatory failure prevents transform from running", () => {
    let transformExecuted = false;

    const result = perfectPayload(
      { value: "" },
      {
        value: {
          mandatory: true,
          transform: (value) => {
            transformExecuted = true;
            return Number(value);
          },
          type: "number",
        },
      },
    );

    expect(result.valid).toBe(false);
    expect(result.errors?.[0]?.code).toBe("REQUIRED");
    expect(transformExecuted).toBe(false);
  });

  test("type validation runs before objectAttr regardless of property order", () => {
    const result = perfectPayload(
      { value: "not-an-object" },
      {
        value: {
          objectAttr: {
            name: {
              mandatory: true,
              type: "string",
            },
          },
          type: "object",
        },
      },
    );

    expect(result.valid).toBe(false);
    expect(result.errors?.[0]?.code).toBe("INVALID_TYPE");
  });
  test("type failure prevents range validation", () => {
    const result = perfectPayload(
      { mark: "a" },
      {
        mark: {
          type: "number",
          range: "-20:100",
        },
      },
    );

    expect(result.valid).toBe(false);

    expect(result.errors).toHaveLength(1);

    expect(result.errors[0]).toEqual(
      expect.objectContaining({
        path: "mark",
        code: "INVALID_TYPE",
      }),
    );
  });
});
