var Decisions_DDG = {
	name : "decisions-duckduckgo",
	
	decide:function(tokens, main, settings, branches, branchIndex, decision_callback) {
		var instance = this;
		console.log(instance.name + ": entered branch.");
		// Search for any text not recognized in another branch
		// Format the search string
		var token_string = "";
		for (var i = 0; i < tokens.length; i++) {
			token_string += tokens[i] + "+";
		}
		token_string = token_string.substring(0, token_string.length - 1);

		var ajax = require('ajax');
		ajax(
			{
				url: 'http://api.duckduckgo.com/?q=' + token_string + '&format=json&no_html=1',
				type: 'json',
				method: 'get'
			},
			function(data, status, request) {
				console.log(instance.name + ": search complete - " + JSON.stringify(data));
				// Return an Instant Answer field
				if (data.Answer) {
					main.title("DuckDuckGo Results");
					main.body(data.Answer);
				}
				else if (data.Definition) {
					main.title("DuckDuckGo Results");
					main.body(data.Definition);
				}
				else if (data.AbstractText) {
					main.title("DuckDuckGo Results");
					main.body(data.AbstractText);
				}
				else {
					console.log(instance.name + ": no search results found.");
					decision_callback(tokens, main, settings, branches, branchIndex);
				}
			},
			function(error, status, request) {
				console.log(instance.name + ": search failed - " + error);
				decision_callback(tokens, main, settings, branches, branchIndex);
			}
		);
	}
};

this.exports = Decisions_DDG;