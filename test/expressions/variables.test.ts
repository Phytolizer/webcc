import { test, describe, it, expect } from 'vitest'
import { compileAndRun } from '../helper'

test.each([
  {
    body: ['int a = 1;', 'a = a + 1;', 'return a;'],
    expectedResult: 2
  }
])('should compile $body', async ({ body, expectedResult }) => {
  const result = await compileAndRun(`
int main() {
  ${body.join('\n')}
}
`)
  expect(result).toBe(expectedResult)
})
