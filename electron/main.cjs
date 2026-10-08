// Electron entry point: shows the built game (dist/) in a desktop window.
const { app, BrowserWindow, Menu, shell } = require('electron')
const path = require('node:path')

// Set by `npm run app:dev` to load the Vite dev server instead of the build.
const devServerUrl = process.env.VITE_DEV_SERVER_URL

function createWindow() {
  const win = new BrowserWindow({
    width: 900,
    height: 960,
    minWidth: 420,
    minHeight: 640,
    title: 'Stack Match',
    backgroundColor: '#123a29',
    autoHideMenuBar: true,
    show: false,
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
    },
  })

  win.once('ready-to-show', () => win.show())

  // Never navigate the game window away; open any outside link in the browser.
  win.webContents.setWindowOpenHandler(({ url }) => {
    if (url.startsWith('https://')) void shell.openExternal(url)
    return { action: 'deny' }
  })
  win.webContents.on('will-navigate', event => event.preventDefault())

  if (devServerUrl) void win.loadURL(devServerUrl)
  else void win.loadFile(path.join(__dirname, '..', 'dist', 'index.html'))
}

// One window only: a second launch focuses the existing one.
if (!app.requestSingleInstanceLock()) {
  app.quit()
} else {
  app.on('second-instance', () => {
    const [win] = BrowserWindow.getAllWindows()
    if (win) {
      if (win.isMinimized()) win.restore()
      win.focus()
    }
  })

  app.whenReady().then(() => {
    Menu.setApplicationMenu(null)
    createWindow()
  })

  app.on('window-all-closed', () => app.quit())
}
