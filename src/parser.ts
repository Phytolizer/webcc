import * as ast from './ast'
import { Token } from './lexer'

const peek = (tokens: Token[]): Token => {
  let token = tokens[0]
  while (token !== undefined && token.type === 'space') {
    tokens.shift()
    token = tokens[0]
  }
  return token
}

const checkToken = (tokens: Token[], type: string): Token | undefined => {
  const token = peek(tokens)
  if (token === undefined || token.type !== type) {
    return undefined
  }
  return token
}

const matchToken = (tokens: Token[], type: string): Token => {
  const token = checkToken(tokens, type)
  if (token === undefined) {
    const actualType = tokens[0]?.type ?? 'undefined'
    throw new Error(`Expected token type ${type}, but got ${actualType}`)
  }
  tokens.shift()
  return token
}

const binaryPrecedence = (operator: string): number => {
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

const unaryPrecedence = (operator: string): number => {
  switch (operator) {
    case '-':
    case '!':
    case '~':
      return 11
    default:
      return 0
  }
}

const parsePrimary = (tokens: Token[]): ast.Expression => {
  switch (peek(tokens).type) {
    case '(': {
      tokens.shift()
      const expression = parseExpression(tokens)
      matchToken(tokens, ')')
      return expression
    }
    default: {
      const constant = matchToken(tokens, 'constant').value
      return new ast.Constant(constant)
    }
  }
}

const parseExpression = (
  tokens: Token[],
  parentPrecedence = 0
): ast.Expression => {
  const unaryPrec = unaryPrecedence(peek(tokens).type)
  let left
  if (unaryPrec !== 0 && unaryPrec >= parentPrecedence) {
    const operator = tokens.shift() ?? { type: 'undefined', value: '' }
    const operand = parseExpression(tokens, unaryPrec)
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
    const right = parseExpression(tokens, precedence)
    left = new ast.BinaryOp(left, operator.type, right)
  }

  return left
}

const parseStatement = (tokens: Token[]): ast.Statement => {
  matchToken(tokens, 'return')
  const expression = parseExpression(tokens)
  matchToken(tokens, ';')
  return new ast.ReturnStatement(expression)
}

const parseFunction = (tokens: Token[]): ast.FunctionDeclaration => {
  matchToken(tokens, 'int')
  const name = matchToken(tokens, 'ident').value
  matchToken(tokens, '(')
  matchToken(tokens, ')')
  matchToken(tokens, '{')
  const body = parseStatement(tokens)
  matchToken(tokens, '}')
  matchToken(tokens, 'eof')
  return new ast.FunctionDeclaration(name, body)
}

export const parse = (tokens: Token[]): ast.Program => {
  return new ast.Program(parseFunction(tokens))
}
