import type { ValidationRules } from "./rules.js";
import type { PerfectPayloadOptions } from "./options.js";
import type { ValidationError } from "./errors.js";

export type RequestSource = "headers" | "params" | "query" | "body";

export type FrameworkRule = Partial<Record<RequestSource, ValidationRules>>;

export type FrameworkData = Partial<
  Record<RequestSource, Record<string, unknown>>
>;

export interface FrameworkConfig {
  rule?: FrameworkRule;
  options?: PerfectPayloadOptions;
}

export interface FrameworkValidationInput extends FrameworkConfig {
  data?: FrameworkData;
}

export type FrameworkValidatedPayload = Partial<
  Record<RequestSource, Record<string, unknown>>
>;

export interface FrameworkValidationSuccess {
  valid: true;
  validatedPayload: FrameworkValidatedPayload;
}

export interface FrameworkValidationFailure {
  statusCode?: number;
  valid: false;
  message?: string;
  errors: Array<string | ValidationError>;
  [key: string]: unknown;
}

export type FrameworkValidationResult =
  | FrameworkValidationSuccess
  | FrameworkValidationFailure;
