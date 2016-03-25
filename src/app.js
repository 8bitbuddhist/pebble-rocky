var Settings = require('settings');
var UI = require('ui');
var Voice = require('ui/voice');
var Decisions = require('decisions.js');

// If in production mode, set to false
var DEBUG = true;

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
	font: 'gothic-8',
	title: 'Rocky',
	body: 'What can I help you with?'
});

// Method for starting search
var start_search = function() {
	// Start a diction session and skip confirmation
	var parse = function(transcription) {
		var tokens = transcription.split(" ");
		console.debug("Raw transcription: " + tokens);
		
		// Change all tokens to lowercase
		for (var i = 0; i < tokens.length; i++) {
			tokens[i] = tokens[i].toLowerCase();
		}
		
		// Make tokens JSON-safe
		JSON.stringify(tokens);
		
		console.debug("Formatted tokens: " + tokens);
		
		// Start decision tree
		Decisions.determine_response(tokens);
	};
	
	// If in debug mode, use manually supply input. Otherwise use voice recognition
	if (DEBUG === false) {
		Voice.dictate('start', false, function(e) {
			if (e.err) {
				console.log('Transcription failed: ' + e.err);
				return;
			}

			parse(e.transcription);
		});
	}
	else {
		// TESTING: Enter test commands here
		parse("what's the forecast");
	}
};

// Refresh ownCloud calendar if necessary
//var owncloud = require('decisions-owncloud.js');
//owncloud.refresh_calendar();

// Start the main app
main.show();
start_search();

main.on('click', 'select', function(e) {
	start_search();
});