var Decisions_ownCloud = {
	name : "decisions-owncloud",
	calendar_sync_timeout: 60,		// Time (in minutes) until calendar is refreshed

	buildOutput:function(data, tokens, instance) {
		// Initialize components
		var iCal = require('ical.js');
		var libdate = require("libdate.js");
		var UI = require('ui');
		
		var search_field;
		var date_field;
		var component_list = [];
		var output = [];
		
		var target_date = libdate.getDate(tokens);
		var components = new iCal.Component(iCal.parse(data)).getAllSubcomponents();
		
		// If we're looking for calendar events, search for vevent components, otherwise search for vtodo components
		if (tokens.indexOf("calendar") >= 0) {
			search_field = "vevent";
			date_field = "dtstart";
		}
		else {
			// We're looking for events
			target_date = null;
			search_field = "vtodo";
			date_field = "dtstamp";
		}
		
		for (var j = 0; j < components.length; j++) {
			var event = new iCal.Event(components[j]);
			if (components[j].name === search_field) {
				var start;
				if (event.isRecurring()) {
					// Get next recurrence event starting from now
					//start = event.iterator(components[j].getFirstPropertyValue(date_field)).next();
					var next_run = event.iterator(iCal.Time.now()).next();
					if (next_run) {
						start = next_run.toJSDate();
					}
					else {
						// Set a null date
						start = new Date(1900, 1, 1);
					}
				}
				else {
					start = components[j].getFirstPropertyValue(date_field).toJSDate();
				}
				/*
					1) If search_field = "vtodo", assume it's a task and skip to the next section.
					2) If target_date is null, display events while filtering out past events.
					3) If target_date is set, display the event.
				*/
				if (search_field === "vtodo") {
					// This is a task
					// Check the status of the task
					var task_status = components[j].getFirstPropertyValue('status');
					// Ignore completed or canceled tasks
					if (task_status != "COMPLETED" && task_status != "CANCELLED") {
						if (!task_status)
							components[j].updatePropertyWithValue('status', 'NEW');
							//task_status = "NEW";

						//output.push(components[j].getFirstPropertyValue('summary'));
						component_list.push(components[j]);
					}
				}
				else if (search_field === "vevent") {
					// This is a calendar event.
					// If a target date was provided, display events that match it. Otherwise, display all events occuring after today.
					if (tokens.indexOf("for") >= 0) {
						if (start.getDate() === target_date.getDate() && start.getMonth() === target_date.getMonth(0) && start.getYear() === target_date.getYear()) {
							//output.push(start.toTimeString().substr(0, 5) + ': ' + components[j].getFirstPropertyValue('summary'));
							component_list.push(components[j]);
						}
					}
					else if (start - target_date >= 0) {
						//output.push(libdate.getPaddedDate(start) + ' ' + start.toTimeString().substr(0, 5) + ': ' + components[j].getFirstPropertyValue('summary'));
						component_list.push(components[j]);
					}
				}
			}
		}

		if (component_list.length) {
			// Sort the final output by date
			//output.sort();
			component_list.sort(function(a, b) {
				return a.getFirstPropertyValue(date_field) - b.getFirstPropertyValue(date_field);
			});
			
			// Create a list of calendar items
			var section = [];
			var title = '';
			//for (var component of component_list) {
			component_list.forEach(function(component) {
				var start_time = component.getFirstPropertyValue(date_field).toJSDate();
				
				if (search_field === 'vtodo') {
					title = 'ownCloud Tasks';
					// task
					section.push({title : component.getFirstPropertyValue('summary'),
											subtitle: component.getFirstPropertyValue('status'),
											description: component.getFirstPropertyValue('description')});
				}
				else {
					title = 'ownCloud Calendar';
					section.push({title : component.getFirstPropertyValue('summary'),
											subtitle: libdate.getPaddedDate(start_time) + ' ' + start_time.toTimeString().substr(0, 5),
											description: component.getFirstPropertyValue('description')});
				}
				output += libdate.getPaddedDate(start_time) + ' ' + start_time.toTimeString().substr(0, 5) + ': ' + component.getFirstPropertyValue('summary') + '\n';
			});
			
			// Display the new menu with the calendar items
			var menu = new UI.Menu({
				sections: [{
					title: title,
					items: section,
					scrollable: true
				}]
			});

			menu.show();
			menu.on('select', function(e) {
				console.debug('ownCloud: Selected ' + e.item.title);
				var card = new UI.Card({
					title: e.item.title,
					subtitle: e.item.subtitle,
					body: e.item.description,
					scrollable: true
				});
				card.show();
			});
		}
		else {
			var card = new UI.Card({
				title: 'ownCloud Calendar',
				body: 'No events found.'
			});
			card.show();
		}
	},
	
	decide:function(tokens, branchIndex, decision_callback) {
		var instance = this;
		console.log(instance.name + ": entered branch.");

		// Display calendar results
		if ((tokens.indexOf("me") >= 0 || tokens.indexOf("my")) && ((tokens.indexOf("calendar") >= 0 || tokens.indexOf("agenda") >= 0) ||
			 (tokens.indexOf("to") >= 0 && tokens.indexOf("do") >= 0))) {
			// Display calendar
			var settings = require('settings');
			instance.buildOutput(settings.data("oc_calendar_cache").data, tokens, instance);
		}
		else {
			decision_callback(tokens, branchIndex);
		}
	},
	
	// Pull down the latest ownCloud calendar if necessary
	refresh_calendar:function() {
		var settings = require('settings');
		var username = settings.option('oc_username');
		var password = settings.option('oc_password');
		var url = settings.option('oc_url');
		var calendar_name = settings.option('oc_calendar');
		if (username && password && url && calendar_name)  {
			console.log('ownCloud: Checking calendar status.');
			var ajax = require('ajax');
			//var calendar_sync_timeout = 60;	// Update the calendar every hour
			url = url + "/remote.php/dav/calendars/" + username + "/" + calendar_name + "?export";
			if (url.indexOf("https") >= 0 ) {
				url = url.replace("https://", "https://" + username + ":" + password + "@");
			}
			else {
				url = url.replace("http://", "http://" + username + ":" + password + "@");
			}
			var calendar = settings.data('oc_calendar_cache');
			var calendar_age;
			if (calendar) {
				calendar_age = Math.round(((Date.now() - calendar.date)/1000)/60);
				console.log('ownCloud: Calendar age: ' + calendar_age + ' minutes.');
			}
			// If the time since the last calendar cache exceeds threshold, refresh calendar
			if (!calendar || (calendar_age && (calendar_age >= this.calendar_sync_timeout))) {
				var Base64 = require('Base64');
				console.log('ownCloud: Calendar out of date. Pulling fresh copy.');
				ajax(
					{
						url: url,
						method: 'GET',
						headers:{
							Authorization: "Basic " + Base64.encode(username + ":" + password),
							}
					},
					function(data, status, request) {
						console.log("ownCloud: response received.");
						var calendar = {
							date : Date.now(),
							data : data
						};

						settings.data("oc_calendar_cache", calendar);
						console.log("Updated cached calendar on " + calendar.date);
					},
					function(error, status, request) {
						console.log("Unable to update ownCloud calendar: " + status + " " + JSON.stringify(error));
					}
				);
			}
		}
	}
};

this.exports = Decisions_ownCloud;