import type {
  InvalidPayloadResponse,
  ValidPayloadResponse,
} from "./results.js";

export type UnknownFieldsMode = "strip" | "allow" | "reject";

export interface ValidationOptions {
  unknownFields?: UnknownFieldsMode;
  prettyErrors?: boolean;
  validPayloadResponse?: ValidPayloadResponse;
  inValidPayloadResponse?: InvalidPayloadResponse;
}

export interface StructuredErrorOptions extends ValidationOptions {
  prettyErrors?: false;
}

export interface PrettyErrorOptions extends ValidationOptions {
  prettyErrors: true;
}
