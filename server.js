var express = require('express');

var app = module.exports = express();
app.use(express.static(__dirname + '/dist'));
app.use(require('prerender-node').set('prerenderToken', '4ztQuVgiXrpl9xeHr4MS'));
process.env.NODE_ENV = process.env.NODE_ENV || 'development';
console.log(process.env.NODE_ENV);
//app.use(require('prerender-node').set('prerenderServiceUrl', 'http://localhost:8081/'));
// This will ensure that all routing is handed over to AngularJS 
app.all('/*', function (req, res, next) {
    res.setHeader('Cache-Control', 'no-cache');
    // Just send the index.html for other files to support HTML5Mode
    res.sendFile('index.html', {
        root: __dirname + '/dist/'
    });
});
//app.get('*', function (req, res) {
//    res.sendfile('./public/index.html');
//});

app.listen(process.env.PORT || 5000);