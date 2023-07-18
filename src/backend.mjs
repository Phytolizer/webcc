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

const generateBinary = (left, operator, right) => {
  const arithmeticOps = {
    "+": (e1, e2) => `add ${e1}, ${e2}`,
    "-": (e1, e2) => `sub ${e1}, ${e2}`,
    "*": (e1, e2) => `imul ${e1}, ${e2}`,
    "/": (e1, e2) =>
      stripNewlines(`
    mov rdx, 0
    mov rax, ${e1}
    cqo
    idiv ${e2}
`),
  };
  switch (operator.type) {
    case "+":
    case "-":
    case "*":
    case "/": {
      return stripNewlines(`
${generateExpression(left)}
    push rax
${generateExpression(right)}
    pop rcx
    ${arithmeticOps[operator.type]("rcx", "rax")}
`);
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
    case "binaryOp": {
      return generateBinary(
        expression.left,
        expression.operator,
        expression.right
      );
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
