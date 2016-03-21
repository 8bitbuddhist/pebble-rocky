var Decisions_Empty = {
	name : "decisions-empty",
	
	decide:function(tokens, branchIndex, decision_callback) {
		var instance = this;
		console.log("Entered branch: " + instance.name);
		if (tokens[0] === "true") {
			// Process actions when user input matches.
			return;
		}
		else {
			// Process actions when user input fails.
			decision_callback(tokens, branchIndex);
		}
	}
};

this.exports = Decisions_Empty;