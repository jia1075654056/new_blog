var express = require('express');
var router = express.Router();
var User = require('../models/User');
var Category = require('../models/Category');
var Content = require('../models/Content');


router.use(function(req, res, next){
    if( !req.userInfo.isAdmin ){
        //如果非管理员
        res.send('权限不够');
        return;
    }
    next();
});
/*首页*/
router.get('', function(req, res, next) {
    res.render('admin/index', {
        userInfo: req.userInfo
    });
});
/*用户管理*/
router.get('/user', function(req, res, next) {
    /*从数据库中读取所有用户记录*/
    var page = Number(req.query.page || 1);
    var limit = 10;
    User.count().then(function(count){
        //计算总页数
        pages = Math.ceil(count/limit);
        //取值不能超过pages
        page = Math.min( page, pages );
        //取值不能小于1
        page = Math.max( page, 1 );
        var skip = (page - 1) * limit;
        User.find().limit(limit).skip(skip).then(function( users ){
            res.render('admin/user_index', {
                userInfo: req.userInfo,
                users: users,

                count: count,
                pages: pages,
                limit: limit,
                page: page


            });
        });
    });
});
/*分类首页*/
router.get('/category',function(req, res, next){

    var page = Number(req.query.page || 1);
    var limit = 10;
    Category.count().then(function(count){
        //计算总页数
        pages = Math.ceil(count/limit);
        //取值不能超过pages
        page = Math.min( page, pages );
        //取值不能小于1
        page = Math.max( page, 1 );
        var skip = (page - 1) * limit;

        Category.find().sort({_id:-1}).limit(limit).skip(skip).then(function( categories ){
            res.render('admin/category_index', {
                userInfo: req.userInfo,
                categories: categories,

                count: count,
                pages: pages,
                limit: limit,
                page: page
            });
        });
    });
});
/*分类添加*/
router.get('/category/add', function(req, res, next){

    res.render('admin/category_add', {
        userInfo: req.userInfo
    })
});
/*分类修改*/
router.get('/category/edit',function (req, res, next){
    //获取要修改的分类信息,并且用表单的形式显示出来
    var id = req.query.id||'';
    //获取要修改的分类信息
    Category.findOne({_id:id}).then(function(category){
        if( !category ){
            res.render('admin/error',{
                userInfo: req.userInfo,
                message: '分类不存在'
            });
        } else{
            res.render('admin/category_edit',{
                userInfo: req.userInfo,
                category: category
            });
        }
    });
});
/*分类删除*/
router.get('/category/edit', function(req, res, next) {
    res.render('admin/category_add', {
        userInfo: req.userInfo
    });
});
/*分类修改保存*/
router.post('/category/edit',function(req, res, next){
    //获取要修改的分类
    var id = req.query.id ||'';
    var name = req.body.name ||'';

    //获取要修改的分类信息
    Category.findOne({_id:id}).then(function(category){
        console.log(category);
        if(!category){
            res.render('admin/error',{
                userInfo: req.userInfo,
                message: '分类不存在'
            });
            return Promise.reject();
        } else {
            //当用户没有做任何修改时
            if( name == category.name ){
                res.render('admin/success',{
                    userInfo:req.userInfo,
                    message:'修改成功',
                    url:'/admin/category'
                });
                return Promise.reject();
            }else{
                //要修改的分类名称是否存在
                return Category.findOne({
                    _id: {$ne:id},//id不同
                    name: name
                }).then(function(sameCategory){
                    if(sameCategory){
                        res.render('admin/error',{
                            userInfo :req.userInfo,
                            message: '数据库中已经存在同名分类'
                        });
                        return Promise.reject();
                    }else{
                        return Category.update({
                            _id: id
                        },{
                            name: name
                        });
                    }
                }).then(function(){
                    res.render('admin/success',{
                        userInfo: req.userInfo,
                        message: '修改成功',
                        url: '/admin/category'
                    });
                });
            }
        }
    });
});
/*分类删除*/
router.get('/category/delete', function(req, res, next){
    //获取要删除的分类id
    var id = req.query.id||'';
    Category.remove({_id:id}).then(function(){
        res.render('admin/success',{
            userInfo: req.userInfo,
            message: '删除成功',
            url: '/admin/category'
        });
    });
});
/*分类保存*/
router.post('/category/add',function(req, res, next){
    var name =req.body.name||'';
    if(name==''){
        res.render('admin/error',{
            userInfo:req.userInfo,
            message:'名称不能为空'
        });
        return;
    }
    //数据库中是否已有该分类
    Category.findOne({name:name}).then(function(rs){
        if(rs){
            // 数据库中已经存在该分类
            res.render('admin/error',{
                userInfo:req.userInfo,
                message:'分类已经存在'
            });
            return Promise.reject();
        }else{
            //数据库中不存在,可以保存
            return new Category({
                name:name
            }).save();
        }
    }).then(function(newCategory){
        res.render('admin/success',{
            userInfo:req.userInfo,
            message:'分类保存成功',
            url:'/admin/category'
        });
    });

});
/*内容首页*/
router.get('/content',function(req, res, next){
    var page = Number(req.query.page || 1);
    var limit = 10;
    var pages = 0;
    Content.count().then(function(count){
        //计算总页数
        pages = Math.ceil(count/limit);
        //取值不能超过pages
        page = Math.min(page,pages);
        //取值不能小于1
        page = Math.max(page,1);
        var skip = (page - 1) * limit;
        Content.find().limit(limit).skip(skip).populate(['category','user']).sort({
            addTime: -1
        }).then(function(contents){
            res.render('admin/content_index', {
                userInfo: req.userInfo,
                contents: contents,
                count: count,
                pages: pages,
                limit: limit,
                page: page,
                rou: 'content'
            });
        });
    });
});
/*内容添加页面*/
router.get('/content/add', function(req, res, next){

    Category.find().sort({_id:-1}).then(function( categories ){
        res.render('admin/content_add',{
            userInfo: req.userInfo,
            categories: categories
        });
    })
});
/*内容保存*/
router.post('/content/add',function(req, res, next){
    var category = req.body.category;
    var title = req.body.title;
    var description = req.body.description;
    var content = req.body.content;
    var user = req.userInfo._id.toString();
    if( req.body.category == ''){
        res.render('admin/error', {
            userInfo: req.userInfo,
            message: '内容分类不能为空'
        });
        return;
    }
    if(req.body.title == ''){
        res.render('admin/error', {
            userInfo:req.userInfo,
            message:'内容标题不能为空'
        });
        return;
    }
    //保存数据到数据库
    new Content({
        category: req.body.category,
        title: req.body.title,
        user: req.userInfo._id.toString(),
        description: req.body.description,
        content: req.body.content
    }).save().then(function( rs ){
        res.render('admin/success', {
            userInfo: req.userInfo,
            message: '内容保存成功',
            url: '/admin/content'
        });
    });

});
/*内容修改*/
router.get('/content/edit',function(req,res){
    var id = req.query.id || '';
    var categories = [];
    Category.find().sort({_id:1}).then(function(rs){
        categories = rs;
        return Content.findOne({_id:id}).populate('category');
    }).then(function(content){
        if(!content){
            res.render('admin/error',{
                userInfo: req.userInfo,
                message: "内容不存在"
            });
            return Promise.reject();
        }else{
            res.render('admin/content_edit',{
                userInfo: req.userInfo,
                content: content,
                categories: categories
            });
        }
    });
});
/*内容修改的保存*/
router.post('/content/edit',function(req, res, next){
    var id = req.query.id || '';
    var category = req.body.category;
    var title = req.body.title;
    var description = req.body.description;
    var content = req.body.content;
    if(req.body.category == ''){
        res.render('admin/error', {
            userInfo: req.userInfo,
            message: '内容分类不能为空'
        });
        return;
    }
    if(req.body.title == ''){
        res.render('admin/error',{
            userInfo: req.userInfo,
            message: '内容标题不能为空'
        });
        return;
    }
    Content.update({
        _id: id//保存条件
    },{
        category: req.body.category,
        title: req.body.title,
        description: req.body.description,
        content: req.body.content
    }).then(function(){
        res.render('admin/success', {
            userInfo: req.userInfo,
            message: '内容保存成功',
            url:'/admin/content'
        });
    });
});
/*内容的删除*/
router.get('/content/delete',function(req, res, next){
    //获取要删除的分类id
    var id = req.query.id || '';
    Content.remove({_id:id}).then(function(){
        res.render('admin/success', {
            userInfo: req.userInfo,
            message: '删除成功',
            url: '/admin/content'
        });
    });
});

module.exports = router;
