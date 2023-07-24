import * as ast from '../ast'
import { NotImplementedError } from './errors'

const sexp = (name: string, ...args: string[]): string => {
  return `(${[name, ...args].join(' ')})`
}

class State {
  memIndex: number = 0
  variables: Map<string, number> = new Map()

  pushVariable (name: string): void {
    this.variables.set(name, this.memIndex)
    this.memIndex += 4
  }

  getVariable (name: string): number {
    const index = this.variables.get(name)
    if (index === undefined) {
      throw new Error(`Variable ${name} not found`)
    }
    return index
  }

  generateBinary = (binary: ast.BinaryOp): string[] => {
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
          ...this.generateExpression(binary.left),
          ...this.generateExpression(binary.right),
          result
        ]
      }
    }

    switch (binary.operator) {
      case '&&': {
        return [
          ...this.generateExpression(binary.left),
          sexp(
            'if',
            sexp('result', 'i32'),
            sexp(
              'then',
              ...this.generateExpression(binary.right),
              sexp('i32.eqz'),
              sexp('i32.eqz')
            ),
            sexp('else', sexp('i32.const', '0'))
          )
        ]
      }
      case '||': {
        return [
          ...this.generateExpression(binary.left),
          sexp(
            'if',
            sexp('result', 'i32'),
            sexp('i32.eqz'),
            sexp(
              'then',
              ...this.generateExpression(binary.right),
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

  generateUnaryOp = (operator: string): string[] => {
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

  generateExpression = (expression: ast.Expression): string[] => {
    switch (expression.type) {
      case 'constant': {
        const c = expression as ast.Constant
        return [sexp('i32.const', c.value)]
      }
      case 'unaryOp': {
        const u = expression as ast.UnaryOp
        return [
          ...this.generateExpression(u.operand),
          ...this.generateUnaryOp(u.operator)
        ]
      }
      case 'binaryOp': {
        const b = expression as ast.BinaryOp
        return this.generateBinary(b)
      }
      case 'assignExpression': {
        const a = expression as ast.AssignExpression
        return [
          sexp('i32.const', this.getVariable(a.name).toString()),
          ...this.generateExpression(a.expression),
          sexp('local.tee', '$dupme'),
          sexp('i32.store'),
          sexp('local.get', '$dupme')
        ]
      }
      case 'varExpression': {
        const v = expression as ast.VarExpression
        return [
          sexp('i32.const', this.getVariable(v.name).toString()),
          sexp('i32.load')
        ]
      }
      default: {
        throw new NotImplementedError(`${expression.type} expression`)
      }
    }
  }

  generateStatement = (statement: ast.Statement): string[] => {
    switch (statement.type) {
      case 'returnStatement': {
        return this.generateExpression(
          (statement as ast.ReturnStatement).expression
        )
      }
      case 'declareStatement': {
        const ds = statement as ast.DeclareStatement
        const expression = this.generateExpression(
          ds.expression ?? new ast.Constant('0')
        )
        this.pushVariable(ds.name)
        return [
          sexp('i32.const', this.getVariable(ds.name).toString()),
          ...expression,
          sexp('i32.store')
        ]
      }
      case 'expressionStatement': {
        const es = statement as ast.ExpressionStatement
        return [...this.generateExpression(es.expression), sexp('drop')]
      }
      default: {
        throw new NotImplementedError(`statement type ${statement.type}`)
      }
    }
  }

  generateFunction = (functionDeclaration: ast.FunctionDeclaration): string => {
    return sexp(
      'func',
      `$${functionDeclaration.name}`,
      sexp('export', `"${functionDeclaration.name}"`),
      sexp('result', 'i32'),
      sexp('local', '$dupme', 'i32'),
      ...functionDeclaration.body.flatMap(this.generateStatement)
    )
  }
}

export const generateProgram = (program: ast.Program): string => {
  return sexp(
    'module',
    sexp('memory', '1', '100'),
    new State().generateFunction(program.functionDeclaration),
    sexp(
      'func',
      sexp('export', '"_start"'),
      sexp('result', 'i32'),
      sexp('call', '$main')
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
