var express = require('express');
var path = require('path');
var fs = require('fs');
var app = express();

app.get('/', function(req, res) {
  fs.readFile(__dirname + '/dist/index.html', 'utf8', function(error, html){
    res.send(html);
  });
});

app.use(express.static(path.join(__dirname, 'dist')));
app.use('js/vendor/*', express.static(path.join(__dirname, 'dist/js/vendor')));

var server = app.listen(process.env.PORT || 3000, function() {
  console.log("Express server listening on port %d in %s mode", server.address().port, app.settings.env);
});
