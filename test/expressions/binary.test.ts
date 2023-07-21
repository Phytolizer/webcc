import { compileAndRun } from '../helper'
import { test, describe, it, expect } from 'vitest'

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
  },
  {
    expr: '1 && 0',
    expectedResult: 0
  },
  {
    expr: '1 && -1',
    expectedResult: 1
  },
  {
    expr: '1 == 2',
    expectedResult: 0
  },
  {
    expr: '1 == 1',
    expectedResult: 1
  },
  {
    expr: '1 >= 2',
    expectedResult: 0
  },
  {
    expr: '1 >= 1',
    expectedResult: 1
  },
  {
    expr: '1 > 2',
    expectedResult: 0
  },
  {
    expr: '1 > 1',
    expectedResult: 0
  },
  {
    expr: '1 > 0',
    expectedResult: 1
  },
  {
    expr: '1 <= -1',
    expectedResult: 0
  },
  {
    expr: '1 <= 1',
    expectedResult: 1
  },
  {
    expr: '2 < 1',
    expectedResult: 0
  },
  {
    expr: '1 < 1',
    expectedResult: 0
  },
  {
    expr: '1 < 2',
    expectedResult: 1
  },
  {
    expr: '0 != 0',
    expectedResult: 0
  },
  {
    expr: '1 != 0',
    expectedResult: 1
  },
  {
    expr: '0 || 0',
    expectedResult: 0
  },
  {
    expr: '1 || 0',
    expectedResult: 1
  },
  {
    expr: '1 || 0 && 2',
    expectedResult: 1
  },
  {
    expr: '(1 || 0) && 0',
    expectedResult: 0
  },
  {
    expr: '2 == 2 > 0',
    expectedResult: 1
  },
  {
    expr: '2 == 2 || 0',
    expectedResult: 1
  },
  {
    expr: '1 % 2',
    expectedResult: 1
  },
  {
    expr: '2 % 2',
    expectedResult: 0
  },
  {
    expr: '3 % 2',
    expectedResult: 1
  },
  {
    expr: '1 & 2',
    expectedResult: 0
  },
  {
    expr: '2 & 3',
    expectedResult: 2
  },
  {
    expr: '1 | 2',
    expectedResult: 3
  },
  {
    expr: '2 | 3',
    expectedResult: 3
  },
  {
    expr: '1 ^ 2',
    expectedResult: 3
  },
  {
    expr: '2 ^ 3',
    expectedResult: 1
  },
  {
    expr: '1 << 2',
    expectedResult: 4
  },
  {
    expr: '2 << 3',
    expectedResult: 16
  },
  {
    expr: '4 >> 2',
    expectedResult: 1
  },
  {
    expr: '16 >> 3',
    expectedResult: 2
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
    },
    {
      source: `
int main() {
    return 1 < > 3;
}
`,
      reason: 'missing middle operand'
    }
  ])('should fail to compile $reason', async ({ source }) => {
    await expect(compileAndRun(source)).rejects.toThrow()
  })
})
