import { compileAndRun, processTest } from '../helper'

test.each([
  {
    expr: '-5',
    expectedResult: -5
  },
  {
    expr: '!5',
    expectedResult: 0
  },
  {
    expr: '!0',
    expectedResult: 1
  },
  {
    expr: '~12',
    expectedResult: ~12
  },
  {
    expr: '~0',
    expectedResult: ~0
  },
  {
    expr: '!-3',
    expectedResult: 0
  },
  {
    expr: '-~0',
    expectedResult: 1
  }
])('should compile $expr', async ({ expr, expectedResult }) => {
  const result = await compileAndRun(`int main() { return ${expr}; }`)
  expect(result).toBe(expectedResult)
})

describe('failures', () => {
  it.each(
    [
      {
        source: `
int main() {
    return !;
}
`,
        reason: 'missing constant'
      },
      {
        source: `
int main() {
    return !5
}
`,
        reason: 'missing semicolon'
      },
      {
        source: `
int main() {
    return !~;
}
`,
        reason: 'missing constant (multiple ops)'
      },
      {
        source: `
int main() {
    return 4-;
}
`,
        reason: 'wrong order'
      }
    ].map(processTest)
  )('should fail to compile $reason', async ({ source }) => {
    await expect(compileAndRun(source)).rejects.toThrow()
  })
})
