import { compileAndRun } from '../helper'

test.each([
  { constant: '0', expectedResult: 0 },
  { constant: '1', expectedResult: 1 },
  { constant: '42', expectedResult: 42 }
])('should compile constant %s', async ({ constant, expectedResult }) => {
  const result = await compileAndRun(`int main() { return ${constant}; }`)
  expect(result).toBe(expectedResult)
})
