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
	
	getWeather : function(latitude, longitude, days, api_key, main) {
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
				main.body(output);
			},
			function(error, status, request) {
				console.log("decisions-weather: unable to get weather data: " + JSON.stringify(error));
				main.body("Unable to pull weather data.");
			}
		);
	},

	decide:function(tokens, main, settings, branches, branchIndex, decision_callback) {
		var instance = this;
		console.log(instance.name + ": entered branch.");
		if ((tokens.indexOf("weather") >= 0 || tokens.indexOf("forecast") >= 0)) {
			navigator.geolocation.getCurrentPosition(function(pos) {
				// Got location info: we can call OWM
				console.log("got location info: " + JSON.stringify(pos));
				var weather = instance.getWeather(pos.coords.latitude, pos.coords.longitude, instance.forecast_count, settings.option("owm_api_key"), main);
				console.log("Got weather info: " + weather);
				main.body(weather);
			}, function(err) {
				// Couldn't get location info
				console.log(instance.name + ": unable to get location info: " + err);
				main.body("Unable to get location info.");
			}, instance.locationOptions);
			return;
		}
		else {
			// Process actions when user input fails.
			decision_callback(tokens, main, settings, branches, branchIndex);
		}
	}
};

this.exports = Decisions_Weather;