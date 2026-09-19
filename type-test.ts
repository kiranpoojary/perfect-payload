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
