import { type Backend } from '../backend'
import { type Token } from '../lexer'
import type * as ast from '../ast'

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

export function isSourceCompileRequest (
  object: any
): object is SourceCompileRequest {
  return 'source' in object
}

export interface TokensCompileRequest extends CompileRequest {
  tokens: Token[]
}

export function isTokensCompileRequest (
  object: any
): object is TokensCompileRequest {
  return 'tokens' in object
}

export interface AstCompileRequest extends CompileRequest {
  ast: ast.Program
}

export function isAstCompileRequest (object: any): object is AstCompileRequest {
  return 'ast' in object
}

export type ConcreteRequestBody =
  | LexRequest
  | ParseRequest
  | SourceCompileRequest
  | TokensCompileRequest
  | AstCompileRequest
