# USAGE
````javascript
let payment = require('pay-sdk');
const pay = new payment({
  alipay: {
    APPID: 'appid',
    KEY: 'key',
    PARTNER: 'partner',
    EMAIL: 'email'
  },
  wxpay: {
    'APIKEY': 'apikey',
    'APPID': 'appid',
    'APPSECRET': 'appsecret',
    'MCHID': 'mchid'
  }
});
````

## ALIPAY demo
````javascript
pay.createPay({
  type:'alipay',
  opts:{
    method: pay.alipay.method.WAP,  // WAP | PC
    notify_url: encodeURIComponent(notify_url),
    redirect_url: encodeURIComponent(redirect_url),
    title: 'heiheihei',
    total_fee: 100,
  }
}).then(result=>{
  do somthing ...
});
/** result
{ subject: 'heiheihei',
  total_fee: 1,
  notify_url: 'http%3A%2F%2Fwxxxx.xxxx.com%2Fredirect',
  return_url: 'http%3A%2F%2Fwxxxx.xxxx.com%2Fredirect',
  method: 'wap',
  pay_expire: 21600,
  out_trade_no: 'ALI_970xxxxxxxxxxxx',
  service: 'alipay.wap.trade.create.direct',
  _input_charset: 'utf-8',
  partner: '2088511420******',
  req_data: '<direct_trade_create_req><subject>heiheihei</subject><out_trade_no>ALI_9708147xxxxxx</out_trade_no><total_fee>1</total_fee><seller_account_name>xxx@xxxx.com</seller_account_name><call_bacl_url>http%3A%2F%xxx
.xxxx.com%2Fredirect</call_bacl_url><notify_url>http%3A%2F%2Fwxxxx.xxxx.com%2Fredirect</notify_url></direct_trade_create_req>',
  format: 'xml',
  v: '2.0',
  req_id: 147934xxxxxx,
  sec_id: 'MD5',
  signStr: '_input_charset=utf-8&format=xml&method=wap&notify_url=http%253A%252F%xxx.xxxx.com%252Fredirect&out_trade_no=ALI_97081xxxxxx&partner=208851xxxxxxx&pay_expire=21600&req_data=%3Cdirect_trade_create_req%3E%3C
subject%3Eheiheihei%3C%2Fsubject%3E%3Cout_trade_no%3EALI_97081479xxxxxxx%3C%2Fout_trade_no%3E%3Ctotal_fee%3E1%3C%2Ftotal_fee%3E%3Cseller_account_name%xz%xxxxxxxx.com%3C%2Fseller_account_name%3E%3Ccall_bacl_url%3Ehttp%253A%252F
%252Fxxxx.xxxxx.com%252Fredirect%3C%2Fcall_bacl_url%3E%3Cnotify_url%3Ehttp%253A%252F%252Fwxxxx.xxx.com%252Fredirect%3C%2Fnotify_url%3E%3C%2Fdirect_trade_create_req%3E&req_id=xxxxxxx&return_url=http%253A%252F%252Fxxx.xxxx.com%252Fredirect&sec_id=MD5&service=alipay.wap.trade.create.direct&subject=heiheihei&total_fee=1&v=2.0&sign=be2aa959434xxxxxxx',
  url: 'http://wappaygw.alipay.com/service/rest.htm?_input_charset=utf-8&format=xml&method=wap&partner=xxxxxxx&req_data=%3Cauth_and_execute_req%3E%3Crequest_token%3E20161117e3cxxxxxxxxca176eb6%3C%2Frequest_token%3
E%3C%2Fauth_and_execute_req%3E&req_id=xxxxxxx&sec_id=MD5&service=alipay.wap.auth.authAndExecute&v=2.0&sign=07942309cxxxxxxxxe387c' }
**/
````

## WXPAY demo
````javascript
pay.createPay({
  type:'wxpay',
  opts:{
    method: pay.wxpay.trade_type.NATIVE, // NATIVE | APP | JSAPI
    notify_url: encodeURIComponent(notify_url),
    redirect_url: encodeURIComponent(redirect_url),
    title: 'heiheihei',
    total_fee: 100,
    spbill_create_ip:'110.84.35.141'
  }
}).then(result=>{
  do something ...
});
/** result
{ appid: 'wx80bb623*******',
  mch_id: '1348******',
  nonce_str: 'uKJZUSzetduXALVN',
  body: 'heiheihei',
  detail: '',
  out_trade_no: 'WX_148214xxxxxxx',
  total_fee: '100',
  spbill_create_ip: '110.xx.xxx.xxx',
  notify_url: 'http%253A%252F%252Fxxx.xxxx.com%252Fredirect',
  trade_type: 'NATIVE',
  return_code: 'SUCCESS',
  return_msg: 'OK',
  sign: '34029ED1B0E5C04xxxxxxx1',
  result_code: 'SUCCESS',
  prepay_id: 'wx2016111710xxxxxxxx2',
  code_url: 'weixin://wxpay/bizpayurl?pr=Xxxxxxx',
  timestamp: 1479349944 }
**/
````

