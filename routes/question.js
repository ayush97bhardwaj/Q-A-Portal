var express=require('express');
var router=express.Router();
var User=require('../models/userModel');
var Ques=require('../models/quesModel');

var bodyParser=require('body-parser');
router.use(bodyParser.json());

//post question into database
router.route('/question')
.post(function(req,res,next){
    req.body.username=req.session.user.username;
    var tags=[];
    var str=req.body.tags;
    //seprating the tags
    var l=0,r=0,x=0 ;
    for(var i=0;i<str.length;i++)
    {
        if(str[i]==' ')
        {
            if(l<r){
                tags[x++]=str.substring(l,r);
            }
            l=r+1;
        }
        r++;
    }
    if(l<r){
        tags[x++]=str.substring(l,r);
    }
    //removing duplicacy in tags
    tags.sort();
    let j=0;
    for(let i=0;i<tags.length-1;i++){
        if(tags[i]!=tags[i+1])
            tags[j++]=tags[i];
    }
    tags[j++]=tags[tags.length-1];
    tags.length=j;

    req.body.tags=tags;
    console.log(req.body);
    //Put the tags in user database
    User.findOne({_id:req.session.user._id},function(err,user){
        if(err) throw err;
        else{
            tags=tags.concat(user.tags);
            tags.sort();
            let j=0;
            for(let i=0;i<tags.length-1;i++){
                if(tags[i]!=tags[i+1])
                    tags[j++]=tags[i];
            }
            tags[j++]=tags[tags.length-1];
            tags.length=j;
            
            User.update({_id:req.session.user._id},{$set:{"tags":tags}},function(err,result){
                if(err) throw err;
                else console.log(result+2);
            });

        }
    });

    // res.redirect('/'+req.session.user.username);
    Ques.create(req.body,function(err,result){
        if(err) throw err;
        else console.log(result);
        res.redirect('/'+req.session.user.username);
    });
});

//..........x...........................x............................x...............................x................
//post answer into database

router.route('/answer/:username/:id')
.post(function(req,res,next){
    // console.log(req.body.answer);
    Ques.findOneAndUpdate({_id:req.params.id},{
        $push:{
            answers:{
                answer:req.body.answer,
                username:req.session.user.username,
            },
        }
    },function(err,result){
        if(err) throw err;
        else {
            let tags=result.tags;
            User.findOne({_id:req.session.user._id},function(err,user){
                if(err) throw err;
                else{
                    tags=tags.concat(user.tags);
                    tags.sort();
                    let j=0;
                    for(let i=0;i<tags.length-1;i++){
                        if(tags[i]!=tags[i+1])
                            tags[j++]=tags[i];
                    }
                    tags[j++]=tags[tags.length-1];
                    tags.length=j;
                    
                    User.update({_id:req.session.user._id},{$set:{"tags":tags}},function(err,result){
                        if(err) throw err;
                        else console.log(result+3);
                    });
                }
            });
            res.redirect('/'+req.params.username)
        }
    });
});

//..............x.......................x......................x.......................x.....................x.......
//increment likes of question using ajax

router.route('/queslikes/:quesId')
.post(function(req,res,next){
    console.log(req.body);
    Ques.findOne({_id:req.params.quesId,likedBy:req.session.user.email},function(err,user){
        if(err) throw err;
        if (!user){
            Ques.update({_id:req.params.quesId},{$inc:{likes:1},$push:{likedBy:req.session.user.email}},function(err,result){
                if(err) throw err;
                else{
                    res.json({inc:1});
                    console.log(result);
                }
            });
        }
        else{
            Ques.update({_id:req.params.quesId},{$inc:{likes:-1},$pull:{likedBy:req.session.user.email}},function(err,result){
                if(err) throw err;
                else{
                    res.json({inc:0});
                    console.log(result);
                }
            });
        }
    });
});

//.................x..................x.....................x.....................x........................x.......

router.route("/ifquesliked")
.post(function(req,res,next){
    Ques.findOne({_id:req.body.quesId,likedBy:req.session.user.email},function(err,result){
        if(err) throw err;
        if(!result) res.json({liked:0});
        else res.json({liked:1});
    });
});

//...............x...................x........................x....................x.....................x........
//Submit Comment to question

router.route("/comment")
.post(function(req,res,next){
    Ques.findOneAndUpdate({_id:req.body.quesId},{
        $push:{
            comments:{
                comment:req.body.comment,
                email:req.session.user.email
            }
        }
    },function(err,result){
        if(err) throw err;
        else{
            let tags=result.tags;
            User.findOne({_id:req.session.user._id},function(err,user){
                if(err) throw err;
                else{
                    tags=tags.concat(user.tags);
                    tags.sort();
                    let j=0;
                    for(let i=0;i<tags.length-1;i++){
                        if(tags[i]!=tags[i+1])
                            tags[j++]=tags[i];
                    }
                    tags[j++]=tags[tags.length-1];
                    tags.length=j;
                    
                    User.update({_id:req.session.user._id},{$set:{"tags":tags}},function(err,result){
                        if(err) throw err;
                        else console.log(result+3);
                    });
                }
            });
            res.json({"done":1});
        }
    });
})


