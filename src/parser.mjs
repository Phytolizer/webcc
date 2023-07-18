import * as ast from "./ast.mjs";

const peek = (tokens) => {
  let token = tokens[0];
  while (token && token.type === "space") {
    tokens.shift();
    token = tokens[0];
  }
  return token;
};

const checkToken = (tokens, type) => {
  const token = peek(tokens);
  if (token === undefined || token.type !== type) {
    return undefined;
  }
  return token;
};

const matchToken = (tokens, type) => {
  const token = checkToken(tokens, type);
  if (token === undefined) {
    throw new Error(`Expected token type ${type}, but got ${token}`);
  }
  tokens.shift();
  return token;
};

const binaryPrecedence = (operator) => {
  switch (operator) {
    case "*":
    case "/": {
      return 2;
    }
    case "+":
    case "-": {
      return 1;
    }
    default: {
      return 0;
    }
  }
};

const unaryPrecedence = (operator) => {
  switch (operator) {
    case "-":
    case "!":
    case "~":
      return 3;
    default:
      return 0;
  }
};

const parsePrimary = (tokens) => {
  switch (peek(tokens).type) {
    case "(": {
      tokens.shift();
      const expression = parseExpression(tokens);
      matchToken(tokens, ")");
      return expression;
    }
    default: {
      const constant = matchToken(tokens, "constant").value;
      return ast.constant(constant);
    }
  }
};

const parseExpression = (tokens, parentPrecedence = 0) => {
  const unaryPrec = unaryPrecedence(peek(tokens).type);
  let left;
  if (unaryPrec !== 0 && unaryPrec >= parentPrecedence) {
    const operator = tokens.shift();
    const operand = parseExpression(tokens, unaryPrec);
    left = ast.unaryOp(operator, operand);
  } else {
    left = parsePrimary(tokens);
  }

  while (true) {
    const precedence = binaryPrecedence(peek(tokens).type);
    if (precedence === 0 || precedence <= parentPrecedence) {
      break;
    }

    const operator = tokens.shift();
    const right = parseExpression(tokens, precedence);
    left = ast.binaryOp(left, operator, right);
  }

  return left;
};

const parseStatement = (tokens) => {
  matchToken(tokens, "return");
  const expression = parseExpression(tokens);
  matchToken(tokens, ";");
  return ast.returnStatement(expression);
};

const parseFunction = (tokens) => {
  matchToken(tokens, "int");
  const name = matchToken(tokens, "ident").value;
  matchToken(tokens, "(");
  matchToken(tokens, ")");
  matchToken(tokens, "{");
  const body = parseStatement(tokens);
  matchToken(tokens, "}");
  matchToken(tokens, "eof");
  return ast.functionDeclaration(name, body);
};

export const parse = (tokens) => {
  return ast.program(parseFunction(tokens));
};
