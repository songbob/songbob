var express = require('express');

var app = express();

/*
 * index 없이 할때, 서버->클라이언트 루트찾아주기,
 * app.get('/', function(req, res){
	res.send('Git Success?');
});*/

/*
 * __dirname <- 경로 path
 * app.use(express.static(__dirname + '/public'));
console.log(__dirname);*/

/*
 * path를 변수에 저장하여 경로 설정 <- 장점은 /public, public, public/등등 가능
 * var path = require('path');
app.use(express.static(path.join(__dirname, 'public')));
console.log(__dirname);*/

var path = require('path');
app.set("view engine", 'ejs');
app.use(express.static(path.join(__dirname, 'public')));

var data={count:0};
app.get('/', function(req,res){
	data.count++;
	res.render('my_first_ejs', data);
});
app.get('/reset', function(req,res){
	data.count=0;
	res.render('my_first_ejs', data);
});
app.get('/set/count', function(req,res){
	if(req.query.count) data.count=req.query.count;
	res.render('my_first_ejs', data);
});
app.get('/set/:num', function(req,res){
	data.count=req.params.num;
	res.render('my_first_ejs', data);
});

app.listen(3000, function(){
	console.log('Server On!');
});