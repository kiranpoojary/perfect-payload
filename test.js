import { perfectPayload, perfectPayloadAsync } from "./index.js";
import {
  validateFrameworkConfig,
  validateFrameworkSources,
  validateFrameworkSourcesAsync,
} from "./framework.js";
import {
  validatePayload as validateExpressPayload,
  validatePayloadAsync as validateExpressPayloadAsync,
} from "./express.js";
import {
  validatePayload as validateFastifyPayload,
  validatePayloadAsync as validateFastifyPayloadAsync,
} from "./fastify.js";
/*
|--------------------------------------------------------------------------
| perfect-payload v1.2.0 regression test
|--------------------------------------------------------------------------
| Files:
|   index.js
|   testing.js
|
| Run:
|   node testing.js
|--------------------------------------------------------------------------
*/

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

// ========================================================
// RUN VALIDATIONS
// ========================================================

const invalidResult = perfectPayload(invalidPayload, validationRule);

const validResult = perfectPayload(validPayload, validationRule);
const customInvalidResult = perfectPayload(invalidPayload, validationRule, {
  validPayloadResponse: customValidResponse,
  inValidPayloadResponse: customInvalidResponse,
});

const customValidResult = perfectPayload(validPayload, validationRule, {
  validPayloadResponse: customValidResponse,
  inValidPayloadResponse: customInvalidResponse,
});

// ========================================================
// REGRESSION HELPERS
// ========================================================

function check(name, condition) {
  console.log(`${condition ? "✅ PASS" : "❌ FAIL"} - ${name}`);
}

function hasError(result, { path, code, message }) {
  return result?.errors?.some((error) => {
    if (path !== undefined && error?.path !== path) {
      return false;
    }

    if (code !== undefined && error?.code !== code) {
      return false;
    }

    if (message !== undefined && error?.message !== message) {
      return false;
    }

    return true;
  });
}

// ========================================================
// REGRESSION SUMMARY
// ========================================================

console.log("\n========================================================");

console.log("REGRESSION SUMMARY");

console.log("========================================================");

// ========================================================
// BASIC INVALID RESPONSE
// ========================================================

check(
  "Invalid payload returns statusCode 400",
  invalidResult?.statusCode === 400,
);

check("Invalid payload returns valid=false", invalidResult?.valid === false);

check(
  "Invalid response contains errors array",
  Array.isArray(invalidResult?.errors),
);

check("Invalid payload contains errors", invalidResult?.errors?.length > 0);

check(
  "Every error is a structured object",
  invalidResult?.errors?.every(
    (error) => typeof error === "object" && error !== null,
  ),
);

check(
  "Every error contains path",
  invalidResult?.errors?.every(
    (error) => typeof error?.path === "string" && error.path.length > 0,
  ),
);

check(
  "Every error contains code",
  invalidResult?.errors?.every(
    (error) => typeof error?.code === "string" && error.code.length > 0,
  ),
);

check(
  "Every error contains message",
  invalidResult?.errors?.every(
    (error) => typeof error?.message === "string" && error.message.length > 0,
  ),
);

// ========================================================
// REQUIRED / NULL / EMPTY
// ========================================================

check(
  "mandatory -> REQUIRED",
  hasError(invalidResult, {
    path: "requiredField",
    code: "REQUIRED",
  }),
);

check(
  "allowNull -> NULL_NOT_ALLOWED",
  hasError(invalidResult, {
    path: "nullNotAllowed",
    code: "NULL_NOT_ALLOWED",
  }),
);

check(
  "allowEmptyObject -> EMPTY_OBJECT_NOT_ALLOWED",
  hasError(invalidResult, {
    path: "emptyObjectNotAllowed",
    code: "EMPTY_OBJECT_NOT_ALLOWED",
  }),
);

check(
  "allowEmptyArray -> EMPTY_ARRAY_NOT_ALLOWED",
  hasError(invalidResult, {
    path: "emptyArrayNotAllowed",
    code: "EMPTY_ARRAY_NOT_ALLOWED",
  }),
);

// ========================================================
// CUSTOM VALIDATOR
// ========================================================

check(
  "customValidator default error -> CUSTOM_VALIDATION_FAILED",
  hasError(invalidResult, {
    path: "customValidatorDefault",
    code: "CUSTOM_VALIDATION_FAILED",
    message: "Custom validation failed for attribute customValidatorDefault",
  }),
);

check(
  "customValidator custom error message",
  hasError(invalidResult, {
    path: "customValidatorWithError",
    code: "CUSTOM_VALIDATION_FAILED",
    message: "Value must be an even number",
  }),
);

check(
  "customValidator custom code and message",
  hasError(invalidResult, {
    path: "customValidatorWithCode",
    code: "RESERVED_USERNAME",
    message: "Username cannot contain admin",
  }),
);

check(
  "customValidator receives complete payload",
  hasError(invalidResult, {
    path: "customValidatorPayload",
    code: "LIMIT_EXCEEDED",
    message: "Value cannot exceed customValidatorLimit",
  }),
);

check(
  "customValidator works inside nested object",
  hasError(invalidResult, {
    path: "customValidatorNested.code",
    code: "INVALID_CUSTOM_CODE",
    message: "Code must start with PP-",
  }),
);

check(
  "customValidator works inside elementConstraints",
  hasError(invalidResult, {
    path: "customValidatorArray[1]",
    code: "NOT_EVEN",
    message: "Array value must be even",
  }),
);

check(
  "customValidator does not run for missing optional field",
  !hasError(invalidResult, {
    path: "customValidatorOptional",
  }) &&
    !hasError(validResult, {
      path: "customValidatorOptional",
    }),
);

let nonFunctionValidatorThrows = false;

try {
  perfectPayload(
    {
      username: "kiran",
    },
    {
      username: {
        type: "string",
        customValidator: "not-a-function",
      },
    },
  );
} catch (error) {
  nonFunctionValidatorThrows =
    error.message ===
    "perfect-payload:- customValidator must be a function for attribute username";
}

check(
  "customValidator throws when validator is not a function",
  nonFunctionValidatorThrows,
);

let asyncValidatorThrows = false;

try {
  perfectPayload(
    {
      username: "kiran",
    },
    {
      username: {
        type: "string",
        customValidator: async (value) => {
          return value === "kiran";
        },
      },
    },
  );
} catch (error) {
  asyncValidatorThrows =
    error.message ===
    "perfect-payload:- customValidator must be synchronous for attribute username";
}

check(
  "customValidator throws when validator returns a Promise",
  asyncValidatorThrows,
);

const strictTrueResults = [
  { returnedValue: false, shouldPass: false },
  { returnedValue: undefined, shouldPass: false },
  { returnedValue: null, shouldPass: false },
  { returnedValue: 1, shouldPass: false },
  { returnedValue: "true", shouldPass: false },
  { returnedValue: {}, shouldPass: false },
  { returnedValue: true, shouldPass: true },
];

const strictTrueValidatorPassed = strictTrueResults.every(
  ({ returnedValue, shouldPass }) => {
    const result = perfectPayload(
      {
        username: "kiran",
      },
      {
        username: {
          type: "string",
          customValidator: () => returnedValue,
        },
      },
    );

    return shouldPass
      ? result.valid === true
      : hasError(result, {
          path: "username",
          code: "CUSTOM_VALIDATION_FAILED",
        });
  },
);

check(
  "customValidator passes only when validator returns strict true",
  strictTrueValidatorPassed,
);

let nullValidatorExecuted = false;

const nullAllowedResult = perfectPayload(
  {
    username: null,
  },
  {
    username: {
      allowNull: true,
      customValidator: () => {
        nullValidatorExecuted = true;
        return false;
      },
    },
  },
);

check(
  "customValidator does not run when value is null and allowNull is true",
  nullAllowedResult.valid === true &&
    nullAllowedResult.validatedPayload?.username === null &&
    nullValidatorExecuted === false,
);

check(
  "valid payload passes all customValidators",
  !validResult?.errors &&
    validResult?.validatedPayload?.customValidatorDefault === "VALID" &&
    validResult?.validatedPayload?.customValidatorWithError === 10 &&
    validResult?.validatedPayload?.customValidatorWithCode === "kiran" &&
    validResult?.validatedPayload?.customValidatorPayload === 50,
);

// ========================================================
// BASIC TYPES
// ========================================================

check(
  "number type -> INVALID_TYPE",
  hasError(invalidResult, {
    path: "numberType",
    code: "INVALID_TYPE",
  }),
);

check(
  "string type -> INVALID_TYPE",
  hasError(invalidResult, {
    path: "stringType",
    code: "INVALID_TYPE",
  }),
);

check(
  "boolean type -> INVALID_TYPE",
  hasError(invalidResult, {
    path: "booleanType",
    code: "INVALID_TYPE",
  }),
);

check(
  "array type -> INVALID_TYPE",
  hasError(invalidResult, {
    path: "arrayType",
    code: "INVALID_TYPE",
  }),
);

check(
  "object type -> INVALID_TYPE",
  hasError(invalidResult, {
    path: "objectType",
    code: "INVALID_TYPE",
  }),
);

// ========================================================
// SPECIAL TYPES
// ========================================================

check(
  "email type -> INVALID_EMAIL",
  hasError(invalidResult, {
    path: "emailType",
    code: "INVALID_EMAIL",
  }),
);

check(
  "url type -> INVALID_URL",
  hasError(invalidResult, {
    path: "urlType",
    code: "INVALID_URL",
  }),
);

check(
  "enum type -> INVALID_ENUM",
  hasError(invalidResult, {
    path: "enumType",
    code: "INVALID_ENUM",
  }),
);

check(
  "uuid type -> INVALID_UUID",
  hasError(invalidResult, {
    path: "uuidType",
    code: "INVALID_UUID",
  }),
);

check(
  "uuidv1 type -> INVALID_UUID_V1",
  hasError(invalidResult, {
    path: "uuidV1Type",
    code: "INVALID_UUID_V1",
  }),
);

check(
  "uuidv3 type -> INVALID_UUID_V3",
  hasError(invalidResult, {
    path: "uuidV3Type",
    code: "INVALID_UUID_V3",
  }),
);

check(
  "uuidv4 type -> INVALID_UUID_V4",
  hasError(invalidResult, {
    path: "uuidV4Type",
    code: "INVALID_UUID_V4",
  }),
);

check(
  "uuidv5 type -> INVALID_UUID_V5",
  hasError(invalidResult, {
    path: "uuidV5Type",
    code: "INVALID_UUID_V5",
  }),
);

check(
  "objectId type -> INVALID_OBJECT_ID",
  hasError(invalidResult, {
    path: "objectIdType",
    code: "INVALID_OBJECT_ID",
  }),
);

// ========================================================
// REGEX
// ========================================================

check(
  "regex -> REGEX_MISMATCH",
  hasError(invalidResult, {
    path: "regexField",
    code: "REGEX_MISMATCH",
  }),
);

// ========================================================
// LENGTH
// ========================================================

check(
  "minLength -> MIN_LENGTH",
  hasError(invalidResult, {
    path: "minLengthField",
    code: "MIN_LENGTH",
  }),
);

check(
  "maxLength -> MAX_LENGTH",
  hasError(invalidResult, {
    path: "maxLengthField",
    code: "MAX_LENGTH",
  }),
);

// ========================================================
// NUMBER VALIDATIONS
// ========================================================

check(
  "preventDecimal -> DECIMAL_NOT_ALLOWED",
  hasError(invalidResult, {
    path: "integerField",
    code: "DECIMAL_NOT_ALLOWED",
  }),
);

check(
  "min -> MIN_VALUE",
  hasError(invalidResult, {
    path: "minField",
    code: "MIN_VALUE",
  }),
);

check(
  "max -> MAX_VALUE",
  hasError(invalidResult, {
    path: "maxField",
    code: "MAX_VALUE",
  }),
);

check(
  "range -> OUT_OF_RANGE",
  hasError(invalidResult, {
    path: "rangeField",
    code: "OUT_OF_RANGE",
  }),
);

// ========================================================
// ARRAY PATHS
// ========================================================

check(
  "Array element error contains index path marks[2]",
  hasError(invalidResult, {
    path: "marks[2]",
    code: "OUT_OF_RANGE",
  }),
);

// ========================================================
// NESTED FIELD PATHS
// ========================================================

check(
  "Nested path address.country works",
  hasError(invalidResult, {
    path: "address.country",
    code: "NULL_NOT_ALLOWED",
  }),
);

check(
  "Nested path address.city works",
  hasError(invalidResult, {
    path: "address.city",
    code: "MIN_LENGTH",
  }),
);

check(
  "Nested path address.zip works",
  hasError(invalidResult, {
    path: "address.zip",
    code: "REGEX_MISMATCH",
  }),
);

check(
  "Deep nested path address.location.latitude works",
  hasError(invalidResult, {
    path: "address.location.latitude",
    code: "INVALID_TYPE",
  }),
);

// ========================================================
// DEPENDENCY
// ========================================================

check(
  "Dependency detects maxSalary minimum violation",
  hasError(invalidResult, {
    path: "maxSalary",
    code: "MIN_VALUE",
    message: "maxSalary must be more than minSalary",
  }),
);

check(
  "Dependency detects minSalary maximum violation",
  hasError(invalidResult, {
    path: "minSalary",
    code: "MAX_VALUE",
    message: "minSalary must be less than maxSalary",
  }),
);

// ========================================================
// CUSTOM ERROR MESSAGES
// ========================================================

check(
  "Custom mandatory error works",
  hasError(invalidResult, {
    path: "customMandatoryError",
    code: "REQUIRED",
    message: "CUSTOM_REQUIRED_ERROR",
  }),
);

check(
  "Custom null error works",
  hasError(invalidResult, {
    path: "customNullError",
    code: "NULL_NOT_ALLOWED",
    message: "CUSTOM_NULL_ERROR",
  }),
);

check(
  "Custom empty object error works",
  hasError(invalidResult, {
    path: "customEmptyObjectError",
    code: "EMPTY_OBJECT_NOT_ALLOWED",
    message: "CUSTOM_EMPTY_OBJECT_ERROR",
  }),
);

check(
  "Custom empty array error works",
  hasError(invalidResult, {
    path: "customEmptyArrayError",
    code: "EMPTY_ARRAY_NOT_ALLOWED",
    message: "CUSTOM_EMPTY_ARRAY_ERROR",
  }),
);

check(
  "Custom array element error works",
  hasError(invalidResult, {
    path: "customElementConstraintError[1]",
    code: "INVALID_ARRAY_ELEMENT",
    message: "CUSTOM_ARRAY_ELEMENT_ERROR",
  }),
);

check(
  "Custom regex error works",
  hasError(invalidResult, {
    path: "customRegexError",
    code: "REGEX_MISMATCH",
    message: "CUSTOM_REGEX_ERROR",
  }),
);

check(
  "Custom type error works",
  hasError(invalidResult, {
    path: "customTypeError",
    code: "INVALID_TYPE",
    message: "CUSTOM_TYPE_ERROR",
  }),
);

check(
  "Custom minLength error works",
  hasError(invalidResult, {
    path: "customMinLengthError",
    code: "MIN_LENGTH",
    message: "CUSTOM_MIN_LENGTH_ERROR",
  }),
);

check(
  "Custom maxLength error works",
  hasError(invalidResult, {
    path: "customMaxLengthError",
    code: "MAX_LENGTH",
    message: "CUSTOM_MAX_LENGTH_ERROR",
  }),
);

check(
  "Custom decimal error works",
  hasError(invalidResult, {
    path: "customDecimalError",
    code: "DECIMAL_NOT_ALLOWED",
    message: "CUSTOM_DECIMAL_ERROR",
  }),
);

check(
  "Custom min error works",
  hasError(invalidResult, {
    path: "customMinError",
    code: "MIN_VALUE",
    message: "CUSTOM_MIN_ERROR",
  }),
);

check(
  "Custom max error works",
  hasError(invalidResult, {
    path: "customMaxError",
    code: "MAX_VALUE",
    message: "CUSTOM_MAX_ERROR",
  }),
);

check(
  "Custom range error works",
  hasError(invalidResult, {
    path: "customRangeError",
    code: "OUT_OF_RANGE",
    message: "CUSTOM_RANGE_ERROR",
  }),
);

// ========================================================
// VERIFY ALL PUBLIC ERROR CODES
// ========================================================

const expectedErrorCodes = [
  "REQUIRED",
  "NULL_NOT_ALLOWED",
  "EMPTY_OBJECT_NOT_ALLOWED",
  "EMPTY_ARRAY_NOT_ALLOWED",
  "INVALID_ARRAY_ELEMENT",
  "REGEX_MISMATCH",

  "INVALID_TYPE",
  "INVALID_EMAIL",
  "INVALID_URL",
  "INVALID_ENUM",
  "INVALID_UUID",
  "INVALID_UUID_V1",
  "INVALID_UUID_V3",
  "INVALID_UUID_V4",
  "INVALID_UUID_V5",
  "INVALID_OBJECT_ID",

  "MIN_LENGTH",
  "MAX_LENGTH",
  "DECIMAL_NOT_ALLOWED",
  "MIN_VALUE",
  "MAX_VALUE",
  "OUT_OF_RANGE",
];

for (const code of expectedErrorCodes) {
  check(
    `Public error code ${code} is generated`,
    invalidResult?.errors?.some((error) => error?.code === code),
  );
}

// ========================================================
// VALID RESPONSE
// ========================================================

check("Valid payload returns statusCode 200", validResult?.statusCode === 200);

check("Valid payload returns valid=true", validResult?.valid === true);

check(
  "Valid payload returns validatedPayload",
  typeof validResult?.validatedPayload === "object" &&
    validResult?.validatedPayload !== null,
);

check(
  "Valid response does not contain errors",
  !Object.prototype.hasOwnProperty.call(validResult, "errors"),
);

// ========================================================
// VALIDATED PAYLOAD CHECKS
// ========================================================

check(
  "validatedPayload contains requiredField",
  validResult?.validatedPayload?.requiredField === "available",
);

check(
  "validatedPayload contains array",
  Array.isArray(validResult?.validatedPayload?.marks),
);

check(
  "validatedPayload contains nested object",
  validResult?.validatedPayload?.address?.location?.latitude === 12.9716,
);

// ========================================================
// CUSTOM INVALID RESPONSE
// ========================================================

check(
  "Custom invalid statusCode works",
  customInvalidResult?.statusCode === 422,
);

check("Custom invalid valid=false works", customInvalidResult?.valid === false);

check(
  "Custom invalid message works",
  customInvalidResult?.message === "CUSTOM_INVALID_RESPONSE",
);

check(
  "Custom invalid response still contains structured errors",
  customInvalidResult?.errors?.every(
    (error) =>
      typeof error === "object" &&
      typeof error?.path === "string" &&
      typeof error?.code === "string" &&
      typeof error?.message === "string",
  ),
);

