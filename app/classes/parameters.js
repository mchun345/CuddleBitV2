// Constructor
function Parameters() {
  // always initialize all instance properties
  // this.io = io;
  // this.baz = 'baz'; // default value
  this.parameters = {
  							amplitude: {
								valueScale:[0,1], //normalized
								data : [
									{ id: 0, t: 1500, value:0.5, selected:false}]
							},

							frequency: {
								valueScale:[50,500], //Hz
								data : [
									{ id: 1, t: 1500, value:300, selected:false}]
							},
							ampTex: {
								valueScale:[0,1], //normalized
								data : [
									{ id: 2, t: 1500, value:0.5, selected:false}]
							},
							freqTex: {
								valueScale:[10,50], //Hz
								data : [
									{ id: 3, t: 1500, value:25, selected:false}]
							},

							bias: {
								valueScale:[0.10,0.90], //normalized
								data : [
									{ id: 4, t: 1500, value:0.5, selected:false}]
							},
							position : {
								valueScale:[0,1], //normalized
								data : [
									{ id: 4, t: 1500, value:0.5, selected:false}]
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