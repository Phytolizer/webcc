import * as path from 'path'
import { Configuration } from 'webpack'

export default (env: any, argv: { mode: string }): Configuration => {
  const result: Configuration = {
    entry: './src/index.ts',
    module: {
      rules: [
        {
          test: /\.ts$/,
          use: 'ts-loader',
          exclude: /node-modules/
        }
      ]
    },
    resolve: {
      extensions: ['.ts', '.js']
    },
    output: {
      filename: 'bundle.js',
      path: path.resolve(__dirname, 'dist')
    }
  }

  if (argv.mode === 'development') {
    result.devtool = 'inline-source-map'
  }

  return result
}
