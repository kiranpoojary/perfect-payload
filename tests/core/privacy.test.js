import { describe, test, expect } from "@jest/globals";
import { perfectPayload } from "../../dist/index.js";

describe("Core - Sensitive Value Protection", () => {
  const sensitivePayload = {
    email: "my-secret-email-value",
    age: 5,
    token: "SUPER_SECRET_TOKEN_123",
  };

  const sensitiveRules = {
    email: {
      type: "email",
    },
    age: {
      type: "number",
      min: 18,
    },
    token: {
      type: "string",
      regex: /^VALID_TOKEN$/,
    },
  };

  const sensitiveResult = perfectPayload(sensitivePayload, sensitiveRules);

  const allErrorMessages =
    sensitiveResult?.errors?.map((error) => error.message).join(" ") || "";

  test("error messages do not expose invalid email value", () => {
    expect(allErrorMessages).not.toContain(sensitivePayload.email);
  });

  test("error messages do not expose invalid numeric value", () => {
    expect(allErrorMessages).not.toContain(String(sensitivePayload.age));
  });

  test("error messages do not expose invalid token value", () => {
    expect(allErrorMessages).not.toContain(sensitivePayload.token);
  });

  test("structured errors do not contain a value property", () => {
    expect(sensitiveResult.errors).toEqual(
      expect.arrayContaining([
        expect.not.objectContaining({
          value: expect.anything(),
        }),
      ]),
    );

    expect(
      sensitiveResult.errors.every(
        (error) => !Object.prototype.hasOwnProperty.call(error, "value"),
      ),
    ).toBe(true);
  });
  describe("v1.8 - URL and Enum Privacy", () => {
    test("v1.8 privacy - URL does not expose submitted value", () => {
      const secretUrl = "SECRET_INVALID_URL";

      const result = perfectPayload(
        { website: secretUrl },
        {
          website: {
            type: "url",
          },
        },
      );

      expect(result.errors?.[0]).toEqual(
        expect.objectContaining({
          code: "INVALID_URL",
          message: "Invalid URL format for attribute website",
        }),
      );

      expect(result.errors[0].message).not.toContain(secretUrl);
    });

    test("v1.8 privacy - enum does not expose submitted value", () => {
      const secretEnum = "SECRET_ROLE";

      const result = perfectPayload(
        { role: secretEnum },
        {
          role: {
            type: "enum",
            enumValues: ["admin", "user"],
          },
        },
      );

      expect(result.errors?.[0]).toEqual(
        expect.objectContaining({
          code: "INVALID_ENUM",
          message:
            "Invalid value for attribute role, valid values are admin, user",
        }),
      );

      expect(result.errors[0].message).not.toContain(secretEnum);
    });
  });

  describe("v1.8 - UUID and ObjectId Privacy", () => {
    test.each([
      ["uuid", "INVALID_UUID", "Invalid UUID for attribute id"],
      ["uuidv1", "INVALID_UUID_V1", "Invalid v1 UUID for attribute id"],
      ["uuidv3", "INVALID_UUID_V3", "Invalid v3 UUID for attribute id"],
      ["uuidv4", "INVALID_UUID_V4", "Invalid v4 UUID for attribute id"],
      ["uuidv5", "INVALID_UUID_V5", "Invalid v5 UUID for attribute id"],
      ["objectId", "INVALID_OBJECT_ID", "Invalid ObjectId for attribute id"],
    ])(
      "v1.8 privacy - %s does not expose submitted value",
      (type, expectedCode, expectedMessage) => {
        const secretValue = `SECRET_${type.toUpperCase()}`;

        const result = perfectPayload(
          { id: secretValue },
          {
            id: { type },
          },
        );

        expect(result.valid).toBe(false);

        expect(result.errors?.[0]).toEqual(
          expect.objectContaining({
            code: expectedCode,
            message: expectedMessage,
          }),
        );

        expect(result.errors[0].message).not.toContain(secretValue);
      },
    );
  });

  describe("v1.8 - Numeric Validation Privacy", () => {
    test("preventDecimal invalid type does not expose submitted value", () => {
      const secretValue = "SECRET_NOT_NUMBER";

      const result = perfectPayload(
        { quantity: secretValue },
        {
          quantity: { preventDecimal: true },
        },
      );

      expect(result.errors?.[0]).toEqual(
        expect.objectContaining({
          code: "INVALID_TYPE",
          message: "Invalid type for attribute quantity, required number value",
        }),
      );

      expect(result.errors[0].message).not.toContain(secretValue);
    });

    test("preventDecimal does not expose submitted decimal value", () => {
      const secretDecimal = 123.456789;

      const result = perfectPayload(
        { quantity: secretDecimal },
        {
          quantity: { preventDecimal: true },
        },
      );

      expect(result.errors?.[0]).toEqual(
        expect.objectContaining({
          code: "DECIMAL_NOT_ALLOWED",
          message: "Decimal value not allowed in attribute quantity",
        }),
      );

      expect(result.errors[0].message).not.toContain(String(secretDecimal));
    });

    test("generic type error does not expose submitted value", () => {
      const secretValue = "SECRET_WRONG_TYPE";

      const result = perfectPayload(
        { age: secretValue },
        {
          age: { type: "number" },
        },
      );

      expect(result.errors?.[0]).toEqual(
        expect.objectContaining({
          code: "INVALID_TYPE",
          message: "Invalid type for attribute age, required number value",
        }),
      );

      expect(result.errors[0].message).not.toContain(secretValue);
    });
  });
  test("v1.8 privacy - schema constraints remain available", () => {
    const result = perfectPayload(
      {
        age: 101,
        score: -1,
        percentage: 150,
      },
      {
        age: {
          max: 100,
        },
        score: {
          min: 0,
        },
        percentage: {
          range: "0-100",
        },
      },
    );

    expect(result.valid).toBe(false);
    expect(result.errors).toHaveLength(3);

    expect(result.errors.map((error) => error.message)).toEqual([
      "Maximum value 100 is allowed in attribute age",
      "Minimum value 0 is allowed in attribute score",
      "Attribute percentage should have a value between 0 and 100",
    ]);
  });
});
