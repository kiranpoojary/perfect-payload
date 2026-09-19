import type { ValidationRules } from "./types/rules.js";

import type {
  PerfectPayloadOptions,
  StructuredErrorOptions,
  PrettyErrorOptions,
} from "./types/options.js";

import type {
  ValidationResult,
  ValidPayloadResponse,
  InvalidPayloadResponse,
} from "./types/results.js";
import type { ValidationError } from "./types/errors.js";

type LegacyPayload = Record<string, any>;

type LegacyValidationRules = Record<string, Record<string, any>>;

interface StructuredValidationOptions {
  skipCustomValidator?: boolean;
  unknownFields?: "strip" | "allow" | "reject";
}

interface LegacyValidResponse {
  statusCode: number;
  valid: boolean;
  [key: string]: unknown;
}

interface LegacyInvalidResponse {
  statusCode: number;
  valid: boolean;
  message?: string;
  [key: string]: unknown;
}

interface LegacyValidationResult {
  statusCode: number;
  valid: boolean;
  message?: string;
  validatedPayload?: Record<string, any>;
  errors?: any[];
  [key: string]: any;
}

let perfectPayloadV1DeprecationWarningShown = false;

function showPerfectPayloadV1DeprecationWarning() {
  if (perfectPayloadV1DeprecationWarningShown) return;

  perfectPayloadV1DeprecationWarningShown = true;

  const message =
    "perfectPayloadV1() is deprecated and will no longer be supported after March 31, 2027. Use perfectPayload() instead.";

  if (
    typeof process !== "undefined" &&
    typeof process.emitWarning === "function"
  ) {
    process.emitWarning(message, {
      type: "DeprecationWarning",
      code: "PERFECT_PAYLOAD_V1_DEPRECATED",
    });
  } else if (
    typeof console !== "undefined" &&
    typeof console.warn === "function"
  ) {
    console.warn(`[perfect-payload] DeprecationWarning: ${message}`);
  }
}

