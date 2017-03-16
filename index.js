
/**
 * Nodejs server for aggregating and sending pre-order aggregated emails. 
 * Toast Hackathon  --- 3/16/2017
 * Authors: Chris Buonocore / Ming
 */

// ** Imports ** //

// Nodejs libraries.
var express = require("express");
var bodyParser = require("body-parser");
var cors = require('cors');
var d3 = require("d3");
var app  = express();

// Custom libraries.
var toast = require('toast');

// ** Set App ** //

// Here we are configuring express to use body-parser as middle-ware.
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
app.use(cors())

// ** Routes ** //


//tell express what to do when the /about route is requested
app.post('/form', function(req, res){
    res.setHeader('Content-Type', 'application/json');

    //mimic a slow network connection
    setTimeout(function(){

        res.send(JSON.stringify({
            firstName: req.body.firstName || null,
            lastName: req.body.lastName || null
        }));

    }, 1000)

    //debugging output for the terminal
    console.log('you posted: First Name: ' + req.body.firstName + ', Last Name: ' + req.body.lastName);
});

// ** Start Server ** //

var PORT = 3001;
app.listen(PORT,function(){
  console.log("Started on PORT %d", PORT);
});