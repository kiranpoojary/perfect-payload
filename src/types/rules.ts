export type ValidationValueType =
  | "number"
  | "string"
  | "boolean"
  | "email"
  | "url"
  | "enum"
  | "uuid"
  | "uuidv1"
  | "uuidv3"
  | "uuidv4"
  | "uuidv5"
  | "objectId"
  | "array"
  | "object";

export type TransformFunction = (
  value: unknown,
  payload: Record<string, unknown>,
) => unknown;

export type ArrayElementTransformFunction = (
  value: unknown,
  index: number,
  payload: Record<string, unknown>,
) => unknown;

export type CustomValidator = (
  value: unknown,
  payload: Record<string, unknown>,
) => boolean | Promise<boolean>;

export interface DependencyRule {
  setDependencyRule: (
    value: unknown,
    dependencyValue: unknown,
  ) => AttributeValidationRules;
}

export type DependencyRules = Record<string, DependencyRule>;

export interface AttributeValidationRules<
  TTransform extends (...args: any[]) => unknown = TransformFunction,
> {
  mandatory?: boolean;
  allowNull?: boolean;
  allowEmptyObject?: boolean;
  allowEmptyArray?: boolean;

  type?: ValidationValueType;

  enumValues?: unknown[];

  path?: string;

  mandatoryError?: string;
  allowNullError?: string;
  emptyObjectError?: string;
  emptyArrayError?: string;
  elementConstraintsError?: string;
  regexError?: string;
  typeError?: string;
  minLengthError?: string;
  maxLengthError?: string;
  preventDecimalError?: string;
  minError?: string;
  maxError?: string;
  rangeError?: string;

  customValidatorError?: string;
  customValidatorCode?: string;

  minLength?: number;
  maxLength?: number;

  min?: number;
  max?: number;
  range?: string;

  preventDecimal?: boolean;

  minItems?: number;
  maxItems?: number;

  regex?: RegExp;

  transform?: TTransform;
  objectAttr?: ValidationRules;

  elementConstraints?: AttributeValidationRules<ArrayElementTransformFunction>;

  dependency?: DependencyRules;
  customValidator?: CustomValidator;

  trim?: boolean;
  lowercase?: boolean;
  uppercase?: boolean;
}

export type ValidationRules = Record<string, AttributeValidationRules>;
