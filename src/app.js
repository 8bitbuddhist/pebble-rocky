var Settings = require('settings');
var UI = require('ui');
var Voice = require('ui/voice');
var Decisions = require('decisions.js');

// Handle configuration changes
Settings.config(
  { url: 'https://amenoph.us/bubbles' },
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
	//title: 'Bubbles',
	scrollable: true,
	font: 'gothic-18'
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

/*main.on('click', 'up', function(e) {
  var menu = new UI.Menu({
    sections: [{
      items: [{
        title: 'Pebble.js',
        icon: 'images/menu_icon.png',
        subtitle: 'Can do Menus'
      }, {
        title: 'Second Item',
        subtitle: 'Subtitle Text'
      }]
    }]
  });
  menu.on('select', function(e) {
    console.log('Selected item #' + e.itemIndex + ' of section #' + e.sectionIndex);
    console.log('The item is titled "' + e.item.title + '"');
  });
  menu.show();
});*/

main.on('click', 'select', function(e) {
	start_search();
});

main.on('click', 'down', function(e) {
  /*var card = new UI.Card();
  card.title('A Card');
  card.subtitle('Is a Window');
  card.body('The simplest window type in Pebble.js.');
  card.show();*/
});