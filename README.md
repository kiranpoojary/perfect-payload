# perfect-payload

A lightweight JavaScript library for validating, transforming, and
sanitizing API and JSON payloads.

`perfect-payload` provides structured validation errors, exact nested
field paths, synchronous and asynchronous custom validation,
transformations, nested object/array validation, unknown-field handling,
and ready-to-use Express and Fastify integrations.

The package is designed to stay simple and lightweight, with no Express
or Fastify runtime dependency.

## Highlights

- Lightweight, rule-based payload validation
- Structured errors with stable machine-readable error codes
- Exact nested paths such as `profile.email` and
  `products[1].quantity`
- Recursive `objectAttr` and `elementConstraints` validation
- Array constraints with `minItems` and `maxItems`
- Built-in `trim`, `lowercase`, and `uppercase` transformations
- Custom synchronous `transform(value, payload)`
- Synchronous custom validators with `perfectPayload()`
- Synchronous or asynchronous custom validators with
  `perfectPayloadAsync()`
- Configurable unknown-field handling: `strip`, `allow`, or `reject`
- Optional simplified errors with `prettyErrors`
- Express middleware integration
- Fastify hook integration
- Validate `headers`, `params`, `query`, and `body`
- Aggregated validation errors across request sources
- Framework-aware error paths such as `body.email` and `params.userId`
- Transformed values returned through `validatedPayload`
- Original input payload/request data is not mutated
- No Express or Fastify runtime dependency
- Legacy `perfectPayloadV1()` retained during the migration period

## Quick Links

