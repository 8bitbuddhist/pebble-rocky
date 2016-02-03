var lib_date = {
	weekdays : ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"],
	months : ["january", "february", "march", "april", "may", "june", "july", "august", "september", "october", "november", "december"],
	
	getDate:function(tokens) {
		var current_date = new Date();
		if (tokens.indexOf("for") >= 0) {
			var period = tokens[tokens.indexOf("for") + 1];
			//var weekdays = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"];
			//var months = ["january", "february", "march", "april", "may", "june", "july", "august", "september", "october", "november", "december"];
			if (period === "tomorrow") {
				current_date.setDate(current_date.getDate() + 1);
			}
			// User provided a day such as "the 25th"
			else if (period === "the" && Number.isInteger(tokens[tokens.indexOf(period) + 1])) {
				current_date = new Date(current_date.getFullYear(), current_date.getFulllMonth(), period);
			}
			else if (this.months.indexOf(period) >= 0) {
				// User provided the month followed by a day (e.g. October 25)
				current_date = new Date(current_date.getFullYear(), this.months.indexOf(period), tokens[tokens.indexOf(period) + 1]);
			}
			else if (Number.isInteger(period) && (tokens[tokens.indexOf(period) + 1]  && this.months.indexOf(period + 1) >= 0)) {
				// User provided the day followed by the month (e.g. 25th [of] October)
				current_date = new Date(current_date.getFullYear(), this.months.indexOf(tokens[tokens.indexOf(period) + 1]), period);
			}
			else if (this.weekdays.indexOf(period) >= 0) {
				// Get the day of week
				var dow = this.weekdays.indexOf(period);
				if (dow > -1) {
					var distance = (dow + 7 - current_date.getDay()) % 7;
					current_date.setDate(current_date.getDate() + distance);
				}
			}
		}
		return current_date;
	},
	
	getDayofWeek:function(myDate) {
		var weekday = this.weekdays[myDate.getDay()];
		weekday = weekday.charAt(0).toUpperCase() + weekday.slice(1);
		return weekday;
	},
	
	getPaddedDate:function(myDate) {
		return ('0' + (myDate.getMonth()+1)).slice(-2) + '/' +
			('0' + (myDate.getDate())).slice(-2); // + '/'
			//myDate.getFullYear();
	}
};

this.exports = lib_date;