import { getApp } from '../src/server/app'

declare global {
  // eslint-disable-next-line no-var
  var app: Awaited<ReturnType<typeof getApp>>
}

export default app
