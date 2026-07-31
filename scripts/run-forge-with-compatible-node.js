const fs = require('node:fs');
const fsp = require('node:fs/promises');
const https = require('node:https');
const os = require('node:os');
const path = require('node:path');
const { spawnSync } = require('node:child_process');

const COMPATIBLE_NODE_VERSION = '22.20.0';
const MIN_INCOMPATIBLE_MAJOR = 24;

function getCurrentNodeMajor() {
  return Number.parseInt(process.versions.node.split('.')[0], 10);
}

function getNodeDistName() {
  if (process.platform !== 'win32') {
    throw new Error(`Unsupported platform for compatibility wrapper: ${process.platform}`);
  }

  if (process.arch !== 'x64') {
    throw new Error(`Unsupported architecture for compatibility wrapper: ${process.arch}`);
  }

  return `node-v${COMPATIBLE_NODE_VERSION}-win-x64`;
}

function getCacheRoot() {
  const localAppData = process.env.LOCALAPPDATA;
  if (localAppData) {
    return path.join(localAppData, 'RallyLoggerLite', 'tools');
  }

  return path.join(os.homedir(), '.rallyloggerlite-tools');
}

function downloadFile(url, targetPath) {
  return new Promise((resolve, reject) => {
    const fileStream = fs.createWriteStream(targetPath);

    const request = https.get(url, (response) => {
      if (response.statusCode >= 300 && response.statusCode < 400 && response.headers.location) {
        fileStream.close();
        fs.rmSync(targetPath, { force: true });
        resolve(downloadFile(response.headers.location, targetPath));
        return;
      }

      if (response.statusCode !== 200) {
        fileStream.close();
        fs.rmSync(targetPath, { force: true });
        reject(new Error(`Failed to download ${url}: HTTP ${response.statusCode}`));
        return;
      }

      response.pipe(fileStream);
      fileStream.on('finish', () => {
        fileStream.close(resolve);
      });
    });

    request.on('error', (error) => {
      fileStream.close();
      fs.rmSync(targetPath, { force: true });
      reject(error);
    });

    fileStream.on('error', (error) => {
      request.destroy(error);
    });
  });
}

function extractZip(zipPath, destinationDir) {
  const command = [
    "$ProgressPreference = 'SilentlyContinue'",
    `Expand-Archive -LiteralPath '${zipPath.replace(/'/g, "''")}' -DestinationPath '${destinationDir.replace(/'/g, "''")}' -Force`,
  ].join('; ');

  const result = spawnSync('powershell.exe', ['-NoProfile', '-ExecutionPolicy', 'Bypass', '-Command', command], {
    stdio: 'inherit',
  });

  if (result.status !== 0) {
    process.exit(result.status || 1);
  }
}

async function ensureCompatibleNode() {
  const distName = getNodeDistName();
  const cacheRoot = getCacheRoot();
  const zipPath = path.join(cacheRoot, `${distName}.zip`);
  const extractRoot = cacheRoot;
  const nodeExe = path.join(extractRoot, distName, 'node.exe');

  if (fs.existsSync(nodeExe)) {
    return nodeExe;
  }

  await fsp.mkdir(cacheRoot, { recursive: true });

  if (!fs.existsSync(zipPath)) {
    const url = `https://nodejs.org/dist/v${COMPATIBLE_NODE_VERSION}/${distName}.zip`;
    console.log(`Downloading Node ${COMPATIBLE_NODE_VERSION} for Electron Forge compatibility...`);
    await downloadFile(url, zipPath);
  }

  console.log(`Extracting Node ${COMPATIBLE_NODE_VERSION}...`);
  extractZip(zipPath, extractRoot);

  if (!fs.existsSync(nodeExe)) {
    throw new Error(`Compatible Node binary was not found after extraction: ${nodeExe}`);
  }

  return nodeExe;
}

async function main() {
  const forgeArgs = process.argv.slice(2);
  const forgeCliPath = path.resolve(__dirname, '..', 'node_modules', '@electron-forge', 'cli', 'dist', 'electron-forge.js');

  if (!fs.existsSync(forgeCliPath)) {
    throw new Error(`Electron Forge CLI not found: ${forgeCliPath}`);
  }

  let nodePath = process.execPath;
  if (process.platform === 'win32' && getCurrentNodeMajor() >= MIN_INCOMPATIBLE_MAJOR) {
    nodePath = await ensureCompatibleNode();
  }

  const result = spawnSync(nodePath, [forgeCliPath, ...forgeArgs], {
    stdio: 'inherit',
    cwd: path.resolve(__dirname, '..'),
    env: process.env,
  });

  if (result.error) {
    throw result.error;
  }

  process.exit(result.status || 0);
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});