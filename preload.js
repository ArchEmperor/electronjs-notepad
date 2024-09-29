const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electron', {
    ipcRenderer: {
        send: (channel, data) => {
            //console.log('Sending data:', data); // Проверка, что данные передаются правильно
            ipcRenderer.send(channel, data);
        },
        on: (channel, func) => {
            ipcRenderer.on(channel, (event, ...args) => {
                //console.log('Received data in renderer: ', ...args); // Проверка полученных данных
                func(...args);
            });
        }
    }
});