// ========================================================
// CUSTOM VALID RESPONSE
// ========================================================

check("Custom valid statusCode works", customValidResult?.statusCode === 201);

check("Custom valid valid=true works", customValidResult?.valid === true);

check(
  "Custom valid message works",
  customValidResult?.message === "CUSTOM_VALID_RESPONSE",
);

check(
  "Custom valid response contains validatedPayload",
  typeof customValidResult?.validatedPayload === "object",
);

// TRANSFORM
check(
  "trim transforms string before validation",
  validResult?.validatedPayload?.transformTrim === "Kiran Poojary",
);

check(
  "lowercase transforms string",
  validResult?.validatedPayload?.transformLowercase === "kiran",
);

check(
  "uppercase transforms string",
  validResult?.validatedPayload?.transformUppercase === "KIRAN",
);

check(
  "transformations follow fixed order",
  validResult?.validatedPayload?.transformCombined === "PP-100",
);

check(
  "custom transform changes value",
  validResult?.validatedPayload?.transformCustom === "9876543210",
);

check(
  "transform receives current payload",
  validResult?.validatedPayload?.transformPayload === 200,
);

check(
  "transform works inside nested object",
  validResult?.validatedPayload?.transformNested?.name === "KIRAN",
);

check(
  "custom transform works inside nested object",
  validResult?.validatedPayload?.transformNested?.code === "PP100",
);

check(
  "nested transformations do not mutate original payload",
  validPayload.transformNested.name === "   kiran   " &&
    validPayload.transformNested.code === "  PP-100  ",
);

check(
  "transform works inside elementConstraints",
  Array.isArray(validResult?.validatedPayload?.transformArray) &&
    validResult.validatedPayload.transformArray[0] === "APPLE" &&
    validResult.validatedPayload.transformArray[1] === "BANANA" &&
    validResult.validatedPayload.transformArray[2] === "MANGO",
);

check(
  "array transformations do not mutate original payload",
  validPayload.transformArray[0] === "  apple  " &&
    validPayload.transformArray[1] === "banana" &&
    validPayload.transformArray[2] === "  mango",
);

// ======================================================
// TRANSFORM - MISSING OPTIONAL FIELD
// ======================================================

let missingTransformExecuted = false;

const missingTransformResult = perfectPayload(
  {},
  {
    username: {
      transform: (value) => {
        missingTransformExecuted = true;
        return value;
      },
    },
  },
);

check(
  "transform does not run for missing optional field",
  missingTransformResult.valid === true && missingTransformExecuted === false,
);

// ======================================================
// TRANSFORM - NULL VALUE
// ======================================================

let nullTransformExecuted = false;

const nullTransformResult = perfectPayload(
  {
    username: null,
  },
  {
    username: {
      allowNull: true,

      transform: (value) => {
        nullTransformExecuted = true;
        return "changed";
      },
    },
  },
);

check(
  "transform does not run when value is null and allowNull is true",
  nullTransformResult.valid === true &&
    nullTransformResult.validatedPayload?.username === null &&
    nullTransformExecuted === false,
);

// ======================================================
// TRANSFORM - NON-FUNCTION
// ======================================================

let nonFunctionTransformThrows = false;

try {
  perfectPayload(
    {
      username: "kiran",
    },
    {
      username: {
        type: "string",
        transform: "not-a-function",
      },
    },
  );
} catch (error) {
  nonFunctionTransformThrows =
    error.message ===
    "perfect-payload:- transform must be a function for attribute username";
}

check(
  "transform throws when transformer is not a function",
  nonFunctionTransformThrows,
);

// ======================================================
// TRANSFORM - ASYNC / PROMISE
// ======================================================

let asyncTransformThrows = false;

try {
  perfectPayload(
    {
      username: "kiran",
    },
    {
      username: {
        type: "string",

        transform: async (value) => {
          return value.toUpperCase();
        },
      },
    },
  );
} catch (error) {
  asyncTransformThrows =
    error.message ===
    "perfect-payload:- transform must be synchronous for attribute username";
}

check(
  "transform throws when transformer returns a Promise",
  asyncTransformThrows,
);

// ======================================================
// TRANSFORM - THROWN EXCEPTION
// ======================================================

let transformExceptionPropagates = false;

try {
  perfectPayload(
    {
      username: "kiran",
    },
    {
      username: {
        type: "string",

        transform: () => {
          throw new Error("CUSTOM_TRANSFORM_ERROR");
        },
      },
    },
  );
} catch (error) {
  transformExceptionPropagates = error.message === "CUSTOM_TRANSFORM_ERROR";
}

check(
  "transform propagates transformer exceptions",
  transformExceptionPropagates,
);

check(
  "regex validates transformed value",
  validResult?.validatedPayload?.transformBeforeRegex === "PP-100",
);

check(
  "length rules validate transformed value",
  validResult?.validatedPayload?.transformBeforeLength === "KIRAN",
);

check(
  "customValidator receives transformed value",
  validResult?.validatedPayload?.transformBeforeCustomValidator === "KIRAN",
);

check(
  "transform can convert string to number before validation",
  validResult?.validatedPayload?.transformStringToNumber === 250 &&
    typeof validResult.validatedPayload.transformStringToNumber === "number",
);

check(
  "numeric rules validate transformed number",
  validResult?.validatedPayload?.transformStringToNumber >= 100 &&
    validResult.validatedPayload.transformStringToNumber <= 500,
);

check(
  "transform can convert number to string before validation",
  validResult?.validatedPayload?.transformNumberToString === "12345" &&
    typeof validResult.validatedPayload.transformNumberToString === "string",
);

check(
  "customValidator receives transformed data type",
  validResult?.validatedPayload?.transformTypeCustomValidator === 500 &&
    typeof validResult.validatedPayload.transformTypeCustomValidator ===
      "number",
);

// ======================================================
// TRANSFORM - INVALID RESULT TYPE
// ======================================================

const invalidTransformTypeResult = perfectPayload(
  {
    age: "abc",
  },
  {
    age: {
      transform: () => "not-a-number",
      type: "number",
    },
  },
);

check(
  "invalid transformed type is rejected",
  hasError(invalidTransformTypeResult, {
    path: "age",
    code: "INVALID_TYPE",
  }),
);

// ======================================================
// TRANSFORM - INVALID NUMERIC RANGE
// ======================================================

const invalidTransformRangeResult = perfectPayload(
  {
    quantity: "50",
  },
  {
    quantity: {
      transform: (value) => Number(value),
      type: "number",
      max: 10,
    },
  },
);

check(
  "numeric validation rejects transformed value",
  hasError(invalidTransformRangeResult, {
    path: "quantity",
    code: "MAX_VALUE",
  }),
);

// ======================================================
// TRANSFORM - RULE ORDER INDEPENDENCE
// ======================================================

const transformOrderA = perfectPayload(
  {
    code: "   pp-100   ",
  },
  {
    code: {
      trim: true,
      uppercase: true,
      type: "string",
      regex: /^PP-100$/,
    },
  },
);

const transformOrderB = perfectPayload(
  {
    code: "   pp-100   ",
  },
  {
    code: {
      regex: /^PP-100$/,
      type: "string",
      uppercase: true,
      trim: true,
    },
  },
);

check(
  "transform behavior does not depend on rule property order",
  transformOrderA.valid === true &&
    transformOrderB.valid === true &&
    transformOrderA.validatedPayload?.code === "PP-100" &&
    transformOrderB.validatedPayload?.code === "PP-100",
);

const customTransformOrderResult = perfectPayload(
  {
    code: "   pp-100   ",
  },
  {
    code: {
      transform: (value) => value.replace("-", ""),
      regex: /^PP100$/,
      uppercase: true,
      type: "string",
      trim: true,
    },
  },
);

check(
  "custom transform runs after built-in transformations regardless of rule order",
  customTransformOrderResult.valid === true &&
    customTransformOrderResult.validatedPayload?.code === "PP100",
);

// ======================================================
// TRANSFORM - RETURNS UNDEFINED
// ======================================================

let transformUndefinedThrows = false;

try {
  perfectPayload(
    {
      username: "kiran",
    },
    {
      username: {
        transform: () => undefined,
        type: "string",
      },
    },
  );
} catch (error) {
  transformUndefinedThrows =
    error.message ===
    "perfect-payload:- transform must not return undefined for attribute username";
}

check(
  "transform returning undefined throws configuration error",
  transformUndefinedThrows,
);

// ======================================================
// TRANSFORM - RETURNS NULL
// ======================================================

const transformNullResult = perfectPayload(
  {
    username: "kiran",
  },
  {
    username: {
      transform: () => null,
      allowNull: false,
      type: "string",
    },
  },
);

check(
  "transform returning null is validated normally",
  hasError(transformNullResult, {
    path: "username",
    code: "NULL_NOT_ALLOWED",
  }),
);

const transformEmptyStringResult = perfectPayload(
  {
    username: "     ",
  },
  {
    username: {
      mandatory: true,
      trim: true,
      type: "string",
    },
  },
);

check(
  "mandatory rejects value that becomes empty after trim",
  hasError(transformEmptyStringResult, {
    path: "username",
    code: "REQUIRED",
  }),
);

const optionalTrimEmptyResult = perfectPayload(
  {
    nickname: "     ",
  },
  {
    nickname: {
      trim: true,
      type: "string",
    },
  },
);

check(
  "optional string can become empty after trim",
  optionalTrimEmptyResult.valid === true &&
    optionalTrimEmptyResult.validatedPayload?.nickname === "",
);

let customValidatorReceivedEmptyString = false;

const emptyStringCustomValidatorResult = perfectPayload(
  {
    nickname: "     ",
  },
  {
    nickname: {
      trim: true,

      customValidator: (value) => {
        customValidatorReceivedEmptyString = value === "";
        return true;
      },
    },
  },
);

check(
  "customValidator receives empty string produced by trim",
  emptyStringCustomValidatorResult.valid === true &&
    customValidatorReceivedEmptyString === true &&
    emptyStringCustomValidatorResult.validatedPayload?.nickname === "",
);

// ========================================================
// lowercase + uppercase conflict should work for nested paths too
// ========================================================
let nestedCaseConflictThrows = false;

try {
  perfectPayload(
    {
      profile: {
        username: "Kiran",
      },
    },
    {
      profile: {
        type: "object",
        objectAttr: {
          username: {
            type: "string",
            lowercase: true,
            uppercase: true,
          },
        },
      },
    },
  );
} catch (error) {
  nestedCaseConflictThrows =
    error.message ===
    "perfect-payload:- lowercase and uppercase cannot both be enabled for attribute profile.username";
}

check(
  "lowercase and uppercase conflict reports nested path",
  nestedCaseConflictThrows,
);

let arrayCaseConflictThrows = false;

try {
  perfectPayload(
    {
      names: ["Kiran"],
    },
    {
      names: {
        type: "array",
        elementConstraints: {
          type: "string",
          lowercase: true,
          uppercase: true,
        },
      },
    },
  );
} catch (error) {
  arrayCaseConflictThrows =
    error.message ===
    "perfect-payload:- lowercase and uppercase cannot both be enabled for attribute names";
}

check(
  "lowercase and uppercase conflict works inside elementConstraints",
  arrayCaseConflictThrows,
);

// ============================================================
// v1.5.0 - minItems regression checks
// ============================================================

const minItemsExactMinimum = perfectPayload(
  {
    tags: ["nodejs", "react"],
  },
  {
    tags: {
      type: "array",
      minItems: 2,
    },
  },
);

check(
  "minItems passes when array length equals minimum",
  minItemsExactMinimum.valid === true,
);

const minItemsAboveMinimum = perfectPayload(
  {
    tags: ["nodejs", "react", "mongodb"],
  },
  {
    tags: {
      type: "array",
      minItems: 2,
    },
  },
);

check(
  "minItems passes when array length is above minimum",
  minItemsAboveMinimum.valid === true,
);

const minItemsBelowMinimum = perfectPayload(
  {
    tags: ["nodejs"],
  },
  {
    tags: {
      type: "array",
      minItems: 2,
    },
  },
);

check(
  "minItems fails when array length is below minimum",
  minItemsBelowMinimum.valid === false &&
    minItemsBelowMinimum.errors?.[0]?.path === "tags" &&
    minItemsBelowMinimum.errors?.[0]?.code === "MIN_ITEMS",
);

const minItemsEmptyArray = perfectPayload(
  {
    tags: [],
  },
  {
    tags: {
      type: "array",
      allowEmptyArray: true,
      minItems: 2,
    },
  },
);

check(
  "minItems validates empty array when allowEmptyArray is true",
  minItemsEmptyArray.valid === false &&
    minItemsEmptyArray.errors?.[0]?.code === "MIN_ITEMS",
);

const minItemsOptionalMissing = perfectPayload(
  {},
  {
    tags: {
      type: "array",
      minItems: 2,
    },
  },
);

check(
  "minItems skips missing optional field",
  minItemsOptionalMissing.valid === true,
);

const minItemsAllowedNull = perfectPayload(
  {
    tags: null,
  },
  {
    tags: {
      type: "array",
      allowNull: true,
      minItems: 2,
    },
  },
);

check(
  "minItems skips null when allowNull is true",
  minItemsAllowedNull.valid === true,
);

const minItemsNonArray = perfectPayload(
  {
    tags: "nodejs",
  },
  {
    tags: {
      type: "array",
      minItems: 2,
    },
  },
);

check(
  "minItems does not replace existing array type validation",
  minItemsNonArray.valid === false &&
    minItemsNonArray.errors?.some(
      (error) => error.path === "tags" && error.code === "INVALID_TYPE",
    ),
);

const minItemsValidatedPayload = perfectPayload(
  {
    tags: ["nodejs", "react"],
  },
  {
    tags: {
      type: "array",
      minItems: 2,
    },
  },
);

check(
  "minItems preserves valid array in validatedPayload",
  minItemsValidatedPayload.valid === true &&
    minItemsValidatedPayload.validatedPayload?.tags?.length === 2 &&
    minItemsValidatedPayload.validatedPayload.tags[0] === "nodejs" &&
    minItemsValidatedPayload.validatedPayload.tags[1] === "react",
);

// maxItems
const maxItemsExactMaximum = perfectPayload(
  {
    tags: ["nodejs", "react", "mongodb"],
  },
  {
    tags: {
      type: "array",
      maxItems: 3,
    },
  },
);

check(
  "maxItems passes when array length equals maximum",
  maxItemsExactMaximum.valid === true,
);

const maxItemsBelowMaximum = perfectPayload(
  {
    tags: ["nodejs", "react"],
  },
  {
    tags: {
      type: "array",
      maxItems: 3,
    },
  },
);

check(
  "maxItems passes when array length is below maximum",
  maxItemsBelowMaximum.valid === true,
);

const maxItemsAboveMaximum = perfectPayload(
  {
    tags: ["nodejs", "react", "mongodb", "express"],
  },
  {
    tags: {
      type: "array",
      maxItems: 3,
    },
  },
);

check(
  "maxItems fails when array length is above maximum",
  maxItemsAboveMaximum.valid === false &&
    maxItemsAboveMaximum.errors?.[0]?.path === "tags" &&
    maxItemsAboveMaximum.errors?.[0]?.code === "MAX_ITEMS" &&
    maxItemsAboveMaximum.errors?.[0]?.message ===
      "Attribute tags must contain at most 3 item(s)",
);

const maxItemsEmptyArray = perfectPayload(
  {
    tags: [],
  },
  {
    tags: {
      type: "array",
      allowEmptyArray: true,
      maxItems: 3,
    },
  },
);

check(
  "maxItems passes for allowed empty array",
  maxItemsEmptyArray.valid === true,
);

const maxItemsOptionalMissing = perfectPayload(
  {},
  {
    tags: {
      type: "array",
      maxItems: 3,
    },
  },
);

check(
  "maxItems skips missing optional field",
  maxItemsOptionalMissing.valid === true,
);

const maxItemsAllowedNull = perfectPayload(
  {
    tags: null,
  },
  {
    tags: {
      type: "array",
      allowNull: true,
      maxItems: 3,
    },
  },
);

check(
  "maxItems skips null when allowNull is true",
  maxItemsAllowedNull.valid === true,
);

const maxItemsNonArray = perfectPayload(
  {
    tags: "nodejs",
  },
  {
    tags: {
      type: "array",
      maxItems: 3,
    },
  },
);

check(
  "maxItems does not replace existing array type validation",
  maxItemsNonArray.valid === false &&
    maxItemsNonArray.errors?.some(
      (error) => error.path === "tags" && error.code === "INVALID_TYPE",
    ),
);

const minMaxItemsTogether = perfectPayload(
  {
    tags: ["nodejs", "react", "mongodb"],
  },
  {
    tags: {
      type: "array",
      minItems: 2,
      maxItems: 4,
    },
  },
);

check(
  "minItems and maxItems work together",
  minMaxItemsTogether.valid === true,
);

const arrayOfObjectsValid = perfectPayload(
  {
    products: [
      {
        productId: "P100",
        quantity: 2,
      },
      {
        productId: "P200",
        quantity: 5,
      },
    ],
  },
  {
    products: {
      type: "array",
      minItems: 1,
      maxItems: 5,
      elementConstraints: {
        type: "object",
        objectAttr: {
          productId: {
            mandatory: true,
            type: "string",
          },
          quantity: {
            mandatory: true,
            type: "number",
            min: 1,
          },
        },
      },
    },
  },
);

check(
  "elementConstraints supports arrays of objects",
  arrayOfObjectsValid.valid === true &&
    arrayOfObjectsValid.validatedPayload?.products?.length === 2 &&
    arrayOfObjectsValid.validatedPayload.products[1].productId === "P200",
);

const arrayOfObjectsNestedFailure = perfectPayload(
  {
    products: [
      {
        productId: "P100",
        quantity: 2,
      },
      {
        productId: "P200",
        quantity: 0,
      },
    ],
  },
  {
    products: {
      type: "array",
      elementConstraints: {
        type: "object",
        objectAttr: {
          productId: {
            mandatory: true,
            type: "string",
          },
          quantity: {
            mandatory: true,
            type: "number",
            min: 1,
          },
        },
      },
    },
  },
);

check(
  "array of objects preserves indexed nested validation path",
  arrayOfObjectsNestedFailure.valid === false &&
    arrayOfObjectsNestedFailure.errors?.[0]?.path === "products[1].quantity" &&
    arrayOfObjectsNestedFailure.errors?.[0]?.code === "MIN_VALUE",
);

