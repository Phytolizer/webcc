import { getApp } from '../src/server/app'

declare global {
  var app: Awaited<ReturnType<typeof getApp>>
}

export default app
