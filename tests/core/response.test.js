import { describe, test, expect } from "@jest/globals";

import {
  invalidResult,
  validResult,
  customInvalidResult,
  customValidResult,
} from "../fixtures/core.fixtures.js";

describe("Core - Invalid Response", () => {
  test("Invalid payload returns statusCode 400", () => {
    expect(invalidResult?.statusCode).toBe(400);
  });

  test("Invalid payload returns valid=false", () => {
    expect(invalidResult?.valid).toBe(false);
  });

  test("Invalid response contains errors array", () => {
    expect(Array.isArray(invalidResult?.errors)).toBe(true);
  });

  test("Invalid payload contains errors", () => {
    expect(invalidResult?.errors?.length).toBeGreaterThan(0);
  });

  test("Every error is a structured object", () => {
    expect(
      invalidResult?.errors?.every(
        (error) => typeof error === "object" && error !== null,
      ),
    ).toBe(true);
  });

  test("Every error contains path", () => {
    expect(
      invalidResult?.errors?.every(
        (error) => typeof error?.path === "string" && error.path.length > 0,
      ),
    ).toBe(true);
  });

  test("Every error contains code", () => {
    expect(
      invalidResult?.errors?.every(
        (error) => typeof error?.code === "string" && error.code.length > 0,
      ),
    ).toBe(true);
  });

  test("Every error contains message", () => {
    expect(
      invalidResult?.errors?.every(
        (error) =>
          typeof error?.message === "string" && error.message.length > 0,
      ),
    ).toBe(true);
  });
});

describe("Core - Valid Response", () => {
  test("Valid payload returns statusCode 200", () => {
    expect(validResult?.statusCode).toBe(200);
  });

  test("Valid payload returns valid=true", () => {
    expect(validResult?.valid).toBe(true);
  });

  test("Valid payload returns validatedPayload", () => {
    expect(validResult?.validatedPayload).toBeTruthy();
    expect(typeof validResult.validatedPayload).toBe("object");
  });

  test("Valid response does not contain errors", () => {
    expect(validResult).not.toHaveProperty("errors");
  });

  test("validatedPayload contains requiredField", () => {
    expect(validResult?.validatedPayload?.requiredField).toBe("available");
  });

  test("validatedPayload contains array", () => {
    expect(Array.isArray(validResult?.validatedPayload?.marks)).toBe(true);
  });

  test("validatedPayload contains nested object", () => {
    expect(validResult?.validatedPayload?.address?.location?.latitude).toBe(
      12.9716,
    );
  });
});

describe("Core - Custom Invalid Response", () => {
  test("Custom invalid statusCode works", () => {
    expect(customInvalidResult?.statusCode).toBe(422);
  });

  test("Custom invalid valid=false works", () => {
    expect(customInvalidResult?.valid).toBe(false);
  });

  test("Custom invalid message works", () => {
    expect(customInvalidResult?.message).toBe("CUSTOM_INVALID_RESPONSE");
  });

  test("Custom invalid response still contains structured errors", () => {
    expect(
      customInvalidResult?.errors?.every(
        (error) =>
          typeof error === "object" &&
          typeof error?.path === "string" &&
          typeof error?.code === "string" &&
          typeof error?.message === "string",
      ),
    ).toBe(true);
  });
});

describe("Core - Custom Valid Response", () => {
  test("Custom valid statusCode works", () => {
    expect(customValidResult?.statusCode).toBe(201);
  });

  test("Custom valid valid=true works", () => {
    expect(customValidResult?.valid).toBe(true);
  });

  test("Custom valid message works", () => {
    expect(customValidResult?.message).toBe("CUSTOM_VALID_RESPONSE");
  });

  test("Custom valid response contains validatedPayload", () => {
    expect(typeof customValidResult?.validatedPayload).toBe("object");
  });
});