const arrayOfObjectsMissingField = perfectPayload(
  {
    products: [
      {
        productId: "P100",
        quantity: 2,
      },
      {
        quantity: 5,
      },
    ],
  },
  {
    products: {
      type: "array",
      elementConstraints: {
        type: "object",
        objectAttr: {
          productId: {
            mandatory: true,
            type: "string",
          },
          quantity: {
            mandatory: true,
            type: "number",
            min: 1,
          },
        },
      },
    },
  },
);

check(
  "array of objects preserves indexed path for missing nested field",
  arrayOfObjectsMissingField.valid === false &&
    arrayOfObjectsMissingField.errors?.[0]?.path === "products[1].productId" &&
    arrayOfObjectsMissingField.errors?.[0]?.code === "REQUIRED",
);

// ============================================================
// v1.5.0 - Deep nested validation regression checks
// ============================================================

const deepNestedRules = {
  orders: {
    type: "object",
    objectAttr: {
      items: {
        type: "array",
        elementConstraints: {
          type: "object",
          objectAttr: {
            product: {
              type: "object",
              objectAttr: {
                sku: {
                  mandatory: true,
                  type: "string",
                  trim: true,
                  uppercase: true,
                },
                quantity: {
                  mandatory: true,
                  type: "number",
                  min: 1,
                },
              },
            },
          },
        },
      },
    },
  },
};

// ------------------------------------------------------------
// 1. Valid deep nested structure
// ------------------------------------------------------------

const deepNestedValid = perfectPayload(
  {
    orders: {
      items: [
        {
          product: {
            sku: "SKU-100",
            quantity: 2,
          },
        },
        {
          product: {
            sku: "SKU-200",
            quantity: 5,
          },
        },
      ],
    },
  },
  deepNestedRules,
);

check(
  "deep nested object-array-object structure validates successfully",
  deepNestedValid.valid === true &&
    deepNestedValid.validatedPayload?.orders?.items?.[0]?.product?.sku ===
      "SKU-100" &&
    deepNestedValid.validatedPayload?.orders?.items?.[1]?.product?.sku ===
      "SKU-200",
);

// ------------------------------------------------------------
// 2. Deep nested validation failure
// ------------------------------------------------------------

const deepNestedFailure = perfectPayload(
  {
    orders: {
      items: [
        {
          product: {
            sku: "SKU-100",
            quantity: 2,
          },
        },
        {
          product: {
            sku: "SKU-200",
            quantity: 0,
          },
        },
      ],
    },
  },
  deepNestedRules,
);

check(
  "deep nested validation preserves indexed quantity path",
  deepNestedFailure.valid === false &&
    deepNestedFailure.errors?.[0]?.path ===
      "orders.items[1].product.quantity" &&
    deepNestedFailure.errors?.[0]?.code === "MIN_VALUE",
);

// ------------------------------------------------------------
// 3. Deep nested missing field
// ------------------------------------------------------------

const deepNestedMissingField = perfectPayload(
  {
    orders: {
      items: [
        {
          product: {
            sku: "SKU-100",
            quantity: 2,
          },
        },
        {
          product: {
            quantity: 5,
          },
        },
      ],
    },
  },
  deepNestedRules,
);

check(
  "deep nested missing field preserves indexed path",
  deepNestedMissingField.valid === false &&
    deepNestedMissingField.errors?.[0]?.path ===
      "orders.items[1].product.sku" &&
    deepNestedMissingField.errors?.[0]?.code === "REQUIRED",
);

// ------------------------------------------------------------
// 4. Deep nested transformation preservation + immutability
// ------------------------------------------------------------

const deepNestedTransformInput = {
  orders: {
    items: [
      {
        product: {
          sku: "   sku-100   ",
          quantity: 2,
        },
      },
      {
        product: {
          sku: "   sku-200   ",
          quantity: 5,
        },
      },
    ],
  },
};

const deepNestedTransform = perfectPayload(
  deepNestedTransformInput,
  deepNestedRules,
);

check(
  "deep nested transformation is preserved in validatedPayload",
  deepNestedTransform.valid === true &&
    deepNestedTransform.validatedPayload?.orders?.items?.[0]?.product?.sku ===
      "SKU-100" &&
    deepNestedTransform.validatedPayload?.orders?.items?.[1]?.product?.sku ===
      "SKU-200",
);

check(
  "deep nested transformation does not mutate original payload",
  deepNestedTransformInput.orders.items[0].product.sku === "   sku-100   " &&
    deepNestedTransformInput.orders.items[1].product.sku === "   sku-200   ",
);

// ============================================================
// v1.5.0 - Nested array regression checks
// ============================================================

const nestedArrayRules = {
  matrix: {
    type: "array",
    elementConstraints: {
      type: "array",
      elementConstraints: {
        type: "number",
        min: 1,
      },
    },
  },
};

// ------------------------------------------------------------
// 1. Valid nested array
// ------------------------------------------------------------

const nestedArrayValid = perfectPayload(
  {
    matrix: [
      [1, 2],
      [3, 4],
    ],
  },
  nestedArrayRules,
);

check(
  "elementConstraints supports nested arrays",
  nestedArrayValid.valid === true &&
    nestedArrayValid.validatedPayload?.matrix?.[0]?.[0] === 1 &&
    nestedArrayValid.validatedPayload?.matrix?.[1]?.[1] === 4,
);

// ------------------------------------------------------------
// 2. Nested array validation failure
// ------------------------------------------------------------

const nestedArrayFailure = perfectPayload(
  {
    matrix: [
      [1, 2],
      [3, 0],
    ],
  },
  nestedArrayRules,
);

check(
  "nested array preserves multi-level indexed error path",
  nestedArrayFailure.valid === false &&
    nestedArrayFailure.errors?.[0]?.path === "matrix[1][1]" &&
    nestedArrayFailure.errors?.[0]?.code === "MIN_VALUE",
);

// ------------------------------------------------------------
// 3. Nested array transformation
// ------------------------------------------------------------

const nestedArrayTransformInput = {
  categories: [
    ["  nodejs  ", " react "],
    [" mongodb ", " express "],
  ],
};

const nestedArrayTransform = perfectPayload(nestedArrayTransformInput, {
  categories: {
    type: "array",
    elementConstraints: {
      type: "array",
      elementConstraints: {
        type: "string",
        trim: true,
        uppercase: true,
      },
    },
  },
});

check(
  "transformations are preserved inside nested arrays",
  nestedArrayTransform.valid === true &&
    nestedArrayTransform.validatedPayload?.categories?.[0]?.[0] === "NODEJS" &&
    nestedArrayTransform.validatedPayload?.categories?.[0]?.[1] === "REACT" &&
    nestedArrayTransform.validatedPayload?.categories?.[1]?.[0] === "MONGODB" &&
    nestedArrayTransform.validatedPayload?.categories?.[1]?.[1] === "EXPRESS",
);

// ------------------------------------------------------------
// 4. Nested array transformation does not mutate input
// ------------------------------------------------------------

check(
  "nested array transformations do not mutate original payload",
  nestedArrayTransformInput.categories[0][0] === "  nodejs  " &&
    nestedArrayTransformInput.categories[0][1] === " react " &&
    nestedArrayTransformInput.categories[1][0] === " mongodb " &&
    nestedArrayTransformInput.categories[1][1] === " express ",
);

// ------------------------------------------------------------
// 5. Deep nested array index
// ------------------------------------------------------------

const threeLevelArrayFailure = perfectPayload(
  {
    matrix: [
      [
        [1, 2],
        [3, 4],
      ],
      [
        [5, 6],
        [7, 0],
      ],
    ],
  },
  {
    matrix: {
      type: "array",
      elementConstraints: {
        type: "array",
        elementConstraints: {
          type: "array",
          elementConstraints: {
            type: "number",
            min: 1,
          },
        },
      },
    },
  },
);

check(
  "deep nested arrays preserve all array indexes in error path",
  threeLevelArrayFailure.valid === false &&
    threeLevelArrayFailure.errors?.[0]?.path === "matrix[1][1][1]" &&
    threeLevelArrayFailure.errors?.[0]?.code === "MIN_VALUE",
);

// ============================================================
// v1.5.0 - Complex nested array/object regression checks
// ============================================================

const complexNestedRules = {
  orders: {
    type: "array",
    elementConstraints: {
      type: "object",
      objectAttr: {
        orderId: {
          mandatory: true,
          type: "string",
        },

        items: {
          mandatory: true,
          type: "array",
          minItems: 1,
          elementConstraints: {
            type: "object",
            objectAttr: {
              productId: {
                mandatory: true,
                type: "string",
              },

              quantity: {
                mandatory: true,
                type: "number",
                min: 1,
              },
            },
          },
        },
      },
    },
  },
};

// ------------------------------------------------------------
// 1. Valid array -> object -> array -> object
// ------------------------------------------------------------

const complexNestedValid = perfectPayload(
  {
    orders: [
      {
        orderId: "ORD-100",
        items: [
          {
            productId: "P100",
            quantity: 2,
          },
        ],
      },
      {
        orderId: "ORD-200",
        items: [
          {
            productId: "P200",
            quantity: 1,
          },
          {
            productId: "P201",
            quantity: 3,
          },
          {
            productId: "P202",
            quantity: 5,
          },
        ],
      },
    ],
  },
  complexNestedRules,
);

check(
  "array-object-array-object structure validates successfully",
  complexNestedValid.valid === true &&
    complexNestedValid.validatedPayload?.orders?.[1]?.items?.[2]?.productId ===
      "P202" &&
    complexNestedValid.validatedPayload?.orders?.[1]?.items?.[2]?.quantity ===
      5,
);

// ------------------------------------------------------------
// 2. Deep nested validation failure
// ------------------------------------------------------------

const complexNestedFailure = perfectPayload(
  {
    orders: [
      {
        orderId: "ORD-100",
        items: [
          {
            productId: "P100",
            quantity: 2,
          },
        ],
      },
      {
        orderId: "ORD-200",
        items: [
          {
            productId: "P200",
            quantity: 1,
          },
          {
            productId: "P201",
            quantity: 3,
          },
          {
            productId: "P202",
            quantity: 0,
          },
        ],
      },
    ],
  },
  complexNestedRules,
);

check(
  "array-object-array-object preserves complete indexed error path",
  complexNestedFailure.valid === false &&
    complexNestedFailure.errors?.[0]?.path === "orders[1].items[2].quantity" &&
    complexNestedFailure.errors?.[0]?.code === "MIN_VALUE",
);

// ------------------------------------------------------------
// 3. minItems works inside nested arrays
// ------------------------------------------------------------

const complexNestedMinItemsFailure = perfectPayload(
  {
    orders: [
      {
        orderId: "ORD-100",
        items: [],
      },
    ],
  },
  complexNestedRules,
);

check(
  "minItems works inside nested array/object structures",
  complexNestedMinItemsFailure.valid === false &&
    complexNestedMinItemsFailure.errors?.[0]?.path === "orders[0].items" &&
    complexNestedMinItemsFailure.errors?.[0]?.code === "MIN_ITEMS",
);

// ============================================================
// v1.5.0 - Block 7
// Nested minItems + maxItems regression checks
// ============================================================

const nestedItemLimitRules = {
  orders: {
    type: "array",
    minItems: 1,
    maxItems: 2,

    elementConstraints: {
      type: "object",

      objectAttr: {
        orderId: {
          mandatory: true,
          type: "string",
        },

        items: {
          mandatory: true,
          type: "array",
          minItems: 1,
          maxItems: 2,

          elementConstraints: {
            type: "object",

            objectAttr: {
              productId: {
                mandatory: true,
                type: "string",
              },

              quantity: {
                mandatory: true,
                type: "number",
                min: 1,
              },
            },
          },
        },
      },
    },
  },
};

// ------------------------------------------------------------
// 1. Valid at both array levels
// ------------------------------------------------------------

const nestedItemLimitsValid = perfectPayload(
  {
    orders: [
      {
        orderId: "ORD-100",
        items: [
          {
            productId: "P100",
            quantity: 2,
          },
          {
            productId: "P101",
            quantity: 3,
          },
        ],
      },
      {
        orderId: "ORD-200",
        items: [
          {
            productId: "P200",
            quantity: 1,
          },
        ],
      },
    ],
  },
  nestedItemLimitRules,
);

check(
  "minItems and maxItems work at multiple nested levels",
  nestedItemLimitsValid.valid === true &&
    nestedItemLimitsValid.validatedPayload?.orders?.length === 2 &&
    nestedItemLimitsValid.validatedPayload?.orders?.[0]?.items?.length === 2 &&
    nestedItemLimitsValid.validatedPayload?.orders?.[1]?.items?.length === 1,
);

// ------------------------------------------------------------
// 2. Top-level maxItems
// ------------------------------------------------------------

const topLevelMaxItemsFailure = perfectPayload(
  {
    orders: [
      {
        orderId: "ORD-100",
        items: [{ productId: "P100", quantity: 1 }],
      },
      {
        orderId: "ORD-200",
        items: [{ productId: "P200", quantity: 1 }],
      },
      {
        orderId: "ORD-300",
        items: [{ productId: "P300", quantity: 1 }],
      },
    ],
  },
  nestedItemLimitRules,
);

check(
  "maxItems reports correct top-level array path",
  topLevelMaxItemsFailure.valid === false &&
    topLevelMaxItemsFailure.errors?.[0]?.path === "orders" &&
    topLevelMaxItemsFailure.errors?.[0]?.code === "MAX_ITEMS",
);

// ------------------------------------------------------------
// 3. Nested maxItems
// ------------------------------------------------------------

const nestedMaxItemsFailure = perfectPayload(
  {
    orders: [
      {
        orderId: "ORD-100",
        items: [{ productId: "P100", quantity: 1 }],
      },
      {
        orderId: "ORD-200",
        items: [
          { productId: "P200", quantity: 1 },
          { productId: "P201", quantity: 2 },
          { productId: "P202", quantity: 3 },
        ],
      },
    ],
  },
  nestedItemLimitRules,
);

check(
  "maxItems reports correct nested array path",
  nestedMaxItemsFailure.valid === false &&
    nestedMaxItemsFailure.errors?.[0]?.path === "orders[1].items" &&
    nestedMaxItemsFailure.errors?.[0]?.code === "MAX_ITEMS",
);

// ------------------------------------------------------------
// 4. Nested minItems
// ------------------------------------------------------------

const nestedMinItemsFailure = perfectPayload(
  {
    orders: [
      {
        orderId: "ORD-100",
        items: [{ productId: "P100", quantity: 1 }],
      },
      {
        orderId: "ORD-200",
        items: [],
      },
    ],
  },
  nestedItemLimitRules,
);

check(
  "minItems reports correct nested array path",
  nestedMinItemsFailure.valid === false &&
    nestedMinItemsFailure.errors?.[0]?.path === "orders[1].items" &&
    nestedMinItemsFailure.errors?.[0]?.code === "MIN_ITEMS",
);

// ------------------------------------------------------------
// 5. Top-level minItems
// ------------------------------------------------------------

const topLevelMinItemsFailure = perfectPayload(
  {
    orders: [],
  },
  nestedItemLimitRules,
);

check(
  "minItems reports correct top-level array path",
  topLevelMinItemsFailure.valid === false &&
    topLevelMinItemsFailure.errors?.[0]?.path === "orders" &&
    topLevelMinItemsFailure.errors?.[0]?.code === "MIN_ITEMS",
);

// ============================================================
// v1.5.0 - Block 8
// NaN number validation regression checks
// ============================================================

// ------------------------------------------------------------
// 1. NaN must not pass type: "number"
// ------------------------------------------------------------

const nanTypeResult = perfectPayload(
  {
    price: NaN,
  },
  {
    price: {
      mandatory: true,
      type: "number",
    },
  },
);

check(
  "NaN is rejected by number type validation",
  nanTypeResult.valid === false &&
    nanTypeResult.errors?.[0]?.path === "price" &&
    nanTypeResult.errors?.[0]?.code === "INVALID_TYPE",
);

// ------------------------------------------------------------
// 2. NaN with min must fail at type validation
// ------------------------------------------------------------

const nanMinResult = perfectPayload(
  {
    price: NaN,
  },
  {
    price: {
      mandatory: true,
      type: "number",
      min: 1,
    },
  },
);

check(
  "NaN with min is rejected as INVALID_TYPE",
  nanMinResult.valid === false &&
    nanMinResult.errors?.[0]?.path === "price" &&
    nanMinResult.errors?.[0]?.code === "INVALID_TYPE",
);

// ------------------------------------------------------------
// 3. NaN with max must fail at type validation
// ------------------------------------------------------------

const nanMaxResult = perfectPayload(
  {
    price: NaN,
  },
  {
    price: {
      mandatory: true,
      type: "number",
      max: 100,
    },
  },
);

check(
  "NaN with max is rejected as INVALID_TYPE",
  nanMaxResult.valid === false &&
    nanMaxResult.errors?.[0]?.path === "price" &&
    nanMaxResult.errors?.[0]?.code === "INVALID_TYPE",
);

// ------------------------------------------------------------
// 4. NaN with range must fail at type validation
// ------------------------------------------------------------

const nanRangeResult = perfectPayload(
  {
    price: NaN,
  },
  {
    price: {
      mandatory: true,
      type: "number",
      range: "1-100",
    },
  },
);

check(
  "NaN with range is rejected as INVALID_TYPE",
  nanRangeResult.valid === false &&
    nanRangeResult.errors?.[0]?.path === "price" &&
    nanRangeResult.errors?.[0]?.code === "INVALID_TYPE",
);

// ------------------------------------------------------------
// 5. NaN inside elementConstraints
// ------------------------------------------------------------

const nanArrayResult = perfectPayload(
  {
    prices: [10, NaN, 30],
  },
  {
    prices: {
      type: "array",
      elementConstraints: {
        type: "number",
        min: 1,
      },
    },
  },
);

check(
  "NaN inside elementConstraints is rejected with indexed path",
  nanArrayResult.valid === false &&
    nanArrayResult.errors?.[0]?.path === "prices[1]" &&
    nanArrayResult.errors?.[0]?.code === "INVALID_TYPE",
);

// ------------------------------------------------------------
// 6. Normal finite number remains valid
// ------------------------------------------------------------

const finiteNumberResult = perfectPayload(
  {
    price: 50,
  },
  {
    price: {
      mandatory: true,
      type: "number",
      min: 1,
      max: 100,
      range: "1-100",
    },
  },
);

check(
  "finite numbers remain valid after NaN hardening",
  finiteNumberResult.valid === true &&
    finiteNumberResult.validatedPayload?.price === 50,
);

// ======================================================
// TRANSFORM - UNDEFINED HARDENING
// ======================================================

// ------------------------------------------------------
// Mandatory field -> undefined
// ------------------------------------------------------

let transformUndefinedMandatoryThrows = false;

