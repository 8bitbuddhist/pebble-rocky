var Settings = require('settings');
var UI = require('ui');
var Voice = require('ui/voice');
var Decisions = require('decisions.js');

// Handle configuration changes
Settings.config(
  { url: 'https://amenoph.us/rocky' },
  function(e) {
		console.log('Opening configurable.');
  },
  function(e) {
		console.log('Closing configurable.');
		if (e.failed) {
      console.log("Failed to parse response.");
    }
  }
);

var main = new UI.Card({
	//title: 'Rocky',
	scrollable: true,
	font: 'gothic-18',
	title: 'Rocky',
	body: 'Hi, I\'m Rocky! Ask me anything, like "what\'s on my calendar" or "who is Carl Sagan"!'
});

// Method for starting search
var start_search = function() {
	// Start a diction session and skip confirmation
	Voice.dictate('start', false, function(e) {
		if (e.err) {
			console.log('Transcription failed: ' + e.err);
			return;
		}
		
		var tokens = e.transcription.split(" ");
		//var tokens = ["what's", "on", "my", "calendar"];

		console.log("Tokens: " + tokens);
		// Change all tokens to lowercase
		for (var i = 0; i < tokens.length; i++) {
			tokens[i] = tokens[i].toLowerCase();
		}
		// Make tokens JSON-safe
		JSON.stringify(tokens);
		
		Decisions.determine_response(tokens, main, Settings);
	});
};

main.show();
start_search();

main.on('click', 'select', function(e) {
	start_search();
});