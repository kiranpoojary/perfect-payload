import { describe, test, expect } from "@jest/globals";
import { perfectPayload } from "../../dist/index.js";
import { invalidResult } from "../fixtures/core.fixtures.js";

describe("Core - Array Validations", () => {
  test("Array element error contains index path marks[2]", () => {
    expect(invalidResult.errors).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          path: "marks[2]",
          code: "OUT_OF_RANGE",
        }),
      ]),
    );
  });

  test("minItems and maxItems work together", () => {
    const result = perfectPayload(
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

    expect(result.valid).toBe(true);
  });
});

describe("Core - minItems Validation", () => {
  test("minItems preserves valid array in validatedPayload", () => {
    const result = perfectPayload(
      { tags: ["nodejs", "react"] },
      {
        tags: {
          type: "array",
          minItems: 2,
        },
      },
    );

    expect(result.valid).toBe(true);
    expect(result.validatedPayload?.tags).toEqual(["nodejs", "react"]);
  });

  test("minItems passes when array length equals minimum", () => {
    const result = perfectPayload(
      { tags: ["nodejs", "react"] },
      { tags: { type: "array", minItems: 2 } },
    );

    expect(result.valid).toBe(true);
  });

  test("minItems passes when array length is above minimum", () => {
    const result = perfectPayload(
      { tags: ["nodejs", "react", "mongodb"] },
      { tags: { type: "array", minItems: 2 } },
    );

    expect(result.valid).toBe(true);
  });

  test("minItems fails when array length is below minimum", () => {
    const result = perfectPayload(
      { tags: ["nodejs"] },
      { tags: { type: "array", minItems: 2 } },
    );

    expect(result.valid).toBe(false);
    expect(result.errors?.[0]).toEqual(
      expect.objectContaining({
        path: "tags",
        code: "MIN_ITEMS",
      }),
    );
  });

  test("minItems validates empty array when allowEmptyArray is true", () => {
    const result = perfectPayload(
      { tags: [] },
      {
        tags: {
          type: "array",
          allowEmptyArray: true,
          minItems: 2,
        },
      },
    );

    expect(result.valid).toBe(false);
    expect(result.errors?.[0]?.code).toBe("MIN_ITEMS");
  });

  test("minItems skips missing optional field", () => {
    const result = perfectPayload({}, { tags: { type: "array", minItems: 2 } });

    expect(result.valid).toBe(true);
  });

  test("minItems skips null when allowNull is true", () => {
    const result = perfectPayload(
      { tags: null },
      {
        tags: {
          type: "array",
          allowNull: true,
          minItems: 2,
        },
      },
    );

    expect(result.valid).toBe(true);
  });

  test("minItems does not replace existing array type validation", () => {
    const result = perfectPayload(
      { tags: "nodejs" },
      { tags: { type: "array", minItems: 2 } },
    );

    expect(result.valid).toBe(false);
    expect(result.errors).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          path: "tags",
          code: "INVALID_TYPE",
        }),
      ]),
    );
  });
});

describe("Core - maxItems Validation", () => {
  test("maxItems passes when array length equals maximum", () => {
    const result = perfectPayload(
      { tags: ["nodejs", "react", "mongodb"] },
      { tags: { type: "array", maxItems: 3 } },
    );

    expect(result.valid).toBe(true);
  });

  test("maxItems passes when array length is below maximum", () => {
    const result = perfectPayload(
      { tags: ["nodejs", "react"] },
      { tags: { type: "array", maxItems: 3 } },
    );

    expect(result.valid).toBe(true);
  });

  test("maxItems fails when array length is above maximum", () => {
    const result = perfectPayload(
      { tags: ["nodejs", "react", "mongodb", "express"] },
      { tags: { type: "array", maxItems: 3 } },
    );

    expect(result.valid).toBe(false);
    expect(result.errors?.[0]).toEqual({
      path: "tags",
      code: "MAX_ITEMS",
      message: "Attribute tags must contain at most 3 item(s)",
    });
  });

  test("maxItems passes for allowed empty array", () => {
    const result = perfectPayload(
      { tags: [] },
      {
        tags: {
          type: "array",
          allowEmptyArray: true,
          maxItems: 3,
        },
      },
    );

    expect(result.valid).toBe(true);
  });

  test("maxItems skips missing optional field", () => {
    const result = perfectPayload({}, { tags: { type: "array", maxItems: 3 } });

    expect(result.valid).toBe(true);
  });

  test("maxItems skips null when allowNull is true", () => {
    const result = perfectPayload(
      { tags: null },
      {
        tags: {
          type: "array",
          allowNull: true,
          maxItems: 3,
        },
      },
    );

    expect(result.valid).toBe(true);
  });

  test("maxItems does not replace existing array type validation", () => {
    const result = perfectPayload(
      { tags: "nodejs" },
      { tags: { type: "array", maxItems: 3 } },
    );

    expect(result.valid).toBe(false);
    expect(result.errors).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          path: "tags",
          code: "INVALID_TYPE",
        }),
      ]),
    );
  });
});

