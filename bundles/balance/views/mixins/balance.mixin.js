
// create mixin
riot.mixin('balance', {
  /**
   * on init function
   */
  init() {
    // set value
    this.balance = {
      balance : (this.eden.get('user') || {}).balance || 0,
      pending : (this.eden.get('user') || {}).pending || 0,
    };

    // on mount update
    if (!this.eden.frontend) return;

    // set this store
    this.balance = require('balance/public/js/store');

    // on form change
    this.balance.on('update', this.update);
  },
});
