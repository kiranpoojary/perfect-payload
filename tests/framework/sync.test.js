import { describe, test, expect } from "@jest/globals";
import { validateFrameworkSources } from "../../dist/framework.js";

describe("Framework - Synchronous Source Aggregation", () => {
  test("v1.8 framework sync validates body source", () => {
    const result = validateFrameworkSources({
      data: {
        body: {
          name: "Kiran",
          email: "kiran@example.com",
        },
      },
      rule: {
        body: {
          name: {
            mandatory: true,
            type: "string",
          },
          email: {
            mandatory: true,
            type: "email",
          },
        },
      },
    });

    expect(result.valid).toBe(true);

    expect(result.validatedPayload).toEqual({
      body: {
        name: "Kiran",
        email: "kiran@example.com",
      },
    });

    expect(Object.keys(result.validatedPayload)).toHaveLength(1);
  });
});

// ==================================================
// 2. MULTIPLE SOURCES - SUCCESS
// ==================================================

describe("Multiple Sources - Success", () => {
  const result = validateFrameworkSources({
    data: {
      headers: { authorization: "Bearer token" },
      params: { userId: "123" },
      query: { search: "phone" },
      body: { name: "Kiran" },
    },
    rule: {
      body: { name: { type: "string" } },
      query: { search: { type: "string" } },
      params: { userId: { type: "string" } },
      headers: { authorization: { type: "string" } },
    },
  });

  test("v1.8 framework sync validates multiple sources", () => {
    expect(result.valid).toBe(true);
    expect(result.validatedPayload).toEqual({
      headers: { authorization: "Bearer token" },
      params: { userId: "123" },
      query: { search: "phone" },
      body: { name: "Kiran" },
    });
  });

  test("v1.8 framework sync returns validated sources in standard order", () => {
    expect(Object.keys(result.validatedPayload)).toEqual([
      "headers",
      "params",
      "query",
      "body",
    ]);
  });
});

// ==================================================
// 3. MULTIPLE SOURCES - AGGREGATE ERRORS
// ==================================================

describe("Multiple Sources - Error Aggregation", () => {
  const result = validateFrameworkSources({
    data: {
      headers: {},
      params: { userId: 123 },
      query: { page: "invalid" },
      body: { email: "invalid-email" },
    },
    rule: {
      body: {
        email: { mandatory: true, type: "email" },
      },
      query: {
        page: { mandatory: true, type: "number" },
      },
      params: {
        userId: { mandatory: true, type: "string" },
      },
      headers: {
        authorization: { mandatory: true, type: "string" },
      },
    },
  });

  test("v1.8 framework sync aggregates errors from all configured sources", () => {
    expect(result.valid).toBe(false);
    expect(result.errors).toHaveLength(4);
  });

  test("v1.8 framework sync prefixes structured error paths with source", () => {
    expect(result.errors.map((error) => error.path)).toEqual([
      "headers.authorization",
      "params.userId",
      "query.page",
      "body.email",
    ]);
  });

  test("v1.8 framework sync preserves deterministic error order", () => {
    expect(result.errors.map((error) => error.code)).toEqual([
      "REQUIRED",
      "INVALID_TYPE",
      "INVALID_TYPE",
      "INVALID_EMAIL",
    ]);
  });
});

// ==================================================
// 4. MISSING REQUEST SOURCE
// ==================================================

test("v1.8 framework sync treats missing configured source as empty object", () => {
  const result = validateFrameworkSources({
    data: {},
    rule: {
      body: {
        email: {
          mandatory: true,
          type: "email",
        },
      },
    },
  });

  expect(result.valid).toBe(false);
  expect(result.errors).toHaveLength(1);
  expect(result.errors[0]).toEqual(
    expect.objectContaining({
      path: "body.email",
      code: "REQUIRED",
    }),
  );
});

// ==================================================
// 5-7. UNKNOWN FIELDS
// ==================================================