export function perfectPayloadV1(
  data: LegacyPayload = {},
  dataValidationRule: LegacyValidationRules = {},
  validPayloadResponse: LegacyValidResponse = {
    statusCode: 200,
    valid: true,
  },
  inValidPayloadResponse: LegacyInvalidResponse = {
    statusCode: 400,
    valid: false,
    message: "One or more attribute values are invalid",
  },
): LegacyValidationResult {
  showPerfectPayloadV1DeprecationWarning();
  let validatedPayload: Record<string, any> = {};
  let rowErrors: unknown[] = [];
  for (const attributeName in dataValidationRule) {
    let addNextError = true;
    const attributeRules = dataValidationRule?.[attributeName];
    const attrPath = dataValidationRule?.[attributeName]?.path || null;
    for (const ruleName in attributeRules) {
      const attributePath = `${attrPath ? attrPath + "." : ""}${attributeName}`;
      const attributeValue = data?.[attributeName] ?? null;
      const nullAllowed =
        dataValidationRule?.[attributeName]?.["allowNull"] ?? true;
      const isMandatoryField = attributeRules?.["mandatory"] ?? false;
      const attrExist = Object.keys(data)?.includes(attributeName); //Mandatory value check

      switch (ruleName) {
        case "mandatory":
          //mandatory value check
          if (isMandatoryField && !attrExist) {
            addNextError = false;
            rowErrors.push(
              attributeRules?.["mandatoryError"] ||
                `${attributePath} is mandatory`,
            );
          } else if (!attrExist) {
            addNextError = false;
          }
          break;
        case "allowNull":
          //allowNull value check
          if (addNextError && attributeValue == null) {
            if (!dataValidationRule?.[attributeName]?.[ruleName]) {
              addNextError = false;
              rowErrors.push(
                attributeRules?.["allowNullError"] ||
                  `value null/'' not valid for attribute ${attributePath}`,
              );
            }
          }
          break;
        case "allowEmptyObject":
          //allowEmptyObject check
          if (addNextError) {
            if (
              !attributeRules?.["allowEmptyObject"] &&
              Object.keys(attributeValue).length == 0
            ) {
              rowErrors.push(
                attributeRules?.["emptyObjectError"] ||
                  `value {} not valid for attribute ${attributePath}`,
              );
              addNextError = false;
            }
          }

          break;
        case "allowEmptyArray":
          //allowEmptyArray check
          if (addNextError) {
            if (
              !attributeRules?.["allowEmptyArray"] &&
              isArray(attributeValue) &&
              attributeValue?.length == 0
            ) {
              rowErrors.push(
                attributeRules?.["emptyArrayError"] ||
                  `${attributePath} cannot be an empty array`,
              );
              addNextError = false;
            }
          }

          break;
        case "elementConstraints":
          //check array ele type
          if (addNextError) {
            if (isArray(attributeValue) && attributeValue?.length > 0) {
              let elementError = false;
              for (const element of attributeValue) {
                const { statusCode = 200, errors } = perfectPayloadV1(
                  { [attributeName]: element },
                  { [attributeName]: attributeRules[ruleName] },
                );
                if (statusCode == 400) {
                  elementError = errors?.[0];
                  // addNextError = false;
                  break;
                }
              }
              if (elementError) {
                rowErrors.push(
                  attributeRules?.["elementConstraintsError"] || elementError,
                );
                addNextError = false;
              }
            }
          }

          break;
        case "regex":
          //custom regex check
          if (addNextError) {
            if (!isPassedRegex(attributeRules[ruleName], attributeValue)) {
              rowErrors.push(
                attributeRules?.["regexError"] ||
                  `${attributePath} failed to pass the regex ${attributeRules[ruleName]}`,
              );
              addNextError = false;
            }
          }
          break;
        case "type":
          //value type check
          if (addNextError) {
            if (attributeValue == null && nullAllowed) {
              addNextError = true;
            } else {
              switch (attributeRules[ruleName]) {
                case "number":
                  if (!isNumber(attributeValue)) {
                    rowErrors.push(
                      attributeRules?.["typeError"] ||
                        `Invalid ${typeof attributeValue} value(${attributeValue}) found in attribute ${attributePath}, required ${
                          attributeRules[ruleName]
                        } value`,
                    );
                    addNextError = false;
                  }
                  break;

                case "string":
                  if (!isString(attributeValue)) {
                    rowErrors.push(
                      attributeRules?.["typeError"] ||
                        `Invalid ${typeof attributeValue} value(${attributeValue}) found in attribute ${attributePath}, required ${
                          attributeRules[ruleName]
                        } value`,
                    );
                    addNextError = false;
                  }
                  break;
                case "boolean":
                  if (!isBoolean(attributeValue)) {
                    rowErrors.push(
                      attributeRules?.["typeError"] ||
                        `Invalid ${typeof attributeValue} value(${attributeValue}) found in attribute ${attributePath}, required ${
                          attributeRules[ruleName]
                        } value`,
                    );
                    addNextError = false;
                  }
                  break;
                case "email":
                  if (!isValidEmail(attributeValue)) {
                    rowErrors.push(
                      attributeRules?.["typeError"] ||
                        `Invalid email ID(${attributeValue}) found in attribute ${attributePath}`,
                    );
                    addNextError = false;
                  }
                  break;

                case "url":
                  if (!isValidUrl(attributeValue)) {
                    rowErrors.push(
                      attributeRules?.["typeError"] ||
                        `Invalid URL format(${attributeValue}) found in attribute ${attributePath}`,
                    );
                    addNextError = false;
                  }
                  break;
                case "enum":
                  if (attributeValue == null && nullAllowed) {
                    addNextError = true;
                  } else {
                    const allEnumValues = attributeRules["enumValues"];
                    if (!allEnumValues?.includes(attributeValue)) {
                      rowErrors.push(
                        attributeRules?.["typeError"] ||
                          `Invalid value(${attributeValue}) found in attribute ${attributePath}, valid values are ${allEnumValues?.join(
                            ", ",
                          )}`,
                      );
                      addNextError = false;
                    }
                  }
                  break;
                case "uuid":
                  if (attributeValue == null && nullAllowed) {
                    addNextError = true;
                  } else if (!isUUID(attributeValue)) {
                    rowErrors.push(
                      attributeRules?.["typeError"] ||
                        `Invalid UUID(${attributeValue}) found in attribute ${attributePath}`,
                    );
                    addNextError = false;
                  }
                  break;
                case "uuidv1":
                  if (attributeValue == null && nullAllowed) {
                    addNextError = true;
                  } else if (!isUUIDv1(attributeValue)) {
                    rowErrors.push(
                      attributeRules?.["typeError"] ||
                        `Invalid v1 UUID(${attributeValue}) found in attribute ${attributePath}`,
                    );
                    addNextError = false;
                  }
                  break;
                case "uuidv3":
                  if (attributeValue == null && nullAllowed) {
                    addNextError = true;
                  } else if (!isUUIDv3(attributeValue)) {
                    rowErrors.push(
                      attributeRules?.["typeError"] ||
                        `Invalid v3 UUID(${attributeValue}) found in attribute ${attributePath}`,
                    );
                    addNextError = false;
                  }
                  break;
                case "uuidv4":
                  if (attributeValue == null && nullAllowed) {
                    addNextError = true;
                  } else if (!isUUIDv4(attributeValue)) {
                    rowErrors.push(
                      attributeRules?.["typeError"] ||
                        `Invalid v4 UUID(${attributeValue}) found in attribute ${attributePath}`,
                    );
                    addNextError = false;
                  }
                  break;
                case "uuidv5":
                  if (attributeValue == null && nullAllowed) {
                    addNextError = true;
                  } else if (!isUUIDv5(attributeValue)) {
                    rowErrors.push(
                      attributeRules?.["typeError"] ||
                        `Invalid v5 UUID(${attributeValue}) found in attribute ${attributePath}`,
                    );
                    addNextError = false;
                  }
                  break;
                case "objectId":
                  if (attributeValue == null && nullAllowed) {
                    addNextError = true;
                  } else {
                    if (!isObjectId(attributeValue)) {
                      rowErrors.push(
                        attributeRules?.["typeError"] ||
                          `Invalid ObjectId(${attributeValue}) found in attribute ${attributePath}`,
                      );
                      addNextError = false;
                    }
                  }
                  break;

                case "array":
                  if (!isArray(attributeValue)) {
                    rowErrors.push(
                      attributeRules?.["typeError"] ||
                        `Invalid ${typeof attributeValue} value(${attributeValue}) found in attribute ${attributePath}, required ${
                          attributeRules[ruleName]
                        } value`,
                    );
                    addNextError = false;
                  }
                  break;

                case "object":
                  if (!isObject(attributeValue)) {
                    rowErrors.push(
                      attributeRules?.["typeError"] ||
                        `Invalid ${typeof attributeValue} value(${attributeValue}) found in attribute ${attributePath}, required ${
                          attributeRules[ruleName]
                        } value`,
                    );
                    addNextError = false;
                  }
                  break;

                default:
                  break;
              }
            }
          }

          break;
        case "minLength":
          //minimum string length check
          if (addNextError) {
            if (attributeValue == null && nullAllowed) {
              addNextError = true;
            } else if (typeof attributeValue == "string") {
              if (attributeValue.length < +attributeRules[ruleName])
                rowErrors.push(
                  attributeRules?.["minLengthError"] ||
                    `${attributePath} should be minimum of ${attributeRules[ruleName]} character`,
                );
              addNextError = false;
            } else {
              rowErrors.push(
                `${attributePath} value should be a string type(minLength specified)`,
              );
              addNextError = false;
            }
          }
          break;
        case "maxLength":
          //max string length check
          if (addNextError) {
            if (attributeValue == null && nullAllowed) {
              addNextError = true;
            } else if (typeof attributeValue == "string") {
              if (attributeValue.length > +attributeRules[ruleName])
                rowErrors.push(
                  attributeRules?.["maxLengthError"] ||
                    `${attributePath} can have maximum of ${attributeRules[ruleName]} character`,
                );
              addNextError = false;
            } else {
              rowErrors.push(
                `${attributePath} value should be a string type(maxLength specified)`,
              );
              addNextError = false;
            }
          }
          break;
        case "preventDecimal":
          //preventFraction
          if (addNextError) {
            if (attributeValue == null && nullAllowed) {
              addNextError = true;
            } else if (!isNumber(attributeValue)) {
              rowErrors.push(
                `Invalid ${typeof attributeValue} value(${attributeValue}) found in attribute ${attributePath}, required number value`,
              );
              addNextError = false;
            } else if (+attributeValue % 1 !== 0) {
              rowErrors.push(
                attributeRules?.["preventDecimalError"] ||
                  `Decimal value not allowed in attribute ${attributePath}(${attributeValue})`,
              );
              addNextError = false;
            }
          }
          break;
        case "min":
          //minimum value  check
          if (addNextError) {
            if (attributeValue == null && nullAllowed) {
              addNextError = true;
            } else if (!isNumber(attributeValue)) {
              rowErrors.push(
                `Invalid ${typeof attributeValue} value(${attributeValue}) found in attribute ${attributePath}, required number value`,
              );
              addNextError = false;
            } else if (+attributeValue < +attributeRules[ruleName]) {
              rowErrors.push(
                attributeRules?.["minError"] ||
                  `minimum value ${
                    attributeRules[ruleName]
                  } is allowed in attribute ${attributePath}, found value ${
                    data[attributeName] ?? "Nil"
                  }`,
              );
              addNextError = false;
            }
          }
          break;
        case "max":
          //maximum value  check
          if (addNextError) {
            if (attributeValue == null && nullAllowed) {
              addNextError = true;
            } else if (!isNumber(attributeValue)) {
              rowErrors.push(
                `Invalid ${typeof attributeValue} value(${attributeValue}) found in attribute ${attributePath}, required number value`,
              );
              addNextError = false;
            } else if (+attributeValue > +attributeRules[ruleName]) {
              rowErrors.push(
                attributeRules?.["maxError"] ||
                  `maximum value ${
                    attributeRules[ruleName]
                  } is allowed in attribute ${attributePath}, found value ${
                    data[attributeName] ?? "Nil"
                  }`,
              );
              addNextError = false;
            }
          }
          break;
        case "range":
          //value range  check
          if (addNextError) {
            if (attributeValue == null && nullAllowed) {
              addNextError = true;
            } else if (!isNumber(attributeValue)) {
              rowErrors.push(
                `Invalid ${typeof attributeValue} value(${attributeValue}) found in attribute ${attributePath}, required number value`,
              );
              addNextError = false;
            } else {
              const [min, max] = attributeRules[ruleName].split("-");
              if (
                !isNumber(attributeValue) ||
                +attributeValue < +min ||
                +attributeValue > +max
              ) {
                rowErrors.push(
                  attributeRules?.["rangeError"] ||
                    `Invalid values(${attributeValue}) found in attribute ${attributePath}, value should be between ${min} and ${max} `,
                );
                addNextError = false;
              }
            }
          }
          break;
        case "objectAttr":
          //nested object attributes check
          if (addNextError) {
            const allObjectAttr = Object.keys(attributeRules?.[ruleName]);
            const objectAttrRules: LegacyValidationRules = {};
            for (const attr of allObjectAttr) {
              objectAttrRules[attr] = {
                ...attributeRules?.[ruleName]?.[attr],
                path: attributeRules?.[ruleName]?.[attr]?.path
                  ? attributeRules?.[ruleName]?.[attr]?.path + `.${attr}`
                  : `${attributePath}`,
              };
            }

            const { errors = [] } = perfectPayloadV1(
              attributeValue,
              objectAttrRules,
            );
            rowErrors = [...rowErrors, ...errors];
            addNextError = true;
          }
          break;
        case "dependency":
          //dependency check
          if (addNextError) {
            const allDependencyAttr = Object.keys(attributeRules?.[ruleName]);
            for (const attr of allDependencyAttr) {
              if (
                typeof attributeRules?.[ruleName]?.[attr]?.setDependencyRule ==
                "function"
              ) {
                const newRule = attributeRules?.[ruleName]?.[
                  attr
                ]?.setDependencyRule(attributeValue, data?.[attr]);
                let newData = { [attributeName]: attributeValue };
                if (Object.keys(data).includes(attr)) {
                  newData = { ...newData, [attr]: data?.[attr] };
                }
                const { errors = [] } = perfectPayloadV1(newData, {
                  [attr]: newRule,
                });
                rowErrors = [...rowErrors, ...errors];
                addNextError = true;
              } else {
                throw new Error(
                  `perfect-payload:- function setDependencyRule not found in ${attr} dependency `,
                );
              }
            }
          }
          break;
        default:
          break;
      }

      if (attrExist && rowErrors.length == 0)
        validatedPayload[attributeName] = attributeValue;
    }
  }

  if (rowErrors?.length) {
    return { ...inValidPayloadResponse, errors: rowErrors };
  } else {
    return { ...validPayloadResponse, validatedPayload };
  }
}

