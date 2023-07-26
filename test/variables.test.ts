import { describe, expect, it, test } from 'vitest'
import {
  compileAndRun,
  processTest as baseProcessTest,
  testHasKey
} from './helper'

function processBody (body: string[]): string {
  return `
int main() {
${body.map(s => '  ' + s).join('\n')}
}`
}

function processTest<T extends { body: string[] }> (
  test: T
): T & { source: string } {
  if (testHasKey(test, 'source') && typeof test.source === 'string') {
    return baseProcessTest({
      ...test,
      source: test.source,
      body: test.source
    })
  }
  return baseProcessTest({ ...test, source: processBody(test.body) })
}

test.each(
  [
    {
      body: ['int a = 1;', 'a = a + 1;', 'return a;'],
      expectedResult: 2
    },
    {
      body: ['int a;', 'a = 2;', 'return a;'],
      expectedResult: 2
    },
    {
      body: ['int a;', 'int b = a = 0;', 'return b;'],
      expectedResult: 0
    },
    {
      body: ['int a;', 'int b;', 'a = b = 4;', 'return a - b;'],
      expectedResult: 0
    },
    {
      body: ['int a = 2;', 'return 0;'],
      expectedResult: 0
    },
    {
      body: [],
      expectedResult: 0
    },
    {
      body: ['int a = 1;', 'int b = 2;', 'return a + b;'],
      expectedResult: 3
    },
    {
      body: ['int a;', 'return 0;'],
      expectedResult: 0
    },
    {
      body: ['int a = 2;', 'return a;'],
      expectedResult: 2
    },
    {
      body: ['2 + 2;', 'return 0;'],
      expectedResult: 0
    },
    {
      body: ['int a = 0;', 'a || (a = 3) || (a = 4);', 'return a;'],
      expectedResult: 3
    },
    {
      body: ['int a = 0;', 'int b = 0;', 'a && (b = 5);', 'return b;'],
      expectedResult: 0
    },
    {
      body: ['int a = 1;', 'int b = 0;', 'a || (b = 5);', 'return b;'],
      expectedResult: 0
    },
    {
      body: ['int a = 1;', 'a += 1;', 'return a;'],
      expectedResult: 2
    },
    {
      body: ['int a = 12;', 'a %= 5;', 'return a;'],
      expectedResult: 2
    },
    {
      body: ['int a = 12;', 'a /= 3;', 'return a;'],
      expectedResult: 4
    },
    {
      body: ['int a = 12;', 'a *= 3 - 1;', 'return a;'],
      expectedResult: 24
    },
    {
      body: ['int a = 2;', 'a <<= 2;', 'return a;'],
      expectedResult: 8
    }
  ].map(processTest)
)('should compile $body', async ({ source, expectedResult }) => {
  const result = await compileAndRun(source)
  expect(result).toBe(expectedResult)
})

describe('failures', () => {
  it.each(
    [
      ['int a = 1;', 'int a = 2;', 'return a;'],
      ['ints a = 1;', 'return a;'],
      ['int foo bar = 3;', 'return bar;'],
      ['int a = 2;', 'a + 3 = 4;', 'return a;'],
      ['int a = 2;', '!a = 3;', 'return a;'],
      ['int a = 2', 'a = a + 4;', 'return a;'],
      ['return a;'],
      ['a = 1 + 2;', 'int a;', 'return a;']
    ].map(body => processTest({ body }))
  )('should fail to compile $body', async ({ source }) => {
    await expect(compileAndRun(source)).rejects.toThrow()
  })
})
