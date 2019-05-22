
/**
 * Created by Awesome on 1/30/2016.
 */

// Require dependencies
const Grid        = require('grid');
const Controller  = require('controller');
const escapeRegex = require('escape-string-regexp');

// Require models
const Block = model('block');
const Entry = model('balanceEntry');

// require helpers
const blockHelper   = helper('cms/block');
const balanceHelper = helper('balance');

/**
 * Build customer controller
 *
 * @acl   admin
 * @fail  next
 * @mount /admin/balance
 */
class BalanceAdminController extends Controller {
  /**
   * Construct user customerAdminController controller
   */
  constructor() {
    // Run super
    super();

    // build account admin controller
    this.build = this.build.bind(this);

    // Bind methods
    this.gridAction = this.gridAction.bind(this);
    this.indexAction = this.indexAction.bind(this);

    // Bind private methods
    this._grid = this._grid.bind(this);

    // set building
    this.building = this.build();
  }


  // ////////////////////////////////////////////////////////////////////////////
  //
  //  BUILD METHODS
  //
  // ////////////////////////////////////////////////////////////////////////////

  /**
   * builds account admin controller
   */
  build() {
    //
    // REGISTER BLOCKS
    //

    // register simple block
    blockHelper.block('edenjs.balance', {
      acl         : ['admin.balance'],
      for         : ['admin'],
      title       : 'Balance Transaction Grid',
      description : 'Balance Transaction Grid',
    }, async (req, block) => {
      // get notes block from db
      const blockModel = await Block.findOne({
        uuid : block.uuid,
      }) || new Block({
        uuid : block.uuid,
        type : block.type,
      });

      // create new req
      const fauxReq = {
        query : blockModel.get('state') || {},
      };

      // return
      return {
        tag   : 'grid',
        name  : 'Accounts',
        grid  : await (await this._grid(req)).render(fauxReq),
        class : blockModel.get('class') || null,
        title : blockModel.get('title') || '',
      };
    }, async (req, block) => {
      // get notes block from db
      const blockModel = await Block.findOne({
        uuid : block.uuid,
      }) || new Block({
        uuid : block.uuid,
        type : block.type,
      });

      // set data
      blockModel.set('class', req.body.data.class);
      blockModel.set('state', req.body.data.state);
      blockModel.set('title', req.body.data.title);

      // save block
      await blockModel.save(req.user);
    });
  }


  // ////////////////////////////////////////////////////////////////////////////
  //
  //  NORMAL METHODS
  //
  // ////////////////////////////////////////////////////////////////////////////

  /**
   * Index action
   *
   * @param {Request}  req
   * @param {Response} res
   *
   * @icon     fa fa-balance-scale
   * @menu     {ADMIN} Balance Transactions
   * @title    Balances
   * @route    {get} /
   * @parent   /admin/sales
   * @layout   admin
   * @priority 10
   */
  async indexAction(req, res) {
    // Render grid
    res.render('balance/admin', {
      grid : await (await this._grid(req)).render(req),
    });
  }

  /**
   * User grid action
   *
   * @param {Request} req
   * @param {Response} res
   *
   * @route  {post} /grid
   * @return {*}
   */
  async gridAction(req, res) {
    // Return post grid request
    return (await this._grid(req)).post(req, res);
  }


  // ////////////////////////////////////////////////////////////////////////////
  //
  //  HOOK METHODS
  //
  // ////////////////////////////////////////////////////////////////////////////

  /**
   * Hook to add action
   *
   * @pre payment.init
   */
  async methodHook(order, action) {
    // check action
    if (action.type !== 'payment') return;

    // get order user
    const user = await order.get('user');

    // return sanitised data
    action.data.methods.push({
      type : 'balance',
      data : {
        balance : user ? user.get('balance') : 0,
      },
      priority : 2,
    });
  }

  /**
   * Pay using Payment Method
   *
   * @param {Payment} payment
   *
   * @pre    payment.pay
   * @return {Promise}
   */
  async payHook(payment) {
    // Check super
    if (payment.get('method.type') !== 'balance') return;

    // get order
    const invoice = await payment.get('invoice');
    const order = (await invoice.get('orders'))[0];

    // subtract
    if (await balanceHelper.subtract(await order.get('user'), payment.get('amount'), payment)) {
      // set complete
      payment.set('complete', true);
    }
  }

  /**
   * add account to order sanitise logic
   *
   * @param {Object} *
   *
   * @pre    order.sanitise
   * @return {Promise}
   */
  async orderSanitiseHook({ order, sanitised }) {
    // get order user
    const user = await order.get('user');

    // check account and customer
    if (user) {
      // set customer and account
      sanitised.actions.payment.balance = user.get('balance') || 0;
    }
  }

  /**
   * add account to order sanitise logic
   *
   * @param {Object} *
   *
   * @pre    user.sanitise
   * @return {Promise}
   */
  async userSanitiseHook({ user, sanitised }) {
    // set customer and account
    sanitised.balance = user.get('balance') || 0;
  }

  /**
   * add field to products in admin
   *
   * @param {Object} *
   *
   * @pre    product.admin.sanitise
   * @return {Promise}
   */
  async productAdminHook(product) {
    // set customer and account
    product.opts.sections.unshift('balance-credit');
  }


  // ////////////////////////////////////////////////////////////////////////////
  //
  //  PRIVATE METHODS
  //
  // ////////////////////////////////////////////////////////////////////////////

  /**
   * Renders grid
   *
   * @param {Request} req
   *
   * @return {grid}
   */
  async _grid(req) {
    // Create new grid
    const balanceGrid = new Grid();

    // Set route
    balanceGrid.route('/admin/balance/grid');

    // Set grid model
    balanceGrid.id('edenjs.balance');
    balanceGrid.model(Entry);

    // Add grid columns
    balanceGrid.column('_id', {
      sort     : true,
      title    : 'Id',
      priority : 100,
    }).column('way', {
      sort     : true,
      title    : 'Direction',
      priority : 90,
    }).column('amount', {
      sort     : true,
      title    : 'Amount',
      priority : 90,
    }).column('message', {
      sort     : true,
      title    : 'Message',
      priority : 80,
    })
      .column('balance', {
        sort     : true,
        title    : 'New Balance',
        priority : 70,
      });

    // add extra columns
    balanceGrid.column('updated_at', {
      tag      : 'grid-date',
      sort     : true,
      title    : 'Updated',
      priority : 4,
    }).column('created_at', {
      tag      : 'grid-date',
      sort     : true,
      title    : 'Created',
      priority : 3,
    }).column('actions', {
      tag      : 'balance-actions',
      type     : false,
      width    : '1%',
      title    : 'Actions',
      priority : 1,
    });

    // Set default sort order
    balanceGrid.sort('created_at', 1);

    // Return grid
    return balanceGrid;
  }
}

/**
 * export balance controller
 *
 * @type {BalanceAdminController}
 */
exports = module.exports = BalanceAdminController;
