import { createRequire } from "module";
import path from "path";
import fs from "fs";

const require = createRequire(import.meta.url);

let app: any;

const prodPath = path.join(process.cwd(), "dist/server.cjs");

if (fs.existsSync(prodPath)) {
  const serverModule = require(prodPath);
  app = serverModule.default || serverModule;
} else {
  // Local development fallback to server.ts
  const localPath = path.join(process.cwd(), "server.ts");
  if (fs.existsSync(localPath)) {
    const serverModule = require(localPath);
    app = serverModule.default || serverModule;
  } else {
    // Ultimate fallback if files are organized differently
    const serverModule = require("../server");
    app = serverModule.default || serverModule;
  }
}

export default app;
