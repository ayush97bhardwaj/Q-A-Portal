var express = require('express');
var router = express.Router();
var mongoose = require('mongoose');
var User = require('../models/userModel');
var Ques=require('../models/quesModel');

var bodyParser=require('body-parser');
router.use(bodyParser.json());

router.route('/')
.get(function(req,res,next){
    if(req.session && req.session.user){
        // console.log(req.session.user);
        // console.log(req.user);

        User.findOne({_id:req.session.user._id},function(err,user){
            if(err)
                throw err;
            else{
                //updating the session user
                req.session.user=user;
                delete req.session.user.password;
                Ques.aggregate([{$project:{"likesToTime":{$divide:['$likes',10]}}}],function(err,result){
                    if(err) throw err;
                    else{
                        console.log(result);
                        result.forEach(element => {
                            console.log(element.likesToTime);
                            Ques.update({_id:element._id},{$set:{"likesToTime":element.likesToTime}},function(err,result2){
                                if(err) throw err;
                                else{
                                    console.log(result2);
                                }
                            });
                        });
                        // console.log(result);
                    }
                });
                Ques.find({}).sort({likesToTime:-1}).exec(function(err,result){
                    if(err) throw err;
                    else{
                        res.render('dashboard',{
                            title : "Dashboard",
                            user: req.session.user,
                            questions:result,
                            loggedin : true,
                        });
                    }
                });
            }
        });
    }
    else{
        // console.log("check if we got the profile : ");
        // console.log(req.session);
        // console.log(req.user);
        res.render('homepage',{
            title : "Home page",
            loggedin : false,
        });
    }
});

//...............x.....................x.....................x.............................x....................x...
function sesCheck(req,res,next){
    if(req.session && req.session.user)
      next();
    else
      res.redirect('/');
}
//profile page

router.route('/:username')
.get(sesCheck,function(req,res,next){

    User.findOne({username: req.params.username},function(err,user){
        if(err) 
            throw err;
        
        // var cur=user.currentPic;
        // var src;

        // //...Provides base image if no profile image is there
        // if(cur!=null){
        //     src=cur.url;
        // }
        // else
        //     src='/images/placeholderProfile.png';
        if(req.session.user._id == user._id){
            req.session.user=user;
            delete req.session.user.password;
        }

        Ques.find({username:req.params.username},function(err,questions){
            if(err) throw err;
            else{
                res.render('profile',{
                    title : req.params.username,
                    user: req.session.user,
                    user2: user,
                    questions:questions,
                    loggedin : true,
                });
            }
        });
        
    });

});

//.................x......................x........................x.........................x..................x.

module.exports = router;