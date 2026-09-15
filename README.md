# perfect-payload

A lightweight JavaScript payload validation utility for validating API
and JSON payloads with simple rule-based configuration.

## Installation

```bash

npm install perfect-payload
```

## Basic Usage

Use `perfectPayload()` for all new implementations.

```js
import { perfectPayload } from "perfect-payload";

const payload = {
  name: "Kiran",
  email: "kiran@example.com",
  age: 29,
};

const validationRules = {
  name: {
    mandatory: true,
    type: "string",
  },

  email: {
    mandatory: true,
    type: "email",
  },

  age: {
    mandatory: true,
    type: "number",
    min: 18,
  },
};

const result = perfectPayload(payload, validationRules);

console.log(result);
```

### Valid Response

```js

{
  statusCode: 200,
  valid: true,
  validatedPayload: {
    name: "Kiran",
    email: "kiran@example.com",
    age: 29
  }
}
```

**Note:** The validatedPayload contains only the fields defined in the
schema, automatically filtering out any extra attributes. You can use it
to safely overwrite request.body or assign it to a new request property
(such as validatedBody, sanitisedData or parsedBody).

### Invalid Response

```js

{
  statusCode: 400,
  valid: false,
  message: "One or more attribute values are invalid",
  errors: [
    {
      path: "email",
      code: "INVALID_EMAIL",
      message: "Invalid email format for attribute email"
    }
  ]
}
```

Each error returned by `perfectPayload()` contains:

```js

{
  path: "field.path",
  code: "ERROR_CODE",
  message: "Human readable validation message"
}
```

- `path` identifies the exact field that failed validation.
- `code` provides a stable machine-readable validation error code.
- `message` provides a human-readable description of the validation
  failure.
- Submitted payload values are not included in default error messages.

## Legacy API

`perfectPayloadV1()` is still available for backward compatibility.

```js
import { perfectPayloadV1 } from "perfect-payload";
```

`perfectPayloadV1()` is deprecated and will no longer be supported after
**\*\*March 31, 2027\*\***.

Existing applications can continue using it during the migration period,
but all new implementations should use:

```js
perfectPayload();
```

The legacy API continues to return validation errors as:

```js
errors: ["email is invalid"];
```

while the new `perfectPayload()` API returns structured errors:

```js
errors: [
  {
    path: "email",
    code: "INVALID_EMAIL",
    message: "Invalid email format for attribute email",
  },
];
```

**Note:** If an inValidPayloadResponse is provided, the system returns
it alongside an automatically generated errors property. Do not include
your own errors attribute inside the custom inValidPayloadResponse
object.

## Validation Rules

`perfectPayload()` supports the following validation rules.

### `mandatory`

Marks a field as required(even empty string also not allowed)

**Default:** `false`, the field is not required.

```js
const rules = {
  name: {
    mandatory: true,
  },
};
```

Error code: `REQUIRED`

---

### `allowNull`

Controls whether `null` values are accepted.

**Default:** `true` , `null` values are allowed.

Example:

```js
const rules = {
  name: {
    allowNull: false,
  },
};
```

Error code: `NULL_NOT_ALLOWED`

---

### `allowEmptyObject`

Controls whether an empty object `{}` is accepted.

**Default:** `true`, empty objects are allowed.

Example:

```js
const rules = {
  address: {
    type: "object",
    allowEmptyObject: false,
  },
};
```

Error code: `EMPTY_OBJECT_NOT_ALLOWED`

---

### `allowEmptyArray`

Controls whether an empty array `[]` is accepted.

**Default:** `true`, empty arrays are allowed.

Example:

```js
const rules = {
  products: {
    type: "array",
    allowEmptyArray: false,
  },
};
```

Error code: `EMPTY_ARRAY_NOT_ALLOWED`

---

### `type`

Validates the expected data type.

Supported values:

```text

number
string
boolean
email
url
enum
uuid
uuidv1
uuidv3
uuidv4
uuidv5
objectId
array
object
```

