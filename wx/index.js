'use strict';
var fs = require('fs');

var request = require('request');
var xml2json = require('xml2json');
var util = require('ym-util');

var url = require('url');

var config = require('./wxconfig');


class WX {
  constructor(opts) {
    if (!(('APPID' in opts) && ('APPSECRET' in opts) && ('MCHID' in opts) && ('APIKEY' in opts))) throw new Error('the first augument is json has keys APPID,APPSECRET,MCHID,APIKEY');
    var self = this;

    self = Object.assign(self, config, opts);

    self.PFXKEY && (self.PFXKEY = fs.readFileSync(self.PFXKEY));
  }

  /**
   * get user wechat open_id
   * @param {String} redirect_uri
   * @param {String} scope
   * @param {String} state
   */
  getOpenId(redirect_uri, scope, state) {
    var self = this;

    // 应用授权作用域,snsapi_base （不弹出授权页面，直接跳转，只能获取用户openid）,snsapi_userinfo （弹出授权页面，可通过openid拿到昵称、性别、所在地。并且，即使在未关注的情况下，只要用户授权，也能获取其信息）
    scope || (scope = 'snsapi_base');

    // 拼接url
    var url = self.url.openid + `?appid=${self.APPID}&response_type=code`;
    url += `&redirect_uri=${encodeURIComponent(redirect_uri)}&scope=${scope}`;
    state && (url += `&state=${encodeURIComponent(state)}`);
    url += '#wechat_redirect';
    return url;
  }

  /**
   * encode url
   * @param {String} _url
   */
  _encodeURL(_url) {
    var obj = url.parse(_url);
    obj.hash = encodeURI(obj.hash || '');
    obj.pathname = encodeURI(obj.pathname);
    obj.path = encodeURI(obj.path);
    obj.search = encodeURI(obj.search || '');
    return url.format(obj);
  }

  _generateOutTradeNo(prefix) {
    var time = new Date;
    var year = time.getFullYear(),
      month = time.getMonth() + 1,
      date = time.getDate(),
      hour = time.getHours(),
      minute = time.getMinutes(),
      second = time.getSeconds();
    var out_trade_no = `${year}${month<10?'0'+month:month}${date<10?'0'+date:date}${hour<10?'0'+hour:hour}${minute<10?'0'+minute:minute}${second<10?'0'+second:second}`;

    return `${prefix||'WX'}${out_trade_no}${Math.random().toString().substr(2,3)}${Math.random().toString().substr(2,3)}`;
  }

  /**
   * 订单查询
   * @param {Object} opts
   */
  query(opts) {
    var self = this;
    var { transaction_id, out_trade_no } = opts;

    var content = {
      appid: self.APPID,
      mch_id: self.MCHID,
      // nonce_str: 'C380BEC2BFD727A4B6845133519F3AD6'
      nonce_str: self._generateNonceStr(),
    };

    return new Promise((resolve, reject) => {
      if (transaction_id)
        content.transaction_id = transaction_id;
      else if (out_trade_no)
        content.out_trade_no = out_trade_no;
      else reject('param transaction_id, out_trade_no must has one');

      var sign = self._getSignMD5(content);

      var xmlData = self._createXml(content, sign);
      self._responseFromWX(self.url.query, 'post', xmlData).then(result => {
        resolve(result);
      }).catch(reject);
    });
  }

  /**
   * 关闭订单, 新创建的订单，5分钟后才可取消
   * @param {Object} opts
   * @param {String} opts.out_trade_no
   */
  close(opts) {
    var self = this;
    var { out_trade_no } = opts;

    var content = {
      appid: self.APPID,
      mch_id: self.MCHID,
      nonce_str: self._generateNonceStr(),
      out_trade_no
    };

    var sign = self._getSignMD5(content);

    var xmlData = self._createXml(content, sign);

    return new Promise((resolve, reject) => {
      request(self.url.close, {
        method: 'POST',
        headers: {
          'Content-type': 'text/xml'
        },
        body: xmlData
      }, function(err, res, body) {
        if (err) return reject(err);

        var result = JSON.parse(xml2json.toJson(body)).xml;

        if (result.return_code == 'FAIL') return reject(result);

        resolve(result);
      });
    });
  }

