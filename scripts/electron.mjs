// Opens the game in Electron. With --dev, starts the Vite dev server first for hot reload;
// otherwise loads the production build in dist/.
import { spawn } from 'node:child_process'
import { createRequire } from 'node:module'
import { createServer } from 'vite'

const require = createRequire(import.meta.url)
const env = { ...process.env }
// Set inside VS Code and some tools; it would make Electron run as plain Node with no window.
delete env.ELECTRON_RUN_AS_NODE

let server = null
if (process.argv.includes('--dev')) {
  server = await createServer()
  await server.listen()
  env.VITE_DEV_SERVER_URL = server.resolvedUrls.local[0]
}

const electron = spawn(require('electron'), ['.'], { stdio: 'inherit', env })
electron.on('exit', async code => {
  await server?.close()
  process.exit(code ?? 0)
})
