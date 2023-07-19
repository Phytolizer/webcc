import { Backend } from '.'

export class BackendNotImplementedError extends Error {
  constructor (backend: Backend) {
    super(`Backend '${backend}' not implemented`)

    Object.setPrototypeOf(this, BackendNotImplementedError.prototype)
  }
}
