var mongoose = require("mongoose");
mongoose.connect('mongodb://localhost/fanblog');
mongoose.Promise = global.Promise;

module.exports = mongoose;
//var Schema = mongoose.Schema;

