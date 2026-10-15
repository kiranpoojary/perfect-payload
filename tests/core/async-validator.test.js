import { describe, test, expect } from "@jest/globals";
import { perfectPayloadAsync } from "../../dist/index.js";

describe("Core - Async Custom Validator", () => {
  const asyncValidatorRule = {
    username: {
      mandatory: true,
      type: "string",
      trim: true,

      customValidator: async (value) => {
        await new Promise((resolve) => setTimeout(resolve, 10));
        return value !== "admin";
      },

      customValidatorCode: "USERNAME_TAKEN",
      customValidatorError: "Username is already taken",
    },
  };

  test("perfectPayloadAsync supports async customValidator", async () => {
    const result = await perfectPayloadAsync(
      { username: "  kiran  " },
      asyncValidatorRule,
    );

    expect(result.valid).toBe(true);
    expect(result.validatedPayload?.username).toBe("kiran");
  });

  test("perfectPayloadAsync returns structured error for failed async customValidator", async () => {
    const result = await perfectPayloadAsync(
      { username: "  admin  " },
      asyncValidatorRule,
    );

    expect(result.valid).toBe(false);

    expect(result.errors).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          path: "username",
          code: "USERNAME_TAKEN",
          message: "Username is already taken",
        }),
      ]),
    );
  });

  test("perfectPayloadAsync supports synchronous customValidator", async () => {
    const result = await perfectPayloadAsync(
      { username: "kiran" },
      {
        username: {
          type: "string",
          customValidator: (value) => value === "kiran",
        },
      },
    );

    expect(result.valid).toBe(true);
    expect(result.validatedPayload?.username).toBe("kiran");
  });
});

describe("Nested Async Custom Validator - objectAttr", () => {
  const asyncNestedRule = {
    profile: {
      type: "object",
      objectAttr: {
        username: {
          type: "string",
          trim: true,

          customValidator: async (value, payload) => {
            await new Promise((resolve) => setTimeout(resolve, 10));
            return value !== payload.reservedUsername;
          },

          customValidatorCode: "USERNAME_RESERVED",
          customValidatorError: "Username is reserved",
        },

        reservedUsername: {
          type: "string",
        },
      },
    },
  };

  test("perfectPayloadAsync supports async customValidator inside objectAttr", async () => {
    const result = await perfectPayloadAsync(
      {
        profile: {
          username: "  kiran  ",
          reservedUsername: "admin",
        },
      },
      asyncNestedRule,
    );

    expect(result.valid).toBe(true);
    expect(result.validatedPayload?.profile?.username).toBe("kiran");
  });

  test("perfectPayloadAsync returns structured error for async customValidator inside objectAttr", async () => {
    const result = await perfectPayloadAsync(
      {
        profile: {
          username: "admin",
          reservedUsername: "admin",
        },
      },
      asyncNestedRule,
    );

    expect(result.valid).toBe(false);
    expect(result.errors).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          path: "profile.username",
          code: "USERNAME_RESERVED",
          message: "Username is reserved",
        }),
      ]),
    );
  });

  test("nested async customValidator receives current nested payload", async () => {
    let receivedPayload;

    await perfectPayloadAsync(
      {
        profile: {
          username: "admin",
          reservedUsername: "admin",
        },
      },
      {
        profile: {
          type: "object",
          objectAttr: {
            username: {
              type: "string",
              customValidator: async (_value, payload) => {
                receivedPayload = payload;
                return true;
              },
            },
            reservedUsername: { type: "string" },
          },
        },
      },
    );

    expect(receivedPayload).toEqual({
      username: "admin",
      reservedUsername: "admin",
    });
  });
});
describe("Async Custom Validator - elementConstraints", () => {
  const rules = {
    marks: {
      type: "array",
      elementConstraints: {
        type: "number",
        customValidator: async (value) => value % 2 === 0,
        customValidatorCode: "NOT_EVEN",
        customValidatorError: "Array value must be even",
      },
    },
  };

  test("perfectPayloadAsync supports async customValidator inside elementConstraints", async () => {
    const result = await perfectPayloadAsync({ marks: [2, 4, 6] }, rules);

    expect(result.valid).toBe(true);
    expect(result.validatedPayload?.marks).toEqual([2, 4, 6]);
  });

  test("perfectPayloadAsync returns indexed error for async customValidator inside elementConstraints", async () => {
    const result = await perfectPayloadAsync({ marks: [2, 3, 4] }, rules);

    expect(result.valid).toBe(false);
    expect(result.errors).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          path: "marks[1]",
          code: "NOT_EVEN",
          message: "Array value must be even",
        }),
      ]),
    );
  });

  test("perfectPayloadAsync preserves indexes for multiple async array validation failures", async () => {
    const result = await perfectPayloadAsync({ marks: [1, 2, 3, 4, 5] }, rules);

    expect(result.valid).toBe(false);

    expect(result.errors).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          path: "marks[0]",
          code: "NOT_EVEN",
        }),
        expect.objectContaining({
          path: "marks[2]",
          code: "NOT_EVEN",
        }),
        expect.objectContaining({
          path: "marks[4]",
          code: "NOT_EVEN",
        }),
      ]),
    );
  });
});

