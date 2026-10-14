import { describe, test, expect } from "@jest/globals";
import { perfectPayload } from "../../dist/index.js";

describe("Core - Unknown Fields", () => {
  const payload = {
    name: "Kiran",
    role: "developer",
    active: true,
  };

  const rules = {
    name: {
      type: "string",
    },
  };

  test("v1.7 unknownFields defaults to strip", () => {
    const result = perfectPayload(payload, rules);

    expect(result.valid).toBe(true);
    expect(result.validatedPayload).toEqual({
      name: "Kiran",
    });
  });

  test("v1.7 unknownFields allow preserves unknown fields", () => {
    const result = perfectPayload(payload, rules, {
      unknownFields: "allow",
    });

    expect(result.valid).toBe(true);
    expect(result.validatedPayload).toEqual({
      name: "Kiran",
      role: "developer",
      active: true,
    });
  });

  test("v1.7 unknownFields reject returns structured errors", () => {
    const result = perfectPayload(payload, rules, {
      unknownFields: "reject",
    });

    expect(result.valid).toBe(false);
    expect(result.errors).toHaveLength(2);
    expect(result.errors).toEqual([
      expect.objectContaining({
        path: "role",
        code: "UNKNOWN_FIELD",
      }),
      expect.objectContaining({
        path: "active",
        code: "UNKNOWN_FIELD",
      }),
    ]);
  });

  test("v1.7 unknownFields does not mutate original payload", () => {
    perfectPayload(payload, rules, {
      unknownFields: "strip",
    });

    expect(payload).toEqual({
      name: "Kiran",
      role: "developer",
      active: true,
    });
  });
  describe("Nested Unknown Fields - objectAttr", () => {
    const payload = {
      profile: {
        city: "Bengaluru",
        role: "developer",
      },
    };

    const rules = {
      profile: {
        type: "object",
        objectAttr: {
          city: {
            type: "string",
          },
        },
      },
    };

    test("v1.7 unknownFields strip works with nested objectAttr", () => {
      const result = perfectPayload(payload, rules);

      expect(result.valid).toBe(true);
      expect(result.validatedPayload?.profile).toEqual({
        city: "Bengaluru",
      });
    });

    test("v1.7 unknownFields allow works with nested objectAttr", () => {
      const result = perfectPayload(payload, rules, {
        unknownFields: "allow",
      });

      expect(result.valid).toBe(true);
      expect(result.validatedPayload?.profile).toEqual({
        city: "Bengaluru",
        role: "developer",
      });
    });

    test("v1.7 unknownFields reject returns nested path", () => {
      const result = perfectPayload(payload, rules, {
        unknownFields: "reject",
      });

      expect(result.valid).toBe(false);
      expect(result.errors?.[0]).toEqual(
        expect.objectContaining({
          path: "profile.role",
          code: "UNKNOWN_FIELD",
        }),
      );
    });
  });
  describe("Unknown Fields - Array elementConstraints", () => {
    const payload = {
      products: [
        { productId: "P100", quantity: 2, internalCode: "A1" },
        { productId: "P200", quantity: 3, internalCode: "B2" },
      ],
    };

    const rules = {
      products: {
        type: "array",
        elementConstraints: {
          type: "object",
          objectAttr: {
            productId: { type: "string" },
            quantity: { type: "number" },
          },
        },
      },
    };

    test("unknownFields strip works inside elementConstraints", () => {
      const result = perfectPayload(payload, rules, {
        unknownFields: "strip",
      });

      expect(result.valid).toBe(true);
      expect(result.validatedPayload?.products).toEqual([
        { productId: "P100", quantity: 2 },
        { productId: "P200", quantity: 3 },
      ]);
    });

    test("unknownFields allow works inside elementConstraints", () => {
      const result = perfectPayload(payload, rules, {
        unknownFields: "allow",
      });

      expect(result.valid).toBe(true);
      expect(result.validatedPayload?.products).toEqual(payload.products);
    });

    test("unknownFields reject preserves indexed paths", () => {
      const result = perfectPayload(payload, rules, {
        unknownFields: "reject",
      });

      expect(result.valid).toBe(false);

      expect(result.errors).toEqual([
        expect.objectContaining({
          path: "products[0].internalCode",
          code: "UNKNOWN_FIELD",
          message: "Unknown field products[0].internalCode is not allowed",
        }),
      ]);
    });
  });
  test("unknownFields rejects unsupported option value", () => {
    expect(() =>
      perfectPayload(
        { name: "Kiran" },
        {
          name: {
            type: "string",
          },
        },
        {
          unknownFields: "invalid",
        },
      ),
    ).toThrow(
      expect.objectContaining({
        name: "TypeError [ERR_INVALID_UNKNOWN_FIELDS]",
        code: "ERR_INVALID_UNKNOWN_FIELDS",
        message: 'unknownFields must be one of "strip", "allow", or "reject"',
      }),
    );
  });
  test("unknownFields reject allows missing optional fields", () => {
    const result = perfectPayload(
      { name: "Kiran" },
      {
        name: { type: "string" },
        nickname: { type: "string" },
      },
      {
        unknownFields: "reject",
      },
    );

    expect(result.valid).toBe(true);
    expect(result.validatedPayload).toEqual({
      name: "Kiran",
    });
  });
  describe("Unknown Fields - Inherited Properties", () => {
    const payload = Object.create({
      inheritedField: "should-not-be-processed",
    });

    payload.name = "Kiran";
    payload.role = "developer";

    const rules = {
      name: {
        type: "string",
      },
    };

    test("v1.7 unknownFields allow ignores inherited properties", () => {
      const result = perfectPayload(payload, rules, {
        unknownFields: "allow",
      });

      expect(result.valid).toBe(true);

      expect(result.validatedPayload).toEqual({
        name: "Kiran",
        role: "developer",
      });

      expect(Object.hasOwn(result.validatedPayload, "inheritedField")).toBe(
        false,
      );
    });

    test("v1.7 unknownFields reject ignores inherited properties", () => {
      const result = perfectPayload(payload, rules, {
        unknownFields: "reject",
      });

      expect(result.valid).toBe(false);
      expect(result.errors).toHaveLength(1);

      expect(result.errors[0]).toEqual(
        expect.objectContaining({
          path: "role",
          code: "UNKNOWN_FIELD",
        }),
      );
    });
  });
  test("v1.7 unknownFields reject returns indexed array path", () => {
    const result = perfectPayload(
      {
        products: [
          {
            name: "iPhone",
            price: 80000,
            internalId: "A001",
          },
        ],
      },
      {
        products: {
          type: "array",
          elementConstraints: {
            type: "object",
            objectAttr: {
              name: { type: "string" },
              price: { type: "number" },
            },
          },
        },
      },
      {
        unknownFields: "reject",
      },
    );

    expect(result.valid).toBe(false);
    expect(result.errors?.[0]).toEqual(
      expect.objectContaining({
        path: "products[0].internalId",
        code: "UNKNOWN_FIELD",
      }),
    );
  });
  test("v1.8 prettyErrors works with unknownFields reject", () => {
    const result = perfectPayload(
      {
        name: "Kiran",
        role: "developer",
      },
      {
        name: {
          type: "string",
        },
      },
      {
        unknownFields: "reject",
        prettyErrors: true,
      },
    );

    expect(result.valid).toBe(false);
    expect(result.errors).toEqual(["Unknown field role is not allowed"]);
  });
  test("v1.7 unknown field inside array includes index in path and message", () => {
    const result = perfectPayload(
      {
        products: [
          {
            productId: "P100",
            quantity: 2,
            internalId: "INT-100",
          },
        ],
      },
      {
        products: {
          mandatory: true,
          type: "array",
          elementConstraints: {
            type: "object",
            objectAttr: {
              productId: {
                mandatory: true,
                type: "string",
              },
              quantity: {
                mandatory: true,
                type: "number",
              },
            },
          },
        },
      },
      {
        unknownFields: "reject",
      },
    );

    expect(result.valid).toBe(false);
    expect(result.errors).toHaveLength(1);

    expect(result.errors[0]).toEqual({
      path: "products[0].internalId",
      code: "UNKNOWN_FIELD",
      message: "Unknown field products[0].internalId is not allowed",
    });
  });
});
