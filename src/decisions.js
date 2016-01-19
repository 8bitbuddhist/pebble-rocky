var Decisions = {
	determine_response:function (tokens, main, settings) {
		var branches = [];

		// Add your decision-makers to the array
		branches.push(require('decisions-owncloud.js'));
		branches.push(require('decisions-ddg.js'));

		main.body("Loading...");
		
		// Called whenever a decision-maker can't reach a final decision
		var decision_callback = function (tokens, main, settings, branches, branchIndex) {
			branchIndex++;
			if (branches[branchIndex]) {
				return branches[branchIndex].decide(tokens, main, settings, branches, branchIndex, decision_callback);
			}
			else {
				main.body("No match found for '" + tokens.join(" ") + "'");
			}
		};
		
		// Kick off the decision tree
		var branchIndex = 0;
		branches[0].decide(tokens, main, settings, branches, branchIndex, decision_callback);
	}
};

this.exports = Decisions;