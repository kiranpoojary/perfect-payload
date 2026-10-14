import { describe, test, expect } from "@jest/globals";

import { invalidResult } from "../fixtures/core.fixtures.js";

describe("Core - Basic Types", () => {
  const cases = [
    ["number type -> INVALID_TYPE", "numberType", "INVALID_TYPE"],
    ["string type -> INVALID_TYPE", "stringType", "INVALID_TYPE"],
    ["boolean type -> INVALID_TYPE", "booleanType", "INVALID_TYPE"],
    ["array type -> INVALID_TYPE", "arrayType", "INVALID_TYPE"],
    ["object type -> INVALID_TYPE", "objectType", "INVALID_TYPE"],
  ];

  test.each(cases)("%s", (_description, path, code) => {
    expect(invalidResult.errors).toEqual(
      expect.arrayContaining([expect.objectContaining({ path, code })]),
    );
  });
});

describe("Core - Special Types", () => {
  const cases = [
    ["email type -> INVALID_EMAIL", "emailType", "INVALID_EMAIL"],
    ["url type -> INVALID_URL", "urlType", "INVALID_URL"],
    ["enum type -> INVALID_ENUM", "enumType", "INVALID_ENUM"],
    ["uuid type -> INVALID_UUID", "uuidType", "INVALID_UUID"],
    ["uuidv1 type -> INVALID_UUID_V1", "uuidV1Type", "INVALID_UUID_V1"],
    ["uuidv3 type -> INVALID_UUID_V3", "uuidV3Type", "INVALID_UUID_V3"],
    ["uuidv4 type -> INVALID_UUID_V4", "uuidV4Type", "INVALID_UUID_V4"],
    ["uuidv5 type -> INVALID_UUID_V5", "uuidV5Type", "INVALID_UUID_V5"],
    ["objectId type -> INVALID_OBJECT_ID", "objectIdType", "INVALID_OBJECT_ID"],
  ];

  test.each(cases)("%s", (_description, path, code) => {
    expect(invalidResult.errors).toEqual(
      expect.arrayContaining([expect.objectContaining({ path, code })]),
    );
  });
});
