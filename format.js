const prettier = require('prettier')
const glob = require('fast-glob')
const fs = require('fs/promises')
const ESLint = require('eslint').ESLint

const eslint = new ESLint({ fix: true })

async function main () {
  for (const fp of await glob([
    'format.js',
    ...['src', 'test'].map((dir) => `${dir}/**/*.{ts,js,json,css,html}`)
  ])) {
    const contents = await fs.readFile(fp, 'utf-8')
    const formatted = await prettier.format(contents, { filepath: fp })
    const results = await eslint.lintText(formatted, { filePath: fp })
    await ESLint.outputFixes(results)
    for (const result of results) {
      console.log(result.filePath)
      await fs.writeFile(result.filePath, result.output ?? contents, {
        encoding: 'utf-8'
      })
    }
  }
}

main().then(() => {})
