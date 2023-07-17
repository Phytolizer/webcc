import { generateProgram } from "./backend.mjs";
import { lex } from "./lexer.mjs";
import { parse } from "./parser.mjs";
import Fastify from "fastify";

const fastify = Fastify({ logger: true });

const schema = {
  body: {
    type: "object",
    properties: {
      type: { enum: ["lex", "parse", "compile"] },
    },
    required: ["type"],
    anyOf: [
      {
        properties: {
          type: { enum: ["lex", "parse"] },
          source: { type: "string" },
        },
        required: ["source"],
      },
    ],
    oneOf: [
      {
        properties: {
          type: { const: "compile" },
          source: { type: "string" },
        },
        required: ["source"],
      },
      {
        properties: {
          type: { const: "compile" },
          tokens: {
            type: "array",
            items: {
              type: "object",
              properties: {
                type: { type: "string" },
                value: { type: "string" },
              },
              required: ["type", "value"],
            },
          },
        },
        required: ["tokens"],
      },
      {
        properties: {
          type: { const: "compile" },
          ast: {
            type: "object",
            properties: {
              type: { type: "string" },
            },
            required: ["type"],
          },
        },
        required: ["ast"],
      },
    ],
  },
};

fastify.post("/", { schema: { body: schema } }, async (request, reply) => {
  const { type } = request.body;
  if (type === "lex") {
    const { source } = request.body;
    reply.send(lex(source));
  } else if (type === "parse") {
    const { source } = request.body;
    reply.send(parse(source));
  } else if (type === "compile") {
    const { source, tokens, ast } = request.body;
    if (source) {
      reply.send({ asm: generateProgram(parse(lex(source))) });
    } else if (tokens) {
      reply.send({ asm: generateProgram(parse(tokens)) });
    } else if (ast) {
      reply.send({ asm: generateProgram(ast) });
    }
  }
});

fastify.listen({ port: 8080 }, function (err, address) {
  if (err) {
    fastify.log.error(err);
    process.exit(1);
  }
  fastify.log.info(`server listening on ${address}`);
});
