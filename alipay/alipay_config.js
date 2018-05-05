'use strict';
var default_alipay_config = {
  APPID: '',
  PARTNER: '', //合作身份者id，以2088开头的16位纯数字
  KEY: '', //安全检验码，以数字和字母组成的32位字符
  EMAIL: '', //卖家支付宝帐户 必填
  PRIVATE_KEY: '', // RSA密钥Path路径

  host: 'https://api.tlifang.com', //域名
  // ,cacert:'cacert.pem'//ca证书路径地址，用于curl中ssl校验 请保证cacert.pem文件在当前文件夹目录中

  transport: 'https', //访问模式,根据自己的服务器是否支持ssl访问，若支持请选择https；若不支持请选择http
  _input_charset: 'utf-8', //字符编码格式 目前支持 gbk 或 utf-8
  sign_type: 'MD5', //签名方式 不需修改

  create_direct_pay_by_user_return_url: '/alipay/create_direct_pay_by_user/return_url',
  create_direct_pay_by_user_notify_url: '/alipay/create_direct_pay_by_user/notify_url',
  refund_fastpay_by_platform_pwd_notify_url: '/alipay/refund_fastpay_by_platform_pwd/notify_url',
  create_partner_trade_by_buyer_notify_url: '/aplipay/create_partner_trade_by_buyer/notify_url',
  create_partner_trade_by_buyer_return_url: '/aplipay/create_partner_trade_by_buyer/return_url',
  trade_create_by_buyer_return_url: '/alipay/trade_create_by_buyer/return_url',
  trade_create_by_buyer_notify_url: '/alipay/trade_create_by_buyer/notify_url',

  url: {
    verify: 'http://notify.alipay.com/trade/notify_query.do?',
    // verify: 'https://mapi.alipay.com/gateway.do?',
    pc: 'https://mapi.alipay.com/gateway.do?',
    wap: 'https://openapi.alipay.com/gateway.do?',
    close: 'https://openapi.alipay.com/gateway.do?',
    // wap: 'http://wappaygw.alipay.com/service/rest.htm?',
    query: 'https://openapi.alipay.com/gateway.do?',
    bill: 'https://openapi.alipay.com/gateway.do?'
  },
  method: {
    // verify: 'notify_verify',
    pc: 'create_direct_pay_by_user',
    wap: 'alipay.wap.trade.create.direct',
    close: 'alipay.trade.close',
    query: 'alipay.trade.query',
    bill: 'alipay.data.dataservice.bill.downloadurl.query'
  },
  biz_url: {},
};

module.exports = default_alipay_config;
