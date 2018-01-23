var express=require('express');
var router=express.Router();
var bodyParser=require('body-parser');
var mongoose=require('mongoose');
var User=require('../models/userModel')
var fs=require('fs');
router.use(bodyParser.json());

router.route('/')
.get(function(req,res,next){
    if(req.session && req.session.user)
        res.redirect('/');
    else
        res.render('signup',{
            title : "sign up",
            loggedin : false,
            msg : ''
        });
})
.post(function(req,res,next){
    console.log('is it working');
    // var db = req.db;
    // var collection = db.get('users');
    // collection.insert(req.body, function(err, result){
    //     if(err) throw err;
    //     console.log(result);
    //     res.redirect('/successfull-registration');
    // });

    User(req.body).validate(function(err){
        if(err) {
            var str='';
            if(err.toString().indexOf('firstname')!=-1)
                str+='<li class="form-text text-danger">Fill in your firstname </li>';
            if(err.toString().indexOf('lastname')!=-1)
                str+='<li class="form-text text-danger">Fill in your lastname </li>';
            if(err.toString().indexOf('`username` is required')!=-1)
                str+='<li class="form-text text-danger">Fill in your username </li>';
            if(err.toString().indexOf('`username` to be unique')!=-1)
                str+='<li class="form-text text-danger">username is already registered </li>';
            if(err.toString().indexOf('`email` is required')!=-1)
                str+='<li class="form-text text-danger">Fill in your email </li>';
            if(err.toString().indexOf('`email` to be unique')!=-1)
                str+='<li class="form-text text-danger">email is already registered </li>';
            if(err.toString().indexOf('invalid email address')!=-1)
                str+='<li class="form-text text-danger">invalid email </li>';
            if(err.toString().indexOf('`password` is required')!=-1)
                str+='<li class="form-text text-danger">Fill in your password </li>';
            if(err.toString().indexOf('minimum allowed length')!=-1)
                str+='<li class="form-text text-danger">minimum password length should be 8</li>';
            res.render('signup',{msg:str});
        }
        else{
            User.create(req.body, function(err, result){
                if(err) throw err;
                else{
                    console.log(result);
                    var dir='./public/images/'+result.username;
                    if (!fs.existsSync(dir)){
                        fs.mkdirSync(dir);
                    }
                    req.session.user=result;
                    delete req.session.user.password;
                    res.redirect('/');
                }
            });
        }
    });
});

module.exports = router;