try {
  perfectPayload(
    {
      username: "kiran",
    },
    {
      username: {
        mandatory: true,
        transform: () => undefined,
        type: "string",
      },
    },
  );
} catch (error) {
  transformUndefinedMandatoryThrows =
    error.message ===
    "perfect-payload:- transform must not return undefined for attribute username";
}

check(
  "transform returning undefined throws for mandatory field",
  transformUndefinedMandatoryThrows,
);

// ------------------------------------------------------
// undefined must throw before customValidator executes
// ------------------------------------------------------

let transformUndefinedBeforeCustomValidatorThrows = false;
let customValidatorExecutedAfterUndefinedTransform = false;

try {
  perfectPayload(
    {
      username: "kiran",
    },
    {
      username: {
        transform: () => undefined,
        type: "string",

        customValidator: () => {
          customValidatorExecutedAfterUndefinedTransform = true;
          return true;
        },
      },
    },
  );
} catch (error) {
  transformUndefinedBeforeCustomValidatorThrows =
    error.message ===
    "perfect-payload:- transform must not return undefined for attribute username";
}

check(
  "transform returning undefined throws before customValidator executes",
  transformUndefinedBeforeCustomValidatorThrows &&
    customValidatorExecutedAfterUndefinedTransform === false,
);

// ------------------------------------------------------
// undefined inside elementConstraints
// ------------------------------------------------------

let transformUndefinedArrayThrows = false;

try {
  perfectPayload(
    {
      tags: ["node", "react"],
    },
    {
      tags: {
        type: "array",

        elementConstraints: {
          type: "string",

          transform: (value) => (value === "react" ? undefined : value),
        },
      },
    },
  );
} catch (error) {
  transformUndefinedArrayThrows = error.message.includes(
    "transform must not return undefined",
  );
}

check(
  "transform returning undefined throws inside elementConstraints",
  transformUndefinedArrayThrows,
);

// ------------------------------------------------------
// undefined inside objectAttr
// ------------------------------------------------------

let transformUndefinedObjectThrows = false;

try {
  perfectPayload(
    {
      user: {
        username: "kiran",
      },
    },
    {
      user: {
        type: "object",

        objectAttr: {
          username: {
            type: "string",
            transform: () => undefined,
          },
        },
      },
    },
  );
} catch (error) {
  transformUndefinedObjectThrows = error.message.includes(
    "transform must not return undefined",
  );
}

check(
  "transform returning undefined throws inside objectAttr",
  transformUndefinedObjectThrows,
);

// ------------------------------------------------------
// Normal transform remains unaffected
// ------------------------------------------------------

const transformUndefinedHardeningControl = perfectPayload(
  {
    username: "  kiran  ",
  },
  {
    username: {
      type: "string",
      transform: (value) => value.trim().toUpperCase(),
    },
  },
);

check(
  "normal transform remains valid after undefined hardening",
  transformUndefinedHardeningControl.valid === true &&
    transformUndefinedHardeningControl.validatedPayload?.username === "KIRAN",
);

// ========================================================
// v1.6.0 - ASYNC CUSTOM VALIDATOR
// ========================================================

const asyncValidatorRule = {
  username: {
    mandatory: true,
    type: "string",
    trim: true,

    customValidator: async (value) => {
      await new Promise((resolve) => setTimeout(resolve, 10));

      return value !== "admin";
    },

    customValidatorCode: "USERNAME_TAKEN",
    customValidatorError: "Username is already taken",
  },
};

// ------------------------------------------------------
// Async customValidator - PASS
// ------------------------------------------------------

const asyncValidatorPassResult = await perfectPayloadAsync(
  {
    username: "  kiran  ",
  },
  asyncValidatorRule,
);

check(
  "perfectPayloadAsync supports async customValidator",
  asyncValidatorPassResult.valid === true &&
    asyncValidatorPassResult.validatedPayload?.username === "kiran",
);

// ------------------------------------------------------
// Async customValidator - FAIL
// ------------------------------------------------------

const asyncValidatorFailResult = await perfectPayloadAsync(
  {
    username: "  admin  ",
  },
  asyncValidatorRule,
);

check(
  "perfectPayloadAsync returns structured error for failed async customValidator",
  asyncValidatorFailResult.valid === false &&
    hasError(asyncValidatorFailResult, {
      path: "username",
      code: "USERNAME_TAKEN",
      message: "Username is already taken",
    }),
);

// ------------------------------------------------------
// Existing synchronous customValidator works with async API
// ------------------------------------------------------

const syncValidatorThroughAsyncResult = await perfectPayloadAsync(
  {
    username: "kiran",
  },
  {
    username: {
      type: "string",
      customValidator: (value) => value === "kiran",
    },
  },
);

check(
  "perfectPayloadAsync supports synchronous customValidator",
  syncValidatorThroughAsyncResult.valid === true &&
    syncValidatorThroughAsyncResult.validatedPayload?.username === "kiran",
);

// ========================================================
// v1.6.0 - ASYNC CUSTOM VALIDATOR - OBJECTATTR
// ========================================================

const asyncNestedRule = {
  profile: {
    type: "object",

    objectAttr: {
      username: {
        type: "string",
        trim: true,

        customValidator: async (value, payload) => {
          await new Promise((resolve) => setTimeout(resolve, 10));
          return value !== payload.reservedUsername;
        },

        customValidatorCode: "USERNAME_RESERVED",
        customValidatorError: "Username is reserved",
      },

      reservedUsername: {
        type: "string",
      },
    },
  },
};

// ------------------------------------------------------
// Nested async validator - PASS
// ------------------------------------------------------

const asyncNestedPassResult = await perfectPayloadAsync(
  {
    profile: {
      username: "  kiran  ",
      reservedUsername: "admin",
    },
  },
  asyncNestedRule,
);

check(
  "perfectPayloadAsync supports async customValidator inside objectAttr",
  asyncNestedPassResult.valid === true &&
    asyncNestedPassResult.validatedPayload?.profile?.username === "kiran",
);

// ------------------------------------------------------
// Nested async validator - FAIL
// ------------------------------------------------------

const asyncNestedFailResult = await perfectPayloadAsync(
  {
    profile: {
      username: "admin",
      reservedUsername: "admin",
    },
  },
  asyncNestedRule,
);

check(
  "perfectPayloadAsync returns structured error for async customValidator inside objectAttr",
  asyncNestedFailResult.valid === false &&
    hasError(asyncNestedFailResult, {
      path: "profile.username",
      code: "USERNAME_RESERVED",
      message: "Username is reserved",
    }),
);

// ------------------------------------------------------
// Nested validator receives current nested payload
// ------------------------------------------------------

check(
  "nested async customValidator receives current nested payload",
  asyncNestedFailResult.valid === false &&
    hasError(asyncNestedFailResult, {
      path: "profile.username",
      code: "USERNAME_RESERVED",
    }),
);

// ========================================================
// v1.6.0 - ASYNC CUSTOM VALIDATOR - ELEMENTCONSTRAINTS
// ========================================================

const asyncArrayRule = {
  usernames: {
    type: "array",

    elementConstraints: {
      type: "string",
      trim: true,

      customValidator: async (value) => {
        await new Promise((resolve) => setTimeout(resolve, 10));

        return value !== "admin" && value !== "root";
      },

      customValidatorCode: "USERNAME_TAKEN",
      customValidatorError: "Username is already taken",
    },
  },
};

// ------------------------------------------------------
// Array async validator - PASS + transformation
// ------------------------------------------------------

const asyncArrayPassResult = await perfectPayloadAsync(
  {
    usernames: ["  kiran  ", "  john  "],
  },
  asyncArrayRule,
);

check(
  "perfectPayloadAsync supports async customValidator inside elementConstraints",
  asyncArrayPassResult.valid === true &&
    asyncArrayPassResult.validatedPayload?.usernames?.[0] === "kiran" &&
    asyncArrayPassResult.validatedPayload?.usernames?.[1] === "john",
);

// ------------------------------------------------------
// Array async validator - indexed FAIL
// ------------------------------------------------------

const asyncArrayFailResult = await perfectPayloadAsync(
  {
    usernames: ["  kiran  ", "  admin  ", "  john  "],
  },
  asyncArrayRule,
);

check(
  "perfectPayloadAsync returns indexed error for async customValidator inside elementConstraints",
  asyncArrayFailResult.valid === false &&
    hasError(asyncArrayFailResult, {
      path: "usernames[1]",
      code: "USERNAME_TAKEN",
      message: "Username is already taken",
    }),
);

// ------------------------------------------------------
// Multiple array failures preserve indexes
// ------------------------------------------------------

const asyncArrayMultipleFailResult = await perfectPayloadAsync(
  {
    usernames: ["  admin  ", "  kiran  ", "  root  "],
  },
  asyncArrayRule,
);

check(
  "perfectPayloadAsync preserves indexes for multiple async array validation failures",
  asyncArrayMultipleFailResult.valid === false &&
    hasError(asyncArrayMultipleFailResult, {
      path: "usernames[0]",
      code: "USERNAME_TAKEN",
    }) &&
    hasError(asyncArrayMultipleFailResult, {
      path: "usernames[2]",
      code: "USERNAME_TAKEN",
    }),
);

// ========================================================
// v1.6.0 - ASYNC CUSTOM VALIDATOR - DEEP NESTING
// ========================================================

// ------------------------------------------------------
// Array → Object → Object → Async Validator
// ------------------------------------------------------

const asyncDeepArrayObjectRule = {
  products: {
    type: "array",

    elementConstraints: {
      type: "object",

      objectAttr: {
        seller: {
          type: "object",

          objectAttr: {
            username: {
              type: "string",
              trim: true,

              customValidator: async (value) => {
                await new Promise((resolve) => setTimeout(resolve, 10));

                return value !== "admin";
              },

              customValidatorCode: "USERNAME_TAKEN",
              customValidatorError: "Username is already taken",
            },
          },
        },
      },
    },
  },
};

const asyncDeepArrayObjectResult = await perfectPayloadAsync(
  {
    products: [
      {
        seller: {
          username: "  kiran  ",
        },
      },
      {
        seller: {
          username: "  admin  ",
        },
      },
    ],
  },
  asyncDeepArrayObjectRule,
);

check(
  "perfectPayloadAsync supports deep array-object-object async validation",
  asyncDeepArrayObjectResult.valid === false &&
    hasError(asyncDeepArrayObjectResult, {
      path: "products[1].seller.username",
      code: "USERNAME_TAKEN",
      message: "Username is already taken",
    }),
);

// ------------------------------------------------------
// Object → Array → Array → Object → Async Validator
// ------------------------------------------------------

const asyncDeepMixedRule = {
  profile: {
    type: "object",

    objectAttr: {
      teams: {
        type: "array",

        elementConstraints: {
          type: "object",

          objectAttr: {
            members: {
              type: "array",

              elementConstraints: {
                type: "object",

                objectAttr: {
                  username: {
                    type: "string",
                    trim: true,

                    customValidator: async (value) => {
                      await new Promise((resolve) => setTimeout(resolve, 10));

                      return value !== "admin";
                    },

                    customValidatorCode: "USERNAME_TAKEN",
                    customValidatorError: "Username is already taken",
                  },
                },
              },
            },
          },
        },
      },
    },
  },
};

const asyncDeepMixedResult = await perfectPayloadAsync(
  {
    profile: {
      teams: [
        {
          members: [
            {
              username: "  kiran  ",
            },
          ],
        },
        {
          members: [
            {
              username: "  sam  ",
            },
            {
              username: "  admin  ",
            },
          ],
        },
      ],
    },
  },
  asyncDeepMixedRule,
);

check(
  "perfectPayloadAsync preserves paths through deep mixed object-array nesting",
  asyncDeepMixedResult.valid === false &&
    hasError(asyncDeepMixedResult, {
      path: "profile.teams[1].members[1].username",
      code: "USERNAME_TAKEN",
      message: "Username is already taken",
    }),
);

// ========================================================
// v1.6.0 - ASYNC CUSTOM VALIDATOR - ERROR DETAILS
// ========================================================

// ------------------------------------------------------
// Default error uses final indexed path
// ------------------------------------------------------

const asyncDefaultErrorRule = {
  users: {
    type: "array",

    elementConstraints: {
      type: "object",

      objectAttr: {
        username: {
          type: "string",
          trim: true,

          customValidator: async (value) => {
            await new Promise((resolve) => setTimeout(resolve, 10));

            return value !== "admin";
          },
        },
      },
    },
  },
};

const asyncDefaultErrorResult = await perfectPayloadAsync(
  {
    users: [{ username: "kiran" }, { username: "  admin  " }],
  },
  asyncDefaultErrorRule,
);

check(
  "perfectPayloadAsync default customValidator error uses final indexed path",
  asyncDefaultErrorResult.valid === false &&
    hasError(asyncDefaultErrorResult, {
      path: "users[1].username",
      code: "CUSTOM_VALIDATION_FAILED",
      message: "Custom validation failed for attribute users[1].username",
    }),
);

// ------------------------------------------------------
// Custom code/message remain unchanged
// ------------------------------------------------------

const asyncCustomErrorRule = {
  users: {
    type: "array",

    elementConstraints: {
      type: "object",

      objectAttr: {
        username: {
          type: "string",

          customValidator: async (value) => {
            await new Promise((resolve) => setTimeout(resolve, 10));

            return value !== "admin";
          },

          customValidatorCode: "USERNAME_TAKEN",
          customValidatorError: "This username is already reserved",
        },
      },
    },
  },
};

const asyncCustomErrorResult = await perfectPayloadAsync(
  {
    users: [{ username: "kiran" }, { username: "admin" }],
  },
  asyncCustomErrorRule,
);

check(
  "perfectPayloadAsync preserves custom validator code and message with indexed path",
  asyncCustomErrorResult.valid === false &&
    hasError(asyncCustomErrorResult, {
      path: "users[1].username",
      code: "USERNAME_TAKEN",
      message: "This username is already reserved",
    }),
);

// ========================================================
// v1.6.0 - ASYNC VALIDATION - COMPATIBILITY
// ========================================================

// ------------------------------------------------------
// Async API supports synchronous customValidator
// ------------------------------------------------------

const asyncApiSyncValidatorRule = {
  username: {
    type: "string",
    trim: true,

    customValidator: (value) => {
      return value !== "admin";
    },

    customValidatorCode: "USERNAME_TAKEN",
    customValidatorError: "Username is already taken",
  },
};

const asyncApiSyncValidatorPass = await perfectPayloadAsync(
  {
    username: "  kiran  ",
  },
  asyncApiSyncValidatorRule,
);

const asyncApiSyncValidatorFail = await perfectPayloadAsync(
  {
    username: "  admin  ",
  },
  asyncApiSyncValidatorRule,
);

check(
  "perfectPayloadAsync supports synchronous customValidator",
  asyncApiSyncValidatorPass.valid === true &&
    asyncApiSyncValidatorPass.validatedPayload?.username === "kiran" &&
    asyncApiSyncValidatorFail.valid === false &&
    hasError(asyncApiSyncValidatorFail, {
      path: "username",
      code: "USERNAME_TAKEN",
      message: "Username is already taken",
    }),
);

// ------------------------------------------------------
// Async validator exceptions propagate
// ------------------------------------------------------

let asyncValidatorExceptionPropagated = false;

try {
  await perfectPayloadAsync(
    {
      username: "kiran",
    },
    {
      username: {
        type: "string",

        customValidator: async () => {
          throw new Error("Database unavailable");
        },
      },
    },
  );
} catch (error) {
  asyncValidatorExceptionPropagated = error.message === "Database unavailable";
}

check(
  "perfectPayloadAsync propagates customValidator exceptions",
  asyncValidatorExceptionPropagated,
);

// ------------------------------------------------------
// Sync API continues rejecting async customValidator
// ------------------------------------------------------

let syncApiRejectedAsyncValidator = false;

try {
  perfectPayload(
    {
      username: "kiran",
    },
    {
      username: {
        type: "string",

        customValidator: async () => {
          return true;
        },
      },
    },
  );
} catch (error) {
  syncApiRejectedAsyncValidator =
    error.message ===
    "perfect-payload:- customValidator must be synchronous for attribute username";
}

check(
  "perfectPayload continues rejecting async customValidator",
  syncApiRejectedAsyncValidator,
);

// ------------------------------------------------------
// Async API rejects non-function customValidator
// ------------------------------------------------------

let asyncApiRejectedInvalidValidator = false;

try {
  await perfectPayloadAsync(
    {
      username: "kiran",
    },
    {
      username: {
        type: "string",
        customValidator: true,
      },
    },
  );
} catch (error) {
  asyncApiRejectedInvalidValidator =
    error.message ===
    "perfect-payload:- customValidator must be a function for attribute username";
}

check(
  "perfectPayloadAsync rejects non-function customValidator",
  asyncApiRejectedInvalidValidator,
);

// ------------------------------------------------------
// Sync errors stop async validation phase
// ------------------------------------------------------

let asyncValidatorExecutedAfterSyncError = false;

const asyncSkippedOnSyncErrorResult = await perfectPayloadAsync(
  {
    email: "invalid-email",
    username: "admin",
  },
  {
    email: {
      type: "email",
    },

    username: {
      type: "string",

      customValidator: async () => {
        asyncValidatorExecutedAfterSyncError = true;
        return false;
      },
    },
  },
);

check(
  "perfectPayloadAsync skips async validation when synchronous validation fails",
  asyncSkippedOnSyncErrorResult.valid === false &&
    hasError(asyncSkippedOnSyncErrorResult, {
      path: "email",
      code: "INVALID_EMAIL",
    }) &&
    asyncValidatorExecutedAfterSyncError === false,
);

// ==================================================
// v1.7.0 - UNKNOWN FIELD HANDLING
// ==================================================

const unknownFieldPayload = {
  name: "Kiran",
  role: "developer",
  active: true,
};

const unknownFieldRules = {
  name: {
    type: "string",
  },
};

// DEFAULT / STRIP
const unknownFieldStripResult = perfectPayload(
  unknownFieldPayload,
  unknownFieldRules,
);

check(
  "v1.7 unknownFields defaults to strip",
  unknownFieldStripResult.valid === true &&
    unknownFieldStripResult.validatedPayload?.name === "Kiran" &&
    !Object.prototype.hasOwnProperty.call(
      unknownFieldStripResult.validatedPayload,
      "role",
    ) &&
    !Object.prototype.hasOwnProperty.call(
      unknownFieldStripResult.validatedPayload,
      "active",
    ),
);

// ALLOW
const unknownFieldAllowResult = perfectPayload(
  unknownFieldPayload,
  unknownFieldRules,
  {
    unknownFields: "allow",
  },
);

