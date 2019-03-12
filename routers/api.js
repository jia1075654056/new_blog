var express = require('express');
var User = require('../models/User');
var Content = require('../models/Content');
var router = express.Router();

var responseData;

router.use(function(req, res, next) {
    responseData = {
        code : 0,
        message : ''
    }
    next();
});

/*登录*/
router.post('/user/login', function(req, res, next){
    var username = req.body.username;
    var password = req.body.password;

    if( username == '' || password == ''){
        responseData.code = 1;
        responseData.message = '用户名与密码不能为空';
        res.json(responseData);
        return;
    }
    //判断用户与密码是否一致
    User.findOne({
        username: username,
        password: password
    }).then(function( userInfo ){
        if( !userInfo ){
            responseData.code = 2;
            responseData.message = '用户或密码错误';
            res.json(responseData);
            return;
        }
        //用户密码正确
        responseData.message = '登录成功';
        responseData.userInfo = {
            _id: userInfo._id,
            username: userInfo.username
        };
        req.cookies.set('userInfo', JSON.stringify({
            _id: userInfo._id,
            username: userInfo.username
        }));
        res.json(responseData);
        return;
    })

})

/*退出*/
router.get('/user/logout', function(req, res){
    req.cookies.set('userInfo', null);
    res.json(responseData);
});

/*注册*/
router.post('/user/register', function(req, res, next) {
    var username = req.body.username;
    var password = req.body.password;
    var repassword = req.body.repassword;
    //用户是否为空
    if (username == '') {
        responseData.code = 1;
        responseData.message = '名字不能为空';
        res.json(responseData);
        return;
    }
    //密码不能为空
    if (password == '') {
        responseData.code = 2;
        responseData.message = '密码不能为空';
        res.json(responseData);
        return;
    }
    //密码不能为空
    if (repassword == '') {
        responseData.code = 3;
        responseData.message = '密码不能为空';
        res.json(responseData);
        return;
    }
    //两次输入密码不一致
    if (repassword != password) {
        responseData.code = 4;
        responseData.message = '两次密码输入不一致';
        res.json(responseData);
        return;
    }
    //判断用户是否已经注册
    User.findOne({
        username: username
    }).then(function( userInfo ){
        if( userInfo ){
            responseData.code = 5;
            responseData.message = '用户已被注册';
            res.json(responseData);
            return;
        };
        var user = new User({
            username: username,
            password: password
        });
        return user.save();
    }).then(function( newUserInfo ){
        console.log( newUserInfo );
        responseData.message = '注册成功';
        res.json(responseData);
    });
//        console.log( req.body );
 });

/*获取指定文章评论*/
router.get('/comment',function(req, res){
    var contentId = req.query.contentid || '';
    Content.findOne({
        _id: contentId
    }).then(function(content){
        responseData.data = content.comments;
        res.json(responseData);
    })
});

/*评论提交*/
router.post('/comment/post', function(req, res, next){
    //内容的id
    var contentId = req.body.contentid || '';
    var postData = {
        username: req.userInfo.username,
        postTime: new Date(),
        content: req.body.content
    }
    //查询当前这篇内容的信息
    Content.findOne({
        _id: contentId
    }).then(function(content){
        content.comments.push(postData);
        return content.save();
    }).then(function(newContent){
        responseData.message = '评论成功';
        responseData.data = newContent;
        res.json(responseData);
    });
});

module.exports = router;