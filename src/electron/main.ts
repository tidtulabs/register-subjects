import { app, BrowserWindow, session, ipcMain, webContents } from 'electron';
import path from 'path';
import { getNextSetPath, isDev } from './uitl.js';
import fs from 'fs';
import { spawn } from 'child_process';
import treeKill from 'tree-kill';
import { timeStamp } from 'console';

let mainWindow: BrowserWindow | null = null;

app.on('ready', () => {
    mainWindow = new BrowserWindow(
        {
            width: 800,
            height: 600,
            webPreferences: {
                preload: path.join(app.getAppPath(), '/dist-electron/preload.cjs'),
                nodeIntegration: false,
                contextIsolation: true,
                webviewTag: true
            }
        }
    );
    if (isDev()) mainWindow.loadURL('http://localhost:5175');
    else mainWindow.loadFile(path.join(app.getAppPath(), '/dist-react/index.html'));

});
let exePath = ''
if (isDev()) {
    exePath = path.join(app.getAppPath(), "public", "python", "predict_captcha.exe");
} else {
    exePath = path.join(app.getAppPath(), "python", "predict_captcha.exe");
}


const child = spawn(exePath, [],);

let serverUrl = '';

const onData = (data: Buffer) => {
    const message = data.toString();
    console.log(`stdout: ${message}`);
    const match = message.match(/Uvicorn running on (http:\/\/[\d.:]+)/);
    if (match) {
        serverUrl = match[1];
        console.log(`Server started at: ${serverUrl}`);
        console.log("Uvicorn is running remove listener");
        child.stdout.removeAllListeners("data");
    }
};


child.stderr.on("data", onData);

child.stdout.on("data", (data: Buffer) => {
    console.info(`data: ${data.toString()}`);
});

child.on("error", (error) => {
    console.error(`error: ${error.message}`);
});

child.on("close", (code) => {
    console.log(`Process exited with code ${code}`);
});

app.on('window-all-closed', () => {
    if(child.pid)
    treeKill(child.pid);
});
ipcMain.handle("get-webview-cookies", async () => {
    const webviewSession = session.fromPartition("persist:webviewsession");
    const cookies = await webviewSession.cookies.get({});
    return cookies;
});

function base64ToBlob(base64: string, mimeType: string = "image/png") {
    const byteCharacters = atob(base64); // `data:image/png;base64,`
    const byteNumbers = new Array(byteCharacters.length).fill(0).map((_, i) => byteCharacters.charCodeAt(i));
    const byteArray = new Uint8Array(byteNumbers);
    return new Blob([byteArray], { type: mimeType });
}
let i = 0;
ipcMain.handle("capture-region-screenshot", async (_, webContentsId, rect) => {
    try {
        const wc = webContents.fromId(webContentsId);
        if (!wc) throw new Error("❌ not found WebContents!");

        wc.debugger.attach("1.3");

        const { data } = await wc.debugger.sendCommand("Page.captureScreenshot", {
            format: "png",
            captureBeyondViewport: true,
            clip: {
                x: rect.x,
                y: rect.y,
                width: rect.width,
                height: rect.height,
                scale: 1,
            },
        });

        wc.debugger.detach();

        const image = {
            inlineData: {
                data,
                mimeType: "image/png",
            },
        };
        // const result = await model.generateContent(["Reset memory, Only provide the text contained in the captcha image.", image])

        // const captchaText = result.response.text();
        // console.log(captchaText);

        let captchaText = '';
       
        const formData = new FormData();

        const blob = base64ToBlob(data, "image/png");
        formData.append("file", blob, "captcha.png");

        const f = await fetch(`${serverUrl}/predict-captcha`, {
            method: "POST",
            body: formData,
        });
        if (!f.ok) {
            throw new Error(`HTTP error! Status: ${f.status}`);
        }
        const r = await f.json();

        captchaText = r.data?.captcha || "";
        const downloadsPath = app.getPath("downloads");

        const filePath = getNextSetPath(path.join(downloadsPath + "/cnn/captcha"));
         const name = `${captchaText}_${Date.now()}.png`
        fs.writeFileSync(
            path.join(filePath,name),
            Buffer.from(data, "base64")
          );
          
        console.log("Saved in: ", path.join(filePath, name));

        console.log("Captcha:", captchaText);

        return captchaText

    } catch (error) {
        console.error("error", error);
        return null;
    }
});