const sha256 = require('js-sha256');
const buggySha256 = require('sha256');
const bip39 = require('bip39');
const crypto = require('crypto');
const bigi = require('bigi');
const bitcoinZcash = require('bitgo-utxo-lib');
const bitcoin = require('bitcoinjs-lib');
const bs58check = require('bs58check');
const wif = require('wif');
const {
  seedToPriv,
  getAddressVersion,
  addressVersionCheck,
  seedToWif,
  wifToWif,
  fromWif,
  stringToWif,
} = require('agama-wallet-lib/src/keys');
const networks = require('agama-wallet-lib/src/bitcoinjs-networks');

module.exports = (api) => {
  api.wifToWif = (wif, network) => {
    const _network = api.getNetworkData(network.toLowerCase());
    const key = stringToWif(wif, _network, true);

    return {
      pub: key.pub,
      priv: key.priv,
      pubHex: key.pubHex,
      fromWif: fromWif(wif, _network),
    };
  }

  api.seedToWif = (seed, network, iguana) => {
    const _network = network.hasOwnProperty('pubKeyHash') ? network : api.getNetworkData(network.toLowerCase());
    return stringToWif(seed, _network, true);
  }

  api.get('/electrum/wiftopub', (req, res, next) => {
    if (api.checkToken(req.query.token)) {
      const _network = api.electrumJSNetworks[req.query.coin.toLowerCase()];
      let key = _network.isZcash ? new bitcoinZcash.ECPair.fromWIF(req.query.wif, _network, true) : new bitcoin.ECPair.fromWIF(req.query.wif, _network, true);

      keys = {
        priv: key.toWIF(),
        pub: key.getAddress(),
        pubHex: key.getPublicKeyBuffer().toString('hex'),
        fromWif: fromWif(key.toWIF(), _network),
      };

      const retObj = {
        msg: 'success',
        result: {
          keys,
        },
      };

      res.end(JSON.stringify(retObj));
    } else {
      const retObj = {
        msg: 'error',
        result: 'unauthorized access',
      };

      res.end(JSON.stringify(retObj));
    }
  });

  api.get('/electrum/pubkey/check', (req, res, next) => {
    if (api.checkToken(req.query.token)) {
      const address = api.pubkeyToAddress(req.query.pubkey, req.query.coin); 
      
      if (address) {
        const retObj = {
          msg: 'success',
          result: {
            pubkey: req.query.pubkey,
            address,            
          },
        };

        res.end(JSON.stringify(retObj));
      } else {
        const retObj = {
          msg: 'error',
          result: 'wrong pubkey or coin param',
        };

        res.end(JSON.stringify(retObj));
      }
    } else {
      const retObj = {
        msg: 'error',
        result: 'unauthorized access',
      };

      res.end(JSON.stringify(retObj));
    }
  });

  api.post('/electrum/seedtowif', (req, res, next) => {
    if (api.checkToken(req.body.token)) {
      const keys = api.seedToWif(
        req.body.seed,
        req.body.network.toLowerCase(),
        req.body.iguana
      );

      const retObj = {
        msg: 'success',
        result: {
          keys,
        },
      };

      res.end(JSON.stringify(retObj));
    } else {
      const retObj = {
        msg: 'error',
        result: 'unauthorized access',
      };

      res.end(JSON.stringify(retObj));
    }
  });

  api.get('/electrum/seedtowif', (req, res, next) => {
    if (api.checkToken(req.query.token)) {
      const keys = api.seedToWif(
        req.query.seed,
        req.query.network.toLowerCase(),
        req.query.iguana
      );

      const retObj = {
        msg: 'success',
        result: {
          keys,
        },
      };

      res.end(JSON.stringify(retObj));
    } else {
      const retObj = {
        msg: 'error',
        result: 'unauthorized access',
      };

      res.end(JSON.stringify(retObj));
    }
  });

  api.getCoinByPub = (address, coin) => {
    const _skipNetworks = [
      'btc',
      'crw',
      'dgb',
      'arg',
      'zec',
      'nmc',
      'ltc',
      'vtc',
      'via',
      'fair',
      'doge',
      'kmd',
      'mona',
    ];

    try {
      const _b58check = api.electrumJSNetworks[coin.toLowerCase()].isZcash ? bitcoinZcash.address.fromBase58Check(address) : bitcoin.address.fromBase58Check(address);
      let _coin = [];

      for (let key in api.electrumJSNetworks) {
        if (_b58check.version === api.electrumJSNetworks[key].pubKeyHash &&
            !_skipNetworks.find((item) => { return item === key ? true : false })) {
          _coin.push(key);
        }
      }

      if (_coin.length) {
        return {
          coin: _coin,
          version: _b58check.version,
        };
      } else {
        return 'Unable to find matching coin version';
      }
    } catch (e) {
      return 'Invalid pub address';
    }
  };

  api.get('/electrum/keys/addressversion', (req, res, next) => {
    const retObj = {
      msg: 'success',
      result: getAddressVersion(req.query.address),
    };

    res.end(JSON.stringify(retObj));
  });

  api.get('/electrum/keys/validateaddress', (req, res, next) => {
    const retObj = {
      msg: 'success',
      result: addressVersionCheck(networks[req.query.network.toLowerCase()] || networks.kmd, req.query.address),
    };

    res.end(JSON.stringify(retObj));
  });

  api.post('/electrum/keys', (req, res, next) => {
    if (api.checkToken(req.body.token)) {
      let _matchingKeyPairs = 0;
      let _totalKeys = 0;
      let _electrumKeys = {};
      let _seed = req.body.seed;
      let _wifError = false;

      if (api.seed === _seed) {
        _seed = seedToPriv(_seed, 'btc');
        
        for (let key in api.electrumCoins) {
          if (key !== 'auth') {
            let isWif = false;
            let priv;
            let pub;

            try {
              bs58check.decode(_seed);
              isWif = true;
            } catch (e) {}

            const _network = api.getNetworkData(key);
            
            if (isWif) {
              try {
                const _key = _network.isZcash ? bitcoinZcash.ECPair.fromWIF(_seed, _network, true) : bitcoin.ECPair.fromWIF(_seed, _network, true);
                priv = _key.toWIF();
                pub = _key.getAddress();

                _electrumKeys[key] = {
                  priv,
                  pub,
                };
              } catch (e) {
                _wifError = true;
                break;
              }
            } else {
              const _keys = api.seedToWif(_seed, _network, req.body.iguana);
              
              _electrumKeys[key] = {
                priv: _keys.priv,
                pub: _keys.pub,
              };
            }
          }
        }

        if (api.eth.wallet &&
            api.eth.wallet.signingKey) {
          for (let key in api.eth.coins) {
            _electrumKeys[key] = {
              pub: api.eth.wallet.signingKey.address,
              priv: api.eth.wallet.signingKey.privateKey,
            };
          }
        }

        const retObj = {
          msg: Object.keys(_electrumKeys).length ? 'success' : 'error',
          result: Object.keys(_electrumKeys).length ? { keys: _electrumKeys, seed: api.seed } : false,
        };

        res.end(JSON.stringify(retObj));
      } else {
        const retObj = {
          msg: 'error',
          result: false,
        };
  
        res.end(JSON.stringify(retObj));
      }
    } else {
      const retObj = {
        msg: 'error',
        result: 'unauthorized access',
      };

      res.end(JSON.stringify(retObj));
    }
  });

  api.getSpvFees = () => {
    let _fees = {};

    for (let key in api.electrumServers) {
      if (api.electrumServers[key].txfee) {
        _fees[key.toUpperCase()] = api.electrumServers[key].txfee;
      }
    }

    return _fees;
  };

  api.post('/electrum/seed/bip39/match', (req, res, next) => {
    if (api.checkToken(req.body.token)) {
      const seed = bip39.mnemonicToSeed(req.body.seed);
      const hdMaster = bitcoin.HDNode.fromSeedBuffer(seed, api.electrumJSNetworks.kmd);
      const matchPattern = req.body.match;
      const _defaultAddressDepth = req.body.addressdepth;
      const _defaultAccountCount = req.body.accounts;
      let _addresses = [];
      let _matchingKey;

      for (let i = 0; i < _defaultAccountCount; i++) {
        for (let j = 0; j < 1; j++) {
          for (let k = 0; k < _defaultAddressDepth; k++) {
            const _key = hdMaster.derivePath(`m/44'/141'/${i}'/${j}/${k}`);

            if (_key.keyPair.getAddress() === matchPattern) {
              _matchingKey = {
                pub: _key.keyPair.getAddress(),
                priv: _key.keyPair.toWIF(),
              };
            }
          }
        }
      }

      const retObj = {
        msg: 'success',
        result: _matchingKey ? _matchingKey : 'address is not found',
      };

      res.end(JSON.stringify(retObj));
    } else {
      const retObj = {
        msg: 'error',
        result: 'unauthorized access',
      };

      res.end(JSON.stringify(retObj));
    }
  });

  return api;
};