import { getApp } from '../src/server/app'
import { beforeAll } from 'vitest'

beforeAll(async () => {
  globalThis.app = await getApp({})
  await app.ready()
})
