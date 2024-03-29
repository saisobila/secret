//jshint esversion:6
const bodyParser = require("body-parser");
require("dotenv").config();
const express = require("express");
const ejs = require("ejs");

// const bodyParser = require("body-Parser");
const mongoose = require("mongoose");
const session = require("express-session");
const passport = require("passport");
const passportLocalMongoose = require("passport-local-mongoose");
const GoogleStrategy = require("passport-google-oauth20").Strategy;  
const findOrCreate = require("mongoose-findorcreate")

// const bcrypt = require("bcrypt");
// const saltRounds = 3;
// const md5 = require("md5")
// const encrypt = require("mongoose-encryption");


const app = express();

app.use(express.static("public"));
app.set("view engine", "ejs");
app.use(
  bodyParser.urlencoded({
    extended: true,
  })
);

app.use(
  session({
    secret: "my long secret",
    resave: false,
    saveUninitialized: false,
  })
);

app.use(passport.initialize());
app.use(passport.session());

mongoose.connect("mongodb://localhost:27017/userDB");

const userSchema = mongoose.Schema({
  email: String,
  password: String,
  googleId: String,
  secret: String

});





// const encCode = process.env.ENCODE;

// userSchema.plugin(encrypt, {
//   secret: encCode,
//   encryptedFields: ["password"]
// });

userSchema.plugin(passportLocalMongoose);
userSchema.plugin(findOrCreate);

const User = mongoose.model("user", userSchema);

passport.use(User.createStrategy());

passport.serializeUser(function(user, done) {
  done(null, user);
});

passport.deserializeUser(function(id, done) {
 User.findById(id,function(err,user){
  done(err,user);
 })
});

passport.use(new GoogleStrategy({
  clientID: process.env.CLIENT_ID ,
  clientSecret: process.env.CLIENT_SECRET,
  callbackURL: "http://localhost:3000/auth/google/secrets"
},
function(accessToken, refreshToken, profile, cb) {
  User.findOrCreate({ googleId: profile.id }, function (err, user) {

    return cb(err, user);
  });
}
));



app.get("/", function (req, res) {
  res.render("home");
});

app.get("/auth/google",
  passport.authenticate("google",{scope: ["profile"]})
);

app.get('/auth/google/secrets', 
  passport.authenticate('google', { failureRedirect: '/login' }),
  function(req, res) {
    // Successful authentication, redirect secrets.
    res.redirect('/secrets');
  });


app.get("/login", function (req, res) {
  res.render("login");
});



app.get("/register", function (req, res) {
  res.render("register");
});

app.get("/secrets", function (req, res) {
  if (req.isAuthenticated()) {
    User.find({"secret": {$ne: null}}, function(err, foundUsers){
      if (err){
        console.log(err);
      } else {
        if (foundUsers) {
          res.render("secrets", {usersWithSecrets: foundUsers});
        }
      }
    });
  } else {
    res.render("login");
  }
});

app.post("/register", function (req, res) {
  // bcrypt.hash(req.body.password, saltRounds, function (err, hash) {
  //   // Store hash in your password DB.
  //   const newUser = new User({
  //     email: req.body.username,
  //     password: hash,
  //   });

  //   newUser.save(function (err) {
  //     if (err) {
  //       console.log(err);
  //     } else {
  //       res.render("secrets");
  //     }
  //   });
  // });

  User.register(
    { username: req.body.username },
    req.body.password,
    function (err, user) {
      if (err) {
        console.log(err);
        res.redirect("/register");
      } else {
        passport.authenticate("local")(req, res, function () {
          res.redirect("/secrets");
        });
      }
    }
  );
});

app.post("/login", function (req, res) {
  // const username = req.body.username;
  // const password = req.body.password;

  // User.findOne({ email: username }, function (err, founduser) {
  //   if (err) {
  //     console.log(err);
  //   } else {
  //     if (founduser) {
  //       bcrypt.compare(password, founduser.password, function (err, result) {
  //         if (result == true) {
  //           res.render("secrets");
  //         }
  //       });
  //     }
  //   }
  // });
  const user = new User({
    username: req.body.username,
    password: req.body.password,
  });
  req.logIn(user, function (err) {
    if (err) {
      console.log(err);
    } else {
      passport.authenticate("local")(req, res, function () {
        res.redirect("/secrets");
      });
    }
  });
});



app.get("/submit",function(req,res){
  if(req.isAuthenticated()){
    res.render("submit");
  } else{
    res.render("login");
  }
})

app.post("/submit",function(req,res){
  const submittedSecret = req.body.secret;
  console.log(req.user.id);

  User.findById(req.user.id, function(err,founduser){
    if(err){
      console.log(err);

    }
    else{
      if(founduser){
        founduser.secret = submittedSecret;
        founduser.save(function(){
          res.redirect("/secrets");
        })
      }
    }
  })

})

app.get("/logout",function(req,res){
  req.logOut(function(err){
    if(err){
      console.log(err);
    }
    else{
      res.redirect("/");
    }
  })
})

app.listen(3005, function () {
  console.log("server is started at port 3000");
});
