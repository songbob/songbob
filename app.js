var express = require('express');
var app = express();
/*
 *  DB connect 부분(시스템_환경변수로 path설정전 연결)
 *  이렇게 할 때 github에 free로 공유되어 db를 남이 건드릴 수 있음
var mongoose = require('mongoose');
mongoose.connect("mongodb://master:*alpha6168@ds049945.mlab.com:49945/songbob");
*/
mongoose.connect(process.env.MONGO_DB);
var db = mongoose.connection;
db.once("open", function(){
	console.log("DB connection!");
});
db.on("error", function(err){
	console.log("DB ERROR : ", err);
});

var dataSchema = mongoose.Schema({
	name:String,
	count:Number
});
var Data = mongoose.model('data', dataSchema);
Data.findOne({name:"myData"}, function(err,data){
		if(err) return console.log("Data ERROR:", err);
		if(!data){
			Data.create({name:"myData", count:0}, function(err,data){
				if(err) return console.log("Data ERROR:", err);
				console.log("Counter initialized :", data);
		});
	}
});

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

/*
 * get방식으로 최상의 루트(/)로 접근시 req & res 설정
 * var data={count:0};
app.get('/', function(req,res){
	data.count++;
	res.render('my_first_ejs', data);
});*/

app.get('/', function(req,res){
	Data.findOne({name:"myData"}, function(err,data){
		if(err) return console.log("Data ERROR:",err);
		data.count++;
		data.save(function(err){
			if(err) return console.log("Data ERROR:",err);
			res.render('my_first_ejs',data);
		});
	});
});

app.get('/reset', function(req,res){
	setCounter(res,0);
});
app.get('/set/count', function(req,res){
	if(req.query.count) setCounter(res,req.query.count);
	else getCounter(res);
});
app.get('/set/:num', function(req,res){
	if(req.params.num) setCounter(res,req.params.num);
	else getCounter(res);
});
function setCounter(res,num){
	console.log("setCounter");
	Data.findOne({name:"myData"}, function(err,data){
		if(err) return console.log("Data ERROR:",err);
		data.count=num;
		data.save(function(err){
			if(err) return console.log("Data ERROR:",err);
			res.render('my_first_ejs', data);
		});
	});
}
function getCounter(res){
	console.log("getCounter");
	Data.findOne({name:"myData"}, function (err,data){
		if(err) return console.log("Data ERROR:", err);
		res.render('my_first_ejs', data);
	});
}

/*
 * setCounter & getCounter 함수 사용하기 전 get방식으로 session에
 * count 증가 및 초기화 저장하여 연산
 * app.get('/reset', function(req,res){
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
});*/

app.listen(3000, function(){
	console.log('Server On!');
});