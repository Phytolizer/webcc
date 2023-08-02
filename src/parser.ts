import * as ast from './ast'
import { type Token } from './lexer'

export class ParseError extends Error {
  constructor (message: string) {
    super(message)
    Object.setPrototypeOf(this, ParseError.prototype)
  }
}

function peek (tokens: Token[], distance = 0): Token {
  return tokens[distance]
}

function checkToken (tokens: Token[], type: string, distance = 0): boolean {
  const token = peek(tokens, distance)
  return token?.type === type
}

function matchToken (tokens: Token[], type: string): Token {
  const token = peek(tokens)
  if (token?.type !== type) {
    const actualType = token?.type ?? 'undefined'
    throw new ParseError(`Expected token type ${type}, but got ${actualType}`)
  }
  tokens.shift()
  return token
}

type Associativity = 'left' | 'right'

interface Operator {
  type: string
  precedence: number
  associativity: Associativity
}

function simpleOp (type: string, precedence: number): Operator {
  return {
    type,
    precedence,
    associativity: 'left'
  }
}

const assignmentOperators = [
  '=',
  '+=',
  '-=',
  '*=',
  '/=',
  '%=',
  '<<=',
  '>>=',
  '&=',
  '^=',
  '|='
]

const ops = [
  simpleOp('*', 12),
  simpleOp('/', 12),
  simpleOp('%', 12),
  simpleOp('+', 11),
  simpleOp('-', 11),
  simpleOp('<<', 10),
  simpleOp('>>', 10),
  simpleOp('==', 9),
  simpleOp('!=', 9),
  simpleOp('<', 8),
  simpleOp('>', 8),
  simpleOp('<=', 8),
  simpleOp('>=', 8),
  simpleOp('&', 7),
  simpleOp('^', 6),
  simpleOp('|', 5),
  simpleOp('&&', 4),
  simpleOp('||', 3),
  ...assignmentOperators.map(op => {
    return {
      type: op,
      precedence: 2,
      associativity: 'right'
    }
  }),
  simpleOp(',', 1)
]

const unaryOps = [
  {
    type: '-',
    precedence: 13
  },
  {
    type: '!',
    precedence: 13
  },
  {
    type: '~',
    precedence: 13
  }
]

function parsePrimary (tokens: Token[]): ast.Expression {
  switch (peek(tokens).type) {
    case '(': {
      tokens.shift()
      const expression = parseExpression(tokens)
      matchToken(tokens, ')')
      return expression
    }
    case 'ident': {
      const name = matchToken(tokens, 'ident').value
      return new ast.VarExpression(name)
    }
    default: {
      const constant = matchToken(tokens, 'constant').value
      return new ast.Constant(constant)
    }
  }
}

function parseBinaryExpression (
  tokens: Token[],
  parentPrecedence = 0
): ast.Expression {
  const unop = unaryOps.find(op => op.type === peek(tokens).type)
  let left
  if (unop !== undefined && unop.precedence >= parentPrecedence) {
    const operator = tokens.shift() ?? { type: 'undefined', value: '' }
    const operand = parseBinaryExpression(tokens, unop.precedence)
    left = new ast.UnaryOp(operator.type, operand)
  } else {
    left = parsePrimary(tokens)
  }

  while (true) {
    const op = ops.find(op => op.type === peek(tokens).type)
    if (op === undefined || op.precedence <= parentPrecedence) {
      break
    }

    tokens.shift()

    const recursivePrecedence =
      op.associativity === 'left' ? op.precedence : op.precedence - 1

    let right = parseBinaryExpression(tokens, recursivePrecedence)
    if (assignmentOperators.includes(op.type)) {
      if (left.type !== 'varExpression') {
        throw new ParseError(
          'Expected left side of assignment to be a variable'
        )
      }
      const name: string = (left as ast.VarExpression).name
      if (op.type !== '=') {
        right = new ast.BinaryOp(
          new ast.VarExpression(name),
          op.type.slice(0, -1),
          right
        )
      }
      left = new ast.AssignExpression(name, right)
    } else {
      left = new ast.BinaryOp(left, op.type, right)
    }
  }

  return left
}

function parseAssignmentExpression (tokens: Token[]): ast.Expression {
  if (
    checkToken(tokens, 'ident', 0) &&
    assignmentOperators.includes(peek(tokens, 1)?.type)
  ) {
    const name = matchToken(tokens, 'ident').value
    const assignOp = tokens.shift()?.type
    if (assignOp === undefined) {
      throw new Error('unreachable')
    }
    let expression = parseExpression(tokens)
    if (assignOp !== '=') {
      expression = new ast.BinaryOp(
        new ast.VarExpression(name),
        assignOp.slice(0, -1),
        expression
      )
    }
    return new ast.AssignExpression(name, expression)
  }
  return parseBinaryExpression(tokens)
}

function parseExpression (tokens: Token[]): ast.Expression {
  return parseAssignmentExpression(tokens)
}

function parseStatement (tokens: Token[]): ast.Statement {
  switch (peek(tokens).type) {
    case 'return': {
      matchToken(tokens, 'return')
      const expression = parseExpression(tokens)
      matchToken(tokens, ';')
      return new ast.ReturnStatement(expression)
    }
    case 'int': {
      matchToken(tokens, 'int')
      const name = matchToken(tokens, 'ident').value
      let expression
      if (checkToken(tokens, '=')) {
        matchToken(tokens, '=')
        expression = parseExpression(tokens)
      }
      matchToken(tokens, ';')
      return new ast.DeclareStatement(name, expression)
    }
    default: {
      const expression = parseExpression(tokens)
      matchToken(tokens, ';')
      return new ast.ExpressionStatement(expression)
    }
  }
}

function parseFunction (tokens: Token[]): ast.FunctionDeclaration {
  matchToken(tokens, 'int')
  const name = matchToken(tokens, 'ident').value
  matchToken(tokens, '(')
  matchToken(tokens, ')')
  matchToken(tokens, '{')
  const body = []
  while (!checkToken(tokens, 'eof') && !checkToken(tokens, '}')) {
    body.push(parseStatement(tokens))
  }
  // main should always finish with return 0
  body.push(new ast.ReturnStatement(new ast.Constant('0')))
  matchToken(tokens, '}')
  matchToken(tokens, 'eof')
  return new ast.FunctionDeclaration(name, body)
}

export function parse (tokens: Token[]): ast.Program {
  const significantTokens = tokens.filter(t => t.type !== 'space')
  return new ast.Program(parseFunction(significantTokens))
}
