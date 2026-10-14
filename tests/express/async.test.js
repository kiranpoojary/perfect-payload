import { describe, test, expect, jest } from "@jest/globals";
import { validatePayloadAsync } from "../../dist/express.js";

describe("Express - Asynchronous Middleware", () => {
  test("v1.8 Express async attaches validatedPayload and calls next", async () => {
    const middleware = validatePayloadAsync({
      rule: {
        body: {
          username: {
            type: "string",
            customValidator: async () => true,
          },
        },
      },
    });

    const req = {
      headers: {},
      params: {},
      query: {},
      body: {
        username: "kiran",
      },
    };

    const res = {
      statusCode: null,
      body: null,

      status(code) {
        this.statusCode = code;
        return this;
      },

      json(body) {
        this.body = body;
        return this;
      },
    };

    const next = jest.fn();

    await middleware(req, res, next);

    expect(next).toHaveBeenCalledTimes(1);
    expect(next).toHaveBeenCalledWith();

    expect(req.validatedPayload).toEqual({
      body: {
        username: "kiran",
      },
    });

    expect(res.statusCode).toBeNull();
    expect(res.body).toBeNull();
  });

  test("v1.8 Express async sends validation failure response", async () => {
    const middleware = validatePayloadAsync({
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

    const req = {
      headers: {},
      params: {},
      query: {},
      body: {
        username: "taken-user",
      },
    };

    const res = {
      statusCode: null,
      body: null,

      status(code) {
        this.statusCode = code;
        return this;
      },

      json(body) {
        this.body = body;
        return this;
      },
    };

    const next = jest.fn();

    await middleware(req, res, next);

    expect(next).not.toHaveBeenCalled();
    expect(res.statusCode).toBe(400);
    expect(res.body?.valid).toBe(false);
    expect(res.body?.errors).toHaveLength(1);

    expect(res.body.errors[0]).toEqual(
      expect.objectContaining({
        path: "body.username",
        code: "CUSTOM_VALIDATION_FAILED",
        message: "Username is already taken",
      }),
    );
  });

  test("v1.8 Express async forwards thrown errors to next", async () => {
    const expectedError = new Error("Database unavailable");

    const middleware = validatePayloadAsync({
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

    const req = {
      headers: {},
      params: {},
      query: {},
      body: {
        username: "kiran",
      },
    };

    const res = {
      statusCode: null,
      body: null,

      status(code) {
        this.statusCode = code;
        return this;
      },

      json(body) {
        this.body = body;
        return this;
      },
    };

    const next = jest.fn();

    await middleware(req, res, next);

    expect(next).toHaveBeenCalledTimes(1);
    expect(next).toHaveBeenCalledWith(expectedError);

    // The exact original error instance must be forwarded.
    expect(next.mock.calls[0][0]).toBe(expectedError);

    // No HTTP response should be sent.
    expect(res.statusCode).toBeNull();
    expect(res.body).toBeNull();
  });
});
