// import modules
var express = require('express');
var app = express();
var path = require('path');
var mongoose = require('mongoose');
var bodyParser = require('body-parser');

/*
 *  DB connect 부분(시스템_환경변수로 path설정전 연결)
 *  이렇게 할 때 github에 free로 공유되어 db를 남이 건드릴 수 있음
var mongoose = require('mongoose');
mongoose.connect("mongodb://master:*alpha6168@ds049945.mlab.com:49945/songbob");
*/

// connect database
mongoose.connect(process.env.MONGO_DB);
var db = mongoose.connection;
db.once("open", function(){
	console.log("DB connection!");
});
db.on("error", function(err){
	console.log("DB ERROR : ", err);
});

/*
 * 몽고db 컬럼만들기 & 컬럼이 없으면 만들어주기
 * var dataSchema = mongoose.Schema({
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
});*/

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

//model setting
var postSchema = mongoose.Schema({
	title : {type:String, required:true},
	body : {type:String, required:true},
	createdAt : {type:Date, default:Date.now},
	updatedAt : Date
});
var Post = mongoose.model('post', postSchema);

//view setting
app.set("view engine", 'ejs');

//set middlewares
app.use(express.static(path.join(__dirname, 'public')));
app.use(bodyParser.json());

//set routes
app.get('/posts', function(req,res) {
	Post.find({}).sort('-createdAt').exec(function(err,posts){
		if(err) return res.json({success:false, message:err});
		res.render("posts/index", {data:posts});
	});
}); //index
app.post('/posts', function(req,res){
	Post.create(req.body.post, function(err,post){
		if(err) return res.json({success:false, message:err});
		res.json({success:true, data:post});
	});
}); //create
app.get('/posts/:id', function(req,res){
	Post.findById(req.params.id, function(err,post){
		if(err) return res.json({success:false, message:err});
		res.json({success:true, data:post});
	});
}); //show
app.put('/posts/:id', function(req,res){
		req.body.post.updatedAt=Date.now();
		Post.findByIdAndUpdate(req.params.id, req.body.post, function(err,post){
		if(err) return res.json({success:false, message:err});
		res.json({success:true, message:post._id+" updated"});
	});
}); //update
app.delete('/posts/:id', function(req,res){
	Post.findByIdAndRemove(req.params.id, function(err,post){
		if(err) return res.json({success:false, message:err});
		res.json({success:true, message:post._id+" deleted"});
	});
}); //destroy

/*
 * get방식으로 최상의 루트(/)로 접근시 req & res 설정
 * var data={count:0};
app.get('/', function(req,res){
	data.count++;
	res.render('my_first_ejs', data);
});*/

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

/*
 * setCounter & getCounter 함수 사용하여 mongoDB로
 * count 증가 및 초기화 저장하여 연산
 * app.get('/', function(req,res){
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
}*/

//start server
app.listen(3000, function(){
	console.log('Server On!');
});

/*
 *  REST client를 사용하여 데이터 다수 생성
 *{
    "post":[{
        "title":"Test Title 1",
        "body" :"Test Body 1"
    },
    {
        "title":"Test Title 2",
        "body" :"Test Body 2"
    },
    {
        "title":"Test Title 3",
        "body" :"Test Body 3"
    }
    ]
}*/