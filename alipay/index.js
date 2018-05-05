'use strict';
// 内置包
var fs = require('fs');
var url = require('url');
var querystring = require('querystring');

// 第三方包
var request = require('request');
var xml2json = require('xml2json');

// 自身插件
var default_alipay_config = require('./alipay_config');
var core = require('./alipay_core');
var fun = require('./alipay_fun');

class ALIPAY {
  constructor(options) {
    var self = this;

    if (!(('KEY' in options) && ('EMAIL' in options) && ('PARTNER' in options) && ('APPID' in options)))
      throw new Error('first argument is json has keys KEY,EMAIL,PARTNER');
    // 基本配置参数
    self.config = default_alipay_config;
    // 覆盖参数
    for (var key in options) {
      self.config[key] = options[key];
    }
    // 如果配置了私钥，则将私钥预先读取出来
    self.config.PRIVATE_KEY && (self.config.PRIVATE_KEY = fs.readFileSync(self.config.PRIVATE_KEY));
    // 业务接口地址
    self.config.biz_url = {
      return_url: url.resolve(self.config.host, self.config.create_direct_pay_by_user_return_url),
      notify_url: url.resolve(self.config.host, self.config.create_direct_pay_by_user_notify_url)
    };

    self.method = {
      PC: 'pc',
      WAP: 'wap'
    };
  }

  /**
   * create pay url
   * @param {Object} options
   */
  createUrl(options) {
    var self = this;

    var url = self.config.url[options.method];
    // 校验参数
    options = core.params(self, options);
    // 拼接参数
    options = core.spliceParams(options);
    // 参数签名
    options = core.signMD5(options, self.config.KEY);

    url += options.signStr;

    if (options.method == 'pc') {
      options.url = url;
      return Promise.resolve(options);
    }
    if (options.method == 'wap') {
      return new Promise((resolve, reject) => {
        // console.log(url);
        request(url, (err, res, body) => {
          body = decodeURIComponent(body);
          if (err) {
            reject(err);
            return;
          }

          try {
            // 格式化参数
            var qs_data = querystring.parse(body);
            // 解析xml获取token
            var res_data = JSON.parse(xml2json.toJson(qs_data.res_data));
            var req_data = `<auth_and_execute_req><request_token>${res_data.direct_trade_create_res.request_token}</request_token></auth_and_execute_req>`;
            qs_data.req_data = req_data;
          } catch (e) {
            reject(e);
          }

          // 删除无关参数
          delete qs_data.res_data;
          delete qs_data.sign;

          // 重新组装参数
          qs_data.service = 'alipay.wap.auth.authAndExecute';
          qs_data.format = 'xml';
          qs_data._input_charset = self.config._input_charset;
          qs_data.method = options.method;

          qs_data = core.spliceParams(qs_data);
          qs_data = core.signMD5(qs_data, self.config.KEY);

          var wap_url = `${self.config.url[options.method]}${qs_data.signStr}`;

          options.url = wap_url;
          resolve(options);
        });
      });
    }
  }

  /**
   * 验签
   * @param {Object} opts
   */
  verifySign(opts) {
    var self = this;

    var { sign, sign_type, notify_id } = opts;

    if (notify_id) {
      var qs = querystring.stringify({
        partner: self.config.PARTNER,
        notify_id
      });

      var url = `${self.config.url.verify}${qs}`;
      return new Promise((resolve, reject) => {
        request(url, (err, res, body) => {
          if (err) return reject(err);

          if (body + '' == 'true')
            return resolve(body);

          reject(body + '');
        });
      });
      // return new Promise((resolve,reject)=>{
      //   request()
      // })
    }

    console.log(self.config.KEY);
    // delete opts.sign;
    // opts = core.spliceParams(opts);
    // opts = core.signMD5(opts, self.config.KEY);


    // console.log(opts);
  }

  /**
   * 查询支付宝订单状态
   * @param {Object} opts
   * @param {String} opts.out_trade_no
   * @param {String} opts.trade_no
   */
  query(opts) {
    var self = this;
    var biz_content = {};
    if (opts.trade_no) biz_content.trade_no = opts.trade_no;
    else if (opts.out_trade_no) biz_content.out_trade_no = opts.out_trade_no;
    else throw new Error('param out_trade_no or trade_no must has one');

    var content = {
      timestamp: new Date().Format('YYYY-MM-DD hh:mm:ss'),
      method: self.config.method.query,
      app_id: self.config.APPID,
      sign_type: 'RSA',
      version: '1.0',
      charset: 'utf-8',
      biz_content: JSON.stringify(biz_content)
    };

    content = core.spliceParams(content);
    content.sign = core.signRSA(decodeURIComponent(content.signStr), self.config.PRIVATE_KEY);
    delete content.signStr;

    var qs = querystring.stringify(content);
    var url = `${self.config.url.query}${qs}`;

    return new Promise((resolve, reject) => {
      request(url, (err, res, body) => {
        if (err) return reject(err);

        var data = JSON.parse(body);

        if (data.alipay_trade_query_response.code == 10000) return resolve(data);

        reject(data);
      });
    });
  }

