import {
  validateFrameworkConfig,
  validateFrameworkSources,
  validateFrameworkSourcesAsync,
} from "./framework.js";
import type { FrameworkConfig } from "./types/framework.js";

interface FastifyRequestLike {
  headers: unknown;
  params: unknown;
  query: unknown;
  body: unknown;
  validatedPayload?: unknown;
}

interface FastifyReplyLike {
  code(statusCode: number): FastifyReplyLike;
  send(payload: unknown): unknown;
}

function toPayload(value: unknown): Record<string, unknown> {
  if (value !== null && typeof value === "object" && !Array.isArray(value)) {
    return value as Record<string, unknown>;
  }

  return {};
}

export function validatePayload(config: FrameworkConfig = {}) {
  const { rule, options = {} } = config;

  // Validate developer configuration when the hook is created,
  // not on every incoming request.
  validateFrameworkConfig({
    rule,
    options,
  });

  return async function perfectPayloadFastifyHook(
    request: FastifyRequestLike,
    reply: FastifyReplyLike,
  ) {
    const result = validateFrameworkSources({
      data: {
        headers: request.headers as Record<string, unknown>,
        params: request.params as Record<string, unknown>,
        query: request.query as Record<string, unknown>,
        body: request.body as Record<string, unknown>,
      },
      rule,
      options,
    });

    if (result.valid === true) {
      request.validatedPayload = result.validatedPayload;
      return;
    }

    return reply.code(result.statusCode ?? 400).send(result);
  };
}

export function validatePayloadAsync(config: FrameworkConfig = {}) {
  const { rule, options = {} } = config;

  // Validate developer configuration when the hook is created,
  // not on every incoming request.
  validateFrameworkConfig({
    rule,
    options,
  });

  return async function perfectPayloadFastifyAsyncHook(
    request: FastifyRequestLike,
    reply: FastifyReplyLike,
  ) {
    const result = await validateFrameworkSourcesAsync({
      data: {
        headers: request.headers as Record<string, unknown>,
        params: request.params as Record<string, unknown>,
        query: request.query as Record<string, unknown>,
        body: request.body as Record<string, unknown>,
      },
      rule,
      options,
    });

    if (result.valid === true) {
      request.validatedPayload = result.validatedPayload;
      return;
    }

    return reply.code(result.statusCode ?? 400).send(result);
  };
}
