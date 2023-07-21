import { compileAndRun } from '../helper'

test.each([
  {
    expr: '1 + 2',
    expectedResult: 3
  },
  {
    expr: '1 - 2',
    expectedResult: -1
  },
  {
    expr: '2 * 3',
    expectedResult: 6
  },
  {
    expr: '4 / 2',
    expectedResult: 2
  },
  {
    expr: '1 - 2 - 3',
    expectedResult: -4
  },
  {
    expr: '6 / 3 / 2',
    expectedResult: 1
  },
  {
    expr: '2 + 3 * 4',
    expectedResult: 14
  },
  {
    expr: '2 * (3 + 4)',
    expectedResult: 14
  },
  {
    expr: '(-12) / 5',
    expectedResult: -2
  },
  {
    expr: '2- -1',
    expectedResult: 3
  },
  {
    expr: '~2 + 3',
    expectedResult: 0
  },
  {
    expr: '~(1 + 1)',
    expectedResult: -3
  }
])('should compile $expr', async ({ expr, expectedResult }) => {
  const result = await compileAndRun(`int main() { return ${expr}; }`)
  expect(result).toBe(expectedResult)
})

describe('failures', () => {
  it.each([
    {
      source: `
int main() {
    return 2 (- 3);
}
`,
      reason: 'wrong parentheses placement'
    },
    {
      source: `
int main() {
    return /3;
}
`,
      reason: 'missing left operand'
    },
    {
      source: `
int main() {
    return 1 + ;
}
`,
      reason: 'missing right operand'
    },
    {
      source: `
int main() {
    return 2*2
}
`,
      reason: 'missing semicolon'
    }
  ])('should fail to compile $reason', async ({ source }) => {
    await expect(compileAndRun(source)).rejects.toThrow()
  })
})