  /**
   * 下载对账单, 对账单接口只能下载三个月以内的账单
   * @param {Object} opts
   * @param {String} opts.bill_date, format like YYYY-MM-DD
   * @param {String} opts.bill_type, ALL，返回当日所有订单信息，默认值SUCCESS，返回当日成功支付的订单,REFUND，返回当日退款订单
   */
  bill(opts) {
    var self = this;

    var { bill_date, bill_type = 'ALL' } = opts;

    bill_date = new Date(bill_date).Format('YYYYMMDD');

    var NONCESTR = opts.nonce_str || self._generateNonceStr();

    var content = {
      appid: self.APPID,
      mch_id: self.MCHID,
      nonce_str: NONCESTR,
      charset: 'utf-8',
      bill_date,
      bill_type
    };

    var sign = self._getSignMD5(content);

    var xmlData = self._createXml(content, sign);
    // console.log(xmlData);
    return new Promise((resolve, reject) => {
      request(self.url.bill, {
        method: 'POST',
        headers: {
          'Content-Type': 'text/xml'
        },
        body: xmlData,
        encoding: 'binary',
      }, function(err, res, body) {
        if (err) return reject(err);

        var bf = new Buffer(body, 'binary');
        resolve(bf);
      });

    });

  }

  /**
   * 生成随机字符串
   */
  _generateNonceStr(nonce_str) {
    return nonce_str || ((+new Date).toString(16) + Math.random().toString(16).substr(2)).toUpperCase();
  }

  /**
   * 验签
   * @param {Object} obj
   */
  verifySign(obj) {
    let { sign } = obj;
    delete obj.sign;

    if (sign == this._getSignMD5(obj)) return Promise.resolve(true);

    return Promise.reject('wrong sign');
  }

  /**
   * 对参数进行md5签名
   */
  _getSignMD5(obj) {
    var self = this;

    // 对参与签名的参数进行字典排序并拼接
    var str = Object.keys(obj).sort().map(key => {
      if (obj[key]) return `${key}=${encodeURIComponent(obj[key])}`;
    }).filter(key => key).join('&').replace(/\&+/g, '&');

    var sign = util.md5(`${str}&key=${self.APIKEY}`).toUpperCase();

    return sign;
  }

  /**
   * convert json to xml data
   * @param {Object} obj
   * @param {String} sign
   */
  _createXml(obj, sign) {
    var self = this;

    var xmlData = '<xml>';

    for (var key in obj) {
      if (obj[key])
        xmlData += `<${key}><![CDATA[${obj[key]}]]></${key}>`;
    }

    if (sign) xmlData += `<sign><![CDATA[${sign}]]></sign>`;

    xmlData += '</xml>';

    return xmlData;
  }

  /**
   * 获取 wechat pay prepayid
   * @param {Object} options
   */
  getPrePayId(options) {
    var self = this;
    // 随机字符串校验防重发
    // var NONCESTR = '5K8264ILTKCH16CQ2502SI8ZNMTM67VS';
    var NONCESTR = options.nonce_str || new Buffer(Math.random().toString(16).substr(2, 4) + Math.random().toString(16).substr(2, 4)).toString('base64');
    // 商品订单号
    var OUT_TRADE_NO = options.out_trade_no || this._generateOutTradeNo();
    // 用户标识
    var OPENID = options.openid;

    // 统计签名参数
    var signValue = {
      appid: options.appid || self.APPID,
      mch_id: options.mch_id || self.MCHID,
      nonce_str: NONCESTR, // 随机字符串
      body: options.body, // 商品描述
      detail: options.detail || '', // 商品详情
      out_trade_no: OUT_TRADE_NO, // 订单号
      total_fee: options.total_fee, // 订单金额，单位为分
      spbill_create_ip: options.spbill_create_ip, // 用户实际外网ip
      notify_url: self._encodeURL(options.notify_url), // 接收微信支付异步通知回调地址
      trade_type: options.trade_type // 交易类型，取值如下：JSAPI，NATIVE，APP
    };
    OPENID && (signValue.openid = OPENID);


    var sign = self._getSignMD5(signValue);

    var xmlData = self._createXml(signValue, sign);
    return new Promise((resolve, reject) => {
      self._responseFromWX(self.url.prepayId, 'POST', xmlData).then(data => {
        var json = data;
        // console.log(json);
        // var json = JSON.parse(xml2json.toJson(data)).xml;
        // console.log(json);
        json.timestamp = Math.floor((+new Date) / 1000);
        if (options.trade_type == 'APP') {
          // 如果微信支付方式是APP，那么需要二次签名
          var secondSignValue = {
            appid: options.appid || self.APPID,
            package: 'Sign=WXPay',
            partnerid: options.mch_id || self.MCHID,
            prepayid: json.prepay_id,
            noncestr: NONCESTR,
            timestamp: json.timestamp
          };

          var secondSign = self._getSignMD5(secondSignValue);

          json.sign = secondSign;
          json.nonce_str = NONCESTR;
        }
        resolve(Object.assign(signValue, json));
      }, err => {
        reject(err);
      }).catch(reject);
    });
  }

