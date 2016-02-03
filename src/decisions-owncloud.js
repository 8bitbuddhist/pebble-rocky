var Decisions_ownCloud = {
	name : "decisions-owncloud",
	calendar_sync_timeout : 180,	// Set calendar staleness threshold to 3 hours

	buildOutput:function(data, tokens, main, instance) {
		// Initialize components
		var iCal = require('ical.js');
		var search_field;
		var date_field;
		var output = [];
		var libdate = require("libdate.js");
		var target_date = libdate.getDate(tokens);
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
					if (tokens.indexOf("for") >= 0) {
						if (start.getDate() === target_date.getDate() && start.getMonth() === target_date.getMonth(0) && start.getYear() === target_date.getYear()) {
							output.push(start.toTimeString().substr(0, 5) + ': ' + components[j].getFirstPropertyValue('summary'));
						}
					}
					else if (start - target_date >= 0) {
						output.push(libdate.getPaddedDate(start) + ' ' + start.toTimeString().substr(0, 5) + ': ' + components[j].getFirstPropertyValue('summary'));
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
			var oc_url = settings.option("oc_url") + "/remote.php/caldav/calendars/" + settings.option("oc_username") + "/" + settings.option("oc_calendar") + "?export";
			if (oc_url.indexOf("https") >= 0 ) {
				oc_url = oc_url.replace("https://", "https://" + settings.option("oc_username") + ":" + settings.option("oc_password") + "@");
			}
			else {
				oc_url = oc_url.replace("http://", "http://" + settings.option("oc_username") + ":" + settings.option("oc_password") + "@");
			}
			//console.log("owncloud URL: " + oc_url);
			var calendar = settings.data('oc_calendar_cache');
			// If the time since the last calendar cache exceeds threshold, refresh calendar
			if (!calendar || (Math.round(((Date.now() - calendar.date)/1000)/60) >= instance.calendar_sync_threshold)) {
				ajax(
					{
						url: oc_url,
						method: 'GET'
					},
					function(data, status, request) {
						console.log(instance.name + ": response received.");
						instance.buildOutput(data, tokens, main, instance);
						instance.refresh_calendar(settings, data);
					},
					function(error, status, request) {
						console.log(instance.name + ": fail - " + status + " " + JSON.stringify(error));
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