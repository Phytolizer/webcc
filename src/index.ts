import { generateProgram } from "./backend";
import { lex } from "./lexer";
import { parse } from "./parser";

const elements = {
  source: document.getElementById("source") as HTMLTextAreaElement,
  lexed: document.getElementById("lexed") as HTMLOutputElement,
  parsed: document.getElementById("parsed") as HTMLOutputElement,
  assembly: document.getElementById("assembly") as HTMLOutputElement,
  compile: document.getElementById("compile") as HTMLButtonElement,
};

elements.compile.addEventListener("click", (event) => {
  if ((event.target as Element).id === "compile") {
    const source = elements.source.value;
    const tokens = lex(source);
    elements.lexed.value = JSON.stringify(tokens, null, 2);
    const ast = parse(tokens);
    elements.parsed.value = JSON.stringify(ast, null, 2);
    elements.assembly.value = generateProgram(ast);
  }
});

elements.source.onkeydown = (event) => {
  if (event.key === "Enter" && event.ctrlKey) {
    elements.compile.click();
    event.preventDefault();
  }
};
