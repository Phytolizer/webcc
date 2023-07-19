import { generateProgram } from '../backend'
import { lex } from '../lexer'
import { parse } from '../parser'
import Fastify from 'fastify'
import schema from './schema.json'
import { BackendNotImplementedError } from '../backend/errors'
import {
  RequestBody,
  LexRequest,
  ParseRequest,
  CompileRequest,
  isSourceCompileRequest,
  isTokensCompileRequest,
  isAstCompileRequest
} from './types'

const server = Fastify({
  logger: {
    transport: {
      target: 'pino-pretty'
    }
  }
})

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
      const { backend } = body as CompileRequest
      try {
        if (isSourceCompileRequest(body)) {
          await reply.send({
            asm: generateProgram(parse(lex(body.source)), backend)
          })
        } else if (isTokensCompileRequest(body)) {
          await reply.send({
            asm: generateProgram(parse(body.tokens), backend)
          })
        } else if (isAstCompileRequest(body)) {
          await reply.send({ asm: generateProgram(body.ast, backend) })
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
