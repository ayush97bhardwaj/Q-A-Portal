var express=require('express');
var router=express.Router();
var User=require('../models/userModel');
var Ques=require('../models/quesModel');

var bodyParser=require('body-parser');
router.use(bodyParser.json());

router.route('/')
//searching users...question...tags...email..
.get(function(req,res,next){
    console.log(req.query);
    if(req.query.type == "questions")
    {
        console.log(1);
        // Search substring using REGEX
        Ques.find({question:{$regex:req.query.search}},function(err,result){
            if(err) throw err;
            else{
                console.log(result);
                res.render('searchQues',{
                    title: "search",
                    user: req.session.user,
                    loggedin: true,
                    questions:result,
                });
            }
        });
    }
    else if(req.query.type=="users"){
        console.log(12);
        //Search substring using REGEX
        User.find({username:{$regex:req.query.search}},function(err,users){
            if(err) throw err;
            else{
                console.log(users);
                res.render('searchUser',{
                    title: "search",
                    user: req.session.user,
                    loggedin: true,
                    users:users,
                });
            }
        });
    }
    else if(req.query.type=="tags"){
        console.log('3-t');
        // Search substring using REGEX
        Ques.find({tags:{$regex:req.query.search}},function(err,result){
            if(err) throw err;
            else{
                console.log(result);
                res.render('searchQues',{
                    title: "search",
                    user: req.session.user,
                    loggedin: true,
                    questions:result,
                });
            }
        });
    }
    else if(req.query.type=="email"){
        console.log('4-e');
        //Search substring using REGEX
        User.find({email:{$regex:req.query.search}},function(err,users){
            if(err) throw err;
            else{
                console.log(users);
                res.render('searchUser',{
                    title: "search",
                    user: req.session.user,
                    loggedin: true,
                    users:users,
                });
            }
        });
    }
})
//gets the users, questions, tags, email list for autocomplete
.post(function(req,res,next){
    let users=[],quess=[],tags,emails=[];
    User.find({},function(err,user){
        if(err) throw err;
        else{
            // console.log(users);
            user.forEach(function(u){
                users.push(u.username);
                emails.push(u.email);
            });
            // console.log(users);
            Ques.find({},function(err,ques){
                if(err) throw err;
                else{
                    ques.forEach(function(q){
                        quess.push(q.question);
                        if(tags==null){
                            tags=q.tags;
                            // console.log(tags+"..................."+1111111111111111);
                        }
                        else{
                            // console.log(tags);
                            tags=tags.concat(q.tags);
                        }
                    });

                    //removing the duplicacy of tags 
                    tags.sort();
                    let j=0;
                    for(let i=0;i<tags.length-1;i++){
                        if(tags[i]!=tags[i+1])
                            tags[j++]=tags[i];
                    }
                    tags[j++]=tags[tags.length-1];
                    tags.length=j;

                    // console.log(quess);
                    res.json({"users":users,"ques":quess,"tags":tags,"emails":emails});
                }
            });
        }
    });
});

//Show a single question fully ...where the question is in the query
router.route("/question")
.get(function(req,res,next){
    Ques.findOne({question:req.query.ques},function(err,result){
        if(err) throw err;
        else{
            res.render("questionSingle",{
                title: "update profile",
                user: req.session.user,
                ques:result,
                loggedin: true,
            });
        }
    });
    
});

router.route("/tags/:tag")
.get(function(req,res,next){
    res.render('searchQues',{
        title:'Search',
        loggedin:true,
        user:req.session.user,
    });
});

router.route("/email")
.post(function(req,res,next){
    console.log(req.body.email);
    User.findOne({email:req.body.email},function(err,user){
        if(err) throw err;
        if(user){
            res.json({"username":user.username});
        }
    })
});
module.exports=router;