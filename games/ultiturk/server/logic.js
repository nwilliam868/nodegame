function Ultimatum () {

	this.name = 'Backend logic for Ultimatum Game';
	this.description = 'No Description';
	this.version = '0.2';
	
	this.minPlayers = 3;
	this.maxPlayers = 10;
	
	this.automatic_step = false;
	
	this.init = function () {
		
		this.SHOWUP = 500;
		
		node.onDATA('response', function(msg) {
			var response = msg.data;
			if (!response) return;
			if (response.response === 'ACCEPT') {
				var resWin, bidWin, p;
				
				resWin = parseInt(response.value);
				bidWin = 100 - resWin;
				
				// Respondent payoff
				p = node.game.pl.get(msg.from);
				p.win = (!p.win) ? resWin : p.win + resWin;
				node.log('Added to respondent ' + msg.from + ' ' + response.value + ' ECU');
				
				// Bidder payoff
				p = node.game.pl.get(response.from);
				p.win = (!p.win) ? bidWin : p.win + bidWin;
				node.log('Added to bidder ' + p.id + ' ' + p.win + ' ECU');
			}
		});
	};
	
	var pregame = function () {
		var that = this;
		node.log(dk.codes.fetch());
		node.on('UPDATED_PLIST', function(){
			
			// Security check
			var mtid, found;
			node.game.pl.each(function(p){
				mtid = p.mtid;
				found = dk.codes.select('AccessCode', '=', mtid);
				
				if (!found) {
					node.log('Found invalid access code ' + mtid + ' for player ' + p.id);
					return;
				}
				  
				if (found.length > 1) {
					node.log('Access code used multiple times: ' + mtid);
					found.each(function(p){
						node.log(' - player: ' + p.id);
					});
					return;
				}
				
				dk.checkIn(mtid);
			});
			
		});
		
		console.log('Pregame');
	};
	
	var instructions = function () {	
		console.log('Instructions');
	};
		
	var game = function () {
		var that = this;
		// Pairs all players
		var groups = this.pl.getGroupsSizeN(2);
	
		node.log('PAIRS');
		node.log(groups.length);
		
		var i;
		var g = null;
		for ( i = 0; i < groups.length; i++) {
			g = groups[i];
			if (g.length > 1) {
				g.shuffle();
				// Bidder
				var bidder = g.first();
				var respondent = g.last();
				
				var data_b = {
						role: 'bidder',
						other: respondent.id
				};
				var data_r = {
						role: 'respondent',
						other: bidder.id
				};
				
				// Send a message to each player with their role
				// and the id of the player they play against
				node.say(data_b, 'BIDDER', bidder.id);
				node.say(data_r, 'RESPONDENT', respondent.id);
				
				node.log('SENT BIDDER AND RESPONDENT');
				node.log(bidder.id);
				node.log(respondent.id);
				
			}
			// Someone was not paired. Let him wait
			else {
				var solo = g.first();
				node.say('SOLO', 'SOLO', solo.id);
				node.log('SENT SOLO');
				node.log(solo.id);
				
			}	
		}
		
		console.log('Game');
	};
	
	var postgame = function () {
		console.log('Postgame');
	};
	
	var endgame = function () {
		node.game.memory.save('./results.nddb');	
		var that = this;
		var exitcode;
		node.game.pl.each(function(p) {
			node.say(p.win, 'WIN', p.id);
			exitcode = dk.codes.select('AccessCode', '=', p.mtid).first().ExitCode;
			p.win = (that.SHOWUP + (p.win || 0)) / 1000;
			dk.checkOut(p.mtid, exitcode, p.win);
		});
		
	      
	    
	    console.log('FINAL PAYOFF PER PLAYER');
	    console.log('***********************');
	    console.log(node.game.pl.keep(['mtid', 'win']).fetch());
	    
	    console.log('***********************');
	      
	    	      
		console.log('Game ended');
	};
	
	
	
	// Creating the Game Loop	
	this.loops = {
			
			1: {state:	pregame,
				name:	'Game will start soon'
			},
			
			2: {state: 	instructions,
				name: 	'Instructions'
			},
				
			3: {rounds:	2, 
				state: 	game,
				name: 	'Game'
			},
			
			4: {state:	postgame,
				name: 	'Questionnaire'
			},
				
			5: {state:	endgame,
				name: 	'Thank you'
			}
	};	

}

/// RUN

var NDDB = require('NDDB').NDDB,
dk = require('descil-mturk'),
node = require('nodegame-client'),
JSUS = node.JSUS;

module.exports.node = node;
module.exports.Ultimatum = Ultimatum;

/// Start the game only after we have received the list of access codes
dk.getCodes(function(){
	var conf = {
		name: "P_" + Math.floor(Math.random()*100),
		url: "http://localhost:8080/ultimatum/admin",
		io: {
		    'reconnect': false,
		    'transports': ['xhr-polling'],
		    'polling duration': 10
		},
		verbosity: 0,
	};
	node.play(conf, new Ultimatum());
});