check(
  "v1.7 unknownFields allow preserves unknown fields",
  unknownFieldAllowResult.valid === true &&
    unknownFieldAllowResult.validatedPayload?.name === "Kiran" &&
    unknownFieldAllowResult.validatedPayload?.role === "developer" &&
    unknownFieldAllowResult.validatedPayload?.active === true,
);

// REJECT
const unknownFieldRejectResult = perfectPayload(
  unknownFieldPayload,
  unknownFieldRules,
  {
    unknownFields: "reject",
  },
);

check(
  "v1.7 unknownFields reject returns structured errors",
  unknownFieldRejectResult.valid === false &&
    unknownFieldRejectResult.errors?.length === 2 &&
    unknownFieldRejectResult.errors?.[0]?.path === "role" &&
    unknownFieldRejectResult.errors?.[0]?.code === "UNKNOWN_FIELD" &&
    unknownFieldRejectResult.errors?.[1]?.path === "active" &&
    unknownFieldRejectResult.errors?.[1]?.code === "UNKNOWN_FIELD",
);

// ORIGINAL PAYLOAD MUST NOT BE MUTATED
check(
  "v1.7 unknownFields does not mutate original payload",
  unknownFieldPayload.name === "Kiran" &&
    unknownFieldPayload.role === "developer" &&
    unknownFieldPayload.active === true,
);

// ==================================================
// v1.7.0 - UNKNOWN FIELD HANDLING - NESTED + ASYNC
// ==================================================

// NESTED OBJECT - STRIP
const nestedUnknownStripResult = perfectPayload(
  {
    profile: {
      city: "Bengaluru",
      role: "developer",
    },
  },
  {
    profile: {
      type: "object",
      objectAttr: {
        city: {
          type: "string",
        },
      },
    },
  },
);

check(
  "v1.7 unknownFields strip works with nested objectAttr",
  nestedUnknownStripResult.valid === true &&
    nestedUnknownStripResult.validatedPayload?.profile?.city === "Bengaluru" &&
    !Object.prototype.hasOwnProperty.call(
      nestedUnknownStripResult.validatedPayload?.profile,
      "role",
    ),
);

// NESTED OBJECT - ALLOW
const nestedUnknownAllowResult = perfectPayload(
  {
    profile: {
      city: "Bengaluru",
      role: "developer",
    },
  },
  {
    profile: {
      type: "object",
      objectAttr: {
        city: {
          type: "string",
        },
      },
    },
  },
  {
    unknownFields: "allow",
  },
);

check(
  "v1.7 unknownFields allow works with nested objectAttr",
  nestedUnknownAllowResult.valid === true &&
    nestedUnknownAllowResult.validatedPayload?.profile?.city === "Bengaluru" &&
    nestedUnknownAllowResult.validatedPayload?.profile?.role === "developer",
);

// NESTED OBJECT - REJECT
const nestedUnknownRejectResult = perfectPayload(
  {
    profile: {
      city: "Bengaluru",
      role: "developer",
    },
  },
  {
    profile: {
      type: "object",
      objectAttr: {
        city: {
          type: "string",
        },
      },
    },
  },
  {
    unknownFields: "reject",
  },
);

check(
  "v1.7 unknownFields reject returns nested path",
  nestedUnknownRejectResult.valid === false &&
    nestedUnknownRejectResult.errors?.[0]?.path === "profile.role" &&
    nestedUnknownRejectResult.errors?.[0]?.code === "UNKNOWN_FIELD",
);

// ARRAY ELEMENT CONSTRAINTS - REJECT
const arrayUnknownRejectResult = perfectPayload(
  {
    products: [
      {
        name: "iPhone",
        price: 80000,
        internalId: "A001",
      },
    ],
  },
  {
    products: {
      type: "array",
      elementConstraints: {
        type: "object",
        objectAttr: {
          name: {
            type: "string",
          },
          price: {
            type: "number",
          },
        },
      },
    },
  },
  {
    unknownFields: "reject",
  },
);

check(
  "v1.7 unknownFields reject returns indexed array path",
  arrayUnknownRejectResult.valid === false &&
    arrayUnknownRejectResult.errors?.[0]?.path === "products[0].internalId" &&
    arrayUnknownRejectResult.errors?.[0]?.code === "UNKNOWN_FIELD",
);

// ASYNC - ALLOW
const asyncUnknownAllowResult = await perfectPayloadAsync(
  {
    username: "kiran",
    role: "developer",
  },
  {
    username: {
      type: "string",
      customValidator: async () => true,
    },
  },
  {
    unknownFields: "allow",
  },
);

check(
  "v1.7 async unknownFields allow preserves unknown fields",
  asyncUnknownAllowResult.valid === true &&
    asyncUnknownAllowResult.validatedPayload?.username === "kiran" &&
    asyncUnknownAllowResult.validatedPayload?.role === "developer",
);

// ASYNC - REJECT + VERIFY ASYNC VALIDATOR IS SKIPPED
let unknownFieldAsyncValidatorCalled = false;

const asyncUnknownRejectResult = await perfectPayloadAsync(
  {
    username: "kiran",
    role: "developer",
  },
  {
    username: {
      type: "string",
      customValidator: async () => {
        unknownFieldAsyncValidatorCalled = true;
        return true;
      },
    },
  },
  {
    unknownFields: "reject",
  },
);

check(
  "v1.7 async unknownFields reject returns structured error",
  asyncUnknownRejectResult.valid === false &&
    asyncUnknownRejectResult.errors?.[0]?.path === "role" &&
    asyncUnknownRejectResult.errors?.[0]?.code === "UNKNOWN_FIELD",
);

check(
  "v1.7 async validator does not run when unknownFields reject fails sync phase",
  unknownFieldAsyncValidatorCalled === false,
);

// ==================================================
// v1.7.0 - UNKNOWN FIELD HANDLING - OWN PROPERTIES
// ==================================================

const inheritedUnknownPayload = Object.create({
  inheritedField: "should-not-be-processed",
});

inheritedUnknownPayload.name = "Kiran";
inheritedUnknownPayload.role = "developer";

const inheritedUnknownRules = {
  name: {
    type: "string",
  },
};

const inheritedUnknownAllowResult = perfectPayload(
  inheritedUnknownPayload,
  inheritedUnknownRules,
  {
    unknownFields: "allow",
  },
);

check(
  "v1.7 unknownFields allow ignores inherited properties",
  inheritedUnknownAllowResult.valid === true &&
    inheritedUnknownAllowResult.validatedPayload?.name === "Kiran" &&
    inheritedUnknownAllowResult.validatedPayload?.role === "developer" &&
    !Object.prototype.hasOwnProperty.call(
      inheritedUnknownAllowResult.validatedPayload,
      "inheritedField",
    ),
);

const inheritedUnknownRejectResult = perfectPayload(
  inheritedUnknownPayload,
  inheritedUnknownRules,
  {
    unknownFields: "reject",
  },
);

check(
  "v1.7 unknownFields reject ignores inherited properties",
  inheritedUnknownRejectResult.valid === false &&
    inheritedUnknownRejectResult.errors?.length === 1 &&
    inheritedUnknownRejectResult.errors?.[0]?.path === "role" &&
    inheritedUnknownRejectResult.errors?.[0]?.code === "UNKNOWN_FIELD",
);

// ==================================================
// v1.7.0 - UNKNOWN FIELD - ARRAY INDEXED MESSAGE
// ==================================================

const arrayUnknownFieldMessageResult = perfectPayload(
  {
    products: [
      {
        productId: "P100",
        quantity: 2,
        internalId: "INT-100",
      },
    ],
  },
  {
    products: {
      mandatory: true,
      type: "array",
      elementConstraints: {
        type: "object",
        objectAttr: {
          productId: {
            mandatory: true,
            type: "string",
          },
          quantity: {
            mandatory: true,
            type: "number",
          },
        },
      },
    },
  },
  {
    unknownFields: "reject",
  },
);

check(
  "v1.7 unknown field inside array includes index in path and message",
  arrayUnknownFieldMessageResult.valid === false &&
    arrayUnknownFieldMessageResult.errors?.length === 1 &&
    arrayUnknownFieldMessageResult.errors?.[0]?.path ===
      "products[0].internalId" &&
    arrayUnknownFieldMessageResult.errors?.[0]?.code === "UNKNOWN_FIELD" &&
    arrayUnknownFieldMessageResult.errors?.[0]?.message ===
      "Unknown field products[0].internalId is not allowed",
);

// ==================================================
// v1.7.0 - THREE ARGUMENT API - CUSTOM RESPONSES
// ==================================================

const v17CustomValidResponseResult = perfectPayload(
  {
    name: "  KIRAN  ",
    role: "developer",
  },
  {
    name: {
      mandatory: true,
      type: "string",
      trim: true,
      lowercase: true,
    },
  },
  {
    unknownFields: "allow",
    validPayloadResponse: {
      statusCode: 201,
      valid: true,
      message: "Payload validation successful",
    },
    inValidPayloadResponse: {
      statusCode: 422,
      valid: false,
      message: "Custom validation failed",
    },
  },
);

check(
  "v1.7 three argument API uses custom valid response",
  v17CustomValidResponseResult.statusCode === 201 &&
    v17CustomValidResponseResult.valid === true &&
    v17CustomValidResponseResult.message === "Payload validation successful" &&
    v17CustomValidResponseResult.validatedPayload?.name === "kiran" &&
    v17CustomValidResponseResult.validatedPayload?.role === "developer",
);

const v17CustomInvalidResponseResult = perfectPayload(
  {
    email: "invalid-email",
    role: "developer",
  },
  {
    email: {
      mandatory: true,
      type: "email",
    },
  },
  {
    unknownFields: "allow",
    validPayloadResponse: {
      statusCode: 201,
      valid: true,
      message: "Payload validation successful",
    },
    inValidPayloadResponse: {
      statusCode: 422,
      valid: false,
      message: "Custom validation failed",
    },
  },
);

check(
  "v1.7 three argument API uses custom invalid response",
  v17CustomInvalidResponseResult.statusCode === 422 &&
    v17CustomInvalidResponseResult.valid === false &&
    v17CustomInvalidResponseResult.message === "Custom validation failed" &&
    v17CustomInvalidResponseResult.errors?.length === 1 &&
    v17CustomInvalidResponseResult.errors?.[0]?.path === "email" &&
    v17CustomInvalidResponseResult.errors?.[0]?.code === "INVALID_EMAIL",
);

// ==================================================
// v1.7.0 - ASYNC THREE ARGUMENT API - CUSTOM RESPONSES
// ==================================================

const v17AsyncRules = {
  username: {
    mandatory: true,
    type: "string",
    trim: true,
    lowercase: true,
    customValidator: async (value) => {
      await new Promise((resolve) => setTimeout(resolve, 10));
      return value !== "blocked";
    },
  },

  profile: {
    mandatory: true,
    type: "object",
    objectAttr: {
      city: {
        mandatory: true,
        type: "string",
      },
    },
  },
};

const v17AsyncOptions = {
  unknownFields: "allow",

  validPayloadResponse: {
    statusCode: 201,
    valid: true,
    message: "Async validation successful",
  },

  inValidPayloadResponse: {
    statusCode: 422,
    valid: false,
    message: "Async validation failed",
  },
};

// Async success
const v17AsyncValidResponseResult = await perfectPayloadAsync(
  {
    username: "  KIRAN  ",
    role: "developer",
    profile: {
      city: "Bengaluru",
      internalCode: "BLR-01",
    },
  },
  v17AsyncRules,
  v17AsyncOptions,
);

check(
  "v1.7 async three argument API uses options and custom valid response",
  v17AsyncValidResponseResult.statusCode === 201 &&
    v17AsyncValidResponseResult.valid === true &&
    v17AsyncValidResponseResult.message === "Async validation successful" &&
    v17AsyncValidResponseResult.validatedPayload?.username === "kiran" &&
    v17AsyncValidResponseResult.validatedPayload?.role === "developer" &&
    v17AsyncValidResponseResult.validatedPayload?.profile?.city ===
      "Bengaluru" &&
    v17AsyncValidResponseResult.validatedPayload?.profile?.internalCode ===
      "BLR-01",
);

// Async customValidator failure
const v17AsyncInvalidResponseResult = await perfectPayloadAsync(
  {
    username: "blocked",
    role: "developer",
    profile: {
      city: "Bengaluru",
    },
  },
  v17AsyncRules,
  v17AsyncOptions,
);

check(
  "v1.7 async three argument API uses custom invalid response",
  v17AsyncInvalidResponseResult.statusCode === 422 &&
    v17AsyncInvalidResponseResult.valid === false &&
    v17AsyncInvalidResponseResult.message === "Async validation failed" &&
    v17AsyncInvalidResponseResult.errors?.length === 1 &&
    v17AsyncInvalidResponseResult.errors?.[0]?.path === "username" &&
    v17AsyncInvalidResponseResult.errors?.[0]?.code ===
      "CUSTOM_VALIDATION_FAILED",
);

// ==================================================
// v1.8.0 - prettyErrors
// ==================================================

// --------------------------------------------------
// 1. SYNC - DEFAULT prettyErrors:false
// --------------------------------------------------

const prettyErrorsSyncDefaultResult = perfectPayload(
  {
    email: "invalid-email",
    age: 15,
  },
  {
    email: {
      mandatory: true,
      type: "email",
    },
    age: {
      mandatory: true,
      type: "number",
      min: 18,
    },
  },
);

check(
  "v1.8 prettyErrors sync defaults to structured errors",
  prettyErrorsSyncDefaultResult.valid === false &&
    prettyErrorsSyncDefaultResult.errors?.length === 2 &&
    typeof prettyErrorsSyncDefaultResult.errors?.[0] === "object" &&
    prettyErrorsSyncDefaultResult.errors?.[0]?.path === "email" &&
    prettyErrorsSyncDefaultResult.errors?.[0]?.code === "INVALID_EMAIL" &&
    prettyErrorsSyncDefaultResult.errors?.[1]?.path === "age" &&
    prettyErrorsSyncDefaultResult.errors?.[1]?.code === "MIN_VALUE",
);

// --------------------------------------------------
// 2. SYNC - prettyErrors:true
// --------------------------------------------------

const prettyErrorsSyncResult = perfectPayload(
  {
    email: "invalid-email",
    age: 15,
  },
  {
    email: {
      mandatory: true,
      type: "email",
    },
    age: {
      mandatory: true,
      type: "number",
      min: 18,
    },
  },
  {
    prettyErrors: true,
  },
);

check(
  "v1.8 prettyErrors sync returns message strings",
  prettyErrorsSyncResult.valid === false &&
    prettyErrorsSyncResult.errors?.length === 2 &&
    prettyErrorsSyncResult.errors?.every(
      (error) => typeof error === "string",
    ) &&
    prettyErrorsSyncResult.errors?.[0] ===
      "Invalid email format for attribute email" &&
    prettyErrorsSyncResult.errors?.[1] ===
      "Minimum value 18 is allowed in attribute age",
);

// --------------------------------------------------
// 3. SYNC - prettyErrors:true + custom error
// --------------------------------------------------

const prettyErrorsCustomMessageResult = perfectPayload(
  {
    email: "invalid-email",
  },
  {
    email: {
      type: "email",
      typeError: "Please provide a valid email address",
    },
  },
  {
    prettyErrors: true,
  },
);

check(
  "v1.8 prettyErrors preserves custom error messages",
  prettyErrorsCustomMessageResult.valid === false &&
    prettyErrorsCustomMessageResult.errors?.length === 1 &&
    prettyErrorsCustomMessageResult.errors?.[0] ===
      "Please provide a valid email address",
);

// --------------------------------------------------
// 4. SYNC - SUCCESS SHOULD NOT CREATE errors
// --------------------------------------------------

const prettyErrorsSyncSuccessResult = perfectPayload(
  {
    email: "user@example.com",
  },
  {
    email: {
      mandatory: true,
      type: "email",
    },
  },
  {
    prettyErrors: true,
  },
);

check(
  "v1.8 prettyErrors does not affect successful sync validation",
  prettyErrorsSyncSuccessResult.valid === true &&
    prettyErrorsSyncSuccessResult.validatedPayload?.email ===
      "user@example.com" &&
    prettyErrorsSyncSuccessResult.errors === undefined,
);

// --------------------------------------------------
// 5. SYNC - INVALID prettyErrors CONFIG
// --------------------------------------------------

let prettyErrorsSyncConfigError = null;

try {
  perfectPayload(
    {},
    {},
    {
      prettyErrors: "true",
    },
  );
} catch (error) {
  prettyErrorsSyncConfigError = error;
}

check(
  "v1.8 prettyErrors sync rejects non-boolean option",
  prettyErrorsSyncConfigError?.message ===
    "perfect-payload:- prettyErrors must be a boolean",
);

// --------------------------------------------------
// 6. ASYNC - SYNC VALIDATION FAILURE + prettyErrors:true
// --------------------------------------------------

const prettyErrorsAsyncSyncFailureResult = await perfectPayloadAsync(
  {
    email: "invalid-email",
  },
  {
    email: {
      mandatory: true,
      type: "email",
    },
  },
  {
    prettyErrors: true,
  },
);

check(
  "v1.8 prettyErrors async formats synchronous validation errors",
  prettyErrorsAsyncSyncFailureResult.valid === false &&
    prettyErrorsAsyncSyncFailureResult.errors?.length === 1 &&
    prettyErrorsAsyncSyncFailureResult.errors?.[0] ===
      "Invalid email format for attribute email",
);

// --------------------------------------------------
// 7. ASYNC - ASYNC customValidator FAILURE
// --------------------------------------------------

const prettyErrorsAsyncValidatorResult = await perfectPayloadAsync(
  {
    username: "taken-user",
  },
  {
    username: {
      mandatory: true,
      type: "string",
      customValidator: async () => false,
      customValidatorError: "Username is already taken",
    },
  },
  {
    prettyErrors: true,
  },
);

check(
  "v1.8 prettyErrors async formats async customValidator errors",
  prettyErrorsAsyncValidatorResult.valid === false &&
    prettyErrorsAsyncValidatorResult.errors?.length === 1 &&
    prettyErrorsAsyncValidatorResult.errors?.[0] ===
      "Username is already taken",
);

// --------------------------------------------------
// 8. ASYNC - DEFAULT REMAINS STRUCTURED
// --------------------------------------------------

const prettyErrorsAsyncDefaultResult = await perfectPayloadAsync(
  {
    username: "taken-user",
  },
  {
    username: {
      mandatory: true,
      type: "string",
      customValidator: async () => false,
    },
  },
);

check(
  "v1.8 prettyErrors async defaults to structured errors",
  prettyErrorsAsyncDefaultResult.valid === false &&
    prettyErrorsAsyncDefaultResult.errors?.length === 1 &&
    typeof prettyErrorsAsyncDefaultResult.errors?.[0] === "object" &&
    prettyErrorsAsyncDefaultResult.errors?.[0]?.path === "username" &&
    prettyErrorsAsyncDefaultResult.errors?.[0]?.code ===
      "CUSTOM_VALIDATION_FAILED",
);

