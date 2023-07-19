const { writeFileSync } = require('fs')
const path = require('path')
const TJS = require('typescript-json-schema')

const settings = {
  required: true
}

const compilerOptions = {}

const basePath = './src/server'

const program = TJS.getProgramFromFiles(
  [path.resolve(basePath, 'types.ts')],
  compilerOptions,
  basePath
)

const schema = TJS.generateSchema(program, 'ConcreteRequestBody', settings)

writeFileSync(
  path.join(basePath, 'schema.json'),
  JSON.stringify(schema, null, 2)
)
