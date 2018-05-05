'use strict';

var ALIPAY = require('./alipay');
var WXPAY = require('./wx');

const SHECMA = require('./shecma');
const ORDER_SHECMA = SHECMA.ORDER_SHECMA,
  ALIPAY_SHECMA = SHECMA.ALIPAY_SHECMA,
  WXPAY_SHECMA = SHECMA.WXPAY_SHECMA;

class PAY {
  /**
   * 支付模块
   * @param {Object} options
   * @param {Object} options.alipay
   * @param {String} options.alipay.APPID 支付宝应用的appid
   * @param {String} options.alipay.EMAIL 支付宝账户的email
   * @param {String} options.alipay.PARTNER 支付宝账户的商户号，也是 pid
   * @param {String} options.alipay.KEY 支付宝账户的api密钥
   * @param {String} options.alipay.PRIVATE_KEY rsa密钥文件绝对路径
   * @param {Object} options.wxpay
   * @param {String} options.wxpay.APIKEY 微信支付商户的操作密钥
   * @param {String} options.wxpay.APPID  微信支付公众号的appid
   * @param {String} options.wxpay.APPSECRET  微信支付公众号的appsecret
   * @param {String} options.wxpay.MCHID  微信支付的商户号
   * @param {String} options.wxpay.PFXKEY pkcs12证书文件路径
   */
  constructor(options) {
    var self = this;
    self.alipay = new ALIPAY(options.alipay);
    self.wxpay = new WXPAY(options.wxpay);
  }

  /**
   * 创建支付订单
   * @param {Object} params
   * @param {String} params.type not null, 支付方式[alipay, wxpay]
   * @param {String} params.opts.title not null, 标题
   * @param {String} params.opts.out_trade_no null, 订单号
   * @param {String} params.opts.total_fee not null, 总金额
   * @param {String} params.opts.notify_url not null, 通知回调地址
   * @param {String} params.opts.redirect_url  支付宝，重定向地址，支付完成后跳转
   * @param {String} params.opts.detail null, 商品详细描述
   * @param {String} params.opts.product_id null, 商品号
   * @param {String} params.opts.method not null,支付方式,支付宝[pc, wap], 微信:[NATIVE, APP, JSAPI]
   * @param {String} params.opts.spbill_create_ip 微信支付，not null, 用户实际ip地址
   * @param {String} params.opts.time_expire null,支付失效时间
   * @param {String} params.opts.limit_pay 微信支付, null, 指定支付方式
   * @return {Promise} obj
   */
  createPay(params) {
    var self = this;
    var type = params.type,
      options = params.opts,
      order = new Object;
    if (type == 'alipay') {
      // 过滤出支付宝支付的订单模式
      for (var key in ORDER_SHECMA) {
        var _current_key = ORDER_SHECMA[key].alipay;
        if (_current_key && ALIPAY_SHECMA.hasOwnProperty(_current_key)) {
          var value = options[key] || ALIPAY_SHECMA[_current_key].default;
          if ((value + '').length > ALIPAY_SHECMA[_current_key].length) return Promise.reject(`${key} length is too long, allowed ${ALIPAY_SHECMA[_current_key].length}`);
          value && (order[_current_key] = value);
        }
      }
      // 金额的单位为分，支付宝的订单金额单位为元，需要转换
      order.total_fee = parseInt(order.total_fee) / 100;
      return self.alipay.createUrl(order);
    } else if (type == 'wxpay') {
      // 过滤出微信支付的订单模式
      for (var key in ORDER_SHECMA) {
        var _current_key = ORDER_SHECMA[key].wxpay;
        if (_current_key && WXPAY_SHECMA.hasOwnProperty(_current_key)) {
          var value = (options[key] || WXPAY_SHECMA[_current_key].default);
          if ((value + '').length > WXPAY_SHECMA[_current_key].length) return Promise.reject(`${key} length is too long, allowed ${WXPAY_SHECMA[_current_key].length}`);
          value && (order[_current_key] = value);
        }
      }
      return self.wxpay.getPrePayId(order);
    }
  }

  /**
   * 查询订单
   * @param {Object} opts
   * @param {String} opts.type not null, 订单类型[alipay, wxpay]
   * @param {String} opts.out_trade_no not null, 订单号
   * @return {Promise}
   */
  query(opts) {
    var self = this;

    var { type } = opts;
    if (type == 'alipay') return self.alipay.query(opts);

    if (type == 'wxpay') return self.wxpay.query(opts);
  }


  /**
   * 对账单查询
   * @param {Object} opts
   * @param {String} opts.type not null, 支付方式[alipay, wxpay], 暂不支持微信
   * @param {String} opts.bill_type 微信支付, not null, 订单状态[ALL, SUCCESS, FAILED]
   * @param {String} opts.bill_date not null, 订单日期, 格式[YYYYMMDD, YYYYMM(支付宝)]
   * @return {Promise} 微信: resolve a .csv buffer
   */
  bill(opts) {
    var self = this;

    var { type } = opts;
    if (type == 'alipay') return self.alipay.bill(opts);

    if (type == 'wxpay') return self.wxpay.bill(opts);
  }

  /**
   * 关闭订单
   * @param {Object} opts
   * @param {String} opts.type not null, 订单类型[alipay, wxpay]
   * @param {String} opts.out_trade_no not null, 订单号
   * @return {Promise}
   */
  close(opts) {
    var self = this;

    var { type } = opts;
    if (type == 'alipay') return self.alipay.close(opts);

    if (type == 'wxpay') return self.wxpay.close(opts);
  }

  /**
   * 订单退款
   * @param {Object} opts
   * @param {String} opts.total_fee 订单金额
   * @param {String} opts.refund_fee 退款金额
   * @param {String} opts.out_trade_no 商户订单号
   * @param {String} opts.transaction_id 微信订单号，与out_trade_no不同时为空
   * @param {String} opts.out_refund_no null,退款单号，由商户创建提供给微信
   */
  refund(opts) {
    var self = this;
    if (opts.type == 'wxpay') return self.wxpay.refund(opts);
  }

  /**
   * 发放微信红包
   *
   * @param {{}} opts
   * @param {String} opts.nonce_str  随机字符串
   * @param {String} opts.mch_billno 商户订单号
   * @param {String} opts.send_name  商户名称
   * @param {String} opts.re_openid  用户openid
   * @param {Number} opts.total_amount 付款金额
   * @param {Number} opts.total_num  红包发放总人数
   * @param {String} opts.wishing  红包祝福语
   * @param {String} options.act_name 活动名称
   * @param {String} opts.scene_id 场景id, PRODUCT_1:商品促销、PRODUCT_2:抽奖、PRODUCT_3:虚拟物品兑奖 、PRODUCT_4:企业内部福利、PRODUCT_5:渠道分润、PRODUCT_6:保险回馈、PRODUCT_7:彩票派奖、PRODUCT_8:税务刮奖
   * @param {String} opts.client_ip  Ip地址
   * @memberof PAY
   */
  sendWXRedPacket(opts) {
    return this.wxpay.giveRedPacket(opts);
  }

  /**
   * 查询微信红包记录
   * @param {{}} opts
   * @param {String} opts.mch_billno
   * @param {String} opts.bill_type
   * @memberof WX
   */
  queryWXRedPacket(opts) {
    return this.wxpay.queryRedPacket(opts);
  }
}

module.exports = PAY;
