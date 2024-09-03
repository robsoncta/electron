// Electron Modules
const { app, dialog, BrowserWindow, Tray, Menu, ipcMain } = require('electron');
const isDev = require('electron-is-dev')
const Store = require('electron-store');
const path = require('path');
const updater = require('./updater');
const fetch = require("fetch");
const axios = require("axios");
const https = require('https');
const rootCas = require('ssl-root-cas').create();

rootCas.addFile(path.resolve(__dirname, 'intermediate.pem'));
const httpsAgent = new https.Agent({ca: rootCas});

// Check if is in development environment
if (isDev) {
	console.log('Running in development');
} else {
	console.log('Running in production');
}

// SSL/TSL: this is the self signed certificate support
app.on('certificate-error', (event, webContents, url, error, certificate, callback) => {
    // On certificate error we disable default behaviour (stop loading the page)
    // and we then say "it is all fine - true" to the callback
    event.preventDefault();
    callback(true);
});


// #####################################################################################
// #####################################################################################
// #####################################################################################


// Close second instance
let isSingleInstance = app.requestSingleInstanceLock()
if (!isSingleInstance) {
	// app.quit()
}

//Main Window function
const createWindow = () => {

	let width = 1580;

	if (!isDev) {
		width = 1024;

		// Check for update after x seconds
		setTimeout(updater, 1000) //Check update when open
		setInterval(updater, (1000 * 60 * 60 * 8)) // check update each 8h
	}

	// SET Menubar
	var menu = Menu.buildFromTemplate([
		{
			label: 'Version: ' + app.getVersion(),
		}
	])
	Menu.setApplicationMenu(menu);

	// Create the browser window.
	mainWindow = new BrowserWindow({
		width: width,
		height: 550,
		title: "NIOT Desktop",
		icon: 'favicon.png',
		webPreferences: {
			contextIsolation: false,
			nodeIntegration: true,
			devTools: isDev
		}
	});

	// and load the index.html of the app.
	mainWindow.loadFile(path.join(__dirname, 'html/index.html'));

	//Open devTools when dev environment
	if (isDev) {
		mainWindow.webContents.openDevTools();
	}

	// Minimize
	mainWindow.on('minimize', function (event) {
		event.preventDefault();
	});

	// Close confirm
	mainWindow.on('close', function (event) {
		if (!app.isQuiting) {
			event.preventDefault();

			dialog.showMessageBox({
				type: 'info',
				title: 'Fechar NIOT Desktop?',
				message: 'Tem certeza que deseja fechar? O aplicativo não irá mais sincronizar com o servidor.',
				buttons: ['Yes', 'No']
			}).then(result => {

				let buttonIndex = result.response

				if (buttonIndex === 0) {
					app.isQuiting = true;
					app.quit();
				}

			})
		}
	});

	// Behaviour on second instance for parent process- Pretty much optional
	app.on('second-instance', (event, argv, cwd) => {
		if (mainWindow) {
			if (mainWindow.isMinimized()) mainWindow.restore()
			mainWindow.focus()
		}
	})

};

// TRAY
let appIcon = null
app.whenReady().then(() => {

	appIcon = new Tray('favicon.png')

	//Tray structure
	const contextMenu = Menu.buildFromTemplate([
		{
			label: 'Abrir', click: function () {
				mainWindow.show();
			}
		},
		{
			label: 'Fechar', click: function () {
				app.isQuiting = true;
				app.quit();
			}
		}
	]);

	// Make a change to the context menu
	// contextMenu.items[1].checked = false

	// Call this again for Linux because we modified the context menu
	appIcon.setContextMenu(contextMenu)
})

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.on('ready', createWindow);

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on('window-all-closed', () => {
	if (process.platform !== 'darwin') {
		app.quit();
	}
});

app.on('activate', () => {
	// On OS X it's common to re-create a window in the app when the
	// dock icon is clicked and there are no other windows open.
	if (BrowserWindow.getAllWindows().length === 0) {
		createWindow();
	}
});

// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and import them here.

// #####################################################################################
// #####################################################################################
// #####################################################################################
// #####################################################################################

const store = new Store();

// receive message from index.html -> to store preferences
ipcMain.on('store-preferences', (event, arg) => {
	store.set('preferences', arg);

	// send message to index.html
	event.sender.send('index-preferences-reply', store.get('preferences'));
});

ipcMain.on('get-preferences', (event, arg) => {

	// send message to index.html
	event.sender.send('index-preferences-reply', store.get('preferences'));
});


// #####################################################################################
// #####################################################################################

let preferences = store.get('preferences');

// let niotAPI = 'https://desk.niot.com.br/';
// let secureIdAPI = 'https://localhost:30443/';

// let cert_file = fs.readFileSync("./ssl/my_self_signed_certificate.crt")
// const agent = new https.Agent({
//     requestCert: true,
//     rejectUnauthorized: false,
//     cert: cert_file
// });
// const options = {
//     url: niotAPI,  // <---this is  a fake ip do not bother
//     method: "GET",
//     httpsAgent : agent,
//     headers: {
//         'Accept': 'application/json',
//         'Content-Type': 'application/txt;charset=UTF-8'
//     },
//     data: {}
// };

// const BackendProcessing = () => {
	
// 	setInterval(function(){
		
// 		//login NIOT API
// 		axios(options)
// 		.then(function (response) {
// 			// handle success
// 			console.log('Success');
// 		})
// 		.catch(function (error) {
// 			// handle error
// 			console.log(error);
// 		})
// 		.then(function () {
// 			// always executed
// 			console.log('Always');
// 		});

// 		//========================
// 		//Login SecureID API

		
// 	}, (5000))
	
// };

// app.on('ready', BackendProcessing);

//Monitor
// async function monitor() {
// 	let response = await axios.get(preferences.serverAddress + "/api/access/monitor?areas=&events=&limite=15&mode=loop&modevalue=&parkings=&time=", { httpsAgent }); //Monitor URL
	
// 	if (response.status == 502) {
// 		// Status 502 is a connection timeout error,
// 		// may happen when the connection was pending for too long,
// 		// and the remote server or a proxy closed it
// 		// let's reconnect
// 		await monitor();
// 	} else if (response.status != 200) {
// 		// An error - let's show it
// 		console.log(response.statusText);

// 		// Reconnect in ten seconds
// 		await new Promise(resolve => setTimeout(resolve, 10000));

// 		await monitor();
// 	} else {
// 		// Get and show the message
// 		let message = await response.text();
// 		monitorInteraction(message);

// 		// Call monitor() again to get the next message
// 		await monitor();
// 	}
// }

// function monitorInteraction(message){

// 	//get in
// 	if(message.code == 1){
// 		//send to api, log access of user X, get in the build Y, at ZZ:WW time
// 	}

// 	//get out
// 	if(message.code == 2){
// 		//send to api, log access of user X, get out the build Y, at ZZ:WW time
// 	}

// 	//get in refused -> out of time
// 	if(message.code == 4){
// 		//send to api, log access of user X, get in the build Y, at ZZ:WW time, but refused by time
// 	}

// }

//Run monitor when ready
// app.on('ready', monitor);