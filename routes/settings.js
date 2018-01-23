var express = require('express');
var router = express.Router();
var mongoose = require('mongoose');
var User = require('../models/userModel');
var Ques = require('../models/quesModel');
var fs=require('fs');
var multer=require('multer');
var path=require('path');
var rimraf=require('rimraf');
var bodyParser=require('body-parser');
router.use(bodyParser.json());

//redirect to profile settings
// if going to directory "/settings"

router.route('/')
.get(function(req,res,next){
    User.findOne({_id:req.session.user._id},function(err,user){
        if(err)
            throw err;
        else{
            req.session.user=user;
            delete req.session.password;
            res.redirect('/settings/profile');
        }
    });
})

//................x......................x..............................x......................x......................

//update profile details

router.route('/profile')
.get(function(req,res,next){
    res.render('update_profile',{
        title: "update profile",
        user: req.session.user,
        loggedin: true,
    })
})
.post(function(req,res,next){
    //Check for error
    var str='';
    if(req.body.firstname == "")
        str+='Fill in your firstname <br/>';
    if(req.body.lastname == "")
        str+='Fill in your lastname <br/>';
    if(req.body.username == "")
        str+='Fill in your username <br/>';
    User.find({},function(err,user){
        var index=-1;
        if(err)
            console.log(err);
        else{ 
            for(var i=0;i<user.length;i++){
                if(user[i].username == req.body.username)
                    index=i;
            }
            if(index!=-1)
                if(user[index]._id != req.session.user._id)
                    str+='username is used <br/>';
        }
    });

    //if no error found then updating the profile
    User.findOne({_id:req.session.user._id},function(err,user){
        if(err)
            console.log(err);
        else{
            if(str!='')
                res.render('update_profile',{
                    msg:'<h4>'+str+'</h4>',
                    user : user,
                    title:"update profile",
                    loggedin:true,
                });
            else{ 
                User.findOneAndUpdate({_id : req.session.user._id},{ 
                    $set : { 
                        firstname : req.body.firstname,
                        lastname : req.body.lastname,
                        username : req.body.username,
                        college : req.body.college,
                        dob : req.body.dob,
                    } 
                },
                function(err,user){
                    if(err) {
                        console.log(err);
                    }
                    else{
                        console.log("successfully updated : " + user.username+" to "+req.body.username);
                        fs.rename('./public/images/'+user.username, './public/images/'+req.body.username, function (err) {
                            if (err) throw err;
                            console.log('renamed complete');
                          });
                    }
                });
                
                //change the src of the prevDps and currentDp if change in username
                if(req.body.username != req.session.user.username){
                    var i=0;
                    user.prevDps.forEach(function(x){
                        // console.log(x.src);
                        User.update({_id:req.session.user._id},{
                            $set:{
                                ['prevDps.'+i+'.src'] : "/images/"+req.body.username+"/"+x.filename,
                            }
                        },function(err,y){
                            if(err)
                                throw err;
                            else 
                                console.log(y);
                        });
                        i++;
                    });
                    //if current DP index is not -1  then only update the file path
                    if(req.session.user.currentDp.index != -1){
                        User.update({_id:req.session.user._id},{
                            $set:{
                                'currentDp.src' : "/images/"+req.body.username+"/"+req.session.user.currentDp.filename,
                            }
                        },function(err,y){
                            if(err)
                                throw err;
                            else 
                                console.log(y);
                        });
                    }

                    //update the username of the questions
                    Ques.update({"username":req.session.user.username},{$set:{"username":req.body.username}},{multi:true},function(err,result){
                        if(err) throw err;
                        else console.log(result);
                    });
                    //update the username of the answers
                    Ques.find({"answers.username":req.session.user.username},function(err,result){
                        if(err) throw err;
                        else{
                            // console.log(result);
                            result.forEach(function(ques){
                                // console.log(ques);
                                let m=0;
                                ques.answers.forEach(function(ans){
                                    if(ans.username == req.session.user.username){
                                        Ques.update({_id:ques._id,"answers.username":req.session.user.username},{
                                            $set:{["answers."+m+".username"]:req.body.username}
                                        },function(err,result1){
                                            if(err) throw err;
                                            else console.log(JSON.stringify(result1)+" - ans username" + m);
                                        });
                                    }
                                    m++;
                                });
                            });
                        }
                    });

                }
                res.redirect('/');
            }
        }

    });
});
//..............x...................x..................x...................x.....................x...................x..
//upload Dp 
var storage = multer.diskStorage({
    destination: function (req, file, cb) {
      cb(null, './public/images/' + req.session.user.username);
    },
    filename: function (req, file, cb) {
        cb(null,'' + Date.now());
    }
})
var upload=multer({storage: storage});

