const path = require('path');
const fixPath = require('fix-path');
const os = require('os');

const pathsAgama = () => {
  switch (os.platform()) {
    case 'darwin':
      fixPath();
      return `${process.env.HOME}/Library/Application Support/Agama`;
      break;

    case 'linux':
      return `${process.env.HOME}/.agama`;
      break;

    case 'win32':
      const agamaDir = `${process.env.APPDATA}/Agama`;
      return path.normalize(agamaDir);
      break;
  }
};

const pathsDaemons = (api) => {
  if (!api) api = {};

  switch (os.platform()) {
    case 'darwin':
      fixPath();
      api.agamaTestDir = `${process.env.HOME}/Library/Application Support/Agama/test`,
      api.komododBin = path.join(__dirname, '../../assets/bin/osx/komodod'),
      api.komodocliBin = path.join(__dirname, '../../assets/bin/osx/komodo-cli'),
      api.komodocliDir = path.join(__dirname, '../../assets/bin/osx'),
      api.komodoDir = api.appConfig && api.appConfig.native.dataDir.length ? api.appConfig.native.dataDir : `${process.env.HOME}/Library/Application Support/Komodo`,
      api.zcashdBin = '/Applications/ZCashSwingWalletUI.app/Contents/MacOS/zcashd',
      api.zcashcliBin = '/Applications/ZCashSwingWalletUI.app/Contents/MacOS/zcash-cli',
      api.zcashDir = `${process.env.HOME}/Library/Application Support/Zcash`,
      api.zcashParamsDir = `${process.env.HOME}/Library/Application Support/ZcashParams`,
      api.chipsBin = path.join(__dirname, '../../assets/bin/osx/chipsd'),
      api.chipscliBin = path.join(__dirname, '../../assets/bin/osx/chips-cli'),
      api.chipsDir = `${process.env.HOME}/Library/Application Support/Chips`,
      api.coindRootDir = path.join(__dirname, '../../assets/bin/osx/dex/coind'),
      api.mmBin = path.join(__dirname, '../../node_modules/marketmaker/bin/darwin/x64/marketmaker');
      return api;
      break;

    case 'linux':
      api.agamaTestDir = `${process.env.HOME}/.agama/test`,
      api.komododBin = path.join(__dirname, '../../assets/bin/linux64/komodod'),
      api.komodocliBin = path.join(__dirname, '../../assets/bin/linux64/komodo-cli'),
      api.komodocliDir = path.join(__dirname, '../../assets/bin/linux64'),
      api.komodoDir = api.appConfig && api && api.appConfig.native.dataDir.length ? api.appConfig.native.dataDir : `${process.env.HOME}/.komodo`,
      api.zcashParamsDir = `${process.env.HOME}/.zcash-params`,
      api.chipsBin = path.join(__dirname, '../../assets/bin/linux64/chipsd'),
      api.chipscliBin = path.join(__dirname, '../../assets/bin/linux64/chips-cli'),
      api.chipsDir = `${process.env.HOME}/.chips`,
      api.coindRootDir = path.join(__dirname, '../../assets/bin/linux64/dex/coind'),
      api.mmBin = path.join(__dirname, '../../node_modules/marketmaker/bin/linux/x64/marketmaker');
      return api;
      break;

    case 'win32':
      api.agamaTestDir = `${process.env.APPDATA}/Agama/test`;
      api.agamaTestDir = path.normalize(api.agamaTestDir);
      api.komododBin = path.join(__dirname, '../../assets/bin/win64/komodod.exe'),
      api.komododBin = path.normalize(api.komododBin),
      api.komodocliBin = path.join(__dirname, '../../assets/bin/win64/komodo-cli.exe'),
      api.komodocliBin = path.normalize(api.komodocliBin),
      api.komodocliDir = path.join(__dirname, '../../assets/bin/win64'),
      api.komodocliDir = path.normalize(api.komodocliDir),
      api.komodoDir = api.appConfig && api && api.appConfig.native.dataDir.length ? api.appConfig.native.dataDir : `${process.env.APPDATA}/Komodo`,
      api.komodoDir = path.normalize(api.komodoDir);
      api.chipsBin = path.join(__dirname, '../../assets/bin/win64/chipsd.exe'),
      api.chipsBin = path.normalize(api.chipsBin),
      api.chipscliBin = path.join(__dirname, '../../assets/bin/win64/chips-cli.exe'),
      api.chipscliBin = path.normalize(api.chipscliBin),
      api.chipsDir = `${process.env.APPDATA}/Chips`,
      api.chipsDir = path.normalize(api.chipsDir);
      api.zcashParamsDir = `${process.env.APPDATA}/ZcashParams`;
      api.zcashParamsDir = path.normalize(api.zcashParamsDir);
      api.coindRootDir = path.join(__dirname, '../../assets/bin/osx/dex/coind');
      api.coindRootDir = path.normalize(api.coindRootDir);
      api.mmBin = path.join(__dirname, '../../node_modules/marketmaker/bin/win32/x64/marketmaker.exe');
      api.mmBin = path.normalize(api.mmBin);
      return api;
      break;
  }
}

module.exports = {
  pathsAgama,
  pathsDaemons,
};