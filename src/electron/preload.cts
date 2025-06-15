const { contextBridge, ipcRenderer } = require("electron")

contextBridge.exposeInMainWorld("electronAPI", {
    getWebviewCookies: () => ipcRenderer.invoke("get-webview-cookies"),
    onExecuteScript: (callback:Function) => ipcRenderer.on("execute-script", callback),
    captureRegionScreenshot: (webContentsId: number, rect: { x: number; y: number; width: number; height: number }) =>
        ipcRenderer.invoke("capture-region-screenshot", webContentsId, rect),
    });