var express = require('express');

var app = express();

/*app.get('/', function(req, res){
	res.send('Git Success?');
});*/

/*app.use(express.static(__dirname + '/public'));
console.log(__dirname);*/

var path = require('path');
app.use(express.static(path.join(__dirname, 'public')));
console.log(__dirname);

app.listen(3000, function(){
	console.log('Server On!');
});