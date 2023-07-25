import * as ast from '../ast'
import * as nasm from './nasm'
import * as wat from './wat'
import * as llvm from './llvm'

export const backends = ['nasm', 'wat', 'llvm'] as const
export type Backend = typeof backends[number]

export const generateProgram = (
  program: ast.Program,
  backend: Backend
): string => {
  switch (backend) {
    case 'nasm':
      return nasm.generateProgram(program)
    case 'wat':
      return wat.generateProgram(program)
    case 'llvm':
      return llvm.generateProgram(program)
  }
}