Example:

```js
const rules = {
  age: {
    type: "number",
  },
  email: {
    type: "email",
  },
  active: {
    type: "boolean",
  },
};
```

### `enum`

A specific set of allowed values (supports heterogeneous arrays)

```js
type: "enum";
```

Example:

```js
const rules = {
  status: {
    type: "enum",
    enumValues: ["active", "inactive", "blocked", 1, 0],
  },
};
```

### `enumValues`

Used together with:

```js
type: "enum";
```

Example:

```js
const rules = {
  status: {
    type: "enum",
    enumValues: ["active", "inactive", "blocked"],
  },
};
```

Error code: `INVALID_ENUM`

Possible error codes for types:

```text

INVALID_TYPE
INVALID_EMAIL
INVALID_URL
INVALID_ENUM
INVALID_UUID
INVALID_UUID_V1
INVALID_UUID_V3
INVALID_UUID_V4
INVALID_UUID_V5
INVALID_OBJECT_ID
```

---

### `regex`

Validates a value using a regular expression.

**Default:** Not applied when omitted.

Example:

```js
const rules = {
  employeeCode: {
    type: "string",
    regex: /^[A-Z]{3}[0-9]{3}$/,
  },
};
```

Error code: `REGEX_MISMATCH`

---

### `minLength`

Defines the minimum allowed string length.

**Default:** Not applied when omitted.

Example:

```js
const rules = {
  username: {
    type: "string",
    minLength: 5,
  },
};
```

Error code: `MIN_LENGTH`

---

### `maxLength`

Defines the maximum allowed string length.

**Default:** Not applied when omitted.

Example:

```js
const rules = {
  username: {
    type: "string",
    maxLength: 20,
  },
};
```

Error code: `MAX_LENGTH`

---

### `preventDecimal`

Prevents decimal numbers.

**Default:** `false` both integer and decimal numbers are allowed.

Example:

```js
const rules = {
  quantity: {
    type: "number",
    preventDecimal: true,
  },
};
```

Error code: `DECIMAL_NOT_ALLOWED`

---

### `min`

Defines the minimum allowed numeric value.

**Default:** Not applied when omitted.

Example:

```js
const rules = {
  age: {
    type: "number",
    min: 18,
  },
};
```

Error code: `MIN_VALUE`

---

### `max`

Defines the maximum allowed numeric value.

**Default:** Not applied when omitted.

Example:

```js
const rules = {
  quantity: {
    type: "number",
    max: 100,
  },
};
```

Error code: `MAX_VALUE`

---

### `range`

Defines the allowed numeric range.

**Default:** Not applied when omitted.

Example:

```js
const rules = {
  marks: {
    type: "number",
    range: "0-100",
  },
};
```

Error code: `OUT_OF_RANGE`

---

### `elementConstraints`

Validates every item in an array.

Example:

```js
const rules = {
  marks: {
    type: "array",
    elementConstraints: {
      type: "number",
      range: "0-100",
    },
  },
};
```

Example error:

```js

{

  path: "marks[2]",
  code: "OUT_OF_RANGE",
  message:
    "Attribute marks[2] should have a value between 0 and 100"
}
```

When `elementConstraintsError` is explicitly provided, the error code
is: `INVALID_ARRAY_ELEMENT`

Example:

```js
const rules = {
  marks: {
    type: "array",
    elementConstraints: {
      type: "number",
    },
    elementConstraintsError: "Every marks element must be a number",
  },
};
```

---

### `objectAttr`

Validates fields inside a nested object.

Example:

```js
const rules = {
  address: {
    type: "object",
    objectAttr: {
      city: {
        mandatory: true,
        type: "string",
      },
      location: {
        type: "object",
        objectAttr: {
          latitude: {
            type: "number",
          },
          longitude: {
            type: "number",
          },
        },
      },
    },
  },
};
```

Nested errors include the complete field path:

```js

{
  path: "address.location.latitude",
  code: "INVALID_TYPE",
  message:
    "Invalid type for attribute address.location.latitude, required number value"
}
```

---

### `dependency`

Allows validation rules to depend on another field.

Example:

```js
const rules = {
  minSalary: {
    type: "number",
    dependency: {
      maxSalary: {
        setDependencyRule: (minSalary, maxSalary) => ({
          type: "number",
          min: minSalary + 1,
          minError: "maxSalary must be more than minSalary",
        }),
      },
    },
  },
};
```

Example error:

```js

{

  path: "maxSalary",
  code: "MIN_VALUE",
  message:
    "maxSalary must be more than minSalary"
}
```

## Error Codes

`perfectPayload()` currently exposes the following machine-readable
validation error codes:

```text

REQUIRED
NULL_NOT_ALLOWED
EMPTY_OBJECT_NOT_ALLOWED
EMPTY_ARRAY_NOT_ALLOWED
INVALID_ARRAY_ELEMENT
REGEX_MISMATCH
INVALID_TYPE
INVALID_EMAIL
INVALID_URL
INVALID_ENUM
INVALID_UUID
INVALID_UUID_V1
INVALID_UUID_V3
INVALID_UUID_V4
INVALID_UUID_V5
INVALID_OBJECT_ID
MIN_LENGTH
MAX_LENGTH
DECIMAL_NOT_ALLOWED
MIN_VALUE
MAX_VALUE
OUT_OF_RANGE
```

These codes are designed for programmatic handling while `message`
remains suitable for human-readable API responses.

For example:

```js
const result = perfectPayload(payload, validationRules);

if (!result.valid) {
  const emailError = result.errors.find(
    (error) => error.code === "INVALID_EMAIL",
  );

  if (emailError) {
    // Handle invalid email
  }
}
```

## Custom Error Messages

Every validation rule can use its corresponding custom error message.

Custom messages replace the default human-readable `message` while
keeping the same structured error format:

```js

{
  path: "email",
  code: "INVALID_EMAIL",
  message: "Email address is invalid"
}
```

Example:

```js
const rules = {
  email: {
    mandatory: true,
    type: "email",
    mandatoryError: "Email is required",
    typeError: "Email address is invalid",
  },
};
```

If `email` is missing:

```js

{
  path: "email",
  code: "REQUIRED",
  message: "Email is required"
}
```

If `email` is present but invalid:

```js

{
  path: "email",
  code: "INVALID_EMAIL",
  message: "Email address is invalid"
}
```

### Supported Custom Error Properties

\| Validation Rule      \| Custom Error Property     \|

\| -------------------- \| ------------------------- \|

\| `mandatory`          \| `mandatoryError`          \|

\| `allowNull`          \| `allowNullError`          \|

\| `allowEmptyObject`   \| `emptyObjectError`        \|

\| `allowEmptyArray`    \| `emptyArrayError`         \|

\| `elementConstraints` \| `elementConstraintsError` \|

\| `regex`              \| `regexError`              \|

\| `type`               \| `typeError`               \|

\| `minLength`          \| `minLengthError`          \|

\| `maxLength`          \| `maxLengthError`          \|

\| `preventDecimal`     \| `preventDecimalError`     \|

\| `min`                \| `minError`                \|

\| `max`                \| `maxError`                \|

\| `range`              \| `rangeError`              \|

### Example with Multiple Custom Errors

```js
const payload = {
  username: "ab",
  age: 15,
  score: 120,
};

const rules = {
  username: {
    mandatory: true,
    type: "string",
    minLength: 3,
    mandatoryError: "Username is required",
    typeError: "Username must be a string",
    minLengthError: "Username must contain at least 3 characters",
  },
  age: {
    type: "number",
    min: 18,
    minError: "Age must be at least 18",
  },
  score: {
    type: "number",
    range: "0-100",
    rangeError: "Score must be between 0 and 100",
  },
};

const result = perfectPayload(payload, rules);
```

