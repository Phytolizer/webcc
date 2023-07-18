import { stripNewlines } from "./stringutil";
import * as ast from "./ast";

const generateLogicalNot = (operand: ast.Expression): string => {
  return stripNewlines(`
${generateExpression(operand)}
    cmp rax, 0
    mov rax, 0
    sete al
`);
};

const generateBitwiseNot = (operand: ast.Expression): string => {
  return stripNewlines(`
${generateExpression(operand)}
    not rax
`);
};

const generateMinus = (operand: ast.Expression): string => {
  return stripNewlines(`
${generateExpression(operand)}
    neg rax
`);
};

const generateUnary = (operator: string, operand: ast.Expression): string => {
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

const generateBinary = (
  left: ast.Expression,
  operator: string,
  right: ast.Expression
): string => {
  const arithmeticOps = {
    "+": (e1: string, e2: string) => `add ${e1}, ${e2}`,
    "-": (e1: string, e2: string) => `sub ${e1}, ${e2}`,
    "*": (e1: string, e2: string) => `imul ${e1}, ${e2}`,
    "/": (e1: string, e2: string) =>
      stripNewlines(`
    mov rdx, 0
    mov rax, ${e1}
    cqo
    idiv ${e2}
`),
  };
  switch (operator) {
    case "+":
    case "-":
    case "*":
    case "/": {
      return stripNewlines(`
${generateExpression(left)}
    push rax
${generateExpression(right)}
    pop rcx
    ${arithmeticOps[operator]("rcx", "rax")}
`);
    }
    default: {
      throw new Error(`Unexpected binary operator ${operator}`);
    }
  }
};

const generateExpression = (expression: ast.Expression): string => {
  switch (expression.type) {
    case "constant": {
      const c = expression as ast.Constant;
      return stripNewlines(`
    mov rax, ${c.value}
`);
    }
    case "unaryOp": {
      const u = expression as ast.UnaryOp;
      return generateUnary(u.operator, u.operand);
    }
    case "binaryOp": {
      const b = expression as ast.BinaryOp;
      return generateBinary(b.left, b.operator, b.right);
    }
    default: {
      throw new Error(`Unexpected expression type ${expression.type}`);
    }
  }
};

const generateStatement = (statement: ast.Statement): string => {
  switch (statement.type) {
    case "returnStatement": {
      const rs = statement as ast.ReturnStatement;
      return stripNewlines(`
${generateExpression(rs.expression)}
    ret
`);
    }
    default: {
      throw new Error(`Unexpected statement type ${statement.type}`);
    }
  }
};

const generateFunction = (functionDeclaration: ast.FunctionDeclaration): string => {
  return stripNewlines(`
    global ${functionDeclaration.name}
${functionDeclaration.name}:
${generateStatement(functionDeclaration.body)}
`);
};

export const generateProgram = (program: ast.Program): string => {
  return generateFunction(program.functionDeclaration) + "\n";
};
