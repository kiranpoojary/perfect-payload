import { perfectPayload } from "../../dist/index.js";

const validationRule = {
  // ======================================================
  // REQUIRED / NULL / EMPTY
  // ======================================================

  requiredField: {
    mandatory: true,
    type: "string",
  },

  nullNotAllowed: {
    mandatory: true,
    allowNull: false,
    type: "string",
  },

  emptyObjectNotAllowed: {
    type: "object",
    allowEmptyObject: false,
  },

  emptyArrayNotAllowed: {
    type: "array",
    allowEmptyArray: false,
  },

  // ======================================================
  // TRANSFORMATIONS
  // ======================================================
  transformArray: {
    type: "array",

    elementConstraints: {
      type: "string",
      trim: true,
      uppercase: true,
    },
  },
  transformNested: {
    type: "object",

    objectAttr: {
      name: {
        type: "string",
        trim: true,
        uppercase: true,
      },

      code: {
        type: "string",
        trim: true,
        transform: (value) => value.replace("-", ""),
      },
    },
  },

  transformTrim: {
    type: "string",
    trim: true,
  },

  transformLowercase: {
    type: "string",
    lowercase: true,
  },

  transformUppercase: {
    type: "string",
    uppercase: true,
  },

  transformCombined: {
    type: "string",
    trim: true,
    uppercase: true,
  },

  transformCustom: {
    type: "string",
    transform: (value) => value.replace(/\s+/g, ""),
  },

  transformPayload: {
    type: "number",
    transform: (value, payload) => value * payload.transformMultiplier,
  },

  transformMultiplier: {
    type: "number",
  },
  // ======================================================
  // TRANSFORM TYPE CONVERSION
  // ======================================================

  transformStringToNumber: {
    transform: (value) => Number(value),
    type: "number",
    min: 100,
    max: 500,
  },

  transformNumberToString: {
    transform: (value) => String(value),
    type: "string",
    minLength: 3,
  },

  // ======================================================
  // TRANSFORM BEFORE VALIDATION
  // ======================================================

  transformBeforeRegex: {
    type: "string",
    trim: true,
    uppercase: true,
    regex: /^PP-\d{3}$/,
  },

  transformBeforeLength: {
    type: "string",
    trim: true,
    minLength: 5,
    maxLength: 5,
  },

  transformBeforeCustomValidator: {
    type: "string",
    trim: true,
    uppercase: true,

    customValidator: (value) => {
      return value === "KIRAN";
    },

    customValidatorCode: "INVALID_TRANSFORMED_VALUE",
    customValidatorError: "Transformed value must be KIRAN",
  },

  transformTypeCustomValidator: {
    transform: (value) => Number(value),
    type: "number",

    customValidator: (value) => {
      return typeof value === "number" && value === 500;
    },

    customValidatorCode: "INVALID_TRANSFORMED_NUMBER",
    customValidatorError: "Value must transform to number 500",
  },
  // ======================================================
  // CUSTOM VALIDATOR START
  // ======================================================

  customValidatorDefault: {
    type: "string",
    customValidator: (value) => value === "VALID",
  },

  customValidatorWithError: {
    type: "number",
    customValidator: (value) => value % 2 === 0,
    customValidatorError: "Value must be an even number",
  },

  customValidatorWithCode: {
    type: "string",
    customValidator: (value) => !value.toLowerCase().includes("admin"),
    customValidatorCode: "RESERVED_USERNAME",
    customValidatorError: "Username cannot contain admin",
  },

  customValidatorPayload: {
    type: "number",
    customValidator: (value, payload) => value <= payload.customValidatorLimit,
    customValidatorCode: "LIMIT_EXCEEDED",
    customValidatorError: "Value cannot exceed customValidatorLimit",
  },

  customValidatorLimit: {
    type: "number",
  },

  customValidatorNested: {
    type: "object",
    objectAttr: {
      code: {
        type: "string",
        customValidator: (value) => value.startsWith("PP-"),
        customValidatorCode: "INVALID_CUSTOM_CODE",
        customValidatorError: "Code must start with PP-",
      },
    },
  },

  customValidatorArray: {
    type: "array",
    elementConstraints: {
      type: "number",
      customValidator: (value) => value % 2 === 0,
      customValidatorCode: "NOT_EVEN",
      customValidatorError: "Array value must be even",
    },
  },

  customValidatorOptional: {
    type: "string",
    customValidator: () => {
      throw new Error(
        "customValidator should not execute for a missing optional field",
      );
    },
  },

  // ======================================================
  // BASIC TYPES
  // ======================================================

  numberType: {
    type: "number",
  },

  stringType: {
    type: "string",
  },

  booleanType: {
    type: "boolean",
  },

  arrayType: {
    type: "array",
  },

  objectType: {
    type: "object",
  },

  // ======================================================
  // SPECIAL TYPES
  // ======================================================

  emailType: {
    type: "email",
  },

  urlType: {
    type: "url",
  },

  enumType: {
    type: "enum",
    enumValues: ["ACTIVE", "INACTIVE", 100],
  },

  uuidType: {
    type: "uuid",
  },

  uuidV1Type: {
    type: "uuidv1",
  },

  uuidV3Type: {
    type: "uuidv3",
  },

  uuidV4Type: {
    type: "uuidv4",
  },

  uuidV5Type: {
    type: "uuidv5",
  },

  objectIdType: {
    type: "objectId",
  },

  // ======================================================
  // REGEX
  // ======================================================

  regexField: {
    type: "string",
    regex: /^[A-Z]{3}[0-9]{3}$/,
  },

  // ======================================================
  // STRING LENGTH
  // ======================================================

  minLengthField: {
    type: "string",
    minLength: 5,
  },

  maxLengthField: {
    type: "string",
    maxLength: 5,
  },

  // ======================================================
  // NUMBER VALIDATIONS
  // ======================================================

  integerField: {
    type: "number",
    preventDecimal: true,
  },

  minField: {
    type: "number",
    min: 10,
  },

  maxField: {
    type: "number",
    max: 100,
  },

  rangeField: {
    type: "number",
    range: "10-20",
  },

  // ======================================================
  // ARRAY ELEMENT CONSTRAINTS
  // ======================================================

  marks: {
    type: "array",
    allowEmptyArray: false,

    elementConstraints: {
      allowNull: false,
      type: "number",
      range: "0-100",
    },
  },

  // ======================================================
  // NESTED OBJECT
  // ======================================================

  address: {
    mandatory: true,
    type: "object",
    allowEmptyObject: false,

    objectAttr: {
      country: {
        mandatory: true,
        allowNull: false,
        type: "string",
      },

      city: {
        mandatory: true,
        type: "string",
        minLength: 3,
      },

      zip: {
        mandatory: true,
        type: "string",
        regex: /^[0-9]{6}$/,
      },

      location: {
        mandatory: true,
        type: "object",
        allowEmptyObject: false,

        objectAttr: {
          latitude: {
            mandatory: true,
            type: "number",
          },

          longitude: {
            mandatory: true,
            type: "number",
          },
        },
      },
    },
  },

  // ======================================================
  // DEPENDENCY
  // ======================================================

  minSalary: {
    mandatory: true,
    type: "number",
    min: 1,

    dependency: {
      maxSalary: {
        setDependencyRule: (minSalary, maxSalary) => ({
          mandatory: true,
          type: "number",
          min: minSalary + 1,
          minError: "maxSalary must be more than minSalary",
        }),
      },
    },
  },

  maxSalary: {
    mandatory: true,
    type: "number",

    dependency: {
      minSalary: {
        setDependencyRule: (maxSalary, minSalary) => ({
          mandatory: true,
          type: "number",
          max: maxSalary - 1,
          maxError: "minSalary must be less than maxSalary",
        }),
      },
    },
  },

  // ======================================================
  // CUSTOM ERROR MESSAGES
  // ======================================================

  customMandatoryError: {
    mandatory: true,
    mandatoryError: "CUSTOM_REQUIRED_ERROR",
  },

  customNullError: {
    mandatory: true,
    allowNull: false,
    allowNullError: "CUSTOM_NULL_ERROR",
  },

  customEmptyObjectError: {
    type: "object",
    allowEmptyObject: false,
    emptyObjectError: "CUSTOM_EMPTY_OBJECT_ERROR",
  },

  customEmptyArrayError: {
    type: "array",
    allowEmptyArray: false,
    emptyArrayError: "CUSTOM_EMPTY_ARRAY_ERROR",
  },

  customElementConstraintError: {
    type: "array",

    elementConstraints: {
      type: "number",
    },

    elementConstraintsError: "CUSTOM_ARRAY_ELEMENT_ERROR",
  },

  customRegexError: {
    regex: /^[A-Z]+$/,
    regexError: "CUSTOM_REGEX_ERROR",
  },

  customTypeError: {
    type: "number",
    typeError: "CUSTOM_TYPE_ERROR",
  },

  customMinLengthError: {
    type: "string",
    minLength: 5,
    minLengthError: "CUSTOM_MIN_LENGTH_ERROR",
  },

  customMaxLengthError: {
    type: "string",
    maxLength: 5,
    maxLengthError: "CUSTOM_MAX_LENGTH_ERROR",
  },

  customDecimalError: {
    type: "number",
    preventDecimal: true,
    preventDecimalError: "CUSTOM_DECIMAL_ERROR",
  },

  customMinError: {
    type: "number",
    min: 10,
    minError: "CUSTOM_MIN_ERROR",
  },

  customMaxError: {
    type: "number",
    max: 10,
    maxError: "CUSTOM_MAX_ERROR",
  },

  customRangeError: {
    type: "number",
    range: "1-10",
    rangeError: "CUSTOM_RANGE_ERROR",
  },
};

