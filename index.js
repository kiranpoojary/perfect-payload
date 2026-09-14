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
  data = {},
  dataValidationRule = {},
  validPayloadResponse = { statusCode: 200, valid: true },
  inValidPayloadResponse = {
    statusCode: 400,
    valid: false,
    message: "One or more attribute values are invalid",
  },
) {
  showPerfectPayloadV1DeprecationWarning();
  let validatedPayload = {};
  let rowErrors = [];
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
            const objectAttrRules = {};
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

export function perfectPayload(
  data = {},
  dataValidationRule = {},
  validPayloadResponse = { statusCode: 200, valid: true },
  inValidPayloadResponse = {
    statusCode: 400,
    valid: false,
    message: "One or more attribute values are invalid",
  },
) {
  return perfectPayloadStructured(
    data,
    dataValidationRule,
    validPayloadResponse,
    inValidPayloadResponse,
  );
}

function perfectPayloadStructured(
  data = {},
  dataValidationRule = {},
  validPayloadResponse = { statusCode: 200, valid: true },
  inValidPayloadResponse = {
    statusCode: 400,
    valid: false,
    message: "One or more attribute values are invalid",
  },
  basePath = "",
) {
  let validatedPayload = {};
  let rowErrors = [];

  for (const attributeName in dataValidationRule) {
    let addNextError = true;

    const attributeRules = dataValidationRule?.[attributeName];

    const attributePath = getAttributePath(
      attributeName,
      attributeRules,
      basePath,
    );

    const attributeValue = data?.[attributeName] ?? null;

    const nullAllowed =
      dataValidationRule?.[attributeName]?.["allowNull"] ?? true;

    const isMandatoryField = attributeRules?.["mandatory"] ?? false;

    const attrExist = Object.keys(data ?? {}).includes(attributeName);

    for (const ruleName in attributeRules) {
      switch (ruleName) {
        // ==================================================
        // MANDATORY
        // ==================================================

        case "mandatory":
          if (isMandatoryField && !attrExist) {
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
          if (addNextError && attributeValue == null) {
            if (!attributeRules?.[ruleName]) {
              addNextError = false;

              addStructuredError(
                rowErrors,
                attributePath,
                "NULL_NOT_ALLOWED",
                attributeRules?.["allowNullError"] ||
                  `value null/'' not valid for attribute ${attributePath}`,
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
              let elementError = null;

              for (
                let elementIndex = 0;
                elementIndex < attributeValue.length;
                elementIndex++
              ) {
                const element = attributeValue[elementIndex];

                const { errors = [] } = perfectPayloadStructured(
                  {
                    [attributeName]: element,
                  },
                  {
                    [attributeName]: attributeRules[ruleName],
                  },
                );

                if (errors.length > 0) {
                  const firstElementError = errors[0];

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
                    };
                  }

                  break;
                }
              }

              if (elementError) {
                rowErrors.push(elementError);
                addNextError = false;
              }
            }
          }

          break;

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
                  if (!isNumber(attributeValue)) {
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
                        `Invalid URL format(${attributeValue}) found in attribute ${attributePath}`,
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
                        `Invalid value(${attributeValue}) found in attribute ${attributePath}, valid values are ${allEnumValues?.join(
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
                        `Invalid UUID(${attributeValue}) found in attribute ${attributePath}`,
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
                        `Invalid v1 UUID(${attributeValue}) found in attribute ${attributePath}`,
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
                        `Invalid v3 UUID(${attributeValue}) found in attribute ${attributePath}`,
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
                        `Invalid v4 UUID(${attributeValue}) found in attribute ${attributePath}`,
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
                        `Invalid v5 UUID(${attributeValue}) found in attribute ${attributePath}`,
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
                        `Invalid ObjectId(${attributeValue}) found in attribute ${attributePath}`,
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

        case "minLength":
          if (addNextError) {
            if (attributeValue == null && nullAllowed) {
              addNextError = true;
            } else if (typeof attributeValue === "string") {
              if (attributeValue.length < +attributeRules[ruleName]) {
                addStructuredError(
                  rowErrors,
                  attributePath,
                  "MIN_LENGTH",
                  attributeRules?.["minLengthError"] ||
                    `${attributePath} should be minimum of ${attributeRules[ruleName]} character`,
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

        // ==================================================
        // MAX LENGTH
        // ==================================================

        case "maxLength":
          if (addNextError) {
            if (attributeValue == null && nullAllowed) {
              addNextError = true;
            } else if (typeof attributeValue === "string") {
              if (attributeValue.length > +attributeRules[ruleName]) {
                addStructuredError(
                  rowErrors,
                  attributePath,
                  "MAX_LENGTH",
                  attributeRules?.["maxLengthError"] ||
                    `${attributePath} can have maximum of ${attributeRules[ruleName]} character`,
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
                `Invalid ${typeof attributeValue} value(${attributeValue}) found in attribute ${attributePath}, required number value`,
              );

              addNextError = false;
            } else if (+attributeValue % 1 !== 0) {
              addStructuredError(
                rowErrors,
                attributePath,
                "DECIMAL_NOT_ALLOWED",
                attributeRules?.["preventDecimalError"] ||
                  `Decimal value not allowed in attribute ${attributePath}(${attributeValue})`,
              );

              addNextError = false;
            }
          }

          break;

        // ==================================================
        // MIN
        // ==================================================

        case "min":
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
            } else if (+attributeValue < +attributeRules[ruleName]) {
              addStructuredError(
                rowErrors,
                attributePath,
                "MIN_VALUE",
                attributeRules?.["minError"] ||
                  `Minimum value ${attributeRules[ruleName]} is allowed in attribute ${attributePath}`,
              );

              addNextError = false;
            }
          }

          break;
        // ==================================================
        // MAX
        // ==================================================
        case "max":
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
            } else if (+attributeValue > +attributeRules[ruleName]) {
              addStructuredError(
                rowErrors,
                attributePath,
                "MAX_VALUE",
                attributeRules?.["maxError"] ||
                  `Maximum value ${attributeRules[ruleName]} is allowed in attribute ${attributePath}`,
              );

              addNextError = false;
            }
          }

          break;

        // ==================================================
        // RANGE
        // ==================================================

        case "range":
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
            } else {
              const [min, max] = attributeRules[ruleName].split("-");

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
        // ==================================================
        // NESTED OBJECT
        // ==================================================

        case "objectAttr":
          if (addNextError) {
            const { errors = [] } = perfectPayloadStructured(
              attributeValue,
              attributeRules[ruleName],
              { statusCode: 200, valid: true },
              {
                statusCode: 400,
                valid: false,
                message: "One or more attribute values are invalid",
              },
              attributePath,
            );

            rowErrors = [...rowErrors, ...errors];

            addNextError = true;
          }

          break;

        // ==================================================
        // DEPENDENCY
        // ==================================================

        case "dependency":
          if (addNextError) {
            const allDependencyAttr = Object.keys(attributeRules?.[ruleName]);

            for (const attr of allDependencyAttr) {
              const dependencyRule = attributeRules?.[ruleName]?.[attr];

              if (typeof dependencyRule?.setDependencyRule === "function") {
                const newRule = dependencyRule.setDependencyRule(
                  attributeValue,
                  data?.[attr],
                );

                let newData = {
                  [attributeName]: attributeValue,
                };

                if (Object.keys(data ?? {}).includes(attr)) {
                  newData = {
                    ...newData,
                    [attr]: data?.[attr],
                  };
                }

                const { errors = [] } = perfectPayloadStructured(
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

  if (rowErrors.length > 0) {
    return {
      ...inValidPayloadResponse,
      errors: rowErrors,
    };
  }

  return {
    ...validPayloadResponse,
    validatedPayload,
  };
}

function addStructuredError(errors, path, code, message) {
  errors.push({
    path,
    code,
    message,
  });
}

function getAttributePath(attributeName, attributeRules, basePath) {
  const customPath = attributeRules?.path;

  if (customPath) {
    return `${customPath}.${attributeName}`;
  }

  if (basePath) {
    return `${basePath}.${attributeName}`;
  }

  return attributeName;
}

function replaceRootPath(currentPath, currentRoot, replacementRoot) {
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

function getInvalidTypeMessage(value, attributePath, expectedType) {
  return `Invalid type for attribute ${attributePath}, required ${expectedType} value`;
  // return `Invalid ${typeof value} value(${value}) found in attribute ${attributePath}, required ${expectedType} value`;
}

function isNumber(value) {
  return typeof value == "number";
}

function isString(value) {
  return typeof value == "string";
}

function isBoolean(value) {
  return typeof value == "boolean";
}

function isArray(value) {
  return Array.isArray(value);
}

function isObject(value) {
  return typeof value == "object";
}

function isValidEmail(email) {
  const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  return emailRegex.test(email);
}

function isValidUrl(url) {
  const urlRegex =
    /^(https?:\/\/)([a-zA-Z0-9.-]+\.[a-zA-Z]{2,})(:[0-9]+)?(\/[^\s]*)?(\?[^\s]*)?$/;
  return urlRegex.test(url);
}

function isUUID(uuid) {
  const uuidRegex =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

  return uuidRegex.test(uuid);
}

function isUUIDv1(uuid) {
  const uuidRegex =
    /^[0-9a-f]{8}-[0-9a-f]{4}-1[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

  return uuidRegex.test(uuid);
}

function isUUIDv3(uuid) {
  const uuidRegex =
    /^[0-9a-f]{8}-[0-9a-f]{4}-3[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

  return uuidRegex.test(uuid);
}

function isUUIDv4(uuid) {
  const uuidRegex =
    /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

  return uuidRegex.test(uuid);
}

function isUUIDv5(uuid) {
  const uuidRegex =
    /^[0-9a-f]{8}-[0-9a-f]{4}-5[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

  return uuidRegex.test(uuid);
}

function isObjectId(id) {
  return /^[0-9a-fA-F]{24}$/.test(id);
}

function isPassedRegex(reExpression, value) {
  return reExpression.test(value);
}
