//------------------------------------------------------------------------------
// Requires
//------------------------------------------------------------------------------
var express = require('express');
var app = express();
var five = require("johnny-five");
var fs = require('fs');
var path = require('path');
var csv = require ('fast-csv')
var pitchFinder = require('pitchfinder');
var server = require('http').Server(app);

//------------------------------------------------------------------------------
// Globals
//------------------------------------------------------------------------------
var board, myServo;
var rendered_path_main = [];
var rendered_path_example = [];
var parameters;
var detectPitchAMDF;
var orgSetPoints =[];
var smoothOut =0;
//------------------------------------------------------------------------------
// Server setup
//------------------------------------------------------------------------------


server.listen(3000);

    // app.use(express.static(__dirname + '/dist'));

    // app.get('/', function (req, res) {
    //   res.sendfile(__dirname + '/index.html');
    // });

    // app.use(express.static(__dirname + '/css'));


// app.use("/css", express.static(__dirname + '/css'));
// //app.use("/build", express.static(__dirname + '/build'));
// app.use("/dist", express.static(__dirname + '/dist'));
app.use("/thirdparty", express.static(__dirname + '/thirdparty'));
app.use("/recordings", express.static(__dirname+'/recordings'));

// app.get('/', function (req, res) {
//   res.sendFile(__dirname + '/index.html'); //was res.sendfile(__dirname + '/build/index.html');
// });

// var server = app.listen(3000, function () {
  var host = server.address().address;
  var port = server.address().port;

  console.log('Example app listening at http://%s:%s', host, port);


//------------------------------------------------------------------------------
// Socket setup
//------------------------------------------------------------------------------
var io = require('socket.io')(server);

//-----
// json poop
//-----

importParameters("recordings/1464126410068_parameters.json")





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
    socket.on('get_setPoints', function(){
        console.log('get_setPoints called!!!!')
        io.emit('send_setPoints', orgSetPoints);
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


///////////////////////////////////////////////////////////
// Voodle code
///////////////////////////////////////////////////////////


detectPitchAMDF = new pitchFinder.AMDF({
        sampleRate:40000,
        minFrequency:5,
        maxFrequency:1200
    });

var stream = fs.createReadStream("recordings/1464126410068_recording.csv");

var audioBuffer = []

var csvStream = csv()
    .on("data", function(d){
         audioBuffer.push(d[1])
    })
    .on("end", function(lines){
        
        processBuffer(audioBuffer);
    });

stream.pipe(csvStream);




// for (i in (1- buffer.size)){
//     j = i*(sampleRate/framerate)-framesPerBuffer | sampleRate/framerate must be >= framesPerBuffer
//     buffer.slice(j:i) = the buffer chunk we want.

// }




function processBuffer( inputBuffer ) {
    var stepSize = Math.floor(parameters.sampleRate/parameters.frameRate);
    var buffer;
    for (i=stepSize;i<inputBuffer.length;i+=stepSize){
        j = (i-parameters.framesPerBuffer)
        
        buffer = inputBuffer.slice(j,i)
            
        
        // else {
        //     console.log("failed!\n")
        //     console.log("parameters readout:    ",
        //                     parameters.sampleRate,
        //                     parameters.frameRate,
        //                     parameters.framesPerBuffer,
        //                     "j: "+j,
        //                     "i: "+i)
        //     break
        // }
        if (buffer.length==0){
           
            break
        }
       
        renderBuffer(buffer)
    }
    console.log("emitted processed buffer at " + new Date())
    io.emit("process_buffer_done");
}




function renderBuffer(inputBuffer) {
        
        
        var ampRaw = Math.abs(Math.max.apply(Math, inputBuffer));
        

        //start of pitch analysis///////////////////////////////////////////        
        var pitch = detectPitchAMDF(inputBuffer);
        
        if (pitch==null){
            pitch = 0
            
        }
        else{
            
            pitch = mapValue(pitch, 0,1000,0,1)
          
        }
        //end of pitch analysis///////////////////////////////////////////
        
        //mixes amplitude and frequency, while scaling it up by scaleFactor.
        var ampPitchMix = (parameters.gain_for_amp * ampRaw + parameters.gain_for_pitch * pitch) * parameters.scaleFactor;
        
        //smooths values
        //Note: smoothValue is a number between 0-1
        smoothOut = parameters.smoothValue * smoothOut + (1 - parameters.smoothValue) * ampPitchMix;
        
        orgSetPoints.push(smoothOut);

        
}


function importParameters(paramatersFile){
    var content = fs.readFileSync(paramatersFile)
    var jsonContent = JSON.parse(content)
    parameters = jsonContent;
    
}


function mapValue(value, minIn, maxIn, minOut, maxOut){
    if (value>maxIn){
        value = maxIn;
    }
    if (value<minIn){
        value = minIn;
    }
    return (value / (maxIn - minIn) )*(maxOut - minOut);
}