//.............x.................x..........................x.......................x.......................
//get username for comments from email

router.route("/getusernamefromemail")
.post(function(req,res,next){
    User.findOne({email:req.body.email},function(err,user){
        if(err) throw err;
        if(user){
            res.json({"username":user.username});
        }
        else{
            res.json({"username":"not found"});
        }
    });
});

//....................x.....................x.........................x......................x................
//increment likes of ques-comment
router.route("/quesCommentLikes")
.post(function(req,res,next){
    Ques.findOne({_id:req.body.quesId,["comments."+req.body.commentIndex+".likedBy"]:req.session.user.email},function(err,user){
        if(err) throw err;
        if(user){
            // res.json({"inc":0});
            Ques.update({_id:req.body.quesId},{
                $inc:{
                    ["comments."+req.body.commentIndex+".likes"]:-1,
                },
                $pull:{
                    ["comments."+req.body.commentIndex+".likedBy"]:req.session.user.email,
                }
            },function(err,result){
                if(err) throw err;
                else res.json({"inc":0});
            });
        }
        else{
            Ques.update({_id:req.body.quesId},{
                $inc:{
                    ["comments."+req.body.commentIndex+".likes"]:1,
                },
                $push:{
                    ["comments."+req.body.commentIndex+".likedBy"]:req.session.user.email,
                }
            },function(err,result){
                if(err) throw err;
                else res.json({"inc":1});
            });
        }
    });
});

//...................x........................x...........................x.................x...............
//check if user has liked the ques-comment
router.route("/ifQuesCommentliked")
.post(function(req,res,next){
    Ques.findOne({_id:req.body.quesId,["comments."+req.body.commentIndex+".likedBy"]:req.session.user.email},function(err,result){
        if(err) throw err;
        else if(result) res.json({"liked":1});
        else res.json({"liked":0});
    });
});

//....................x.....................x.........................x......................x................
//increment likes of the answer
router.route("/ansLikes")
.post(function(req,res,next){
    Ques.findOne({_id:req.body.quesId,["answers."+req.body.ansIndex+".likedBy"]:req.session.user.email},function(err,user){
        if(err) throw err;
        if(user){
            Ques.update({_id:req.body.quesId},{
                $inc:{
                    ["answers."+req.body.ansIndex+".likes"]:-1,
                },
                $pull:{
                    ["answers."+req.body.ansIndex+".likedBy"]:req.session.user.email,
                }
            },function(err,result){
                if(err) throw err;
                else res.json({"inc":0});
            });
        }
        else{
            Ques.update({_id:req.body.quesId},{
                $inc:{
                    ["answers."+req.body.ansIndex+".likes"]:1,
                },
                $push:{
                    ["answers."+req.body.ansIndex+".likedBy"]:req.session.user.email,
                }
            },function(err,result){
                if(err) throw err;
                else res.json({"inc":1});
            });
        }
    });
});

//...................x........................x...........................x.................x...............
//check if user has liked the answer
router.route("/ifAnsliked")
.post(function(req,res,next){
    Ques.findOne({_id:req.body.quesId,["answers."+req.body.ansIndex+".likedBy"]:req.session.user.email},function(err,result){
        if(err) throw err;
        else if(result) res.json({"liked":1});
        else res.json({"liked":0});
    });
});

//.................x............................x.......................x.....................x.............
//delete question-comment
router.route("/delete/ques-comment/:id/:comId/:username")
.get(function(req,res,next){
    Ques.update({_id:req.params.id},{$pull:{comments:{_id:req.params.comId}}},function(err,result){
        if(err) throw err;
        else{
            console.log(result);
            res.redirect("/"+req.params.username);
        }
    });
});

//..........x......................x.........................x...................x..........................
//delete question
router.route("/delete/ques/:id/:redirectpath")
.get(function(req,res,next){
    Ques.remove({_id:req.params.id},function(err,result){
        if(err) throw err;
        else{
            console.log("done");
            res.redirect("/"+req.params.redirectpath);
        }
    });
});

//.................x............................x.......................x.....................x.............
//delete answer
router.route("/delete/ans/:id/:ansId/:username")
.get(function(req,res,next){
    Ques.update({_id:req.params.id},{$pull:{answers:{_id:req.params.ansId}}},function(err,result){
        if(err) throw err;
        else{
            console.log(result);
            res.redirect("/"+req.params.username);
        }
    });
});

module.exports=router;