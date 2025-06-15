import path from "path";
import fs from "fs";

export function isDev() {
    return process.env.NODE_ENV === 'development';
}

export function getNextSetPath(basePath: string) {
    const cacheFile = path.join("set_cache.txt")
    let setNumber = 1;

    if (fs.existsSync(cacheFile)) {
        const cachedValue = fs.readFileSync(cacheFile, "utf-8").trim();
        if (cachedValue) setNumber = parseInt(cachedValue, 10);
    }

    while (true) {
        const setPath = path.join(basePath, `set${setNumber}`);

        if (!fs.existsSync(setPath)) {
            fs.mkdirSync(setPath, { recursive: true });
            fs.writeFileSync(cacheFile, setNumber.toString(), "utf-8");
            return setPath;
        }

        const files = fs.readdirSync(setPath).filter((file) => file.endsWith(".png"));
        if (files.length < 20) {
            return setPath;
        }

        setNumber++;
        fs.writeFileSync(cacheFile, setNumber.toString(), "utf-8"); 
    }
}
