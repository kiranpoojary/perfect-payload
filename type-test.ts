import { perfectPayload, perfectPayloadAsync } from "perfect-payload";

import express from "express";
import Fastify from "fastify";

import {
  validatePayload as expressValidatePayload,
  validatePayloadAsync as expressValidatePayloadAsync,
} from "perfect-payload/express";

import {
  validatePayload as fastifyValidatePayload,
  validatePayloadAsync as fastifyValidatePayloadAsync,
} from "perfect-payload/fastify";

interface UserPayload {
  name: string;
  age: number;
}

// Core generic typing
const coreResult = perfectPayload<UserPayload>(
  {
    name: "Kiran",
    age: 29,
  },
  {
    name: {
      mandatory: true,
      type: "string",
    },
    age: {
      mandatory: true,
      type: "number",
      min: 18,
    },
  },
);

if (coreResult.valid === true) {
  const name: string = coreResult.validatedPayload.name;
  const age: number = coreResult.validatedPayload.age;

  void name;
  void age;
}

// Structured error typing
const structuredResult = perfectPayload(
  {
    age: "invalid",
  },
  {
    age: {
      type: "number",
    },
  },
);

if (structuredResult.valid === false) {
  const code: string = structuredResult.errors[0].code;
  const path: string = structuredResult.errors[0].path;
  const message: string = structuredResult.errors[0].message;

  void code;
  void path;
  void message;
}

// Pretty error typing
const prettyResult = perfectPayload(
  {
    age: "invalid",
  },
  {
    age: {
      type: "number",
    },
  },
  {
    prettyErrors: true,
  },
);

if (prettyResult.valid === false) {
  const error: string = prettyResult.errors[0];

  void error;
}

// Async generic typing
const asyncResult = await perfectPayloadAsync<UserPayload>(
  {
    name: "Kiran",
    age: 29,
  },
  {
    name: {
      mandatory: true,
      type: "string",
    },
    age: {
      mandatory: true,
      type: "number",
    },
  },
);

if (asyncResult.valid === true) {
  const name: string = asyncResult.validatedPayload.name;
  const age: number = asyncResult.validatedPayload.age;

  void name;
  void age;
}

// Framework adapter rule
const rule = {
  body: {
    name: {
      mandatory: true,
      type: "string" as const,
    },
  },
};

// Express
const app = express();

app.post("/sync", expressValidatePayload({ rule }), (_req, res) => {
  res.send("ok");
});

app.post("/async", expressValidatePayloadAsync({ rule }), (_req, res) => {
  res.send("ok");
});

// Fastify
const fastify = Fastify();

fastify.post(
  "/sync",
  {
    preHandler: fastifyValidatePayload({ rule }),
  },
  async () => {
    return { ok: true };
  },
);

fastify.post(
  "/async",
  {
    preHandler: fastifyValidatePayloadAsync({ rule }),
  },
  async () => {
    return { ok: true };
  },
);
