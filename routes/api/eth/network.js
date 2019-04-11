const ethers = require('ethers');

module.exports = (api) => {  
  api.get('/eth/network/connect', (req, res, next) => {
    const network = req.query.network || 'homestead';
    const coin = req.query.coin.toUpperCase();
    const _connect = api.eth._connect(coin, network);

    const retObj = {
      msg: 'success',
      result: _connect,
    };

    res.end(JSON.stringify(retObj));
  });

  api.eth._connect = (coin, network) => {
    if (!api.eth.connect) {
      api.eth.connect = {};
    }
    api.eth.connect[coin] = api.eth.wallet.connect(new ethers.getDefaultProvider(network));
    api.log(`eth connect coin ${coin} network ${network}`, 'eth.connect');
  };

  return api;
};