Example result:

```js

{
  statusCode: 400,
  valid: false,
  message:
    "One or more attribute values are invalid",
  errors: [
    {
      path: "username",
      code: "MIN_LENGTH",
      message:
        "Username must contain at least 3 characters"
    },
    {
      path: "age",
      code: "MIN_VALUE",
      message:
        "Age must be at least 18"
    },
    {
      path: "score",
      code: "OUT_OF_RANGE",
      message:
        "Score must be between 0 and 100"
    }
  ]
}
```

### Custom Messages and Error Codes

Custom messages only replace the `message`.

They do not change the validation error `code`.

For example:

```js
const rules = {
  age: {
    type: "number",
    min: 18,
    minError: "You must be 18 or older",
  },
};
```

Still returns:

```js

{
  path: "age",
  code: "MIN_VALUE",
  message: "You must be 18 or older"
}
```

This makes it possible to:

- show custom messages to API consumers
- use stable error codes in application logic
- change user-facing wording without changing programmatic error
  handling

## Custom Response Objects

`perfectPayload()` allows you to customize both the valid and invalid
response objects.

The third argument is the custom valid response.

The fourth argument is the custom invalid response.

### Custom Valid Response

Example:

```js
const customValidResponse = {
  statusCode: 201,
  valid: true,
  message: "Payload validated successfully",
};

const result = perfectPayload(payload, validationRules, customValidResponse);
```

When validation succeeds, `validatedPayload` is automatically added:

```js

{
  statusCode: 201,
  valid: true,
  message: "Payload validated successfully",
  validatedPayload: {
    name: "Kiran",
    email: "kiran@example.com",
    age: 29
  }
}
```

### Custom Invalid Response

Example:

```js
const customInvalidResponse = {
  statusCode: 422,
  valid: false,
  message: "Payload validation failed",
};

const result = perfectPayload(
  payload,
  validationRules,
  undefined,
  customInvalidResponse,
);
```

When validation fails, `errors` is automatically added:

```js

{

  statusCode: 422,
  valid: false,
  message: "Payload validation failed",
  errors: [
    {
      path: "email",
      code: "INVALID_EMAIL",
      message:
        "Invalid email format for attribute email"
    }
  ]
}
```

### Custom Valid and Invalid Responses Together

```js
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

const result = perfectPayload(
  payload,
  validationRules,
  customValidResponse,
  customInvalidResponse,
);
```

The response object you provide is preserved, while `perfectPayload()`
automatically adds either:

```text

validatedPayload
```

for successful validation, or:

```text

errors
```

for failed validation.

## Default Responses

If no custom response objects are provided, the default valid response
is:

```js

{
  statusCode: 200,
  valid: true,
  validatedPayload: {
    // validated fields
  }
}
```

The default invalid response is:

```js

{
  statusCode: 400,
  valid: false,
  message: "One or more attribute values are invalid",
  errors: [
    {
      path: "field",
      code: "ERROR_CODE",
      message: "Validation error message"
    }
  ]
}
```

## Nested Objects and Array Field Paths

`perfectPayload()` returns the exact location of a validation failure
through the `path` property.

This makes validation errors easier to map to API fields, forms, logs,
and frontend components.

### Top-Level Field

For a payload such as:

```js
const payload = {
  email: "invalid-email",
};
```

An error can be returned as:

```js

{
  path: "email",
  code: "INVALID_EMAIL",
  message: "Invalid email format for attribute email"
}
```

### Nested Object

Use `objectAttr` to validate properties inside an object.

```js
const payload = {
  address: {
    city: "Bengaluru",
    location: {
      latitude: "12.9716",
      longitude: 77.5946,
    },
  },
};

const rules = {
  address: {
    type: "object",
    objectAttr: {
      city: {
        type: "string",
      },
      location: {
        type: "object",
        objectAttr: {
          latitude: {
            type: "number",
          },
          longitude: {
            type: "number",
          },
        },
      },
    },
  },
};

const result = perfectPayload(payload, rules);
```

