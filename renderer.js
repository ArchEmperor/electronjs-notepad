const switchElement = document.getElementById('flexSwitchCheckDefault');
const htmlTag = document.querySelector('html');
const startBtn = document.getElementById('startBtn');
const textarea = document.getElementById('textarea');
const filename = document.getElementById('filename');
const recentFiles = document.getElementById('recent-files');
const MAX_FILES = 6;
let listenersState=false;

const removeEventListeners = () => {
    if(listenersState){
        switchElement?.removeAllListeners()
        startBtn?.removeAllListeners()
        window.electron.ipcRenderer.removeAllListeners()
        textarea?.removeAllListeners();
        listenersState=false;
    }
};
const setupEventListeners = () => {
    switchElement?.addEventListener('change', handleThemeChange);
    startBtn?.addEventListener('click', handleStart);
    window.electron.ipcRenderer.on('changeWindow', removeEventListeners);
    if(textarea){
        window.electron.ipcRenderer.on('textLoaded', handleTextLoaded);
        window.electron.ipcRenderer.on('fileRequest', handleFileSave);
        window.electron.ipcRenderer.on('filepathUpdate', handleFilepathUpdate);
        textarea.addEventListener('keydown', function(event) {
            if (event.key === 'Tab') {
                event.preventDefault();
                const start = this.selectionStart;
                const end = this.selectionEnd;
                this.value = this.value.substring(0, start) + '\t' + this.value.substring(end);
                this.selectionStart = this.selectionEnd = start + 1;
            }
        });
    }
    window.electron.ipcRenderer.send('initialized');
    listenersState=true;
};
const setupLocalStorage = () => {
    handleThemeUpdate();
    if(!switchElement||!recentFiles){
        return;
    }
    renderRecentFiles();
}
const renderRecentFiles = () => {
    const files = getRecentFiles();
    recentFiles.innerHTML = '';

    files.forEach(filePath => {
        const buttonElement = document.createElement('button');
        buttonElement.textContent = filePath;
        buttonElement.classList.add('btn', 'my-1', 'mx-1', 'p-1', 'bg-dark-subtle');
        buttonElement.addEventListener('click', () =>
            window.electron.ipcRenderer.send('recentOpen', filePath)
        );
        recentFiles.appendChild(buttonElement);
    });
};


function getRecentFiles() {
    const files = localStorage.getItem('recent-files');
    return files ? JSON.parse(files) : [];
}
function saveRecentFiles(files) {
    localStorage.setItem('recent-files', JSON.stringify(files));
}
function addRecentFile(filePath) {
    let files = getRecentFiles();
    files = files.filter(file => file !== filePath);
    files.unshift(filePath);
    if (files.length > MAX_FILES) {
        files.pop();
    }
    saveRecentFiles(files);
}

const handleFileSave = (isSaveAs) => {
    const filePath = filename.innerText;
    const content = textarea.value.toString();
    const openDialog =filePath=="untitled.txt"||isSaveAs;
//console.log(`Saving file. Path: ${filePath}, Content: ${content}`);

    if (filePath && content !== undefined) {
        window.electron.ipcRenderer.send('fileResponse', {filePath:filePath, content:content,openDialog:openDialog});
    } else {
        console.error('File path or content is undefined.');
    }
}
const handleThemeChange = () => {
    if (switchElement.checked) {
        handleThemeUpdate('dark');
    } else {
        handleThemeUpdate('light');
    }

};
const handleTextLoaded = (name,text) => {
    //console.log("recieved name:"+name+", text:", text);
    textarea.value = text;
    filename.innerText = name;
    addRecentFile(name);
}
const handleStart = () => {
    window.electron.ipcRenderer.send('start');
};
const handleThemeUpdate = (newTheme) => {
    let theme;
    if(newTheme){
        theme=newTheme;
    }else{
        theme = localStorage.getItem('theme');
        if(!theme){

            theme='light';
        }
        if(theme === 'dark'&&switchElement&&switchElement?.checked !== true) {switchElement.checked = true}
    }
    //console.log('applied '+theme);
    htmlTag.setAttribute("data-bs-theme", theme);
    localStorage.setItem('theme', theme);
};
const handleFilepathUpdate = (newPath) => {
    filename.innerText = newPath;
}
setupEventListeners();
setupLocalStorage();