export function perfectPayload<
  T extends Record<string, unknown> = Record<string, unknown>,
>(
  data: Record<string, unknown>,
  dataValidationRule: ValidationRules,
  options: PrettyErrorOptions,
): ValidationResult<T, string>;

export function perfectPayload<
  T extends Record<string, unknown> = Record<string, unknown>,
>(
  data?: Record<string, unknown>,
  dataValidationRule?: ValidationRules,
  options?: StructuredErrorOptions,
): ValidationResult<T>;

export function perfectPayload<
  T extends Record<string, unknown> = Record<string, unknown>,
>(
  data: Record<string, unknown> = {},
  dataValidationRule: ValidationRules = {},
  options: PerfectPayloadOptions = {},
): ValidationResult<T> | ValidationResult<T, string> {
  const {
    unknownFields = "strip",
    prettyErrors = false,
    validPayloadResponse = {
      statusCode: 200,
      valid: true,
    },

    inValidPayloadResponse = {
      statusCode: 400,
      valid: false,
      message: "One or more attribute values are invalid",
    },
  } = options ?? {};

  if (!["strip", "allow", "reject"].includes(unknownFields)) {
    throw new Error(
      `perfect-payload:- unknownFields must be one of strip, allow, reject`,
    );
  }
  if (typeof prettyErrors !== "boolean") {
    throw new Error(`perfect-payload:- prettyErrors must be a boolean`);
  }
  const validationResult = perfectPayloadStructured<T>(
    data,
    dataValidationRule,
    validPayloadResponse,
    inValidPayloadResponse,
    "",
    {
      unknownFields,
    },
  );

  if (
    prettyErrors &&
    validationResult.valid === false &&
    validationResult.errors.length
  ) {
    return {
      ...validationResult,
      errors: validationResult.errors.map((error) => error.message),
    };
  }

  return validationResult;
}

export function perfectPayloadAsync<
  T extends Record<string, unknown> = Record<string, unknown>,
>(
  data: Record<string, unknown>,
  dataValidationRule: ValidationRules,
  options: PrettyErrorOptions,
): Promise<ValidationResult<T, string>>;

