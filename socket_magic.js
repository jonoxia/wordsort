var io = require('socket.io').listen(8080);

var mysql = require('mysql');
var TEST_DATABASE = 'nodejs_mysql_test';
var TEST_TABLE = 'test';
var client = mysql.createClient({
	user: 'root',
	password: 'soylentgnome9',
        database: "wordsort"
    });


io.sockets.on('connection', function (socket) {
    // send socket the list of all existing words
    client.query( "SELECT * FROM words", function(err, results, fields) {
	    for (var i = 0; i < results.length; i++) {
		socket.emit("word created",
                    { x: results[i].x,
                      y: results[i].y,
                      text: results[i].text,
                      color: results[i].color,
                      fontsize: results[i].fontsize,
		      wrapstyle: results[i].boxwrap?"box":"strip",
                      id: results[i].id } );
	    }
	});

    // when client reports a new word: assign it an id,
    // add it to the list, send new word to all clients
    socket.on("new word", function (data) {
        var socket = this;
	// Write new word to database
	client.query( "INSERT INTO words SET text=?, x=?, y=?, " +
		      "boxwrap=?, color=?, fontsize=?",
		      [data.text, data.x, data.y, true, "#FFF", 14],
		      function(err, info) {
			  if (err) {throw err;}
                          // info.insertId gives us id of last insertion made
			  var newWord = {x: data.x,
                                         y: data.y,
                                         text: data.text,
                                         id: info.insertId,
					 color: "#FFF",
					 fontsize: 14,
					 wrapstyle: "box"};
	
			  socket.broadcast.emit("word created", newWord);
			  // Broadcast does not send it back to the socket it
			  // came from -- but we need to do that, so that the
			  // creator of the word can know what id the server assigned it
			  socket.emit("word created", newWord);
		      });
    });

    // TODO break this into one function for x/y and another function for text?
    socket.on("update word", function (data) {
        this.broadcast.emit("word updated", {id: data.id,
                                             x: data.x,
                                             y: data.y,
                                             text: data.text});
        client.query("UPDATE words SET x=?, y=?, text=? WHERE id=?",
                     [data.x, data.y, data.text, data.id]);
    });

    socket.on("delete word", function (data) {
	this.broadcast.emit("word deleted", {id: data.id});
	client.query("DELETE FROM words WHERE id=?", [data.id]);
    });

    socket.on("update color", function(data) {
        this.broadcast.emit("color changed", {id: data.id, color: data.color});
        client.query("UPDATE words SET color=? WHERE id=?",
                     [data.color, data.id]);
    });

    socket.on("update wrap", function(data) {
        this.broadcast.emit("wrap changed", {id: data.id, style: data.style});
        client.query("UPDATE words SET boxwrap=? WHERE id=?",
            [(data.style=="box"), data.id]);
    });

    socket.on("update size", function(data) {
        this.broadcast.emit("size changed", {id: data.id, fontsize: data.fontsize});
        client.query("UPDATE words SET fontsize=? WHERE id=?",
			 [data.fontsize, data.id]);
    });
});