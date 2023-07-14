import { stripNewlines } from "./stringutil.mjs";

const generateExpression = (expression) => {
  switch (expression.type) {
    case "constant": {
      return stripNewlines(`
    mov rax, ${expression.value}
`);
    }
    default: {
      throw new Error(`Unexpected expression type ${expression.type}`);
    }
  }
};

const generateStatement = (statement) => {
  switch (statement.type) {
    case "returnStatement": {
      return stripNewlines(`
${generateExpression(statement.expression)}
    ret
`);
    }
    default: {
      throw new Error(`Unexpected statement type ${statement.type}`);
    }
  }
};

const generateFunction = (functionDeclaration) => {
  return stripNewlines(`
    global ${functionDeclaration.name}
${functionDeclaration.name}:
${generateStatement(functionDeclaration.body)}
`);
};

export const generateProgram = (program) => {
  return generateFunction(program.functionDeclaration) + "\n";
};
