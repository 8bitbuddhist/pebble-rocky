var Decisions_Test = {
	name : "decisions-test",
	results : [],
	
	decide:function(tokens, branchIndex, decision_callback) {
		console.log("Entered branch: " + this.name);
		if (tokens[0] === "test") {
			if (tokens[1] === "me") {
				if (tokens[2] === "again") {
					main.body = "You tested me again! Way to go!";
					return;
				}
				else {
					main.body = "You tested me! Woot woot!";
					return;
				}
			}
			else {
				main.body = "This is a test.";
				return;
			}
		}
		else if (tokens[0] === "hello") {
			main.body = "Hello there!";
			return;
		}
		else {
			decision_callback(tokens, branchIndex);
		}
	}
};

this.exports = Decisions_Test;