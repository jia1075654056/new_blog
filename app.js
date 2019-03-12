var express = require('express');
var mongoose = require('mongoose');
var bodyParser = require('body-parser');
var Cookies = require('cookies');
var path = require('path');
var swig = require('swig');
var User = require('./models/User');
var app = express();

//设置模板引擎
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'html');
app.engine('html',swig.renderFile);
swig.setDefaults({cache: false});

//设置cookie
app.use(function(req, res, next){
    req.cookies = new Cookies(req, res);
    req.userInfo = {};
    //解析登录用户cookie信息
    if( req.cookies.get('userInfo') ){
        try{
            req.userInfo = JSON.parse( req.cookies.get('userInfo'));

            //获取登录用户的类型，是否为管理员
            User.findById(req.userInfo._id).then(function( userInfo ){
                req.userInfo.isAdmin = Boolean( userInfo.isAdmin );
                next();
            })
        }catch (e){
            next();
        }
    } else{
        next();
    }
});
//设置bodyParser
app.use( bodyParser.urlencoded({extended: true}) );
//设置文件静态托管
app.use('/public',express.static(__dirname + '/public'));

//划分不同模块
app.use('/', require('./routers/main'));
app.use('/api', require('./routers/api'));
app.use('/admin', require('./routers/admin'));


/*app.get('/', function(req, res, next){
    res.render('index');
});*/

// catch 404 and forward to error handler
mongoose.connect('mongodb://localhost:27018/blog2', function(err){
    if(err){
        console.log('failed');
    } else
        console.log('success');
        app.listen(8081);
})

module.exports = app;
