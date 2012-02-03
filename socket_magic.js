var io = require('socket.io').listen(8080);

var lastUsedId = 0;
var allWords = [];

function getWordById(id) {
    for (var i = 0; i < allWords.length; i++) {
        if (allWords[i].id == id) {
	    return allWords[i];
	}
    }
    return null;
}

io.sockets.on('connection', function (socket) {
    // send socket the list of all existing words
    for (var i = 0; i < allWords.length; i++) {
        socket.emit("word created",
                    { x: allWords[i].x,
                      y: allWords[i].y,
                      text: allWords[i].text,
                      color: allWords[i].color,
                      fontsize: allWords[i].fontsize,
                      wrapstyle: allWords[i].wrapstyle,
                      id: allWords[i].id } );
    }

    // when client reports a new word: assign it an id,
    // add it to the list, send new word to all clients
    socket.on("new word", function (data) {
        var newId = lastUsedId;
	lastUsedId ++;
	console.log("Creating new word id " + newId);
	var newWord = {x: data.x,
		       y: data.y,
		       text: data.text,
		       id: newId,
		       color: "#FFF",
	               fontsize: 14,
	               wrapstyle: "box"};
	allWords.push(newWord);
	this.broadcast.emit("word created", newWord);
	// Broadcast does not send it back to the socket it
	// came from -- but we need to do that, so that the
	// creator of the word can know what id the server assigned it
	this.emit("word created", newWord);
    });

    socket.on("update word", function (data) {
	var word = getWordById(data.id);
	if (word) {
	    word.x = data.x;
	    word.y = data.y;
	    word.text = data.text;
            this.broadcast.emit("word updated", {id: data.id,
			x: data.x,
			y: data.y,
			text: data.text});
        }
    });

    socket.on("delete word", function (data) {
        var word = getWordById(data.id);
	if (word) {
            var index = allWords.indexOf(word);
	    allWords.splice(index, 1);
	    this.broadcast.emit("word deleted", {id: data.id});
	}
    });

    socket.on("update color", function(data) {
        var word = getWordById(data.id);
	if (word) {
	    word.color = data.color;
	    this.broadcast.emit("color changed", {id: data.id, color: data.color});
	}
    });

    socket.on("update wrap", function(data) {
        var word = getWordById(data.id);
	if (word) {
	    word.wrapstyle = data.style;
	    this.broadcast.emit("wrap changed", {id: data.id, style: data.style});
	}
    });

    socket.on("update size", function(data) {
        var word = getWordById(data.id);
	if (word) {
	    word.fontsize = data.fontsize;
	    this.broadcast.emit("size changed", {id: data.id, fontsize: data.fontsize});
	}
    });
});