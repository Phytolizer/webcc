import { Config } from '@jest/types'
import { getApp } from '../src/server/app'

declare global {
  var app: Awaited<ReturnType<typeof getApp>>
}

const teardown = async (
  globalConfig: Config.GlobalConfig,
  projectConfig: Config.ProjectConfig
) => {
  await globalThis.app.close()
}

export default teardown
