// Weather proved by OpenWeatherMap - http://openweathermap.org/
// TODO: Get weather for a specific date
var Decisions_Weather = {
	name : "decisions-weather",
	forecast_count: 5,
	
	locationOptions : {
		enableHighAccuracy: false, 
		maximumAge: 10000, 
		timeout: 10000
	},
	
	getWeather : function(latitude, longitude, days, api_key, card) {
		var ajax = require('ajax');
		ajax(
			{
				url: 'http://api.openweathermap.org/data/2.5/forecast/daily?lat=' + latitude + '&lon=' + longitude + '&APPID=' + api_key + '&cnt=' + days,
				type: 'json'
			},
			function(data, status, request) {
				console.debug('decisions-weather: weather data: ' + JSON.stringify(data));
				
				var libutil = require("libutil.js");
				var libdate = require("libdate.js");
				var UI = require('ui');
				
				var forecast = [];
				for (var day = 0; day < days; day++) {
					var low = Math.round(libutil.kelvinToFahrenheit(data.list[day].temp.min));
					var high = Math.round(libutil.kelvinToFahrenheit(data.list[day].temp.max));
					/*if (low !== high) {
						// Retrieve day of week from timestamp
						output += libdate.getDayofWeek(new Date(data.list[day].dt * 1000)) + ": " + low + " - " + high + "°F and ";
					}
					else {
						// Retrieve day of week from timestamp
						output += libdate.getDayofWeek(new Date(data.list[day].dt * 1000)) + ": " + low + "°F and ";
					}
					output += data.list[day].weather[0].main.toLowerCase() + "\n";*/
					var title = libdate.getDayofWeek(new Date(data.list[day].dt * 1000));
					var subtitle_short = low + ' - ' + high + '°F';
					var subtitle = subtitle_short + ' and ' + data.list[day].weather[0].main.toLowerCase();
					var description = 'Weather: ' + data.list[day].weather[0].description + '\n' +
							'AM Temp: ' + Math.round(libutil.kelvinToFahrenheit(data.list[day].temp.morn)) + '°F\n' +
						'PM Temp: ' + Math.round(libutil.kelvinToFahrenheit(data.list[day].temp.night)) + '°F\n' +
						'Humidity: ' + data.list[day].humidity + '%' + '\n' +
						'Pressure: ' + Math.round(data.list[day].pressure * 0.02953) + 'inHg';
					forecast.push({
						title: title,
						subtitle: subtitle,
						subtitle_short: subtitle_short,
						description: description
					});
				}
				/*if (output) {
					card.body(output);
				}
				else {
					card.body('Unable to get forecast.');
				}*/
				
				// Knock the loading screen off the stack, preventing users from backing into it
				card.hide();
				
				var menu = new UI.Menu({
					sections: [{
						title: data.city.name,
						items: forecast,
						scrollable: true
					}]
				});
				
				menu.on('select', function(e) {
					console.debug('decisions-weather: Date selected');
					var subcard = new UI.Card({
						title: e.item.title,
						subtitle: e.item.subtitle_short,
						body: e.item.description,
						scrollable: true
					});
					subcard.show();
				});
				menu.show();
			},
			function(error, status, request) {
				console.log("decisions-weather: unable to get weather data: " + JSON.stringify(error));
				card.body('Unable to get weather data.');
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
				title: 'Weather',
				body: 'Loading...',
				scrollable: true
			});
			card.show();
			var settings = require('settings');
			navigator.geolocation.getCurrentPosition(function(pos) {
					// Got location info: we can call OWM
					console.log(instance.name + ": got location info: " + JSON.stringify(pos));
					instance.getWeather(pos.coords.latitude, pos.coords.longitude, instance.forecast_count, settings.option("owm_api_key"), card);
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
						instance.getWeather(data.lat, data.lon, instance.forecast_count, settings.option("owm_api_key"), card);
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