export function perfectPayloadAsync<
  T extends Record<string, unknown> = Record<string, unknown>,
>(
  data?: Record<string, unknown>,
  dataValidationRule?: ValidationRules,
  options?: StructuredErrorOptions,
): Promise<ValidationResult<T>>;

export async function perfectPayloadAsync<
  T extends Record<string, unknown> = Record<string, unknown>,
>(
  data: Record<string, unknown> = {},
  dataValidationRule: ValidationRules = {},
  options: PerfectPayloadOptions = {},
): Promise<ValidationResult<T> | ValidationResult<T, string>> {
  const {
    validPayloadResponse = {
      statusCode: 200,
      valid: true,
    },

    inValidPayloadResponse = {
      statusCode: 400,
      valid: false,
      message: "One or more attribute values are invalid",
    },
    unknownFields = "strip",
    prettyErrors = false,
  } = options ?? {};

  if (!["strip", "allow", "reject"].includes(unknownFields)) {
    throw new Error(
      `perfect-payload:- unknownFields must be one of strip, allow, reject`,
    );
  }
  if (typeof prettyErrors !== "boolean") {
    throw new Error(`perfect-payload:- prettyErrors must be a boolean`);
  }
  const validationResult = perfectPayloadStructured<T>(
    data,
    dataValidationRule,
    validPayloadResponse,
    inValidPayloadResponse,
    "",
    {
      skipCustomValidator: true,
      unknownFields,
    },
  );

  if (validationResult.valid === false && validationResult.errors.length) {
    if (prettyErrors) {
      return {
        ...validationResult,
        errors: validationResult.errors.map((error) => error.message),
      };
    }

    return validationResult;
  }
  const rowErrors = await runAsyncCustomValidators(
    validationResult.valid === true ? validationResult.validatedPayload : {},
    dataValidationRule,
  );

  if (rowErrors.length > 0) {
    if (prettyErrors) {
      return {
        ...inValidPayloadResponse,
        errors: rowErrors.map((error) => error.message),
      };
    }

    return {
      ...inValidPayloadResponse,
      errors: rowErrors,
    };
  }

  return validationResult;
}

function perfectPayloadStructured<
  T extends Record<string, unknown> = Record<string, unknown>,
