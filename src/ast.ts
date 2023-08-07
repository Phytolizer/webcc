export interface Node {
  type: string
}

export class Program implements Node {
  type = 'program'
  constructor (public functionDeclaration: FunctionDeclaration) {}
}

export class FunctionDeclaration implements Node {
  type = 'functionDeclaration'
  constructor (
    public name: string,
    public body: Statement[]
  ) {}
}

export interface Statement extends Node {}

export class ReturnStatement implements Statement {
  type = 'returnStatement'
  constructor (public expression: Expression) {}
}

export class DeclareStatement implements Statement {
  type = 'declareStatement'
  constructor (
    public name: string,
    public expression?: Expression
  ) {}
}

export class ExpressionStatement implements Statement {
  type = 'expressionStatement'
  constructor (public expression: Expression) {}
}

export interface Expression extends Node {}

export class PostfixOp implements Expression {
  type = 'postfixOp'
  constructor (
    public left: Expression,
    public operator: string
  ) {}
}

export class BinaryOp implements Expression {
  type = 'binaryOp'
  constructor (
    public left: Expression,
    public operator: string,
    public right: Expression
  ) {}
}

export class UnaryOp implements Expression {
  type = 'unaryOp'
  constructor (
    public operator: string,
    public operand: Expression
  ) {}
}

export class Constant implements Expression {
  type = 'constant'
  constructor (public value: string) {}
}

export class VarExpression implements Expression {
  type = 'varExpression'
  constructor (public name: string) {}
}

export class AssignExpression implements Expression {
  type = 'assignExpression'
  constructor (
    public name: string,
    public expression: Expression
  ) {}
}
