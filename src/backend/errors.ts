import { type Backend } from '.'

export class NotImplementedError extends Error {
  constructor (feature: string) {
    super(`Not implemented: ${feature}`)
    Object.setPrototypeOf(this, NotImplementedError.prototype)
  }
}

export class BackendNotImplementedError extends Error {
  constructor (backend: Backend) {
    super(`Backend '${backend}' not implemented`)

    Object.setPrototypeOf(this, BackendNotImplementedError.prototype)
  }
}
