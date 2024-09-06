export function perfectPayloadV1(
  data = {},
  dataValidationRule = {},
  validPayloadResponse = { statusCode: 200, valid: true },
  inValidPayloadResponse = {
    statusCode: 400,
    valid: false,
    message: "One or more attribute values are invalid",
  }
) {
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
                `${attributePath} is mandatory`
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
                  `value null/'' not valid for attribute ${attributePath}`
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
                  `value {} not valid for attribute ${attributePath}`
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
                  `${attributePath} cannot be an empty array`
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
                  { [attributeName]: attributeRules[ruleName] }
                );
                if (statusCode == 400) {
                  elementError = errors?.[0];
                  // addNextError = false;
                  break;
                }
              }
              if (elementError) {
                rowErrors.push(
                  attributeRules?.["elementConstraintsError"] || elementError
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
                  `${attributePath} failed to pass the regex ${attributeRules[ruleName]}`
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
                        } value`
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
                        } value`
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
                        } value`
                    );
                    addNextError = false;
                  }
                  break;
                case "email":
                  if (!isValidEmail(attributeValue)) {
                    rowErrors.push(
                      attributeRules?.["typeError"] ||
                        `Invalid email ID(${attributeValue}) found in attribute ${attributePath}`
                    );
                    addNextError = false;
                  }
                  break;

                case "url":
                  if (!isValidUrl(attributeValue)) {
                    rowErrors.push(
                      attributeRules?.["typeError"] ||
                        `Invalid URL format(${attributeValue}) found in attribute ${attributePath}`
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
                            ", "
                          )}`
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
                        `Invalid UUID(${attributeValue}) found in attribute ${attributePath}`
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
                        `Invalid v1 UUID(${attributeValue}) found in attribute ${attributePath}`
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
                        `Invalid v3 UUID(${attributeValue}) found in attribute ${attributePath}`
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
                        `Invalid v4 UUID(${attributeValue}) found in attribute ${attributePath}`
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
                        `Invalid v5 UUID(${attributeValue}) found in attribute ${attributePath}`
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
                          `Invalid ObjectId(${attributeValue}) found in attribute ${attributePath}`
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
                        } value`
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
                        } value`
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
                    `${attributePath} should be minimum of ${attributeRules[ruleName]} character`
                );
              addNextError = false;
            } else {
              rowErrors.push(
                `${attributePath} value should be a string type(minLength specified)`
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
                    `${attributePath} can have maximum of ${attributeRules[ruleName]} character`
                );
              addNextError = false;
            } else {
              rowErrors.push(
                `${attributePath} value should be a string type(maxLength specified)`
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
                `Invalid ${typeof attributeValue} value(${attributeValue}) found in attribute ${attributePath}, required number value`
              );
              addNextError = false;
            } else if (+attributeValue % 1 !== 0) {
              rowErrors.push(
                attributeRules?.["preventDecimalError"] ||
                  `Decimal value not allowed in attribute ${attributePath}(${attributeValue})`
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
                `Invalid ${typeof attributeValue} value(${attributeValue}) found in attribute ${attributePath}, required number value`
              );
              addNextError = false;
            } else if (+attributeValue < +attributeRules[ruleName]) {
              rowErrors.push(
                attributeRules?.["minError"] ||
                  `minimum value ${
                    attributeRules[ruleName]
                  } is allowed in attribute ${attributePath}, found value ${
                    data[attributeName] ?? "Nil"
                  }`
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
                `Invalid ${typeof attributeValue} value(${attributeValue}) found in attribute ${attributePath}, required number value`
              );
              addNextError = false;
            } else if (+attributeValue > +attributeRules[ruleName]) {
              rowErrors.push(
                attributeRules?.["maxError"] ||
                  `maximum value ${
                    attributeRules[ruleName]
                  } is allowed in attribute ${attributePath}, found value ${
                    data[attributeName] ?? "Nil"
                  }`
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
                `Invalid ${typeof attributeValue} value(${attributeValue}) found in attribute ${attributePath}, required number value`
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
                    `Invalid values(${attributeValue}) found in attribute ${attributePath}, value should be between ${min} and ${max} `
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
              objectAttrRules
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
                  `perfect-payload:- function setDependencyRule not found in ${attr} dependency `
                );
              }
            }
          }
          break;
        default:
          break;
      }
    }
  }

  if (rowErrors?.length) {
    return { ...inValidPayloadResponse, errors: rowErrors };
  } else {
    return validPayloadResponse;
  }
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
