const Sequelize = require('sequelize');
const TodoList = new Sequelize('mysql://root:123456@localhost/todolist', {
    define: {
        timestamps: false
    }
});
module.exports = {
    TodoList
}

// var mongoose = require("mongoose");
// mongoose.connect('mongodb://localhost/fanblog');
// mongoose.Promise = global.Promise;

// module.exports = mongoose;
//var Schema = mongoose.Schema;
