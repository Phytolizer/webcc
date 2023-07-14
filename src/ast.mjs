export const program = (functionDeclaration) => {
  return { type: "program", functionDeclaration };
};

export const functionDeclaration = (name, body) => {
  return { type: "functionDeclaration", name, body };
};

export const returnStatement = (expression) => {
  return { type: "returnStatement", expression };
};

export const constant = (value) => {
  return { type: "constant", value };
};
