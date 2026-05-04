// See the Electron documentation for details on how to use preload scripts:
// https://www.electronjs.org/docs/latest/tutorial/process-model#preload-scripts

const { contextBridge, ipcRenderer } = require('electron/renderer')

contextBridge.exposeInMainWorld('electronAPI', {
  markerContextMenu: () => ipcRenderer.send('markerContextMenu')
})

ipcRenderer.on('markerContextMenu-command', (e, command) => {
  // What it will do when this options is click it
  //console.log('-preload--markerContextMenu-command', command)
  if (command == "before"){
    let event = new Event('insertMarkerBefore')
    document.dispatchEvent(event)
  }else if (command == "after"){
    let event = new Event('insertMarkerAfter')
    document.dispatchEvent(event)
  }else if (command == "speed-limit"){
    let event = new Event('setSpeedLimit')
    document.dispatchEvent(event)
  }else if (command == "delete"){
    let event = new Event('deleteMarker')
    document.dispatchEvent(event)
  }

})

window.addEventListener('DOMContentLoaded', () => {
  const replaceText = (selector, text) => {
    const element = document.getElementById(selector)
    if (element) element.innerText = text
  }

  for (const type of ['chrome', 'node', 'electron']) {
    replaceText(`${type}-version`, process.versions[type])
  }
})