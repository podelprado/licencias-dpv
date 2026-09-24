const { app, BrowserWindow, ipcMain, shell } = require('electron');
const { spawn, execSync } = require('child_process');
const path = require('path');
const fs = require('fs');
const log = require('electron-log');

log.transports.file.level = 'info';

// ─── Modo: 'server' levanta Docker, 'client' apunta a IP remota ───────────────
const pkg = (() => {
  try {
    return require(app.isPackaged
      ? path.join(process.resourcesPath, 'app', 'package.json')
      : path.join(__dirname, '..', 'package.json'));
  } catch { return {}; }
})();
const MODE = process.env.LICENCIAS_MODE || pkg.licenciasMode || 'server';
const IS_SERVER = MODE === 'server';

let mainWindow = null;
let dockerProcess = null;

const APP_DIR = app.isPackaged
  ? path.join(process.resourcesPath, 'app')
  : path.join(__dirname, '..', '..');

const READY_CHECK_INTERVAL = 2000;
const MAX_WAIT_MS = 120_000;

// ─── Configuración de IP (solo modo client) ───────────────────────────────────
const CONFIG_PATH = path.join(app.getPath('userData'), 'config.json');

function loadConfig() {
  try {
    if (fs.existsSync(CONFIG_PATH)) {
      return JSON.parse(fs.readFileSync(CONFIG_PATH, 'utf8'));
    }
  } catch { /* ignorar */ }
  return {};
}

function saveConfig(data) {
  fs.writeFileSync(CONFIG_PATH, JSON.stringify(data, null, 2), 'utf8');
}

function getServerUrl() {
  const cfg = loadConfig();
  return cfg.serverUrl || null;
}

// ─── Utilidades Docker (solo modo server) ─────────────────────────────────────
function isDockerAvailable() {
  try {
    execSync('docker info', { stdio: 'ignore', timeout: 5000 });
    return true;
  } catch { return false; }
}

function runDockerCompose(args) {
  return new Promise((resolve, reject) => {
    log.info(`docker compose ${args.join(' ')}`);
    const proc = spawn('docker', ['compose', ...args], {
      cwd: APP_DIR,
      stdio: ['ignore', 'pipe', 'pipe'],
    });
    proc.stdout.on('data', (d) => log.info('[docker]', d.toString().trim()));
    proc.stderr.on('data', (d) => log.warn('[docker]', d.toString().trim()));
    proc.on('close', (code) => {
      if (code === 0) resolve();
      else reject(new Error(`docker compose exited with code ${code}`));
    });
    dockerProcess = proc;
  });
}

async function waitForApp(url, maxMs) {
  const http = require('http');
  const start = Date.now();
  return new Promise((resolve, reject) => {
    const check = () => {
      http.get(url, (res) => {
        if (res.statusCode < 500) resolve();
        else retry();
      }).on('error', retry);
    };
    const retry = () => {
      if (Date.now() - start > maxMs) reject(new Error('Timeout esperando que la app levante'));
      else setTimeout(check, READY_CHECK_INTERVAL);
    };
    check();
  });
}

// ─── Ventana splash ───────────────────────────────────────────────────────────
function createSplashWindow() {
  const win = new BrowserWindow({
    width: 480, height: 340,
    frame: false, resizable: false, center: true,
    webPreferences: { preload: path.join(__dirname, 'preload.js') },
  });
  win.loadFile(path.join(__dirname, 'splash.html'));
  return win;
}

// ─── Ventana de configuración de IP (solo client) ─────────────────────────────
function createConfigWindow() {
  const win = new BrowserWindow({
    width: 480, height: 360,
    frame: false, resizable: false, center: true,
    webPreferences: { preload: path.join(__dirname, 'preload.js') },
  });
  win.loadFile(path.join(__dirname, 'config.html'));
  return win;
}

// ─── Ventana principal ────────────────────────────────────────────────────────
function createMainWindow(url) {
  const win = new BrowserWindow({
    width: 1280, height: 800,
    minWidth: 900, minHeight: 600,
    show: false,
    title: 'Licencias DPV',
    webPreferences: { contextIsolation: true },
  });
  win.loadURL(url);
  win.once('ready-to-show', () => win.show());
  win.webContents.setWindowOpenHandler(({ url: u }) => {
    shell.openExternal(u);
    return { action: 'deny' };
  });
  return win;
}

// ─── Bootstrap ────────────────────────────────────────────────────────────────
app.whenReady().then(async () => {

  if (IS_SERVER) {
    // ── Modo servidor: levanta Docker ────────────────────────────────────────
    const splash = createSplashWindow();
    const sendStatus = (msg) => { log.info(msg); splash.webContents.send('status', msg); };

    try {
      sendStatus('Verificando Docker...');
      if (!isDockerAvailable()) {
        splash.webContents.send('error',
          'Docker no está instalado o no está corriendo.\n\n' +
          'Instalá Docker Desktop desde:\nhttps://www.docker.com/products/docker-desktop\n\n' +
          'Luego reiniciá la aplicación.'
        );
        return;
      }
      sendStatus('Iniciando servicios (primera vez puede tardar unos minutos)...');
      await runDockerCompose(['up', '-d', '--build']);
      sendStatus('Esperando que la aplicación esté lista...');
      await waitForApp('http://localhost', MAX_WAIT_MS);
      mainWindow = createMainWindow('http://localhost');
      splash.destroy();
    } catch (err) {
      log.error(err);
      splash.webContents.send('error', `Error al iniciar:\n${err.message}`);
    }

  } else {
    // ── Modo cliente: verificar IP guardada ──────────────────────────────────
    const savedUrl = getServerUrl();

    if (!savedUrl) {
      // Primera vez — mostrar pantalla de configuración
      const configWin = createConfigWindow();

      ipcMain.once('save-server-url', (_e, ip) => {
        const url = ip.startsWith('http') ? ip : `http://${ip}`;
        saveConfig({ serverUrl: url });
        configWin.destroy();
        launchClient(url);
      });
    } else {
      launchClient(savedUrl);
    }
  }
});

async function launchClient(serverUrl) {
  const splash = createSplashWindow();
  const sendStatus = (msg) => { log.info(msg); splash.webContents.send('status', msg); };

  try {
    sendStatus(`Conectando al servidor...`);
    await waitForApp(serverUrl, 15_000);
    mainWindow = createMainWindow(serverUrl);
    splash.destroy();
  } catch (err) {
    log.error(err);
    splash.webContents.send('error',
      `No se pudo conectar al servidor:\n${serverUrl}\n\n` +
      'Verificá que el servidor esté encendido y en la misma red.'
    );
  }
}

// ─── IPC ──────────────────────────────────────────────────────────────────────
ipcMain.on('open-docker-url', () => shell.openExternal('https://www.docker.com/products/docker-desktop'));
ipcMain.on('retry', () => { app.relaunch(); app.exit(0); });
ipcMain.on('change-server', () => {
  // Borrar IP guardada y reiniciar para volver a pedir
  saveConfig({});
  app.relaunch();
  app.exit(0);
});
ipcMain.handle('get-server-url', () => getServerUrl());

// ─── Cierre ───────────────────────────────────────────────────────────────────
app.on('window-all-closed', async () => {
  if (IS_SERVER) {
    try {
      log.info('Deteniendo contenedores...');
      await runDockerCompose(['down']);
    } catch (err) {
      log.warn('Error al detener Docker:', err.message);
    }
  }
  app.quit();
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0 && mainWindow) mainWindow.show();
});
