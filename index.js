
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
var util = require('util');
var app  = express();

// Custom libraries.
var toast = require('./toast');

// ** Set App ** //

// Here we are configuring express to use body-parser as middle-ware.
// Enable form encoded.
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
app.use(cors())

// ** Routes ** //

var token = null;

function getOrdersForDate(dateString) {
    var promise = toast.getOrdersForDate(token, dateString);
    promise.then(function(res) {
        // console.log(res);
        toast.aggregateOrders(token, dateString);
    }).catch(function(err) {
        console.error("Fatal: " + err);
    });
}

// Tell express what to dowhen the /orders route is requested.
app.post('/orders', function(req, res){
    var dateString = req.body.dateString || null;
    var promise = toast.getOrdersForDate(dateString);
    promise.then(function(res) {
        // console.log(res);
        res.send({status: res});
    }).catch(function(err) {
        console.error("Fatal: " + err);
        res.send({status: err});
    });
});

// Tell express what to do when the /about route is requested.
app.post('/about', function(req, res){
    res.setHeader('Content-Type', 'application/json');
    var dateString = req.body.dateString || null;
    //mimic a slow network connection
    setTimeout(function(){
        res.send(JSON.stringify({
            firstName: req.body.firstName || null,
            lastName: req.body.lastName || null
        }));
    }, 1000)

    //logging output for the terminal
    // console.log('you posted: First Name: ' + req.body.firstName + ', Last Name: ' + req.body.lastName);
});

function appAuth(cb) {
    console.log('Retrieving auth token');
    var promise = toast.getAuthToken();
    promise.then(function(res) {
        // console.log(res);
        token = res['access_token'];
        console.log('token: ' + token);
        cb();
    }).catch(function(err) {
        console.error("Fatal: " + err);
    });
}

// ** Start Server ** //

var PORT = 3001;
// Authenticate prior to app start.
appAuth(function() {
    app.listen(PORT,function(){
        console.log("Started on PORT %d", PORT);
    });
    var dateString = "20170303";
    getOrdersForDate(dateString);
});
