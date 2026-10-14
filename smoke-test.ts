// @ts-nocheck
// RUN: npx tsx smoke-test.ts
import {
  perfectPayload,
  perfectPayloadAsync,
  perfectPayloadAsyncForFramework,
} from "./src/index.ts";

import {
  validatePayload as expressValidatePayload,
  validatePayloadAsync as expressValidatePayloadAsync,
} from "./src/express.ts";

import {
  validatePayload as fastifyValidatePayload,
  validatePayloadAsync as fastifyValidatePayloadAsync,
} from "./src/fastify.ts";

// response object for express
const res: any = {
  statusCode: 200,
  body: undefined,

  status(code: number) {
    this.statusCode = code;
    return this;
  },

  json(data: unknown) {
    this.body = data;
    console.log(data);
    return this;
  },

  send(data: unknown) {
    this.body = data;
    console.log(data);
    return this;
  },
};

const payload = {
  mark: 70,
};

const rules = {
  mark: {
    type: "number",
    range: "0:100",
  },
};

const options = {
  unknownFields: "allow" as any,
  prettyErrors: "false" as any,
};

// // --------------------------------------------------
// // 1. Core Sync
// // --------------------------------------------------

console.log("\n1. CORE SYNC");

try {
  const result = perfectPayload(payload, rules, options);

  console.log(result);
} catch (error) {
  console.error(error);
}

// // --------------------------------------------------
// // 2. Core Async
// // --------------------------------------------------

// console.log("\n2. CORE ASYNC");

// try {
//   const result = await perfectPayloadAsync(payload, rules, options);

//   console.log(result);
// } catch (error) {
//   console.error(error);
// }

// // --------------------------------------------------
// // 3. Core Async For Framework
// // --------------------------------------------------

// console.log("\n3. CORE ASYNC FOR FRAMEWORK");

// try {
//   const result = await perfectPayloadAsyncForFramework(payload, rules, options);

//   console.log(result);
// } catch (error) {
//   console.error(error);
// }

// // --------------------------------------------------
// // 4. Express Sync
// // --------------------------------------------------

// console.log("\n4. EXPRESS SYNC");

// try {
//   const middleware = expressValidatePayload({
//     rule: {
//       bodyq: rules,
//     },
//     options,
//   });

//   const req: any = {
//     body: payload,
//     headers: {},
//     params: {},
//     query: {},
//   };

//   const next = (error?: unknown) => {
//     if (error) {
//       console.error(error);
//       return;
//     }

//     console.log(req.validatedPayload);
//   };

//   middleware(req, res, next);
// } catch (error) {
//   console.error(error);
// }

// --------------------------------------------------
// 5. Express Async
// --------------------------------------------------

// console.log("\n5. EXPRESS ASYNC");

// try {
//   const middleware = expressValidatePayloadAsync({
//     rule: {
//       body: rules,
//     },
//     options,
//   });

//   const req: any = {
//     body: payload,
//     headers: {},
//     params: {},
//     query: {},
//   };

//   const next = (error?: unknown) => {
//     if (error) {
//       console.error(error);
//       return;
//     }

//     console.log(req.validatedPayload);
//   };

//   await middleware(req, res, next);
// } catch (error) {
//   console.error(error);
// }

// // --------------------------------------------------
// // 6. Fastify Sync
// // --------------------------------------------------

// console.log("\n6. FASTIFY SYNC");

// try {
//   const hook = fastifyValidatePayload({
//     rule: {
//       body: rules,
//     },
//     options,
//   });

//   const request: any = {
//     body: payload,
//     headers: {},
//     params: {},
//     query: {},
//   };

//   const reply: any = {
//     statusCode: 200,
//     body: undefined,

//     code(statusCode: number) {
//       this.statusCode = statusCode;
//       return this;
//     },

//     status(statusCode: number) {
//       this.statusCode = statusCode;
//       return this;
//     },

//     send(data: unknown) {
//       this.body = data;
//       console.log(data);
//       return this;
//     },
//   };

//   await hook(request, reply);

//   console.log(request.validatedPayload);
// } catch (error) {
//   console.error(error);
// }

// // --------------------------------------------------
// // 7. Fastify Async
// // --------------------------------------------------

// console.log("\n7. FASTIFY ASYNC");

// try {
//   const hook = fastifyValidatePayloadAsync({
//     rule: {
//       body: rules,
//     },
//     options,
//   });

//   const request: any = {
//     body: payload,
//     headers: {},
//     params: {},
//     query: {},
//   };

//   const reply: any = {
//     statusCode: 200,
//     body: undefined,

//     code(statusCode: number) {
//       this.statusCode = statusCode;
//       return this;
//     },

//     status(statusCode: number) {
//       this.statusCode = statusCode;
//       return this;
//     },

//     send(data: unknown) {
//       this.body = data;
//       console.log(data);
//       return this;
//     },
//   };

//   await hook(request, reply);

//   console.log(request.validatedPayload);
// } catch (error) {
//   console.error(error);
// }
