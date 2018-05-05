'use strict';
var util = require('@ym/util');

module.exports = {
  /*
   *  参数校验
   */
  params: (ali, opts) => {
    // 提取调用的接口
    var METHOD = opts.method;

    // 通知回调地址
    opts.notify_url || (opts.notify_url = ali.config.biz_url.notify_url) || delete opts.notify_url;

    // 订单号
    opts.out_trade_no || (opts.out_trade_no = 'ALI_' + Math.random().toString().substr(2, 4) + (+new Date));
    // 服务端口
    opts.service = ali.config.method[METHOD];
    // 字符编码
    opts._input_charset = ali.config._input_charset;
    opts.partner = ali.config.PARTNER;
    // 通过method筛选参数
    switch (METHOD) {
      case 'pc':
        opts.payment_type = 1;
        opts.seller_email = ali.config.EMAIL;
        break;
      case 'wap':
        var req_data = '<direct_trade_create_req>' +
          '<subject>' +
          opts.subject +
          '</subject>' +
          '<out_trade_no>' +
          opts.out_trade_no +
          '</out_trade_no>' +
          '<total_fee>' +
          opts.total_fee +
          '</total_fee>' +
          '<seller_account_name>' +
          ali.config.EMAIL +
          '</seller_account_name>' +
          '<call_bacl_url>' +
          (opts.return_url || ali.config.biz_url.return_url) +
          '</call_bacl_url>' +
          (opts.notify_url ? (
            '<notify_url>' + opts.notify_url + '</notify_url>'
          ) : '') +
          '</direct_trade_create_req>';
        opts.req_data = req_data;
        opts.format = 'xml';
        opts.v = '2.0';
        opts.req_id = +new Date;
        opts.sec_id = ali.config.sign_type;
        break;
      default:
        throw new Error('method param invalid');
        break;
    }
    return opts;
  },
  /**
   * 对对象排序
   * 把对象所有元素，按照“参数=参数值”的模式用“&”字符拼接成字符串
   * @param {Object} para 需要拼接的对象
   * return 拼接完成以后的字符串
   */
  spliceParams(para) {

    para.signStr = Object.keys(para).sort().map(key => {
      return `${key}=${encodeURIComponent(para[key])}`;
    }).join('&');

    return para;
  },


  /*
   * md5加密
   */
  signMD5: (opts, key) => {
    var sign = util.md5(decodeURIComponent(opts.signStr), key);
    switch (opts.method) {
      case 'pc':
        opts.signStr += `&sign=${sign}&sign_type=MD5`;
        break;
      case 'wap':
        opts.signStr += `&sign=${sign}`;
        break;
      default:
        opts.sign = sign;
        break;
    }
    return opts;
  },
  /**
   * rsa签名
   * @param {String} str, sign string
   * @param {String} private_key,
   */
  signRSA: (str, private_key) => {
    var sign = util.rsawithsha1(str, private_key);
    return sign;
  }
};
