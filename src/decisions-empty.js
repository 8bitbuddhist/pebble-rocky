var Decisions_Empty = {
	name : "decisions-empty",
	
	decide:function(tokens, main, settings, branches, branchIndex, decision_callback) {
		var instance = this;
		console.log("Entered branch: " + instance.name);
		if (tokens[0] === "true") {
			// Process actions when user input matches.
			return;
		}
		else {
			// Process actions when user input fails.
			decision_callback(tokens, main, settings, branches, branchIndex);
		}
	}
};

this.exports = Decisions_Empty;