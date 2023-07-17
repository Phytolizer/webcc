import { stripNewlines } from "./stringutil.mjs";

const generateLogicalNot = (operand) => {
  return stripNewlines(`
${generateExpression(operand)}
    cmp rax, 0
    mov rax, 0
    sete al
`);
};

const generateBitwiseNot = (operand) => {
  return stripNewlines(`
${generateExpression(operand)}
    not rax
`);
};

const generateMinus = (operand) => {
  return stripNewlines(`
${generateExpression(operand)}
    neg rax
`);
};

const generateUnary = (operator, operand) => {
  switch (operator) {
    case "!": {
      return generateLogicalNot(operand);
    }
    case "~": {
      return generateBitwiseNot(operand);
    }
    case "-": {
      return generateMinus(operand);
    }
    default: {
      throw new Error(`Unexpected unary operator ${operator}`);
    }
  }
};

const generateExpression = (expression) => {
  switch (expression.type) {
    case "constant": {
      return stripNewlines(`
    mov rax, ${expression.value}
`);
    }
    case "unaryOp": {
      return generateUnary(expression.operator, expression.operand);
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
