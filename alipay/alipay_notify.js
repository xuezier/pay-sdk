'use strict';

var util = require('ym-util');
class AlipayNotify {
  constructor(alipay) {
    var self = this;
    self.config = alipay.config;
  }

  /**
   * 针对notify_url验证消息是否是支付宝发出的合法消息
   * @return 验证结果
   */
  verifyNotify(_POST) {
    if (Object.keys(_POST).length == 0) { //判断POST来的数组是否为空
      return false;
    } else {
      //生成签名结果
      var isSign = this.getSignVeryfy(_POST, _POST['sign']);
      return isSign;
    }
  }

  /*
   * 除去待签名参数数组中的空值和签名参数
   */
  paraFilter(para) {
    var para_filter = {};
    for (var key in para) {
      if (key == 'sign' || key == 'sign_type' || para[key] == '') {
        continue;
      } else {
        para_filter[key] = para[key];
      }
    }
    return para_filter;
  }

  /*
   * 对象字典排序
   */
  argSort(para) {
    var result = {};
    var keys = Object.keys(para).sort();
    for (var i = 0; i < keys.length; i++) {
      var k = keys[i];
      result[k] = para[k];
    }
    return result;
  }

  /*
   * 把数组所有元素，按照“参数=参数值”的模式用“&”字符拼接成字符串
   */
  createLinkstring(para) {
    var arr = [];
    for (var key in para) {
      arr.push(`${key}=${para[key]}`);
    }
    return arr.join('&');
  }

  /**
   * 获取返回时的签名验证结果
   * @param para_temp 通知返回来的参数数组
   * @param sign 返回的签名结果
   * @return 签名验证结果
   */
  getSignVeryfy(para_temp, sign) {
    var self = this;

    //除去待签名参数数组中的空值和签名参数
    var para_filter = self.paraFilter(para_temp);

    //对待签名参数数组排序
    var para_sort = self.argSort(para_filter);

    //把数组所有元素，按照“参数=参数值”的模式用“&”字符拼接成字符串
    var prestr = self.createLinkstring(para_sort);

    var isSgin = false;

    var sign_type = this.config['sign_type'].trim().toUpperCase();
    if (sign_type == 'MD5') {
      var mysign = util.md5(prestr, self.config.KEY);
      isSgin = (mysign == sign);
    } else {
      isSgin = false;
    }
    return isSgin;
  }
}

module.exports = AlipayNotify;
