// Weather proved by OpenWeatherMap - http://openweathermap.org/
// TODO: Get weather for a specific date
var Decisions_Weather = {
	name : "decisions-weather",
	forecast_count: 3,	// Only get the next 3 forecasts
	
	locationOptions : {
		enableHighAccuracy: false, 
		maximumAge: 10000, 
		timeout: 10000
	},
	
	getWeather : function(latitude, longitude, days, api_key) {
		var ajax = require('ajax');
		ajax(
			{
				url: 'http://api.openweathermap.org/data/2.5/forecast?lat=' + latitude + '&lon=' + longitude + '&APPID=' + api_key + '&cnt=' + days,
				type: 'json'
			},
			function(data, status, request) {
				// TODO: Handle response
				var output = "Forecast for " + data.city.name + ":\n";
				var libutil = require("libutil.js");
				var libdate = require("libdate.js");
				for (var day = 0; day < days; day++) {
					var low = Math.round(libutil.kelvinToFahrenheit(data.list[day].main.temp_min));
					var high = Math.round(libutil.kelvinToFahrenheit(data.list[day].main.temp_max));
					if (low !== high) {
						output += libdate.getDayofWeek(new Date(data.list[day].dt)) + ": " + low + " - " + high + "°F and ";
					}
					else {
						output += libdate.getDayofWeek(new Date(data.list[day].dt)) + ": " + low + "°F and ";
					}
					output += data.list[day].weather[0].main.toLowerCase() + "\n";
				}
				return output;
			},
			function(error, status, request) {
				console.log("decisions-weather: unable to get weather data: " + JSON.stringify(error));
			}
		);
	},

	decide:function(tokens, branchIndex, decision_callback) {
		var instance = this;
		console.log(instance.name + ": entered branch.");
		if ((tokens.indexOf("weather") >= 0 || tokens.indexOf("forecast") >= 0)) {
			console.log(instance.name + ': Getting weather info.');
			var UI = require('ui');
			var card = new UI.Card({
				title: 'OpenWeatherMap',
				body: 'Loading...'
			});
			card.show();
			var settings = require('settings');
			navigator.geolocation.getCurrentPosition(function(pos) {
					// Got location info: we can call OWM
					console.log(instance.name + ": got location info: " + JSON.stringify(pos));
					var weather = instance.getWeather(pos.coords.latitude, pos.coords.longitude, instance.forecast_count, settings.option("owm_api_key"));
					card.body(weather);
				}, function(err) {
					// Couldn't get location info: use geoIP
					console.log(instance.name + ": unable to use navigator. Trying geolocation API.");
					var ajax = require('ajax');
					ajax(
					{
						url: 'http://ip-api.com/json',
						method: 'GET',
						type: 'json'
					},
					function(data, status, request) {
						console.log(instance.name + ": geolocation data received, making request to OWM.");
						console.debug(instance.name + ': ' + data);
						var weather = instance.getWeather(data.lat, data.lon, instance.forecast_count, settings.option("own_api_key"));
						card.body(weather);
					},
					function(error, status, request) {
						console.log(instance.name + ": unable to get location data: " + status + " " + JSON.stringify(error));
						card.body('Unable to get location data.');
					});
					
				}, instance.locationOptions);
			return;
		}
		else {
			// Process actions when user input fails.
			decision_callback(tokens, branchIndex);
		}
	}
};

this.exports = Decisions_Weather;