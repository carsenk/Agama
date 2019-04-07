const {
  pathsAgama,
  pathsDaemons,
} = require('./pathsUtil');
const path = require('path');
const fixPath = require('fix-path');
const os = require('os');

module.exports = (api) => {
  api.pathsAgama = () => {
    api.agamaDir = pathsAgama();
  }

  api.pathsDaemons = () => {
    api = pathsDaemons(api);
  }

  return api;
};