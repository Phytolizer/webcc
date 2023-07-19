import * as ast from '../ast'
import { BackendNotImplementedError } from './errors'

export const generateProgram = (program: ast.Program): string => {
  throw new BackendNotImplementedError('llvm')
}
