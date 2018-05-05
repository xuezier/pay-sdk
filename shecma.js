module.exports = {
  ORDER_SHECMA: {
    title: { not_null: 1, alipay: 'subject', wxpay: 'body' }, // 标题
    out_trade_no: { alipay: 'out_trade_no', wxpay: 'out_trade_no' }, // 订单号
    total_fee: { not_null: 1, alipay: 'total_fee', wxpay: 'total_fee' }, // 总金额
    notify_url: { not_null: 1, alipay: 'notify_url', wxpay: 'notify_url' }, // 通知回调地址
    redirect_url: { alipay: 'return_url' }, //重定向地址
    detail: { wxpay: 'detail' }, // 商品详细描述
    product_id: { alipay: 'product_code', wxpay: 'product_id' }, // 商品号
    method: { not_null: 1, alipay: 'method', wxpay: 'trade_type' }, // 支付方式
    service: { alipay: 'service' }, // 请求网关
    out_user: { alipay: 'out_user' }, // 支付者
    merchant_url: { alipay: 'merchant_url' }, //支付中断回调地址
    agent_id: { alipay: 'agent_id' }, // 代理人
    show_url: { alipay: 'show_url' }, // 商品展示地址
    spbill_create_ip: { not_null: 1, wxpay: 'spbill_create_ip' }, // 用户实际ip地址
    time_start: { wxpay: 'time_start' }, // 支付发起时间
    time_expire: { alipay: 'pay_expire', wxpay: 'time_expire' }, // 支付失效时间
    goods_tag: { wxpay: 'goods_tag' }, // 商品标记
    limit_pay: { wxpay: 'limit_pay' }, // 指定支付方式
    openid: { wxpay: 'openid' } // 用户标识
  },
  ALIPAY_SHECMA: {
    method: { type: 'String', length: 12, default: 'pc' },
    subject: { type: 'String', length: 128 },
    out_trade_no: { type: 'String', length: 64 },
    total_fee: { type: 'Number', length: 9 },
    product_code: { type: 'String', length: 64 },
    notify_url: { type: 'String', length: 256 },
    return_url: { type: 'String', length: 256 },
    out_user: { type: 'String', length: 32 },
    merchant_url: { type: 'String', length: 256 },
    pay_expire: { type: 'Number', length: 10, default: 21600 },
    agent_id: { type: 'String', length: 100 },
    show_url: { type: 'String', length: 256 }
  },
  WXPAY_SHECMA: {
    device_info: { type: 'String', length: 32 },
    nonce_str: { type: 'String', length: 32 },
    body: { type: 'String', length: 128 },
    detail: { type: 'String', length: 6000 },
    attach: { type: 'String', length: 127 },
    out_trade_no: { type: 'String', length: 32 },
    fee_type: { type: 'String', length: 16, default: 'CNY' },
    total_fee: { type: 'Number' },
    spbill_create_ip: { type: 'String', length: 16 },
    time_start: { type: 'String', length: 14 },
    time_expire: { type: 'String', length: 14 },
    goods_tag: { type: 'String', length: 32 },
    notify_url: { type: 'String', length: 256 },
    trade_type: { type: 'String|Enum', length: 16, default: 'APP', values: ['JSAPI', 'NATIVE', 'APP'] },
    product_id: { type: 'String', length: 32 },
    limit_pay: { type: 'String', length: 32 },
    openid: { type: 'String', length: 128 },
  }
};
