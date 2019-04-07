const request = require('request');
const Promise = require('bluebird');
const { ethTransactionsToBtc } = require('agama-wallet-lib/src/eth');
const erc20ContractId = require('agama-wallet-lib/src/eth-erc20-contract-id');
const decimals = require('agama-wallet-lib/src/eth-erc20-decimals');

module.exports = (api) => {  
  api.get('/eth/transactions', (req, res, next) => {
    const address = req.query.address;
    const network = req.query.network;
    const symbol = req.query.symbol;
    
    if (symbol) {
      api.eth._transactionsERC20(address, symbol)
      .then((transactions) => {
        const retObj = {
          msg: 'success',
          result: transactions,
        };
    
        res.end(JSON.stringify(retObj));  
      });
    } else {
      api.eth._transactions(address, network)
      .then((transactions) => {
        const retObj = {
          msg: 'success',
          result: transactions,
        };
    
        res.end(JSON.stringify(retObj));  
      });
    }
  });
  
  api.eth._transactions = (address, network = 'homestead', sort = 'asc') => {
    return new Promise((resolve, reject) => {
      const _url = [
        'module=account',
        'action=txlist',
        `address=${address}`,
        'startblock=0',
        'endblock=99999999',
        `sort=${sort}`,
        'apikey=YourApiKeyToken',
      ];
      const _etherscanEndPoint = network === 'homestead' ? 'https://api.etherscan.io/api?' : `https://api-${network}.etherscan.io/api?`;
      const options = {
        url: _etherscanEndPoint + _url.join('&'),
        method: 'GET',
      };

      request(options, (error, response, body) => {
        if (response &&
            response.statusCode &&
            response.statusCode === 200) {
          try {
            const _json = JSON.parse(body);

            if ((_json.message === 'OK' || _json.message === 'No transactions found') &&
                _json.result) {
              const _txs = ethTransactionsToBtc(_json.result, address);
              resolve(_txs);
            } else {
              resolve(_json);
            }
          } catch (e) {
            api.log('eth transactions parse error', 'eth.transactions');
            api.log(e, 'eth.transactions');
          }
        } else {
          api.log(`eth transactions error: unable to request ${network}`, 'eth.transactions');
        }
      });
    });
  };
  
  api.eth._transactionsERC20 = (address, symbol, sort = 'asc', page = 1, offset = 100) => {
    return new Promise((resolve, reject) => {
      const _url = [
        'module=account',
        'action=tokentx',
        `address=${address}`,
        `contractaddress=${erc20ContractId[symbol.toUpperCase()]}`,
        //'startblock=0',
        //'endblock=99999999',
        //`page=${page}'
        //`offset=100&sort=asc
        `sort=${sort}`,
        'apikey=YourApiKeyToken',
      ];
      const options = {
        url: 'https://api.etherscan.io/api?' + _url.join('&'),
        method: 'GET',
      };

      request(options, (error, response, body) => {
        if (response &&
            response.statusCode &&
            response.statusCode === 200) {
          try {
            const _json = JSON.parse(body);

            if ((_json.message === 'OK' || _json.message === 'No transactions found') &&
                _json.result) {
              const _decimals = decimals[symbol.toUpperCase()];
              const _txs = ethTransactionsToBtc(_json.result, address, true, _decimals < 18 && _decimals >= 0 ? 18 - _decimals : 0);
              resolve(_txs);
            } else {
              resolve(_json);
            }
          } catch (e) {
            api.log('eth transactions erc20 parse error', 'eth.transactions');
            api.log(e, 'eth.transactions');
          }
        } else {
          api.log(`eth transactions erc20 error: unable to request ${network}`, 'eth.transactions');
        }
      });
    });
  };

  return api;
};