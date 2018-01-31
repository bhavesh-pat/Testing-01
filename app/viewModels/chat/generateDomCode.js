var router = require('plugins/router');
var signatureServices = require('services/signature/signature.service');
var commonFunction = require('dependencies/common');

window.payloadMap = new Object();
var response = {};
var payloadBody = {};

module.exports = generateDomCode = {
  updateSenderText: function(myMessage) {
    var html = '<div class="row msg_container base_receive"><div class="col-md-1 col-xs-1"></div><div class="col-md-11 col-xs-11 text-align-right"><div class="messages msg_receive" style="background: #DFF9CC"><p>';
    html += commonFunction.urlify(myMessage);
    html += '</div></div></div>';
    commonFunction.appendTextToDiv(html, "#chatBox", 0);
  },
  sendNativeChatMessage: function(myMessage, seq, buttonType, payloadValue) {
    showTypingIndicator();
    var myMessage = myMessage;
    var request = {};
    request.scope = "nchat";
    request.security = 'https';
    request.partnerDomain = globalPartnerDomain;
    request.payload = '';

    chatMessageJson.entry[0].id = sessionStorage.getItem('nativeChannelId');
    chatMessageJson.entry[0].time = Date.now();
    chatMessageJson.entry[0].messaging[0].sender.id = sessionStorage.getItem('nativeChatId');
    chatMessageJson.entry[0].messaging[0].recipient.id = sessionStorage.getItem('nativeChannelId');
    chatMessageJson.entry[0].messaging[0].timestamp = Date.now();
    if (chatMessageJson.entry[0].messaging[0].message === null) {
      chatMessageJson.entry[0].messaging[0].message = {};
    }

    if (buttonType === 'quickReply') {
      chatMessageJson.entry[0].messaging[0].message["quick_reply"] = {
        payload: payloadMap[myMessage]
      };
      delete payloadMap[myMessage];
    } else if (buttonType === 'postback') {

      if ((payloadValue === null) || (payloadValue === undefined)) {
        payloadValue = buttonPayloadMap[myMessage]
      }

      chatMessageJson.entry[0].messaging[0].postback = {
        payload: payloadValue
      };
      chatMessageJson.entry[0].messaging[0].message = null;
      delete payloadValue;
    }

    if (chatMessageJson.entry[0].messaging[0].message && (buttonType !== 'postback')) {
      chatMessageJson.entry[0].messaging[0].message.text = myMessage;
      chatMessageJson.entry[0].messaging[0].message.mid = "mid." + chatMessageJson.entry[0].messaging[0].timestamp + "." + getEntryID();
      chatMessageJson.entry[0].messaging[0].message.seq = seq++;
      if (buttonType !== 'quickReply') {
        chatMessageJson.entry[0].messaging[0].message["quick_reply"] = null;
      }
      if (buttonType !== 'postback') {
        chatMessageJson.entry[0].messaging[0].postback = null;
      }
    }


    request.sUrl = request.security + "://" + request.partnerDomain + "/rest/v1/customer/" + sessionStorage.getItem('customerId') + "/nchat/direct";
    request.method = "POST";
    btoken = 'Bearer ' + sessionStorage.getItem('bearerToken');
    
    try {
      signatureServices.getSignature("POST", request.security, request.sUrl, chatMessageJson, sessionStorage.getItem('customerId'), btoken).then(function(resp) {
        endOfRequest(resp);
        hideTypingIndicator(null, null, null);
        updateReplyText(resp.data, 0);
      }, function(error) {
        alert(error);
      });
      clearButtonArea();
    } catch (error) {
      router.navigate('?error=session_expired');
    }
    
  },
  initiateConversation: function() {
    var request = {};
    request.scope = "nchat";
    request.security = 'https';
    request.partnerDomain = globalPartnerDomain;
    request.payload = '';

    var currentDateTime = Date.now()
      // Payload
    conversationOperner.object = 'page';
    conversationOperner.entry[0].id = sessionStorage.getItem('nativeChannelId');
    conversationOperner.entry[0].time = Date.now();
    conversationOperner.entry[0].messaging[0].sender.id = sessionStorage.getItem('nativeChatId');
    conversationOperner.entry[0].messaging[0].recipient.id = sessionStorage.getItem('nativeChannelId');
    conversationOperner.entry[0].messaging[0].timestamp = Date.now();

    var customerInfo = {
      "native.firstName": sessionStorage.getItem('customerFirstName'),
      "native.lastName": sessionStorage.getItem('customerLastName'),
      "native.email": sessionStorage.getItem('customerEmail'),
      "command": sessionStorage.getItem('welcomeCommand')
    }

    conversationOperner.entry[0].messaging[0].optin.ref = encodedData(customerInfo);
    request.sUrl = request.security + "://" + request.partnerDomain + "/rest/v1/customer/" + sessionStorage.getItem('customerId') + "/nchat/direct";
    showTypingIndicator();
    request.method = "POST";
    btoken = 'Bearer ' + sessionStorage.getItem('bearerToken');

    try {
      signatureServices.getSignature("POST", "https://", request.sUrl, conversationOperner, sessionStorage.getItem('customerId'), btoken)
        .then(function(resp) {
          endOfRequest(resp);
          updateReplyText(resp.data, 0);
        }, function(error) {
          alternatively(error);
        });
    } catch (error) {
      router.navigate('?error=session_expired');
    }
  }
};