describe("Core - Array of Objects Validation", () => {
  const rules = {
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
  };

  test("elementConstraints supports arrays of objects", () => {
    const result = perfectPayload(
      {
        products: [
          { productId: "P100", quantity: 2 },
          { productId: "P200", quantity: 5 },
        ],
      },
      rules,
    );

    expect(result.valid).toBe(true);
    expect(result.validatedPayload?.products).toHaveLength(2);
    expect(result.validatedPayload?.products?.[1]?.productId).toBe("P200");
  });

  test("array of objects preserves indexed nested validation path", () => {
    const result = perfectPayload(
      {
        products: [
          { productId: "P100", quantity: 2 },
          { productId: "P200", quantity: 0 },
        ],
      },
      rules,
    );

    expect(result.valid).toBe(false);
    expect(result.errors?.[0]).toEqual(
      expect.objectContaining({
        path: "products[1].quantity",
        code: "MIN_VALUE",
      }),
    );
  });

  test("array of objects preserves indexed path for missing nested field", () => {
    const result = perfectPayload(
      {
        products: [{ productId: "P100", quantity: 2 }, { quantity: 5 }],
      },
      rules,
    );

    expect(result.valid).toBe(false);
    expect(result.errors?.[0]).toEqual(
      expect.objectContaining({
        path: "products[1].productId",
        code: "REQUIRED",
      }),
    );
  });
});

