# Data Validation Module

This module provides a robust framework for validating data objects based on defined rules. It includes various validation attributes, types, custom error messages, and default values to ensure data integrity and consistency.

## Table of Contents

1. [Quick Sight](#default-values)
2. [Available Validation Attributes](#available-validation-attributes)
3. [Available Types](#available-types)
4. [Custom Error Message Attributes](#custom-error-message-attributes)
5. [Default Values](#default-values)
6. [Examples and Usage](#default-values)

## 1. Quick Sights

usage:

```javascript
import { perfectPayloadV1 } from"perfect-payload";
const {statucCode=400, ...result}=perfectPayloadV1(data,dataValidationRule,validPayloadResponse,inValidPayloadResponse)
```

input:

1. **data :**  your payload object (required *)
2. **dataValidationRule:** validation rule object (required *)
3. **validPayloadResponse:** response object you want it back on all validation passed (Optional)
4. **inValidPayloadResponse:** response object you want it back on any validation fails (Optional)

**Default Valid Payload Response:**

```javascript
{ 
   statusCode:200, 
   valid:true 
}
```

**Default Invalid Payload Response:**

```javascript
{  
   statusCode:400,  
   valid:false,  
   message:"One or more attribute values are invalid",  
   errors:["minSalary must be less than maxSalary"]  
}
```

**Note:** If inValidPayloadResponse is passed, then it will be returned along with errors property(avoid error attribute in your inValidPayloadResponse object)

## 2. Available Validation Attributes

These attributes define the rules that can be applied to each field in the data object:

- **mandatory**: Specifies whether the data is required.
- **allowNull**: Allows `null` values.
- **allowEmptyObject**: Allows empty objects `{}`.
- **allowEmptyArray**: Allows empty arrays `[]`.
- **elementConstraints**: Defines the constraints of elements in an array (refer to [Available ](#available-types)[Attributes](#available-validation-attributes) section).
- **regex**: Applies custom regular expression validation.
- **type**: Specifies the type of the field (refer to [Available Types](#available-types) section).
- **minLength**: Minimum length for string values.
- **maxLength**: Maximum length for string values.
- **preventDecimal**: Disallows decimal or fractional values.
- **min**: Specifies the minimum number value.
- **max**: Specifies the maximum number value.
- **range**: Specifies a numeric range for the value.
- **objectAttr**: Validates nested objects.
- **dependency**: Validates fields that depend on the values of other fields (e.g., min and max salary).

## 3. Available Types

These types can be used in the `type` attribute to specify the expected data type:

- **number**: Numeric values.
- **string**: String values.
- **boolean**: Boolean values (`true`/`false`).
- **email**: Valid email addresses.
- **url**: Valid URL formats.
- **enum**: A specific set of allowed values (supports heterogeneous arrays).
- **uuid**: Valid UUIDs (supports all versions).
- **uuidv1/uuidv3/uuidv4/uuidv5**: Version-specific UUID validation.
- **objectId**: Valid MongoDB ObjectIds.
- **array**: Validates arrays, with support for element type validation using `elementConstraints`.
- **object**: Validates objects, including nested objects using `objectAttr`.

## 4. Custom Error Message Attributes

You can define custom error messages for various validation failures using these attributes:

- **mandatoryError**: Custom message when a mandatory field is missing.
- **allowNullError**: Custom message when a `null` value is not allowed.
- **emptyObjectError**: Custom message when an empty object `{}` is not allowed.
- **emptyArrayError**: Custom message when an empty array `[]` is not allowed.
- **elementConstraintsError**: Custom message when array elements do not match the passed constraints.
- **regexError**: Custom message when a value does not match the specified regex pattern.
- **typeError**: Custom message when a value does not match the specified type.
- **minLengthError**: Custom message when a string value is shorter than the minimum length.
- **maxLengthError**: Custom message when a string value exceeds the maximum length.
- **preventDecimalError**: Custom message when a decimal value is not allowed.
- **minError**: Custom message when a value is less than the minimum allowed.
- **maxError**: Custom message when a value exceeds the maximum allowed.
- **rangeError**: Custom message when a value is outside the specified range.

## 5. Default Values

If not explicitly specified, the following default values are applied:

- **mandatory**: `false` (field is not required).
- **allowNull**: `true` (allows `null` values).
- **allowEmptyObject**: `true` (allows empty objects `{}`).
- **allowEmptyArray**: `true` (allows empty arrays `[]`).
- **elementConstraints**: Ignored.
- **regex**: Ignored.
- **type**: Ignored.
- **minLength**: Ignored.
- **maxLength**: Ignored.
- **preventDecimal**: `false` (allows both decimal and integer values).
- **min**: Ignored.
- **max**: Ignored.
- **range**: Ignored.
- **objectAttr**: Ignored.
- **dependency**: Ignored.

## 6. Examples And Usage

### 1. Sample Validation Rule

sample-1

```javascript
{
  firstName: {
    mandatory: true,
    allowNull: false,
    type: "string",
    minLength: 3,
    minLengthError:"First name must have minimum 3 characters."
  },
  lastName: {
    mandatory: false,
    allowNull: true,
    type: "string",
  },
  email: {
    mandatory: true,
    allowNull: false,
    type: "email",
  },
  phone: {
    mandatory: true,
    allowNull: false,
    type: "string",
  },
  age: {
    mandatory: false,
    type: "number",
    min: 1,
    max: 120,
  },
};
```

sample-2

```javascript
{
  id: {
    mandatory: true,
    allowNull: true,
    type: "uuidv4",
  },
  batchId: {
    mandatory: true,
    allowNull: true,
    type: "objectId",
  },
  firstName: {
    mandatory: true,
    allowNull: false,
    type: "string",
    minLength: 3,
    maxLength: 6,
  },
  lastName: {
    mandatory: false,
    allowNull: true,
    type: "string",
  },
  age: {
    type: "number",
    min: 0.1,
    max: 120,
  },
  isAdult: {
    type: "boolean",
  },
  totalWins: {
    type: "number",
    min: 0,
    preventDecimal: true,
  },
  email: {
    type: "email",
    regex: /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/,
  },
  githubLink: {
    type: "url",
  },
  accountStatus: {
    type: "enum",
    enumValues: ["Active", "Inactive", 200],
  },
  marks: {
    range: "0-100",
  },
  allMarks: {
    type: "array",
    allowEmptyArray: false,
    elementConstraints: {
      type: "number",
      allowNull: false,
      range: "0-100",
    },
  },
  totalScore: {
    type: "number",
    dependency: {
      result: {
        setDependencyRule: (totalScore, result) => {
          return { mandatory: true, allowNull: false, type: "string" };
        },
      },
    },
  },
  result: {
    type: "string",
    dependency: {
      totalScore: {
        setDependencyRule: (result, totalScore) => {
          return { mandatory: true, allowNull: false, type: "number" };
        },
      },
    },
  },
  minSalary: {
    mandatory: true,
    min: 1,
    type: "number",
    dependency: {
      maxSalary: {
        setDependencyRule: (minSalary, maxSalary) => {
          return {
            mandatory: true,
            min: minSalary + 1,
            minError: "maxSalary must be more than minSalary",
          };
        },
      },
    },
  },
  maxSalary: {
    dependency: {
      minSalary: {
        setDependencyRule: (maxSalary, minSalary) => {
          return {
            mandatory: true,
            max: maxSalary - 1,
            maxError: "minSalary must be less than maxSalary",
          };
        },
      },
    },
  },
  address: {
    mandatory: true,
    type: "object",
    allowEmptyObject: false,
    objectAttr: {
      country: { mandatory: true, type: "string" },
      state: {
        mandatory: true,
        type: "string",
      },
      city: {},
      zip: {
        mandatory: true,
        type: "string",
      },
      position: {
        mandatory: true,
        type: "object",
        allowEmptyObject: false,
        objectAttr: {
          lattitude: { mandatory: true, type: "number" },
          longitude: {
            mandatory: true,
            type: "number",
          },
        },
      },
    },
  },
}
```

### 2. Usage

#### 1. creating your route with middleware and validation rule:

```javascript
//Here validatePayload is your middleware function where you're invoking perfect payload
router.post(
  "/payload-validation",
  validatePayload({ rule: <your validation rule json object> }),
  (req, res) => res.send("OK")
);
```

#### 2. Use perfect-payload in your middleware like below

```javascript
import { perfectPayloadV1 } from "perfect-payload";

export const validatePayload = ({ rule }) => {
  return (req, res, next) => {
    const { statusCode, ...response } = perfectPayloadV1(req?.body, rule);
    if (+statusCode >= 200 && +statusCode <= 299) {
      next();
    } else res.status(statusCode).json(response);
  };
};
```

#### Usage in venila js code

```javascript
import { perfectPayloadV1 } from "perfect-payload";
const result = perfectPayloadV1(dataObject, ruleObject);
console.log(result?.statusCode)
console.log(result?.isValid)
```

---

This documentation provides a comprehensive guide to using the data validation module effectively. Ensure to define your validation rules clearly to maintain data quality and consistency in your applications.
