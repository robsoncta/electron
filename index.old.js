// Electron  Modules
const { app, BrowserWindow, Menu, Tray, ipcMain } = require('electron')
const isDev = require('electron-is-dev')
const Store = require('electron-store');

// Node Modules
const path = require('path');
var $ = require('jQuery');

// Files
const updater = require('./updater');

// Check if is in development environment
if (isDev) {
  console.log('Running in development');
} else {
  console.log('Running in production');
}

// Check single instance
let isSingleInstance = app.requestSingleInstanceLock()
if (!isSingleInstance) {
  app.quit()
}

// Init store
const store = new Store();

// receive message from index.html 
ipcMain.on('asynchronous-message', (event, arg) => {
  store.set('preferences', arg);

  event.sender.send('first-reply', store.get('preferences') );
  // send message to index.html
  //event.sender.send('asynchronous-reply', 'hello' );
});

ipcMain.on('first-message', (event, arg) => {

  // send message to index.html
  event.sender.send('first-reply', store.get('preferences') );
});






const createWindow = () => {

  // SET Menubar
  var menu = Menu.buildFromTemplate([
    {
      label: 'Version: ' + app.getVersion()
    }
  ])
  Menu.setApplicationMenu(menu); 

  // creating windows
  const win = new BrowserWindow({
    width: 1024,
    height: 600,
    title: "NIOT",
    icon:'favicon.png',
    webPreferences: {
      nodeIntegration: true,
      enableRemoteModule: true,
      devTools: isDev,
    }
  })

  win.loadFile(path.join(__dirname, 'src/html/index.html'))

  if(isDev){
    win.webContents.openDevTools();
  }

  win.on('minimize',function(event){
    event.preventDefault();
    //win.hide();
  });

  win.on('close', function (event) {
    if(!app.isQuiting){
        event.preventDefault();
        //win.hide();
    }
  });

  // Behaviour on second instance for parent process- Pretty much optional
  app.on('second-instance', (event, argv, cwd) => {
    if (win) {
      if (win.isMinimized()) win.restore()
      win.focus()
    }
  })

}


let appIcon = null
app.on('ready', () => {

  // TRAY
  appIcon = new Tray('favicon.png')
  const contextMenu = Menu.buildFromTemplate([
    { label: 'Abrir', click:  function(){
        win.show();
    } },
    { label: 'Fechar', click:  function(){
      app.isQuiting = true;
      app.quit();
    } }
  ]);

  // Make a change to the context menu
  contextMenu.items[1].checked = false

  // Call this again for Linux because we modified the context menu
  appIcon.setContextMenu(contextMenu)

  // ##################################################
  // ##################################################
  // ##################################################

  // Create main window
  createWindow()

  if (!isDev) {
    // Check for update after x seconds
    setTimeout( updater, 1000) //Check update when open
    setInterval( updater, (1000 * 60 * 60 * 8)) // check update each 8h
  }
})




app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow()
  }
})