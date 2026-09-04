// index.js
// where your node app starts

// init project
var express = require('express');
var app = express();


var cors = require('cors');
app.use(cors({optionsSuccessStatus: 200}));  

// http://expressjs.com/en/starter/static-files.html
app.use(express.static('public'));


app.get("/", function (req, res) {
  res.sendFile(__dirname + '/views/index.html');
});



app.get("/api/hello", function (req, res) {
  res.json({greeting: 'hello API'});
});


app.get("/api", function (req, res) {
  var now = new Date();
  res.json({
    unix: now.getTime(),
    utc: now.toUTCString()
  });
});


app.get("/api/:date", function (req, res) {
  var dateParam = req.params.date;
  var date;

  if (/^\d+$/.test(dateParam)) {
    date = new Date(parseInt(dateParam));
  } else {
    date = new Date(dateParam);
  }


  if (date.toString() === "Invalid Date") {
    res.json({ error: "Invalid Date" });
  } else {
    res.json({
      unix: date.getTime(),
      utc: date.toUTCString()
    });
  }
});


var listener = app.listen(process.env.PORT || 3000, function () {
  console.log('Your app is listening on port ' + listener.address().port);
});
