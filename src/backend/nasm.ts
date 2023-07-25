import { stripNewlines } from '../stringutil'
import * as ast from '../ast'

class State {
  stackIndex: number = -8
  labelCount: number = 1
  variables = new Map<string, number>()

  pushVariable (name: string): void {
    this.variables.set(name, this.stackIndex)
    this.stackIndex -= 8
  }

  getVariable (name: string): number {
    const index = this.variables.get(name)
    if (index === undefined) {
      throw new Error(`Variable ${name} not found`)
    }
    return index
  }

  label (prefix: string): string {
    return `.${prefix}${this.labelCount++}`
  }

  generateProlog (): string {
    return stripNewlines(`
    push rbp
    mov rbp, rsp
`)
  }

  generateEpilog (): string {
    return stripNewlines(`
    mov rsp, rbp
    pop rbp
    ret
`)
  }

  generateUnary (operator: string, operand: ast.Expression): string {
    switch (operator) {
      case '!': {
        return stripNewlines(`
${this.generateExpression(operand)}
    cmp rax, 0
    mov rax, 0
    sete al
`)
      }
      case '~': {
        return stripNewlines(`
${this.generateExpression(operand)}
    not rax
`)
      }
      case '-': {
        return stripNewlines(`
${this.generateExpression(operand)}
    neg rax
`)
      }
      default: {
        throw new Error(`Unexpected unary operator ${operator}`)
      }
    }
  }

  generateBinary (
    left: ast.Expression,
    operator: string,
    right: ast.Expression
  ): string {
    function cmp (operator: string): (e1: string, e2: string) => string {
      return (e1: string, e2: string) =>
        stripNewlines(`
    cmp ${e1}, ${e2}
    mov rax, 0
    set${operator} al
`)
    }
    const arithmeticOps = {
      '+': (e1: string, e2: string) => `add ${e1}, ${e2}`,
      '-': (e1: string, e2: string) => `sub ${e1}, ${e2}`,
      '*': (e1: string, e2: string) => `imul ${e1}, ${e2}`,
      '/': (e1: string, e2: string) =>
        stripNewlines(`
    mov rdx, 0
    mov rax, ${e1}
    cqo
    idiv ${e2}
`),
      '%': (e1: string, e2: string) =>
        stripNewlines(`
    mov rdx, 0
    mov rax, ${e1}
    cqo
    idiv ${e2}
    mov rax, rdx
`),
      '==': cmp('e'),
      '!=': cmp('ne'),
      '<': cmp('l'),
      '>': cmp('g'),
      '<=': cmp('le'),
      '>=': cmp('ge'),
      '&': (e1: string, e2: string) => `and ${e1}, ${e2}`,
      '|': (e1: string, e2: string) => `or ${e1}, ${e2}`,
      '^': (e1: string, e2: string) => `xor ${e1}, ${e2}`,
      '<<': (e1: string, e2: string) =>
        stripNewlines(`
    mov rcx, ${e2}
    shl ${e1}, cl
`),
      '>>': (e1: string, e2: string) =>
        stripNewlines(`
    mov rcx, ${e2}
    sar ${e1}, cl
`)
    }
    for (const [op, f] of Object.entries(arithmeticOps)) {
      if (operator === op) {
        return stripNewlines(`
${this.generateExpression(left)}
    push rax
${this.generateExpression(right)}
    pop rcx
${f('rcx', 'rax')}
`)
      }
    }

    switch (operator) {
      case '&&': {
        const labelTrue = this.label('true')
        const labelEnd = this.label('end')
        return stripNewlines(`
${this.generateExpression(left)}
    cmp rax, 0
    jne ${labelTrue}
    jmp ${labelEnd}
${labelTrue}:
${this.generateExpression(right)}
    cmp rax, 0
    mov rax, 0
    setne al
${labelEnd}:
`)
      }
      case '||': {
        const labelFalse = this.label('false')
        const labelEnd = this.label('end')
        return stripNewlines(`
${this.generateExpression(left)}
    cmp rax, 0
    je ${labelFalse}
    jmp ${labelEnd}
${labelFalse}:
${this.generateExpression(right)}
    cmp rax, 0
    mov rax, 0
    setne al
${labelEnd}:
`)
      }
      default: {
        throw new Error(`Unexpected binary operator ${operator}`)
      }
    }
  }

  generateExpression (expression: ast.Expression): string {
    switch (expression.type) {
      case 'constant': {
        const c = expression as ast.Constant
        return stripNewlines(`
    mov rax, ${c.value}
`)
      }
      case 'unaryOp': {
        const u = expression as ast.UnaryOp
        return this.generateUnary(u.operator, u.operand)
      }
      case 'binaryOp': {
        const b = expression as ast.BinaryOp
        return this.generateBinary(b.left, b.operator, b.right)
      }
      case 'assignExpression': {
        const a = expression as ast.AssignExpression
        return stripNewlines(`
${this.generateExpression(a.expression)}
    mov [rbp${this.getVariable(a.name)}], rax
`)
      }
      case 'varExpression': {
        const v = expression as ast.VarExpression
        return stripNewlines(`
    mov rax, [rbp${this.getVariable(v.name)}]
`)
      }
      default: {
        throw new Error(`Unexpected expression type ${expression.type}`)
      }
    }
  }

  generateStatement (statement: ast.Statement): string {
    switch (statement.type) {
      case 'returnStatement': {
        const rs = statement as ast.ReturnStatement
        return stripNewlines(`
${this.generateExpression(rs.expression)}
${this.generateEpilog()}
`)
      }
      case 'declareStatement': {
        const ds = statement as ast.DeclareStatement
        if (this.variables.has(ds.name)) {
          throw new Error(`Variable ${ds.name} already declared`)
        }
        const expression = this.generateExpression(
          ds.expression ?? new ast.Constant('0')
        )
        this.pushVariable(ds.name)
        return stripNewlines(`
${expression}
    push rax
`)
      }
      case 'expressionStatement': {
        const es = statement as ast.ExpressionStatement
        return this.generateExpression(es.expression)
      }
      default: {
        throw new Error(`Unexpected statement type ${statement.type}`)
      }
    }
  }

  generateFunction (functionDeclaration: ast.FunctionDeclaration): string {
    return stripNewlines(`
    global ${functionDeclaration.name}
${functionDeclaration.name}:
${this.generateProlog()}
${functionDeclaration.body.map(this.generateStatement.bind(this)).join('\n')}
`)
  }
}

export function generateProgram (program: ast.Program): string {
  return new State().generateFunction(program.functionDeclaration) + '\n'
}
