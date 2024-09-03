const {dialog, BrowserWindow, ipcMain} = require('electron')
const { autoUpdater } = require('electron-updater');

autoUpdater.logger = require("electron-log")
autoUpdater.logger.transports.file.level = "info"

autoUpdater.autoDownload = false

module.exports = () => {
	
	// Start update check
    autoUpdater.checkForUpdates()

    // Listen for download (update) found
    autoUpdater.on('update-available', () => {

        // Prompt user to update
        dialog.showMessageBox({
            type: 'info',
            title: 'Atualização disponível',
            message: 'Uma nova versão do NIOT Desktop está disponível. Deseja atualizar agora?',
            buttons: ['Atualizar', 'Continuar com a versão atual']
        }).then( result => {

            let buttonIndex = result.response

            if( buttonIndex === 0 ) autoUpdater.downloadUpdate()
        })
    })

    // Listen for completed update download
    autoUpdater.on('update-downloaded', () => {

        // Prompt user to quit and install update
        dialog.showMessageBox({
            type: 'info',
            title: 'Instalar atualização agora?',
            message: 'A nova versão do NIOT Desktop está pronta. Sair e instalar agora?',
            buttons: ['Sim', 'Instalar mais tarde']
        }).then( result => {

            let buttonIndex = result.response

            // Update if 'Yes'
            if(buttonIndex === 0) autoUpdater.quitAndInstall()
            
        })
    })

}