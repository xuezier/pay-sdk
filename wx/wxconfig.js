module.exports = {
  APPID: '',
  APPSECRET: '',
  APIKEY: '',
  MCHID: '',
  url: {
    prepayId: 'https://api.mch.weixin.qq.com/pay/unifiedorder',
    openid: 'https://open.weixin.qq.com/connect/oauth2/authorize',
    refund: 'https://api.mch.weixin.qq.com/secapi/pay/refund',
    bill: 'https://api.mch.weixin.qq.com/pay/downloadbill',
    close: 'https://api.mch.weixin.qq.com/pay/closeorder',
    query: 'https://api.mch.weixin.qq.com/pay/orderquery',
    sendredpacket: 'https://api.mch.weixin.qq.com/mmpaymkttransfers/sendredpack',
    queryredpacket: 'https://api.mch.weixin.qq.com/mmpaymkttransfers/gethbinfo'
  },
  trade_type: {
    APP: 'APP',
    JSAPI: 'JSAPI',
    NATIVE: 'NATIVE'
  }
};
