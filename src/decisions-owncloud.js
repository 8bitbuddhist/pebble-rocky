var Decisions_ownCloud = {
	name : "decisions-owncloud",
	
	decide:function(tokens, main, settings, branches, branchIndex, decision_callback) {
		console.log(this.name + ": entered branch.");
		// Display calendar results
		if (tokens[0] + tokens[1] === "what'son" && ((tokens.indexOf("calendar") >= 0 || tokens.indexOf("agenda") >= 0) ||
			 tokens.indexOf("todo") >= 0)) {
			// Display calendar
			var iCal = require('ical.js');
			var ajax = require('ajax');
			var protocol; 
			if (settings.option('oc_use_https')) {
				protocol = "https://";
			}
			else {
				protocol = "http://";
			}
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
					// Get target date
					var current_date;
					
					if (tokens.indexOf("for") >= 0) {
						current_date = new Date();
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
						else if (months.indexOf(period) > 0) {
							// User provided the month followed by a day (e.g. October 25)
							current_date = new Date(current_date.getFullYear(), months.indexOf(period), tokens[tokens.indexOf(period) + 1]);
						}
						else if (Number.isInteger(period) && (tokens[tokens.indexOf(period) + 1] && months.indexOf(period + 1) >= 0)) {
							// User provided the day followed by the month (e.g. 25th [of] October)
							current_date = new Date(current_date.getFullYear(), months.indexOf(tokens[tokens.indexOf(period) + 1]), period);
						}
						else if (weekdays.indexOf(period)) {
							// Get the day of week
							var dow = weekdays.indexOf(period);
							if (dow > -1) {
								var distance = (dow + 7 - current_date.getDay()) % 7;
								current_date.setDate(current_date.getDate() + distance);
							}
						}
					}
					
					// Initialize components
					var output = [];
					var components = new iCal.Component(iCal.parse(data)).getAllSubcomponents();
					
					// If we're looking for calendar events, search for vevent components, otherwise search for vtodo components
					var search_field;
					var date_field;
					if (tokens.indexOf("calendar") >= 0) {
						main.title("ownCloud Calendar");
						search_field = "vevent";
						date_field = "dtstart";
					}
					else {
						// We're looking for events
						main.title("ownCloud Tasks");
						current_date = null;
						search_field = "vtodo";
						date_field = "dtstamp";
					}
					
					for (var j = 0; j < components.length; j++) {
						if (components[j].name === search_field) {
							var start = components[j].getFirstPropertyValue(date_field).toJSDate();
							// If current_date is not set, assume it's a task and jump to the next section. Otherise compare the event against the start date.
							if (!current_date || (current_date && (start.getDay() === current_date.getDay() && start.getMonth() === current_date.getMonth(0) && start.getYear() === current_date.getYear()))) {
								if (tokens.indexOf("calendar") >= 0) {
									output.push(start.toTimeString().substr(0, 5) + ': ' + components[j].getFirstPropertyValue('summary'));
								}
								else {
									// Check the status of the task
									var task_status = components[j].getFirstPropertyValue('status');
									// Ignore completed or canceled tasks
									if (task_status !== "COMPLETED" && task_status !== "CANCELLED") {
										/*
										if (!task_status)
												task_status = "NEW";
										*/
										output.push(components[j].getFirstPropertyValue('summary'));
									}
								}
							}
						}
					}
					
					// Sort the final output by summary
					output.sort();

					console.log(this.name + ": response received.");
					if (output.length) {
						main.body(output.join("\n"));
					}
					else {
						main.body("No events found.");
					}
				},
				function(error, status, request) {
					console.log(this.name + ": fail - " + status + " " + JSON.stringify(request));
					main.body("No response received from ownCloud.");
				}
			);
		}
		else {
			decision_callback(tokens, main, settings, branches, branchIndex);
		}
	}
};

this.exports = Decisions_ownCloud;