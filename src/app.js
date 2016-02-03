var Settings = require('settings');
var UI = require('ui');
var Voice = require('ui/voice');
var Decisions = require('decisions.js');

// Handle configuration changes
Settings.config(
  { url: 'https://anewman2.github.io/pebble/rocky/' },
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
	font: 'gothic-14',
	title: 'Rocky',
	body: 'Ask me anything, such as "what\'s on my calendar" or "what\'s the weather forecast."'
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