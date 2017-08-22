var express = require("express");
var http = require('http');
var path = require('path');
var mongoose = require("mongoose");
const bodyParser = require('body-parser');
var methodOverride = require('method-override');
var expressValidator = require('express-validator');
var app = express();
var port = 3000;

app.set('view engine', 'ejs');

app.use( bodyParser.json() );       // to support JSON-encoded bodies
app.use(bodyParser.urlencoded({     // to support URL-encoded bodies
  extended: true
}));
app.use(expressValidator());

mongoose.Promise = global.Promise;
mongoose.connect("mongodb://127.0.0.1:27017/node-feedback-stats-db");
var nameSchema = new mongoose.Schema({
  surveyname: String,
  surveyemail: String,
  surveyage:Number,
  surveygender: String,
  surveycountry:String,
  surveyrating:Number,
  surveyfeedback:String
});
var User = mongoose.model("User", nameSchema);


app.use("/home", (req, res) => {
  res.render('data');
});

app.use("/stats", (req, res) => {
  User.find({},function(err, data){
    var age_avg = 0;
    var rat_avg = 0;
    var genderSplit = {
      male:0,
      female:0,
      other:0
    }
    var countrySplit ={};
    for(var i=0; i<data.length; i++){
      age_avg = age_avg + data[i].surveyage;
      rat_avg = rat_avg + data[i].surveyrating;
      genderSplit[data[i].surveygender] = genderSplit[data[i].surveygender] + 1;
      if( countrySplit[data[i].surveycountry] ){
        countrySplit[data[i].surveycountry] = countrySplit[data[i].surveycountry]+1;
      }else{
        countrySplit[data[i].surveycountry]=1;
      }
      console.log(countrySplit[data[i].surveycountry]);
    }
    var surveyage = age_avg/data.length;
    var surveyrating = rat_avg/data.length;
    var output = {
      avg_age : Math.round(surveyage),
      avg_rating: Math.round(surveyrating),
      gender_split: genderSplit,
      country_split: countrySplit,
      total: data.length
    }
    console.log(output);
    console.log(data.length);
    res.render('output',{response: output});
  });
});


app.post("/addname", (req, res) => {

  var resp = {'user':'present'}
  User.findOne({ 'surveyemail':req.body.surveyemail}, 'surveyname surveyrating', function (err, person) {
    if (err) return handleError(err);
    if(person){
      console.log(person.surveyname + ' has already given a rating of '+ person.surveyrating);
      res.render('no-thanks',{response: resp});
    }else{
      console.log('saving user ' +req.body.surveyemail);
      var myData = new User({
        surveyname: req.body.surveyname,
        surveyemail: req.body.surveyemail,
        surveyage:req.body.surveyage,
        surveygender: req.body.surveygender,
        surveycountry:req.body.surveycountry,
        surveyrating:req.body.surveyrating,
        surveyfeedback:req.body.surveyfeedback
      });
      //console.log(myData);
      myData.save()
        .then(item => {
          resp = req.body;
          res.render('thanks',{response: resp});
        })
        .catch(err => {
          console.log(err);
          res.render('no-thanks');
        });
    }
  });

});

app.listen(port, () => {
  console.log("Server listening on port " + port);
});
