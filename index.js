const fs = require('fs')
const path = require('path')
const providers = require('./lib/providers')
const debug = require('debug')

class DAppClient {
  constructor(config = {}) {
    this._defaultConfig = {
      network: 'mainnet',
      servicesDir: path.join(__dirname, 'services'),
      services: [
        'dai',
        'erc20',
        'ds-value',
        'custom'
      ]
    }
    this._defaultProviderConfig = {
      type: 'web3/infura',
      apiKey: '3adefb225509451f87d745e281e2e165'
    }
    this._config = Object.assign(this._defaultConfig, config)
    if (!this._config.provider) {
      this._config.provider = this._defaultProviderConfig
    }
    this._services = {}
    this._provider = null
    this._debug = debug

    // Load services
    this._config.services.forEach(id => {
      this._services[id] = require(path.join(this._config.servicesDir, id, 'index'))
    })
    // Load provider
    this._provider = new providers[this._config.provider.type](this)
    // Load account
    if (this._config.privateKey) {
      this._provider.addPrivateKeyAccount(this._config.privateKey)
    }
  }
  services() {
    return Object.keys(this._services).map(id => {
      const { name } = this._services[id]
      return {
        id,
        name
      }
    })
  }
  async service(id) {
    return new this._services[id].api(this, this._services[id], await this.assets(id))
  }
  async assets(serviceId) {
    let assets = { abi: {} }
    const abiDir = path.join(this._config.servicesDir, serviceId, 'abi')
    if (fs.existsSync(abiDir)) {
      fs.readdirSync(abiDir).forEach(f => {
        assets.abi[path.parse(f).name] = JSON.parse(fs.readFileSync(path.join(abiDir, f)))
      })
    }
    return assets
  }
  async contract(service, id, opts = {}, localOpts = {}) {
    let args = {
      abi: null,
      addr: null
    }
    if (localOpts.addr) {
      args.addr = localOpts.addr
    } else {
      args.addr = service._index.contracts[this._config.network][id]
    }
    if (localOpts.abi) {
      args.abi = localOpts.abi
    } else {
      args.abi = service._assets.abi[id]
    }
    return this._provider.contract(args.abi, args.addr, opts)
  }
}

module.exports = {
  client: DAppClient
}