// --------------------------------------------------
// 9. ASYNC - INVALID prettyErrors CONFIG
// --------------------------------------------------

let prettyErrorsAsyncConfigError = null;

try {
  await perfectPayloadAsync(
    {},
    {},
    {
      prettyErrors: 1,
    },
  );
} catch (error) {
  prettyErrorsAsyncConfigError = error;
}

check(
  "v1.8 prettyErrors async rejects non-boolean option",
  prettyErrorsAsyncConfigError?.message ===
    "perfect-payload:- prettyErrors must be a boolean",
);

// --------------------------------------------------
// 10. UNKNOWN FIELD + prettyErrors:true
// --------------------------------------------------

const prettyErrorsUnknownFieldResult = perfectPayload(
  {
    name: "Kiran",
    internalId: "SECRET-123",
  },
  {
    name: {
      type: "string",
    },
  },
  {
    unknownFields: "reject",
    prettyErrors: true,
  },
);

check(
  "v1.8 prettyErrors works with unknownFields reject",
  prettyErrorsUnknownFieldResult.valid === false &&
    prettyErrorsUnknownFieldResult.errors?.length === 1 &&
    prettyErrorsUnknownFieldResult.errors?.[0] ===
      "Unknown field internalId is not allowed",
);

// ==================================================
// v1.8.0 - FRAMEWORK CONFIGURATION
// ==================================================

// --------------------------------------------------
// 1. BODY ONLY
// --------------------------------------------------

const bodyOnlySources = validateFrameworkConfig({
  rule: {
    body: {
      email: {
        type: "email",
      },
    },
  },
});

check(
  "v1.8 framework config supports body source",
  JSON.stringify(bodyOnlySources) === JSON.stringify(["body"]),
);

// --------------------------------------------------
// 2. ALL SOURCES - STANDARD ORDER
// Consumer intentionally provides a different order.
// --------------------------------------------------

const allSources = validateFrameworkConfig({
  rule: {
    body: {
      name: {
        type: "string",
      },
    },
    query: {
      page: {
        type: "number",
      },
    },
    headers: {
      authorization: {
        type: "string",
      },
    },
    params: {
      userId: {
        type: "string",
      },
    },
  },
});

check(
  "v1.8 framework config returns sources in standard order",
  JSON.stringify(allSources) ===
    JSON.stringify(["headers", "params", "query", "body"]),
);

// --------------------------------------------------
// 3. PARTIAL SOURCES - STANDARD ORDER
// --------------------------------------------------

const partialSources = validateFrameworkConfig({
  rule: {
    body: {
      name: {
        type: "string",
      },
    },
    headers: {
      authorization: {
        type: "string",
      },
    },
  },
});

check(
  "v1.8 framework config preserves standard order for partial sources",
  JSON.stringify(partialSources) === JSON.stringify(["headers", "body"]),
);

// --------------------------------------------------
// 4. MISSING RULE
// --------------------------------------------------

let missingRuleError = null;

try {
  validateFrameworkConfig();
} catch (error) {
  missingRuleError = error;
}

check(
  "v1.8 framework config rejects missing rule",
  missingRuleError?.message ===
    "perfect-payload:- framework rule must be an object",
);

// --------------------------------------------------
// 5. NULL RULE
// --------------------------------------------------

let nullRuleError = null;

try {
  validateFrameworkConfig({
    rule: null,
  });
} catch (error) {
  nullRuleError = error;
}

check(
  "v1.8 framework config rejects null rule",
  nullRuleError?.message ===
    "perfect-payload:- framework rule must be an object",
);

// --------------------------------------------------
// 6. ARRAY RULE
// --------------------------------------------------

let arrayRuleError = null;

try {
  validateFrameworkConfig({
    rule: [],
  });
} catch (error) {
  arrayRuleError = error;
}

check(
  "v1.8 framework config rejects array rule",
  arrayRuleError?.message ===
    "perfect-payload:- framework rule must be an object",
);

// --------------------------------------------------
// 7. EMPTY RULE
// --------------------------------------------------

let emptyRuleError = null;

try {
  validateFrameworkConfig({
    rule: {},
  });
} catch (error) {
  emptyRuleError = error;
}

check(
  "v1.8 framework config rejects empty rule",
  emptyRuleError?.message ===
    "perfect-payload:- framework rule must contain at least one request source",
);

// --------------------------------------------------
// 8. UNSUPPORTED SOURCE
// --------------------------------------------------

let unsupportedSourceError = null;

try {
  validateFrameworkConfig({
    rule: {
      cookies: {
        sessionId: {
          type: "string",
        },
      },
    },
  });
} catch (error) {
  unsupportedSourceError = error;
}

check(
  "v1.8 framework config rejects unsupported request source",
  unsupportedSourceError?.message ===
    "perfect-payload:- unsupported request source cookies",
);

// --------------------------------------------------
// 9. INVALID SOURCE RULE - NULL
// --------------------------------------------------

let nullSourceRuleError = null;

try {
  validateFrameworkConfig({
    rule: {
      body: null,
    },
  });
} catch (error) {
  nullSourceRuleError = error;
}

check(
  "v1.8 framework config rejects null source rule",
  nullSourceRuleError?.message ===
    "perfect-payload:- rule for request source body must be an object",
);

// --------------------------------------------------
// 10. INVALID SOURCE RULE - ARRAY
// --------------------------------------------------

let arraySourceRuleError = null;

try {
  validateFrameworkConfig({
    rule: {
      query: [],
    },
  });
} catch (error) {
  arraySourceRuleError = error;
}

check(
  "v1.8 framework config rejects array source rule",
  arraySourceRuleError?.message ===
    "perfect-payload:- rule for request source query must be an object",
);

// --------------------------------------------------
// 11. INVALID OPTIONS
// --------------------------------------------------

let invalidOptionsError = null;

try {
  validateFrameworkConfig({
    rule: {
      body: {
        name: {
          type: "string",
        },
      },
    },
    options: "invalid",
  });
} catch (error) {
  invalidOptionsError = error;
}

check(
  "v1.8 framework config rejects non-object options",
  invalidOptionsError?.message ===
    "perfect-payload:- framework options must be an object",
);

// --------------------------------------------------
// 12. VALID OPTIONS
// --------------------------------------------------

const validOptionsSources = validateFrameworkConfig({
  rule: {
    params: {
      id: {
        type: "string",
      },
    },
  },
  options: {
    unknownFields: "reject",
    prettyErrors: true,
  },
});

check(
  "v1.8 framework config accepts core options",
  JSON.stringify(validOptionsSources) === JSON.stringify(["params"]),
);

// ==================================================
// v1.8.0 - FRAMEWORK SYNC SOURCE AGGREGATION
// ==================================================

// --------------------------------------------------
// 1. BODY ONLY - SUCCESS
// --------------------------------------------------

const frameworkBodySuccess = validateFrameworkSources({
  data: {
    body: {
      name: "Kiran",
      email: "kiran@example.com",
    },
  },
  rule: {
    body: {
      name: {
        mandatory: true,
        type: "string",
      },
      email: {
        mandatory: true,
        type: "email",
      },
    },
  },
});

check(
  "v1.8 framework sync validates body source",
  frameworkBodySuccess.valid === true &&
    frameworkBodySuccess.validatedPayload?.body?.name === "Kiran" &&
    frameworkBodySuccess.validatedPayload?.body?.email ===
      "kiran@example.com" &&
    Object.keys(frameworkBodySuccess.validatedPayload).length === 1,
);

// --------------------------------------------------
// 2. MULTIPLE SOURCES - SUCCESS
// --------------------------------------------------

const frameworkMultipleSuccess = validateFrameworkSources({
  data: {
    headers: {
      authorization: "Bearer token",
    },
    params: {
      userId: "123",
    },
    query: {
      search: "phone",
    },
    body: {
      name: "Kiran",
    },
  },
  rule: {
    body: {
      name: {
        type: "string",
      },
    },
    query: {
      search: {
        type: "string",
      },
    },
    params: {
      userId: {
        type: "string",
      },
    },
    headers: {
      authorization: {
        type: "string",
      },
    },
  },
});

check(
  "v1.8 framework sync validates multiple sources",
  frameworkMultipleSuccess.valid === true &&
    frameworkMultipleSuccess.validatedPayload?.headers?.authorization ===
      "Bearer token" &&
    frameworkMultipleSuccess.validatedPayload?.params?.userId === "123" &&
    frameworkMultipleSuccess.validatedPayload?.query?.search === "phone" &&
    frameworkMultipleSuccess.validatedPayload?.body?.name === "Kiran",
);

check(
  "v1.8 framework sync returns validated sources in standard order",
  JSON.stringify(Object.keys(frameworkMultipleSuccess.validatedPayload)) ===
    JSON.stringify(["headers", "params", "query", "body"]),
);

// --------------------------------------------------
// 3. MULTIPLE SOURCES - AGGREGATE ERRORS
// --------------------------------------------------

const frameworkMultipleErrors = validateFrameworkSources({
  data: {
    headers: {},
    params: {
      userId: 123,
    },
    query: {
      page: "invalid",
    },
    body: {
      email: "invalid-email",
    },
  },
  rule: {
    body: {
      email: {
        mandatory: true,
        type: "email",
      },
    },
    query: {
      page: {
        mandatory: true,
        type: "number",
      },
    },
    params: {
      userId: {
        mandatory: true,
        type: "string",
      },
    },
    headers: {
      authorization: {
        mandatory: true,
        type: "string",
      },
    },
  },
});

check(
  "v1.8 framework sync aggregates errors from all configured sources",
  frameworkMultipleErrors.valid === false &&
    frameworkMultipleErrors.errors?.length === 4,
);

check(
  "v1.8 framework sync prefixes structured error paths with source",
  frameworkMultipleErrors.errors?.[0]?.path === "headers.authorization" &&
    frameworkMultipleErrors.errors?.[1]?.path === "params.userId" &&
    frameworkMultipleErrors.errors?.[2]?.path === "query.page" &&
    frameworkMultipleErrors.errors?.[3]?.path === "body.email",
);

check(
  "v1.8 framework sync preserves deterministic error order",
  frameworkMultipleErrors.errors?.[0]?.code === "REQUIRED" &&
    frameworkMultipleErrors.errors?.[1]?.code === "INVALID_TYPE" &&
    frameworkMultipleErrors.errors?.[2]?.code === "INVALID_TYPE" &&
    frameworkMultipleErrors.errors?.[3]?.code === "INVALID_EMAIL",
);

// --------------------------------------------------
// 4. MISSING REQUEST SOURCE BECOMES {}
// --------------------------------------------------

const frameworkMissingBody = validateFrameworkSources({
  data: {},
  rule: {
    body: {
      email: {
        mandatory: true,
        type: "email",
      },
    },
  },
});

check(
  "v1.8 framework sync treats missing configured source as empty object",
  frameworkMissingBody.valid === false &&
    frameworkMissingBody.errors?.length === 1 &&
    frameworkMissingBody.errors?.[0]?.path === "body.email" &&
    frameworkMissingBody.errors?.[0]?.code === "REQUIRED",
);

// --------------------------------------------------
// 5. UNKNOWN FIELDS - STRIP
// --------------------------------------------------

const frameworkUnknownStrip = validateFrameworkSources({
  data: {
    body: {
      name: "Kiran",
      internalId: "SECRET-123",
    },
  },
  rule: {
    body: {
      name: {
        type: "string",
      },
    },
  },
});

check(
  "v1.8 framework sync inherits unknownFields strip",
  frameworkUnknownStrip.valid === true &&
    frameworkUnknownStrip.validatedPayload?.body?.name === "Kiran" &&
    frameworkUnknownStrip.validatedPayload?.body?.internalId === undefined,
);

// --------------------------------------------------
// 6. UNKNOWN FIELDS - ALLOW
// --------------------------------------------------

const frameworkUnknownAllow = validateFrameworkSources({
  data: {
    body: {
      name: "Kiran",
      internalId: "SECRET-123",
    },
  },
  rule: {
    body: {
      name: {
        type: "string",
      },
    },
  },
  options: {
    unknownFields: "allow",
  },
});

check(
  "v1.8 framework sync inherits unknownFields allow",
  frameworkUnknownAllow.valid === true &&
    frameworkUnknownAllow.validatedPayload?.body?.name === "Kiran" &&
    frameworkUnknownAllow.validatedPayload?.body?.internalId === "SECRET-123",
);

// --------------------------------------------------
// 7. UNKNOWN FIELDS - REJECT
// --------------------------------------------------

const frameworkUnknownReject = validateFrameworkSources({
  data: {
    body: {
      name: "Kiran",
      internalId: "SECRET-123",
    },
  },
  rule: {
    body: {
      name: {
        type: "string",
      },
    },
  },
  options: {
    unknownFields: "reject",
  },
});

check(
  "v1.8 framework sync prefixes UNKNOWN_FIELD path",
  frameworkUnknownReject.valid === false &&
    frameworkUnknownReject.errors?.length === 1 &&
    frameworkUnknownReject.errors?.[0]?.path === "body.internalId" &&
    frameworkUnknownReject.errors?.[0]?.code === "UNKNOWN_FIELD",
);

// --------------------------------------------------
// 8. prettyErrors:true
// --------------------------------------------------

const frameworkPrettyErrors = validateFrameworkSources({
  data: {
    params: {
      userId: 123,
    },
    body: {
      email: "invalid-email",
    },
  },
  rule: {
    body: {
      email: {
        type: "email",
      },
    },
    params: {
      userId: {
        type: "string",
      },
    },
  },
  options: {
    prettyErrors: true,
  },
});

check(
  "v1.8 framework sync preserves pretty error strings",
  frameworkPrettyErrors.valid === false &&
    frameworkPrettyErrors.errors?.length === 2 &&
    frameworkPrettyErrors.errors?.every((error) => typeof error === "string") &&
    frameworkPrettyErrors.errors?.[0] ===
      "Invalid type for attribute userId, required string value" &&
    frameworkPrettyErrors.errors?.[1] ===
      "Invalid email format for attribute email",
);

// --------------------------------------------------
// 9. CUSTOM INVALID RESPONSE
// --------------------------------------------------

const frameworkCustomInvalidResponse = validateFrameworkSources({
  data: {
    body: {
      email: "invalid-email",
    },
  },
  rule: {
    body: {
      email: {
        type: "email",
      },
    },
  },
  options: {
    inValidPayloadResponse: {
      statusCode: 422,
      valid: false,
      message: "Request validation failed",
    },
  },
});

check(
  "v1.8 framework sync preserves custom invalid response",
  frameworkCustomInvalidResponse.valid === false &&
    frameworkCustomInvalidResponse.statusCode === 422 &&
    frameworkCustomInvalidResponse.message === "Request validation failed" &&
    frameworkCustomInvalidResponse.errors?.length === 1,
);

// --------------------------------------------------
// 10. TRANSFORMED VALUES
// --------------------------------------------------

const frameworkTransformResult = validateFrameworkSources({
  data: {
    query: {
      search: "  HELLO WORLD  ",
    },
    body: {
      email: "  USER@EXAMPLE.COM  ",
    },
  },
  rule: {
    query: {
      search: {
        type: "string",
        trim: true,
        lowercase: true,
      },
    },
    body: {
      email: {
        type: "email",
        trim: true,
        lowercase: true,
      },
    },
  },
});

check(
  "v1.8 framework sync preserves transformed source values",
  frameworkTransformResult.valid === true &&
    frameworkTransformResult.validatedPayload?.query?.search ===
      "hello world" &&
    frameworkTransformResult.validatedPayload?.body?.email ===
      "user@example.com",
);

// --------------------------------------------------
// 11. ORIGINAL SOURCE DATA MUST NOT BE MUTATED
// --------------------------------------------------

const originalFrameworkData = {
  body: {
    email: "  USER@EXAMPLE.COM  ",
  },
};

const originalFrameworkEmail = originalFrameworkData.body.email;

validateFrameworkSources({
  data: originalFrameworkData,
  rule: {
    body: {
      email: {
        type: "email",
        trim: true,
        lowercase: true,
      },
    },
  },
});

check(
  "v1.8 framework sync does not mutate original request source data",
  originalFrameworkData.body.email === originalFrameworkEmail,
);

// --------------------------------------------------
// 12. CORE CONFIG ERRORS PROPAGATE
// --------------------------------------------------

let frameworkCoreConfigError = null;

try {
  validateFrameworkSources({
    data: {
      body: {},
    },
    rule: {
      body: {
        name: {
          type: "string",
        },
      },
    },
    options: {
      prettyErrors: "true",
    },
  });
} catch (error) {
  frameworkCoreConfigError = error;
}

check(
  "v1.8 framework sync propagates core option configuration errors",
  frameworkCoreConfigError?.message ===
    "perfect-payload:- prettyErrors must be a boolean",
);

// --------------------------------------------------
// 13. CUSTOM VALIDATOR THROWN ERROR PROPAGATES
// --------------------------------------------------

const frameworkThrownError = new Error("External validation service failed");

let propagatedFrameworkError = null;

try {
  validateFrameworkSources({
    data: {
      body: {
        username: "kiran",
      },
    },
    rule: {
      body: {
        username: {
          type: "string",
          customValidator: () => {
            throw frameworkThrownError;
          },
        },
      },
    },
  });
} catch (error) {
  propagatedFrameworkError = error;
}

check(
  "v1.8 framework sync propagates customValidator thrown errors",
  propagatedFrameworkError === frameworkThrownError,
);

// ==================================================
// v1.8.0 - FRAMEWORK ASYNC SOURCE AGGREGATION
// ==================================================

// --------------------------------------------------
// 1. BODY ONLY - ASYNC SUCCESS
// --------------------------------------------------

const frameworkAsyncBodySuccess = await validateFrameworkSourcesAsync({
  data: {
    body: {
      username: "kiran",
    },
  },
  rule: {
    body: {
      username: {
        mandatory: true,
        type: "string",
        customValidator: async () => true,
      },
    },
  },
});

check(
  "v1.8 framework async validates body source",
  frameworkAsyncBodySuccess.valid === true &&
    frameworkAsyncBodySuccess.validatedPayload?.body?.username === "kiran" &&
    Object.keys(frameworkAsyncBodySuccess.validatedPayload).length === 1,
);

// --------------------------------------------------
// 2. MULTIPLE SOURCES - ASYNC SUCCESS
// --------------------------------------------------

