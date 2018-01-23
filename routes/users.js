var express = require('express');
var router = express.Router();
var mongoose = require('mongoose');
var User = require('../models/userModel');
var fs=require('fs');
var multer=require('multer');
var path=require('path');
var mkdirp=require('mkdirp');
var rimraf = require('rimraf');

var storage = multer.diskStorage({
  destination: function (req, file, cb) {
    // mkdirp('/public/images/ab', function (err) {
    //   if (err) console.error(err)
    //   else console.log('pow!')
    // });
    User.findOne({_id:req.session.user._id},function(err,user){
      if(err)
        console.log(err);
      else{
        cb(null, './public/images/'+user.username);
      }
    });
    
  },
  filename: function (req, file, cb) {
    User.findOne({_id:req.session.user._id},function(err,user){
      if(err)
        console.log(err);
      else{
        cb(null, user.username + '-' + Date.now());
      }
    });
  }
})
// var upload = multer({ dest: './public/images/',
//   rename: function (fieldname, filename) {
//     return filename;
//   },
// });
var upload=multer({storage: storage});

//GET user home page
router.get('/',function(req,res,next){

  // var db=req.db;
  // var collection=db.get('users');
  // collection.findOne({username: req.params.nickname},function(err,data){
  //   if(err) throw err;
  //   res.send(data.firstname+' '+data.lastname+' '+data.email);
  // });
    console.log(req.session.user.username);
    User.findOne({_id: req.session.user._id},function(err,user){
      if(err) throw err;
      var cur=user.currentPic;
      var src;
      // console.log(cur);
      if(cur!=null){
        src=cur.url;
      }
      else
        src='/images/placeholderProfile.png';
      res.render('loggedin',{
        title : "home page",
        user: user,
        loggedin : true,
        img: src,
      });
    });
  
});

//Upload Profile pic
router.post('/addprofilepic',upload.single('profileImg'),function(req,res,next){
  // User.profileImg.data=fs.readFileSync(req.body.profileImg);
  // newItem.img.contentType = 'image/png' || 'image/jpeg';
  // Uesr.save();
  // res.redirect('/users');
  var url=req.file.path;
  var url=url.substr(6,url.length-6);
  User.update({_id : req.session.user._id},{
    $push: {
        profilePic : {
        url: url,
        filename: req.file.filename,
      }
    }
  },function(err){
    if(err) console.log(err);
    else console.log(".....added to profilePic");
  });

  User.findOne({_id:req.session.user._id},function(err,user){
    if(err) console.log(err);
    else{
      User.update({_id:user._id},{$set:{currentPic : user.profilePic[user.profilePic.length-1]}},function(err){
        if(err) console.log(err);
        else console.log(".....changed to currentPic");
      });
    }
  });
  res.redirect('/users');
});

//Delete user account
router.get('/delete',function(req,res,next){
  User.remove({ _id : req.session.user._id },function(err,result){
    if(err) console.log(err);
    else console.log("successfully removed ! :)");
  })
  var dir = './public/images/'+req.session.user.username;
  rimraf( dir , function () { console.log('done'); });
  res.redirect('/logout');
})
module.exports = router;