>(
  data: Record<string, unknown> = {},
  dataValidationRule: ValidationRules = {},
  validPayloadResponse: ValidPayloadResponse = {
    statusCode: 200,
    valid: true,
  },
  inValidPayloadResponse: InvalidPayloadResponse = {
    statusCode: 400,
    valid: false,
    message: "One or more attribute values are invalid",
  },
  basePath: string = "",
  options: StructuredValidationOptions = {},
): ValidationResult<T> {
  let validatedPayload: Record<string, unknown> = {};
  let rowErrors: ValidationError[] = [];
  const skipCustomValidator = options?.skipCustomValidator === true;
  const unknownFields = options?.unknownFields ?? "strip";

  for (const attributeName in dataValidationRule) {
    let addNextError = true;

    const attributeRules = dataValidationRule?.[attributeName];

    const attributePath = getAttributePath(
      attributeName,
      attributeRules,
      basePath,
    );

    let attributeValue = data?.[attributeName] ?? null;

    const nullAllowed =
      dataValidationRule?.[attributeName]?.["allowNull"] ?? true;

    const isMandatoryField = attributeRules?.["mandatory"] ?? false;

    const attrExist = Object.keys(data ?? {}).includes(attributeName);
    // TRANSFORMATIONS START
    // NO MULTI TRANSFORMATION
    if (
      attributeRules?.lowercase === true &&
      attributeRules?.uppercase === true
    ) {
      throw new Error(
        `perfect-payload:- lowercase and uppercase cannot both be enabled for attribute ${attributePath}`,
      );
    }
    // TRIM
    if (
      attrExist &&
      attributeValue !== null &&
      attributeRules?.trim === true &&
      typeof attributeValue === "string"
    ) {
      attributeValue = attributeValue.trim();
    }
    // LOWERCASE
    if (
      attrExist &&
      attributeValue !== null &&
      attributeRules?.lowercase === true &&
      typeof attributeValue === "string"
    ) {
      attributeValue = attributeValue.toLowerCase();
    }

    // UPPERCASE

    if (
      attrExist &&
      attributeValue !== null &&
      attributeRules?.uppercase === true &&
      typeof attributeValue === "string"
    ) {
      attributeValue = attributeValue.toUpperCase();
    }

    // CUSTOM TRANSFORM

    if (
      attrExist &&
      attributeValue !== null &&
      attributeRules?.transform !== undefined
    ) {
      const transformer = attributeRules.transform;

      if (typeof transformer !== "function") {
        throw new Error(
          `perfect-payload:- transform must be a function for attribute ${attributePath}`,
        );
      }

      const transformedValue = transformer(attributeValue, data);

      if (
        transformedValue &&
        typeof transformedValue === "object" &&
        "then" in transformedValue &&
        typeof transformedValue.then === "function"
      ) {
        throw new Error(
          `perfect-payload:- transform must be synchronous for attribute ${attributePath}`,
        );
      }

      if (transformedValue === undefined) {
        throw new Error(
          `perfect-payload:- transform must not return undefined for attribute ${attributePath}`,
        );
      }

      attributeValue = transformedValue;
    }
    // TRANSFORMATIONS END
    for (const ruleName in attributeRules) {
      switch (ruleName) {
        // ==================================================
        // MANDATORY
        // ==================================================

        case "mandatory":
          if (isMandatoryField && (!attrExist || attributeValue === "")) {
            addNextError = false;

            addStructuredError(
              rowErrors,
              attributePath,
              "REQUIRED",
              attributeRules?.["mandatoryError"] ||
                `${attributePath} is mandatory`,
            );
          } else if (!attrExist) {
            addNextError = false;
          }

          break;

        // ==================================================
        // NULL
        // ==================================================

        case "allowNull":
          if (addNextError && attributeValue === null) {
            if (!attributeRules?.[ruleName]) {
              addNextError = false;

              addStructuredError(
                rowErrors,
                attributePath,
                "NULL_NOT_ALLOWED",
                attributeRules?.["allowNullError"] ||
                  `value null not valid for attribute ${attributePath}`,
              );
            }
          }

          break;

        // ==================================================
        // EMPTY OBJECT
        // ==================================================

        case "allowEmptyObject":
          if (addNextError) {
            if (
              !attributeRules?.["allowEmptyObject"] &&
              attributeValue != null &&
              Object.keys(attributeValue).length === 0
            ) {
              addStructuredError(
                rowErrors,
                attributePath,
                "EMPTY_OBJECT_NOT_ALLOWED",
                attributeRules?.["emptyObjectError"] ||
                  `value {} not valid for attribute ${attributePath}`,
              );

              addNextError = false;
            }
          }

          break;

        // ==================================================
        // EMPTY ARRAY
        // ==================================================

        case "allowEmptyArray":
          if (addNextError) {
            if (
              !attributeRules?.["allowEmptyArray"] &&
              isArray(attributeValue) &&
              attributeValue.length === 0
            ) {
              addStructuredError(
                rowErrors,
                attributePath,
                "EMPTY_ARRAY_NOT_ALLOWED",
                attributeRules?.["emptyArrayError"] ||
                  `${attributePath} cannot be an empty array`,
              );

              addNextError = false;
            }
          }

          break;

        // ==================================================
        // ARRAY ELEMENT CONSTRAINTS
        // ==================================================

        case "elementConstraints":
          if (addNextError) {
            if (isArray(attributeValue) && attributeValue.length > 0) {
              const elementConstraints = attributeRules.elementConstraints;

              if (!elementConstraints) {
                break;
              }
              let elementError = null;

              // Clone so original payload array is not mutated
              const transformedArray = [...attributeValue];

              for (
                let elementIndex = 0;
                elementIndex < attributeValue.length;
                elementIndex++
              ) {
                const element = attributeValue[elementIndex];

                const elementResult = perfectPayloadStructured(
                  {
                    [attributeName]: element,
                  },
                  {
                    [attributeName]: elementConstraints,
                  },
                  { statusCode: 200, valid: true },
                  {
                    statusCode: 400,
                    valid: false,
                    message: "One or more attribute values are invalid",
                  },
                  "",
                  options,
                );

                if (
                  elementResult.valid === false &&
                  elementResult.errors.length > 0
                ) {
                  const firstElementError = elementResult.errors[0];

                  const indexedPath = replaceRootPath(
                    firstElementError.path,
                    attributeName,
                    `${attributePath}[${elementIndex}]`,
                  );

                  if (attributeRules?.["elementConstraintsError"]) {
                    elementError = {
                      path: indexedPath,
                      code: "INVALID_ARRAY_ELEMENT",
                      message: attributeRules["elementConstraintsError"],
                    };
                  } else {
                    elementError = {
                      ...firstElementError,
                      path: indexedPath,
                      ...(firstElementError.code === "UNKNOWN_FIELD" && {
                        message: `Unknown field ${indexedPath} is not allowed`,
                      }),
                    };
                  }

                  break;
                }

                // Preserve the transformed element
                if (elementResult.valid === true) {
                  transformedArray[elementIndex] =
                    elementResult.validatedPayload[attributeName];
                }
              }

              if (elementError) {
                rowErrors.push(elementError);
                addNextError = false;
              } else {
                // All elements passed, so use transformed values
                attributeValue = transformedArray;
              }
            }
          }

          break;

        case "minItems": {
          const minItems = attributeRules.minItems;

          if (
            addNextError &&
            attrExist &&
            attributeValue !== null &&
            isArray(attributeValue) &&
            minItems !== undefined &&
            attributeValue.length < minItems
          ) {
            addStructuredError(
              rowErrors,
              attributePath,
              "MIN_ITEMS",
              `Attribute ${attributePath} must contain at least ${minItems} item(s)`,
            );

            addNextError = false;
          }

          break;
        }

        case "maxItems": {
          const maxItems = attributeRules.maxItems;

          if (
            addNextError &&
            attrExist &&
            attributeValue !== null &&
            isArray(attributeValue) &&
            maxItems !== undefined &&
            attributeValue.length > maxItems
          ) {
            addStructuredError(
              rowErrors,
              attributePath,
              "MAX_ITEMS",
              `Attribute ${attributePath} must contain at most ${maxItems} item(s)`,
            );

            addNextError = false;
          }

          break;
        }
        // ==================================================
        // REGEX
        // ==================================================

        case "regex":
          if (addNextError) {
            if (!isPassedRegex(attributeRules[ruleName], attributeValue)) {
              addStructuredError(
                rowErrors,
                attributePath,
                "REGEX_MISMATCH",
                attributeRules?.["regexError"] ||
                  `${attributePath} failed to pass the regex ${attributeRules[ruleName]}`,
              );

              addNextError = false;
            }
          }

          break;

        // ==================================================
        // TYPE
        // ==================================================

        case "type":
          if (addNextError) {
            if (attributeValue == null && nullAllowed) {
              addNextError = true;
            } else {
              const expectedType = attributeRules[ruleName];

              switch (expectedType) {
                case "number":
                  if (
                    !isNumber(attributeValue) ||
                    Number.isNaN(attributeValue)
                  ) {
                    addStructuredError(
                      rowErrors,
                      attributePath,
                      "INVALID_TYPE",
                      attributeRules?.["typeError"] ||
                        getInvalidTypeMessage(
                          attributeValue,
                          attributePath,
                          expectedType,
                        ),
                    );

                    addNextError = false;
                  }

                  break;
                case "string":
                  if (!isString(attributeValue)) {
                    addStructuredError(
                      rowErrors,
                      attributePath,
                      "INVALID_TYPE",
                      attributeRules?.["typeError"] ||
                        getInvalidTypeMessage(
                          attributeValue,
                          attributePath,
                          expectedType,
                        ),
                    );

                    addNextError = false;
                  }

                  break;

                case "boolean":
                  if (!isBoolean(attributeValue)) {
                    addStructuredError(
                      rowErrors,
                      attributePath,
                      "INVALID_TYPE",
                      attributeRules?.["typeError"] ||
                        getInvalidTypeMessage(
                          attributeValue,
                          attributePath,
                          expectedType,
                        ),
                    );

                    addNextError = false;
                  }

                  break;

                case "email":
                  if (!isValidEmail(attributeValue)) {
                    addStructuredError(
                      rowErrors,
                      attributePath,
                      "INVALID_EMAIL",
                      attributeRules?.["typeError"] ||
                        `Invalid email format for attribute ${attributePath}`,
                    );

                    addNextError = false;
                  }

                  break;
                case "url":
                  if (!isValidUrl(attributeValue)) {
                    addStructuredError(
                      rowErrors,
                      attributePath,
                      "INVALID_URL",
                      attributeRules?.["typeError"] ||
                        `Invalid URL format for attribute ${attributePath}`,
                    );

                    addNextError = false;
                  }

                  break;

                case "enum": {
                  const allEnumValues = attributeRules["enumValues"];

                  if (!allEnumValues?.includes(attributeValue)) {
                    addStructuredError(
                      rowErrors,
                      attributePath,
                      "INVALID_ENUM",
                      attributeRules?.["typeError"] ||
                        `Invalid value for attribute ${attributePath}, valid values are ${allEnumValues?.join(
                          ", ",
                        )}`,
                    );

                    addNextError = false;
                  }

                  break;
                }

                case "uuid":
                  if (!isUUID(attributeValue)) {
                    addStructuredError(
                      rowErrors,
                      attributePath,
                      "INVALID_UUID",
                      attributeRules?.["typeError"] ||
                        `Invalid UUID for attribute ${attributePath}`,
                    );

                    addNextError = false;
                  }

                  break;

                case "uuidv1":
                  if (!isUUIDv1(attributeValue)) {
                    addStructuredError(
                      rowErrors,
                      attributePath,
                      "INVALID_UUID_V1",
                      attributeRules?.["typeError"] ||
                        `Invalid v1 UUID for attribute ${attributePath}`,
                    );

                    addNextError = false;
                  }

                  break;

                case "uuidv3":
                  if (!isUUIDv3(attributeValue)) {
                    addStructuredError(
                      rowErrors,
                      attributePath,
                      "INVALID_UUID_V3",
                      attributeRules?.["typeError"] ||
                        `Invalid v3 UUID for attribute ${attributePath}`,
                    );

                    addNextError = false;
                  }

                  break;

                case "uuidv4":
                  if (!isUUIDv4(attributeValue)) {
                    addStructuredError(
                      rowErrors,
                      attributePath,
                      "INVALID_UUID_V4",
                      attributeRules?.["typeError"] ||
                        `Invalid v4 UUID for attribute ${attributePath}`,
                    );

                    addNextError = false;
                  }

                  break;

                case "uuidv5":
                  if (!isUUIDv5(attributeValue)) {
                    addStructuredError(
                      rowErrors,
                      attributePath,
                      "INVALID_UUID_V5",
                      attributeRules?.["typeError"] ||
                        `Invalid v5 UUID for attribute ${attributePath}`,
                    );

                    addNextError = false;
                  }

                  break;

                case "objectId":
                  if (!isObjectId(attributeValue)) {
                    addStructuredError(
                      rowErrors,
                      attributePath,
                      "INVALID_OBJECT_ID",
                      attributeRules?.["typeError"] ||
                        `Invalid ObjectId for attribute ${attributePath}`,
                    );

                    addNextError = false;
                  }

                  break;

                case "array":
                  if (!isArray(attributeValue)) {
                    addStructuredError(
                      rowErrors,
                      attributePath,
                      "INVALID_TYPE",
                      attributeRules?.["typeError"] ||
                        getInvalidTypeMessage(
                          attributeValue,
                          attributePath,
                          expectedType,
                        ),
                    );

                    addNextError = false;
                  }

                  break;

                case "object":
                  if (!isObject(attributeValue)) {
                    addStructuredError(
                      rowErrors,
                      attributePath,
                      "INVALID_TYPE",
                      attributeRules?.["typeError"] ||
                        getInvalidTypeMessage(
                          attributeValue,
                          attributePath,
                          expectedType,
                        ),
                    );

                    addNextError = false;
                  }

                  break;

                default:
                  break;
              }
            }
          }

          break;

        // ==================================================
        // MIN LENGTH
        // ==================================================
        case "minLength": {
          const minLength = attributeRules.minLength;

          if (addNextError) {
            if (attributeValue == null && nullAllowed) {
              addNextError = true;
            } else if (typeof attributeValue === "string") {
              if (
                minLength !== undefined &&
                attributeValue.length < minLength
              ) {
                addStructuredError(
                  rowErrors,
                  attributePath,
                  "MIN_LENGTH",
                  attributeRules?.["minLengthError"] ||
                    `${attributePath} should be minimum of ${minLength} character`,
                );

                addNextError = false;
              }
            } else {
              addStructuredError(
                rowErrors,
                attributePath,
                "INVALID_TYPE",
                `${attributePath} value should be a string type(minLength specified)`,
              );

              addNextError = false;
            }
          }

          break;
        }
        // ==================================================
        // MAX LENGTH
        // ==================================================

        case "maxLength": {
          const maxLength = attributeRules.maxLength;

          if (addNextError) {
            if (attributeValue == null && nullAllowed) {
              addNextError = true;
            } else if (typeof attributeValue === "string") {
              if (
                maxLength !== undefined &&
                attributeValue.length > maxLength
              ) {
                addStructuredError(
                  rowErrors,
                  attributePath,
                  "MAX_LENGTH",
                  attributeRules?.["maxLengthError"] ||
                    `${attributePath} can have maximum of ${maxLength} character`,
                );

                addNextError = false;
              }
            } else {
              addStructuredError(
                rowErrors,
                attributePath,
                "INVALID_TYPE",
                `${attributePath} value should be a string type(maxLength specified)`,
              );

              addNextError = false;
            }
          }

          break;
        }
        // ==================================================
        // PREVENT DECIMAL
        // ==================================================

        case "preventDecimal":
          if (addNextError) {
            if (attributeValue == null && nullAllowed) {
              addNextError = true;
            } else if (!isNumber(attributeValue)) {
              addStructuredError(
                rowErrors,
                attributePath,
                "INVALID_TYPE",
                `Invalid type for attribute ${attributePath}, required number value`,
              );

              addNextError = false;
            } else if (+attributeValue % 1 !== 0) {
              addStructuredError(
                rowErrors,
                attributePath,
                "DECIMAL_NOT_ALLOWED",
                attributeRules?.["preventDecimalError"] ||
                  `Decimal value not allowed in attribute ${attributePath}`,
              );

              addNextError = false;
            }
          }

          break;

        // ==================================================
        // MIN
        // ==================================================

        case "min": {
          const min = attributeRules.min;

          if (addNextError) {
            if (attributeValue == null && nullAllowed) {
              addNextError = true;
            } else if (!isNumber(attributeValue)) {
              addStructuredError(
                rowErrors,
                attributePath,
                "INVALID_TYPE",
                `Invalid type for attribute ${attributePath}, required number value`,
              );

              addNextError = false;
            } else if (min !== undefined && +attributeValue < min) {
              addStructuredError(
                rowErrors,
                attributePath,
                "MIN_VALUE",
                attributeRules?.["minError"] ||
                  `Minimum value ${min} is allowed in attribute ${attributePath}`,
              );

              addNextError = false;
            }
          }

          break;
        }
        // ==================================================
        // MAX
        // ==================================================
        case "max": {
          const max = attributeRules.max;

          if (addNextError) {
            if (attributeValue == null && nullAllowed) {
              addNextError = true;
            } else if (!isNumber(attributeValue)) {
              addStructuredError(
                rowErrors,
                attributePath,
                "INVALID_TYPE",
                `Invalid type for attribute ${attributePath}, required number value`,
              );

              addNextError = false;
            } else if (max !== undefined && +attributeValue > max) {
              addStructuredError(
                rowErrors,
                attributePath,
                "MAX_VALUE",
                attributeRules?.["maxError"] ||
                  `Maximum value ${max} is allowed in attribute ${attributePath}`,
              );

              addNextError = false;
            }
          }

          break;
        }
        // ==================================================
        // RANGE
        // ==================================================

        case "range": {
          const range = attributeRules.range;

          if (addNextError) {
            if (attributeValue == null && nullAllowed) {
              addNextError = true;
            } else if (!isNumber(attributeValue)) {
              addStructuredError(
                rowErrors,
                attributePath,
                "INVALID_TYPE",
                `Invalid type for attribute ${attributePath}, required number value`,
              );

              addNextError = false;
            } else if (range !== undefined) {
              const [min, max] = range.split("-");

              if (+attributeValue < +min || +attributeValue > +max) {
                addStructuredError(
                  rowErrors,
                  attributePath,
                  "OUT_OF_RANGE",
                  attributeRules?.["rangeError"] ||
                    `Attribute ${attributePath} should have a value between ${min} and ${max}`,
                );

                addNextError = false;
              }
            }
          }

          break;
        }

        // ==================================================
        // NESTED OBJECT
        // ==================================================
        case "objectAttr": {
          const objectAttr = attributeRules.objectAttr;

          if (
            addNextError &&
            attributeValue !== null &&
            typeof attributeValue === "object" &&
            !Array.isArray(attributeValue) &&
            objectAttr !== undefined
          ) {
            const nestedResult = perfectPayloadStructured(
              attributeValue as Record<string, unknown>,
              objectAttr,
              { statusCode: 200, valid: true },
              {
                statusCode: 400,
                valid: false,
                message: "One or more attribute values are invalid",
              },
              attributePath,
              options,
            );

            if (nestedResult.valid === true) {
              attributeValue = nestedResult.validatedPayload;
            } else {
              rowErrors = [...rowErrors, ...nestedResult.errors];
            }
          }

          break;
        }
        // ==================================================
        // DEPENDENCY
        // ==================================================

        case "dependency": {
          const dependency = attributeRules.dependency;

          if (addNextError && dependency !== undefined) {
            const allDependencyAttr = Object.keys(dependency);

            for (const attr of allDependencyAttr) {
              const dependencyRule = dependency[attr];

              if (typeof dependencyRule?.setDependencyRule === "function") {
                const newRule = dependencyRule.setDependencyRule(
                  attributeValue,
                  data?.[attr],
                );

                const newData: Record<string, unknown> = {
                  [attributeName]: attributeValue,
                };

                if (Object.keys(data ?? {}).includes(attr)) {
                  newData[attr] = data?.[attr];
                }

                const dependencyResult = perfectPayloadStructured(
                  newData,
                  {
                    [attr]: newRule,
                  },
                  {
                    statusCode: 200,
                    valid: true,
                  },
                  {
                    statusCode: 400,
                    valid: false,
                    message: "One or more attribute values are invalid",
                  },
                  basePath,
                );

                if (dependencyResult.valid === false) {
                  rowErrors = [...rowErrors, ...dependencyResult.errors];
                }

                addNextError = true;
              } else {
                throw new Error(
                  `perfect-payload:- function setDependencyRule not found in ${attr} dependency `,
                );
              }
            }
          }

          break;
        }
        // ==================================================
        // CUSTOM VALIDATOR
        // ==================================================

        case "customValidator":
          if (
            !skipCustomValidator &&
            addNextError &&
            attrExist &&
            attributeValue !== null
          ) {
            const validator = attributeRules?.[ruleName];

            if (typeof validator !== "function") {
              throw new Error(
                `perfect-payload:- customValidator must be a function for attribute ${attributePath}`,
              );
            }

            const validationResult = validator(attributeValue, data);
            if (
              validationResult &&
              typeof validationResult === "object" &&
              "then" in validationResult &&
              typeof validationResult.then === "function"
            ) {
              throw new Error(
                `perfect-payload:- customValidator must be synchronous for attribute ${attributePath}`,
              );
            }

            if (validationResult !== true) {
              addStructuredError(
                rowErrors,
                attributePath,
                attributeRules?.["customValidatorCode"] ||
                  "CUSTOM_VALIDATION_FAILED",
                attributeRules?.["customValidatorError"] ||
                  `Custom validation failed for attribute ${attributePath}`,
              );

              addNextError = false;
            }
          }

          break;

        default:
          break;
      }
    }

    if (
      attrExist &&
      !rowErrors.some(
        (error) =>
          error.path === attributePath ||
          error.path.startsWith(`${attributePath}.`) ||
          error.path.startsWith(`${attributePath}[`),
      )
    ) {
      validatedPayload[attributeName] = attributeValue;
    }
  }

  // UNKNOWN FIELD HANDLING
  if (unknownFields === "allow") {
    for (const attributeName in data) {
      if (
        Object.prototype.hasOwnProperty.call(data, attributeName) &&
        !Object.prototype.hasOwnProperty.call(dataValidationRule, attributeName)
      ) {
        validatedPayload[attributeName] = data[attributeName];
      }
    }
  }

  if (unknownFields === "reject") {
    for (const attributeName in data) {
      if (
        Object.prototype.hasOwnProperty.call(data, attributeName) &&
        !Object.prototype.hasOwnProperty.call(dataValidationRule, attributeName)
      ) {
        const path = basePath ? `${basePath}.${attributeName}` : attributeName;

        rowErrors.push({
          path,
          code: "UNKNOWN_FIELD",
          message: `Unknown field ${path} is not allowed`,
        });
      }
    }
  }

  // INVALID RESPONSE
  if (rowErrors.length > 0) {
    return {
      ...inValidPayloadResponse,
      errors: rowErrors,
    };
  }

  // VALID RESPONSE
  return {
    ...validPayloadResponse,
    validatedPayload: validatedPayload as T,
  };
}