Because `latitude` is a string instead of a number, the error contains
its complete nested path:

```js

{
  path: "address.location.latitude",
  code: "INVALID_TYPE",
  message:
    "Invalid type for attribute address.location.latitude, required number value"
}
```

Nested paths use dot notation:

```text

address.city
address.location.latitude
address.location.longitude
```

### Array Elements

When `elementConstraints` validation fails, the array index is included
in the error path.

```js
const payload = {
  marks: [50, 75, 150],
};

const rules = {
  marks: {
    type: "array",
    elementConstraints: {
      type: "number",
      range: "0-100",
    },
  },
};

const result = perfectPayload(payload, rules);
```

The invalid third element is reported as:

```js

{
  path: "marks[2]",
  code: "OUT_OF_RANGE",
  message:
    "Attribute marks[2] should have a value between 0 and 100"
}
```

Array paths use zero-based indexes:

```text

marks[0]
marks[1]
marks[2]
```

### Nested Fields Inside Arrays

Paths can also identify fields inside array elements.

For example:

```text

products[0].quantity
products[1].quantity
products[2].price
```

This provides enough information for consumers to identify the exact
field that caused the validation error.

### Why Structured Paths Are Useful

Instead of parsing an error message to determine which field failed,
applications can directly use:

```js
error.path;
```

For example:

```js
const result = perfectPayload(payload, validationRules);

if (!result.valid) {
  result.errors.forEach((error) => {
    console.log(error.path, error.code, error.message);
  });
}
```

A frontend can also map validation errors by path:

```js
const fieldErrors = {};

result.errors.forEach((error) => {
  fieldErrors[error.path] = error.message;
});
```

Result:

```js

{

  "email": "Invalid email format for attribute email",
  "address.location.latitude": "Invalid type for attribute address.location.latitude, required number value",
  "marks[2]": "Attribute marks[2] should have a value between 0 and 100"

}
```

## Examples And Usage

### Sample Validation Rule

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
    type: "string",
    minLength: 3,
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
    regex: /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}$/,
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

### Usage

#### creating your route with payload validation middleware

```javascript

//Here validatePayload is your middleware function, where you're invoking perfect payload

router.post(
  "/payload-validation",
  validatePayload({ rule: <your validation rule json object> }),
  (req, res) => res.send("OK")
);
```

#### 1 Use perfect-payload in your middleware like below(for MODULE JS)

```javascript
import { perfectPayloadV1 } from "perfect-payload";

export const validatePayload = ({ rule }) => {
  return (req, res, next) => {
    try {
      const { statusCode, ...response } = perfectPayloadV1(req?.body, rule);
      if (+statusCode >= 200 && +statusCode <= 299) {
        req.validatedBody = response?.validatedPayload;
        next();
      } else res.status(statusCode).json(response);
    } catch (error) {
      console.error("Error validating payload", error);
      res.status(500).json({ error: "Internal Server Error" });
    }
  };
};
```

#### 2 Use perfect-payload in your middleware like below(for COMMON JS)

```javascript
function validatePayload({ rule }) {
  return async (req, res, next) => {
    try {
      const { perfectPayloadV1 } = await import("perfect-payload");
      const { statusCode, ...response } = perfectPayloadV1(req?.body, rule);
      if (+statusCode >= 200 && +statusCode <= 299) {
        req.validatedBody = response?.validatedPayload;
        next();
      } else {
        res.status(statusCode).json(response);
      }
    } catch (error) {
      console.error("Error validating payload", error);
      res.status(500).json({ error: "Internal Server Error" });
    }
  };
}

module.exports = { validatePayload };
```

---

This documentation provides a comprehensive guide to using the data
validation module effectively. Ensure to define your validation rules
clearly to maintain data quality and consistency in your applications.
