import { Backend, generateProgram } from './backend'
import { Token, lex } from './lexer'
import { parse } from './parser'
import Fastify from 'fastify'
import * as ast from './ast'
import { backends } from './backend'
import { BackendNotImplementedError } from './backend/errors'

const server = Fastify({
  logger: {
    transport: {
      target: 'pino-pretty'
    }
  }
})

const schema = {
  body: {
    type: 'object',
    properties: {
      type: { enum: ['lex', 'parse', 'compile'] }
    },
    required: ['type'],
    oneOf: [
      {
        properties: {
          type: { enum: ['lex', 'parse'] },
          source: { type: 'string' }
        },
        required: ['source']
      },
      {
        properties: {
          type: { const: 'compile' },
          source: { type: 'string' },
          backend: { enum: backends }
        },
        required: ['source', 'backend']
      },
      {
        properties: {
          type: { const: 'compile' },
          tokens: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                type: { type: 'string' },
                value: { type: 'string' }
              },
              required: ['type', 'value']
            }
          },
          backend: { enum: backends }
        },
        required: ['tokens', 'backend']
      },
      {
        properties: {
          type: { const: 'compile' },
          ast: {
            type: 'object',
            properties: {
              type: { type: 'string' }
            },
            required: ['type']
          },
          backend: { enum: backends }
        },
        required: ['ast', 'backend']
      }
    ]
  }
}

interface RequestBody {
  type: string
}

interface LexRequest extends RequestBody {
  type: 'lex'
  source: string
}

interface ParseRequest extends RequestBody {
  type: 'parse'
  source: string
}

interface CompileRequest extends RequestBody {
  type: 'compile'
  source?: string
  tokens?: Token[]
  ast?: ast.Program
  backend: Backend
}

server.post('/', { schema: { body: schema } }, async (request, reply) => {
  const body = request.body as RequestBody
  const { type } = body
  switch (type) {
    case 'lex': {
      const { source } = body as LexRequest
      await reply.send(lex(source))
      break
    }
    case 'parse': {
      const { source } = body as ParseRequest
      await reply.send(parse(lex(source)))
      break
    }
    case 'compile': {
      const { source, tokens, ast, backend } = body as CompileRequest
      try {
        if (source !== undefined) {
          await reply.send({
            asm: generateProgram(parse(lex(source)), backend)
          })
        } else if (tokens !== undefined) {
          await reply.send({ asm: generateProgram(parse(tokens), backend) })
        } else if (ast !== undefined) {
          await reply.send({ asm: generateProgram(ast, backend) })
        }
      } catch (err) {
        if (err instanceof BackendNotImplementedError) {
          await reply.code(501).send({ error: err.message })
        }
      }
      break
    }
  }
})

server.listen({ port: 8080 }, function (err, address) {
  if (err !== null) {
    server.log.error(err)
    process.exit(1)
  }
  server.log.info(`server listening on ${address}`)
})
