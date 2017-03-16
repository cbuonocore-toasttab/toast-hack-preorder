'use strict';
// Library containing Toast helper functions for authenticating and accessing orders for the current client.
var library = (function () {
    var request = require('request');
    var rp = require('request-promise');
    var util = require('util');
    var baseUrl = "https://ws-sandbox.eng.toasttab.com";
    var authUrl = "https://ws-sandbox-api.eng.toasttab.com/usermgmt/v1/oauth/token";

    var clientId = "toast-sweetmandy"
    var namingAuth = "TSTSWEETMANDY"
    var secretKey = process.env.MANDY_SECRET || null;

    var emailSource = "dafjkasf@dasfasf.com"
    // Comma-separated list of recipients for the pre-order emails.
    var emailRecipients = "cbuonocore@toasttab.com";

    function getAuthToken() {
        // POST request.
        var options = {
            method: "POST",
            uri: authUrl,
            form: {
                'grant_type': 'client_credentials',
                'client_id': clientId,
                'client_secret': secretKey
            },
            headers: {
                'User-Agent': 'Request-Promise',
                 /* 'content-type': 'application/x-www-form-urlencoded' */ // Set automatically
            },
            json: true // Automatically parses the JSON string in the response
        };
        return rp(options);
    }

    function getOrdersForDate(date, token) {
        // GET request.
        var options = {
            uri: baseUrl + ":10443/orders/v2/orders/", 
            headers: {
                'User-Agent': 'Request-Promise',
                'Authorization': util.format('Bearer %s', token)
            },
            body: {
                businessDate: date
            },
            json: true // Automatically parses the JSON string in the response
        };
        return rp(options);
    }

    function sendOrderEmail(date) {

    }

    // TODO: Helper Functions for requesting and aggregating pre-order data by date.

    function aggregateOrders(orders) {
        // TODO: implement
        return null;
    }

    function sendEmail(recipients) {

    }

    function generateEmailContent(orders) {

    }

    return {
        BASE_URL: baseUrl,
        CLIENT_ID: clientId,
        SECRET_KEY: secretKey,
        NAMING_AUTH: namingAuth,
        getAuthToken: getAuthToken,
        getOrdersForDate: getOrdersForDate,
        sendOrderEmail: sendOrderEmail
    };
        // aggregateOrders: aggregateOrders,
})();
module.exports = library;