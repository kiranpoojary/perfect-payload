import { describe, test, expect } from "@jest/globals";
import { validatePayload } from "../../dist/fastify.js";

describe("Fastify - Synchronous Hooks", () => {
  test("v1.8 Fastify sync attaches validatedPayload", async () => {
    const hook = validatePayload({
      rule: {
        body: {
          email: {
            mandatory: true,
            type: "email",
          },
        },
      },
    });

    const request = {
      headers: {},
      params: {},
      query: {},
      body: {
        email: "user@example.com",
      },
    };

    const reply = {
      statusCode: null,
      body: null,

      code(code) {
        this.statusCode = code;
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
        email: "user@example.com",
      },
    });

    expect(reply.statusCode).toBeNull();
    expect(reply.body).toBeNull();
  });
  test("v1.8 Fastify sync attaches configured sources in standard order", async () => {
    const hook = validatePayload({
      rule: {
        body: {
          name: { type: "string" },
        },
        query: {
          search: { type: "string" },
        },
        params: {
          userId: { type: "string" },
        },
        headers: {
          authorization: { type: "string" },
        },
      },
    });

    const request = {
      headers: {
        authorization: "Bearer token",
      },
      params: {
        userId: "123",
      },
      query: {
        search: "phone",
      },
      body: {
        name: "Kiran",
      },
    };

    const reply = {
      statusCode: null,
      body: null,

      code(code) {
        this.statusCode = code;
        return this;
      },

      send(body) {
        this.body = body;
        return this;
      },
    };

    const result = await hook(request, reply);

    expect(result).toBeUndefined();

    expect(Object.keys(request.validatedPayload)).toEqual([
      "headers",
      "params",
      "query",
      "body",
    ]);

    expect(request.validatedPayload).toEqual({
      headers: {
        authorization: "Bearer token",
      },
      params: {
        userId: "123",
      },
      query: {
        search: "phone",
      },
      body: {
        name: "Kiran",
      },
    });

    expect(reply.statusCode).toBeNull();
    expect(reply.body).toBeNull();
  });

  test("v1.8 Fastify sync sends 400 validation response", async () => {
    const hook = validatePayload({
      rule: {
        body: {
          email: {
            mandatory: true,
            type: "email",
          },
        },
      },
    });

    const request = {
      headers: {},
      params: {},
      query: {},
      body: {
        email: "invalid-email",
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
        path: "body.email",
        code: "INVALID_EMAIL",
      }),
    );
  });
  test("v1.8 Fastify sync uses custom invalid response status", async () => {
    const hook = validatePayload({
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

    const request = {
      headers: {},
      params: {},
      query: {},
      body: {
        email: "invalid-email",
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

    expect(reply.statusCode).toBe(422);
    expect(reply.body?.statusCode).toBe(422);
    expect(reply.body?.valid).toBe(false);
    expect(reply.body?.message).toBe("Request validation failed");
  });

  test("v1.8 Fastify sync supports prettyErrors", async () => {
    const hook = validatePayload({
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

    const request = {
      headers: {},
      params: {},
      query: {},
      body: {
        email: "invalid-email",
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

    expect(reply.body?.errors).toEqual([
      "Invalid email format for attribute body.email",
    ]);
  });

  test("v1.8 Fastify sync does not mutate original request body", async () => {
    const hook = validatePayload({
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

    const request = {
      headers: {},
      params: {},
      query: {},
      body: {
        email: "  USER@EXAMPLE.COM  ",
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

    // Original request remains unchanged.
    expect(request.body.email).toBe("  USER@EXAMPLE.COM  ");

    // Validated payload contains the transformed value.
    expect(request.validatedPayload?.body?.email).toBe("user@example.com");

    // Successful validation does not send a response.
    expect(reply.statusCode).toBeNull();
    expect(reply.body).toBeNull();
  });

  test("v1.8 Fastify sync propagates thrown errors", async () => {
    const expectedError = new Error("External service failed");

    const hook = validatePayload({
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

    // Verify the exact original error instance propagates.
    await expect(hook(request, reply)).rejects.toBe(expectedError);

    // No validation response should be sent.
    expect(reply.statusCode).toBeNull();
    expect(reply.body).toBeNull();
  });

  test("v1.8 Fastify validates configuration during hook creation", () => {
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
  test("v1.8 Fastify treats missing configured source as empty object", async () => {
    const hook = validatePayload({
      rule: {
        body: {
          email: {
            mandatory: true,
            type: "email",
          },
        },
      },
    });

    // Intentionally omit request.body.
    const request = {
      headers: {},
      params: {},
      query: {},
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
    expect(reply.body?.errors?.[0]).toEqual(
      expect.objectContaining({
        path: "body.email",
        code: "REQUIRED",
      }),
    );
  });
});
