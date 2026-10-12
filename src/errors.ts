// src/errors.ts

export type PerfectPayloadErrorCode =
  | "ERR_INVALID_FRAMEWORK_RULE"
  | "ERR_UNSUPPORTED_REQUEST_SOURCE"
  | "ERR_INVALID_REQUEST_SOURCE_RULE"
  | "ERR_INVALID_FRAMEWORK_OPTIONS"
  | "ERR_INVALID_DEPENDENCY_RULE"
  | "ERR_INVALID_UNKNOWN_FIELDS"
  | "ERR_INVALID_PRETTY_ERRORS"
  | "ERR_CONFLICTING_TRANSFORMS"
  | "ERR_INVALID_TRANSFORM"
  | "ERR_ASYNC_TRANSFORM"
  | "ERR_UNDEFINED_TRANSFORM_RESULT"
  | "ERR_INVALID_RANGE"
  | "ERR_INVALID_CUSTOM_VALIDATOR"
  | "ERR_ASYNC_CUSTOM_VALIDATOR";

export class PerfectPayloadError extends TypeError {
  readonly code: PerfectPayloadErrorCode;

  constructor(code: PerfectPayloadErrorCode, message: string) {
    super(message);

    this.code = code;
    this.name = `TypeError [${code}]`;
  }
}
