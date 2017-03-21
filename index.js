
/**
 * Nodejs server for aggregating and sending pre-order aggregated emails. 
 * Toast Hackathon  --- 3/16/2017
 * Authors: Chris Buonocore / Ming
 */

// ** Imports ** //

// Nodejs libraries.
var bodyParser = require("body-parser");
var cors = require('cors');
var d3 = require("d3");
var express = require("express");
var moment = require('moment');
var schedule = require('node-schedule');

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
    console.log('Retrieving auth token...');
    var promise = toast.getAuthToken();
    promise.then(function(res) {
        // console.log(res);
        token = res['access_token'];
        // console.log('token: ' + token);
        cb();
    }).catch(function(err) {
        console.error("Fatal: " + err);
    });
}

var SCHEDULED_HOUR = 9;

var nextScheduled = null;
function scheduleNextRunTime() {
    var now = moment(new Date());
    var runTime = moment(now).hours(SCHEDULED_HOUR).minutes(45).seconds(0)
    var nextRunTime = runTime;
    if (now.isAfter(runTime)) {
        nextRunTime = nextRunTime.add(1, 'days')
    }
    var formattedRunTime = nextRunTime.format('YYYYMMDD');
    schedule.scheduleJob(nextRunTime.toDate(), function() {
            getOrdersForDate(formattedRunTime);
            scheduleNextRunTime();
    });
    console.log("Scheduling next Preorder email for : " + nextRunTime.toDate() + 
        " (" + formattedRunTime + ")");
}

// ** Start Server ** //

var PORT = 3001;
// Authenticate prior to app start.
var runServer = false;
// yyyymmdd
if (runServer) {
    console.log("Setting up server...")
    appAuth(function() {
        app.listen(PORT,function(){
            console.log("Token retrieved.")
            console.log("Server started on port %d.", PORT);
            scheduleNextRunTime();
        });
    });
} else {
    // Retrieve orders now.
    appAuth(function() {
        var dateString = "20170317";
        getOrdersForDate(dateString);
    });
    // var content = 'Embedded image: <img src="cid:unique@kreata.ee"/>';
    // var attachments = [{
    //         filename: 'image.png',
    //         path: './chart.png',
    //         cid: 'unique@kreata.ee' //same cid value as in the html img src
    //     }];
    // toast.generateChartContent();
}
// toast.sendOrderEmail("Test JS chart", content, attachments);