- [Installation](#installation)
- [Basic Usage](#basic-usage)
- [Public API](#public-api)
- [Options](#options)
- [Pretty Errors](#pretty-errors)
- [Express Integration](#express-integration)
- [Fastify Integration](#fastify-integration)
- [Framework Request Validation](#framework-request-validation)
- [Unknown Field Handling](#unknown-field-handling)
- [Synchronous vs Asynchronous
  Validation](#synchronous-vs-asynchronous-validation)
- [Validation Rules](#validation-rules)
- [Array Size and Nested
  Validation](#array-size-and-nested-validation)
- [Transformations and
  Sanitization](#transformations-and-sanitization)
- [Custom Validators](#customvalidator)
- [Asynchronous Validation](#asynchronous-validation)
- [Error Codes](#error-codes)
- [Custom Error Messages](#custom-error-messages)
- [Nested Objects and Array Field
  Paths](#nested-objects-and-array-field-paths)
- [Examples and Usage](#examples-and-usage)
- [Legacy API](#legacy-api)

## What's New in v1.8.0

v1.8.0 adds first-class framework integrations and simpler error output
while keeping the core validation API framework-independent.

## Express Integration

`perfect-payload` provides a lightweight Express adapter so request validation can be added directly as middleware.

Express is **not** installed as a dependency of `perfect-payload`.

### Import

```js
import { validatePayload, validatePayloadAsync } from "perfect-payload/express";
```

### Validate Request Body

Use `validatePayload()` when your validation rules are synchronous.

```js
import express from "express";
import { validatePayload } from "perfect-payload/express";

const app = express();

app.use(express.json());

const userRules = {
  email: {
    mandatory: true,
    type: "email",
    trim: true,
    lowercase: true,
  },
  age: {
    mandatory: true,
    type: "number",
    min: 18,
  },
};

app.post(
  "/users",
  validatePayload({
    rule: {
      body: userRules,
    },
  }),
  (req, res) => {
    const user = req.validatedPayload.body;

    res.json({
      message: "User created",
      user,
    });
  },
);
```

When validation succeeds, the middleware calls `next()` and makes the processed payload available at:

```js
req.validatedPayload;
```

For the example above:

```js
req.validatedPayload = {
  body: {
    email: "kiran@example.com",
    age: 29,
  },
};
```

The original `req.body` is not mutated.

### Validate Multiple Request Sources

The adapter can validate `headers`, `params`, `query`, and `body` together.

```js
app.post(
  "/users/:userId",
  validatePayload({
    rule: {
      headers: {
        authorization: {
          mandatory: true,
          type: "string",
        },
      },

      params: {
        userId: {
          mandatory: true,
          type: "string",
        },
      },

      query: {
        notify: {
          type: "boolean",
        },
      },

      body: {
        email: {
          mandatory: true,
          type: "email",
          trim: true,
          lowercase: true,
        },
      },
    },
  }),
  (req, res) => {
    const { headers, params, query, body } = req.validatedPayload;

    res.json({
      headers,
      params,
      query,
      body,
    });
  },
);
```

Only request sources configured inside `rule` are included in `req.validatedPayload`.

### Validation Errors

All configured request sources are validated and their errors are aggregated.

Structured error paths include the request source:

```js
{
  statusCode: 400,
  valid: false,
  message: "One or more attribute values are invalid",
  errors: [
    {
      path: "body.email",
      code: "INVALID_EMAIL",
      message: "Invalid email format for attribute email"
    }
  ]
}
```

The request source is added to the structured `path`, while the validation message itself is preserved.

### Adapter Options

Core options can be passed through the adapter using `options`:

```js
validatePayload({
  rule: {
    body: userRules,
  },
  options: {
    unknownFields: "reject",
    prettyErrors: false,
    inValidPayloadResponse: {
      statusCode: 422,
      valid: false,
      message: "Request validation failed",
    },
  },
});
```

### Async Validation

Use `validatePayloadAsync()` when the schema contains asynchronous `customValidator` functions.

```js
import { validatePayloadAsync } from "perfect-payload/express";

app.post(
  "/users",
  validatePayloadAsync({
    rule: {
      body: {
        username: {
          mandatory: true,
          type: "string",
          trim: true,

          customValidator: async (value) => {
            return await isUsernameAvailable(value);
          },

          customValidatorCode: "USERNAME_TAKEN",
          customValidatorError: "Username is already taken",
        },
      },
    },
  }),
  (req, res) => {
    res.json(req.validatedPayload.body);
  },
);
```

Use:

- `validatePayload()` for synchronous validation.
- `validatePayloadAsync()` when asynchronous `customValidator` functions are required.

Validation failures are handled by the middleware automatically. Unexpected errors from validators, transformations, or configuration are passed to Express through `next(error)`.

## Fastify Integration

`perfect-payload` provides a lightweight Fastify adapter that can be used directly as a route hook.

Fastify is **not** installed as a dependency of `perfect-payload`.

### Import

```js
import { validatePayload, validatePayloadAsync } from "perfect-payload/fastify";
```

### Validate Request Body

Use the adapter as a Fastify `preValidation` hook:

```js
import Fastify from "fastify";
import { validatePayload } from "perfect-payload/fastify";

const fastify = Fastify();

const userRules = {
  email: {
    mandatory: true,
    type: "email",
    trim: true,
    lowercase: true,
  },
  age: {
    mandatory: true,
    type: "number",
    min: 18,
  },
};

fastify.post(
  "/users",
  {
    preValidation: validatePayload({
      rule: {
        body: userRules,
      },
    }),
  },
  async (request, reply) => {
    const user = request.validatedPayload.body;

    return {
      message: "User created",
      user,
    };
  },
);
```

When validation succeeds, the processed payload is available at:

```js
request.validatedPayload;
```

For the example above:

```js
request.validatedPayload = {
  body: {
    email: "kiran@example.com",
    age: 29,
  },
};
```

The original `request.body` is not mutated.

### Validate Multiple Request Sources

The adapter can validate `headers`, `params`, `query`, and `body` together.

```js
fastify.post(
  "/users/:userId",
  {
    preValidation: validatePayload({
      rule: {
        headers: {
          authorization: {
            mandatory: true,
            type: "string",
          },
        },

        params: {
          userId: {
            mandatory: true,
            type: "string",
          },
        },

        query: {
          notify: {
            type: "boolean",
          },
        },

        body: {
          email: {
            mandatory: true,
            type: "email",
            trim: true,
            lowercase: true,
          },
        },
      },
    }),
  },
  async (request, reply) => {
    const { headers, params, query, body } = request.validatedPayload;

    return {
      headers,
      params,
      query,
      body,
    };
  },
);
```

Only request sources configured inside `rule` are included in `request.validatedPayload`.

### Validation Errors

All configured request sources are validated and their errors are aggregated.

Structured error paths include the request source:

```js
{
  statusCode: 400,
  valid: false,
  message: "One or more attribute values are invalid",
  errors: [
    {
      path: "body.email",
      code: "INVALID_EMAIL",
      message: "Invalid email format for attribute email"
    }
  ]
}
```

The request source is added to the structured `path`, while the validation message itself is preserved.

### Adapter Options

Core options can be passed through the adapter using `options`:

```js
validatePayload({
  rule: {
    body: userRules,
  },
  options: {
    unknownFields: "reject",
    prettyErrors: false,
    inValidPayloadResponse: {
      statusCode: 422,
      valid: false,
      message: "Request validation failed",
    },
  },
});
```

### Async Validation

Use `validatePayloadAsync()` when the schema contains asynchronous `customValidator` functions.

```js
import { validatePayloadAsync } from "perfect-payload/fastify";

fastify.post(
  "/users",
  {
    preValidation: validatePayloadAsync({
      rule: {
        body: {
          username: {
            mandatory: true,
            type: "string",
            trim: true,

            customValidator: async (value) => {
              return await isUsernameAvailable(value);
            },

            customValidatorCode: "USERNAME_TAKEN",
            customValidatorError: "Username is already taken",
          },
        },
      },
    }),
  },
  async (request, reply) => {
    return request.validatedPayload.body;
  },
);
```

Use:

- `validatePayload()` for synchronous validation.
- `validatePayloadAsync()` when asynchronous `customValidator` functions are required.

Validation failures are handled by the hook automatically. Unexpected errors from validators, transformations, or configuration propagate through Fastify's normal error-handling lifecycle.

### Framework-aware error paths

Structured validation errors include the request source in their path:

```js
{
  path: "body.email",
  code: "INVALID_EMAIL",
  message: "Invalid email format for attribute email"
}
```

The `path` identifies the exact request source and field. Custom and
default validation messages are preserved rather than rewritten by the
framework adapter.

### `prettyErrors`

v1.8.0 introduces the `prettyErrors` option. Structured errors remain
the default.

```js
const result = perfectPayload(payload, rules, {
  prettyErrors: true,
});
```

With `prettyErrors: true`, the `errors` array contains human-readable
message strings instead of structured error objects.

`prettyErrors` is also supported by `perfectPayloadAsync()` and the
Express/Fastify integrations.

### Error privacy

Default validation messages do not include submitted payload values.

Schema constraints such as allowed enum values, minimums, maximums, and
ranges may still appear in validation messages. Custom error messages
are controlled by the application and are returned as configured.

### Lightweight framework integrations

Express and Fastify are **not installed as dependencies of
`perfect-payload`**.

The framework integrations are thin adapters around the same validation
engine used by:

```js
perfectPayload();
perfectPayloadAsync();
```

This keeps the package lightweight while allowing framework users to
integrate validation without writing their own middleware or hooks.

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

By default, `validatedPayload` contains only fields defined in the validation schema. Extra payload fields are stripped unless `unknownFields` is explicitly configured as `"allow"` or `"reject"`.

The original input payload is not mutated. (such as validatedBody, sanitisedData or parsedBody).

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

## Public API

For new implementations, both supported APIs use the same clean three-argument signature:

```js

perfectPayload(data, validationRules, options?)

await perfectPayloadAsync(data, validationRules, options?)
```

The arguments are:

| Argument          | Required | Description                                                                         |
| ----------------- | -------- | ----------------------------------------------------------------------------------- |
| `data`            | No       | Payload/object to validate. Defaults to `{}`.                                       |
| `validationRules` | No       | Validation schema. Defaults to `{}`.                                                |
| `options`         | No       | API-level configuration such as unknown-field handling and custom response objects. |

The third argument is a single options object. You no longer need to pass separate positional arguments for custom valid and invalid responses.

### Options

```js

{

  unknownFields: "strip" | "allow" | "reject",

  validPayloadResponse: {

    statusCode: 200,

    valid: true,

  },

  inValidPayloadResponse: {

    statusCode: 400,

    valid: false,

    message: "One or more attribute values are invalid",

  },

}
```

All properties are optional. The defaults are equivalent to:

```js

{

  unknownFields: "strip",

  validPayloadResponse: {

    statusCode: 200,

    valid: true,

  },

  inValidPayloadResponse: {

    statusCode: 400,

    valid: false,

    message: "One or more attribute values are invalid",

  },

}
```

Example:

```js
const result = perfectPayload(payload, validationRules, {
  unknownFields: "reject",

  validPayloadResponse: {
    statusCode: 201,

    valid: true,

    message: "Payload accepted",
  },

  inValidPayloadResponse: {
    statusCode: 422,

    valid: false,

    message: "Payload validation failed",
  },
});
```

The same options object is supported by `perfectPayloadAsync()`:

```js
const result = await perfectPayloadAsync(payload, validationRules, {
  unknownFields: "reject",

  inValidPayloadResponse: {
    statusCode: 422,

    valid: false,

    message: "Payload validation failed",
  },
});
```

## Unknown Field Handling

`unknownFields` controls what happens when the input payload contains a field that is not defined in the validation schema.

Supported values:

| Value      | Behavior                                                                                                 |
| ---------- | -------------------------------------------------------------------------------------------------------- |
| `"strip"`  | Removes unknown fields from `validatedPayload`. This is the default and preserves the existing behavior. |
| `"allow"`  | Preserves unknown fields in `validatedPayload`.                                                          |
| `"reject"` | Rejects unknown fields with structured `UNKNOWN_FIELD` validation errors.                                |

### `strip` — default

```js
const payload = {
  name: "Kiran",

  role: "developer",
};

const rules = {
  name: {
    type: "string",
  },
};

const result = perfectPayload(payload, rules);
```

Result:

```js

{

  statusCode: 200,

  valid: true,

  validatedPayload: {

    name: "Kiran"

  }

}
```

`role` is not part of the schema, so it is removed from `validatedPayload`.

You can also set the default behavior explicitly:

```js
perfectPayload(payload, rules, {
  unknownFields: "strip",
});
```

### `allow` --- preserve unknown fields

```js
const result = perfectPayload(payload, rules, {
  unknownFields: "allow",
});
```

Result:

```js

{

  statusCode: 200,

  valid: true,

  validatedPayload: {

    name: "Kiran",

    role: "developer"

  }

}
```

Schema-defined fields are still validated normally. Unknown fields are

simply preserved.

### `reject` --- reject unknown fields

```js
const result = perfectPayload(payload, rules, {
  unknownFields: "reject",
});
```

Result:

```js

{

  statusCode: 400,

  valid: false,

  message: "One or more attribute values are invalid",

  errors: [

    {

      path: "role",

      code: "UNKNOWN_FIELD",

      message: "Unknown field role is not allowed"

    }

  ]

}
```

Unknown-field errors use the same structured error format as all other validation errors.

### Nested objects

Unknown-field handling is recursive for schemas using `objectAttr`.

```js
const payload = {
  profile: {
    city: "Bengaluru",

    role: "developer",
  },
};

const rules = {
  profile: {
    type: "object",

    objectAttr: {
      city: {
        type: "string",
      },
    },
  },
};

const result = perfectPayload(payload, rules, {
  unknownFields: "reject",
});
```

Returns:

```js

{

  statusCode: 400,

  valid: false,

  message: "One or more attribute values are invalid",

  errors: [

    {

      path: "profile.role",

      code: "UNKNOWN_FIELD",

      message: "Unknown field profile.role is not allowed"

    }

  ]

}
```

### Arrays and deep paths

`unknownFields` also applies recursively through `elementConstraints`. For an unknown field inside an array element, the error path includes

the array index:

```js

{

  path: "products[0].internalId",

  code: "UNKNOWN_FIELD",

  message: "Unknown field products[0].internalId is not allowed"

}
```

This continues through deeply nested combinations of objects and arrays,

for example:

```text

profile.teams[0].members[0].role
```

### Normal validation errors and unknown fields

With `"reject"`, unknown-field errors can be returned together with normal validation errors.

For example, an invalid email plus two unknown fields can produce:

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

    },

    {

      path: "role",

      code: "UNKNOWN_FIELD",

      message: "Unknown field role is not allowed"

    },

    {

      path: "active",

      code: "UNKNOWN_FIELD",

      message: "Unknown field active is not allowed"

    }

  ]

}
```

With `"allow"`, unknown fields do not create validation errors. Normal schema validation continues unchanged.

### Async behavior

`perfectPayloadAsync()` supports the same `unknownFields` option:

```js
const result = await perfectPayloadAsync(payload, rules, {
  unknownFields: "reject",
});
```

Unknown-field checking is part of the synchronous validation phase. If `"reject"` finds an unknown field, asynchronous `customValidator` functions are not executed for that payload. This follows the normal two-phase contract of `perfectPayloadAsync()`.

### Own properties only

Unknown-field handling considers only the payload object's own enumerable properties. Enumerable properties inherited through the prototype chain are ignored.

### Invalid option values

Only these values are accepted:

```text

strip

allow

reject
```

Any other value throws a configuration error:

```text

perfect-payload:- unknownFields must be one of strip, allow, reject
```

This is a configuration error, not a payload validation error.

## Synchronous vs Asynchronous Validation

For normal synchronous validation, use `perfectPayload()`:

```js
import { perfectPayload } from "perfect-payload";

const result = perfectPayload(payload, validationRules, options);
```

When any `customValidator` needs to perform asynchronous work, use `perfectPayloadAsync()` and `await` the result:

```js
import { perfectPayloadAsync } from "perfect-payload";

const result = await perfectPayloadAsync(
  payload,
  validationRules,

  options,
);
```

The public APIs are:

```text

perfectPayloadV1()                            legacy API; deprecated

perfectPayload(data, rules, options?)         synchronous validation

perfectPayloadAsync(data, rules, options?)    synchronous + asynchronous

customValidator
```

`perfectPayload()` remains synchronous and intentionally rejects a `customValidator` that returns a Promise. This preserves the existing synchronous API contract.

`perfectPayloadAsync()` first performs transformations and normal synchronous validation. If synchronous validation fails, the result is returned immediately and asynchronous validators are not executed. This avoids unnecessary asynchronous work for payloads that are already invalid.

```text

transformations

      ↓

synchronous validation

      ↓

sync errors? ── yes ──→ return validation errors

      ↓ no

async customValidator

      ↓

return result
```

## Legacy API

`perfectPayloadV1()` is still available for backward compatibility.

```js
import { perfectPayloadV1 } from "perfect-payload";
```

`perfectPayloadV1()` is deprecated and will no longer be supported

after

March 31, 2027.

Existing applications can continue using it during the migration period,

but all new implementations should use the current API:

```js

perfectPayload(data, validationRules, options?);
```

For asynchronous custom validation:

```js

await perfectPayloadAsync(data, validationRules, options?);
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

Note: If an inValidPayloadResponse is provided in the options, the system returns it alongside an automatically generated errors property. Do not include your own errors attribute inside the custom `options.inValidPayloadResponse` object.

## Validation Rules

`perfectPayload()` supports validation, nested-schema, custom-validation, and transformation rules.

### `mandatory`

Marks a field as required. An empty string is also treated as missing.

Default: `false`, the field is not required.

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

Default: `true`, `null` values are allowed.

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

Default: `true`, empty objects are allowed.

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

Default: `true`, empty arrays are allowed.

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

### `minItems`

Defines the minimum number of items required in an array.

Default: `Not applied when omitted.`

```js
const rules = {
  tags: {
    type: "array",

    minItems: 2,
  },
};
```

An array with fewer than 2 items returns `MIN_ITEMS`.

```js

{

  path: "tags",

  code: "MIN_ITEMS",

  message: "Attribute tags must contain at least 2 item(s)"

}
```

`minItems` is enforced even when `allowEmptyArray: true` is set. For

example, `minItems: 2` still rejects `[]`.

Error code: `MIN_ITEMS`

---

### `maxItems`

Defines the maximum number of items allowed in an array.

Default: `Not applied when omitted`.

```js
const rules = {
  tags: {
    type: "array",

    maxItems: 5,
  },
};
```

An array with more than 5 items returns `MAX_ITEMS`.

```js

{

  path: "tags",

  code: "MAX_ITEMS",

  message: "Attribute tags must contain at most 5 item(s)"

}
```

`minItems` and `maxItems` can be used together.

Error code: `MAX_ITEMS`

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

For `type: "number"`, `NaN` is rejected as `INVALID_TYPE`.

---

### `regex`

Validates a value using a regular expression.

Default: `Not applied when omitted.`

Example:

```js
const rules = {
  employeeCode: {
    type: "string",

    regex: /[^1]{3}[0-9]{3}$/,
  },
};
```

Error code: `REGEX_MISMATCH`

---

### `minLength`

Defines the minimum allowed string length.

Default: `Not applied when omitted.`

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

Default: `Not applied when omitted.`

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

Default: `false`; both integer and decimal numbers are allowed.

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

Default: `Not applied when omitted.`

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

Default: `Not applied when omitted.`

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

Default: `Not applied when omitted.`

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

---

## Array Size and Nested Validation

`perfectPayload()` supports array size constraints and recursive validation of arrays and objects at multiple depths. Array indexes and nested object keys are preserved in structured error paths.

### Array size constraints

Use `minItems` and `maxItems` with `type: "array"`:

```js
const rules = {
  products: {
    type: "array",

    minItems: 1,

    maxItems: 3,

    elementConstraints: {
      type: "object",

      objectAttr: {
        productId: { mandatory: true, type: "string" },

        quantity: { mandatory: true, type: "number", min: 1 },
      },
    },
  },
};
```

If the array is empty, `minItems` reports the array path itself:

```js

{

  path: "products",

  code: "MIN_ITEMS",

  message: "Attribute products must contain at least 1 item(s)"

}
```

### Arrays of objects

`elementConstraints` can contain `objectAttr`, allowing every object in an array to use a nested schema. An invalid quantity in the second product is reported as:

```text

products[1].quantity
```

### Deeply nested arrays and objects

`objectAttr` and `elementConstraints` can be combined recursively:

```js
const rules = {
  orders: {
    type: "array",

    minItems: 1,

    maxItems: 2,

    elementConstraints: {
      type: "object",

      objectAttr: {
        orderId: { mandatory: true, type: "string" },

        items: {
          mandatory: true,

          type: "array",

          minItems: 1,

          maxItems: 2,

          elementConstraints: {
            type: "object",

            objectAttr: {
              productId: { mandatory: true, type: "string" },

              quantity: { mandatory: true, type: "number", min: 1 },
            },
          },
        },
      },
    },
  },
};
```

A deep validation failure preserves the complete indexed path, for

example:

```text

orders[1].items[2].quantity
```

Array constraints work at nested levels too. A nested array can report paths such as:

```text

orders[1].items
```

Nested arrays are supported and every array index is preserved:

```text

matrix[1][1]

matrix[1][1][1]
```

Transformations applied inside nested objects or array elements are preserved in `validatedPayload`, while the original input remains unchanged.

### Transformations and Sanitization

`perfectPayload()` can transform a field before its validation rules run. The transformed value is returned in `validatedPayload`, while the original input object is not mutated.

Supported transformation rules:

| Rule        | Purpose                                               |
| ----------- | ----------------------------------------------------- |
| `trim`      | Removes leading and trailing whitespace from strings. |
| `lowercase` | Converts strings to lowercase.                        |
| `uppercase` | Converts strings to uppercase.                        |
| `transform` | Runs a custom synchronous transformation function.    |

Transformations always run in this fixed order, regardless of the order in which the rule properties are written:

```text

trim

↓

lowercase

↓

uppercase

↓

transform(value, payload)

↓

validation rules

↓

customValidator

↓

validatedPayload
```

#### `trim`

```js
const payload = {
  name: "   Kiran Poojary   ",
};

const rules = {
  name: {
    type: "string",

    trim: true,
  },
};

const result = perfectPayload(payload, rules);

console.log(result.validatedPayload.name);

// "Kiran Poojary"

console.log(payload.name);

// "   Kiran Poojary   "
```

`trim` applies only to string values. Non-string values are left

unchanged.

#### `lowercase`

```js
const rules = {
  email: {
    trim: true,

    lowercase: true,

    type: "email",
  },
};
```

For `"  KIRAN@EXAMPLE.COM  "`, the validated value becomes `"kiran@example.com"`.

#### `uppercase`

```js
const rules = {
  countryCode: {
    type: "string",

    uppercase: true,
  },
};
```

For `"in"`, the validated value becomes `"IN"`. `lowercase: true` and `uppercase: true` cannot be enabled together for the same field. Doing so throws a schema configuration error.

#### `transform`

Use `transform` when the built-in string transformations are not enough.

```js
const rules = {
  phone: {
    type: "string",

    transform: (value) => value.replace(/`\s`{=tex}+/g, ""),
  },
};
```

For `"98765 43210"`, the validated value becomes `"9876543210"`.

The transformer receives two arguments:

```js
transform: (value, payload) => {
  return value;
};
```

- `value` is the field value after the built-in transformations have run.

- `payload` is the current payload/object being validated.

This makes cross-field transformations possible:

```js
const payload = {
  amount: 100,

  multiplier: 2,
};

const rules = {
  amount: {
    transform: (value, payload) => value * payload.multiplier,

    type: "number",
  },

  multiplier: {
    type: "number",
  },
};

const result = perfectPayload(payload, rules);

console.log(result.validatedPayload.amount);

// 200***
```

A custom transformer may also change the data type before validation:

```js
const rules = {
  quantity: {
    transform: (value) => Number(value),

    type: "number",

    min: 1,

    max: 100,
  },
};
```

The transformed value is validated by the normal validation rules and is also the value received by `customValidator`. Transformations work inside `objectAttr` and `elementConstraints`, and transformed nested/array values are preserved in `validatedPayload`.

```js
const rules = {
  profile: {
    type: "object",

    objectAttr: {
      name: {
        trim: true,

        uppercase: true,

        type: "string",
      },
    },
  },

  tags: {
    type: "array",

    elementConstraints: {
      trim: true,

      lowercase: true,

      type: "string",
    },
  },
};
```

Missing optional fields are not transformed. An input value of `null` is not passed to transformation functions; null handling remains controlled by `allowNull`.

**Important:** `transform` is synchronous. A non-function transformer, an `async` transformer, a transformer that returns a Promise, or a transformer that returns `undefined` is not supported and throws an error.

Returning `null`, `""`, `0`, or `false` is allowed; the transformed value is then processed by the normal validation rules. Exceptions thrown inside the transformer propagate to the caller.

For example, returning `undefined` throws:

```text

perfect-payload:- transform must not return undefined for attribute

username
```

### `customValidator`

Defines custom validation logic when the built-in rules are not enough.

The validator receives:

```js
customValidator: (value, payload) => {
  return true;
};
```

- `value` is the field value after transformations have been applied.

- `payload` is the current payload/object being validated.

- Return `true` to pass.

- Any value other than `true` fails validation.

- Exceptions thrown by the validator propagate to the caller.

For nested validation, `payload` means the current nested object rather than the root request body.

#### Synchronous custom validator

Use a synchronous validator with `perfectPayload()`:

```js
const rules = {
  username: {
    mandatory: true,

    type: "string",

    trim: true,

    customValidator: (value) => {
      return !value.toLowerCase().includes("admin");
    },

    customValidatorCode: "RESERVED_USERNAME",

    customValidatorError: "Username cannot contain admin",
  },
};

const result = perfectPayload({ username: "  admin_kiran  " }, rules);
```

A failure returns:

```js

{

  statusCode: 400,

  valid: false,

  message: "One or more attribute values are invalid",

  errors: [

    {

      path: "username",

      code: "RESERVED_USERNAME",

      message: "Username cannot contain admin"

    }

  ]

}
```

The current payload/object can be used for cross-field validation:

```js
const rules = {
  limit: {
    type: "number",
  },

  amount: {
    type: "number",

    customValidator: (value, payload) => {
      return value <= payload.limit;
    },

    customValidatorCode: "LIMIT_EXCEEDED",

    customValidatorError: "Amount cannot exceed limit",
  },
};
```

If `customValidatorCode` and `customValidatorError` are omitted, the

default error is:

```js

{

  path: "username",

  code: "CUSTOM_VALIDATION_FAILED",

  message: "Custom validation failed for attribute username"

}
```

`customValidator` works recursively inside `objectAttr` and `elementConstraints`. Structured errors preserve the corresponding nested and array paths.

When using `perfectPayload()`, `customValidator` must remain synchronous. A Promise-returning validator throws:

```text

perfect-payload:- customValidator must be synchronous for attribute

username
```

For asynchronous custom validation, use `perfectPayloadAsync()`.

## Asynchronous Validation

`perfectPayloadAsync()` supports both synchronous and asynchronous `customValidator` functions without changing the behavior of

`perfectPayload()`.

```js
import { perfectPayloadAsync } from "perfect-payload";

const rules = {
  username: {
    mandatory: true,

    type: "string",

    trim: true,

    customValidator: async (value) => {
      const available = await checkUsernameAvailability(value);

      return available;
    },

    customValidatorCode: "USERNAME_TAKEN",

    customValidatorError: "Username is already taken",
  },
};

const result = await perfectPayloadAsync(
  {
    username: "  kiran  ",
  },

  rules,
);
```

On success, transformations are preserved:

```js

{

  statusCode: 200,

  valid: true,

  validatedPayload: {

    username: "kiran"

  }

}
```

On asynchronous validation failure:

```js

{

  statusCode: 400,

  valid: false,

  message: "One or more attribute values are invalid",

  errors: [

    {

      path: "username",

      code: "USERNAME_TAKEN",

      message: "Username is already taken"

    }

  ]

}
```

### Async validator contract

For `perfectPayloadAsync()`:

```text

true             → pass

false            → validation failure

anything != true → validation failure

throw            → exception propagates

rejected Promise → rejection propagates
```

A normal synchronous validator is also valid when using the asynchronous

API:

```js
const rules = {
  username: {
    type: "string",

    customValidator: (value) => value !== "admin",
  },
};

const result = await perfectPayloadAsync(payload, rules);
```

A configured `customValidator` must be a function. Otherwise an error

is

thrown:

```text

perfect-payload:- customValidator must be a function for attribute username
```

### Validation order

`perfectPayloadAsync()` uses two phases:

1. Transform the payload and run normal synchronous validation.

2. If phase 1 succeeds, run custom validators with `await`.

If any synchronous validation error exists, phase 2 is skipped and the synchronous validation result is returned immediately. This means asynchronous validators can assume the payload has already passed its normal synchronous validation rules.

### Nested async validation

Async custom validators work recursively inside `objectAttr`:

```js
const rules = {
  profile: {
    type: "object",

    objectAttr: {
      username: {
        type: "string",

        trim: true,

        customValidator: async (value) => {
          return await isUsernameAvailable(value);
        },

        customValidatorCode: "USERNAME_TAKEN",

        customValidatorError: "Username is already taken",
      },
    },
  },
};
```

A failure produces the complete path:

```text

profile.username
```

They also work inside `elementConstraints`:

```js
const rules = {
  usernames: {
    type: "array",

    elementConstraints: {
      type: "string",

      trim: true,

      customValidator: async (value) => {
        return await isUsernameAvailable(value);
      },

      customValidatorCode: "USERNAME_TAKEN",

      customValidatorError: "Username is already taken",
    },
  },
};
```

For an invalid second element:

```text

usernames[1]
```

Deep combinations of objects and arrays preserve every level of the

path:

```text

products[1].seller.username

profile.teams[1].members[1].username
```

Default async custom-validation messages also use the final indexed

path:

```js

{

  path: "users[1].username",

  code: "CUSTOM_VALIDATION_FAILED",

  message: "Custom validation failed for attribute users[1].username"

}
```

### Transform remains synchronous

`perfectPayloadAsync()` makes custom validation asynchronous; it does

not make `transform` asynchronous.

`transform` must still be synchronous:

```js
transform: (value, payload) => {
  return value;
};
```

An async transformer or a transformer that returns a Promise is not

supported.

## Error Codes

`perfectPayload()` currently exposes the following machine-readable

validation error codes:

```text

REQUIRED

NULL_NOT_ALLOWED

EMPTY_OBJECT_NOT_ALLOWED

EMPTY_ARRAY_NOT_ALLOWED

MIN_ITEMS

MAX_ITEMS

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

CUSTOM_VALIDATION_FAILED

UNKNOWN_FIELD
```

These codes are designed for programmatic handling while `message` remains suitable for human-readable API responses.

For example:

```js

const result = perfectPayload(payload, validationRules);

if (!result.valid) {

  const emailError = result.errors.find(

    (error) => error.code === "INVALID_EMAIL",

  );

  if (emailError) {

    *****// Handle invalid email*****

  }

}
```

## Custom Error Messages

Every validation rule can use its corresponding custom error message. Custom messages replace the default human-readable `message` while keeping the same structured error format:

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

| Validation Rule      | Custom Error Property     |
| -------------------- | ------------------------- |
| `mandatory`          | `mandatoryError`          |
| `allowNull`          | `allowNullError`          |
| `allowEmptyObject`   | `emptyObjectError`        |
| `allowEmptyArray`    | `emptyArrayError`         |
| `elementConstraints` | `elementConstraintsError` |
| `regex`              | `regexError`              |
| `type`               | `typeError`               |
| `minLength`          | `minLengthError`          |
| `maxLength`          | `maxLengthError`          |
| `preventDecimal`     | `preventDecimalError`     |
| `min`                | `minError`                |
| `max`                | `maxError`                |
| `range`              | `rangeError`              |

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

Custom messages only replace the `message`. They do not change the validation error `code`.

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

Custom valid and invalid response objects are configured inside the

optional third `options` argument.

```js

perfectPayload(data, validationRules, options?)

await perfectPayloadAsync(data, validationRules, options?)
```

This keeps API-level configuration in one place and avoids positional

`undefined` arguments.

### Custom Valid Response

```js
const result = perfectPayload(payload, validationRules, {
  validPayloadResponse: {
    statusCode: 201,

    valid: true,

    message: "Payload validated successfully",
  },
});
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

```js
const result = perfectPayload(payload, validationRules, {
  inValidPayloadResponse: {
    statusCode: 422,

    valid: false,

    message: "Payload validation failed",
  },
});
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

      message: "Invalid email format for attribute email"

    }

  ]

}
```

### Custom Valid and Invalid Responses Together

```js
const result = perfectPayload(payload, validationRules, {
  validPayloadResponse: {
    statusCode: 201,

    valid: true,

    message: "CUSTOM_VALID_RESPONSE",
  },

  inValidPayloadResponse: {
    statusCode: 422,

    valid: false,

    message: "CUSTOM_INVALID_RESPONSE",
  },
});
```

You can combine response customization with other API options:

```js
const result = perfectPayload(payload, validationRules, {
  unknownFields: "reject",

  validPayloadResponse: {
    statusCode: 201,

    valid: true,
  },

  inValidPayloadResponse: {
    statusCode: 422,

    valid: false,

    message: "Payload validation failed",
  },
});
```

The response object you provide is preserved while `perfectPayload()` automatically adds `validatedPayload` for successful validation or `errors` for failed validation.

The same response options are supported by `perfectPayloadAsync()`.

## v1.7 API Migration

The current `perfectPayload()` and `perfectPayloadAsync()` APIs use one optional third argument for configuration:

```js

perfectPayload(data, validationRules, options?)

perfectPayloadAsync(data, validationRules, options?)
```

Custom response objects now belong inside `options`.

Use:

```js
perfectPayload(payload, rules, {
  validPayloadResponse: customValidResponse,

  inValidPayloadResponse: customInvalidResponse,
});
```

instead of passing custom response objects as separate positional arguments. This also makes it possible to combine response customization with `unknownFields` without placeholder arguments:

```js
perfectPayload(payload, rules, {
  unknownFields: "reject",

  inValidPayloadResponse: {
    statusCode: 422,

    valid: false,

    message: "Payload validation failed",
  },
});
```

`perfectPayloadV1()` is unchanged and retains its legacy signature during its deprecation period.

## Default Responses

If no custom response objects are provided, the default valid response is:

```js

{

  statusCode: 200,

  valid: true,

  validatedPayload: {

    *****// validated fields*****

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

`perfectPayload()` returns the exact location of a validation failure through the `path` property. This makes validation errors easier to map to API fields, forms, logs, and frontend components.

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

Because `latitude` is a string instead of a number, the error contains its complete nested path:

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

When `elementConstraints` validation fails, the array index is included in the error path.

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

Array-level constraints such as `minItems` and `maxItems` report the path of the array itself. For nested arrays, the complete parent path is retained, for example `orders[1].items`.

### Nested Fields Inside Arrays

Paths can also identify fields inside array elements.

For example:

```text

products[0].quantity

products[1].quantity

products[2].price
```

This provides enough information for consumers to identify the exact field that caused the validation error.

### Why Structured Paths Are Useful

Instead of parsing an error message to determine which field failed, applications can directly use:

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

## Examples and Usage

### Sample Validation Rule

sample-1

```js

{

  firstName: {

    mandatory: true,

    allowNull: false,

    type: "string",

    minLength: 3,

    minLengthError: "First name must have minimum 3 characters."

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

```js

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

    regex: /[^2]+@[a-zA-Z0-9.-]+.[a-zA-Z]{2,}$/,

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

#### Creating a route with payload validation middleware

```js

****// validatePayload is the middleware that invokes

perfectPayload()****

router.post(

  "/payload-validation",

  validatePayload({ rule: <your validation rule json object> }),

  (req, res) => res.send("OK")

);
```

#### ES Modules middleware example

```js
import { perfectPayload } from "perfect-payload";

export const validatePayload = ({ rule }) => {
  return (req, res, next) => {
    try {
      const { statusCode, ...response } = perfectPayload(
        req?.body,

        rule,
      );

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

#### Async ES Modules middleware example

When your schema contains an asynchronous `customValidator`, the middleware itself must be `async` and `perfectPayloadAsync()` must be awaited:

```js
import { perfectPayloadAsync } from "perfect-payload";

export const validatePayloadAsync = ({ rule }) => {
  return async (req, res, next) => {
    try {
      const { statusCode, ...response } = await perfectPayloadAsync(
        req?.body,

        rule,
      );

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
};
```

Route usage:

```js

router.post(

  "/payload-validation",

  validatePayloadAsync({ rule: <your validation rule json object> }),

  (req, res) => res.send("OK"),

);
```

#### CommonJS middleware example

```js
function validatePayload({ rule }) {
  return async (req, res, next) => {
    try {
      const { perfectPayload } = await import("perfect-payload");

      const { statusCode, ...response } = perfectPayload(
        req?.body,

        rule,
      );

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
