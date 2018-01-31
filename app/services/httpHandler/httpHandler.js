var commonFunction = require('dependencies/common');

module.exports = function $http(url) {
  // A small example of object
  var core = {
    // Method that performs the ajax request
    ajax: function(method, url, args) {
      // Creating a promise
      var promise = new Promise(function(resolve, reject) {
        // Instantiates the XMLHttpRequest
        var client = new XMLHttpRequest();
        var uri = url;
        if (args && (method === 'PUT')) {
          uri += '?';
          var argcount = 0;
          for (var key in args) {
            if (args.hasOwnProperty(key)) {
              if (argcount++) {
                uri += '&';
              }
              uri += encodeURIComponent(key) + '=' + encodeURIComponent(args[key]);
            }
          }
        }
        client.open(method, uri);
        if (args && args.headers) {
          var keys = Object.keys(args.headers);
          for (var i = 0; i < keys.length; i++) {
            client.setRequestHeader(keys[i], args.headers[keys[i]]);
          }
        }
        if (args && args.data) {
          client.send(JSON.stringify(args.data));
        } else {
          client.send();
        }
        client.onload = function() {
          if (this.status >= 200 && this.status < 300) {
            // Performs the function "resolve" when this.status is equal to 2xx
            this.response ? resolve(JSON.parse(this.response)) : resolve(this);
          } else {
            // Performs the function "reject" when this.status is different than 2xx
            var data = {};
            try {
              data = JSON.parse(this.responseText);
            } catch (e) {
              data = this.statusText;
            }
            if (data.error && data.error.message && data.error.message == "Invalid bearer token") {
              BotUI.sessionOutOverlay();
            } else {
              reject(data);
            }
          }
        };
        client.onerror = function() {
          reject(this.statusText);
        };
      });
      // Return the promise
      return promise;
    },
    put: function(method, url, args) {
      var promise = new Promise(function(resolve, reject) {
        var request = new XMLHttpRequest();
        request.open(args.method, url, true);
        if (args && args.headers) {
          var keys = Object.keys(args.headers);
          for (var i = 0; i < keys.length; i++) {
            request.setRequestHeader(keys[i], args.headers[keys[i]]);
          }
        }
        request.onreadystatechange = function() {
          httpError = false;
          
          if (request.status && parseInt(request.readyState) !== 2) {
            if (request.readyState == 4 && request.status == 201) {
              return resolve({
                headers: request.getAllResponseHeaders(),
                data: JSON.parse(request.responseText)
              });
            } else if (((request.status === 200) || (request.status === 500)) && request.readyState == 4) {
              if (!!request.responseText) {
                if ((request.responseText).charAt(0) !== '<') {
                  resolve({
                    data: {
                      status: request.status,
                      response: JSON.parse(request.responseText)
                    }
                  });
                } else {
                  $(".login-error-message").html("Please refresh the browser to continue");
                  return reject(request.responseText);
                }
              } else {
                resolve({
                  data: {
                    status: request.status
                  }
                });
              }
            } if (request.readyState === 4 && request.status == 403) {
              $(".login-error-message").html("Sorry! We are experiencing technical difficulties, please try after some time.");
            } if (request.readyState === 4 && ((request.status === 400) || (request.status === 404) )) {
              showErrorMessege();
              return reject(request.responseText);
            } else {
              if (request.readyState === 4 && request.status != 201) {
                return reject(request.responseText);
              }
            }
          }


        };
        if (args.isImage) {
          request.send(args.data);
        } else {
          request.send(JSON.stringify(args.data));
        }
      });
      return promise;
    }
  };

  var showErrorMessege = function() {
    var html = '<div class="row msg_container base_sent"><div class="col-xs-1 col-md-1"><img src="'+sessionStorage.getItem('customerLogo')+'" class="iconImageSize" /></div><div class="col-md-11 col-xs-11"><div class="messages msg_sent"><p>';
    html += "Oops! I was multitasking and lost myself. Please refresh the browser to continue."
    html += '</p></div></div></div>';
    commonFunction.appendTextToDiv(html, "#chatBox", 0);
    $(".typing_indicator").closest(".msg_container").remove();
    $("#parloMessengerTextBox").prop("readonly", false);
  }

  var showCommonErrorMessege = function() {
    var html = '<div class="row msg_container base_sent"><div class="col-xs-1 col-md-1"><img src="'+sessionStorage.getItem('customerLogo')+'" class="iconImageSize" /></div><div class="col-md-11 col-xs-11"><div class="messages msg_sent"><p>';
    html += "Please refresh the browser to continue"
    html += '</p></div></div></div>';
    commonFunction.appendTextToDiv(html, "#chatBox", 0);
    $(".typing_indicator").closest(".msg_container").remove();
    $("#parloMessengerTextBox").prop("readonly", false);
  }

  // Adapter pattern
  return {
    'get': function(args) {
      return core.ajax('GET', url, args);
    },
    'post': function(args) {
      return core.ajax('POST', url, args);
    },
    'put': function(args) {
      return core.put('PUT', url, args);
    },
    'delete': function(args) {
      return core.ajax('DELETE', url, args);
    }
  };
}