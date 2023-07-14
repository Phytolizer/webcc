import * as ast from "./ast.mjs";

const checkToken = (tokens, type) => {
  let token = tokens[0];
  while (token && token.type === "space") {
    tokens.shift();
    token = tokens[0];
  }
  if (!token || token.type !== type) {
    return undefined;
  }
  return token;
};

const matchToken = (tokens, type) => {
  const token = checkToken(tokens, type);
  if (!token) {
    throw new Error(`Expected token type ${type}, but got ${token}`);
  }
  tokens.shift();
  return token;
};

const parseExpression = (tokens) => {
  const token = checkToken(tokens, "constant");
  if (token && token.type === "constant") {
    tokens.shift();
    return ast.constant(token.value);
  }
  throw new Error(`Unexpected token type ${token.type}`);
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
  return ast.functionDeclaration(name, body);
};

export const parse = (tokens) => {
  return ast.program(parseFunction(tokens));
};
