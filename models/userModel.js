var mongoose=require('mongoose');
var uniqueValidator=require('mongoose-unique-validator')
require('mongoose-type-email');
var schema=mongoose.Schema;
var passportLocalMongoose = require('passport-local-mongoose');

var picSchema=new schema({
    src: {
        type : String,
        default:"/images/placeholderProfile.png" 
    },
    filename: { type : String },
},{
	timestamps:true
});

var userSchema=new schema({
    firstname : {
        type : String,
		required : true
    },
    lastname : {
        type: String,
		required : true
    },
    username : {
        type : String,
        required : true,
        unique : true
    },
    email : {
        type : mongoose.SchemaTypes.Email,
        required : true,
        unique : true
    },
    password : {
        type : String,
        minlength : 8,
        required : true,
    },
    prevDps : [picSchema],
    currentDp : {
        src: {
            type : String,
            default:"/images/placeholderProfile.png",
        },
        filename: { type : String },
        index:{
            type:Number,
            default:-1,
        }
    },
    profileDp: {
        type:Boolean,
        default:false,
    },
    college : { type: String },
    dob : { type : String },
    tags:[{type:String}],
},{
    timestamps: true
});
userSchema.plugin(uniqueValidator);
// userSchema.plugin(passportLocalMongoose);
var user = mongoose.model('users',userSchema);

module.exports = user;