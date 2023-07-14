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

document.body.addEventListener("click", (event) => {
  if (event.target.id === "compile") {
    const source = document.getElementById("source").value;
    const tokens = lex(source);
    document.getElementById("lexed").value = JSON.stringify(tokens, null, 2);
    const ast = parse(tokens);
    document.getElementById("parsed").value = JSON.stringify(ast, null, 2);
  }
});
