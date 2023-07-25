import { Program } from './ast'
import { generateProgram, Backend, backends } from './backend'
import { BackendNotImplementedError } from './backend/errors'
import { lex } from './lexer'
import { parse } from './parser'
import wabt from 'wabt'

const elements = {
  source: document.getElementById('source') as HTMLTextAreaElement,
  lexed: document.getElementById('lexed') as HTMLOutputElement,
  parsed: document.getElementById('parsed') as HTMLOutputElement,
  assembly: document.getElementById('assembly') as HTMLOutputElement,
  compile: document.getElementById('compile') as HTMLButtonElement,
  backendSelection: document.getElementById(
    'backend-selection'
  ) as HTMLDivElement,
  assemblyCollapsible: document.getElementById(
    'assembly-collapsible'
  ) as HTMLButtonElement,
  watPretty: document.getElementById('wat-pretty') as HTMLDivElement,
  watPrettyBox: document.getElementById('wat-pretty-box') as HTMLInputElement
}

const getBackend = (): Backend => {
  for (const backend of [...backends]) {
    const radio = document.getElementById(
      `backend-${backend}`
    ) as HTMLInputElement
    if (radio.checked) {
      return backend
    }
  }
  throw new Error('unreachable')
}

const updateBackend = (): void => {
  if (getBackend() === 'wat') {
    elements.watPretty.style.display = 'inline'
  } else {
    elements.watPretty.style.display = 'none'
  }
}

const updateAssemblyOutput = async (ast: Program): Promise<void> => {
  try {
    const backend = getBackend()
    let result = generateProgram(ast, backend)
    if (backend === 'wat' && elements.watPrettyBox.checked) {
      const w = await wabt()
      const mod = w.parseWat('output.wat', result)
      mod.applyNames()
      result = mod.toText({
        foldExprs: true,
        inlineExport: true
      })
    }
    elements.assembly.value = result
  } catch (err) {
    if (err instanceof BackendNotImplementedError) {
      elements.assembly.value = err.message
    } else {
      throw err
    }
  }
}

elements.compile.addEventListener('click', event => {
  if ((event.target as Element).id === 'compile') {
    const source = elements.source.value
    const tokens = lex(source)
    elements.lexed.value = JSON.stringify(tokens, null, 2)
    const ast = parse(tokens)
    elements.parsed.value = JSON.stringify(ast, null, 2)
    void updateAssemblyOutput(ast)
  }
})

document.onkeydown = event => {
  if (event.key === 'Enter' && event.ctrlKey) {
    elements.compile.click()
    event.preventDefault()
  }
}

for (const collapsible of document.getElementsByClassName(
  'collapsible'
) as HTMLCollectionOf<HTMLButtonElement>) {
  collapsible.addEventListener('click', () => {
    collapsible.toggleAttribute('active')
    const contentName = collapsible.getAttribute('target') as string
    const content = document.getElementById(contentName) as HTMLElement
    if (content.style.display === 'block') {
      content.style.display = 'none'
    } else {
      content.style.display = 'block'
    }
  })
}

elements.assemblyCollapsible.dispatchEvent(new Event('click'))

for (const radio of [
  ...backends.map(
    backend => document.getElementById(`backend-${backend}`) as HTMLInputElement
  )
]) {
  radio.addEventListener('change', () => {
    updateBackend()
    void updateAssemblyOutput(parse(lex(elements.source.value)))
  })
}

elements.watPrettyBox.addEventListener('change', () => {
  void updateAssemblyOutput(parse(lex(elements.source.value)))
})
