import { perfectPayload, perfectPayloadAsync } from "./index.js";
import type {
  FrameworkConfig,
  FrameworkValidationInput,
  RequestSource,
  FrameworkValidationResult,
} from "./types/framework.js";
import type { ValidationError } from "./types/errors.js";
import type { InvalidPayloadResponse } from "./types/results.js";

const SUPPORTED_REQUEST_SOURCES: RequestSource[] = [
  "headers",
  "params",
  "query",
  "body",
];

export function validateFrameworkConfig({
  rule,
  options,
}: FrameworkConfig = {}): RequestSource[] {
  if (!rule || typeof rule !== "object" || Array.isArray(rule)) {
    throw new Error("perfect-payload:- framework rule must be an object");
  }
  const frameworkRule = rule;
  const configuredSources = Object.keys(frameworkRule) as RequestSource[];

  if (configuredSources.length === 0) {
    throw new Error(
      "perfect-payload:- framework rule must contain at least one request source",
    );
  }

  for (const source of configuredSources) {
    if (!SUPPORTED_REQUEST_SOURCES.includes(source)) {
      throw new Error(`perfect-payload:- unsupported request source ${source}`);
    }

    const sourceRule = frameworkRule[source];

    if (
      !sourceRule ||
      typeof sourceRule !== "object" ||
      Array.isArray(sourceRule)
    ) {
      throw new Error(
        `perfect-payload:- rule for request source ${source} must be an object`,
      );
    }
  }

  if (
    options !== undefined &&
    (options === null || typeof options !== "object" || Array.isArray(options))
  ) {
    throw new Error("perfect-payload:- framework options must be an object");
  }

  return SUPPORTED_REQUEST_SOURCES.filter((source) =>
    Object.prototype.hasOwnProperty.call(frameworkRule, source),
  );
}

export function validateFrameworkSources({
  data = {},
  rule,
  options = {},
}: FrameworkValidationInput = {}): FrameworkValidationResult {
  const configuredSources = validateFrameworkConfig({
    rule,
    options,
  });
  const frameworkRule = rule!;
  const validatedPayload: Partial<
    Record<RequestSource, Record<string, unknown>>
  > = {};

  const errors: Array<string | ValidationError> = [];

  let invalidResponse: InvalidPayloadResponse | null = null;

  for (const source of configuredSources) {
    const sourceData =
      data?.[source] !== undefined && data?.[source] !== null
        ? data[source]
        : {};

    const result = perfectPayload(sourceData, frameworkRule[source]!, options);

    if (result.valid === true) {
      validatedPayload[source] = result.validatedPayload;
      continue;
    }

    if (!invalidResponse) {
      const { errors: _errors, ...response } = result;
      invalidResponse = response;
    }

    for (const error of result.errors ?? []) {
      if (typeof error === "string") {
        errors.push(error);
      } else {
        errors.push({
          ...error,
          path: `${source}.${error.path}`,
        });
      }
    }
  }

  if (errors.length > 0) {
    return {
      ...(invalidResponse as InvalidPayloadResponse),
      errors,
    };
  }

  return {
    valid: true,
    validatedPayload,
  };
}

export async function validateFrameworkSourcesAsync({
  data = {},
  rule,
  options = {},
}: FrameworkValidationInput = {}): Promise<FrameworkValidationResult> {
  const configuredSources = validateFrameworkConfig({
    rule,
    options,
  });
  const frameworkRule = rule!;
  const results = await Promise.all(
    configuredSources.map(async (source) => {
      const sourceData =
        data?.[source] !== undefined && data?.[source] !== null
          ? data[source]
          : {};

      const result = await perfectPayloadAsync(
        sourceData,
        frameworkRule[source]!,
        options,
      );

      return {
        source,
        result,
      };
    }),
  );

  const validatedPayload: Partial<
    Record<RequestSource, Record<string, unknown>>
  > = {};

  const errors: Array<string | ValidationError> = [];
  let invalidResponse: InvalidPayloadResponse | null = null;

  for (const { source, result } of results) {
    if (result.valid === true) {
      validatedPayload[source] = result.validatedPayload;
      continue;
    }

    if (!invalidResponse) {
      const { errors: _errors, ...response } = result;
      invalidResponse = response;
    }

    for (const error of result.errors ?? []) {
      if (typeof error === "string") {
        errors.push(error);
      } else {
        errors.push({
          ...error,
          path: `${source}.${error.path}`,
        });
      }
    }
  }

  if (errors.length > 0) {
    return {
      ...(invalidResponse as InvalidPayloadResponse),
      errors,
    };
  }

  return {
    valid: true,
    validatedPayload,
  };
}
