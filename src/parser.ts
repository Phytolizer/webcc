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

function checkToken (
  tokens: Token[],
  type: string,
  distance = 0
): Token | undefined {
  const token = peek(tokens, distance)
  if (token === undefined || token.type !== type) {
    return undefined
  }
  return token
}

function matchToken (tokens: Token[], type: string): Token {
  const token = checkToken(tokens, type)
  if (token === undefined) {
    const actualType = tokens[0]?.type ?? 'undefined'
    throw new ParseError(`Expected token type ${type}, but got ${actualType}`)
  }
  tokens.shift()
  return token
}

function binaryPrecedence (operator: string): number {
  switch (operator) {
    case '*':
    case '/':
    case '%': {
      return 10
    }
    case '+':
    case '-': {
      return 9
    }
    case '<<':
    case '>>': {
      return 8
    }
    case '==':
    case '!=': {
      return 7
    }
    case '<':
    case '>':
    case '<=':
    case '>=': {
      return 6
    }
    case '&': {
      return 5
    }
    case '^': {
      return 4
    }
    case '|': {
      return 3
    }
    case '&&': {
      return 2
    }
    case '||': {
      return 1
    }
    default: {
      return 0
    }
  }
}

function unaryPrecedence (operator: string): number {
  switch (operator) {
    case '-':
    case '!':
    case '~':
      return 11
    default:
      return 0
  }
}

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
  const unaryPrec = unaryPrecedence(peek(tokens).type)
  let left
  if (unaryPrec !== 0 && unaryPrec >= parentPrecedence) {
    const operator = tokens.shift() ?? { type: 'undefined', value: '' }
    const operand = parseBinaryExpression(tokens, unaryPrec)
    left = new ast.UnaryOp(operator.type, operand)
  } else {
    left = parsePrimary(tokens)
  }

  while (true) {
    const precedence = binaryPrecedence(peek(tokens).type)
    if (precedence === 0 || precedence <= parentPrecedence) {
      break
    }

    const operator = tokens.shift() ?? { type: 'undefined', value: '' }
    const right = parseBinaryExpression(tokens, precedence)
    left = new ast.BinaryOp(left, operator.type, right)
  }

  return left
}

function parseExpression (tokens: Token[]): ast.Expression {
  if (
    checkToken(tokens, 'ident', 0) !== undefined &&
    checkToken(tokens, '=', 1) !== undefined
  ) {
    const name = matchToken(tokens, 'ident').value
    matchToken(tokens, '=')
    const expression = parseExpression(tokens)
    return new ast.AssignExpression(name, expression)
  }
  return parseBinaryExpression(tokens)
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
      if (checkToken(tokens, '=') !== undefined) {
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
  while (
    checkToken(tokens, 'eof') === undefined &&
    checkToken(tokens, '}') === undefined
  ) {
    body.push(parseStatement(tokens))
  }
  matchToken(tokens, '}')
  matchToken(tokens, 'eof')
  return new ast.FunctionDeclaration(name, body)
}

export function parse (tokens: Token[]): ast.Program {
  return new ast.Program(parseFunction(tokens.filter(t => t.type !== 'space')))
}
