
import React from 'react';
import Reflux from 'reflux';



var AnimationStore = require('./stores/animationstore.js');
var StudyStore = require('./stores/studystore.js');
var SaveLoadStore = require('./stores/saveloadstore.js');
var LogStore = require('./stores/logstore.js');


var UserAgreement = require('./useragreement.jsx');
var UserInstructions = require('./userinstructions.jsx');


var IO = require('./../thirdparty/socket/socket.io.js');
var socket = io();

//for reset button
var VTIconStore = require('./stores/vticonstore.js');


var EditorHeader = React.createClass({

	mixins : [
				Reflux.connect(AnimationStore.store, 'animation'), //emitted updates go to 'animation' key
				Reflux.connect(StudyStore.store, 'study'), //emitted updates go to 'study' key

			],

	propTypes: {
			},

	getDefaultProps: function() {
	    return {
	    	displayAnimation:false,
	    	displayInterfaceMode:false, //was false
	    	displaySaveButton:true,
	    	displayStartButton:true,
			displayTestButton:true,
			displayRenderButton:true,
			displayStopButton:true,
			displayResetButton:true,
			displayGetSetPointsButton:true,
			uploadFileID:"uploadedFile"


	    }
	},

	_onAnimationChange: function(val) {
		AnimationStore.actions.setAnimation(val.target.value);
	},

	_onDisplayModeChange: function(val) {
		StudyStore.actions.setDisplayMode(val.target.value);
	},

	_onStartClick : function(e) {
		LogStore.actions.log("START_TASK");
	},

	_onSaveClick : function(e) {
		SaveLoadStore.actions.save();
	},


	_onLoadButtonClick : function(e) {
		document.getElementById(this.props.uploadFileID).click();
	},

	_onLoadClick : function(e) {
		var uploadedFiles = document.getElementById(this.props.uploadFileID);
		if (uploadedFiles.files.length > 0) {
			SaveLoadStore.actions.loadMacaronFile(uploadedFiles.files[0]);
		}
		uploadedFiles.value = [];
	},

	_onTestClick : function(e) {
		socket.emit('test');
	},

	_onRenderClick : function(e) {
		socket.emit('render');
	},

	_onStopClick : function(e) {
		socket.emit('stop_render');
	},

	_onResetClick : function(e) {
		VTIconStore.actions.reset();
	},
	_onGetSetPointsClick : function(e) {
		socket.emit('get_setPoints');
	},

	/**
	* Rendering
	*
	*/

	render : function() {

		var headerStyle = {
		};

		var blockStyle = {
           display: 'block',
           /*padding: '10px 10px 10px 10px'*/
           height: '25px'
           
		};

		var animationOptions = this.state.animation.animationOptions;
		var displayOptions = this.state.study.modes;
		var animationChangeCallback = this._onAnimationChange;
		var displayChangeCallback = this._onDisplayModeChange;
		var selectedAnimation = this.state.animation.animation;
		var selectedDisplayMode = this.state.study.currentMode;


		var buttonStyle = {
			marginLeft:'0.5em',
			marginRight:'0.5em',
			className:'unselectable',
			fontSize:12
		};

		//The UBC Logo to be placed next to the title
        // var logo = new Image();
        // logo.src = require("../img/macaron-logo.png");
        // logo.style = "width:60px;height:71px;";
        // logo.alt = "Example Image Location";

        // var logoDisplay = <h8><img src={logo.src} alt={logo.alt} style={logo.style}/></h8>;

		var animationOptionDisplay = <span />
		if (this.props.displayAnimation)
		{
			animationOptionDisplay = (<select className="animationoptions unselectable" onChange={animationChangeCallback}>
					{animationOptions.map( (animationOption) => (
						<option value={animationOption} selected={animationOption==selectedAnimation}>{animationOption}</option>
						))}
				</select>);
		}

		var interfaceModeDisplay = <span />
		if (this.props.displayInterfaceMode)
		{
			interfaceModeDisplay = (<select className="displayoptions unselectable" onChange={displayChangeCallback}>
					{Object.keys(displayOptions).map( (displayOption) => (
						<option value={displayOption} selected={displayOption==selectedDisplayMode}>{displayOption}</option>
						))}
				</select>);
		}

		var startButton = <span />
		if (this.props.displayStartButton)
		{
			startButton = (<button onClick={this._onStartClick}>Start</button>);
		}

		var saveButton = <span />
		if (this.props.displaySaveButton)
		{
			saveButton = (<a class="btn header" style={buttonStyle} onClick={this._onSaveClick} ><i className="fa fa-download"></i>Save</a>);
			//saveButton = (<button onClick={this._onSaveClick}><i class="fa fa-download"></i>Finish</button>);
		}

		var loadButton = <span />
		if (this.props.displaySaveButton)
		{
			// loadButton = (<a class="btn header" style={buttonStyle} onClick={this._onLoadClick} ><i className="fa fa-upload"></i> Load</a>);

			loadButton = (<span>
					<input type="file" className="hidden" id={this.props.uploadFileID} onChange={this._onLoadClick}></input>
					<a class="btn header" style={buttonStyle} onClick={this._onLoadButtonClick} ><i className="fa fa-upload"></i>Load</a>
					</span>);
		}

		var testButton = <span />
		if (this.props.displayTestButton)
		{
			testButton = (<button onClick={this._onTestClick}>Test</button>);
		}

		var renderButton = <span />
		if (this.props.displayRenderButton)
		{
			renderButton = (<button onClick={this._onRenderClick}>Render</button>);
		}

		var stopButton = <span />
		if (this.props.displayStopButton)
		{
			stopButton = (<button onClick={this._onStopClick}>Stop</button>);
		}

		var resetButton = <span />
		if (this.props.displayResetButton)
		{
			resetButton = (<button onClick={this._onResetClick}>Reset</button>);
		}
		var getSetPointsButton = <span />
		if (this.props.displayGetSetPointsButton)
		{
			getSetPointsButton = (<button onClick={this._onGetSetPointsClick}>Get set points</button>);
		}

		return (
			// <div className="header" style={headerStyle}>
			// 	{startButton}		
			// 	<span className="title unselectable" > Macaron </span>
			// 	<span className="menu">
			// 		{animationOptionDisplay}
			// 		{interfaceModeDisplay}
			// 		<UserInstructions />
			// 		<UserAgreement />
			// 		{saveButton}
			// 		{loadButton}
			// 		{saveButton}
			// 	    {testButton}
			// 	    {renderButton}
			// 	    {stopButton}

			// 	</span>


			// </div>

			<div className="header" style={headerStyle}>
				
				<span className="title unselectable"> Editor </span>
			
				{interfaceModeDisplay}
				{saveButton}
				{loadButton}
				{testButton}
				{renderButton}
				{startButton}
				{stopButton}
				{resetButton}
				{getSetPointsButton}
			</div>
			);
	}

});

module.exports = EditorHeader;
