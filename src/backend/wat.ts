import * as ast from '../ast'
import { stripNewlines } from '../stringutil'
import { NotImplementedError } from './errors'

const sexp = (name: string, ...args: string[]): string => {
  return `(${[name, ...args].join(' ')})`
}

const generateBinary = (binary: ast.BinaryOp): string => {
  const arithmeticOps = {
    '+': 'i32.add',
    '-': 'i32.sub',
    '*': 'i32.mul',
    '/': 'i32.div_s'
  }

  switch (binary.operator) {
    case '+':
    case '-':
    case '*':
    case '/': {
      return stripNewlines(`
${generateExpression(binary.left)}
${generateExpression(binary.right)}
    ${arithmeticOps[binary.operator]}
`)
    }
    default: {
      throw new NotImplementedError(`binary operator ${binary.operator}`)
    }
  }
}

const generateUnaryOp = (operator: string): string => {
  switch (operator) {
    case '!': {
      return stripNewlines(`
    i32.eqz
`)
    }
    case '~': {
      return stripNewlines(`
    i32.not
`)
    }
    case '-': {
      return stripNewlines(`
    i32.neg
`)
    }
    default: {
      throw new NotImplementedError(`unary operator ${operator}`)
    }
  }
}

const generateExpression = (expression: ast.Expression): string => {
  switch (expression.type) {
    case 'constant': {
      const c = expression as ast.Constant
      return stripNewlines(`
    i32.const ${c.value}
`)
    }
    case 'unaryOp': {
      const u = expression as ast.UnaryOp
      return stripNewlines(`
${generateExpression(u.operand)}
${generateUnaryOp(u.operator)}
`)
    }
    case 'binaryOp': {
      const b = expression as ast.BinaryOp
      return generateBinary(b)
    }
    default: {
      throw new NotImplementedError(`${expression.type} expression`)
    }
  }
}

const generateStatement = (statement: ast.Statement): string => {
  switch (statement.type) {
    case 'returnStatement': {
      return generateExpression((statement as ast.ReturnStatement).expression)
    }
    default: {
      throw new NotImplementedError('non-return statement')
    }
  }
}

const generateFunction = (
  functionDeclaration: ast.FunctionDeclaration
): string => {
  return sexp(
    'func',
    `$${functionDeclaration.name}`,
    sexp('export', `"${functionDeclaration.name}"`),
    sexp('result', 'i32'),
    generateStatement(functionDeclaration.body)
  )
}

export const generateProgram = (program: ast.Program): string => {
  return sexp(
    'module',
    generateFunction(program.functionDeclaration),
    sexp(
      'func',
      sexp('export', '"_start"'),
      sexp('result', 'i32'),
      sexp('call', '$main')
    )
  )
}