  /**
   * 通过jsapi支付获取prepayid
   * @param {Object} options
   */
  getJSAPIprepayid(options) {
    var self = this;
    options.trade_type = 'JSAPI';
    // options.openid = 'obRqWw90inZonl_lN8IyUgVKRbrg';
    return self.getPrePayId(options);
  }



  /**
   * 通过native支付获取prepayid
   * @param {Object} options
   */
  getNATIVEprepayid(options) {
    var self = this;
    options.trade_type = 'NATIVE';
    return self.getPrePayId(options);
  }

  /**
   * 通过app支付获取prepayid
   * @param {Object} options
   */
  getAPPprepayid(options) {
    var self = this;
    options.trade_type = 'APP';
    return self.getPrePayId(options);
  }

  /**
   * 创建退款
   * @param {{}} options
   */
  refund(options) {
    var self = this;
    // 随机字符串校验防重发
    // var NONCESTR = '5K8264ILTKCH16CQ2502SI8ZNMTM67VS';
    var NONCESTR = options.nonce_str || new Buffer(Math.random().toString(16).substr(2, 4) + Math.random().toString(16).substr(2, 4)).toString('base64');

    var TRANSACTIONID = options.transaction_id;
    var OUT_TRADE_NO = options.out_trade_no;

    var OUT_REFUND_NO = options.out_refund_no || `WX_REFUND_${Math.random().toString(16).substr(2,4)}${(+new Date).toString(16)}`;

    var signValue = {
      appid: options.appid || self.APPID,
      mch_id: options.mac_id || self.MCHID,
      nonce_str: NONCESTR,
      out_refund_no: OUT_REFUND_NO, // 退款单号
      total_fee: options.total_fee || 1, // 订单金额
      refund_fee: options.refund_fee || 1, // 退款金额
      op_user_id: options.op_user_id || self.MCHID // 操作员
    };

    TRANSACTIONID && (signValue.transaction_id = TRANSACTIONID);
    OUT_TRADE_NO && (signValue.out_trade_no = OUT_TRADE_NO);

    var signStr = Object.keys(signValue).sort().map(item => {
      return `${item}=${signValue[item]}`;
    }).join('&') + `&key=${self.APIKEY}`;

    var sign = util.md5(signStr).toUpperCase();


    var xmlData = self._createXml(signValue, sign);

    return new Promise((resolve, reject) => {
      request(self.url.refund, {
        method: 'POST',
        agentOptions: {
          pfx: self.PFXKEY,
          passphrase: self.MCHID
        },
        headers: {
          'Content-Type': 'text/xml'
        },
        body: xmlData
      }, function(err, res, body) {
        if (err) return reject(err);

        resolve(body);
      });
    });
  }

