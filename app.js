//jshint esversion:6
const dotenv = require("dotenv").config()
const express = require("express");
const ejs = require("ejs");
const bodyParser = require("body-Parser");
const { application } = require("express");
const mongoose = require("mongoose");
const encrypt = require("mongoose-encryption");


mongoose.connect("mongodb://localhost:27017/userDB");

const userSchema = mongoose.Schema({
  email: String,
  password: String,
});

const encCode = process.env.ENCODE;

userSchema.plugin(encrypt, {
  secret: encCode,
  encryptedFields: ["password"]
});

const User = mongoose.model("user", userSchema);

const app = express();

app.use(express.static("public"));
app.set("view engine", "ejs");
app.use(
  bodyParser.urlencoded({
    extended: true,
  })
);

app.get("/", function (req, res) {
  res.render("home");
});

app.get("/login", function (req, res) {
  res.render("login");
});

app.get("/register", function (req, res) {
  res.render("register");
});

app.post("/register", function (req, res) {
  const newUser = new User({
    email: req.body.username,
    password: req.body.password,
  });

  newUser.save(function (err) {
    if (err) {
      console.log(err);
    } else {
      res.render("secrets");
    }
  });
});

app.post("/login", function (req, res) {
  const username = req.body.username;
  const password = req.body.password;

  User.findOne({ email: username }, function (err, founduser) {
    if (err) {
      console.log(err);
    } else {
      if (founduser) {
        if (founduser.password == password) {
          res.render("secrets");
        } else {
          res.write("wrong password entered");
        }
      } else {
        res.write("you entered wrong credintials");
      }
    }
    res.send();
  });
});

app.listen(3000, function () {
  console.log("server is started at port 3000");
});
