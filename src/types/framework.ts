import type { ValidationRules } from "./rules.js";
import type { PerfectPayloadOptions } from "./options.js";

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
