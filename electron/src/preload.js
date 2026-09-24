const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  onStatus:      (cb) => ipcRenderer.on('status', (_e, msg) => cb(msg)),
  onError:       (cb) => ipcRenderer.on('error',  (_e, msg) => cb(msg)),
  openDockerUrl: ()   => ipcRenderer.send('open-docker-url'),
  retry:         ()   => ipcRenderer.send('retry'),
  // Client mode
  saveServerUrl: (ip) => ipcRenderer.send('save-server-url', ip),
  changeServer:  ()   => ipcRenderer.send('change-server'),
  getServerUrl:  ()   => ipcRenderer.invoke('get-server-url'),
});
