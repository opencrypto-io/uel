const ethersUtils = require('ethers').utils
const BigNumber = require('bignumber.js')
const web3 = require('web3')

const utils = {}
Object.assign(utils, web3.utils)

utils.numberToBytes32 = (num) => {
  const bn = ethersUtils.bigNumberify(num);
  return ethersUtils.hexlify(ethersUtils.padZeros(bn, 32));
}

utils.passthroughExpand = function(obj, idMethod, methods, parentKey = '_parent') { 
  Object.assign(
    obj.prototype,
    methods.reduce((obj, name) => {
      obj[name] = async function(...args) {
        return this[parentKey][name](await this[idMethod](), ...args)
      }
      return obj
    }, {})
  )
}


utils.formatHex = function(value, type) {
  if (type == 'Hex') return value
  if (!utils['hexTo'+type]) {
    throw new Error('Unknown hexTo type: ' + type)
  }
  return utils['hexTo'+type](value)
}

module.exports = utils