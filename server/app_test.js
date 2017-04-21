var list = require('./model/todolist.js');
var express = require('express');
var app = express();
 list.allList(1).then((data) => {
    console.log(data);
 })
app.get('/', function (req, res) {

   res.send('Hello World');
})

app.get('/api/test', function(req, res){
    res.send('this is test api');
});
// api with param
app.get('/api/list/:id', function(req, res){
    console.log('this is api with param');
});
var server = app.listen(8081, function () {
 
  var host = server.address().address
  var port = server.address().port
 
  console.log("应用实例，访问地址为 http://%s:%s", host, port)
 
})