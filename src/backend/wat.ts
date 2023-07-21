import * as ast from '../ast'
import { NotImplementedError } from './errors'

const sexp = (name: string, ...args: string[]): string => {
  return `(${[name, ...args].join(' ')})`
}

const generateBinary = (binary: ast.BinaryOp): string[] => {
  const simpleOps = {
    '+': sexp('i32.add'),
    '-': sexp('i32.sub'),
    '*': sexp('i32.mul'),
    '/': sexp('i32.div_s'),
    '%': sexp('i32.rem_s'),
    '==': sexp('i32.eq'),
    '!=': sexp('i32.ne'),
    '<': sexp('i32.lt_s'),
    '>': sexp('i32.gt_s'),
    '<=': sexp('i32.le_s'),
    '>=': sexp('i32.ge_s'),
    '&': sexp('i32.and'),
    '|': sexp('i32.or'),
    '^': sexp('i32.xor'),
    '<<': sexp('i32.shl'),
    '>>': sexp('i32.shr_s')
  }

  for (const [op, result] of Object.entries(simpleOps)) {
    if (binary.operator === op) {
      return [
        ...generateExpression(binary.left),
        ...generateExpression(binary.right),
        result
      ]
    }
  }

  switch (binary.operator) {
    case '&&': {
      return [
        ...generateExpression(binary.left),
        sexp(
          'if',
          sexp('result', 'i32'),
          sexp(
            'then',
            ...generateExpression(binary.right),
            sexp('i32.eqz'),
            sexp('i32.eqz')
          ),
          sexp('else', sexp('i32.const', '0'))
        )
      ]
    }
    case '||': {
      return [
        ...generateExpression(binary.left),
        sexp(
          'if',
          sexp('result', 'i32'),
          sexp('i32.eqz'),
          sexp(
            'then',
            ...generateExpression(binary.right),
            sexp('i32.eqz'),
            sexp('i32.eqz')
          ),
          sexp('else', sexp('i32.const', '1'))
        )
      ]
    }
  }

  throw new NotImplementedError(`binary operator ${binary.operator}`)
}

const generateUnaryOp = (operator: string): string[] => {
  switch (operator) {
    case '!': {
      return [sexp('i32.eqz')]
    }
    case '~': {
      return [sexp('i32.const', '-1'), sexp('i32.xor')]
    }
    case '-': {
      return [sexp('i32.const', '0'), sexp('call $swap'), sexp('i32.sub')]
    }
    default: {
      throw new NotImplementedError(`unary operator ${operator}`)
    }
  }
}

const generateExpression = (expression: ast.Expression): string[] => {
  switch (expression.type) {
    case 'constant': {
      const c = expression as ast.Constant
      return [sexp('i32.const', c.value)]
    }
    case 'unaryOp': {
      const u = expression as ast.UnaryOp
      return [...generateExpression(u.operand), ...generateUnaryOp(u.operator)]
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

const generateStatement = (statement: ast.Statement): string[] => {
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
    ...generateStatement(functionDeclaration.body)
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
      'call $main'
    ),
    sexp(
      'func',
      '$swap',
      sexp('param', '$a', 'i32'),
      sexp('param', '$b', 'i32'),
      sexp('result', 'i32', 'i32'),
      'local.get $b',
      'local.get $a'
    )
  )
}
