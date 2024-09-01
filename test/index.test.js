import { helloWorld } from "../index.js";

test("should return Hello, world!", () => {
  expect(helloWorld()).toBe("Hello, world!");
});
