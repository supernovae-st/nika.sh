/* type surface of the node twin — the logic is typed by its TS sibling
   (src/lib/w1-to-w2.ts) and output-parity is pinned by w1-to-w2.test.ts */
export interface W2Result {
  text: string
  mapLine: (n: number) => number
}
export function w1ToW2WithMap(src: string): W2Result
export function w1ToW2(src: string): string
