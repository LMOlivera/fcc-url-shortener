'use strict';
var express = require('express');
var mongo = require('mongodb');
var mongoose = require('mongoose');
mongoose.connect(process.env.MONGO_URI, {useNewUrlParser: true});
var cors = require('cors');
var bodyParser = require('body-parser');
var url = require('url');

var app = express();
var port = process.env.PORT || 3000;

app.use(cors());
app.use(bodyParser.urlencoded({ extended: false}));



var Schema = mongoose.Schema;
var urlSchema = new Schema({
  original_url: {type: String, required: true},
  short_url: {type: Number, required: true}
});

var urlM = mongoose.model('url', urlSchema);

var createAndSaveUrl = function(urlObj, done) {
  var small = new urlM({ original_url: urlObj.original_url, short_url: urlObj.short_url});
    urlM.create(urlObj, function (err) {
      if (err) return null;
    });    
};


function isValidURL(string) {
  var res = string.match(/(http(s)?:\/\/.)?(www\.)?[-a-zA-Z0-9@:%._\+~#=]{2,256}\.[a-z]{2,6}\b([-a-zA-Z0-9@:%_\+.~#?&//=]*)/g);
  if (res == null)
    return false;
  else
    return true;
};

app.use('/public', express.static(process.cwd() + '/public'));



app.get('/', function(req, res){
  res.sendFile(process.cwd() + '/views/index.html');
});

//Show a list of current shortened URLs somewhere?
//Could also check if a URL is already in database

app.post("/api/shorturl/new", function (req, res) {
  var max;
  var postUrl = req.body.url;
    
  if (isValidURL(postUrl)){
    urlM.find({}, (err,results)=>{
      if(results.length>0){
        max = results[0].short_url;
        max += 1;
      }else{
        max = 1;
      }
      createAndSaveUrl({original_url: postUrl, short_url: max});
      res.json({original_url: req.body.url, short_url: "https://fcc-project3-url-shortener.glitch.me/api/shorturl/"+max});       
    }).sort([['short_url', -1]]);  
  }else{
    res.json({error: "You POSTed an invalid URL."});
  }
});

app.get("/api/shorturl/:short", (req, res) =>{
  var shortUrl = req.params.short;
  console.log(shortUrl);
  urlM.find({short_url: shortUrl}, (err,results)=>{
    if(results.length>0){
      var urlToRedirect = results[0].original_url;      
      res.redirect(urlToRedirect);
    }else{
      res.json({error: "There is no url that matches " + shortUrl});
    } 
  }).sort([['short_url', -1]]); 
})

app.listen(port, function () {
  console.log('Node.js listening ...');
});