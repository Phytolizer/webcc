import { type InjectOptions } from 'fastify'
import wabt from 'wabt'
import { stripNewlines } from '../src/stringutil'
import { expect } from 'vitest'

export async function compile (source: string): Promise<string> {
  const req: InjectOptions = {
    url: '/',
    method: 'POST',
    body: { type: 'compile', backend: 'wat', source }
  }
  const res = await app.inject(req)
  expect(res.body).not.toBe('')
  const body = res.json()
  expect(body.message).toBe(undefined)
  expect(res.statusCode).toBe(200)
  expect(body).toHaveProperty('asm')
  return body.asm
}

export async function run (asm: string): Promise<number> {
  const w = await wabt()
  const module = w.parseWat('test.wat', asm)
  module.applyNames()
  const { buffer } = module.toBinary({})
  const { instance } = await WebAssembly.instantiate(buffer)
  return (instance.exports.main as () => number)()
}

export async function compileAndRun (source: string): Promise<number> {
  const asm = await compile(source)
  return await run(asm)
}

export function processTest<T extends { source: string }> (test: T): T {
  return { ...test, source: stripNewlines(test.source) }
}
