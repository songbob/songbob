var express = require('express');

var app = express();

/*app.get('/', function(req, res){
	res.send('Git Success?');
});*/

app.use(express.static(__dirname + '/public'));
consol.log(__dirname);

app.listen(3000, function(){
	console.log('Server On!');
});