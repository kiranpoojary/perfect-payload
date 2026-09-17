import { perfectPayloadV1 } from "./index.js";

/*
|--------------------------------------------------------------------------
| perfect-payload V1 regression test
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

  minSalary: 50000,
  maxSalary: 40000,

  // customMandatoryError intentionally missing

  customNullError: null,

  customEmptyObjectError: {},

  customEmptyArrayError: [],

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
// CUSTOM RESPONSES
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
// RUN TESTS
// ========================================================

const invalidResult = perfectPayloadV1(invalidPayload, validationRule);

const validResult = perfectPayloadV1(validPayload, validationRule);

const customInvalidResult = perfectPayloadV1(
  invalidPayload,
  validationRule,
  customValidResponse,
  customInvalidResponse,
);

const customValidResult = perfectPayloadV1(
  validPayload,
  validationRule,
  customValidResponse,
  customInvalidResponse,
);

// ========================================================
// OUTPUT
// ========================================================

console.log("\n========================================================");
console.log("V1 INVALID RESULT");
console.log("========================================================");

console.dir(invalidResult, {
  depth: null,
  colors: true,
});

console.log("\n========================================================");
console.log("V1 VALID RESULT");
console.log("========================================================");

console.dir(validResult, {
  depth: null,
  colors: true,
});

console.log("\n========================================================");
console.log("V1 CUSTOM INVALID RESPONSE");
console.log("========================================================");

console.dir(customInvalidResult, {
  depth: null,
  colors: true,
});

console.log("\n========================================================");
console.log("V1 CUSTOM VALID RESPONSE");
console.log("========================================================");

console.dir(customValidResult, {
  depth: null,
  colors: true,
});

// ========================================================
// BASIC REGRESSION ASSERTIONS
// ========================================================

console.log("\n========================================================");
console.log("REGRESSION SUMMARY");
console.log("========================================================");

function check(name, condition) {
  console.log(`${condition ? "✅ PASS" : "❌ FAIL"} - ${name}`);
}

check(
  "Invalid payload returns statusCode 400",
  invalidResult?.statusCode === 400,
);

check("Invalid payload returns valid=false", invalidResult?.valid === false);

check(
  "Invalid response contains errors array",
  Array.isArray(invalidResult?.errors),
);

check(
  "V1 errors are strings",
  invalidResult?.errors?.every((error) => typeof error === "string"),
);

check("Invalid payload contains errors", invalidResult?.errors?.length > 0);

check(
  "Custom mandatory error works",
  invalidResult?.errors?.includes("CUSTOM_REQUIRED_ERROR"),
);

check(
  "Custom null error works",
  invalidResult?.errors?.includes("CUSTOM_NULL_ERROR"),
);

check(
  "Custom empty object error works",
  invalidResult?.errors?.includes("CUSTOM_EMPTY_OBJECT_ERROR"),
);

check(
  "Custom empty array error works",
  invalidResult?.errors?.includes("CUSTOM_EMPTY_ARRAY_ERROR"),
);

check(
  "Custom array element error works",
  invalidResult?.errors?.includes("CUSTOM_ARRAY_ELEMENT_ERROR"),
);

check(
  "Custom regex error works",
  invalidResult?.errors?.includes("CUSTOM_REGEX_ERROR"),
);

check(
  "Custom type error works",
  invalidResult?.errors?.includes("CUSTOM_TYPE_ERROR"),
);

check(
  "Custom minLength error works",
  invalidResult?.errors?.includes("CUSTOM_MIN_LENGTH_ERROR"),
);

check(
  "Custom maxLength error works",
  invalidResult?.errors?.includes("CUSTOM_MAX_LENGTH_ERROR"),
);

check(
  "Custom decimal error works",
  invalidResult?.errors?.includes("CUSTOM_DECIMAL_ERROR"),
);

check(
  "Custom min error works",
  invalidResult?.errors?.includes("CUSTOM_MIN_ERROR"),
);

check(
  "Custom max error works",
  invalidResult?.errors?.includes("CUSTOM_MAX_ERROR"),
);

check(
  "Custom range error works",
  invalidResult?.errors?.includes("CUSTOM_RANGE_ERROR"),
);

check("Valid payload returns statusCode 200", validResult?.statusCode === 200);

check("Valid payload returns valid=true", validResult?.valid === true);

check(
  "Valid payload returns validatedPayload",
  typeof validResult?.validatedPayload === "object" &&
    validResult?.validatedPayload !== null,
);

check(
  "Custom invalid statusCode works",
  customInvalidResult?.statusCode === 422,
);

check(
  "Custom invalid message works",
  customInvalidResult?.message === "CUSTOM_INVALID_RESPONSE",
);

check("Custom valid statusCode works", customValidResult?.statusCode === 201);

check(
  "Custom valid message works",
  customValidResult?.message === "CUSTOM_VALID_RESPONSE",
);

console.log("========================================================");
