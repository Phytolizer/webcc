import { stripNewlines } from '../stringutil'
import * as ast from '../ast'

class State {
  stackIndex: number = -4
  variables: Map<string, number> = new Map()

  pushVariable (name: string) {
    this.variables.set(name, this.stackIndex)
    this.stackIndex -= 4
  }

  getVariable (name: string): number {
    const index = this.variables.get(name)
    if (index === undefined) {
      throw new Error(`Variable ${name} not found`)
    }
    return index
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
`)
    }
    switch (operator) {
      case '+':
      case '-':
      case '*':
      case '/': {
        return stripNewlines(`
${this.generateExpression(left)}
    push rax
${this.generateExpression(right)}
    pop rcx
    ${arithmeticOps[operator]('rcx', 'rax')}
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

export const generateProgram = (program: ast.Program): string => {
  return new State().generateFunction(program.functionDeclaration) + '\n'
}
