import * as path from 'path'
import { type Configuration } from 'webpack'
import HTMLWebpackPlugin from 'html-webpack-plugin'

export default (env: any, argv: { mode: string }): Configuration => {
  const result: Configuration = {
    entry: './src/index.ts',
    plugins: [
      new HTMLWebpackPlugin({
        inject: 'body',
        template: './src/index.html'
      })
    ],
    module: {
      rules: [
        {
          test: /\.ts$/,
          use: 'ts-loader',
          exclude: /node-modules/
        },
        {
          test: /\.css$/,
          use: ['style-loader', 'css-loader'],
          exclude: /node-modules/
        }
      ]
    },
    resolve: {
      extensions: ['.ts', '.js'],
      fallback: {
        path: require.resolve('path-browserify'),
        fs: false
      }
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