  /**
   * 关闭订单
   * @param {Object} opts
   * @param {String} opts.out_trade_no
   * @param {String} opts.trade_no
   */
  close(opts) {
    var self = this;

    var url = self.config.url.pc;

    var content = {
      // notify_url: 'http://cpapi.tlifang.com/alipay/redirect',
      out_trade_no: opts.out_trade_no,
      // service: 'trade_close',
      service: 'close_trade',
      _input_charset: self.config._input_charset,
      partner: self.config.PARTNER,
      seller_email: self.config.EMAIL,
    };

    content = core.spliceParams(content);
    content = core.signMD5(content, self.config.KEY);



    url += content.signStr + `&sign=${content.sign}&sign_type=MD5`;
    // console.log(content)
    // console.log(url)
    return new Promise((resolve, reject) => {

      request(url, {
        method: 'POST',
      }, function(err, res, body) {
        resolve(body);
      });
    });
  }


  // close(opts) {
  //   var self = this;
  //   var biz_content = {};
  //   if (opts.trade_no) biz_content.trade_no = opts.trade_no;
  //   else if (opts.out_trade_no) biz_content.out_trade_no = opts.out_trade_no;
  //   else throw new Error('param out_trade_no or trade_no must has one');

  //   if (opts.operator_id) biz_content.operator_id = opts.operator_id;

  //   var content = {
  //     timestamp: new Date().Format('YYYY-MM-DD hh:mm:ss'),
  //     method: self.config.method.close,
  //     app_id: self.config.APPID,
  //     sign_type: 'RSA',
  //     version: '1.0',
  //     charset: 'utf-8',
  //     notify_url:'https://cpapi.tlifang.com/alipay/redirect',
  //     biz_content: JSON.stringify(biz_content)
  //   };

  //   content = core.spliceParams(content);
  //   content.sign = core.signRSA(decodeURIComponent(content.signStr), self.config.PRIVATE_KEY);
  //   delete content.signStr;

  //   var qs = querystring.stringify(content);
  //   var url = `${self.config.url.close}${qs}`;

  //   return new Promise((resolve, reject) => {
  //     request(url, (err, res, body) => {
  //       if (err) return reject(err);

  //       var data = JSON.parse(body);

  //       if (data.alipay_trade_close_response.code == 10000) return resolve(data);

  //       reject(data);
  //     });
  //   });
  // }

  /**
   * 对账单下载
   * @param {Object} opts
   * @param {Enum} opts.bill_type trade、signcustomer
   * @param {String} opts.bill_date  formati like YYYY-MM or YYYY-MM-DD
   */
  bill(opts) {
    var self = this;

    var { bill_type, bill_date } = opts;

    var content = {
      timestamp: new Date().Format('YYYY-MM-DD hh:mm:ss'),
      method: self.config.method.bill,
      app_id: self.config.APPID,
      sign_type: 'RSA',
      charset: 'utf-8',
      version: '1.0',
      biz_content: JSON.stringify({ bill_type, bill_date })
    };

    content = core.spliceParams(content);
    content.sign = core.signRSA(decodeURIComponent(content.signStr), self.config.PRIVATE_KEY);
    delete content.signStr;

    var qs = querystring.stringify(content);

    var url = `${self.config.url.bill}${qs}`;
    // console.log(url);
    return new Promise((resolve, reject) => {
      request(url, (err, res, body) => {
        if (err) return reject(err);

        var data = JSON.parse(body);

        // console.log(querystring.stringify(data));


        resolve(JSON.parse(body));
      });
    });
  }

  /**
   * Route alipay app return url and notify url
   * @param {Object} app
   */
  route(app) {
    var self = this;
    app.get(self.config.create_direct_pay_by_user_return_url, function(req, res) { self.create_direct_pay_by_user_return_url(req, res); });
    app.post(self.config.create_direct_pay_by_user_notify_url, function(req, res) { self.create_direct_pay_by_user_notify_url(req, res); });
    app.post(self.config.refund_fastpay_by_platform_pwd_notify_url, function(req, res) { self.refund_fastpay_by_platform_pwd_notify_url(req, res); });
  }
}

// 安装接口方法
fun(ALIPAY);

module.exports = ALIPAY;
