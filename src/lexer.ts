const keywords = new Set(['int', 'return'])

const patterns = {
  ident: /^[a-zA-Z_]\w*/,
  constant: /^[0-9]+/,
  space: /^\s+/
}

export const syms = [
  '(',
  ')',
  '{',
  '}',
  ';',
  '-',
  '~',
  '!',
  '+',
  '*',
  '/',
  '%',
  '<',
  '>',
  '&&',
  '||',
  '&',
  '|',
  '^',
  '==',
  '!=',
  '<=',
  '>=',
  '<<',
  '>>',
  '='
].sort((a, b) => b.length - a.length)

export interface Token {
  type: string
  value: string
}

interface TokenWithRest extends Token {
  rest: string
}

function nextToken (source: string): TokenWithRest {
  for (const [key, pattern] of Object.entries(patterns)) {
    const match = source.match(pattern)
    if (match !== null) {
      const value = match[0]
      const type = keywords.has(value) ? value : key
      return { type, value, rest: source.slice(value.length) }
    }
  }
  for (const sym of syms) {
    if (source.startsWith(sym)) {
      return { type: sym, value: sym, rest: source.slice(sym.length) }
    }
  }
  return { type: 'error', value: source[0], rest: source.slice(1) }
}

export function lex (source: string): Token[] {
  const tokens = []
  while (source.length > 0) {
    const { type, value, rest } = nextToken(source)
    tokens.push({ type, value })
    source = rest
  }
  tokens.push({ type: 'eof', value: '' })
  return tokens
}
