//------------------------------------------------------------------------------
// Requires
//------------------------------------------------------------------------------
var express = require('express');
var app = express();
var five = require("johnny-five");
var fs = require('fs');
var path = require('path');

//------------------------------------------------------------------------------
// Globals
//------------------------------------------------------------------------------
var board, myServo;
var rendered_path_main = [];
var rendered_path_example = [];

//------------------------------------------------------------------------------
// Server setup
//------------------------------------------------------------------------------


app.use("/css", express.static(__dirname + '/css'));
app.use("/build", express.static(__dirname + '/build'));
app.use("/dist", express.static(__dirname + '/dist'));
app.use("/thirdparty", express.static(__dirname + '/thirdparty'));
app.get('/', function (req, res) {
  res.sendFile(__dirname + '/build/index.html'); //was res.sendfile(__dirname + '/build/index.html');
});
var server = app.listen(8080, function () {
  var host = server.address().address;
  var port = server.address().port;

  console.log('Example app listening at http://%s:%s', host, port);
});

//------------------------------------------------------------------------------
// Socket setup
//------------------------------------------------------------------------------
var io = require('socket.io')(server);

//------------------------------------------------------------------------------
// Socket functions (connect to index.html)
//------------------------------------------------------------------------------
io.on('connection', function(socket){
	console.log('User connected.');

	//User disconnects
	socket.on('disconnect', function(){
		console.log('User disconnected.');
	});

	// Test servo motion
	socket.on('test', function(){
        	io.emit('server_message', 'Started arduino sweep.');
        	myMotor.start(255);
		console.log('Arduino test.');
	});

    // Move to degree
    socket.on('degree', function(degree){
            var d = parseInt(degree);
        	io.emit('server_message', 'Moving to degree ' + degree + ".");
        	myMotor.start(255);
		console.log('Moving to degree ' + degree + ".");
    });

    socket.on('stop_render', function() {
        stop_render();
    });

    socket.on('path', function(msg){
        var path = msg['path'];
        var range = msg['range'];
        var name = msg['name']
        console.log("Path received for " + name + ".");
        makepath(range,path,name);
    });

	socket.on('render', function(){
        console.log('Rendering...');
        render();
	});
});

board = new five.Board();
var myMotor;
board.on("ready", function() {
    var standby = new five.Pin(7);
    standby.high()

	myMotor = new five.Motor({
		pins: {
            pwm:3,
            dir:9,
            cdir:8
        }
	});

    myServo = new five.Servo({
        pin:10,
        center:true,
        range: [0,180]
    });

	board.repl.inject({
		motor: myMotor,
        servo: myServo
	});
	io.emit('server_message','Ready to start board.');
    	console.log('Sweep away, my captain.');
});

function makepath(range,path,name) {
    var unscaled_points = [];
    var scaled_points = [];
    var scale_factor = 180
    var offset = 0
    var values = path.split(',');

    if (name=="example") {
        scale_factor = 255;
        offset = 100
    }


    for (var i=10; i<values.length; i++) {
        var value = parseFloat(values[i].split('L')[0]);
        unscaled_points.push(value);
    }

    for (var i=0; i < unscaled_points.length; i++) {
    var p =  Math.max(((unscaled_points[i] / range) * scale_factor) - offset,0);
    scaled_points.push(p);
    }    

    
    rendered_path(scaled_points,name);
}

function rendered_path(sp,name) {
    if (name=="example") {
        rendered_path_example = sp;
    } else if (name=="main") {
        rendered_path_main = sp;
    }
}

var timeouts = [];
function render() {
    stop_render();
    if (rendered_path_main.length==0 || rendered_path_example.length == 0) {
        console.log('No path to render yet...');
    }
    else {
        for(var i=0;i<rendered_path_main.length;i++) {
            timeouts.push(doSetTimeout(i));
        }
    }
}

function stop_render() {
    // console.log("Stopping render...");
    myMotor.start(0)
    for (var i=0; i<timeouts.length; i++) {
        clearTimeout(timeouts[i]);
    }
    console.log("Stopped render.");
}
function doSetTimeout(i) {
    var t = setTimeout(function(){
        myServo.to(rendered_path_main[i]);
        myMotor.start(rendered_path_example[i]);
        console.log('Setting speed to ' + rendered_path_example[i]);
        console.log('Rotating servo to ' + rendered_path_main[i]);
    },5 * i);
    return t;
}