const frameworkAsyncMultipleSuccess = await validateFrameworkSourcesAsync({
  data: {
    headers: {
      authorization: "Bearer token",
    },
    params: {
      userId: "123",
    },
    query: {
      search: "phone",
    },
    body: {
      username: "kiran",
    },
  },
  rule: {
    body: {
      username: {
        type: "string",
        customValidator: async () => true,
      },
    },
    query: {
      search: {
        type: "string",
        customValidator: async () => true,
      },
    },
    params: {
      userId: {
        type: "string",
        customValidator: async () => true,
      },
    },
    headers: {
      authorization: {
        type: "string",
        customValidator: async () => true,
      },
    },
  },
});

check(
  "v1.8 framework async validates multiple sources",
  frameworkAsyncMultipleSuccess.valid === true &&
    frameworkAsyncMultipleSuccess.validatedPayload?.headers?.authorization ===
      "Bearer token" &&
    frameworkAsyncMultipleSuccess.validatedPayload?.params?.userId === "123" &&
    frameworkAsyncMultipleSuccess.validatedPayload?.query?.search === "phone" &&
    frameworkAsyncMultipleSuccess.validatedPayload?.body?.username === "kiran",
);

check(
  "v1.8 framework async returns sources in standard order",
  JSON.stringify(
    Object.keys(frameworkAsyncMultipleSuccess.validatedPayload),
  ) === JSON.stringify(["headers", "params", "query", "body"]),
);

// --------------------------------------------------
// 3. MULTIPLE ASYNC FAILURES - AGGREGATE
// --------------------------------------------------

const frameworkAsyncMultipleErrors = await validateFrameworkSourcesAsync({
  data: {
    headers: {
      authorization: "invalid-token",
    },
    params: {
      userId: "123",
    },
    query: {
      search: "phone",
    },
    body: {
      username: "taken-user",
    },
  },
  rule: {
    body: {
      username: {
        type: "string",
        customValidator: async () => false,
        customValidatorError: "Username is already taken",
      },
    },
    query: {
      search: {
        type: "string",
        customValidator: async () => false,
        customValidatorError: "Search is not allowed",
      },
    },
    params: {
      userId: {
        type: "string",
        customValidator: async () => false,
        customValidatorError: "User does not exist",
      },
    },
    headers: {
      authorization: {
        type: "string",
        customValidator: async () => false,
        customValidatorError: "Authorization failed",
      },
    },
  },
});

check(
  "v1.8 framework async aggregates errors from all sources",
  frameworkAsyncMultipleErrors.valid === false &&
    frameworkAsyncMultipleErrors.errors?.length === 4,
);

check(
  "v1.8 framework async prefixes structured error paths",
  frameworkAsyncMultipleErrors.errors?.[0]?.path === "headers.authorization" &&
    frameworkAsyncMultipleErrors.errors?.[1]?.path === "params.userId" &&
    frameworkAsyncMultipleErrors.errors?.[2]?.path === "query.search" &&
    frameworkAsyncMultipleErrors.errors?.[3]?.path === "body.username",
);

check(
  "v1.8 framework async preserves deterministic error order",
  frameworkAsyncMultipleErrors.errors?.[0]?.message ===
    "Authorization failed" &&
    frameworkAsyncMultipleErrors.errors?.[1]?.message ===
      "User does not exist" &&
    frameworkAsyncMultipleErrors.errors?.[2]?.message ===
      "Search is not allowed" &&
    frameworkAsyncMultipleErrors.errors?.[3]?.message ===
      "Username is already taken",
);

// --------------------------------------------------
// 4. COMPLETION ORDER MUST NOT CHANGE RESULT ORDER
// --------------------------------------------------

const frameworkAsyncCompletionOrder = await validateFrameworkSourcesAsync({
  data: {
    headers: {
      value: "header",
    },
    params: {
      value: "param",
    },
    query: {
      value: "query",
    },
    body: {
      value: "body",
    },
  },
  rule: {
    headers: {
      value: {
        type: "string",
        customValidator: async () => {
          await new Promise((resolve) => setTimeout(resolve, 80));
          return false;
        },
        customValidatorError: "Header failure",
      },
    },
    params: {
      value: {
        type: "string",
        customValidator: async () => {
          await new Promise((resolve) => setTimeout(resolve, 60));
          return false;
        },
        customValidatorError: "Params failure",
      },
    },
    query: {
      value: {
        type: "string",
        customValidator: async () => {
          await new Promise((resolve) => setTimeout(resolve, 40));
          return false;
        },
        customValidatorError: "Query failure",
      },
    },
    body: {
      value: {
        type: "string",
        customValidator: async () => {
          await new Promise((resolve) => setTimeout(resolve, 20));
          return false;
        },
        customValidatorError: "Body failure",
      },
    },
  },
});

check(
  "v1.8 framework async completion order does not affect error order",
  frameworkAsyncCompletionOrder.errors?.[0]?.message === "Header failure" &&
    frameworkAsyncCompletionOrder.errors?.[1]?.message === "Params failure" &&
    frameworkAsyncCompletionOrder.errors?.[2]?.message === "Query failure" &&
    frameworkAsyncCompletionOrder.errors?.[3]?.message === "Body failure",
);

// --------------------------------------------------
// 5. SOURCES ACTUALLY RUN CONCURRENTLY
// --------------------------------------------------

const frameworkConcurrencyStartedAt = Date.now();

const frameworkConcurrencyResult = await validateFrameworkSourcesAsync({
  data: {
    headers: {
      value: "header",
    },
    params: {
      value: "param",
    },
    query: {
      value: "query",
    },
    body: {
      value: "body",
    },
  },
  rule: {
    headers: {
      value: {
        type: "string",
        customValidator: async () => {
          await new Promise((resolve) => setTimeout(resolve, 100));
          return true;
        },
      },
    },
    params: {
      value: {
        type: "string",
        customValidator: async () => {
          await new Promise((resolve) => setTimeout(resolve, 100));
          return true;
        },
      },
    },
    query: {
      value: {
        type: "string",
        customValidator: async () => {
          await new Promise((resolve) => setTimeout(resolve, 100));
          return true;
        },
      },
    },
    body: {
      value: {
        type: "string",
        customValidator: async () => {
          await new Promise((resolve) => setTimeout(resolve, 100));
          return true;
        },
      },
    },
  },
});

const frameworkConcurrencyDuration = Date.now() - frameworkConcurrencyStartedAt;

check(
  "v1.8 framework async executes request sources concurrently",
  frameworkConcurrencyResult.valid === true &&
    frameworkConcurrencyDuration < 300,
);

// --------------------------------------------------
// 6. SYNC VALIDATION FAILURE STILL WORKS
// --------------------------------------------------

const frameworkAsyncSyncFailure = await validateFrameworkSourcesAsync({
  data: {
    body: {
      email: "invalid-email",
    },
  },
  rule: {
    body: {
      email: {
        type: "email",
        customValidator: async () => true,
      },
    },
  },
});

check(
  "v1.8 framework async preserves core sync-first validation",
  frameworkAsyncSyncFailure.valid === false &&
    frameworkAsyncSyncFailure.errors?.length === 1 &&
    frameworkAsyncSyncFailure.errors?.[0]?.path === "body.email" &&
    frameworkAsyncSyncFailure.errors?.[0]?.code === "INVALID_EMAIL",
);

// --------------------------------------------------
// 7. MISSING SOURCE BECOMES {}
// --------------------------------------------------

const frameworkAsyncMissingSource = await validateFrameworkSourcesAsync({
  data: {},
  rule: {
    body: {
      username: {
        mandatory: true,
        type: "string",
        customValidator: async () => true,
      },
    },
  },
});

check(
  "v1.8 framework async treats missing source as empty object",
  frameworkAsyncMissingSource.valid === false &&
    frameworkAsyncMissingSource.errors?.length === 1 &&
    frameworkAsyncMissingSource.errors?.[0]?.path === "body.username" &&
    frameworkAsyncMissingSource.errors?.[0]?.code === "REQUIRED",
);

// --------------------------------------------------
// 8. prettyErrors:true - ASYNC VALIDATOR
// --------------------------------------------------

const frameworkAsyncPrettyErrors = await validateFrameworkSourcesAsync({
  data: {
    params: {
      userId: "123",
    },
    body: {
      username: "taken-user",
    },
  },
  rule: {
    body: {
      username: {
        type: "string",
        customValidator: async () => false,
        customValidatorError: "Username is already taken",
      },
    },
    params: {
      userId: {
        type: "string",
        customValidator: async () => false,
        customValidatorError: "User does not exist",
      },
    },
  },
  options: {
    prettyErrors: true,
  },
});

check(
  "v1.8 framework async preserves pretty error strings",
  frameworkAsyncPrettyErrors.valid === false &&
    frameworkAsyncPrettyErrors.errors?.length === 2 &&
    frameworkAsyncPrettyErrors.errors?.every(
      (error) => typeof error === "string",
    ) &&
    frameworkAsyncPrettyErrors.errors?.[0] === "User does not exist" &&
    frameworkAsyncPrettyErrors.errors?.[1] === "Username is already taken",
);

// --------------------------------------------------
// 9. CUSTOM INVALID RESPONSE
// --------------------------------------------------

const frameworkAsyncCustomResponse = await validateFrameworkSourcesAsync({
  data: {
    body: {
      username: "taken-user",
    },
  },
  rule: {
    body: {
      username: {
        type: "string",
        customValidator: async () => false,
      },
    },
  },
  options: {
    inValidPayloadResponse: {
      statusCode: 422,
      valid: false,
      message: "Async request validation failed",
    },
  },
});

check(
  "v1.8 framework async preserves custom invalid response",
  frameworkAsyncCustomResponse.valid === false &&
    frameworkAsyncCustomResponse.statusCode === 422 &&
    frameworkAsyncCustomResponse.message ===
      "Async request validation failed" &&
    frameworkAsyncCustomResponse.errors?.length === 1,
);

// --------------------------------------------------
// 10. TRANSFORMED VALUES
// --------------------------------------------------

const frameworkAsyncTransform = await validateFrameworkSourcesAsync({
  data: {
    body: {
      username: "  KIRAN  ",
    },
  },
  rule: {
    body: {
      username: {
        type: "string",
        trim: true,
        lowercase: true,
        customValidator: async (value) => value === "kiran",
      },
    },
  },
});

check(
  "v1.8 framework async preserves transformed values",
  frameworkAsyncTransform.valid === true &&
    frameworkAsyncTransform.validatedPayload?.body?.username === "kiran",
);

// --------------------------------------------------
// 11. ORIGINAL DATA IS NOT MUTATED
// --------------------------------------------------

const originalAsyncFrameworkData = {
  body: {
    username: "  KIRAN  ",
  },
};

await validateFrameworkSourcesAsync({
  data: originalAsyncFrameworkData,
  rule: {
    body: {
      username: {
        type: "string",
        trim: true,
        lowercase: true,
        customValidator: async () => true,
      },
    },
  },
});

check(
  "v1.8 framework async does not mutate original source data",
  originalAsyncFrameworkData.body.username === "  KIRAN  ",
);

// --------------------------------------------------
// 12. ASYNC VALIDATOR THROWN ERROR PROPAGATES
// --------------------------------------------------

const expectedAsyncFrameworkError = new Error("Database unavailable");

let propagatedAsyncFrameworkError = null;

try {
  await validateFrameworkSourcesAsync({
    data: {
      body: {
        username: "kiran",
      },
    },
    rule: {
      body: {
        username: {
          type: "string",
          customValidator: async () => {
            throw expectedAsyncFrameworkError;
          },
        },
      },
    },
  });
} catch (error) {
  propagatedAsyncFrameworkError = error;
}

check(
  "v1.8 framework async propagates customValidator thrown errors",
  propagatedAsyncFrameworkError === expectedAsyncFrameworkError,
);

// --------------------------------------------------
// 13. CORE CONFIG ERROR PROPAGATES
// --------------------------------------------------

let frameworkAsyncConfigError = null;

try {
  await validateFrameworkSourcesAsync({
    data: {
      body: {},
    },
    rule: {
      body: {
        name: {
          type: "string",
        },
      },
    },
    options: {
      prettyErrors: "true",
    },
  });
} catch (error) {
  frameworkAsyncConfigError = error;
}

check(
  "v1.8 framework async propagates core option configuration errors",
  frameworkAsyncConfigError?.message ===
    "perfect-payload:- prettyErrors must be a boolean",
);

// ==================================================
// v1.8.0 - EXPRESS ADAPTER
// ==================================================

function createMockExpressResponse() {
  return {
    statusCode: null,
    body: null,

    status(code) {
      this.statusCode = code;
      return this;
    },

    json(body) {
      this.body = body;
      return this;
    },
  };
}

// --------------------------------------------------
// 1. SYNC - BODY SUCCESS
// --------------------------------------------------

{
  const middleware = validateExpressPayload({
    rule: {
      body: {
        email: {
          mandatory: true,
          type: "email",
        },
      },
    },
  });

  const req = {
    headers: {},
    params: {},
    query: {},
    body: {
      email: "user@example.com",
    },
  };

  const res = createMockExpressResponse();

  let nextCalled = false;

  middleware(req, res, () => {
    nextCalled = true;
  });

  check(
    "v1.8 Express sync attaches validatedPayload and calls next",
    nextCalled === true &&
      req.validatedPayload?.body?.email === "user@example.com" &&
      Object.keys(req.validatedPayload).length === 1 &&
      res.statusCode === null &&
      res.body === null,
  );
}

// --------------------------------------------------
// 2. SYNC - MULTIPLE SOURCES SUCCESS
// --------------------------------------------------

{
  const middleware = validateExpressPayload({
    rule: {
      body: {
        name: {
          type: "string",
        },
      },
      params: {
        userId: {
          type: "string",
        },
      },
      headers: {
        authorization: {
          type: "string",
        },
      },
    },
  });

  const req = {
    headers: {
      authorization: "Bearer token",
    },
    params: {
      userId: "123",
    },
    query: {
      ignored: "not-configured",
    },
    body: {
      name: "Kiran",
    },
  };

  const res = createMockExpressResponse();

  let nextCalled = false;

  middleware(req, res, () => {
    nextCalled = true;
  });

  check(
    "v1.8 Express sync attaches configured sources in standard order",
    nextCalled === true &&
      JSON.stringify(Object.keys(req.validatedPayload)) ===
        JSON.stringify(["headers", "params", "body"]) &&
      req.validatedPayload?.headers?.authorization === "Bearer token" &&
      req.validatedPayload?.params?.userId === "123" &&
      req.validatedPayload?.body?.name === "Kiran" &&
      req.validatedPayload?.query === undefined,
  );
}

// --------------------------------------------------
// 3. SYNC - VALIDATION FAILURE
// --------------------------------------------------

{
  const middleware = validateExpressPayload({
    rule: {
      body: {
        email: {
          mandatory: true,
          type: "email",
        },
      },
    },
  });

  const req = {
    headers: {},
    params: {},
    query: {},
    body: {
      email: "invalid-email",
    },
  };

  const res = createMockExpressResponse();

  let nextCalled = false;

  middleware(req, res, () => {
    nextCalled = true;
  });

  check(
    "v1.8 Express sync sends 400 validation response",
    nextCalled === false &&
      res.statusCode === 400 &&
      res.body?.valid === false &&
      res.body?.errors?.length === 1 &&
      res.body?.errors?.[0]?.path === "body.email" &&
      res.body?.errors?.[0]?.code === "INVALID_EMAIL",
  );
}

// --------------------------------------------------
// 4. SYNC - CUSTOM FAILURE STATUS
// --------------------------------------------------

{
  const middleware = validateExpressPayload({
    rule: {
      body: {
        email: {
          type: "email",
        },
      },
    },
    options: {
      inValidPayloadResponse: {
        statusCode: 422,
        valid: false,
        message: "Request validation failed",
      },
    },
  });

  const req = {
    headers: {},
    params: {},
    query: {},
    body: {
      email: "invalid-email",
    },
  };

  const res = createMockExpressResponse();

  let nextCalled = false;

  middleware(req, res, () => {
    nextCalled = true;
  });

  check(
    "v1.8 Express sync uses custom invalid response status",
    nextCalled === false &&
      res.statusCode === 422 &&
      res.body?.statusCode === 422 &&
      res.body?.valid === false &&
      res.body?.message === "Request validation failed",
  );
}

// --------------------------------------------------
// 5. SYNC - prettyErrors:true
// --------------------------------------------------

{
  const middleware = validateExpressPayload({
    rule: {
      body: {
        email: {
          type: "email",
        },
      },
    },
    options: {
      prettyErrors: true,
    },
  });

  const req = {
    headers: {},
    params: {},
    query: {},
    body: {
      email: "invalid-email",
    },
  };

  const res = createMockExpressResponse();

  let nextCalled = false;

  middleware(req, res, () => {
    nextCalled = true;
  });

  check(
    "v1.8 Express sync supports prettyErrors",
    nextCalled === false &&
      res.statusCode === 400 &&
      typeof res.body?.errors?.[0] === "string" &&
      res.body?.errors?.[0] === "Invalid email format for attribute email",
  );
}

// --------------------------------------------------
// 6. SYNC - ORIGINAL REQUEST BODY NOT MUTATED
// --------------------------------------------------

{
  const middleware = validateExpressPayload({
    rule: {
      body: {
        email: {
          type: "email",
          trim: true,
          lowercase: true,
        },
      },
    },
  });

  const req = {
    headers: {},
    params: {},
    query: {},
    body: {
      email: "  USER@EXAMPLE.COM  ",
    },
  };

  const res = createMockExpressResponse();

  middleware(req, res, () => {});

  check(
    "v1.8 Express sync does not mutate original request body",
    req.body.email === "  USER@EXAMPLE.COM  " &&
      req.validatedPayload?.body?.email === "user@example.com",
  );
}

// --------------------------------------------------
// 7. SYNC - THROWN VALIDATOR ERROR GOES TO next(error)
// --------------------------------------------------

{
  const expectedError = new Error("External service failed");

  const middleware = validateExpressPayload({
    rule: {
      body: {
        username: {
          type: "string",
          customValidator: () => {
            throw expectedError;
          },
        },
      },
    },
  });

  const req = {
    headers: {},
    params: {},
    query: {},
    body: {
      username: "kiran",
    },
  };

  const res = createMockExpressResponse();

  let receivedError = null;

  middleware(req, res, (error) => {
    receivedError = error;
  });

  check(
    "v1.8 Express sync forwards thrown errors to next",
    receivedError === expectedError &&
      res.statusCode === null &&
      res.body === null,
  );
}

// --------------------------------------------------
// 8. CONFIG ERROR THROWS DURING MIDDLEWARE CREATION
// --------------------------------------------------

