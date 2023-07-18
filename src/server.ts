import { generateProgram } from "./backend";
import { Token, lex } from "./lexer";
import { parse } from "./parser";
import Fastify from "fastify";
import * as ast from "./ast";

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

interface RequestBody {
  type: string;
}

interface LexRequest extends RequestBody {
  type: "lex";
  source: string;
}

interface ParseRequest extends RequestBody {
  type: "parse";
  source: string;
}

interface CompileRequest extends RequestBody {
  type: "compile";
  source?: string;
  tokens?: Array<Token>;
  ast?: ast.Program;
}

fastify.post("/", { schema: { body: schema } }, async (request, reply) => {
  const body = request.body as RequestBody;
  const { type } = body;
  switch (type) {
    case "lex": {
      const { source } = body as LexRequest;
      reply.send(lex(source));
      break;
    }
    case "parse": {
      const { source } = body as ParseRequest;
      reply.send(parse(lex(source)));
      break;
    }
    case "compile": {
      const { source, tokens, ast } = body as CompileRequest;
      if (source) {
        reply.send({ asm: generateProgram(parse(lex(source))) });
      } else if (tokens) {
        reply.send({ asm: generateProgram(parse(tokens)) });
      } else if (ast) {
        reply.send({ asm: generateProgram(ast) });
      }
      break;
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
