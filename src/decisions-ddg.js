var Decisions_DDG = {
	name : "decisions-duckduckgo",
	
	decide:function(tokens, branchIndex, decision_callback) {
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
				method: 'GET'
			},
			function(data, status, request) {
				console.log(instance.name + ": search complete - " + JSON.stringify(data));
				
				var UI = require('ui');
				var card = new UI.Card({
					title: 'DuckDuckGo Results',
					scrollable: true
				});
				
				// Return an Instant Answer field
				if (data.Answer) {
					card.body(data.Answer);
					card.show();
				}
				else if (data.Definition) {
					card.body(data.Definition);
					card.show();
				}
				else if (data.AbstractText) {
					card.body(data.AbstractText);
					card.show();
				}
				else {
					console.log(instance.name + ": no search results found.");
					decision_callback(tokens, branchIndex);
				}
			},
			function(error, status, request) {
				console.log(instance.name + ": search failed - " + error);
				decision_callback(tokens, branchIndex);
			}
		);
	}
};

this.exports = Decisions_DDG;