var express = require('express');
var router = express.Router();
var bodyParser=require('body-parser');
var User = require('../models/userModel');
var passport=require('passport');
var LocalStrategy=require('passport-local').Strategy;

router.use(bodyParser.json());
router.route('/')
.get(function(req, res, next) {
  if(req.session && req.session.user)
    res.redirect('/');
  else
    res.render('signin', { 
      title: ['shatabdi','Express'],
      loggedin : false,
      msg: '' });
})
.post(function(req, res, next) {
  console.log(req.body.email+' '+req.body.password);
  User.findOne({email:req.body.email},function(err,user){
    if(err){
      console.log(err);
      res.render('signin', {msg: '<li> some error</li>'});
    }
    else if(!user){
      res.render('signin', {msg: '<li class="form-text text-danger">username not found</li>'});
    }
    else if(req.body.password!=user.password){
      res.render('signin', {msg: '<li class="form-text text-danger">password is wrong</li>'});
    }
    else{
      req.session.user = user;
      delete req.session.user.password;
      console.log(user.username);
      res.redirect('/');
      // });
    }
  })
});

module.exports = router;
