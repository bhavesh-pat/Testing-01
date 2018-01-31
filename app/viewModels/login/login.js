var ko = require('knockout');
var router = require('plugins/router');
var ViewModel = require('viewModels/class');
var signatureServices = require('services/signature/signature.service');
var commonFunction = require('dependencies/common');

function Login() {
  var screenName = commonFunction.getParameterByName('screen', window.location);
  this.screenLayout = ko.observable(screenName);
  sessionStorage.setItem('screenLayoutName', screenName);
  
  if (screenName == 'none') {
    goToChatScreen();
  } else {
    this.firstName = ko.observable('');
    this.lastName = ko.observable('');
    this.mainErrorMessage = ko.observable('');
    this.email = ko.observable('').extend({
      email: true
    });
    this.errorMessage = ko.observable();
  }
    var buttonTextValue = commonFunction.getParameterByName('buttonText', window.location);
    if (buttonTextValue === null || buttonTextValue === undefined || buttonTextValue == '') {
      buttonTextValue = 'Chat with us';
    }
    this.buttonText = ko.observable(buttonTextValue);

    var textMessageValue = commonFunction.getParameterByName('textMessage', window.location);
    if (textMessageValue === null || textMessageValue === undefined || textMessageValue == '') {
      textMessageValue = 'To Chat with Parlo Bot, please fill the following information';
    }
    this.textMessage = ko.observable(textMessageValue);

    var logoValue = commonFunction.getParameterByName('logo', window.location);
    if (logoValue === null || logoValue === undefined || logoValue == '') {
      logoValue = 'http://52.172.192.103/app/stylesheets/images/salesforce-logo.svg';
    }
    this.imagePath = ko.observable(logoValue);
    sessionStorage.setItem('customerLogo', logoValue);
};

Login.prototype.view = require('./login.html');
Login.prototype.getView = ViewModel.prototype.getView;

Login.prototype.compositionComplete = function (id, page) {
  var screenLayoutName = this.screenLayout();
  checkForError();
  setButtonColor('buttonColor', window.location);
  setBackgroundColor('backgroundColor', window.location);
  
  if ((screenLayoutName != null) && (screenLayoutName == 'firstName')) {
    $("#defaultView").remove();
    $("#minimalView").remove();
    $("#login").removeClass('hide');
  } else if ((screenLayoutName != null) && (screenLayoutName == 'minimal')) {
    $("#defaultView").remove();
    $("#onlyFirstName").remove();
    $("#login").removeClass('hide');
  } else if ((screenLayoutName === null) || (screenLayoutName === 'default')) {
    $("#minimalView").remove();
    $("#login").removeClass('hide');
    $("#onlyFirstName").remove();
  } else {
    $("#onlyFirstName").remove();
    $("#minimalView").remove();
  }
};

var setBackgroundColor = function (backgroundColor, windowLocation) {
  backgroundColorValue = commonFunction.getParameterByName(backgroundColor, windowLocation);
  if (backgroundColorValue === null || backgroundColorValue === undefined || backgroundColorValue == '') {
    backgroundColorValue = '434e8a';
  }
  backgroundColorValue = "#" + backgroundColorValue;
  $(".chat-box-body").css("background-color", backgroundColorValue);
};

var setButtonColor = function (buttonColor, windowLocation) {
  buttonColorValue = commonFunction.getParameterByName(buttonColor, windowLocation);
  if (buttonColorValue === null || buttonColorValue === undefined || buttonColorValue == '') {
    buttonColorValue = '3498DB';
  }
  buttonColorValue = "#" + buttonColorValue;
  $("#chatButton").css("background-color", buttonColorValue);
};

// This is used to authenticate user...
Login.prototype.authenticateUser = function () {
  setNativeChatId();
  setAccountDetails();
  var firstName = this.firstName();
  var lastName = this.lastName();
  var email = this.email();
  var screenLayoutName = this.screenLayout();
  setCustomerInfo();
  authenticateUser(firstName, lastName, email, screenLayoutName);
};

function setNativeChatId() {  
  var nativeChatId = commonFunction.uniqueNumber();
  sessionStorage.setItem('nativeChatId', nativeChatId);
}