### verify success pay
alipay -- PC
````javascript

````


## 对账单 bill
````javascript
// alipay


// weixin
pay.bill({
  type: 'wxpay',
  bill_type: 'ALL',
  bill_date: '2016-12-26'
}).then(result => do something ... );
// result is a binary buffer
````

## 订单查询 query
````javascript
// alipay
pay.query({
  type: 'alipay',
  out_trade_no: 'ALI_04371*********'
}).then(result => console.log(result));
/** result
{ alipay_trade_query_response:
   { code: '10000',
     msg: 'Success',
     buyer_logon_id: '408***@qq.com',
     buyer_pay_amount: '0.00',
     buyer_user_id: '2088702392******',
     invoice_amount: '0.00',
     open_id: '2088107306227690694********',
     out_trade_no: 'ALI_0437148********',
     point_amount: '0.00',
     receipt_amount: '0.00',
     send_pay_date: '2016-12-23 14:18:27',
     total_amount: '0.01',
     trade_no: '2016122321001004******',
     trade_status: 'TRADE_SUCCESS' },
  sign: 'L7PsKj8hyavwu83kxxxxxxxxx+y+9***********ZdzHuogNAg24VPXEwhlDqjR72KRdL2jitpuWEHVih/yKArsoxV7xsQy4fxz0f6wVFGYnHXQ63R/tvzwDDlYwliTIMxuitXPn/aw6F0Orm+dRo='
}
*/


// wxpay
pay.query({
  type: 'wxpay',
  transaction_id: '4000532001201612264071709308', // 微信订单号
  // out_trade_no: 'WX_32251482746656924' // 商户订单号， 与微信订单号二选一，商户订单号是我们自己生成的，微信订单号是支付时微信发送到我们通知服务上带的
}).then(result => console.log(result)).catch(e => console.log(e));
/** result
{ return_code: 'SUCCESS',
  return_msg: 'OK',
  appid: 'wx7961axxxxx',
  mch_id: 'xxxxx',
  nonce_str: '1XqNJTpEZMyhHbyj',
  sign: '2496F6592C5130xxxxxxx18CB',
  result_code: 'SUCCESS',
  openid: 'obRqWw90inZoxxxxxxVKRbrg',
  is_subscribe: 'Y',
  trade_type: 'NATIVE',
  bank_type: 'CFT',
  total_fee: '1',
  fee_type: 'CNY',
  transaction_id: '4000532001xxxx709308',
  out_trade_no: 'WX_322514xxxxxx56924',
  attach: {},
  time_end: '2016122xxxxx448',
  trade_state: 'SUCCESS',
  cash_fee: '1' }
*/
````

# 关闭订单
````javascript
pay.close({
  type: 'wxpay',
  out_trade_no: 'WX_3630148368*****'
}).then(result => {
  console.log(result);
}).catch(e => console.log(e));

````

# 退款
````javascript
pay.refund({
  type: 'wxpay',
  out_trade_no: 'WX_123914836907*****'
}).then(result => console.log(result)).catch(e => console.log(e));
````

# 验签
````javascript
//wxpay
pay.wxpay.verifySign({
  "appid": "wx7961afad******",
  "bank_type": "CFT",
  "cash_fee": "1",
  "fee_type": "CNY",
  "is_subscribe": "Y",
  "mch_id": "13833****",
  "nonce_str": "YjZiNWU4ZDE=",
  "openid": "obRqWw90inZonl_******",
  "out_trade_no": "WX_96451488******",
  "result_code": "SUCCESS",
  "return_code": "SUCCESS",
  "sign": "C6EC9C719C3B89D8F9250*******",
  "time_end": "2017030xxxxxx31",
  "total_fee": "1",
  "trade_type": "NATIVE",
  "transaction_id": "400053200120170304213*****"
}).then(
  status=>{console.log(status); //true
}).catch(e=>{
  console.error(e); // wrong sign
});
````

# 发放微信红包
```javascript
pay.sendWXRedPacket({
  send_name: 'super man',
  re_openid: openid,
  wishing: 'da ji da li',
  client_ip: 'x.x.x.x',
  act_name: 'redpacket',
  scene_id: productid,
  total_amount: 1000000000000
}).then(console.log).catch(console.error);
```