// ========================================================
// INVALID PAYLOAD
// ========================================================

const invalidPayload = {
  // requiredField intentionally missing
  // requiredField: "hello",

  // CUSTOM VALIDATOR START -------------

  customValidatorDefault: "INVALID",

  customValidatorWithError: 5,

  customValidatorWithCode: "admin_kiran",

  customValidatorPayload: 150,

  customValidatorLimit: 100,

  customValidatorNested: {
    code: "INVALID",
  },

  // index 1 should fail
  customValidatorArray: [2, 3, 4],

  // CUSTOM VALIDATOR END--------------

  nullNotAllowed: null,

  emptyObjectNotAllowed: {},

  emptyArrayNotAllowed: [],

  numberType: "100",

  stringType: 100,

  booleanType: "true",

  arrayType: {},

  objectType: "object",

  emailType: "invalid-email",

  urlType: "google.com",

  enumType: "BLOCKED",

  uuidType: "invalid-uuid",

  // Intentionally incorrect UUID versions
  uuidV1Type: "550e8400-e29b-41d4-a716-446655440000",

  uuidV3Type: "550e8400-e29b-41d4-a716-446655440000",

  uuidV4Type: "550e8400-e29b-11d4-a716-446655440000",

  uuidV5Type: "550e8400-e29b-41d4-a716-446655440000",

  objectIdType: "123456",

  regexField: "abc123",

  minLengthField: "abc",

  maxLengthField: "abcdefgh",

  integerField: 10.5,

  minField: 5,

  maxField: 150,

  rangeField: 50,

  // index 2 must fail with OUT_OF_RANGE
  marks: [50, 75, 150],

  address: {
    country: null,

    city: "NY",

    zip: "ABC",

    location: {
      latitude: "12.9716",
      longitude: 77.5946,
    },
  },

  // Both dependencies should fail
  minSalary: 50000,
  maxSalary: 40000,

  // customMandatoryError intentionally missing

  customNullError: null,

  customEmptyObjectError: {},

  customEmptyArrayError: [],

  // index 1 intentionally wrong
  customElementConstraintError: [1, "invalid", 3],

  customRegexError: "abc123",

  customTypeError: "100",

  customMinLengthError: "abc",

  customMaxLengthError: "abcdefgh",

  customDecimalError: 10.5,

  customMinError: 5,

  customMaxError: 50,

  customRangeError: 100,
};