router.route('/profile/image')
.post(upload.single('newDp'),function(req,res,next){
    var src=req.file.path;
    var src=src.substr(6,src.length-6);
    User.findOneAndUpdate({_id : req.session.user._id},{
            $push: {
                prevDps : {
                    src: src,
                    filename: req.file.filename,
                },
            },
            $set : {
                currentDp : {
                    src : src,
                    filename : req.file.filename,
                    index : req.session.user.prevDps.length,
                },
            }
        },
        function(err,user){
            if(err)
                throw err;
            else{
                console.log("successfully uploaded");
                res.redirect('/'+user.username);
        }
    });
})
//............x.........................x..........................x................................x.................x.

// Previous Dps

router.route('/profile/previousDps')
.get(function(req,res,next){
//View Previous DPs
    res.render('previousDps',{  
        title:'Previous Dps',
        user: req.session.user,
        loggedin:true,

    });

})

//............x......................x............................x...........................x.................x......

//Delete previous DPs

router.route('/profile/deletePrevDP/:id/:index')
.get(function(req,res,next){
    var id=req.params.id;
    var index=req.params.index;
    if(req.session.user.currentDp.index==index)
    {
        User.update({_id:req.session.user._id},{
                $set: { currentDp:{
                    index:-1,
                    src:"/images/placeholderProfile.png",
                }},
            },
            function(err,result){
                if(err)
                    throw err;
                console.log(result+" 1.1");
        });
    }
    else if(req.session.user.currentDp.index > index){
        User.update({_id:req.session.user._id},{
                $set: { "currentDp.index": req.session.user.currentDp.index-1},
            },
            function(err,result){
                if(err)
                    throw err;
                console.log(result+" 1.2");
        });
    }

    User.update({_id:req.session.user._id},{
            $pull:{ prevDps: {_id : id} },
        },
        function(err,result){
            if(err)
                throw err;
            else{
                console.log(result + ": 2");
                res.redirect('/settings');
            }
    });
});

//..........................x...................................x...........................x.....................x....

//Set Current Dp from Prev DPs

router.route('/profile/currentDP/:index')
.get(function(req,res,next){
    var index=req.params.index;
    User.update({_id:req.session.user._id},{
        $set:{
            currentDp:{
                index:index,
                src:req.session.user.prevDps[index].src,
                filename:req.session.user.prevDps[index].filename,
            },
        },
    },function(err,x){
        if(err)
            throw err;
        else{
            console.log(x);
            res.redirect('/settings');
        }
    })
});

//...............x...............x...............x....................x...................x.....................x.......

//Delete account

router.route('/delete')
.get(function(req,res,next){

    User.remove({ _id : req.session.user._id },function(err,result){
        if(err) 
            console.log(err);
        else   
            console.log("successfully removed User! :)");
    });
    Ques.remove({username:req.session.user.username},function(err,result){
        if(err) 
            console.log(err);
        else   
            console.log("successfully removed Questions! :)");
    });
    Ques.update({"answers.username":req.session.user.username},{$pull:{"answers":{"username":req.session.user.username}}},{multi:true},function(err,result){
        if(err) 
            console.log(err);
        else   
            console.log("successfully removed answers! :)");
    });
    Ques.update({"comments.email":req.session.user.email},{$pull:{"comments":{"email":req.session.user.email}}},{multi:true},function(err,result){
        if(err) 
            console.log(err);
        else   
            console.log("successfully removed comments! :)");
    });
    Ques.update({likedBy:req.session.user.email},{$pull:{"likedBy":req.session.user.email}},{multi:true},function(err,result){
        if(err) 
            console.log(err);
        else   
            console.log("successfully removed ques-likes! :)");
    });

    //Only able to remove ques-comment-likes and ans-likes from ''one'' result;
    Ques.update({"comments.likedBy":req.session.user.email},{$pull:{"comments.$.likedBy":req.session.user.email}},{multi:true,arrayFilters:[{"elem.likedBy":req.session.user.email}]},function(err,result){
        if(err) 
            console.log(err);
        else   
            console.log("successfully removed comment-likes! :)");
            console.log(result);
    });
    Ques.update({"answers.likedBy":req.session.user.email},{$pull:{"answers.$.likedBy":req.session.user.email}},{multi:true,arrayFilters:[{"elem.likedBy":req.session.user.email}]},function(err,result){
        if(err) 
            console.log(err);
        else   
            console.log("successfully removed ans-likes! :)");
            console.log(result);
    });
    var dir = './public/images/'+req.session.user.username;
    rimraf( dir , function () { console.log('done'); });
    res.redirect('/logout');
});

module.exports=router;