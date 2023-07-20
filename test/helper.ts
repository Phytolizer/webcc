import { InjectOptions } from 'fastify'
import app from './global'
import wabt from 'wabt'

export const compile = async (source: string) => {
  const req: InjectOptions = {
    url: '/',
    method: 'POST',
    body: { type: 'compile', backend: 'wat', source }
  }
  const res = await app.inject(req)
  expect(res.statusCode).toBe(200)
  expect(res.body).not.toBe('')
  expect(res.json()).toHaveProperty('asm')
  return res.json().asm
}

export const run = async (asm: string) => {
  const w = await wabt()
  const module = w.parseWat('test.wat', asm)
  module.applyNames()
  const { buffer } = module.toBinary({})
  const { instance } = await WebAssembly.instantiate(buffer)
  return (instance.exports.main as Function)()
}

export const compileAndRun = async (source: string) => {
  const asm = await compile(source)
  return run(asm)
}
