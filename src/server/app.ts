import Fastify from 'fastify'
import { generateProgram } from '../backend'
import { BackendNotImplementedError } from '../backend/errors'
import { lex } from '../lexer'
import { parse } from '../parser'
import schema from './schema.json'
import {
  CompileRequest,
  LexRequest,
  ParseRequest,
  RequestBody,
  isAstCompileRequest,
  isSourceCompileRequest,
  isTokensCompileRequest
} from './types'

// eslint-disable-next-line @typescript-eslint/explicit-function-return-type
export const getApp = (opts: any) => {
  const server = Fastify(opts)

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
          } else {
            throw err
          }
        }
        break
      }
    }
  })

  return server
}
