import type {
  InvalidPayloadResponse,
  ValidPayloadResponse,
} from "./results.js";

export type UnknownFieldsMode = "strip" | "allow" | "reject";

export interface PerfectPayloadOptions {
  unknownFields?: UnknownFieldsMode;
  prettyErrors?: boolean;
  validPayloadResponse?: ValidPayloadResponse;
  inValidPayloadResponse?: InvalidPayloadResponse;
}

export interface StructuredErrorOptions extends PerfectPayloadOptions {
  prettyErrors?: false;
}

export interface PrettyErrorOptions extends PerfectPayloadOptions {
  prettyErrors: true;
}
