var express = require('express');
var path = require('path');
var favicon = require('serve-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var passport=require('passport');
var LocalStrategy=require('passport-local').Strategy;
var GoogleStrategy=require('passport-google-oauth2').Strategy;
// var session=require('express-session');
var session = require('client-sessions');
var multer=require('multer');
var async=require('async');
var fs=require('fs');
var GOOGLE_CLIENT_ID      = "864876813261-g675ot3nlrngigqq4utunqh756for324.apps.googleusercontent.com"
, GOOGLE_CLIENT_SECRET  = "eczvDNe94eztTBzxVJdMB1VX";

var mongoose=require('mongoose');
var url='mongodb://localhost:27017/main';
mongoose.connect(url, {
  useMongoClient: true
});

//Get the default connection
var db = mongoose.connection;

//Bind connection to error event (to get notification of connection errors)
db.on('error', console.error.bind(console, 'MongoDB connection error:'));
db.once('open',function(){
  
    console.log('Connected to the server correctly !');
});

// var mongo = require('mongodb');
// var monk = require('monk');
// var db = monk('localhost:27017/main');

//User Model
var User = require('./models/userModel');

var signin = require('./routes/signin');
var signup = require('./routes/signup');
var main = require('./routes/main');
var settings = require('./routes/settings');
var question=require('./routes/question.js');
var search=require('./routes/search.js');

var app = express();

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'hbs');

// Passport session setup.
//   To support persistent login sessions, Passport needs to be able to
//   serialize users into and deserialize users out of the session.  Typically,
//   this will be as simple as storing the user ID when serializing, and finding
//   the user by ID when deserializing.  However, since this example does not
//   have a database of user records, the complete Google profile is
//   serialized and deserialized.
passport.serializeUser(function(user, done) {
  done(null, user);
});

passport.deserializeUser(function(obj, done) {
  done(null, obj);
});


// Use the GoogleStrategy within Passport.
//   Strategies in Passport require a `verify` function, which accept
//   credentials (in this case, an accessToken, refreshToken, and Google
//   profile), and invoke a callback with a user object.
passport.use(new GoogleStrategy({
    clientID:     GOOGLE_CLIENT_ID,
    clientSecret: GOOGLE_CLIENT_SECRET,
    //NOTE :
    //Carefull ! and avoid usage of Private IP, otherwise you will get the device_id device_name issue for Private IP during authentication
    //The workaround is to set up thru the google cloud console a fully qualified domain name such as http://mydomain:3000/ 
    //then edit your /etc/hosts local file to point on your private IP. 
    //Also both sign-in button + callbackURL has to be share the same url, otherwise two cookies will be created and lead to lost your session
    //if you use it.
    callbackURL: "http://localhost:3000/auth/google/callback",
    passReqToCallback   : true
  },
  function(request, accessToken, refreshToken, profile, done) {
    // asynchronous verification, for effect...
    process.nextTick(function () {
      
      // To keep the example simple, the user's Google profile is returned to
      // represent the logged-in user.  In a typical application, you would want
      // to associate the Google account with a user record in your database,
      // and return that user instead.
      // console.log(profile);
      // request.session.user=profile;
      console.log("profile added to session user");
      return done(null, profile);
    });
  }
));
// uncomment after placing your favicon in /public
//app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')));
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(session({
  cookieName: 'session',
  secret: 'its my first session generation',
  duration: 30*60*1000,
  activeDuration: 30*60*1000,
  httpOnly: true,
  secure: true,
  ephemeral: true
}));
app.use(passport.initialize());
app.use(passport.session());
app.use(express.static(path.join(__dirname, 'public')));
// passport.use(new LocalStrategy(User.authenticate()));
// passport.serializeUser(User.serializeUser());
// passport.deserializeUser(User.deserializeUser());

function sesCheck(req,res,next){
  if( (req.session && req.session.user) || req.user)
    next();
  else
    res.redirect('/');
}

app.use('/signin', signin);
app.use('/signup', signup);

// GET /auth/google
//   Use passport.authenticate() as route middleware to authenticate the
//   request.  The first step in Google authentication will involve
//   redirecting the user to google.com.  After authorization, Google
//   will redirect the user back to this application at /auth/google/callback
app.get('/auth/google', passport.authenticate('google', { scope: [
  'email',
  'profile'] 
}));

// GET /auth/google/callback
//   Use passport.authenticate() as route middleware to authenticate the
//   request.  If authentication fails, the user will be redirected back to the
//   login page.  Otherwise, the primary route function function will be called,
//   which, in this example, will redirect the user to the home page.
app.get( '/auth/google/callback', 
 passport.authenticate( 'google', {
   failureRedirect: '/signin'
}),function(req,res,next){
  User.findOne({email:req.user.email},function(err,user){
    if(err) throw err;
    if(!user){
      console.log(req.user);
      var usr=req.user.email;
      usr=usr.substring(0,usr.length-10);
      User.create({
        "firstname":req.user.name.givenName,
        "lastname":req.user.name.familyName,
        "password":"admin123",
        "username":usr,
        "email":req.user.email,
        "currentDp":{"src":req.user._json.image.url},
      },function(err,result){
        if(err) throw err;
        else{
          req.logout();
          req.session.user=result;
          var dir='./public/images/'+usr;
          if (!fs.existsSync(dir)){
            fs.mkdirSync(dir);
          }
          res.redirect('/');
        }
      });
      
    }
    else{
      console.log(req.user);
      req.logout();
      req.session.user=user;
      res.redirect('/');
    }
  })
});

app.use('/settings', sesCheck , settings);
app.get('/logout',function(req,res,next){
	req.session.reset();
  res.redirect('/signin');
});
app.use('/submit', sesCheck, question);
app.use('/search', sesCheck, search);
app.use('/', main);

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  var err = new Error('Not Found');
  err.status = 404;
  next(err);
});

// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});

module.exports = app;