  /**
   * 发放红包
   *
   * @param {{}} options
   * @param {String} options.nonce_str  随机字符串
   * @param {String} options.mch_billno 商户订单号
   * @param {String} options.send_name  商户名称
   * @param {String} options.re_openid  用户openid
   * @param {Number} options.total_amount 付款金额
   * @param {Number} options.total_num  红包发放总人数
   * @param {String} options.wishing  红包祝福语
   * @param {String} options.act_name 活动名称
   * @param {String} options.scene_id 场景id, PRODUCT_1:商品促销、PRODUCT_2:抽奖、PRODUCT_3:虚拟物品兑奖 、PRODUCT_4:企业内部福利、PRODUCT_5:渠道分润、PRODUCT_6:保险回馈、PRODUCT_7:彩票派奖、PRODUCT_8:税务刮奖
   * @param {String} options.client_ip  Ip地址
   * @memberof WX
   */
  giveRedPacket(options) {
    var self = this;

    var TOTAL_AMOUNT = options.total_amount || 100;
    var TOTAL_NUM = options.total_num || 1;
    var NONCESTR = options.nonce_str || new Buffer(Math.random().toString(16).substr(2, 4) + Math.random().toString(16).substr(2, 4)).toString('base64');

    var MCH_BILLNO = options.mch_billno || this._generateOutTradeNo('WXRP');

    var signValue = {
      wxappid: options.appid || self.APPID,
      mch_id: options.mac_id || self.MCHID,
      nonce_str: NONCESTR,
      mch_billno: MCH_BILLNO,
      send_name: options.send_name,
      re_openid: options.re_openid,
      total_amount: TOTAL_AMOUNT,
      total_num: TOTAL_NUM,
      act_name: options.act_name,
      wishing: options.wishing,
      client_ip: options.client_ip
    };

    var signStr = Object.keys(signValue).sort().map(key => {
      var value = signValue[key];
      return value && `${key}=${value}` || null;
    }).filter(s => s).join('&') + `&key=${self.APIKEY}`;

    var sign = util.md5(signStr).toUpperCase();
    var xmlData = self._createXml(signValue, sign);

    return new Promise(function(resolve, reject) {
      request(self.url.sendredpacket, {
        method: 'POST',
        agentOptions: {
          pfx: self.PFXKEY,
          passphrase: self.MCHID
        },
        headers: {
          'Content-Type': 'text/xml'
        },
        body: xmlData
      }, function(err, res, body) {
        if (err) return reject(err);

        var result = JSON.parse(xml2json.toJson(body)).xml;
        if (result.return_code === 'FAIL') return reject(result);

        resolve(result);
      });
    });
  }

  /**
   * 查询红包记录
   * @param {{}} options
   * @param {String} options.mch_billno
   * @param {String} options.bill_type
   * @memberof WX
   */
  queryRedPacket(options) {
    if (!options.mch_billno) return Promise.resolve(new Error('订单号不能为空'));

    var bill_type = options.bill_type || 'MCHT';

    var signValue = {
      nonce_str: this._generateNonceStr(),
      mch_billno: options.mch_billno,
      mch_id: this.MCHID,
      appid: this.APPID,
      bill_type
    };

    var signStr = Object.keys(signValue).sort().map(key =>
      `${key}=${signValue[key]}`
    ).join('&') + `&key=${this.APIKEY}`;

    var sign = util.md5(signStr).toUpperCase();

    var xmlData = this._createXml(signValue, sign);

    var self = this;
    return new Promise(function(resolve, reject) {
      request(self.url.queryredpacket, {
        method: 'POST',
        agentOptions: {
          pfx: self.PFXKEY,
          passphrase: self.MCHID
        },
        headers: {
          'Content-Type': 'text/xml'
        },
        body: xmlData
      }, function(err, res, body) {
        if (err) return reject(err);

        var result = JSON.parse(xml2json.toJson(body)).xml;
        if (result.return_code === 'FAIL') return reject(result);

        resolve(result);
      });
    });
  }

  /**
   * 向微信发起请求
   * @param {String} url
   * @param {String} method
   * @param {XMLDocument} data
   */
  _responseFromWX(url, method, data) {
    return new Promise((resolve, reject) => {
      request({
        url: url,
        method: method,
        body: data,
        headers: {
          'Content-Type': 'text/xml'
        }
      }, (err, res, body) => {
        // console.log(res)
        if (err) return reject(err);

        var result = JSON.parse(xml2json.toJson(body)).xml;

        if (result.return_code == 'FAIL') return reject(result);

        resolve(result);
      });
    });
  }

}

module.exports = WX;
