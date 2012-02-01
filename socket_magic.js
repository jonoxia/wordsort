var io = require('socket.io').listen(8080);

var lastUsedId = 0;
var allWords = [];

io.sockets.on('connection', function (socket) {
	// send socket the list of all existing words
	for (var i = 0; i < allWords.length; i++) {
            socket.emit('existing word', { x: allWords[i].x,
			y: allWords[i].y,
			text: allWords[i].text,
			id: allWords[i].id } );
	}

	// when client reports a new word: assign it an id,
	// add it to the list, send new word to all clients
	socket.on('new word', function (data) {
                var newId = lastUsedId;
		lastUsedId ++;
		console.log("Creating new word id " + newId);
		var newWord = {x: data.x,
			       y: data.y,
			       text: data.text,
			       id: newId};
		allWords.push(newWord);
		this.broadcast.emit("existing word", {x: newWord.x,
			    y: newWord.y,
			    text: newWord.text,
			    id: newWord.id} );
		this.emit("existing word", {x: newWord.x,
			    y: newWord.y,
			    text: newWord.text,
			    id: newWord.id} );
	    });
	// todo handlers for alter word, delete word
	/*socket.on('alter word', function (data) {
		console.log(data);
	    });
	socket.on('delete word', function (data) {
		console.log(data);
		});*/
    });