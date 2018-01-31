var moment = require('moment-timezone');

module.exports = commonFunction = {
  uniqueNumber: function() {
    var date = moment().tz("America/Los_Angeles");
    var randomNumber = date.format("YYYY-MM-DD-HH") + '-' + Math.random().toString() + date.format('HH:mm:ss').toString();
    return randomNumber;
  },
  urlify: function(text) {
    var urlRegex = /(https?:\/\/[^\s]+)/g;
    return text.replace(urlRegex, function(url) {
      var onClick = "window.open('" + url + "', 'mywindow', 'location=1,status=1,scrollbars=1, resizable=1, directories=1, toolbar=1, titlebar=1'); return false;";
      return '<a href="' + url + '" onclick="' + onClick + '"); return false;">' + url + '</a>';
    });
  },
  findUrlProtocol: function(url) {
    var protocol = window.location.protocol.replace(/:/g, '')
    return protocol
  },
  getParameterByName: function(name, url) {
    if (!url) url = window.location.href;
    name = name.replace(/[\[\]]/g, "\\$&");
    var regex = new RegExp("[?&]" + name + "(=([^&#]*)|&|#|$)"),
      results = regex.exec(url);
    if (!results) return null;
    if (!results[2]) return '';
    return decodeURIComponent(results[2].replace(/\+/g, " "));
  },
  appendTextToDiv: function(html, selector, buttonCount) {
    $(selector).append(html);
    
    // $('#chatBox').animate({
    //   scrollTop: 10000
    // }, 'normal');
  
    if (selector == "#buttonBox") {
      var $buttonSlider = $("#buttonSlider");
      var windowHeight = $(window).outerHeight();
      var pannelFotter = $(".panel-footer").outerHeight();
      var totalOccupiedHeight = 0;
      var finalHeight = 0;
      
      if ($buttonSlider.length > 0) {
        $buttonSlider.removeClass('hide');
        var buttonSliderHeight = $("#buttonSlider").outerHeight();
        totalOccupiedHeight = buttonSliderHeight + pannelFotter;
        finalHeight = windowHeight - totalOccupiedHeight;
        
      } else {
        finalHeight = chatWindow - pannelFotter;
      }
  
      // The 35px is given to top-margin... 
      finalHeight -= 35;
      
      $("#chatBox").css('height', finalHeight);
    }
    if ($("#chatBox").length > 0) {
      var scrollHeight = $("#chatBox")[0].scrollHeight;
      scrollHeight += 35;
      $("#chatBox").scrollTop(scrollHeight);

    }
  },
  formatUrl: function(url){
    var httpString = 'http://', httpsString = 'https://';

    if (url.substr(0, httpString.length) !== httpString && url.substr(0, httpsString.length) !== httpsString) {
      url = httpString + url;
    }
    return url;
  }
};