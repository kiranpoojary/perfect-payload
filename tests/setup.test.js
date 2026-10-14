import { describe, test, expect } from "@jest/globals";

describe("Jest setup", () => {
  test("runs ES module tests successfully", () => {
    expect(1 + 1).toBe(2);
  });
});
