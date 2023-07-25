import type * as ast from '../ast'
import { BackendNotImplementedError } from './errors'

export function generateProgram (program: ast.Program): string {
  throw new BackendNotImplementedError('llvm')
}