{
  let configError = null;

  try {
    validateExpressPayload({
      rule: {
        cookies: {
          sessionId: {
            type: "string",
          },
        },
      },
    });
  } catch (error) {
    configError = error;
  }

  check(
    "v1.8 Express validates configuration during middleware creation",
    configError?.message ===
      "perfect-payload:- unsupported request source cookies",
  );
}

// --------------------------------------------------
// 9. ASYNC - SUCCESS
// --------------------------------------------------

{
  const middleware = validateExpressPayloadAsync({
    rule: {
      body: {
        username: {
          type: "string",
          customValidator: async () => true,
        },
      },
    },
  });

  const req = {
    headers: {},
    params: {},
    query: {},
    body: {
      username: "kiran",
    },
  };

  const res = createMockExpressResponse();

  let nextCalled = false;

  await middleware(req, res, () => {
    nextCalled = true;
  });

  check(
    "v1.8 Express async attaches validatedPayload and calls next",
    nextCalled === true &&
      req.validatedPayload?.body?.username === "kiran" &&
      res.statusCode === null &&
      res.body === null,
  );
}

// --------------------------------------------------
// 10. ASYNC - VALIDATION FAILURE
// --------------------------------------------------

{
  const middleware = validateExpressPayloadAsync({
    rule: {
      body: {
        username: {
          type: "string",
          customValidator: async () => false,
          customValidatorError: "Username is already taken",
        },
      },
    },
  });

  const req = {
    headers: {},
    params: {},
    query: {},
    body: {
      username: "taken-user",
    },
  };

  const res = createMockExpressResponse();

  let nextCalled = false;

  await middleware(req, res, () => {
    nextCalled = true;
  });

  check(
    "v1.8 Express async sends validation failure response",
    nextCalled === false &&
      res.statusCode === 400 &&
      res.body?.valid === false &&
      res.body?.errors?.length === 1 &&
      res.body?.errors?.[0]?.path === "body.username" &&
      res.body?.errors?.[0]?.code === "CUSTOM_VALIDATION_FAILED" &&
      res.body?.errors?.[0]?.message === "Username is already taken",
  );
}

// --------------------------------------------------
// 11. ASYNC - THROWN ERROR GOES TO next(error)
// --------------------------------------------------

{
  const expectedError = new Error("Database unavailable");

  const middleware = validateExpressPayloadAsync({
    rule: {
      body: {
        username: {
          type: "string",
          customValidator: async () => {
            throw expectedError;
          },
        },
      },
    },
  });

  const req = {
    headers: {},
    params: {},
    query: {},
    body: {
      username: "kiran",
    },
  };

  const res = createMockExpressResponse();

  let receivedError = null;

  await middleware(req, res, (error) => {
    receivedError = error;
  });

  check(
    "v1.8 Express async forwards thrown errors to next",
    receivedError === expectedError &&
      res.statusCode === null &&
      res.body === null,
  );
}

// --------------------------------------------------
// 12. MISSING REQUEST SOURCE
// --------------------------------------------------

{
  const middleware = validateExpressPayload({
    rule: {
      body: {
        email: {
          mandatory: true,
          type: "email",
        },
      },
    },
  });

  const req = {
    headers: {},
    params: {},
    query: {},
  };

  const res = createMockExpressResponse();

  middleware(req, res, () => {});

  check(
    "v1.8 Express treats missing configured source as empty object",
    res.statusCode === 400 &&
      res.body?.errors?.[0]?.path === "body.email" &&
      res.body?.errors?.[0]?.code === "REQUIRED",
  );
}

// ==================================================
// v1.8.0 - FASTIFY ADAPTER
// ==================================================

function createMockFastifyReply() {
  return {
    statusCode: null,
    body: null,

    code(code) {
      this.statusCode = code;
      return this;
    },

    send(body) {
      this.body = body;
      return this;
    },
  };
}

// --------------------------------------------------
// 1. SYNC - BODY SUCCESS
// --------------------------------------------------

{
  const hook = validateFastifyPayload({
    rule: {
      body: {
        email: {
          mandatory: true,
          type: "email",
        },
      },
    },
  });

  const request = {
    headers: {},
    params: {},
    query: {},
    body: {
      email: "user@example.com",
    },
  };

  const reply = createMockFastifyReply();

  const result = await hook(request, reply);

  check(
    "v1.8 Fastify sync attaches validatedPayload",
    result === undefined &&
      request.validatedPayload?.body?.email === "user@example.com" &&
      Object.keys(request.validatedPayload).length === 1 &&
      reply.statusCode === null &&
      reply.body === null,
  );
}

// --------------------------------------------------
// 2. SYNC - MULTIPLE SOURCES SUCCESS
// --------------------------------------------------

{
  const hook = validateFastifyPayload({
    rule: {
      body: {
        name: {
          type: "string",
        },
      },
      query: {
        search: {
          type: "string",
        },
      },
      params: {
        userId: {
          type: "string",
        },
      },
      headers: {
        authorization: {
          type: "string",
        },
      },
    },
  });

  const request = {
    headers: {
      authorization: "Bearer token",
    },
    params: {
      userId: "123",
    },
    query: {
      search: "phone",
    },
    body: {
      name: "Kiran",
    },
  };

  const reply = createMockFastifyReply();

  await hook(request, reply);

  check(
    "v1.8 Fastify sync attaches configured sources in standard order",
    JSON.stringify(Object.keys(request.validatedPayload)) ===
      JSON.stringify(["headers", "params", "query", "body"]) &&
      request.validatedPayload?.headers?.authorization === "Bearer token" &&
      request.validatedPayload?.params?.userId === "123" &&
      request.validatedPayload?.query?.search === "phone" &&
      request.validatedPayload?.body?.name === "Kiran" &&
      reply.statusCode === null &&
      reply.body === null,
  );
}

// --------------------------------------------------
// 3. SYNC - VALIDATION FAILURE
// --------------------------------------------------

{
  const hook = validateFastifyPayload({
    rule: {
      body: {
        email: {
          mandatory: true,
          type: "email",
        },
      },
    },
  });

  const request = {
    headers: {},
    params: {},
    query: {},
    body: {
      email: "invalid-email",
    },
  };

  const reply = createMockFastifyReply();

  await hook(request, reply);

  check(
    "v1.8 Fastify sync sends 400 validation response",
    reply.statusCode === 400 &&
      reply.body?.valid === false &&
      reply.body?.errors?.length === 1 &&
      reply.body?.errors?.[0]?.path === "body.email" &&
      reply.body?.errors?.[0]?.code === "INVALID_EMAIL",
  );
}

// --------------------------------------------------
// 4. SYNC - CUSTOM FAILURE STATUS
// --------------------------------------------------

{
  const hook = validateFastifyPayload({
    rule: {
      body: {
        email: {
          type: "email",
        },
      },
    },
    options: {
      inValidPayloadResponse: {
        statusCode: 422,
        valid: false,
        message: "Request validation failed",
      },
    },
  });

  const request = {
    headers: {},
    params: {},
    query: {},
    body: {
      email: "invalid-email",
    },
  };

  const reply = createMockFastifyReply();

  await hook(request, reply);

  check(
    "v1.8 Fastify sync uses custom invalid response status",
    reply.statusCode === 422 &&
      reply.body?.statusCode === 422 &&
      reply.body?.valid === false &&
      reply.body?.message === "Request validation failed",
  );
}

// --------------------------------------------------
// 5. SYNC - prettyErrors:true
// --------------------------------------------------

{
  const hook = validateFastifyPayload({
    rule: {
      body: {
        email: {
          type: "email",
        },
      },
    },
    options: {
      prettyErrors: true,
    },
  });

  const request = {
    headers: {},
    params: {},
    query: {},
    body: {
      email: "invalid-email",
    },
  };

  const reply = createMockFastifyReply();

  await hook(request, reply);

  check(
    "v1.8 Fastify sync supports prettyErrors",
    reply.statusCode === 400 &&
      typeof reply.body?.errors?.[0] === "string" &&
      reply.body?.errors?.[0] === "Invalid email format for attribute email",
  );
}

// --------------------------------------------------
// 6. SYNC - ORIGINAL REQUEST DATA NOT MUTATED
// --------------------------------------------------

{
  const hook = validateFastifyPayload({
    rule: {
      body: {
        email: {
          type: "email",
          trim: true,
          lowercase: true,
        },
      },
    },
  });

  const request = {
    headers: {},
    params: {},
    query: {},
    body: {
      email: "  USER@EXAMPLE.COM  ",
    },
  };

  const reply = createMockFastifyReply();

  await hook(request, reply);

  check(
    "v1.8 Fastify sync does not mutate original request body",
    request.body.email === "  USER@EXAMPLE.COM  " &&
      request.validatedPayload?.body?.email === "user@example.com",
  );
}

// --------------------------------------------------
// 7. SYNC - THROWN ERROR PROPAGATES
// --------------------------------------------------

{
  const expectedError = new Error("External service failed");

  const hook = validateFastifyPayload({
    rule: {
      body: {
        username: {
          type: "string",
          customValidator: () => {
            throw expectedError;
          },
        },
      },
    },
  });

  const request = {
    headers: {},
    params: {},
    query: {},
    body: {
      username: "kiran",
    },
  };

  const reply = createMockFastifyReply();

  let receivedError = null;

  try {
    await hook(request, reply);
  } catch (error) {
    receivedError = error;
  }

  check(
    "v1.8 Fastify sync propagates thrown errors",
    receivedError === expectedError &&
      reply.statusCode === null &&
      reply.body === null,
  );
}

// --------------------------------------------------
// 8. CONFIG ERROR THROWS DURING HOOK CREATION
// --------------------------------------------------

{
  let configError = null;

  try {
    validateFastifyPayload({
      rule: {
        cookies: {
          sessionId: {
            type: "string",
          },
        },
      },
    });
  } catch (error) {
    configError = error;
  }

  check(
    "v1.8 Fastify validates configuration during hook creation",
    configError?.message ===
      "perfect-payload:- unsupported request source cookies",
  );
}

// --------------------------------------------------
// 9. ASYNC - SUCCESS
// --------------------------------------------------

{
  const hook = validateFastifyPayloadAsync({
    rule: {
      body: {
        username: {
          type: "string",
          customValidator: async () => true,
        },
      },
    },
  });

  const request = {
    headers: {},
    params: {},
    query: {},
    body: {
      username: "kiran",
    },
  };

  const reply = createMockFastifyReply();

  const result = await hook(request, reply);

  check(
    "v1.8 Fastify async attaches validatedPayload",
    result === undefined &&
      request.validatedPayload?.body?.username === "kiran" &&
      reply.statusCode === null &&
      reply.body === null,
  );
}

// --------------------------------------------------
// 10. ASYNC - VALIDATION FAILURE
// --------------------------------------------------

{
  const hook = validateFastifyPayloadAsync({
    rule: {
      body: {
        username: {
          type: "string",
          customValidator: async () => false,
          customValidatorError: "Username is already taken",
        },
      },
    },
  });

  const request = {
    headers: {},
    params: {},
    query: {},
    body: {
      username: "taken-user",
    },
  };

  const reply = createMockFastifyReply();

  await hook(request, reply);

  check(
    "v1.8 Fastify async sends validation failure response",
    reply.statusCode === 400 &&
      reply.body?.valid === false &&
      reply.body?.errors?.length === 1 &&
      reply.body?.errors?.[0]?.path === "body.username" &&
      reply.body?.errors?.[0]?.code === "CUSTOM_VALIDATION_FAILED" &&
      reply.body?.errors?.[0]?.message === "Username is already taken",
  );
}

// --------------------------------------------------
// 11. ASYNC - THROWN ERROR PROPAGATES
// --------------------------------------------------

{
  const expectedError = new Error("Database unavailable");

  const hook = validateFastifyPayloadAsync({
    rule: {
      body: {
        username: {
          type: "string",
          customValidator: async () => {
            throw expectedError;
          },
        },
      },
    },
  });

  const request = {
    headers: {},
    params: {},
    query: {},
    body: {
      username: "kiran",
    },
  };

  const reply = createMockFastifyReply();

  let receivedError = null;

  try {
    await hook(request, reply);
  } catch (error) {
    receivedError = error;
  }

  check(
    "v1.8 Fastify async propagates thrown errors",
    receivedError === expectedError &&
      reply.statusCode === null &&
      reply.body === null,
  );
}

// --------------------------------------------------
// 12. MISSING REQUEST SOURCE
// --------------------------------------------------

{
  const hook = validateFastifyPayload({
    rule: {
      body: {
        email: {
          mandatory: true,
          type: "email",
        },
      },
    },
  });

  const request = {
    headers: {},
    params: {},
    query: {},
  };

  const reply = createMockFastifyReply();

  await hook(request, reply);

  check(
    "v1.8 Fastify treats missing configured source as empty object",
    reply.statusCode === 400 &&
      reply.body?.errors?.[0]?.path === "body.email" &&
      reply.body?.errors?.[0]?.code === "REQUIRED",
  );
}

// ==========================================================
// v1.8 - ERROR PRIVACY REGRESSION
// Default modern error messages must never expose input values
// ==========================================================

{
  const secretUrl = "SECRET_INVALID_URL";
  const result = perfectPayload(
    { website: secretUrl },
    {
      website: {
        type: "url",
      },
    },
  );

  check(
    "v1.8 privacy - URL does not expose submitted value",
    result.errors?.[0]?.code === "INVALID_URL" &&
      result.errors?.[0]?.message ===
        "Invalid URL format for attribute website" &&
      !result.errors?.[0]?.message.includes(secretUrl),
  );
}

{
  const secretEnum = "SECRET_ROLE";
  const result = perfectPayload(
    { role: secretEnum },
    {
      role: {
        type: "enum",
        enumValues: ["admin", "user"],
      },
    },
  );

  check(
    "v1.8 privacy - enum does not expose submitted value",
    result.errors?.[0]?.code === "INVALID_ENUM" &&
      result.errors?.[0]?.message ===
        "Invalid value for attribute role, valid values are admin, user" &&
      !result.errors?.[0]?.message.includes(secretEnum),
  );
}

{
  const cases = [
    {
      type: "uuid",
      code: "INVALID_UUID",
      message: "Invalid UUID for attribute id",
    },
    {
      type: "uuidv1",
      code: "INVALID_UUID_V1",
      message: "Invalid v1 UUID for attribute id",
    },
    {
      type: "uuidv3",
      code: "INVALID_UUID_V3",
      message: "Invalid v3 UUID for attribute id",
    },
    {
      type: "uuidv4",
      code: "INVALID_UUID_V4",
      message: "Invalid v4 UUID for attribute id",
    },
    {
      type: "uuidv5",
      code: "INVALID_UUID_V5",
      message: "Invalid v5 UUID for attribute id",
    },
    {
      type: "objectId",
      code: "INVALID_OBJECT_ID",
      message: "Invalid ObjectId for attribute id",
    },
  ];

  for (const testCase of cases) {
    const secretValue = `SECRET_${testCase.type.toUpperCase()}`;

    const result = perfectPayload(
      { id: secretValue },
      {
        id: {
          type: testCase.type,
        },
      },
    );

    check(
      `v1.8 privacy - ${testCase.type} does not expose submitted value`,
      result.errors?.[0]?.code === testCase.code &&
        result.errors?.[0]?.message === testCase.message &&
        !result.errors?.[0]?.message.includes(secretValue),
    );
  }
}

{
  const secretValue = "SECRET_NOT_NUMBER";

  const result = perfectPayload(
    { quantity: secretValue },
    {
      quantity: {
        preventDecimal: true,
      },
    },
  );

  check(
    "v1.8 privacy - preventDecimal invalid type does not expose submitted value",
    result.errors?.[0]?.code === "INVALID_TYPE" &&
      result.errors?.[0]?.message ===
        "Invalid type for attribute quantity, required number value" &&
      !result.errors?.[0]?.message.includes(secretValue),
  );
}

{
  const secretDecimal = 123.456789;

  const result = perfectPayload(
    { quantity: secretDecimal },
    {
      quantity: {
        preventDecimal: true,
      },
    },
  );

  check(
    "v1.8 privacy - preventDecimal does not expose submitted value",
    result.errors?.[0]?.code === "DECIMAL_NOT_ALLOWED" &&
      result.errors?.[0]?.message ===
        "Decimal value not allowed in attribute quantity" &&
      !result.errors?.[0]?.message.includes(String(secretDecimal)),
  );
}

{
  const secretValue = "SECRET_WRONG_TYPE";

  const result = perfectPayload(
    { age: secretValue },
    {
      age: {
        type: "number",
      },
    },
  );

  check(
    "v1.8 privacy - generic type error does not expose submitted value",
    result.errors?.[0]?.code === "INVALID_TYPE" &&
      result.errors?.[0]?.message ===
        "Invalid type for attribute age, required number value" &&
      !result.errors?.[0]?.message.includes(secretValue),
  );
}

{
  const result = perfectPayload(
    {
      age: 101,
      score: -1,
      percentage: 150,
    },
    {
      age: {
        max: 100,
      },
      score: {
        min: 0,
      },
      percentage: {
        range: "0-100",
      },
    },
  );

  check(
    "v1.8 privacy - schema constraints remain available",
    result.errors?.[0]?.message ===
      "Maximum value 100 is allowed in attribute age" &&
      result.errors?.[1]?.message ===
        "Minimum value 0 is allowed in attribute score" &&
      result.errors?.[2]?.message ===
        "Attribute percentage should have a value between 0 and 100",
  );
}
// ###########################

// ========================================================
// FINAL RESULT
// ========================================================

console.log("========================================================");

console.log("\nRegression execution completed.");

console.log("Inspect any ❌ FAIL entries above before proceeding with release");
//
//
//
// ========================================================
//
//
//
// PRIVACY / SENSITIVE VALUE LEAK TEST
//
//
//
// ========================================================

const sensitivePayload = {
  email: "my-secret-email-value",
  age: 5,
  token: "SUPER_SECRET_TOKEN_123",
};

const sensitiveRules = {
  email: {
    type: "email",
  },

  age: {
    type: "number",
    min: 18,
  },

  token: {
    type: "string",
    regex: /^VALID_TOKEN$/,
  },
};

const sensitiveResult = perfectPayload(sensitivePayload, sensitiveRules);

const allErrorMessages =
  sensitiveResult?.errors?.map((error) => error.message).join(" ") || "";

check(
  "Error messages do not expose invalid email value",
  !allErrorMessages.includes(sensitivePayload.email),
);

check(
  "Error messages do not expose invalid numeric value",
  !allErrorMessages.includes(String(sensitivePayload.age)),
);

check(
  "Error messages do not expose invalid token value",
  !allErrorMessages.includes(sensitivePayload.token),
);

check(
  "Structured errors do not contain a value property",
  sensitiveResult?.errors?.every(
    (error) => !Object.prototype.hasOwnProperty.call(error, "value"),
  ),
);
