import { compileAndRun, processTest } from '../helper'

test.each([
  { constant: '0', expectedResult: 0 },
  { constant: '1', expectedResult: 1 },
  { constant: '42', expectedResult: 42 }
])(
  'should compile constant $constant',
  async ({ constant, expectedResult }) => {
    const result = await compileAndRun(`int main() { return ${constant}; }`)
    expect(result).toBe(expectedResult)
  }
)

describe('weird syntax', () => {
  it.each(
    [
      {
        source: `

int
main
(
)
{
return
0
;
}
`,
        expectedResult: 0,
        reason: 'lots of newlines'
      },
      {
        source: '   int    main  (   )   {  return   0   ;   }   ',
        expectedResult: 0,
        reason: 'lots of spaces'
      }
    ].map(processTest)
  )('should compile $reason', async ({ source, expectedResult }) => {
    const result = await compileAndRun(source)
    expect(result).toBe(expectedResult)
  })
})

describe('failures', () => {
  it.each(
    [
      {
        source: `
int main( {
    return 0;
}
`,
        reason: 'missing close paren'
      },
      {
        source: `
int main() {
    return;
}
`,
        reason: 'missing return value'
      },
      {
        source: `
int main() {
    return 0;
`,
        reason: 'missing close brace'
      },
      {
        source: `
int main() {
    return 0
}
`,
        reason: 'missing semicolon'
      },
      {
        source: `
int main() {
    return0;
}
`,
        reason: 'missing space between return and 0'
      },
      {
        source: `
int main() {
    RETURN 0;
}
`,
        reason: 'wrong case for keyword'
      }
    ].map(processTest)
  )('should fail to compile $reason', async ({ source }) => {
    await expect(compileAndRun(source)).rejects.toThrow()
  })
})