describe("Deep Nested Async Validation", () => {
  test("perfectPayloadAsync supports deep array-object-object async validation", async () => {
    const rules = {
      products: {
        type: "array",
        elementConstraints: {
          type: "object",
          objectAttr: {
            seller: {
              type: "object",
              objectAttr: {
                username: {
                  type: "string",
                  trim: true,
                  customValidator: async (value) => {
                    await new Promise((resolve) => setTimeout(resolve, 10));
                    return value !== "admin";
                  },
                  customValidatorCode: "USERNAME_TAKEN",
                  customValidatorError: "Username is already taken",
                },
              },
            },
          },
        },
      },
    };

    const result = await perfectPayloadAsync(
      {
        products: [
          { seller: { username: "  kiran  " } },
          { seller: { username: "  admin  " } },
        ],
      },
      rules,
    );

    expect(result.valid).toBe(false);
    expect(result.errors).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          path: "products[1].seller.username",
          code: "USERNAME_TAKEN",
          message: "Username is already taken",
        }),
      ]),
    );
  });

  test("perfectPayloadAsync preserves paths through deep mixed object-array nesting", async () => {
    const rules = {
      profile: {
        type: "object",
        objectAttr: {
          teams: {
            type: "array",
            elementConstraints: {
              type: "object",
              objectAttr: {
                members: {
                  type: "array",
                  elementConstraints: {
                    type: "object",
                    objectAttr: {
                      username: {
                        type: "string",
                        trim: true,
                        customValidator: async (value) => {
                          await new Promise((resolve) =>
                            setTimeout(resolve, 10),
                          );
                          return value !== "admin";
                        },
                        customValidatorCode: "USERNAME_TAKEN",
                        customValidatorError: "Username is already taken",
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
    };

    const result = await perfectPayloadAsync(
      {
        profile: {
          teams: [
            { members: [{ username: "  kiran  " }] },
            {
              members: [{ username: "  sam  " }, { username: "  admin  " }],
            },
          ],
        },
      },
      rules,
    );

    expect(result.valid).toBe(false);
    expect(result.errors).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          path: "profile.teams[1].members[1].username",
          code: "USERNAME_TAKEN",
          message: "Username is already taken",
        }),
      ]),
    );
  });
});
describe("Async Validator - Error Messages", () => {
  test("perfectPayloadAsync default customValidator error uses final indexed path", async () => {
    const result = await perfectPayloadAsync(
      {
        products: [{ username: "kiran" }, { username: "admin" }],
      },
      {
        products: {
          type: "array",
          elementConstraints: {
            type: "object",
            objectAttr: {
              username: {
                type: "string",
                customValidator: async (value) => value !== "admin",
              },
            },
          },
        },
      },
    );

    expect(result.valid).toBe(false);
    expect(result.errors).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          path: "products[1].username",
          code: "CUSTOM_VALIDATION_FAILED",
          message:
            "Custom validation failed for attribute products[1].username",
        }),
      ]),
    );
  });

  test("perfectPayloadAsync preserves custom validator code and message with indexed path", async () => {
    const result = await perfectPayloadAsync(
      {
        products: [{ username: "kiran" }, { username: "admin" }],
      },
      {
        products: {
          type: "array",
          elementConstraints: {
            type: "object",
            objectAttr: {
              username: {
                type: "string",
                customValidator: async (value) => value !== "admin",
                customValidatorCode: "USERNAME_RESTRICTED",
                customValidatorError: "Username is restricted",
              },
            },
          },
        },
      },
    );

    expect(result.valid).toBe(false);
    expect(result.errors).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          path: "products[1].username",
          code: "USERNAME_RESTRICTED",
          message: "Username is restricted",
        }),
      ]),
    );
  });

  test("perfectPayloadAsync propagates customValidator exceptions", async () => {
    await expect(
      perfectPayloadAsync(
        { username: "kiran" },
        {
          username: {
            type: "string",
            customValidator: async () => {
              throw new Error("CUSTOM_VALIDATOR_ERROR");
            },
          },
        },
      ),
    ).rejects.toThrow("CUSTOM_VALIDATOR_ERROR");
  });
  test("perfectPayloadAsync rejects non-function customValidator", async () => {
    await expect(
      perfectPayloadAsync(
        { username: "kiran" },
        {
          username: {
            type: "string",
            customValidator: "not-a-function",
          },
        },
      ),
    ).rejects.toMatchObject({
      name: "TypeError [ERR_INVALID_CUSTOM_VALIDATOR]",
      code: "ERR_INVALID_CUSTOM_VALIDATOR",
      message: 'customValidator must be a function for attribute "username"',
    });
  });
  test("perfectPayloadAsync skips async validation when synchronous validation fails", async () => {
    let asyncValidatorExecuted = false;

    const result = await perfectPayloadAsync(
      { username: 123 },
      {
        username: {
          type: "string",
          customValidator: async () => {
            asyncValidatorExecuted = true;
            return true;
          },
        },
      },
    );

    expect(result.valid).toBe(false);

    expect(result.errors).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          path: "username",
          code: "INVALID_TYPE",
        }),
      ]),
    );

    expect(asyncValidatorExecuted).toBe(false);
  });
});

