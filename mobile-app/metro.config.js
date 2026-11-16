const { getDefaultConfig } = require("expo/metro-config");
const { withNativeWind } = require("nativewind/metro");
const path = require("path");
const fs = require("fs");

const projectRoot = __dirname;
const workspaceRoot = path.resolve(projectRoot, "..");

// 1. Dùng chuẩn Expo để nạp file .env từ thư mục gốc dự án
try {
  require("@expo/env").load(workspaceRoot, { force: true });
} catch (_) {}

// 2. Nạp trực tiếp biến môi trường từ root .env vào process.env
const rootEnvPath = path.resolve(workspaceRoot, ".env");
if (fs.existsSync(rootEnvPath)) {
  try {
    const content = fs.readFileSync(rootEnvPath, "utf8");
    content.split(/\r?\n/).forEach((line) => {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) return;
      const eqIdx = trimmed.indexOf("=");
      if (eqIdx !== -1) {
        const key = trimmed.slice(0, eqIdx).trim();
        let val = trimmed.slice(eqIdx + 1).trim();
        if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
          val = val.slice(1, -1);
        }
        process.env[key] = val;
      }
    });
  } catch (_) {}
}

// 3. Đồng bộ Goong keys sang tiền tố EXPO_PUBLIC_* nếu người dùng viết GOONG_
if (!process.env.EXPO_PUBLIC_GOONG_API_KEY && process.env.GOONG_API_KEY) {
  process.env.EXPO_PUBLIC_GOONG_API_KEY = process.env.GOONG_API_KEY;
}
if (!process.env.EXPO_PUBLIC_GOONG_MAPTILES_KEY && process.env.GOONG_MAPTILES_KEY) {
  process.env.EXPO_PUBLIC_GOONG_MAPTILES_KEY = process.env.GOONG_MAPTILES_KEY;
}

const config = getDefaultConfig(projectRoot);

// Quan sát thư mục gốc để nạp lại khi file .env thay đổi
config.watchFolders = [workspaceRoot];

module.exports = withNativeWind(config, { input: "./src/global.css" });
