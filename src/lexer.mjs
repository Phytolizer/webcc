const keywords = new Set(["int", "return"]);

const patterns = {
  ident: /^[a-zA-Z_]\w*/,
  constant: /^[0-9]+/,
  space: /^\s+/,
};

const syms = ["(", ")", "{", "}", ";"];

const nextToken = (source) => {
  for (const [key, pattern] of Object.entries(patterns)) {
    const match = source.match(pattern);
    if (match) {
      const value = match[0];
      const type = keywords.has(value) ? value : key;
      return { type, value, rest: source.slice(value.length) };
    }
  }
  for (const sym of syms) {
    if (source.startsWith(sym)) {
      return { type: sym, value: sym, rest: source.slice(sym.length) };
    }
  }
};

export const lex = (source) => {
  const tokens = [];
  while (source.length > 0) {
    const { type, value, rest } = nextToken(source);
    tokens.push({ type, value });
    source = rest;
  }
  tokens.push({ type: "eof", value: "" });
  return tokens;
};
