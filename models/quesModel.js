var mongoose=require('mongoose');

var schema=mongoose.Schema;

var commentSchema=new schema({
    comment:{type:String},
    email:{type:String},
    likes:{type:Number,default:0},
    likedBy:[{type:String}],
    dislikes:{type:Number,default:0},
},{
    timestamps:true,
});
var answerSchema=new schema({
    username:{type:String},
    answer:{type:String},
    likes:{type:Number,default:0},
    likedBy:[{type:String}],
    dislikes:{type:Number,default:0},
    accepted:{type:Boolean,default:false},
},{
    timestamps:true,
});
var questionSchema=new schema({
    username:{type:String},
    question:{type:String},
    tags:[{type:String}],
    likes:{type:Number,default:0},
    likedBy:[{type:String}],
    likesToTime:{type:Number,default:0},
    answers:[answerSchema],
    comments:[commentSchema],
},{
    timestamps:true,
});

var question=mongoose.model('ques',questionSchema);
module.exports=question;