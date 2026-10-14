import { describe, test, expect } from "@jest/globals";
import { validateFrameworkConfig } from "../../dist/framework.js";

describe("Framework - Configuration Validation", () => {
  test("v1.8 framework config supports body source", () => {
    const sources = validateFrameworkConfig({
      rule: {
        body: {
          email: {
            type: "email",
          },
        },
      },
    });

    expect(sources).toEqual(["body"]);
  });

  test("v1.8 framework config returns sources in standard order", () => {
    const sources = validateFrameworkConfig({
      rule: {
        body: {
          name: { type: "string" },
        },
        query: {
          page: { type: "number" },
        },
        headers: {
          authorization: { type: "string" },
        },
        params: {
          userId: { type: "string" },
        },
      },
    });

    expect(sources).toEqual(["headers", "params", "query", "body"]);
  });

  test("v1.8 framework config preserves standard order for partial sources", () => {
    const sources = validateFrameworkConfig({
      rule: {
        body: {
          name: { type: "string" },
        },
        headers: {
          authorization: { type: "string" },
        },
      },
    });

    expect(sources).toEqual(["headers", "body"]);
  });

  describe("Invalid Framework Rules", () => {
    test.each([
      ["missing rule", undefined],
      ["null rule", null],
      ["array rule", []],
    ])("v1.8 framework config rejects %s", (_scenario, rule) => {
      expect(() => validateFrameworkConfig({ rule })).toThrow(
        expect.objectContaining({
          name: "TypeError [ERR_INVALID_FRAMEWORK_RULE]",
          code: "ERR_INVALID_FRAMEWORK_RULE",
          message: "framework rule must be an object",
        }),
      );
    });

    test("v1.8 framework config rejects empty rule", () => {
      expect(() =>
        validateFrameworkConfig({
          rule: {},
        }),
      ).toThrow(
        expect.objectContaining({
          name: "TypeError [ERR_INVALID_FRAMEWORK_RULE]",
          code: "ERR_INVALID_FRAMEWORK_RULE",
          message: "framework rule must contain at least one request source",
        }),
      );
    });
  });

  describe("Invalid Request Source Rules", () => {
    test("v1.8 framework config rejects unsupported request source", () => {
      expect(() =>
        validateFrameworkConfig({
          rule: {
            cookies: {
              sessionId: { type: "string" },
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

    test("v1.8 framework config rejects null source rule", () => {
      expect(() =>
        validateFrameworkConfig({
          rule: {
            body: null,
          },
        }),
      ).toThrow(
        expect.objectContaining({
          name: "TypeError [ERR_INVALID_REQUEST_SOURCE_RULE]",
          code: "ERR_INVALID_REQUEST_SOURCE_RULE",
          message: 'rule for request source "body" must be an object',
        }),
      );
    });

    test("v1.8 framework config rejects array source rule", () => {
      expect(() =>
        validateFrameworkConfig({
          rule: {
            query: [],
          },
        }),
      ).toThrow(
        expect.objectContaining({
          name: "TypeError [ERR_INVALID_REQUEST_SOURCE_RULE]",
          code: "ERR_INVALID_REQUEST_SOURCE_RULE",
          message: 'rule for request source "query" must be an object',
        }),
      );
    });
  });
});

describe("Framework Configuration Options", () => {
  test("v1.8 framework config rejects non-object options", () => {
    expect(() =>
      validateFrameworkConfig({
        rule: {
          body: {
            name: { type: "string" },
          },
        },
        options: "invalid",
      }),
    ).toThrow(
      expect.objectContaining({
        name: "TypeError [ERR_INVALID_FRAMEWORK_OPTIONS]",
        code: "ERR_INVALID_FRAMEWORK_OPTIONS",
        message: "framework options must be an object",
      }),
    );
  });

  test("v1.8 framework config accepts core options", () => {
    const sources = validateFrameworkConfig({
      rule: {
        params: {
          id: { type: "string" },
        },
      },
      options: {
        unknownFields: "reject",
        prettyErrors: true,
      },
    });

    expect(sources).toEqual(["params"]);
  });
});
