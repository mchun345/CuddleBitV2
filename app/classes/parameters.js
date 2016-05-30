// Constructor
function Parameters() {
  // always initialize all instance properties
  // this.io = io;
  // this.baz = 'baz'; // default value
  this.parameters = {
  							amplitude: {
								valueScale:[0,1], //normalized
								data : [
									{ id: 0, t: 1500, value:0.5, selected:false}],
								fun: function(out,paramvalue){
									return out
								},
							},

							frequency: {
								valueScale:[50,500], //Hz
								data : [
									{ id: 1, t: 1500, value:300, selected:false}],
								fun: function(out,paramvalue){
									return out
								},
							},
							
							position : {
								valueScale:[0,1], //normalized
								data : [
									{ id: 4, t: 1500, value:0.5, selected:false}],
								fun: function(out,paramvalue){
									return paramvalue
								}
							},
							maxValue : {
								valueScale:[0,5],
								data : [
									{id:6,t:1500,value:2.5, selected:false}],
								fun: function(out,paramvalue){
									if (out > paramvalue){
										return paramvalue
									}
									else{
										return out
									}
								}
							},
				}
 
}
// class methods
Parameters.prototype.getParameters = function() {
		return this.parameters;
};
Parameters.prototype.getParameterKeyArray = function() {
		return Object.keys(this.parameters);
};
Parameters.prototype.initParamsWith = function(val) {
		var ret = {}
		Object.keys(this.parameters).forEach(function(key){
			ret[key] = val
		})
		return ret;
};



// export the class
module.exports = Parameters;