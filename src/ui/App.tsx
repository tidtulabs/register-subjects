import React, { useEffect, useRef } from 'react'

// Declare the electronAPI property on the window object
declare global {
  interface Window {
    electronAPI: {
      runScript(): void;
      onExecuteScript(arg0: () => void): unknown;
      getWebviewCookies: () => Promise<any>;
    };
  }
}

function App() {
  const [isLogin, setIsLogin] = React.useState(false)
  const [image, setImage] = React.useState('')

  function checkLoginStatus() {
    const webview = document.getElementById("webview-login")
    if (!webview) return;

    webview.addEventListener("did-navigate", (event: any) => {
      console.log("🔍 URL hiện tại:", event.url);

      if (event.url.includes("home_infowebpart") || event.url.includes("/home")) {
        console.log("✅ Đăng nhập thành công!");
        setIsLogin(true);
      }
    });
  }

  useEffect(() => {
    checkLoginStatus();
  }, []);

  async function chooseHocKy() {
    await Promise.allSettled(
      Array.from({ length: 9 }, (_, index) => processWebview(index))
    );
  }

  async function processWebview(index: number) {
    const webview = document.querySelector(`#webview-${index}`);
    if (!webview) return;
    await namHoc(webview);
    await hocKy(webview);
  }

  const namHoc = async (webview: any) => {
    if (!webview) return;

    await webview.executeJavaScript(`
      new Promise((resolve) => {
        const select = document.querySelector(".semester-bg select");
        const semesterDropdown = document.querySelector("#Dr_Semester");
  
        if (!select || !semesterDropdown) return resolve(false);
  
        select.value = "82";
        select.dispatchEvent(new Event("change", { bubbles: true }));
  
        const observer = new MutationObserver((mutations, obs) => {
          if (semesterDropdown.options.length > 1) {
            obs.disconnect();
            resolve(true);
          }
        });
  
        observer.observe(semesterDropdown, { childList: true, subtree: true });
      });
    `);
  };

  const hocKy = async (webview: any) => {
    if (!webview) return;

    await webview.executeJavaScript(`
      new Promise((resolve) => {
        const select = document.querySelector("#Dr_Semester");
        if (!select) return resolve(false);
  
        select.value = "84";
        select.dispatchEvent(new Event("change", { bubbles: true }));
  
        setTimeout(() => {
          document.querySelector("#Button1")?.dispatchEvent(new Event("click", { bubbles: true }));
          resolve(true);
        }, 500)
      });
    `);
  };

  const captureElementScreenshot = async () => {
    const webview = document.getElementById("webview-0") as any;
    if (!webview) {
      console.error("Không tìm thấy webview!");
      return;
    }

    const webContentsId = webview.getWebContentsId?.();
    if (!webContentsId) {
      console.error("Không lấy được WebContents ID!");
      return;
    }

    try {
      // Lấy tọa độ của phần tử cần chụp
      const rect = await webview.executeJavaScript(`
          (function() {
            const el = document.querySelector("#imgCapt");
            if (!el) return null;
            const rect = el.getBoundingClientRect();
            return { 
              x: rect.x + window.scrollX, 
              y: rect.y + window.scrollY, 
              width: rect.width, 
              height: rect.height 
            };
          })();
        `);


      if (!rect) {
        console.error("Không tìm thấy phần tử cần chụp!");
        return;
      }

      console.log("📏 Khu vực chụp:", rect);
      // webview.openDevTools();
     
      const captcha = await (window as any).electronAPI.captureRegionScreenshot(webContentsId, rect);

      if (captcha) {
        await webview.executeJavaScript(`
            (function() {
              const input = document.querySelector("#ctl00_PlaceHolderContentArea_ctl00_ctl01_txtCaptchar")
              if (input) {
                input.value = "${captcha}"; 
               input.dispatchEvent(new Event("input", { bubbles: true })); 
              }
            })();`);
      }
    } catch (error) {
      console.error("❌ Lỗi khi chụp:", error);
    }
  };

  const reloadWebview = () => {
    const webview = document.getElementById("webview-0") as any;
    if (!webview) return;

    webview.reload();
  }
  const submit = () => {
    const webview = document.getElementById("webview-0") as any;
    if (!webview) return;

    webview.executeJavaScript(`
        (function() {
          const button = document.querySelector(".btn-dangky");
          if (button) {
            button.click(); 
  
            // button.dispatchEvent(new MouseEvent("click", { 
            //   bubbles: true, 
            //   cancelable: true 
            // }));
          }
        })();

        (function() {
    // Ghi đè alert để tự động đóng
    window.alert = function(message) {
     // console.log("🔔 Alert detected:", message);
    };

    // // Ghi đè confirm để tự động bấm OK
    // window.confirm = function(message) {
    //  // console.log("🔔 Confirm detected:", message);
    //   return true; // Trả về true để bấm OK
    // };
  })();
      `);
  }

  let id: any = null;
  let count = 0
  const start = () => {
    id = setInterval(
    async () => {
        captureElementScreenshot()
        submit();
      }, 2000
    )
  }
  const stop = () => {
    clearInterval(id);
  }

  return (
    <div className='items-center h-screen'>
      <div className='max-w-5xl flex-col flex'>
        {isLogin ? <div className='flex flex-col gap-2'>
          {Object.keys(Array.from({ length: 1 })).map((_, index) => (
            <div key={index} className="w-4xl aspect-[16/9] border-2 border-indigo-500">
              <webview
                id={`webview-${index}`}
                src="https://mydtu.duytan.edu.vn/sites/index.aspx?p=home_registeredall&semesterid=87&yearid=86"
                className="w-full h-full"
                partition='persist:webviewsession'
              />
            </div>
          ))}
        </div>
          : <div className='w-full'>
            <webview
              id="webview-login"
              src="https://mydtu.duytan.edu.vn/"
              className="w-auto aspect-[16/9]"
              partition='persist:webviewsession'

            />
          </div>}
        <button className='fixed text-white bg-blue-700 hover:bg-blue-800 focus:ring-4 focus:ring-blue-300 font-medium rounded-lg text-sm px-5 py-2.5 me-2 mb-2 dark:bg-blue-600 dark:hover:bg-blue-700 focus:outline-none dark:focus:ring-blue-800' onClick={chooseHocKy}>run script</button>
        <button className='fixed text-white bg-blue-700 hover:bg-blue-800 focus:ring-4 focus:ring-blue-300 font-medium rounded-lg text-sm px-5 py-2.5 me-2 mb-2 dark:bg-blue-600 dark:hover:bg-blue-700 focus:outline-none dark:focus:ring-blue-800 right-0' onClick={captureElementScreenshot}>capture</button>
        <button className='fixed text-white bg-blue-700 hover:bg-blue-800 focus:ring-4 focus:ring-blue-300 font-medium rounded-lg text-sm px-5 py-2.5 me-2 mb-2 dark:bg-blue-600 dark:hover:bg-blue-700 focus:outline-none dark:focus:ring-blue-800 right-40' onClick={reloadWebview}>reload</button>
        <button className='fixed text-white bg-blue-700 hover:bg-blue-800 focus:ring-4 focus:ring-blue-300 font-medium rounded-lg text-sm px-5 py-2.5 me-2 mb-2 dark:bg-blue-600 dark:hover:bg-blue-700 focus:outline-none dark:focus:ring-blue-800 right-80' onClick={start}>start</button>
        <button className='fixed text-white bg-blue-700 hover:bg-blue-800 focus:ring-4 focus:ring-blue-300 font-medium rounded-lg text-sm px-5 py-2.5 me-2 mb-2 dark:bg-blue-600 dark:hover:bg-blue-700 focus:outline-none dark:focus:ring-blue-800 right-120' onClick={stop}>stop</button>
      </div>
    </div>
  )
}

export default App
