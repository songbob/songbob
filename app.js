// import modules
var express = require('express');
var app = express();
var path = require('path');
var mongoose = require('mongoose');
var bodyParser = require('body-parser');
var methodOverride = require('method-override');
var passport = require('passport');
var session = require('express-session');
var flash = require('connect-flash');
var async = require('async');
var LocalStrategy = require('passport-local').Strategy;

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

var userSchema = mongoose.Schema({
	email : {type:String, required:true, unique:true},
	nikname : {type:String, required:true, unique:true},
	password : {type:String, required:true},
	createAt : {type:Date, default:Date.now}
});
var User = mongoose.model('user', userSchema);


//view setting
app.set("view engine", 'ejs');

//set middlewares
app.use(express.static(path.join(__dirname, 'public')));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended:true}));
app.use(methodOverride("_method"));
app.use(flash());

app.use(session({secret:'MySecret'}));
app.use(passport.initialize());
app.use(passport.session());

passport.serializeUser(function(user, done){
	done(null, user.id);
});
passport.deserializeUser(function(id, done){
	User.findById(id, function(err, user){
		done(err, user);
	});
});

passport.use('local-login',
		new LocalStrategy({
			usernameField : 'email',
			passwordField : 'password',
			passReqToCallback : true
		},
		function(req, email, password, done){
			User.findOne({'email':email}, function(err, user){
				if(err) return done(err);
				
				if (!user){
					req.flash("email", req.body.email);
					return done(null, false, req.flash('loginError', 'No user found.'));
				}
				if(user.password != password){
					req.flash("email", req.body.email);
					return done(null, false, req.flash('loginError', 'Password dose not Match.'));
				}
				return done(null, user);
			});
		}
	)
);

//set routes
//login
app.get('/', function(req, res){
	res.redirect('/posts');
});
app.get('/login', function(req,res){
	res.render('login/login', {email:req.flash("email")[0], loginError:req.flash('loginError')})
});
app.post('/login',
		function(req, res, next){
	req.flash("email"); // flush email data
	if(req.body.email.length === 0 || req.body.password.length === 0){
		req.flash("email", req.body.email);
		req.flash("loginError", "Please enter both email and psaaword.");
		res.redirect('/login');
		}else{
			next();
		}
	}, passport.authenticate('local-login', {
		successRedirect : '/posts',
		failureRedirect : '/login',
		failureFlash : true
	})
);
app.get('/logout', function(req,res){
	req.logout();
	res.redirect('/');
});
app.get('/users/new', function(req,res){
	  res.render("users/new", {
          formData: req.flash('formData')[0],
          emailError: req.flash('emailError')[0],
          nicknameError: req.flash('nicknameError')[0],
          passwordError: req.flash('passwordError')[0]
        }
);
}); // new
app.post('/users', checkUserRegValidation, function(req, res, next){
	User.create(req.body.user, function(err, user){
		if(err) return res.json({success:false, message:err});
		res.redirect('/login');
	});
}); //create
app.get('/users/:id', function(req,res){
	User.findById(req.params.id, function(err, user){
		if(err) return res.json({success:false, message:err});
	});
}); //show
app.get('/users/:id/edit', function(req, res){
	User.findById(req.params.id, function(err, user){
		if(err) return res.json({success:false, message:err});
		res.render("users/edit", {
				user : user,
				formData : req.flash('formData')[0],
				emailError : req.flash('emailError')[0],
				nicknameError : req.flash('nicknameError')[0],
				passwordError : req.flash('passwordError')[0]
			}
		);
	});
}); //edit
app.put('/users/:id', checkUserRegValidation, function(req, res){
	User.findById(req.params.id, req.body.user, function(err,user){
		if(err) return res.json({success:"false", message:err});
		if(req.body.user.password == user.password){
			if(req.body.user.newPassword){
				req.body.user.password = req.body.user.newPassword;
			}else{
				delete req.body.user.password;
			}
			User.findByIdAndUpdate(req.params.id, req.body.user, function(err,user){
				if(err) return res.json({success:"false", message:err});
				res.redirect('/users/'+req.params.id);
			});
		}else{
			req.flash("formData", req.body.user);
			req.flash("passwordError", "- Invalid password");
			res.redirect('/users/'+req.params.id+"/edit");
		}
	});
}); //update

//게시판
app.get('/posts', function(req,res) {
	Post.find({}).sort('-createdAt').exec(function(err,posts){
		if(err) return res.json({success:false, message:err});
		res.render("posts/index", {data:posts, user:req.user});
	});
}); //index
app.get('/posts/new', function(req,res){
	res.render("posts/new");
}); //new
app.post('/posts', function(req,res){
	Post.create(req.body.post, function(err,post){
		if(err) return res.json({success:false, message:err});
		/*res.json({success:true, data:post});*/
		res.redirect('/posts');
	});
}); //create
app.get('/posts/:id', function(req,res){
	Post.findById(req.params.id, function(err,post){
		if(err) return res.json({success:false, message:err});
		/*res.json({success:true, data:post});*/
		res.render("posts/show", {data:post});
	});
}); //show
app.get('/posts/:id/edit', function(req,res){
	Post.findById(req.params.id, function(err,post){
		if(err) return res.json({success:false, message:err});
		res.render("posts/edit", {data:post});
	});
}); //edit
app.put('/posts/:id', function(req,res){
		req.body.post.updatedAt=Date.now();
		Post.findByIdAndUpdate(req.params.id, req.body.post, function(err,post){
		if(err) return res.json({success:false, message:err});
		/*res.json({success:true, message:post._id+" updated"});*/
		res.redirect('/posts/'+req.params.id);
	});
}); //update
app.delete('/posts/:id', function(req,res){
	Post.findByIdAndRemove(req.params.id, function(err,post){
		if(err) return res.json({success:false, message:err});
		/*res.json({success:true, message:post._id+" deleted"});*/
		res.redirect('/posts');
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

//functions
function checkUserRegValidation(req, res, next){
	var isValid = true;
	
	async.waterfall(
		[function(callback){
			User.findOne({email : req.body.user.email, _id : {$ne : mongoose.Types.ObjectId(req.params.id)}},
				function(err, user){
				if(user){
					isValid = false;
					req.flash("emailError", "- This email is already resistered.");
				}
				callback(null, isValid);
			}
		);
	}, function(isValid, callback){
		User.findOne({nickname : req.body.user.nickname, _id : {$ne : mongoose.Types.ObjectId(req.params.id)}},
				function(err, user){
					if(user){
						isValid = false;
						req.flash("nicknameError", "- This nickname is already resistered.");
					}
					callback(null, isValid);
		}
	);
}], function(err, isValid){
			if(err) return res.json({success:"false", message:err});
			if(isValid){
				return next();
			}else{
				req.flash("formData", req.body.user);
				res.redirect("back");
			}
		}
	);
}

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