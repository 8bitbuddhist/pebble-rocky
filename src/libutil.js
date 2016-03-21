var lib_util = {

	// Get the user's currentIP address
	getPublicIPAddress:function(callback_success, callback_fail, options) {
		var ajax = require("ajax");
		ajax(
			{
				url: 'https://api.ipify.org?format=json',
				type: 'json'
			},
			function(data, status, request) {
				callback_success(options);
			},
			function(error, status, request) {
				callback_fail(options);
			}
		);
	},

	kelvinToFahrenheit:function(kelvin) {
		return (kelvin * 9/5) - 459.67;
	}
};

this.exports = lib_util;