// Constructor
function Parameters() {
  // always initialize all instance properties
  // this.io = io;
  // this.baz = 'baz'; // default value
 
}
// class methods
Parameters.prototype.getParameters = function() {
	 var parameters = {
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
		return parameters;
};

// export the class
module.exports = Parameters;



// import Reflux from 'reflux';


// // recursive function to clone an object. If a non object parameter
// // is passed in, that parameter is returned and no recursion occurs.
// function deepCopy(obj) {
//     if (obj === null || typeof obj !== 'object') {
//         return obj;
//     }
//     var temp = obj.constructor(); // give temp the original obj's constructor
//     for (var key in obj) {
//         temp[key] = deepCopy(obj[key]);
//     }
 
//     return temp;
// }

// var parameterActions = Reflux.createActions(
// 	[
// 		'getParameters'
// 	]
// );

// var parameterStore = Reflux.createStore({

// 	listenables:[parameterActions],

// 	init: function() {

// 		this._data = {
// 							amplitude: {
// 								valueScale:[0,1], //normalized
// 								data : [
// 									{ id: 0, t: 1500, value:0.5, selected:false}]
// 							},

// 							frequency: {
// 								valueScale:[50,500], //Hz
// 								data : [
// 									{ id: 1, t: 1500, value:300, selected:false}]
// 							},
// 							ampTex: {
// 								valueScale:[0,1], //normalized
// 								data : [
// 									{ id: 2, t: 1500, value:0.5, selected:false}]
// 							},
// 							freqTex: {
// 								valueScale:[10,50], //Hz
// 								data : [
// 									{ id: 3, t: 1500, value:25, selected:false}]
// 							},

// 							bias: {
// 								valueScale:[0.10,0.90], //normalized
// 								data : [
// 									{ id: 4, t: 1500, value:0.5, selected:false}]
// 							},
// 							position : {
// 								valueScale:[0,1], //normalized
// 								data : [
// 									{ id: 4, t: 1500, value:0.5, selected:false}]
// 							},
// 		};
// 	},
// 	getInitialState() {
// 		return this._data;
// 	},

// 	onGetParameters() {
// 		return deepCopy(this._data);
// 	}

// });


// module.exports = {
// 	store: parameterStore,
// 	actions: parameterActions
// };
