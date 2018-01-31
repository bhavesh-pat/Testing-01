var ko = require('knockout');
var ViewModel = require('viewModels/class');
var signatureServices = require('services/signature/signature.service');
var generateDom = require('./generateDomCode');
var commonFunction = require('dependencies/common');
var hamburgerCmd = require('./hamburgerCommand');


var test = {};

function Chat() {
  this.myMessage = ko.observable('');
  this.chatRequestReponse = ko.observable('');
  this.sqlNumber = ko.observable(0);
  this.customerName = sessionStorage.getItem('nativeChannelId');
  this.ifTyping = ko.observable(true);
  this.imagePath = ko.observable(sessionStorage.getItem('customerLogo'));
  // if (sessionStorage.getItem('screenLayoutName') != 'none') {
    generateDom.initiateConversation();
    $("body").css({"background":"#dee2e6"});
  // }
};

Chat.prototype.compositionComplete = function (id, page) {
    if (sessionStorage.getItem('screenLayoutName') == 'none') {
    // $("#firstTypingIdicator").remove();
    // $("#parloMessengerTextBox").attr('readonly', false);
  }
}

$('#parloMessengerTextBox').keydown(function() {
  if (event.keyCode == 13) {
    this.form.submit();
    return false;
  }
});

Chat.prototype.view = require('./chat.html');
Chat.prototype.getView = ViewModel.prototype.getView;

Chat.prototype.sendMessage = function() {
  var seq = this.sqlNumber();
  var seqValue = parseInt(seq) + 1;
  test.myMessage = this.myMessage();

  if (test.myMessage == '') {
    return;
  }
  generateDom.updateSenderText(test.myMessage);
  generateDom.sendNativeChatMessage(test.myMessage, seqValue, 'text', null);
  this.sqlNumber(seqValue);
  this.myMessage('');
};

$(document).on('click', ".dropdown", function(e){
  e.preventDefault();
  var $this = $(this).children(".dropdown-content");
  $(".dropdown-content:visible").not($this).slideToggle(200); //Close submenu already opened
  $this.slideToggle(200); //Open the new submenu
});

$(document).on('click', '.data-click', function() {
  var e = $(this);
  var buttonType = e.attr('data-buttonType');
  var seq = $("#seq").val();
  var seqValue = parseInt(seq) + 1;
  test.myMessage = e.attr('data-message');
  var payloadValue = e.attr('data-payload');

  generateDom.updateSenderText(test.myMessage);
  generateDom.sendNativeChatMessage(test.myMessage, seqValue, buttonType, payloadValue);

  return false;
});

$(document).on('click', ".linkButton", function() {
  var e = $(this);
  test.myMessage = e.attr('data-message');
  generateDom.updateSenderText(test.myMessage);
  window.open(e.attr('href'), '_blank', 'location=1,status=1,scrollbars=1, resizable=1, directories=1, toolbar=1, titlebar=1');
  return false;
});


// File upload functionality.
$(document).on('click', '#fullscreen', function(event) {
  event.preventDefault();
  window.parent.location =  $('#fullscreen').attr('href');
});
// $('#fullscreen').tooltip();
/* END DEMO OF JS */

$(document).on('click', '.navbar-toggler', function(event) {
  event.preventDefault();
  $(this).closest('.navbar-minimal').toggleClass('open');
});

$(document).on('change', '#parloFileUpload', function(event) {
  var e = $(this);
  hamburgerCmd.uploadFile(e);
});

$(document).on('click', '#upload_link', function(e) {
  e.preventDefault();
  $("#parloFileUpload").trigger('click');
  return false;
});

module.exports = Chat;