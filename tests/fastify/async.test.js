import { describe, test, expect } from "@jest/globals";
import { validatePayloadAsync } from "../../dist/fastify.js";

describe("Fastify - Asynchronous Hooks", () => {
  test("v1.8 Fastify async attaches validatedPayload", async () => {
    const hook = validatePayloadAsync({
      rule: {
        body: {
          username: {
            type: "string",
            customValidator: async () => true,
          },
        },
      },
    });

    const request = {
      headers: {},
      params: {},
      query: {},
      body: {
        username: "kiran",
      },
    };

    const reply = {
      statusCode: null,
      body: null,

      code(statusCode) {
        this.statusCode = statusCode;
        return this;
      },

      send(body) {
        this.body = body;
        return this;
      },
    };

    const result = await hook(request, reply);

    expect(result).toBeUndefined();

    expect(request.validatedPayload).toEqual({
      body: {
        username: "kiran",
      },
    });

    expect(reply.statusCode).toBeNull();
    expect(reply.body).toBeNull();
  });

  test("v1.8 Fastify async sends validation failure response", async () => {
    const hook = validatePayloadAsync({
      rule: {
        body: {
          username: {
            type: "string",
            customValidator: async () => false,
            customValidatorError: "Username is already taken",
          },
        },
      },
    });

    const request = {
      headers: {},
      params: {},
      query: {},
      body: {
        username: "taken-user",
      },
    };

    const reply = {
      statusCode: null,
      body: null,

      code(statusCode) {
        this.statusCode = statusCode;
        return this;
      },

      send(body) {
        this.body = body;
        return this;
      },
    };

    await hook(request, reply);

    expect(reply.statusCode).toBe(400);
    expect(reply.body?.valid).toBe(false);
    expect(reply.body?.errors).toHaveLength(1);

    expect(reply.body.errors[0]).toEqual(
      expect.objectContaining({
        path: "body.username",
        code: "CUSTOM_VALIDATION_FAILED",
        message: "Username is already taken",
      }),
    );
  });
  test("v1.8 Fastify async propagates thrown errors", async () => {
    const expectedError = new Error("Database unavailable");

    const hook = validatePayloadAsync({
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
    });

    const request = {
      headers: {},
      params: {},
      query: {},
      body: {
        username: "kiran",
      },
    };

    const reply = {
      statusCode: null,
      body: null,

      code(statusCode) {
        this.statusCode = statusCode;
        return this;
      },

      send(body) {
        this.body = body;
        return this;
      },
    };

    // The exact original error instance must propagate.
    await expect(hook(request, reply)).rejects.toBe(expectedError);

    // No HTTP response should be sent.
    expect(reply.statusCode).toBeNull();
    expect(reply.body).toBeNull();
  });
});
