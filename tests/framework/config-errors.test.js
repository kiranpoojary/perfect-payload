import { describe, test, expect } from "@jest/globals";
import { validatePayload } from "../../dist/express.js";

describe("Framework - Configuration Errors", () => {
  test("invalid framework rule throws Node-style configuration error", () => {
    expect(() =>
      validatePayload({
        rule: "invalid",
      }),
    ).toThrow(
      expect.objectContaining({
        name: "TypeError [ERR_INVALID_FRAMEWORK_RULE]",
        code: "ERR_INVALID_FRAMEWORK_RULE",
        message: "framework rule must be an object",
      }),
    );
  });
  test("unsupported request source throws Node-style configuration error", () => {
    expect(() =>
      validatePayload({
        rule: {
          cookies: {},
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

  test("invalid request source rule throws Node-style configuration error", () => {
    expect(() =>
      validatePayload({
        rule: {
          body: "invalid",
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
  test("invalid framework options throw Node-style configuration error", () => {
    expect(() =>
      validatePayload({
        rule: {
          body: {},
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
});
