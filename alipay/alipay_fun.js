'use strict';
module.exports = function(alipay) {
  var AliPayNotify = require('./alipay_notify');
  var alipayNotify = new AliPayNotify(alipay);


  /*
   * 支付完成跳转地址接口
   */
  alipay.prototype.create_direct_pay_by_user_return_url = function(req, res) {

  };
  /*
   * 支付通知回调接口
   */
  alipay.prototype.create_direct_pay_by_user_notify_url = function(req, res) {
    var self = this;

    var _POST = req.body;

    var verify_result = alipayNotify.verifyNotify(_POST);

    if (verify_result) { //验证成功
      //商户订单号
      var out_trade_no = _POST['out_trade_no'];
      //支付宝交易号
      var trade_no = _POST['trade_no'];
      //交易状态
      var trade_status = _POST['trade_status'];

      if (trade_status == 'TRADE_FINISHED') {
        // 这里是支付交易完成
      } else if (trade_status == 'TRADE_SUCCESS') {
        // 这里是支付交易成功
      }
      res.send('success'); //请不要修改或删除
    } else {
      //验证失败
      res.send('fail');
    }
  };
  /*
   * 支付退款接口
   */
  alipay.prototype.refund_fastpay_by_platform_pwd_notify_url = function(req, res) {

  };
};