// ========================================================
// VALID PAYLOAD
// ========================================================

const validPayload = {
  requiredField: "available",
  nullNotAllowed: "hello",

  emptyObjectNotAllowed: {
    value: true,
  },
  //TRANSFORM
  transformTypeCustomValidator: "500",
  transformArray: ["  apple  ", "banana", "  mango"],
  transformNested: {
    name: "   kiran   ",
    code: "  PP-100  ",
  },
  transformTrim: "   Kiran Poojary   ",
  transformLowercase: "KIRAN",
  transformUppercase: "kiran",
  transformCombined: "   pp-100   ",
  transformCustom: "98765 43210",
  transformPayload: 100,
  transformMultiplier: 2,
  transformBeforeRegex: "   pp-100   ",
  transformBeforeLength: "   KIRAN   ",
  transformBeforeCustomValidator: "   kiran   ",
  transformStringToNumber: "250",
  transformNumberToString: 12345,
  // CUSTOM VALIDATOR START

  customValidatorDefault: "VALID",
  customValidatorWithError: 10,
  customValidatorWithCode: "kiran",
  customValidatorPayload: 50,
  customValidatorLimit: 100,
  customValidatorNested: {
    code: "PP-100",
  },

  customValidatorArray: [2, 4, 6],

  customValidator: "kiran Poojary",

  // OTHER
  emptyArrayNotAllowed: [1],

  numberType: 100,

  stringType: "hello",

  booleanType: true,

  arrayType: [1, 2, 3],

  objectType: {
    hello: "world",
  },

  emailType: "test@example.com",

  urlType: "https://example.com",

  enumType: "ACTIVE",

  uuidType: "550e8400-e29b-41d4-a716-446655440000",

  uuidV1Type: "550e8400-e29b-11d4-a716-446655440000",

  uuidV3Type: "550e8400-e29b-31d4-a716-446655440000",

  uuidV4Type: "550e8400-e29b-41d4-a716-446655440000",

  uuidV5Type: "550e8400-e29b-51d4-a716-446655440000",

  objectIdType: "507f1f77bcf86cd799439011",

  regexField: "ABC123",

  minLengthField: "hello",

  maxLengthField: "hello",

  integerField: 10,

  minField: 10,

  maxField: 100,

  rangeField: 15,

  marks: [0, 50, 100],

  address: {
    country: "India",

    city: "Bengaluru",

    zip: "560001",

    location: {
      latitude: 12.9716,
      longitude: 77.5946,
    },
  },

  minSalary: 50000,

  maxSalary: 60000,

  customMandatoryError: "value",

  customNullError: "value",

  customEmptyObjectError: {
    value: true,
  },

  customEmptyArrayError: [1],

  customElementConstraintError: [1, 2, 3],

  customRegexError: "ABC",

  customTypeError: 100,

  customMinLengthError: "hello",

  customMaxLengthError: "hello",

  customDecimalError: 10,

  customMinError: 10,

  customMaxError: 10,

  customRangeError: 5,
};

// ========================================================
// CUSTOM RESPONSE TEST
// ========================================================

const customValidResponse = {
  statusCode: 201,
  valid: true,
  message: "CUSTOM_VALID_RESPONSE",
};

const customInvalidResponse = {
  statusCode: 422,
  valid: false,
  message: "CUSTOM_INVALID_RESPONSE",
};

export {
  validationRule,
  invalidPayload,
  validPayload,
  customValidResponse,
  customInvalidResponse,
};

export const invalidResult = perfectPayload(invalidPayload, validationRule);

export const validResult = perfectPayload(validPayload, validationRule);

export const customInvalidResult = perfectPayload(
  invalidPayload,
  validationRule,
  {
    validPayloadResponse: customValidResponse,
    inValidPayloadResponse: customInvalidResponse,
  },
);

export const customValidResult = perfectPayload(validPayload, validationRule, {
  validPayloadResponse: customValidResponse,
  inValidPayloadResponse: customInvalidResponse,
});
