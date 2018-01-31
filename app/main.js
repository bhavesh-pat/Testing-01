// var jq = require('jquery/dist/jquery.min');
// var bootStrap = require('bootstrap/dist/js/bootstrap.min');
var ko = require('knockout');
var app = require('durandal/app');
var system = require('durandal/system');
var widget = require('plugins/widget');
var commonFunction = require('dependencies/common');

// require('dependencies/common');
// Durandal core overrides - Required for Webpack
require('overrides/system');
require('overrides/composition');
require('overrides/views');
require('overrides/widget');

require('bxslider');
require('owl.carousel');
// require('font-awesome');

// require("font-awesome-webpack");
var commonFunction = require('./dependencies/common');

// Load CSS
require("!style!css!bootstrap/dist/css/bootstrap.min.css");
require("!style!css!bxslider/src/css/jquery.bxslider.css");
require("!style!css!owl.carousel/dist/assets/owl.carousel.min.css");

// require("!style!css!lightslider/src/css/lightslider.css");
require("!style!css!stylesheets/main.css");

var nativeChannelId = commonFunction.getParameterByName('nativeChannelId', window.location);
var dynamicAPIUrl = commonFunction.getParameterByName('endPoint', window.location);
var messageDelay = commonFunction.getParameterByName('delay', window.location);

globalPartnerDomain = (dynamicAPIUrl === null) ? 'test.parlobots.com' : dynamicAPIUrl;
typingIndicatorTimeInterval = (messageDelay === null) ? 0000 : messageDelay;

var isParloNativeChat = nativeChannelId.split("-")[0];
if ((isParloNativeChat == 'parlonativechat') || (nativeChannelId == 'salesforceNC-NCsalesforce')) {
	require("!style!css!stylesheets/SalesforceSanswebfonts.css");
	typingIndicatorTimeInterval = 5000; 
} 


// Webpack sets this __DEV__ variable. See `webpack.config.js` file
if(__DEV__) {
	system.debug(true);

	window.ko = ko;
	window.app = app;
	window.router = router;
}

// Install the router
var router = require('plugins/router');
router.install({});

// Install widgets
var widgets = require('widgets/index');
widget.install({
	kinds: Object.keys(widgets)
});

// Start the appliction
app.start().then(function () {
	// Set the title
	app.title = 'Parlo Web Messenger';

	// Show the app by setting the root view model for our application with a transition.
	var shell = require('./shell');

	return app.setRoot(shell);
});
