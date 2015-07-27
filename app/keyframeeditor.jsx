
import React from 'react';
import d3 from 'd3';
import Reflux from 'reflux';

var VTIconStore = require('./stores/vticonstore.js');
var TimelineMixin = require('./util/timelinemixin.js');
var ScaleStore = require('./stores/scalestore.js');
var DragStore = require('./stores/dragstore.js');

var KeyframeEditor = React.createClass({

	mixins : [
		TimelineMixin("divWrapper"),
		Reflux.connect(ScaleStore.store, 'scales') //emitted updates go to 'scales' key			
		],



	propTypes: {
		parameter : React.PropTypes.string.isRequired,
		vticon : React.PropTypes.object.isRequired,
		selection : React.PropTypes.object.isRequired,
		keyframeCircleRadius: React.PropTypes.number.isRequired,
		playheadFill: React.PropTypes.string.isRequired,
		currentTime: React.PropTypes.number.isRequired
			},
	
	getDefaultProps: function() {
	    return {
	      height: 100,
	      width:"100%",
	      circleColor:'#FF8400',
	      selectedCircleColor:'#B05B00',
	      selectionColor:'#676767',
	      selectionOpacity:0.2
	    }
	},


	componentDidMount: function () {
    	var parameter_range = [this.props.height-this.props.keyframeCircleRadius, this.props.keyframeCircleRadius]

    	ScaleStore.actions.setTrackrange(this.props.parameter, parameter_range); 
    	ScaleStore.actions.setTopOffset(this.props.parameter, this.refs.divWrapper.clientOffset) ;
	},


	render : function() {

		var keyframeCircleRadius = this.props.keyframeCircleRadius;
		var circleColor = this.props.circleColor;
		var selectedCircleColor = this.props.selectedCircleColor;

		var data = this.props.vticon.parameters[this.props.parameter].data;

		var valueScale = this.props.vticon.parameters[this.props.parameter].valueScale;

		var scaleY = this.state.scales.scaleParameter[this.props.parameter];

        var scaleX = this.props.scaleX;
        var height = this.props.height;


        var lineGen = d3.svg.line()
                            .x(function(d)
                            {
                                return scaleX(d.t);
                            })
                            .y(function(d)
                            {
                                return scaleY(d.value);
                            });

		var divStyle = {
			height:this.props.height,
			width:this.props.width,
			background:this.props.background
		};


		var firstValue = data[0].value;
		var lastValue = data[data.length-1].value;
		
		var fillPath =lineGen(
				[{t:0, value:valueScale[0]}]
				.concat([{t:0, value:firstValue}])
				.concat(data)
				.concat([{t:this.props.vticon.duration, value:lastValue}])
				.concat([{t:this.props.vticon.duration, value:valueScale[0]}]));


		//current time vis
		//TODO: put this in a seperate location
		var currentTimeLineFunc = d3.svg.line()
								.x(function(d) {
									return d[0]
								})
								.y(function(d) {
									return d[1]
								});
		var currentTimePath = currentTimeLineFunc([
						[scaleX(this.props.currentTime), 0],
						[scaleX(this.props.currentTime), height]	
				]);

		var keyframeCallback = this._onMouseDownKeyframe;


		//selection square
		var selectionSquare = <rect />;
		if(this.props.selection.active) {
			var tLeft = this.props.selection.time1;
			var tRight = this.props.selection.time2;
			if(tLeft > tRight) {
				tLeft = this.props.selection.time2;
				tRight = this.props.selection.time1;
			}

			var vTop = this.props.selection.parameters[this.props.parameter].value1;
			var vBottom = this.props.selection.parameters[this.props.parameter].value2;
			if(vTop < vBottom) {
				vTop = this.props.selection.parameters[this.props.parameter].value2;
				vBottom = this.props.selection.parameters[this.props.parameter].value1;
			
			}
			



			var x = scaleX(tLeft);
			var y = scaleY(vTop);
			var width = scaleX(tRight) - x;
			var height = scaleY(vBottom) - y;

			selectionSquare = <rect
				x={x}
				y={y} 
				width={width}
				height={height}
				fill={this.props.selectionColor}
				opacity={this.props.selectionOpacity} />
		}

		return (
				<div ref="divWrapper" style={divStyle}>
					<svg  width="100%" height="100%" onMouseDown={this._onMouseDown}>
						<path
							d={fillPath}
							fill="#FFDDAD"
							stroke="#FFDDAD">
						</path>

						{data.map(function(d)
							{
								return (
									<circle cx={scaleX(d.t)} cy={scaleY(d.value)} r={keyframeCircleRadius} onMouseDown={keyframeCallback} data-id={d.id} fill={d.selected ? selectedCircleColor : circleColor}>
									</circle>
									);

							})
						}

						{selectionSquare}
						
						<path stroke={this.props.playheadFill} strokeWidth="2" fill="none" d={currentTimePath} />

					</svg>
				</div>
			);
	},


	/**
	* UI Callbacks
	*/
	_onMouseDown(e) {
		var keyframeCircleRadius = this.props.keyframeCircleRadius;

		var valueScale = this.props.vticon.parameters[this.props.parameter].valueScale;

        var scaleY = this.state.scales.scaleParameter[this.props.parameter];

        var x = e.clientX - this.state.offsetLeft;
        var y = e.clientY - this.state.offsetTop;


        VTIconStore.actions.newKeyframe(this.props.parameter, this.props.scaleX.invert(x), scaleY.invert(y), e.shiftKey);
	},

	_onMouseDownKeyframe(e) {
		var id = parseInt(e.target.getAttribute("data-id"));
		if(e.shiftKey) {
			VTIconStore.actions.addToggleSelectedKeyframe(id);
		} else {
			VTIconStore.actions.selectKeyframe(id);
			DragStore.actions.startKeyframeDrag();
		}
		return false;
	}



});

module.exports = KeyframeEditor;