import { describe, test, expect } from "@jest/globals";
import { validateFrameworkSourcesAsync } from "../../dist/framework.js";

describe("Framework - Asynchronous Source Aggregation", () => {
  test("v1.8 framework async validates body source", async () => {
    const result = await validateFrameworkSourcesAsync({
      data: {
        body: { username: "kiran" },
      },
      rule: {
        body: {
          username: {
            mandatory: true,
            type: "string",
            customValidator: async () => true,
          },
        },
      },
    });

    expect(result.valid).toBe(true);
    expect(result.validatedPayload).toEqual({
      body: { username: "kiran" },
    });
  });

  test("v1.8 framework async completion order does not affect error order", async () => {
    const makeRule = (delay, message) => ({
      value: {
        type: "string",
        customValidator: async () => {
          await new Promise((resolve) => setTimeout(resolve, delay));
          return false;
        },
        customValidatorError: message,
      },
    });

    const result = await validateFrameworkSourcesAsync({
      data: {
        headers: { value: "header" },
        params: { value: "param" },
        query: { value: "query" },
        body: { value: "body" },
      },
      rule: {
        headers: makeRule(80, "Header failure"),
        params: makeRule(60, "Params failure"),
        query: makeRule(40, "Query failure"),
        body: makeRule(20, "Body failure"),
      },
    });

    expect(result.errors.map((error) => error.message)).toEqual([
      "Header failure",
      "Params failure",
      "Query failure",
      "Body failure",
    ]);
  });

  test("v1.8 framework async executes request sources concurrently", async () => {
    const makeRule = () => ({
      value: {
        type: "string",
        customValidator: async () => {
          await new Promise((resolve) => setTimeout(resolve, 100));
          return true;
        },
      },
    });

    const startedAt = Date.now();

    const result = await validateFrameworkSourcesAsync({
      data: {
        headers: { value: "header" },
        params: { value: "param" },
        query: { value: "query" },
        body: { value: "body" },
      },
      rule: {
        headers: makeRule(),
        params: makeRule(),
        query: makeRule(),
        body: makeRule(),
      },
    });

    const duration = Date.now() - startedAt;

    expect(result.valid).toBe(true);
    expect(duration).toBeLessThan(300);
  });

  test("v1.8 framework async preserves core sync-first validation", async () => {
    const result = await validateFrameworkSourcesAsync({
      data: {
        body: { email: "invalid-email" },
      },
      rule: {
        body: {
          email: {
            type: "email",
            customValidator: async () => true,
          },
        },
      },
    });

    expect(result.valid).toBe(false);
    expect(result.errors).toHaveLength(1);
    expect(result.errors[0]).toEqual(
      expect.objectContaining({
        path: "body.email",
        code: "INVALID_EMAIL",
      }),
    );
  });

  test("v1.8 framework async treats missing source as empty object", async () => {
    const result = await validateFrameworkSourcesAsync({
      data: {},
      rule: {
        body: {
          username: {
            mandatory: true,
            type: "string",
            customValidator: async () => true,
          },
        },
      },
    });

    expect(result.valid).toBe(false);
    expect(result.errors).toHaveLength(1);
    expect(result.errors[0]).toEqual(
      expect.objectContaining({
        path: "body.username",
        code: "REQUIRED",
      }),
    );
  });

  test("v1.8 framework async preserves pretty error strings", async () => {
    const result = await validateFrameworkSourcesAsync({
      data: {
        params: { userId: "123" },
        body: { username: "taken-user" },
      },
      rule: {
        body: {
          username: {
            type: "string",
            customValidator: async () => false,
            customValidatorError: "Username is already taken",
          },
        },
        params: {
          userId: {
            type: "string",
            customValidator: async () => false,
            customValidatorError: "User does not exist",
          },
        },
      },
      options: {
        prettyErrors: true,
      },
    });

    expect(result.valid).toBe(false);
    expect(result.errors).toEqual([
      "User does not exist",
      "Username is already taken",
    ]);
  });

  test("v1.8 framework async preserves custom invalid response", async () => {
    const result = await validateFrameworkSourcesAsync({
      data: {
        body: { username: "taken-user" },
      },
      rule: {
        body: {
          username: {
            type: "string",
            customValidator: async () => false,
          },
        },
      },
      options: {
        inValidPayloadResponse: {
          statusCode: 422,
          valid: false,
          message: "Async request validation failed",
        },
      },
    });

    expect(result.valid).toBe(false);
    expect(result.statusCode).toBe(422);
    expect(result.message).toBe("Async request validation failed");
    expect(result.errors).toHaveLength(1);
  });

  test("v1.8 framework async preserves transformed values", async () => {
    const result = await validateFrameworkSourcesAsync({
      data: {
        body: { username: "  KIRAN  " },
      },
      rule: {
        body: {
          username: {
            type: "string",
            trim: true,
            lowercase: true,
            customValidator: async (value) => value === "kiran",
          },
        },
      },
    });

    expect(result.valid).toBe(true);
    expect(result.validatedPayload.body.username).toBe("kiran");
  });

  test("v1.8 framework async does not mutate original source data", async () => {
    const originalData = {
      body: { username: "  KIRAN  " },
    };

    const result = await validateFrameworkSourcesAsync({
      data: originalData,
      rule: {
        body: {
          username: {
            type: "string",
            trim: true,
            lowercase: true,
            customValidator: async () => true,
          },
        },
      },
    });

    expect(result.valid).toBe(true);
    expect(originalData.body.username).toBe("  KIRAN  ");
    expect(result.validatedPayload.body.username).toBe("kiran");
  });

  test("v1.8 framework async propagates customValidator thrown errors", async () => {
    const expectedError = new Error("Database unavailable");

    await expect(
      validateFrameworkSourcesAsync({
        data: {
          body: { username: "kiran" },
        },
        rule: {
          body: {
            username: {
              type: "string",
              customValidator: async () => {
                throw expectedError;
              },
            },
          },
        },
      }),
    ).rejects.toBe(expectedError);
  });

  test("v1.8 framework async propagates core option configuration errors", async () => {
    await expect(
      validateFrameworkSourcesAsync({
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
    ).rejects.toMatchObject({
      name: "TypeError [ERR_INVALID_PRETTY_ERRORS]",
      code: "ERR_INVALID_PRETTY_ERRORS",
      message: "prettyErrors must be a boolean",
    });
  });
});

describe("Multiple Sources - Success", () => {
  const config = {
    data: {
      headers: { authorization: "Bearer token" },
      params: { userId: "123" },
      query: { search: "phone" },
      body: { username: "kiran" },
    },
    rule: {
      body: {
        username: {
          type: "string",
          customValidator: async () => true,
        },
      },
      query: {
        search: {
          type: "string",
          customValidator: async () => true,
        },
      },
      params: {
        userId: {
          type: "string",
          customValidator: async () => true,
        },
      },
      headers: {
        authorization: {
          type: "string",
          customValidator: async () => true,
        },
      },
    },
  };

  test("v1.8 framework async validates multiple sources", async () => {
    const result = await validateFrameworkSourcesAsync(config);

    expect(result.valid).toBe(true);
    expect(result.validatedPayload).toEqual(config.data);
  });

  test("v1.8 framework async returns sources in standard order", async () => {
    const result = await validateFrameworkSourcesAsync(config);

    expect(Object.keys(result.validatedPayload)).toEqual([
      "headers",
      "params",
      "query",
      "body",
    ]);
  });
});

describe("Multiple Sources - Error Aggregation", () => {
  const config = {
    data: {
      headers: { authorization: "invalid-token" },
      params: { userId: "123" },
      query: { search: "phone" },
      body: { username: "taken-user" },
    },
    rule: {
      body: {
        username: {
          type: "string",
          customValidator: async () => false,
          customValidatorError: "Username is already taken",
        },
      },
      query: {
        search: {
          type: "string",
          customValidator: async () => false,
          customValidatorError: "Search is not allowed",
        },
      },
      params: {
        userId: {
          type: "string",
          customValidator: async () => false,
          customValidatorError: "User does not exist",
        },
      },
      headers: {
        authorization: {
          type: "string",
          customValidator: async () => false,
          customValidatorError: "Authorization failed",
        },
      },
    },
  };

  test("v1.8 framework async aggregates errors from all sources", async () => {
    const result = await validateFrameworkSourcesAsync(config);

    expect(result.valid).toBe(false);
    expect(result.errors).toHaveLength(4);
  });

  test("v1.8 framework async prefixes structured error paths", async () => {
    const result = await validateFrameworkSourcesAsync(config);

    expect(result.errors.map((error) => error.path)).toEqual([
      "headers.authorization",
      "params.userId",
      "query.search",
      "body.username",
    ]);
  });

  test("v1.8 framework async preserves deterministic error order", async () => {
    const result = await validateFrameworkSourcesAsync(config);

    expect(result.errors.map((error) => error.message)).toEqual([
      "Authorization failed",
      "User does not exist",
      "Search is not allowed",
      "Username is already taken",
    ]);
  });
});
