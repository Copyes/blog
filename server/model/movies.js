const db = require('../config/db.js');
const moviesModel = require('../schema/movies.js');
// todolist 数据库
const TodoListDb = db.TodoList;
// movies 这个表
const Movies = TodoListDb.import(moviesModel);
