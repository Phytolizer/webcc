import { Config } from '@jest/types'
import { getApp } from '../src/server/app'

const setup = async (
  globalConfig: Config.GlobalConfig,
  projectConfig: Config.ProjectConfig
): Promise<void> => {
  globalThis.app = await getApp({})
  await globalThis.app.ready()
}

export default setup
