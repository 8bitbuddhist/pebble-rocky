var Decisions = {
	determine_response:function (tokens) {
		var branches = [];

		// Add your decision-makers to the array
		branches.push(require('decisions-owncloud.js'));
		branches.push(require('decisions-weather.js'));
		branches.push(require('decisions-ddg.js'));

		//main.body("Loading...");
		
		// Called whenever a decision-maker can't reach a final decision
		var decision_callback = function (tokens, branchIndex) {
			branchIndex++;
			if (branches[branchIndex]) {
				return branches[branchIndex].decide(tokens, branchIndex, decision_callback);
			}
			else {
				var UI = require('ui');
				var card = new UI.Card({
					title: 'Rocky',
					body: 'No match found for \'' + tokens.join(" ") + '\''
				});
				card.show();
				console.log("Reached end of decision tree. No match found for '" + tokens.join(" ") + "'");
			}
		};
		
		// Kick off the decision tree
		var branchIndex = 0;
		branches[0].decide(tokens, branchIndex, decision_callback);
	}
};

this.exports = Decisions;