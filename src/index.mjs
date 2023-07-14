import { lex } from "./lexer.mjs";
import { parse } from "./parser.mjs";

const assemble = (returnValue) => {
  const asm = `
    .intel_syntax noprefix
    .globl _main
_main:
    mov eax, ${returnValue}
    ret
`;
  return asm.slice(1);
};

const compile = (source) => {
  return parse(lex(source));
};

export default { compile };
