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
var colors = require('colors');
var io = require('socket.io')(server);

var functions = require('./functions.js')
var MotorHandler = require('./motor.js')
var motorh = new MotorHandler();

//------------------------------------------------------------------------------
// Globals
//------------------------------------------------------------------------------
var board, myServo, myMotor;
var rendered_path_main = [];
var rendered_path_example = [];
var parameters;
var detectPitchAMDF;
var orgSetPoints =[];
var smoothOut =0;
var timeouts = [];

//----------------------------------------------------------------------------------
// Functions
//----------------------------------------------------------------------------------
function makepath(msg) {
    var frameheight = msg['range']
    var values = msg['path'].split(',')
    var name = msg['name']

    var scaled_points = [];
    var unscaled_points = [];
    
    var scale_factor = parameters.servoMax - parameters.servoMin

    var offset = parameters.servoMin



    if (name=="example") {
        scale_factor = 255;
        offset = 100
    }

    for (var i=10; i<values.length; i++) { //TODO: was i=10 a typo? Should it be =0? Who kno
        var v = parseFloat(values[i].split('L')[0]);
        var value = mapValue(v,frameheight,(frameheight * 2),parameters.servoMin,parameters.servoMax);
        unscaled_points.push(v);
        scaled_points.push(value);
    }

    log("max",getMaxOfArray(scaled_points),"min",getMinOfArray(scaled_points))
    log("max",getMaxOfArray(unscaled_points),"min",getMinOfArray(unscaled_points))

    rendered_path(scaled_points,name);
}

function rendered_path(sp,name) {
    if (name=="example") {
        rendered_path_example = sp;
    } else if (name=="main") {
        rendered_path_main = sp;
    }
}
function render() {
    stop_render();
    // console.log('rendered path: ',getMaxOfArray(rendered_path_main),getMinOfArray(rendered_path_main))
    if (rendered_path_main.length==0 || rendered_path_example.length == 0) {
        log('No path to render yet...');
    }
    else {
        for(var i=0;i<rendered_path_main.length;i++) {
            timeouts.push(doSetTimeout(i));
        }
    }
}

function stop_render() {
    log("Stopping render...");
    // myMotor.start(0)
    for (var i=0; i<timeouts.length; i++) {
        clearTimeout(timeouts[i]);
    }
    log("Stopped render.");
}

function doSetTimeout(i) {
    //log('set timeout called!')
    var t = setTimeout(function(){
        myServo.to(rendered_path_main[i]);
        // random = Math.max((Math.random()*80),15)
        // myServo.to(random);
        //log('random val: ',random)
        myMotor.start(rendered_path_example[i]);
        //log('Setting speed to ' + rendered_path_example[i]);
        //log('Rotating servo to ' + rendered_path_main[i]);
    },5 * i);
    return t;
}

function processBuffer( inputBuffer ) {
    var stepSize = Math.floor(parameters.sampleRate/parameters.frameRate);
    var buffer;
    for (i=stepSize;i<inputBuffer.length;i+=stepSize){
        j = (i-parameters.framesPerBuffer)
        
        buffer = inputBuffer.slice(j,i)
            
        if (buffer.length==0){
           
            break
        }
        renderBuffer(buffer)
    }
    log("emitted processed buffer")
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
            pitch = functions.mapValue(pitch, 0,1000,0,1)
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

function log() {
    var out = []
    var r = Array.from(arguments)

    var date = new Date().toLocaleTimeString() + "\t"
    console.log(" ")
    console.log(repeat(date.length * 4,"=").rainbow)
    console.log(date.rainbow)
    
    r.forEach(function(item){
        console.log(item)
    })
    console.log(repeat(date.length * 4,"-").rainbow)
}

function repeat(n,l) {
    if (n == 0) {
        return l
    } else {
        return l + repeat(n-1,l)
    }
}

function getMaxOfArray(numArray) {
  return Math.max.apply(null, numArray);
}

function getMinOfArray(numArray) {
  return Math.min.apply(null, numArray);
}

function mapValue(value, minIn, maxIn, minOut, maxOut){
    return (((value - minIn) / (maxIn - minIn)) * (maxOut - minOut)) + minOut;
}

//----------------------------------------------------------------------------------
// Main
//----------------------------------------------------------------------------------
function main() {
    
    //------------------------------------------------------------------------------
    // Server setup
    //------------------------------------------------------------------------------
    server.listen(3000);

    app.use("/thirdparty", express.static(__dirname + '/thirdparty'));
    app.use("/recordings", express.static(__dirname+'/recordings'));


    var host = server.address().address;
    var port = server.address().port;

    log('Example app listening at http://%s:%s', host, port);

    //------------------------------------------------------------------------------
    // json poop
    //------------------------------------------------------------------------------
    importParameters("recordings/1464126410068_parameters.json")

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

    //------------------------------------------------------------------------------
    // Socket setup
    //------------------------------------------------------------------------------
    io.on('connection', function(socket){
        log('User connected.');

        //User disconnects
        socket.on('disconnect', function(){
            log('User disconnected.');
        });

        // Test servo motion
        socket.on('test', function(){
                io.emit('server_message', 'Started arduino sweep.');
                myMotor.start(255);
            log('Arduino test.');
        });

        // Move to degree
        socket.on('degree', function(degree){
                var d = parseInt(degree);
                io.emit('server_message', 'Moving to degree ' + degree + ".");
                myMotor.start(255);
            log('Moving to degree ' + degree + ".");
        });

        socket.on('stop_render', function() {
            stop_render();
        });

        socket.on('path', function(msg){
            makepath(msg);
        });

        socket.on('render', function(){
            console.log('socket render event!')
            log('Rendering...');
            render();
        });
        socket.on('get_setPoints', function(){
            log('get_setPoints called!!!!')
            io.emit('send_setPoints', orgSetPoints);
           });
    });

    //------------------------------------------------------------------------------
    // Board setup
    //------------------------------------------------------------------------------
    board = new five.Board();
    
    board.on("ready", function() {
        log('board is ready!')
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
            range: [parameters.servoMin,parameters.servoMax] 
        });

        board.repl.inject({
            motor: myMotor,
            servo: myServo
        });
        io.emit('server_message','Ready to start board.');
            log('Sweep away, my captain.');
    });
}





main()