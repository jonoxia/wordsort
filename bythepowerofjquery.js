//Window Resize? (with multiple people?)
//make textbox properties part of object
//duplicate words and styles
//deleting words

var allthewords = [];
var chosenword = null;
var movingword = null;
var socket = null;
		
function Word(x, y, blah, id)
//the word object has properties: x, y, blah, id, 
// textbox, chosen, class, updatePosition()
{
    this.x=x;
    this.y=y;
    this.blah=blah;
    this.id=id;
			
    var deskarea= $('#deskarea'); //div of the area on the page that the word goes in
    this.textbox=$('<div></div>'); // draws a new div for the new word

    this.setChosen(true);

    this.updateText(blah);
    this.updatePosition(x, y);
    deskarea.append(this.textbox);

    var self = this;
			
    var touchdown = function(event) 
    {
	self.dx=event.pageX-self.x;   
	self.dy=event.pageY-self.y; 
	
	movingword=self;
	self.setChosen(true);   //toggles local "chosen" attribute
								
	event.stopPropagation(); //stops text highlighting
	event.preventDefault();								
    };
			
    var dragster = function(event) 
    {
	if(movingword==self)
	    {self.updatePosition(event.pageX, event.pageY);}
	event.stopPropagation();
	event.preventDefault();
    };
			
    var touchup =function(event)
    {
	movingword=null;
	self.dx = 20;
	self.dy = 10;
    };
			
    this.textbox.mousedown(touchdown); 
			
    this.textbox.mousemove(dragster);			
			
    this.textbox.mouseup(touchup); 
						
    this.textbox.click( 
		       function(event)    //makes clicks on the word not count as a click on the deskarea
			{
				event.stopPropagation();
			});					

    ///// start touchscreen shit -- basically the above, copy-pasta-ed with touch events///					
    this.textbox.on("touchstart", touchdown);			
    this.textbox.on("touchmove", dragster);				
    this.textbox.on("touchend", touchup);
    //// end touchscreen shit ///			

}

Word.prototype =
{
    class: "defaultword", dx:0, dy:0,
    removeSelf: function()
    {
	this.textbox.remove();
	chosenword = null;
    }, 
    updatePosition: function(x, y)
    {
	if(movingword==this)
	    {x=x-this.dx; y=y-this.dy;}
	
	this.x=x; this.y=y;
	
	this.textbox.css({'left':x+'px', 'top':y+'px'});
    },		
    updateText: function(text)
    {
	this.blah = text;
	this.textbox.html(this.blah);
	this.textbox.addClass('defaultword')
	this.updateSize(0);
    },		
    updateSize: function(bigger)
    {
	var fontsize= extractCSSNumber('font-size');
	var wordlength= this.blah.length;
	
	fontsize = fontsize+bigger;	
	
	if(fontsize<=50 && fontsize >=10) //max fontsize = 50px, min fontsize=15px
	    {				
		$(this.textbox).css('font-size', fontsize + 'px');
		$(this.textbox).css('max-width', fontsize*wordlength/8+fontsize*3 + 'px'); //random formula for calculating box size
	    }
	/// making the border thicker is done in the setChosen function when setChosen is made false.
	/// otherwise, the style would supercede the class attribute in the textbox.
    },		
    
    setChosen: function(newvalue) //takes true/false boolean, toggles the appearance of the chosen word
    {
	this.chosen = newvalue;
	
	if (newvalue==true)
	    {
		if(chosenword != null) //deselects previously chosen word
		    {chosenword.setChosen(false);}
		chosenword=this;  //updates global variable chosenword
		
		$(this.textbox).addClass('chosenword');	 //changes word style
		$(this.textbox).css('border-width', '3px'); // forces 3px border
		$('#chosenmenu').show();
		$('#inputbox').val(this.blah); 
		
	    }
	else		
	    {
		$(this.textbox).removeClass('chosenword');
		
		var originalborder= extractCSSNumber('font-size')/11;
		$(this.textbox).css('border-width', originalborder + 'px');  //resets border width to be proportional to font size
		
		$('#chosenmenu').hide();
		$('#inputbox').val('');
	    }
	
	
    },		
    
};

/////////// other general functions ////////////////

function getWordById(id) {
    for (var i = 0; i < allthewords.length; i++) {
        if (allthewords[i].id == id) {
	    return allthewords[i];
	}
    }
    return null;
}

function addWord()
{
    var blah= document.getElementById('inputbox').value;
    var randx =Math.floor(Math.random()*500)+20;  // get random x and y values
    var randy =Math.floor(Math.random()*400)+50;

    // Tell server to create the new word:
    socket.emit("new word", {x: randx, y: randy, text: blah});
}

function deleteWord()
{   
    if (chosenword != null) {
	// tell server to delete word:
	socket.emit("delete word", {id: chosenword.id});
	chosenword.removeSelf();
	var i = allthewords.indexOf(chosenword);
	allthewords.splice(i, 1);
    }
}

function extractCSSNumber(cssattr)
{
    var numberstring= $(chosenword.textbox).css(cssattr);  //gets the string for the css attribute
    numberstring=numberstring.substr(0, numberstring.indexOf('p')); //extracts the number part of the attribute
    var number= parseInt(numberstring); //transforms that into a number
    
    return number;
}

function updateCurrentText()
{
    chosenword.updateText($('#inputbox').val());
    // Send an "update word" to the server
    socket.emit("update word", {id: chosenword.id,
		x: chosenword.x,
		y: chosenword.y,
		text: chosenword.blah});
}


function updateBGColor(color)
{
    $(chosenword.textbox).css('background-color', color);
}

function makeBigger(bigger)
{	chosenword.updateSize(bigger);		}

function BlockMove(event) {  // Tell Safari not to move the window, stolen from http://matt.might.net/articles/how-to-native-iphone-ipad-apps-in-javascript/
    event.preventDefault() ;
}

function onLoad()
{
    socket = io.connect("http://runjumpbuild.com:8080");

    var deskarea= document.getElementById("deskarea"); //$('#deskarea'); //div of the area on the page that the words go in
    deskarea.addEventListener("mousemove", function(event) {
	//If there's a word that is currently being moved, it updates the location of the word to the mouse pointer.
        if (movingword != null)
	{
	    movingword.updatePosition(event.pageX, event.pageY);
	    // Send an "update word" to the server
	    socket.emit("update word", {id: chosenword.id,
			x: chosenword.x,
			y: chosenword.y,
			text: chosenword.blah});

	}
    });
    
    $('#deskarea').click( 
			 function(event) //If the deskarea is clicked, it de-highlights any currently chosen words
			 {
			     if (movingword == null && chosenword!=null)
				 {
				     chosenword.setChosen(false);
				 }
			 }
			  );
    
    $('#makestrip').click( 
			  function() 
			  {
			      $(chosenword.textbox).css('max-width','90%');
			  }
			   );
    
    
    // respond to notifications that the server sends us:
    socket.on("word created", function(data) {
      // create new word in allthewords array.
      allthewords.push(new Word(data.x, data.y, data.text, data.id));
    });

    socket.on("word updated", function(data) {
	var word = getWordById(data.id);
	if (word) {
	    word.updatePosition(data.x, data.y);
	    word.updateText(data.text);
	}
    });

    socket.on("word deleted", function(data) {
	var word = getWordById(data.id);
	if (word) {
	    // TODO can this screw up if it's called 2 times concurrnetly?
	    // need some kind of mutex?
	    word.removeSelf();
	    var i = allthewords.indexOf(word);
	    allthewords.splice(i, 1);
	}
    });
}
		
$(document).ready(onLoad);
		