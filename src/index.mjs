import { generateProgram } from "./backend.mjs";
import { lex } from "./lexer.mjs";
import { parse } from "./parser.mjs";

document.body.addEventListener("click", (event) => {
  if (event.target.id === "compile") {
    const source = document.getElementById("source").value;
    const tokens = lex(source);
    document.getElementById("lexed").value = JSON.stringify(tokens, null, 2);
    const ast = parse(tokens);
    document.getElementById("parsed").value = JSON.stringify(ast, null, 2);
    document.getElementById("assembly").value = generateProgram(ast);
  }
});