function addStructuredError(
  errors: ValidationError[],
  path: string,
  code: string,
  message: string,
): void {
  errors.push({
    path,
    code,
    message,
  });
}

function getAttributePath(
  attributeName: string,
  attributeRules: { path?: string } | undefined,
  basePath: string,
): string {
  const customPath = attributeRules?.path;

  if (customPath) {
    return `${customPath}.${attributeName}`;
  }

  if (basePath) {
    return `${basePath}.${attributeName}`;
  }

  return attributeName;
}

function replaceRootPath(
  currentPath: string,
  currentRoot: string,
  replacementRoot: string,
): string {
  if (currentPath === currentRoot) {
    return replacementRoot;
  }

  if (currentPath.startsWith(`${currentRoot}.`)) {
    return `${replacementRoot}${currentPath.slice(currentRoot.length)}`;
  }

  if (currentPath.startsWith(`${currentRoot}[`)) {
    return `${replacementRoot}${currentPath.slice(currentRoot.length)}`;
  }

  return replacementRoot;
}
function getInvalidTypeMessage(
  value: unknown,
  attributePath: string,
  expectedType: string,
): string {
  return `Invalid type for attribute ${attributePath}, required ${expectedType} value`;
  // return `Invalid ${typeof value} value(${value}) found in attribute ${attributePath}, required ${expectedType} value`;
}

