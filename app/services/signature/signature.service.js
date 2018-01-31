var CryptoJS = require('dependencies/crypto-js');
var $http = require('services/httpHandler/httpHandler');


module.exports = signatureServices = {
  getSignature: function getResponseWithSignature(method, protocol, url, payload, keyForSignature, bToken) {
    var sessionToken = '';

    if (request.sessionToken !== undefined) {
      var sessionToken = request.sessionToken;
    }

    var clientStoreId = '';
    if (protocol.indexOf("://") == -1) {
      protocol = protocol + "://";
    }
    var sessionTokenHeader = "";
    var clientStoreTokenHeader = "";
    var isoDate = ISODateString(new Date());
    var calculatedSign = generateSignature(method, url, isoDate, sessionToken, clientStoreId, payload, keyForSignature);

    request.xbuySign = calculatedSign;
    var ottHeader = "";

    if (request.oneTimeToken) {
      ottHeader = ", ott " + request.oneTimeToken;
    }

    if (bToken == undefined) {
      requestPartnerId = request.partnerId;
    } else {
      requestPartnerId = keyForSignature;
    }
    var authHeader = "BilleoV1 " + requestPartnerId + ":" + request.xbuySign + ", " + bToken + ottHeader;

    //please do not remove this code

    // if (user.name && user.password) {
    //   // console.log("Adding basic auth header: " + user.name + " -> " + user.password);
    //   var toBeEncoded = user.name + ":" + user.password;
    //   var encodedStr = btoa(toBeEncoded);
    //   // console.log(encodedStr + " : should be decoded to: " + atob(encodedStr)),
    //   authHeader = "Basic " + encodedStr;
    // }

    var headers = {
      "Content-Type": "multipart/form-data",
      "xbuy-date": isoDate,
      "Authorization": authHeader
    };

    if (request.sessionToken) {
      headers["xbuy-session-token"] = request.sessionToken;
    }
    if (request.clientStoreId) {
      headers["xbuy-clientstore-token"] = request.clientStoreId;
    }

    var promise = new Promise(function(resolve, reject) {
      var config = {
        method: method,
        url: url,
        headers: headers,
        data: payload
      };
      $http(url).put(config).then(function(data) {
          resolve(data);
      });
    });
    return promise;
  }
};

function ISODateString(d) {
  function pad(n) {
    return n < 10 ? '0' + n : n
  }
  return d.getUTCFullYear() + '-' + pad(d.getUTCMonth() + 1) + '-' + pad(d.getUTCDate()) + 'T' + pad(d.getUTCHours()) + ':' + pad(d.getUTCMinutes()) + ':' + pad(d.getUTCSeconds()) + 'Z';

};

function generateSignature(method, requestUrl, xBuyDateValue, sessionToken, clientStoreHeader, payloadRaw, secret) {
  var HTTPRequestMethod = method.trim();
  var url = new URLUtils(requestUrl);
  var host = url.hostname;
  var HTTPRequestHostname = host;
  var path = encodeURIComponent(url.pathname.toLowerCase());
  var CanonicalURI = path;
  var qs = decodeURIComponent(url.search.replace("?", ""));

  if (qs.indexOf("itemurl") > -1) {
    var iUrl = qs.split("itemurl");
    var itemUrl = iUrl[1];
    if (itemUrl.indexOf("&") > -1) {
      itemUrl = itemUrl.substring(1, itemUrl.indexOf("&"));
    }

    itemUrl = itemUrl.replace("=", "");
    var encItemUrl = encodeURIComponent(itemUrl);
    qs = qs.replace(itemUrl, encItemUrl);
  }

  var CanonicalQueryString = qs;

  var dateHeadStr = "xbuy-date=" + xBuyDateValue + "\n";

  var clientStoreHeadStr = "";
  if (clientStoreHeader) {
    clientStoreHeadStr = "xbuy-clientstore-token=" + clientStoreHeader + "\n";
  }

  var sessionTokenHeadStr = "";
  if (sessionToken) {
    sessionTokenHeadStr = "xbuy-session-token=" + sessionToken + "\n";
  }

  var CanonicalHeaders = clientStoreHeadStr + dateHeadStr + sessionTokenHeadStr;
  var payload = (payloadRaw && JSON.stringify(payloadRaw)) || "";

  var canonicalString = HTTPRequestMethod + "\n" +
    HTTPRequestHostname + "\n" +
    CanonicalURI + "\n" +
    CanonicalQueryString + "\n" +
    CanonicalHeaders +
    CryptoJS.enc.Hex.stringify(CryptoJS.SHA256(payload)) + "\n";

  // var canonicalString = config.method + "\n" + 
  // HTTPRequestHostname + "\n" + 
  // CanonicalURI + "\n" + 
  // CanonicalQueryString + "\n" + 
  // CanonicalHeaders + "\n" + 
  // CryptoJS.enc.Hex.stringify(CryptoJS.SHA256(RequestPayload)) + "\n";

  var rawHmac = CryptoJS.HmacSHA1(canonicalString, secret);
  var base64Encoded = CryptoJS.enc.Base64.stringify(rawHmac);

  return base64Encoded;
};


function URLUtils(url, baseURL) {
  var m = String(url).replace(/^\s+|\s+$/g, "").match(/^([^:\/?#]+:)?(?:\/\/(?:([^:@\/?#]*)(?::([^:@\/?#]*))?@)?(([^:\/?#]*)(?::(\d*))?))?([^?#]*)(\?[^#]*)?(#[\s\S]*)?/);
  if (!m) {
    throw new RangeError();
  }
  var protocol = m[1] || "";
  var username = m[2] || "";
  var password = m[3] || "";
  var host = m[4] || "";
  var hostname = m[5] || "";
  var port = m[6] || "";
  var pathname = m[7] || "";
  var search = m[8] || "";
  var hash = m[9] || "";
  if (baseURL !== undefined) {
    var base = new URLUtils(baseURL);
    var flag = protocol === "" && host === "" && username === "";
    if (flag && pathname === "" && search === "") {
      search = base.search;
    }
    if (flag && pathname.charAt(0) !== "/") {
      pathname = (pathname !== "" ? (((base.host !== "" || base.username !== "") && base.pathname === "" ? "/" : "") + base.pathname.slice(0, base.pathname.lastIndexOf("/") + 1) + pathname) : base.pathname);
    }
    // dot segments removal
    var output = [];
    pathname.replace(/^(\.\.?(\/|$))+/, "").replace(/\/(\.(\/|$))+/g, "/").replace(/\/\.\.$/, "/../").replace(/\/?[^\/]*/g, function(p) {
      if (p === "/..") {
        output.pop();
      } else {
        output.push(p);
      }
    });
    pathname = output.join("").replace(/^\//, pathname.charAt(0) === "/" ? "/" : "");
    if (flag) {
      port = base.port;
      hostname = base.hostname;
      host = base.host;
      password = base.password;
      username = base.username;
    }
    if (protocol === "") {
      protocol = base.protocol;
    }
  }
  this.origin = protocol + (protocol !== "" || host !== "" ? "//" : "") + host;
  this.href = protocol + (protocol !== "" || host !== "" ? "//" : "") + (username !== "" ? username + (password !== "" ? ":" + password : "") + "@" : "") + host + pathname + search + hash;
  this.protocol = protocol;
  this.username = username;
  this.password = password;
  this.host = host;
  this.hostname = hostname;
  this.port = port;
  this.pathname = pathname;
  this.search = search;
  this.hash = hash;
};