const { app, BrowserWindow, ipcMain, Menu  } = require('electron');
const path = require('node:path');
import settings from 'electron-settings';
import "../images/appIcon/icon.png"
import "../images/start.png"
import "../images/flag.png"
import contextMenu from 'electron-context-menu';

// Handle creating/removing shortcuts on Windows when installing/uninstalling.
if (require('electron-squirrel-startup')) {
  app.quit();
}

/**@type {BrowserWindow} */
var mainWindow = null;


const appSettings = {
  width: 1024,
  height: 768,
  x: null,
  y: null,
  fullscreen: false
}

function handleMarkerContextMenu (event) {
  //const webContents = event.sender
  //const win = BrowserWindow.fromWebContents(webContents)
  //win.setTitle(title)
  const template = [
    {
      label: 'Добавить маркер перед',
      click: () => { event.sender.send('markerContextMenu-command', 'before') }
    },
    {
      label: 'Добавить маркер после',
      click: () => { event.sender.send('markerContextMenu-command', 'after') }
    },
  ];
  const menu = Menu.buildFromTemplate(template)

  menu.popup();
}

function saveSettings(){
  settings.setSync('size', mainWindow.getSize())
  settings.setSync('position', mainWindow.getPosition())
  settings.setSync('fullscreen', mainWindow.fullScreen)
  //localStorage.setItem('width', mainWindow.getSize()[0])
  //localStorage.setItem('height', mainWindow.getSize()[1])
  //localStorage.setItem('x', mainWindow.getPosition()[0])
  //localStorage.setItem('y', mainWindow.getPosition()[1])
  //localStorage.setItem('fullscreen', mainWindow.fullScreen)
}

function readSettings(){
  const size = settings.getSync('size');
  const position = settings.getSync('position');
  const fullscreen = settings.getSync('fullscreen');

  if (size){
    appSettings.width = size[0]
    appSettings.height = size[1]
  }
  
  if (position){
    appSettings.x = position[0]
    appSettings.y = position[1]
  }

  
  appSettings.fullscreen = fullscreen

  console.log('appSettings', appSettings)
}

const createWindow = () => {
  // Create the browser window.
  mainWindow = new BrowserWindow({
    width: appSettings.width,
    height: appSettings.height,

    x: appSettings.x,
    y: appSettings.y,

    fullscreen: appSettings.fullscreen,

    icon: './src/images/appIcon/icon.png',
    webPreferences: {
      preload: MAIN_WINDOW_PRELOAD_WEBPACK_ENTRY,
      enableRemoteModule: true // <-- Add me
    },
  });

  // and load the index.html of the app.
  mainWindow.loadURL(MAIN_WINDOW_WEBPACK_ENTRY);

  if (!app.isPackaged){
    // Open the DevTools.
    mainWindow.webContents.openDevTools({'mode':"detach"});
  }

  mainWindow.on('close', e=>{
    saveSettings();
  })

};

let mainMenuTemplate = [{
    role: 'help',
    submenu: [
      {
        label: 'Консоль',
        click: async () => {
          mainWindow.webContents.openDevTools({'mode':"detach"});
        }
      }
    ]
  }];

const menu = Menu.buildFromTemplate(mainMenuTemplate)
Menu.setApplicationMenu(menu)

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.whenReady().then(() => {

  readSettings();

  console.log('Приложение готово, создаем окно')

  ipcMain.on('markerContextMenu', handleMarkerContextMenu)
  //ipcMain.handle('markerContextMenu', handleMarkerContextMenu)

  createWindow();

  console.log('Окно создано')

  // On OS X it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on('window-all-closed', () => {

  if (process.platform !== 'darwin') {
    app.quit();
  }
});

// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and import them here.
