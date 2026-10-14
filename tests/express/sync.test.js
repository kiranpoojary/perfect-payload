import { describe, test, expect, jest } from "@jest/globals";
import { validatePayload } from "../../dist/express.js";

describe("Express - Synchronous Middleware", () => {
  test("v1.8 Express sync attaches validatedPayload and calls next", () => {
    const middleware = validatePayload({
      rule: {
        body: {
          email: {
            mandatory: true,
            type: "email",
          },
        },
      },
    });

    const req = {
      headers: {},
      params: {},
      query: {},
      body: {
        email: "user@example.com",
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

    middleware(req, res, next);

    expect(next).toHaveBeenCalledTimes(1);

    expect(req.validatedPayload).toEqual({
      body: {
        email: "user@example.com",
      },
    });

    expect(res.statusCode).toBeNull();
    expect(res.body).toBeNull();
  });

  test("v1.8 Express sync attaches configured sources in standard order", () => {
    const middleware = validatePayload({
      rule: {
        body: {
          name: {
            type: "string",
          },
        },
        params: {
          userId: {
            type: "string",
          },
        },
        headers: {
          authorization: {
            type: "string",
          },
        },
      },
    });

    const req = {
      headers: {
        authorization: "Bearer token",
      },
      params: {
        userId: "123",
      },
      query: {
        ignored: "not-configured",
      },
      body: {
        name: "Kiran",
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

    middleware(req, res, next);

    expect(next).toHaveBeenCalledTimes(1);

    expect(Object.keys(req.validatedPayload)).toEqual([
      "headers",
      "params",
      "body",
    ]);

    expect(req.validatedPayload).toEqual({
      headers: {
        authorization: "Bearer token",
      },
      params: {
        userId: "123",
      },
      body: {
        name: "Kiran",
      },
    });

    expect(req.validatedPayload.query).toBeUndefined();

    expect(res.statusCode).toBeNull();
    expect(res.body).toBeNull();
  });

  test("v1.8 Express sync sends 400 validation response", () => {
    const middleware = validatePayload({
      rule: {
        body: {
          email: {
            mandatory: true,
            type: "email",
          },
        },
      },
    });

    const req = {
      headers: {},
      params: {},
      query: {},
      body: {
        email: "invalid-email",
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

    middleware(req, res, next);

    expect(next).not.toHaveBeenCalled();
    expect(res.statusCode).toBe(400);
    expect(res.body?.valid).toBe(false);
    expect(res.body?.errors).toHaveLength(1);

    expect(res.body.errors[0]).toEqual(
      expect.objectContaining({
        path: "body.email",
        code: "INVALID_EMAIL",
      }),
    );
  });

  test("v1.8 Express sync uses custom invalid response status", () => {
    const middleware = validatePayload({
      rule: {
        body: {
          email: {
            type: "email",
          },
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

    const req = {
      headers: {},
      params: {},
      query: {},
      body: {
        email: "invalid-email",
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

    middleware(req, res, next);

    expect(next).not.toHaveBeenCalled();
    expect(res.statusCode).toBe(422);
    expect(res.body?.statusCode).toBe(422);
    expect(res.body?.valid).toBe(false);
    expect(res.body?.message).toBe("Request validation failed");
  });

  test("v1.8 Express sync supports prettyErrors", () => {
    const middleware = validatePayload({
      rule: {
        body: {
          email: {
            type: "email",
          },
        },
      },
      options: {
        prettyErrors: true,
      },
    });

    const req = {
      headers: {},
      params: {},
      query: {},
      body: {
        email: "invalid-email",
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

    middleware(req, res, next);

    expect(next).not.toHaveBeenCalled();
    expect(res.statusCode).toBe(400);

    expect(res.body?.errors).toEqual([
      "Invalid email format for attribute body.email",
    ]);
  });

  test("v1.8 Express sync does not mutate original request body", () => {
    const middleware = validatePayload({
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

    const req = {
      headers: {},
      params: {},
      query: {},
      body: {
        email: "  USER@EXAMPLE.COM  ",
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

    middleware(req, res, next);

    expect(next).toHaveBeenCalledTimes(1);

    // Original request body remains unchanged
    expect(req.body.email).toBe("  USER@EXAMPLE.COM  ");

    // Validated payload contains the transformed value
    expect(req.validatedPayload?.body?.email).toBe("user@example.com");

    expect(res.statusCode).toBeNull();
    expect(res.body).toBeNull();
  });

  test("v1.8 Express sync forwards thrown errors to next", () => {
    const expectedError = new Error("External service failed");

    const middleware = validatePayload({
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

    middleware(req, res, next);

    expect(next).toHaveBeenCalledTimes(1);
    expect(next).toHaveBeenCalledWith(expectedError);

    // Must forward the exact original error instance
    expect(next.mock.calls[0][0]).toBe(expectedError);

    // No HTTP response should be sent
    expect(res.statusCode).toBeNull();
    expect(res.body).toBeNull();
  });

  test("v1.8 Express validates configuration during middleware creation", () => {
    expect(() =>
      validatePayload({
        rule: {
          cookies: {
            sessionId: {
              type: "string",
            },
          },
        },
      }),
    ).toThrow(
      expect.objectContaining({
        name: "TypeError [ERR_UNSUPPORTED_REQUEST_SOURCE]",
        code: "ERR_UNSUPPORTED_REQUEST_SOURCE",
        message: 'Unsupported request source "cookies"',
      }),
    );
  });

  test("v1.8 Express treats missing configured source as empty object", () => {
    const middleware = validatePayload({
      rule: {
        body: {
          email: {
            mandatory: true,
            type: "email",
          },
        },
      },
    });

    // Intentionally omit req.body.
    const req = {
      headers: {},
      params: {},
      query: {},
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

    middleware(req, res, next);

    expect(next).not.toHaveBeenCalled();
    expect(res.statusCode).toBe(400);

    expect(res.body?.errors?.[0]).toEqual(
      expect.objectContaining({
        path: "body.email",
        code: "REQUIRED",
      }),
    );
  });
});