describe("Core - Deep Nested Object/Array Validation", () => {
  const rules = {
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

  test("deep nested object-array-object structure validates successfully", () => {
    const result = perfectPayload(
      {
        orders: {
          items: [
            { product: { sku: "SKU-100", quantity: 2 } },
            { product: { sku: "SKU-200", quantity: 5 } },
          ],
        },
      },
      rules,
    );

    expect(result.valid).toBe(true);
    expect(result.validatedPayload?.orders?.items?.[0]?.product?.sku).toBe(
      "SKU-100",
    );
    expect(result.validatedPayload?.orders?.items?.[1]?.product?.sku).toBe(
      "SKU-200",
    );
  });

  test("deep nested validation preserves indexed quantity path", () => {
    const result = perfectPayload(
      {
        orders: {
          items: [
            { product: { sku: "SKU-100", quantity: 2 } },
            { product: { sku: "SKU-200", quantity: 0 } },
          ],
        },
      },
      rules,
    );

    expect(result.valid).toBe(false);
    expect(result.errors?.[0]).toEqual(
      expect.objectContaining({
        path: "orders.items[1].product.quantity",
        code: "MIN_VALUE",
      }),
    );
  });

  test("deep nested missing field preserves indexed path", () => {
    const result = perfectPayload(
      {
        orders: {
          items: [
            { product: { sku: "SKU-100", quantity: 2 } },
            { product: { quantity: 5 } },
          ],
        },
      },
      rules,
    );

    expect(result.valid).toBe(false);
    expect(result.errors?.[0]).toEqual(
      expect.objectContaining({
        path: "orders.items[1].product.sku",
        code: "REQUIRED",
      }),
    );
  });

  test("deep nested transformation is preserved in validatedPayload", () => {
    const result = perfectPayload(
      {
        orders: {
          items: [
            { product: { sku: "   sku-100   ", quantity: 2 } },
            { product: { sku: "   sku-200   ", quantity: 5 } },
          ],
        },
      },
      rules,
    );

    expect(result.valid).toBe(true);
    expect(result.validatedPayload?.orders?.items?.[0]?.product?.sku).toBe(
      "SKU-100",
    );
    expect(result.validatedPayload?.orders?.items?.[1]?.product?.sku).toBe(
      "SKU-200",
    );
  });

  test("deep nested transformation does not mutate original payload", () => {
    const payload = {
      orders: {
        items: [
          { product: { sku: "   sku-100   ", quantity: 2 } },
          { product: { sku: "   sku-200   ", quantity: 5 } },
        ],
      },
    };

    perfectPayload(payload, rules);

    expect(payload.orders.items[0].product.sku).toBe("   sku-100   ");
    expect(payload.orders.items[1].product.sku).toBe("   sku-200   ");
  });
});

describe("Core - Nested Array Validation", () => {
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

  test("elementConstraints supports nested arrays", () => {
    const result = perfectPayload(
      {
        matrix: [
          [1, 2],
          [3, 4],
        ],
      },
      nestedArrayRules,
    );

    expect(result.valid).toBe(true);
    expect(result.validatedPayload?.matrix?.[0]?.[0]).toBe(1);
    expect(result.validatedPayload?.matrix?.[1]?.[1]).toBe(4);
  });

  test("nested array preserves multi-level indexed error path", () => {
    const result = perfectPayload(
      {
        matrix: [
          [1, 2],
          [3, 0],
        ],
      },
      nestedArrayRules,
    );

    expect(result.valid).toBe(false);
    expect(result.errors?.[0]).toEqual(
      expect.objectContaining({
        path: "matrix[1][1]",
        code: "MIN_VALUE",
      }),
    );
  });

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

  test("transformations are preserved inside nested arrays", () => {
    expect(nestedArrayTransform.valid).toBe(true);
    expect(nestedArrayTransform.validatedPayload?.categories).toEqual([
      ["NODEJS", "REACT"],
      ["MONGODB", "EXPRESS"],
    ]);
  });

  test("nested array transformations do not mutate original payload", () => {
    expect(nestedArrayTransformInput.categories).toEqual([
      ["  nodejs  ", " react "],
      [" mongodb ", " express "],
    ]);
  });

  test("deep nested arrays preserve all array indexes in error path", () => {
    const result = perfectPayload(
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

    expect(result.valid).toBe(false);
    expect(result.errors?.[0]).toEqual(
      expect.objectContaining({
        path: "matrix[1][1][1]",
        code: "MIN_VALUE",
      }),
    );
  });
});

describe("Core - Complex Nested Array/Object Validation", () => {
  const rules = {
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

  test("array-object-array-object structure validates successfully", () => {
    const result = perfectPayload(
      {
        orders: [
          {
            orderId: "ORD-100",
            items: [{ productId: "P100", quantity: 2 }],
          },
          {
            orderId: "ORD-200",
            items: [
              { productId: "P200", quantity: 1 },
              { productId: "P201", quantity: 3 },
              { productId: "P202", quantity: 5 },
            ],
          },
        ],
      },
      rules,
    );

    expect(result.valid).toBe(true);
    expect(result.validatedPayload?.orders?.[1]?.items?.[2]).toEqual({
      productId: "P202",
      quantity: 5,
    });
  });

  test("array-object-array-object preserves complete indexed error path", () => {
    const result = perfectPayload(
      {
        orders: [
          {
            orderId: "ORD-100",
            items: [{ productId: "P100", quantity: 2 }],
          },
          {
            orderId: "ORD-200",
            items: [
              { productId: "P200", quantity: 1 },
              { productId: "P201", quantity: 3 },
              { productId: "P202", quantity: 0 },
            ],
          },
        ],
      },
      rules,
    );

    expect(result.valid).toBe(false);
    expect(result.errors?.[0]).toEqual(
      expect.objectContaining({
        path: "orders[1].items[2].quantity",
        code: "MIN_VALUE",
      }),
    );
  });

  test("minItems works inside nested array/object structures", () => {
    const result = perfectPayload(
      {
        orders: [
          {
            orderId: "ORD-100",
            items: [],
          },
        ],
      },
      rules,
    );

    expect(result.valid).toBe(false);
    expect(result.errors?.[0]).toEqual(
      expect.objectContaining({
        path: "orders[0].items",
        code: "MIN_ITEMS",
      }),
    );
  });
});

describe("Core - Nested minItems + maxItems", () => {
  const rules = {
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

  test("minItems and maxItems work at multiple nested levels", () => {
    const result = perfectPayload(
      {
        orders: [
          {
            orderId: "ORD-100",
            items: [
              { productId: "P100", quantity: 2 },
              { productId: "P101", quantity: 3 },
            ],
          },
          {
            orderId: "ORD-200",
            items: [{ productId: "P200", quantity: 1 }],
          },
        ],
      },
      rules,
    );

    expect(result.valid).toBe(true);
    expect(result.validatedPayload?.orders).toHaveLength(2);
    expect(result.validatedPayload?.orders?.[0]?.items).toHaveLength(2);
    expect(result.validatedPayload?.orders?.[1]?.items).toHaveLength(1);
  });

  test.each([
    [
      "maxItems reports correct top-level array path",
      [
        { orderId: "ORD-100", items: [{ productId: "P100", quantity: 1 }] },
        { orderId: "ORD-200", items: [{ productId: "P200", quantity: 1 }] },
        { orderId: "ORD-300", items: [{ productId: "P300", quantity: 1 }] },
      ],
      "orders",
      "MAX_ITEMS",
    ],
    [
      "maxItems reports correct nested array path",
      [
        { orderId: "ORD-100", items: [{ productId: "P100", quantity: 1 }] },
        {
          orderId: "ORD-200",
          items: [
            { productId: "P200", quantity: 1 },
            { productId: "P201", quantity: 2 },
            { productId: "P202", quantity: 3 },
          ],
        },
      ],
      "orders[1].items",
      "MAX_ITEMS",
    ],
    [
      "minItems reports correct nested array path",
      [
        { orderId: "ORD-100", items: [{ productId: "P100", quantity: 1 }] },
        { orderId: "ORD-200", items: [] },
      ],
      "orders[1].items",
      "MIN_ITEMS",
    ],
    [
      "minItems reports correct top-level array path",
      [],
      "orders",
      "MIN_ITEMS",
    ],
  ])("%s", (_description, orders, path, code) => {
    const result = perfectPayload({ orders }, rules);

    expect(result.valid).toBe(false);
    expect(result.errors?.[0]).toEqual(expect.objectContaining({ path, code }));
  });
});
