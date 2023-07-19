import { Program } from './ast'
import { generateProgram, Backend, backends } from './backend'
import { lex } from './lexer'
import { parse } from './parser'

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
  ) as HTMLButtonElement
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

const updateAssemblyOutput = (ast: Program) => {
  try {
    elements.assembly.value = generateProgram(ast, getBackend())
  } catch (err) {
    elements.assembly.value = (err as Error).message
  }
}

elements.compile.addEventListener('click', event => {
  if ((event.target as Element).id === 'compile') {
    const source = elements.source.value
    const tokens = lex(source)
    elements.lexed.value = JSON.stringify(tokens, null, 2)
    const ast = parse(tokens)
    elements.parsed.value = JSON.stringify(ast, null, 2)
    updateAssemblyOutput(ast)
  }
})

elements.source.onkeydown = event => {
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
    const backend = radio.value as Backend
    updateAssemblyOutput(parse(lex(elements.source.value)))
  })
}
