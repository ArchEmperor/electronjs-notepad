/*window.addEventListener('DOMContentLoaded', () => {
    const replaceText = (selector, text) => {
        const element = document.getElementById(selector)
        if (element) element.innerText = text
    }

    for (const dependency of ['chrome', 'node', 'electron']) {
        replaceText(`${dependency}-version`, process.versions[dependency])
    }
})*/
const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electron', {
    // ipcRenderer: {
    //     send: (channel, data) => ipcRenderer.send(channel, data),
    //     on: (channel, func) => ipcRenderer.on(channel, (event, ...args) => func(...args))
    // }
    ipcRenderer: {
        send: (channel, data) => {
            console.log('Sending data:', data); // Проверка, что данные передаются правильно
            ipcRenderer.send(channel, data);
        },
        on: (channel, func) => {
            ipcRenderer.on(channel, (event, ...args) => {
                console.log('Received data in renderer: ', ...args); // Проверка полученных данных
                func(...args);
            });
        }
    }
});