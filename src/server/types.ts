import { Backend } from '../backend'
import { Token } from '../lexer'
import * as ast from '../ast'

export interface RequestBody {
  type: string
}

export interface LexRequest extends RequestBody {
  type: 'lex'
  source: string
}

export interface ParseRequest extends RequestBody {
  type: 'parse'
  source: string
}

export interface CompileRequest extends RequestBody {
  type: 'compile'
  backend: Backend
}

export interface SourceCompileRequest extends CompileRequest {
  source: string
}

export const isSourceCompileRequest = (
  object: any
): object is SourceCompileRequest => 'source' in object

export interface TokensCompileRequest extends CompileRequest {
  tokens: Token[]
}

export const isTokensCompileRequest = (
  object: any
): object is TokensCompileRequest => 'tokens' in object

export interface AstCompileRequest extends CompileRequest {
  ast: ast.Program
}

export const isAstCompileRequest = (object: any): object is AstCompileRequest =>
  'ast' in object

export type ConcreteRequestBody =
  | LexRequest
  | ParseRequest
  | SourceCompileRequest
  | TokensCompileRequest
  | AstCompileRequest
