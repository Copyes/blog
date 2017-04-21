const db = require('../config/db.js');
const todoListModel = require('../schema/list.js');
const TodoListDb = db.TodoList;
const TodoList = TodoListDb.import(todoListModel);
console.log(TodoList);
const todolist = TodoList.sync();

exports.allList = function(id){
    return todolist.findAll({
        where: {
            user_id: 1
        }
    })
}
//const TodoListDb = db.TodoList;
// 任务列表
//const TodoList = TodoListDb.import(todoListModel);

// const todolist = TodoList.findAll({
//     where: {
//         user_id: 1
//     }
// });

//console.log(todolist);
//查看任务
//const getTodoListById