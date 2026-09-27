import type { ValidationError } from "./errors.js";

export interface ValidPayloadResponse {
  statusCode: number;
  valid: true;
  [key: string]: unknown;
}

export interface InvalidPayloadResponse {
  statusCode: number;
  valid: false;
  message: string;
  [key: string]: unknown;
}

export interface ValidationSuccess<
  T = Record<string, unknown>,
> extends ValidPayloadResponse {
  validatedPayload: T;
}

export interface ValidationFailure<
  E = ValidationError,
> extends InvalidPayloadResponse {
  errors: E[];
}

export type ValidationResult<
  T = Record<string, unknown>,
  E = ValidationError,
> = ValidationSuccess<T> | ValidationFailure<E>;
