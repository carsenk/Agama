const bitcoinJS = require('bitcoinjs-lib');
const bitcoinJSForks = require('bitcoinforksjs-lib');
const bitcoinZcash = require('bitgo-utxo-lib');
const bitcoinPos = require('bitcoinjs-lib-pos');

// merge into agama-wallet-lib

module.exports = (api) => {
  // utxo split 1 -> 1, multiple outputs
  api.post('/electrum/createrawtx-split', (req, res, next) => {
    if (api.checkToken(req.body.token)) {
      const wif = req.body.payload.wif;
      const utxo = req.body.payload.utxo;
      const targets = req.body.payload.targets;
      const network = req.body.payload.network.toLowerCase();
      const change = req.body.payload.change;
      const outputAddress = req.body.payload.outputAddress;
      const changeAddress = req.body.payload.changeAddress;

      let key = api.isZcash(network) ? bitcoinZcash.ECPair.fromWIF(wif, api.getNetworkData(network)) : bitcoinJS.ECPair.fromWIF(wif, api.getNetworkData(network));
      let tx;

      // console.log(key.toWIF());

      if (api.isZcash(network) &&
          api.getNetworkData(network).overwinter) {
        tx = new bitcoinZcash.TransactionBuilder(api.getNetworkData(network));
      } else if (api.isPos(network)) {
        tx = new bitcoinPos.TransactionBuilder(api.getNetworkData(network));
      } else {
        tx = new bitcoinJS.TransactionBuilder(api.getNetworkData(network));
      }

      api.log('buildSignedTx', 'spv.createrawtx');
      api.log(`buildSignedTx pub key ${key.getAddress().toString()}`, 'spv.createrawtx');

      for (let i = 0; i < utxo.length; i++) {
        tx.addInput(utxo[i].txid, utxo[i].vout);
      }

      for (let i = 0; i < targets.length; i++) {
        if (api.isPos(network)) {
          tx.addOutput(
            outputAddress,
            Number(targets[i]),
            api.getNetworkData(network)
          );
        } else {
          tx.addOutput(outputAddress, Number(targets[i]));
        }
      }
      
      if (Number(change) > 0) {
        if (api.isPos(network)) {
          tx.addOutput(
            changeAddress,
            Number(change),
            api.getNetworkData(network)
          );
        } else {
          api.log(`change ${change}`, 'spv.createrawtx');
          tx.addOutput(changeAddress, Number(change));
        }
      }
      
      if (network === 'komodo' ||
          network === 'KMD') {
        const _locktime = Math.floor(Date.now() / 1000) - 777;
        tx.setLockTime(_locktime);
        api.log(`kmd tx locktime set to ${_locktime}`, 'spv.createrawtx');
      }

      let versionNum;
      if ((utxo[0].currentHeight >= 419200 && network === 'zec') || 
          (utxo[0].currentHeight >= 227520 && network === 'vrsc')){
        versionNum = 4;
      } else {
        if (network === 'zec') {
          versionNum = 3;
        } else {
          versionNum = 1;
        }
      }
  
      if (versionNum) {
        tx.setVersion(versionNum);
      }
      api.log('version set');
      
      for (let i = 0; i < utxo.length; i++) {
        if (api.isPos(network)) {
          tx.sign(
            api.getNetworkData(network),
            i,
            key
          );
        } else {
          if (network === 'zec' ||
              network === 'vrsc') {
            tx.sign(i, key, '', null, utxo[i].value || utxo[i].amountSats);
          } else {
            tx.sign(i, key);
          }
        }
      }

      const rawtx = tx.build().toHex();

      const retObj = {
        msg: 'success',
        result: rawtx,
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