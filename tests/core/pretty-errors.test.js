import { describe, test, expect } from "@jest/globals";
import { perfectPayload } from "../../dist/index.js";

describe("Core - Pretty Errors (Sync)", () => {
  test("v1.8 prettyErrors sync rejects non-boolean option", () => {
    expect(() =>
      perfectPayload(
        {},
        {},
        {
          prettyErrors: "true",
        },
      ),
    ).toThrow(
      expect.objectContaining({
        name: "TypeError [ERR_INVALID_PRETTY_ERRORS]",
        code: "ERR_INVALID_PRETTY_ERRORS",
        message: "prettyErrors must be a boolean",
      }),
    );
  });
  const rules = {
    email: {
      mandatory: true,
      type: "email",
    },
    age: {
      mandatory: true,
      type: "number",
      min: 18,
    },
  };

  const invalidPayload = {
    email: "invalid-email",
    age: 15,
  };

  test("v1.8 prettyErrors sync defaults to structured errors", () => {
    const result = perfectPayload(invalidPayload, rules);

    expect(result.valid).toBe(false);
    expect(result.errors).toHaveLength(2);
    expect(result.errors).toEqual([
      expect.objectContaining({
        path: "email",
        code: "INVALID_EMAIL",
      }),
      expect.objectContaining({
        path: "age",
        code: "MIN_VALUE",
      }),
    ]);
  });

  test("v1.8 prettyErrors sync returns message strings", () => {
    const result = perfectPayload(invalidPayload, rules, {
      prettyErrors: true,
    });

    expect(result.valid).toBe(false);
    expect(result.errors).toEqual([
      "Invalid email format for attribute email",
      "Minimum value 18 is allowed in attribute age",
    ]);
  });

  test("v1.8 prettyErrors preserves custom error messages", () => {
    const result = perfectPayload(
      { email: "invalid-email" },
      {
        email: {
          type: "email",
          typeError: "Please provide a valid email address",
        },
      },
      { prettyErrors: true },
    );

    expect(result.valid).toBe(false);
    expect(result.errors).toEqual(["Please provide a valid email address"]);
  });

  test("v1.8 prettyErrors does not affect successful sync validation", () => {
    const result = perfectPayload(
      { email: "user@example.com" },
      {
        email: {
          mandatory: true,
          type: "email",
        },
      },
      { prettyErrors: true },
    );

    expect(result.valid).toBe(true);
    expect(result.validatedPayload?.email).toBe("user@example.com");
    expect(result.errors).toBeUndefined();
  });
});