function isNumber(value: unknown): value is number {
  return typeof value == "number";
}

function isString(value: unknown): value is string {
  return typeof value == "string";
}

function isBoolean(value: unknown): value is boolean {
  return typeof value == "boolean";
}

function isArray(value: unknown): value is unknown[] {
  return Array.isArray(value);
}

function isObject(value: unknown): boolean {
  return typeof value == "object";
}
function isValidEmail(email: unknown): boolean {
  const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  return emailRegex.test(String(email));
}

function isValidUrl(url: unknown): boolean {
  const urlRegex =
    /^(https?:\/\/)([a-zA-Z0-9.-]+\.[a-zA-Z]{2,})(:[0-9]+)?(\/[^\s]*)?(\?[^\s]*)?$/;
  return urlRegex.test(String(url));
}

function isUUID(uuid: unknown): boolean {
  const uuidRegex =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

  return uuidRegex.test(String(uuid));
}

function isUUIDv1(uuid: unknown): boolean {
  const uuidRegex =
    /^[0-9a-f]{8}-[0-9a-f]{4}-1[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

  return uuidRegex.test(String(uuid));
}

function isUUIDv3(uuid: unknown): boolean {
  const uuidRegex =
    /^[0-9a-f]{8}-[0-9a-f]{4}-3[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

  return uuidRegex.test(String(uuid));
}

function isUUIDv4(uuid: unknown): boolean {
  const uuidRegex =
    /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

  return uuidRegex.test(String(uuid));
}

function isUUIDv5(uuid: unknown): boolean {
  const uuidRegex =
    /^[0-9a-f]{8}-[0-9a-f]{4}-5[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

  return uuidRegex.test(String(uuid));
}

function isObjectId(id: unknown): boolean {
  return /^[0-9a-fA-F]{24}$/.test(String(id));
}

function isPassedRegex(
  reExpression: RegExp | undefined,
  value: unknown,
): boolean {
  return reExpression?.test(String(value)) ?? false;
}

async function runAsyncCustomValidators(
  data: Record<string, unknown> = {},
  dataValidationRule: ValidationRules = {},
  basePath: string = "",
): Promise<ValidationError[]> {
  const errors: ValidationError[] = [];

  for (const attributeName in dataValidationRule) {
    const attributeRules = dataValidationRule?.[attributeName];

    const attrExist = Object.keys(data ?? {}).includes(attributeName);

    if (!attrExist) {
      continue;
    }

    const attributeValue = data?.[attributeName];

    const attributePath = getAttributePath(
      attributeName,
      attributeRules,
      basePath,
    );

    // customValidator
    if (
      Object.prototype.hasOwnProperty.call(
        attributeRules ?? {},
        "customValidator",
      )
    ) {
      if (typeof attributeRules.customValidator !== "function") {
        throw new Error(
          `perfect-payload:- customValidator must be a function for attribute ${attributePath}`,
        );
      }

      if (attributeValue !== null) {
        const validationResponse = await attributeRules.customValidator(
          attributeValue,
          data,
        );

        if (validationResponse !== true) {
          addStructuredError(
            errors,
            attributePath,
            attributeRules?.customValidatorCode || "CUSTOM_VALIDATION_FAILED",
            attributeRules?.customValidatorError ||
              `Custom validation failed for attribute ${attributePath}`,
          );
        }
      }
    }

    // nested objectAttr
    if (
      attributeValue !== null &&
      typeof attributeValue === "object" &&
      !Array.isArray(attributeValue) &&
      attributeRules?.objectAttr
    ) {
      const nestedErrors = await runAsyncCustomValidators(
        attributeValue as Record<string, unknown>,
        attributeRules.objectAttr,
        attributePath,
      );

      errors.push(...nestedErrors);
    }

    // nested elementConstraints
    if (Array.isArray(attributeValue) && attributeRules?.elementConstraints) {
      for (
        let elementIndex = 0;
        elementIndex < attributeValue.length;
        elementIndex++
      ) {
        const element = attributeValue[elementIndex];

        const elementErrors = await runAsyncCustomValidators(
          {
            [attributeName]: element,
          },
          {
            [attributeName]: attributeRules.elementConstraints,
          },
        );

        for (const elementError of elementErrors) {
          const indexedPath = replaceRootPath(
            elementError.path,
            attributeName,
            `${attributePath}[${elementIndex}]`,
          );

          errors.push({
            ...elementError,
            path: indexedPath,

            message:
              elementError.code === "CUSTOM_VALIDATION_FAILED" &&
              elementError.message ===
                `Custom validation failed for attribute ${elementError.path}`
                ? `Custom validation failed for attribute ${indexedPath}`
                : elementError.message,
          });
        }
      }
    }
  }

  return errors;
}