function goToChatScreen() {
  setNativeChatId();
  setAccountDetails();
  authenticateBySignature(sessionStorage.getItem('customerId'), sessionStorage.getItem('nativeChatId'));
}

function setAccountDetails() {
  var customerId = commonFunction.getParameterByName('customerId', window.location);
  var nativeChannelId = commonFunction.getParameterByName('nativeChannelId', window.location);
  var welcomeCommand = commonFunction.getParameterByName('command', window.location);

  sessionStorage.setItem('customerId', customerId);
  sessionStorage.setItem('nativeChannelId', nativeChannelId);
  sessionStorage.setItem('welcomeCommand', welcomeCommand);
};

function setCustomerInfo(firstName, lastName, email) {
  sessionStorage.setItem('customerFirstName', firstName);
  sessionStorage.setItem('customerLastName', lastName);
  sessionStorage.setItem('customerEmail', email);
}

var checkAndSetValidation = function (firstName, lastName, email, screenLayoutName) {
  var error = false;
  
  if (firstName === '') {
    error = true;
    $('.firstname-mandatory-field').removeClass('hide');
  } else {
    $('.firstname-mandatory-field').addClass('hide');
  }

  if ((lastName === '') && (screenLayoutName != 'firstName')) {
    error = true;
    $('.lastname-mandatory-field').removeClass('hide');
  } else {
    $('.lastname-mandatory-field').addClass('hide');
  }

  if ((email === '') && (screenLayoutName != 'firstName') && (screenLayoutName != 'minimal')) {
    error = true;
    $('.email-mandatory-field').removeClass('hide');
  } else {
    $('.email-mandatory-field').addClass('hide');
  }

  if ((email != '') && !validateEmail(email) && (screenLayoutName != 'firstName') && (screenLayoutName != 'minimal')) {
    error = true;
    // $('.mandatory-field').addClass('hide');
    $('.validate-email').removeClass('hide');
    return;
  } else {
    $('.validate-email').addClass('hide');
  }
  return error;
}

function authenticateUser(firstName, lastName, email, screenLayoutName) {
  var checkValidation = checkAndSetValidation(firstName, lastName, email, screenLayoutName);
  if (checkValidation === false) {
    $('.mandatory-field').addClass('hide');
    $('.validate-email').addClass('hide');
    setCustomerInfo(firstName, lastName, email);
    authenticateBySignature(sessionStorage.getItem('customerId'), sessionStorage.getItem('nativeChatId'));
  }
};

function validateEmail(email) {
  var regEx = /^(([^<>()[\]\\.,;:\s@\"]+(\.[^<>()[\]\\.,;:\s@\"]+)*)|(\".+\"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
  return regEx.test(email);
}

function authenticateBySignature(customerId, nativeChatId) {
  request = {};
  request.scope = "nchat";
  request.sKey = customerId;
  request.security = 'https';
  request.partnerDomain = globalPartnerDomain;
  request.payload = '';

  request.partnerId = customerId + "::" + request.scope;
  var tUrl = request.security + "://" + request.partnerDomain + "/rest/v1/token";

  signatureServices.getSignature("POST", request.security, tUrl, request.payload, request.sKey)
    .then(function (resp) {

      if (resp.data.response.error === undefined) {
        request.bearerToken = resp.data.response.access_token;
        sessionStorage.setItem('bearerToken', resp.data.response.access_token);
        if (resp.data.response.session_token) {
          sessionStorage.setItem('sessionToken', resp.data.response.session_token);
          request.sessionToken = resp.data.response.session_token;
        }
        request.partnerId = sessionStorage.getItem('customerId');
        router.navigate('#chat', {
          replace: true,
          trigger: true
        });
      } else {
        $(".login-error-message").html(resp.data.response.error.code);
      }
    }, function (error) {
      alert(error);
    });
}

function checkForError() {
  var error = commonFunction.getParameterByName('error', window.location);

  if (error == null) {
    return false;
  } else if (error == 'session_expired') {
    $(".login-error-message").html('Your session is expired, please login again.');
  }
}


module.exports = Login;