describe("Unknown Fields", () => {
  const data = {
    body: {
      name: "Kiran",
      internalId: "SECRET-123",
    },
  };

  const rule = {
    body: {
      name: { type: "string" },
    },
  };

  test("v1.8 framework sync inherits unknownFields strip", () => {
    const result = validateFrameworkSources({ data, rule });

    expect(result.valid).toBe(true);
    expect(result.validatedPayload.body).toEqual({
      name: "Kiran",
    });
  });

  test("v1.8 framework sync inherits unknownFields allow", () => {
    const result = validateFrameworkSources({
      data,
      rule,
      options: {
        unknownFields: "allow",
      },
    });

    expect(result.valid).toBe(true);
    expect(result.validatedPayload.body).toEqual({
      name: "Kiran",
      internalId: "SECRET-123",
    });
  });

  test("v1.8 framework sync prefixes UNKNOWN_FIELD path", () => {
    const result = validateFrameworkSources({
      data,
      rule,
      options: {
        unknownFields: "reject",
      },
    });

    expect(result.valid).toBe(false);
    expect(result.errors).toHaveLength(1);
    expect(result.errors[0]).toEqual(
      expect.objectContaining({
        path: "body.internalId",
        code: "UNKNOWN_FIELD",
      }),
    );
  });
});

// ==================================================
// 8. PRETTY ERRORS
// ==================================================

test("v1.8 framework sync preserves pretty error strings", () => {
  const result = validateFrameworkSources({
    data: {
      params: { userId: 123 },
      body: { email: "invalid-email" },
    },
    rule: {
      body: {
        email: { type: "email" },
      },
      params: {
        userId: { type: "string" },
      },
    },
    options: {
      prettyErrors: true,
    },
  });

  expect(result.valid).toBe(false);
  expect(result.errors).toEqual([
    "Invalid type for attribute params.userId, required string value",
    "Invalid email format for attribute body.email",
  ]);
});

// ==================================================
// 9. CUSTOM INVALID RESPONSE
// ==================================================

test("v1.8 framework sync preserves custom invalid response", () => {
  const result = validateFrameworkSources({
    data: {
      body: { email: "invalid-email" },
    },
    rule: {
      body: {
        email: { type: "email" },
      },
    },
    options: {
      inValidPayloadResponse: {
        statusCode: 422,
        valid: false,
        message: "Request validation failed",
      },
    },
  });

  expect(result.valid).toBe(false);
  expect(result.statusCode).toBe(422);
  expect(result.message).toBe("Request validation failed");
  expect(result.errors).toHaveLength(1);
});

// ==================================================
// 10. TRANSFORMED VALUES
// ==================================================

test("v1.8 framework sync preserves transformed source values", () => {
  const result = validateFrameworkSources({
    data: {
      query: {
        search: "  HELLO WORLD  ",
      },
      body: {
        email: "  USER@EXAMPLE.COM  ",
      },
    },
    rule: {
      query: {
        search: {
          type: "string",
          trim: true,
          lowercase: true,
        },
      },
      body: {
        email: {
          type: "email",
          trim: true,
          lowercase: true,
        },
      },
    },
  });

  expect(result.valid).toBe(true);
  expect(result.validatedPayload.query.search).toBe("hello world");
  expect(result.validatedPayload.body.email).toBe("user@example.com");
});

// ==================================================
// 11. ORIGINAL SOURCE DATA NOT MUTATED
// ==================================================

test("v1.8 framework sync does not mutate original request source data", () => {
  const originalData = {
    body: {
      email: "  USER@EXAMPLE.COM  ",
    },
  };

  const result = validateFrameworkSources({
    data: originalData,
    rule: {
      body: {
        email: {
          type: "email",
          trim: true,
          lowercase: true,
        },
      },
    },
  });

  expect(result.valid).toBe(true);
  expect(originalData.body.email).toBe("  USER@EXAMPLE.COM  ");
  expect(result.validatedPayload.body.email).toBe("user@example.com");
});

// ==================================================
// 12. CORE CONFIGURATION ERRORS PROPAGATE
// ==================================================

test("v1.8 framework sync propagates core option configuration errors", () => {
  expect(() =>
    validateFrameworkSources({
      data: {
        body: {},
      },
      rule: {
        body: {
          name: { type: "string" },
        },
      },
      options: {
        prettyErrors: "true",
      },
    }),
  ).toThrow(
    expect.objectContaining({
      name: "TypeError [ERR_INVALID_PRETTY_ERRORS]",
      code: "ERR_INVALID_PRETTY_ERRORS",
      message: "prettyErrors must be a boolean",
    }),
  );
});

// ==================================================
// 13. THROWN CUSTOM VALIDATOR ERRORS PROPAGATE
// ==================================================

test("v1.8 framework sync propagates customValidator thrown errors", () => {
  const expectedError = new Error("External validation service failed");

  expect(() =>
    validateFrameworkSources({
      data: {
        body: {
          username: "kiran",
        },
      },
      rule: {
        body: {
          username: {
            type: "string",
            customValidator: () => {
              throw expectedError;
            },
          },
        },
      },
    }),
  ).toThrow(expectedError);
});
