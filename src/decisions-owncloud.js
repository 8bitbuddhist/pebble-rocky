var Decisions_ownCloud = {
	name : "decisions-owncloud",
	
	getCurrentDate:function(tokens) {
		var current_date = new Date();
		if (tokens.indexOf("for") >= 0) {
			var period = tokens[tokens.indexOf("for") + 1];
			var weekdays = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"];
			var months = ["january", "february", "march", "april", "may", "june", "july", "august", "september", "october", "november", "december"];
			if (period === "tomorrow") {
				current_date.setDate(current_date.getDate() + 1);
			}
			// User provided a day such as "the 25th"
			else if (period === "the" && Number.isInteger(tokens[tokens.indexOf(period) + 1])) {
				current_date = new Date(current_date.getFullYear(), current_date.getFulllMonth(), period);
			}
			else if (months.indexOf(period) >= 0) {
				// User provided the month followed by a day (e.g. October 25)
				current_date = new Date(current_date.getFullYear(), months.indexOf(period), tokens[tokens.indexOf(period) + 1]);
			}
			else if (Number.isInteger(period) && (tokens[tokens.indexOf(period) + 1]  && months.indexOf(period + 1) >= 0)) {
				// User provided the day followed by the month (e.g. 25th [of] October)
				current_date = new Date(current_date.getFullYear(), months.indexOf(tokens[tokens.indexOf(period) + 1]), period);
			}
			else if (weekdays.indexOf(period) >= 0) {
				// Get the day of week
				var dow = weekdays.indexOf(period);
				if (dow > -1) {
					var distance = (dow + 7 - current_date.getDay()) % 7;
					current_date.setDate(current_date.getDate() + distance);
				}
			}
		}
		return current_date;
	},
	
	buildOutput:function(data, tokens, main, instance) {
		// Initialize components
		var iCal = require('ical.js');
		var search_field;
		var date_field;
		var output = [];
		var target_date = instance.getCurrentDate(tokens);
		var components = new iCal.Component(iCal.parse(data)).getAllSubcomponents();
		
		// If we're looking for calendar events, search for vevent components, otherwise search for vtodo components
		if (tokens.indexOf("calendar") >= 0) {
			main.title("ownCloud Calendar");
			search_field = "vevent";
			date_field = "dtstart";
		}
		else {
			// We're looking for events
			main.title("ownCloud Tasks");
			target_date = null;
			search_field = "vtodo";
			date_field = "dtstamp";
		}
	 
		console.log(instance.name + ": " + search_field + " " + date_field + " " + JSON.stringify(components));
		for (var j = 0; j < components.length; j++) {
			console.log(components[j].name);
			if (components[j].name === search_field) {
				var start = components[j].getFirstPropertyValue(date_field).toJSDate();
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
					if (task_status !== "COMPLETED" && task_status !== "CANCELLED") {
						if (!task_status)
							task_status = "NEW";

						output.push(components[j].getFirstPropertyValue('summary'));
					}
				}
				else if (search_field === "vevent") {
					// This is a calendar event.
					// If a target date was provided, display events that match it. Otherwise, display all events occuring after today.
					console.log(instance.name + ": start date: " + start);
					console.log(instance.name + ": target_date: " + target_date);
					console.log(instance.name + ": date diff: " + start - target_date);
					if (tokens.indexOf("for") >= 0) {
						if (start.getDate() === target_date.getDate() && start.getMonth() === target_date.getMonth(0) && start.getYear() === target_date.getYear()) {
							output.push(start.toTimeString().substr(0, 5) + ': ' + components[j].getFirstPropertyValue('summary'));
						}
					}
					else if (start - target_date >= 0) {
						output.push((start.getMonth() + 1) + '/' + start.getDate() + ' ' + start.toTimeString().substr(0, 5) + ': ' + components[j].getFirstPropertyValue('summary'));
					}
				}
			}
		}

		// Sort the final output by summary
		output.sort();

		if (output.length) {
			main.body(output.join("\n"));
		}
		else {
			main.body("No events found.");
		}
	},
	
	refresh_calendar:function(settings, data) {
		var calendar = {
			date : Date.now(),
			data : data
		};

		settings.data("oc_calendar_cache", calendar);
		console.log("Updated cached calendar on " + calendar.date);
	},
	
	decide:function(tokens, main, settings, branches, branchIndex, decision_callback) {
		var instance = this;
		console.log(instance.name + ": entered branch.");
		// Display calendar results
		if ((tokens.indexOf("me") >= 0 || tokens.indexOf("my")) && ((tokens.indexOf("calendar") >= 0 || tokens.indexOf("agenda") >= 0) ||
			 (tokens.indexOf("to") >= 0 && tokens.indexOf("do") >= 0))) {
			// Display calendar
			var ajax = require('ajax');
			var protocol; 
			if (settings.option('oc_use_https')) {
				protocol = "https://";
			}
			else {
				protocol = "http://";
			}
			
			var calendar = settings.data('oc_calendar_cache');
			// If the time since the last calendar cache exceeds 15 minutes, refresh the calendar
			if (!calendar || (Math.round(((Date.now() - calendar.date)/1000)/60) >= 15)) {
				ajax(
					{
						url: protocol +
								settings.option('oc_username') + ':' +
								settings.option('oc_password') + '@' +
								settings.option('oc_url') + '/remote.php/caldav/calendars/' +
								settings.option('oc_username') +  '/' +
								settings.option('oc_calendar') + '?export',
						method: 'GET'
					},
					function(data, status, request) {
						console.log(instance.name + ": response received.");
						instance.buildOutput(data, tokens, main, instance);
						instance.refresh_calendar(settings, data);
					},
					function(error, status, request) {
						console.log(instance.name + ": fail - " + status + " " + JSON.stringify(request));
						main.body("No response received from ownCloud.");
					}
				);
			}
			else {
				// Use "stale" calendar data
				console.log(instance.name + ": using stale calendar data.");
				instance.buildOutput(settings.data("oc_calendar_cache").data, tokens, main, instance);
			}
		}
		else {
			decision_callback(tokens, main, settings, branches, branchIndex);
		}
	}
};

this.exports = Decisions_ownCloud;