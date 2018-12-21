
// require dependencies
const store  = require('default/public/js/store');
const Events = require('events');
const socket = require('socket/public/js/bootstrap');

/**
 * create balance store
 */
class BalanceStore extends Events {
  /**
   * construct balance store
   */
  constructor() {
    // set observable
    super();

    // get initial settings
    this.balance = (store.get('user') || {}).balance || 0;
    this.pending = (store.get('user') || {}).pending || 0;

    // bind methods
    this.get = this.get.bind(this);
    this.set = this.set.bind(this);

    // bind private methods
    this._balance = this._balance.bind(this);
    this._pending = this._pending.bind(this);

    // listen to socket for setting
    socket.on('balance', this._balance);
    socket.on('balance.pending', this._pending);
  }

  /**
   * gets balance value
   *
   * @param  {String} name
   *
   * @return {*}
   */
  get(name) {
    // return value
    return this[name];
  }

  /**
   * sets balance value
   *
   * @param  {String} name
   * @param  {*} value
   */
  set(name, value) {
    // get value
    const old = this[name];

    // set setting
    this[name] = value;

    // trigger update
    if (old !== value) {
      // trigger update
      this.emit('update');

      // trigger
      this.emit(name, value);
    }
  }

  /**
   * on balance change
   *
   * @param {Integer} balance
   *
   * @private
   */
  _balance(balance) {
    // trigger sicbo
    this.set('balance', balance);
  }

  /**
   * on balance change
   *
   * @param {Integer} pending
   *
   * @private
   */
  _pending(pending) {
    // trigger sicbo
    this.set('pending', pending);
  }
}

/**
 * export built balance store
 *
 * @type {BalanceStore}
 */
module.exports = new BalanceStore();
