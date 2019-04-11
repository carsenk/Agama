const bitcoinJS = require('bitcoinjs-lib');
const bitcoinJSForks = require('bitcoinforksjs-lib');
const bitcoinZcash = require('bitcoinjs-lib-zcash');
const bitcoinZcashSapling = require('bitgo-utxo-lib');
const bitcoinPos = require('bitcoinjs-lib-pos');
const bitcoinjsNetworks = require('agama-wallet-lib/src/bitcoinjs-networks');

// merge into agama-wallet-lib

module.exports = (api) => {
  // utxo split 1 -> 1, multiple outputs
  api.post('/electrum/createrawtx-split', (req, res, next) => {
    if (api.checkToken(req.body.token)) {
      const wif = req.body.payload.wif;
      const utxo = req.body.payload.utxo;
      const targets = req.body.payload.targets;
      const change = req.body.payload.change;
      const outputAddress = req.body.payload.outputAddress;
      const changeAddress = req.body.payload.changeAddress;      
      const network = bitcoinjsNetworks[req.body.payload.network.toLowerCase()] || bitcoinjsNetworks.kmd;

      let key = network && network.isZcash ? bitcoinZcash.ECPair.fromWIF(wif, network) : bitcoinJS.ECPair.fromWIF(wif, network);
      let tx;

      if (network.isZcash &&
          !network.sapling) {
        tx = new bitcoinZcash.TransactionBuilder(network);
      } else if (
        network.isZcash &&
        network.sapling &&
        ((network.saplingActivationTimestamp && Math.floor(Date.now() / 1000) > network.saplingActivationTimestamp) ||
        (network.saplingActivationHeight && utxo[0].currentHeight > network.saplingActivationHeight))
      ) {    
        tx = new bitcoinZcashSapling.TransactionBuilder(network);
      } else if (api.isPos(network)) {
        tx = new bitcoinPos.TransactionBuilder(network);
      } else {
        tx = new bitcoinJS.TransactionBuilder(network);
      }

      api.log('buildSignedTx', 'spv.createrawtx');
      api.log(`buildSignedTx pub key ${key.getAddress().toString()}`, 'spv.createrawtx');

      for (let i = 0; i < utxo.length; i++) {
        tx.addInput(utxo[i].txid, utxo[i].vout);
      }

      for (let i = 0; i < targets.length; i++) {
        if (network &&
            network.isPos) {
          tx.addOutput(
            outputAddress,
            Number(targets[i]),
            network
          );
        } else {
          tx.addOutput(outputAddress, Number(targets[i]));
        }
      }
      
      if (Number(change) > 0) {
        if (network &&
            network.isPos) {
          tx.addOutput(
            changeAddress,
            Number(change),
            network
          );
        } else {
          api.log(`change ${change}`, 'spv.createrawtx');
          tx.addOutput(changeAddress, Number(change));
        }
      }

      if (network.forkName &&
          network.forkName === 'btg') {
        tx.enableBitcoinGold(true);
        tx.setVersion(2);
      } else if (
        network.forkName &&
        network.forkName === 'bch'
      ) {
        tx.enableBitcoinCash(true);
        tx.setVersion(2);
      } else if (network.sapling) {
        let versionNum;

        if ((network.saplingActivationHeight && utxo[0].currentHeight >= network.saplingActivationHeight) ||
            (network.saplingActivationTimestamp && Math.floor(Date.now() / 1000) > network.saplingActivationTimestamp)) {
          versionNum = 4;
        } else {
          versionNum = 1;
        }
      
        if (versionNum) {
          tx.setVersion(versionNum);
        }
      }

      if (network.kmdInterest) {
        const _locktime = Math.floor(Date.now() / 1000) - 777;
        tx.setLockTime(_locktime);
      }
      
      for (let i = 0; i < utxo.length; i++) {
        if (network.isPoS) {
          tx.sign(network, i, key);
        } else if (network.isBtcFork) {
          const hashType = bitcoinJSForks.Transaction.SIGHASH_ALL | bitcoinJSForks.Transaction.SIGHASH_BITCOINCASHBIP143;
          tx.sign(i, btcFork.keyPair, null, hashType, utxo[i].value);
        } else if (
          (network.sapling && network.saplingActivationTimestamp && Math.floor(Date.now() / 1000) > network.saplingActivationTimestamp) ||
          (network.sapling && network.saplingActivationHeight && utxo[0].currentHeight >= network.saplingActivationHeight)) {
          tx.sign(i, key, '', null, utxo[i].value);
        } else {
          tx.sign(i, key);
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