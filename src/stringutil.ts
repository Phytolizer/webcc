export const stripNewlines = (s: string): string => {
  while (s[0] === '\n') {
    s = s.slice(1)
  }
  while (s[s.length - 1] === '\n') {
    s = s.slice(0, s.length - 1)
  }
  return s
}
