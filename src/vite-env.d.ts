/// <reference types="vite/client" />

/* the recorded flight-recorder traces import as verbatim strings — vite's
   `?raw` suffix covers *.ts/js by default typing; the .ndjson extension needs
   the explicit module declaration. */
declare module '*.ndjson?raw' {
  const src: string
  export default src
}
