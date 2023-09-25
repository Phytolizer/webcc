type _Overloads<T> = T extends {
  (...args: infer A1): infer R1
  (...args: infer A2): infer R2
  (...args: infer A3): infer R3
  (...args: infer A4): infer R4
}
  ? [[A1, R1], [A2, R2], [A3, R3], [A4, R4]]
  : T extends {
    (...args: infer A1): infer R1
    (...args: infer A2): infer R2
    (...args: infer A3): infer R3
  }
    ? [[A1, R1], [A2, R2], [A3, R3]]
    : T extends { (...args: infer A1): infer R1, (...args: infer A2): infer R2 }
      ? [[A1, R1], [A2, R2]]
      : T extends (...args: infer A) => infer R
        ? [[A, R]]
        : any

type _OverloadsReturnType<O extends Array<[unknown, unknown]>, A> = O extends [
  [A, infer R],
  ...unknown[],
]
  ? R
  : O extends [unknown, ...infer S extends Array<[unknown, unknown]>]
    ? _OverloadsReturnType<S, A>
    : any

export type OverloadsReturnType<T, A> = _OverloadsReturnType<_Overloads<T>, A>
