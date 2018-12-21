
// require dependencies
const colors = require('colors');
const socket = require('socket');
const Helper = require('helper');

/**
 * build balance helper
 */
class BalanceHelper extends Helper {
  /**
   * construct balance helper
   */
  constructor() {
    // run super
    super();

    // bind methods
    this.add = this.add.bind(this);
    this.subtract = this.subtract.bind(this);

    // bind private methods
    this._log = this._log.bind(this);
  }

  /**
   * add balance to user
   *
   * @param {user} User
   * @param {Int}  amount
   *
   * @returns {Promise}
   */
  async add(user, amount) {
    // refresh user
    await user.lock();

    // check amount is positive
    amount = parseFloat(amount);

    // check amount
    if (!amount || amount < 0) {
      // send done
      user.unlock();

      // return false
      return false;
    }

    // add money to users account
    let current = user.get('balance') || 0;

    // check current balance
    if (!current || isNaN(current) || parseFloat(Number(current)) !== current) current = 0;

    // parse current
    current = parseFloat(current);

    // add money
    user.set('balance', Math.floor(Math.round((current + amount) * 100)) / 100);

    // log this
    this._log(user, 'add', `added ${amount} to balance - new balance "${user.get('balance')}"`, true);

    // save user
    await user.save();

    // timeout balance emission
    socket.user(user, 'balance', user.get('balance'));

    // unlock
    user.unlock();

    // return true
    return false;
  }

  /**
   * add balance to user
   *
   * @param {user} User
   * @param {Int}  amount
   *
   * @returns {Promise}
   */
  async subtract(user, amount) {
    // refresh user
    await user.lock();

    // check amount is positive
    amount = parseFloat(amount);

    // check amount
    if (!amount || amount < 0) {
      // send done
      user.unlock();

      // return false
      return false;
    }

    // add money to users account
    let current = user.get('balance') || 0;

    // check current balance
    if (!current || isNaN(current) || parseFloat(Number(current)) !== current) current = 0;

    // check user has enough to take off
    if (current < amount) {
      // run done
      user.unlock();

      // check amount
      return false;
    }

    // add money
    user.set('balance', Math.floor(Math.round((current - amount) * 100)) / 100);

    // log this
    this._log(user, 'subtract', `subracted ${amount} from balance - new balance "${user.get('balance')}"`, true);

    // save user
    await user.save();

    // emit new balance
    socket.user(user, 'balance', user.get('balance'));

    // unlock
    user.unlock();

    // check amount
    return true;
  }

  /**
   * logs balance transaction
   *
   * @param  {user}     User
   * @param  {String}   way
   * @param  {string}   message
   * @param  {Boolean}  success
   */
  _log(user, way, message, success) {
    // log with log function
    this.logger.log((success ? 'info' : 'error'), ` [${colors.green(user.get('username'))}] ${message}`, {
      class : 'balance',
    });
  }
}

/**
 * export new Balance Helper class
 *
 * @return {BalanceHelper}
 */
module.exports = new BalanceHelper();
