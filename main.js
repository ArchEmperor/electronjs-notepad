// Modules to control application life and create native browser window
const { app, BrowserWindow, Menu, ipcMain,dialog } = require('electron');
const fs = require('fs');
let activePage='index.html';
// Create a menu template
const menuTemplate = [
    {
        label: 'File',
        submenu: [
            {
                label: 'Open',
                async click() {
                    await openNotepad();
                    const file = await openFile();
                    if(file){
                        mainWindow.webContents.send('textLoaded', file.fullPath, file.content);
                    }else {
                        console.log('No file was selected.');
                    }
                }
            },
            {
                label: 'Save',
                click() {
                    if(activePage == 'notepad.html')
                        mainWindow.webContents.send('fileRequest');
                },
                accelerator: 'Ctrl+S',
            },
            {
                label: 'Save As',
                click() {
                    if(activePage == 'notepad.html')
                        mainWindow.webContents.send('fileRequest',"saveAs");
                }
            },
            {
                label: 'Close file',
                async click() {
                    if(activePage == 'notepad.html')
                    {
                        await showSaveDialog();
                        await openIndex();
                    }
                }
            },
            {
                label: 'Quit',
                async click() {
                    if (activePage == 'notepad.html')
                        await showSaveDialog();
                    app.quit();
                }
            }
        ]
    },
    {
        label: 'Edit',
        submenu: [
            {
                label: 'Cut',
                role: 'cut'
            },
            {
                label: 'Copy',
                role: 'copy'
            },
            {
                label: 'Paste',
                role: 'paste'
            }
        ]
    }
];
const path = require('node:path')
let mainWindow;
const menu = Menu.buildFromTemplate(menuTemplate);
const createWindow = async () => {
    mainWindow = new BrowserWindow({
        width: 800,
        height: 600,
        webPreferences: {
            preload: path.join(__dirname, 'preload.js')
        }
    })
    await openIndex();
    // Open the DevTools.
    //mainWindow.webContents.openDevTools()
}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.whenReady().then(async () => {
    await createWindow()

    app.on('activate', () => {
        // On macOS it's common to re-create a window in the app when the
        // dock icon is clicked and there are no other windows open.
        if (BrowserWindow.getAllWindows().length === 0) createWindow()
    })
})

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') app.quit()
})
ipcMain.on('start', async () => {
    await openNotepad();
})
ipcMain.on('fileResponse',async (event, file) => {
    const newFilePath= await saveFile(file);
    if (newFilePath)
        mainWindow.webContents.send('filepathUpdate', newFilePath);
    else
        console.error('File was not saved');
})
ipcMain.on('recentOpen', async (event, filePath) => {
    await openNotepad();
    const file = openFilePath(filePath);
    if (file) {
        mainWindow.webContents.send('textLoaded', file.fullPath, file.content);
    } else {
        console.log('File was not opened.');
    }
})
const openNotepad = async () => {
    mainWindow.webContents.send('changeWindow');
    await mainWindow.loadFile('notepad.html')
    activePage='notepad.html';
    Menu.setApplicationMenu(menu);
}
const openIndex=async () => {
    mainWindow.webContents.send('changeWindow');
    await mainWindow.loadFile('index.html')
    activePage='index.html';
    Menu.setApplicationMenu(menu);
}
async function openFile() {
    const file = await dialog.showOpenDialog(mainWindow, {
        properties: ['openFile']
    });

    if (!file.canceled && file.filePaths.length > 0) {
        const filePath = file.filePaths[0];
        const content = fs.readFileSync(filePath, 'utf8');

        console.log('File opened successfully:', filePath);
        return { fullPath: filePath, content:content };
    } else {
        console.log('File selection was canceled.');
        return null;
    }
}
function openFilePath(path) {
    if (path) {
        const content = fs.readFileSync(path, 'utf8');
        console.log('File opened successfully:', path);
        return { fullPath: path, content:content };
    } else {
        console.log('File was not opened');
        return null;
    }
}
async function saveFile(file) {
    let filePath;
    if(file.openDialog){
        filePath=(await dialog.showSaveDialog(mainWindow, {
            title: 'Save File',
            buttonLabel: 'Save',
            defaultPath: file.filePath
        })).filePath;
    }else filePath=file.filePath;

    if (filePath) {
        fs.writeFileSync(filePath, file.content, 'utf8');
        //console.log('File saved successfully:', file.filePath);
        return filePath;
    } else {
        console.log('File saving was canceled.');
        return null;
    }
}
const showSaveDialog = async () => {
    const result = await dialog.showMessageBox({
        type: 'question',
        buttons: ['Yes', 'No'],
        title: 'Save File',
        message: 'Do you want to save the file?',
    });
    if (result.response === 0) {
        mainWindow.webContents.send('fileRequest');
    }
};