describe("Async Validator - Unknown Fields", () => {
  test("v1.7 async unknownFields allow preserves unknown fields", async () => {
    const result = await perfectPayloadAsync(
      { username: "kiran", role: "developer" },
      {
        username: {
          type: "string",
          customValidator: async () => true,
        },
      },
      { unknownFields: "allow" },
    );

    expect(result.valid).toBe(true);
    expect(result.validatedPayload?.username).toBe("kiran");
    expect(result.validatedPayload?.role).toBe("developer");
  });

  test("v1.7 async unknownFields reject returns structured error", async () => {
    const result = await perfectPayloadAsync(
      { username: "kiran", role: "developer" },
      {
        username: {
          type: "string",
          customValidator: async () => true,
        },
      },
      { unknownFields: "reject" },
    );

    expect(result.valid).toBe(false);
    expect(result.errors?.[0]).toEqual(
      expect.objectContaining({
        path: "role",
        code: "UNKNOWN_FIELD",
      }),
    );
  });

  test("v1.7 async validator does not run when unknownFields reject fails sync phase", async () => {
    let validatorCalled = false;

    await perfectPayloadAsync(
      { username: "kiran", role: "developer" },
      {
        username: {
          type: "string",
          customValidator: async () => {
            validatorCalled = true;
            return true;
          },
        },
      },
      { unknownFields: "reject" },
    );

    expect(validatorCalled).toBe(false);
  });
});
describe("Async Validator - Custom Responses", () => {
  const rules = {
    username: {
      mandatory: true,
      type: "string",
      trim: true,
      lowercase: true,
      customValidator: async (value) => {
        await new Promise((resolve) => setTimeout(resolve, 10));
        return value !== "blocked";
      },
    },
    profile: {
      mandatory: true,
      type: "object",
      objectAttr: {
        city: {
          mandatory: true,
          type: "string",
        },
      },
    },
  };

  const options = {
    unknownFields: "allow",
    validPayloadResponse: {
      statusCode: 201,
      valid: true,
      message: "Async validation successful",
    },
    inValidPayloadResponse: {
      statusCode: 422,
      valid: false,
      message: "Async validation failed",
    },
  };

  test("v1.7 async three argument API uses options and custom valid response", async () => {
    const result = await perfectPayloadAsync(
      {
        username: "  KIRAN  ",
        role: "developer",
        profile: {
          city: "Bengaluru",
          internalCode: "BLR-01",
        },
      },
      rules,
      options,
    );

    expect(result.statusCode).toBe(201);
    expect(result.valid).toBe(true);
    expect(result.message).toBe("Async validation successful");

    expect(result.validatedPayload).toEqual({
      username: "kiran",
      role: "developer",
      profile: {
        city: "Bengaluru",
        internalCode: "BLR-01",
      },
    });
  });

  test("v1.7 async three argument API uses custom invalid response", async () => {
    const result = await perfectPayloadAsync(
      {
        username: "blocked",
        role: "developer",
        profile: {
          city: "Bengaluru",
        },
      },
      rules,
      options,
    );

    expect(result.statusCode).toBe(422);
    expect(result.valid).toBe(false);
    expect(result.message).toBe("Async validation failed");
    expect(result.errors).toHaveLength(1);
    expect(result.errors[0]).toEqual(
      expect.objectContaining({
        path: "username",
        code: "CUSTOM_VALIDATION_FAILED",
      }),
    );
  });
});
describe("Async Validator - Pretty Errors", () => {
  test("v1.8 prettyErrors async formats synchronous validation errors", async () => {
    const result = await perfectPayloadAsync(
      { username: 123 },
      {
        username: {
          type: "string",
        },
      },
      { prettyErrors: true },
    );

    expect(result.valid).toBe(false);
    expect(Array.isArray(result.errors)).toBe(true);
    expect(result.errors).toEqual([
      "Invalid type for attribute username, required string value",
    ]);
  });

  test("v1.8 prettyErrors async formats async customValidator errors", async () => {
    const result = await perfectPayloadAsync(
      { username: "admin" },
      {
        username: {
          type: "string",
          customValidator: async () => false,
          customValidatorError: "Username is not allowed",
        },
      },
      { prettyErrors: true },
    );

    expect(result.valid).toBe(false);
    expect(result.errors).toEqual(["Username is not allowed"]);
  });

  test("v1.8 prettyErrors async defaults to structured errors", async () => {
    const result = await perfectPayloadAsync(
      { username: 123 },
      {
        username: {
          type: "string",
        },
      },
    );

    expect(result.valid).toBe(false);
    expect(result.errors).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          path: "username",
          code: "INVALID_TYPE",
        }),
      ]),
    );
  });

  test("v1.8 prettyErrors async rejects non-boolean option", async () => {
    await expect(
      perfectPayloadAsync(
        { username: "kiran" },
        {
          username: {
            type: "string",
          },
        },
        {
          prettyErrors: "true",
        },
      ),
    ).rejects.toMatchObject({
      name: "TypeError [ERR_INVALID_PRETTY_ERRORS]",
      code: "ERR_INVALID_PRETTY_ERRORS",
      message: "prettyErrors must be a boolean",
    });
  });
});
