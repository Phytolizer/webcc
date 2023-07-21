import { Config } from '@jest/types'

const teardown = async (
  globalConfig: Config.GlobalConfig,
  projectConfig: Config.ProjectConfig
): Promise<void> => {
  await globalThis.app.close()
}

export default teardown