var clearButtonArea = function() {
  $("#buttonBox").remove('');
  $("#buttonSlider").html('<div id="buttonBox" class="bxslider"></div>');
  
  var windowHeight = $(window).outerHeight();
  var pannelFotter = $(".panel-footer").outerHeight();
  var finalHeight = (windowHeight - pannelFotter);
  // The 35 is set to top-margin to have to reduce the height. 
  finalHeight -= 35;
  $("#chatBox").css('height', finalHeight);
};

var updateReplyText = function(result, index) {
  var index = index;
  var showLoader = false;
  if (index > result.response["replies"].length - 1) {
    return;
  } else {
    if (Array.isArray(result.response["replies"])) {
      if (index > 0) {
        showTypingIndicator();
        delayedHideOfTypingIndicator(result, index, showLoader);
      } else {
        loadMessage(result, index, showLoader);
        $('#parloMessengerTextBox').attr('readonly', false);
        $("#firstTypingIdicator").remove();
      }
    }
  }
};

var loadMessage = function(result, i) {
  var responseReplies = result.response["replies"];
  if (responseReplies[i] === undefined) {
    
    return;
  }
  var carouselClass = '';
  if ((responseReplies[i]["message"]["attachment"] !== undefined) && (responseReplies[i]["message"]["attachment"]["payload"]["elements"] !== undefined)) {
    carouselClass = 'owl-carousel owl-theme';
  }
  
  var html = '<div class="row msg_container base_sent">';
  html += '<div class="col-xs-1 col-md-1"><img src="'+sessionStorage.getItem('customerLogo')+'" class="iconImageSize" /></div>';
  html += '<div class="col-md-11 col-xs-11"><div class="messages msg_sent '+carouselClass+'">';
  
  if (responseReplies[i]["message"].text !== undefined) {
    
    html += '<p>'
    html += commonFunction.urlify(responseReplies[i]["message"].text);
    html += '</p>'

  } else if (responseReplies[i]["message"]["attachment"] !== undefined) {
    
    if (responseReplies[i]["message"]["attachment"]["type"] === 'image') {
      var imageDetail = responseReplies[i]["message"]["attachment"]["payload"];
      // html += imageHtml(imageDetail, html);
      html += '<div class="row">';
      html += '<div class="col-xs-12"><img src="'+imageDetail["url"]+'" class="img-responsive"></div>';
      html += '</div>';
    } else {
      
      var images = responseReplies[i]["message"]["attachment"]["payload"]["elements"];
      var imagesLength = images.length;
      var maximumLink = getTheMaximumLength(imagesLength, images);
      
      for (var img = 0; img < imagesLength; img++) {

        if (images[img] !== undefined) {
          var imageTitle = wordTruncate(images[img]["title"], 80);
          var imageSubTitle = wordTruncate(images[img]["subtitle"], 80);

          html += '<div class="row main-carousel">'
          html += '<div class="col-xs-12 imageParentDiv"><div class="img-container"><img src="'+images[img]["image_url"]+'" class="img-responsive  carouselImage center-block text-center imageSupport" ></div></div>';
          html += '<div class="col-xs-12 titleSubTitle">';
          html += '<p>'+imageTitle+'</p>';
          html += '<p>'+imageSubTitle+'</p>';
          html += '</div>';
          
          var linkButtons = images[img]["buttons"];
          var linkButtonsLength = linkButtons.length
          var emptyRow = '<div class="col-xs-12 text-center" style="height: 42px;"></div>';

          if (maximumLink === 2) {
            if (linkButtonsLength === 1) {
              html += emptyRow;
            }
            $(".main-carousel").css('height', '10%');
          } else if (maximumLink === 3) {
            if (linkButtonsLength === 1) {
              html += emptyRow + emptyRow; 
            } else if (linkButtonsLength === 2) {
              html += emptyRow;
            }
          }

          for (var link = 0; link < linkButtonsLength; link++) {
            var carouselStyle = "";// carouselStyleClass(link, linkButtons.length);
            
            if (linkButtons[link]["type"] === 'web_url') {
              var url = commonFunction.formatUrl(linkButtons[link]["url"]) 
              html += '<div class="col-xs-12 text-center top-border'+carouselStyle+'"><p><a href="'+url+'" target="_blank" class="btn btn-link font-12">'+linkButtons[link]["title"]+'</a></p></div>';
              
            } else if (linkButtons[link]["type"] === 'postback') {
              
              var currentPayload  = linkButtons[link]["payload"].replace(/"/g, "'");
              var payload = JSON.parse(linkButtons[link]["payload"].replace("VERSION:1", ""));
              var payloadButtonText = payload.buttonText;

              html += '<div class="col-xs-12 text-center top-border'+carouselStyle+'"><p><button type="button" data-payload="'+ currentPayload +'" data-buttonType="' + linkButtons[link]["type"] + '" data-message="' + payloadButtonText + '" class="btn btn-link font-12 data-click">' + payloadButtonText + '</button></p></div>';
            }
            firstlink = false;
          }
          firstlink = true;
          html += "</div>"; // end of div row...
        }
      } //END of for loop
    }

  } // end of if condition

  html += '</div></div></div>';
  commonFunction.appendTextToDiv(html, "#chatBox", 0);
  
  var quickReplies = responseReplies[i]["message"].quick_replies;
  var linkButtons = responseReplies[i]["message"].buttons;
  isPagination = false;

  if (quickReplies != undefined) {
    addQuickReplyButton(quickReplies);
  }

  if (linkButtons != undefined) {
    addWebURLButton(linkButtons);
  }

  if (maximumLink === 1) {
    $(".main-carousel").css('height', '10%');
  } else if (maximumLink === 2) {
    $(".main-carousel").css('height', '10%');
  }
  // image and carousel slider
  $('.owl-carousel').owlCarousel(owlSlider);

  if (($('#buttonBox').length > 0) && (isPagination == true)) {
    $('.bxslider').bxSlider(bxSliderOption);
  } else {
    $("#buttonBox").children().css('padding-bottom', '10px');
  }
  updateReplyText(result, ++i);
}; //

var wordTruncate = function(text, count) {
  if ((text !== undefined) && (text.length > count)) {
    text = jQuery.trim(text).substring(0, count).split(" ").slice(0, -1).join(" ") + "...";
  }
  return text;
}

var getTheMaximumLength = function(imagesLength, images) {
  var maximumLength = 1;
  for (var img = 0; img < imagesLength; img++) {    
    var linkButtons = images[img]["buttons"];
    var linkButtonsLength = linkButtons.length
    if (linkButtonsLength > maximumLength) {
      maximumLength = linkButtonsLength;
    }
  }
  return maximumLength;
}


var carouselStyleClass = function(link, linkButtonsLength) {
  var carouselStyle = 'single-carosuel-link'; 
  if (linkButtonsLength === 1) {
    carouselStyle = 'single-carosuel-link';
  } else if (link === 0) {
    carouselStyle = 'top-carosuel-link'; 
  } else if ((link === 1) && (linkButtonsLength === 2)) { 
    carouselStyle = 'bottom-carosuel-link';
  } else if (link === 1) {
    carouselStyle = 'middle-carosuel-link';
  } else {
    carouselStyle = 'bottom-carosuel-link';
  }
  return carouselStyle;
}

var bxSliderOption = {
  infiniteLoop: false,
  hideControlOnEnd: true,
  pager: false,
  
  prevText: '<span class="custom-prev-html"><img src="app/stylesheets/images/left-arrow.svg"></span>',
  nextText: '<span class="custom-next-html"><img src="app/stylesheets/images/right-arrow.svg"></span>',
};

var owlSlider =  {
  slideSpeed: 300,
  paginationSpeed: 400,
  items: 1,
  stagePadding: 30,
  margin: 10,
  responsive:{
      0:{
          items:1
      },
      600:{
          items:1
      },
      1000:{
          items:1
      }
  }
};

var imageHtml = function(imageDetail, html) {
  html += '<div class="row">';
  html += '<div class="col-xs-12"><img src="'+imageDetail["url"]+'" class="img-responsive"></div>';
  html += '</div>';
  return html;
};

var addWebURLButton = function(buttonMessage) {
  if (Array.isArray(buttonMessage)) {
    var buttonMessageArray = buttonMessage.length;
    var buttonWidth = getButtonWidth(buttonMessageArray);

    var html = '<div class="button_messages msg_sent">';
    var fullRow = 0;
    var smallRow = 0;
    var buttonCount = 1;
    isPagination = false;

    for (i = 0; i < buttonMessageArray; i++) {

      if (buttonMessage[i].payload != undefined) {
        addRepliesButtonRetrun = addRepliesButton(fullRow, smallRow, html, buttonMessage, buttonMessageArray, buttonWidth);
        html = addRepliesButtonRetrun[0];

        fullRow = addRepliesButtonRetrun[1];
        smallRow = addRepliesButtonRetrun[2];

      } else {

        if (buttonMessage[i] == buttonMessage[buttonMessageArray - 1]) {
          if (smallRow === 1) {
            buttonWidth = 'button45';
          } else {
            buttonWidth = 'button100';
          }
        }

        if (buttonMessage[i].title.length > 20) {
          buttonWidth = 'button100';
          if (smallRow === 1) {
            fullRow += 1;
            smallRow = 0;
            html = replacePreviousSmallButton(html);
          }
        };

        if (buttonWidth === 'button100') {
          if (fullRow < 3) {
            fullRow += 1;
          }
        } else {
          smallRow += 1;
          if (smallRow === 2) {
            fullRow += 1;
            smallRow = 0;
          }
        }

        var protocol = commonFunction.findUrlProtocol(buttonMessage[i].url);
        var url = commonFunction.formatUrl(buttonMessage[i].url);

        html += '<a href="' + url + '" data-message="' + buttonMessage[i].title + '" data-buttonType="' + buttonMessage[i].type + '" class="btn btn-secondary linkButton button-reply ' + buttonWidth + '">' + buttonMessage[i].title + '</a>';
      }

      if (fullRow === 3) {
        html += '</div>'
        if (i != (buttonMessageArray - 1)) {
          html += '<div class="button_messages msg_sent">';
          remainingButton = buttonMessageArray - buttonCount;
          buttonWidth = getButtonWidth(remainingButton);
          isPagination = true;
        }
        fullRow = 0;
      } else if (i == (buttonMessageArray - 1)) {
        html += '</div>';
        fullRow = 0;
      }

      buttonCount += 1;
    }

    commonFunction.appendTextToDiv(html, "#buttonBox", buttonMessageArray);
  }
};

var addQuickReplyButton = function(buttonMessage) {
  var buttonMessageArray = buttonMessage.length;
  var buttonWidth = getButtonWidth(buttonMessageArray);

  if (Array.isArray(buttonMessage)) {
    var html = '<div class="button_messages msg_sent">';
    var fullRow = 0;
    var smallRow = 0;
    var buttonCount = 1;
    isPagination = false;

    for (i = 0; i < buttonMessageArray; i++) {
      addRepliesButtonRetrun = addRepliesButton(fullRow, smallRow, html, buttonMessage, buttonMessageArray, buttonWidth);
      html = addRepliesButtonRetrun[0];
   
      fullRow = addRepliesButtonRetrun[1];
      smallRow = addRepliesButtonRetrun[2];
      
      if (fullRow === 3) {
        html += '</div>'
        if (i != (buttonMessageArray - 1)) {
          html += '<div class="button_messages msg_sent">';
          remainingButton = buttonMessageArray - buttonCount;
          buttonWidth = getButtonWidth(remainingButton);
          isPagination = true;
        } else {
          // html += '</div>';
        }
        fullRow = 0;
      } else if (i === (buttonMessageArray - 1)) {
        html += '</div>';
      }
      buttonCount += 1;
    }
  }
  commonFunction.appendTextToDiv(html, "#buttonBox", buttonMessageArray);
};


var addRepliesButton = function(fullRow, smallRow, html, buttonMessage, buttonMessageArray, buttonWidth) {
  var payload = JSON.parse(buttonMessage[i].payload.replace("VERSION:1", ""));
  var payloadButtonText = payload.buttonText;

  if (payloadButtonText.length > 20) {
    buttonWidth = 'button100';
    if (smallRow === 1) {
      fullRow += 1;
      smallRow = 0;

      //this code is added on 13th November 2017, as the fullrow count was coming to 4 and the last row had only one button100 class
      // and previous button was button45
      if (fullRow >= 3) {
        isPagination = true;
        html += '</div><div class="button_messages msg_sent">';
      }      
      html = replacePreviousSmallButton(html);
    }
  };

  if (buttonMessage[i] === buttonMessage[buttonMessageArray - 1]) {
    if (smallRow === 1) {
      buttonWidth = 'button45';
    } else {
      buttonWidth = 'button100';
    }
  };

  if (buttonWidth === 'button100') {
    if (fullRow < 3) {
      fullRow += 1;
    } 
  } else {
    smallRow += 1;
    if (smallRow === 2) {
      fullRow += 1;
      smallRow = 0;
    }
  };

  var buttonType = (buttonMessage[i].type) ? buttonMessage[i].type : 'quickReply';
  html += '<button type="button" data-buttonType="' + buttonType + '" data-message="' + payloadButtonText + '" class="data-click btn btn-secondary button-reply ' + buttonWidth + '">' + payloadButtonText + '</button>';
  return [html, fullRow, smallRow];
};

var replacePreviousSmallButton = function(str) {
  var word = 'button45';
  var newWord = 'button100';
  var n = str.toLowerCase().lastIndexOf(word.toLowerCase());
  var pat = new RegExp(word, 'i');

  str = str.slice(0, n) + str.slice(n).replace(pat, newWord);
  return str
};

var getButtonWidth = function(buttonCount) {
  switch (parseInt(buttonCount)) {
    case 1:
      return 'button100';
    case 2:
      return 'button100';
    case 3:
      return 'button100';
    default:
      return 'button45'
  };
}

function getEntryID() {
  var str = Date.now().toString();
  return str.split('').sort(function() {
    return 0.5 - Math.random()
  }).join('');
};

//This function need to be shifted to utility function
function encodedData(payload) {
  return btoa(JSON.stringify(payload));
}


function delayedHideOfTypingIndicator(result, index, showLoader) {
  setTimeout(function() {
    hideTypingIndicator(result, index, showLoader)
  }, typingIndicatorTimeInterval);
}

$(window).resize(function(){
  resizeChatWindow();
})

var resizeChatWindow = function() {
  var newheight = $(window).height();
  var pannelFotter = $(".panel-footer").height();
  var buttonSliderHeight = $("#buttonSlider").height();
  var totalButtonSliderHeight = parseFloat(buttonSliderHeight) - parseFloat(pannelFotter);
  var finalHeight = parseFloat(newheight) - parseFloat(totalButtonSliderHeight);
  finalHeight -= 127;
  // $("#chatBox").css('height', finalHeight).animate({
  //   scrollTop: 10000
  // }, 'normal');
}

function hideTypingIndicator(result, index, showLoader) {
  $('.typing_indicator').parent().parent().parent().parent().remove();
  if (result) {
    loadMessage(result, index, showLoader);
    $("#firstTypingIdicator").remove();
  }
  if ((result != null) && (index === (parseInt(result.response["replies"].length) - 1))) {
    $('#parloMessengerTextBox').attr('readonly', false);
  }
}

function showTypingIndicator() {
  $('#parloMessengerTextBox').attr('readonly', true);
  var html = '<div class="row msg_container base_sent"><div class="col-xs-1 col-md-1"><img src="'+sessionStorage.getItem('customerLogo')+'" class="iconImageSize" /></div><div class="col-md-11 col-xs-11"><div class="messages msg_sent"><p>';
  html += '<image class="typing_indicator" height="20" width="45" src="app/stylesheets/images/typing-indicator.gif"></image>';
  html += '</p></div></div></div>';
  commonFunction.appendTextToDiv(html, "#chatBox");
}

function endOfRequest(resp) {
  response.body = resp.data;

  var replies = resp.data.response.replies;
  if (Array.isArray(replies)) {

    for (var i = 0; i < replies.length; i++) {
      var reply = replies[i].message.text;
      if (reply) {
        payloadBody.messages += "\n< " + reply;
      }

      var quick_replies = replies[i].message.quick_replies;
      if (quick_replies) {
        setQuickRepliesPayLoad(quick_replies);
      }

      var buttons = replies[i].message.buttons;
      if (buttons) {
        setButtonsPayLoad(buttons);
      }

      var attachment = replies[i].message.attachment;
      if (attachment) {
        attachment = attachment.payload.elements;
        if (attachment !== undefined) {
          setCarouselPayLoad(attachment);
        }
      }
    }
  }
  // payloadBody.responseAreaText = "Response body:\n" + JSON.stringify(response.body) + "\n\n Headers:\n" + JSON.stringify(response.headers);
};

var setCarouselPayLoad = function(attachment) {
  window.buttonPayloadMap = {};
  payloadBody.messages += "\n ";
  for (var a = 0; a < attachment.length; a++) {
    var buttons = attachment[a].buttons;
    for (var k = 0; k < buttons.length; k++) {
      if (buttons[k].type === "web_url") {
        payloadBody.messages = payloadBody.messages + "[ " + buttons[k].url + " ]   ";
      }
      if (buttons[k].type === "postback") {
        payloadBody.messages = payloadBody.messages + "[ " + buttons[k].title + " ]   ";
        buttonPayloadMap[buttons[k].title] = buttons[k].payload;
      }
    }
  }
};

var setButtonsPayLoad = function(buttons) {
  window.buttonPayloadMap = {};
  payloadBody.messages += "\n ";
  for (var k = 0; k < buttons.length; k++) {

    if (buttons[k].type === "web_url") {
      payloadBody.messages = payloadBody.messages + "[ " + buttons[k].url + " ]   ";
    }
    if (buttons[k].type === "postback") {
      payloadBody.messages = payloadBody.messages + "[ " + buttons[k].title + " ]   ";
      buttonPayloadMap[buttons[k].title] = buttons[k].payload;
    }
  }
};

var setQuickRepliesPayLoad = function(quick_replies) {
  window.payloadMap = new Object();
  payloadBody.messages += "\n ";
  for (var j = 0; j < quick_replies.length; j++) {
    payloadBody.messages = payloadBody.messages + "( " + quick_replies[j].title + " )   ";
    payloadMap[quick_replies[j].title] = quick_replies[j].payload;
  }
}

var chatMessageJson = {
  object: "page",
  entry: [{
    id: 0,
    time: 0,
    messaging: [{
      sender: {
        id: 0
      },
      recipient: {
        id: 0
      },
      timestamp: 0,
      message: {
        mid: "mid.1489597091800:4c69742850a0fae602", // why this is hard coded?
        seq: 0,
        text: ""
      }
    }]
  }]
};


//This need to be moved in model repository

var conversationOperner = {
  object: "page",
  entry: [{
    id: 0,
    time: 0,
    messaging: [{
      sender: {
        id: 0
      },
      recipient: {
        id: 0
      },
      timestamp: 0,
      optin: {
        ref: "",

      }
    }]
  }]
};