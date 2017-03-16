'use strict';
// Library containing Toast helper functions for authenticating and accessing orders for the current client.
var library = (function () {
    var request = require('request');
    var rp = require('request-promise');
    var d3 = require("d3");
    var nodemailer = require('nodemailer')
    var util = require('util');
    // var baseUrl = "https://ws-sandbox.eng.toasttab.com";
    var baseUrl = "https://ws-sandbox-api.eng.toasttab.com/";
    var authUrl = baseUrl + "usermgmt/v1/oauth/token";
    var orderDateUrl = baseUrl + "orders/v2/orders";
    var orderInfoUrl = baseUrl + "orders/v2/orders"; 

    var clientId = "toast-sweetmandy"
    var namingAuth = "TSTSWEETMANDY"
    var secretKey = process.env.MANDY_SECRET || null;
    var restaurantGuid = "d24417d1-fd75-41b8-a45f-c80d9cb41195";

    var emailSource = "transientglasses@gmail.com";
    var emailPass = process.env.EMAIL_PASS || null;
    // Comma-separated list of recipients for the pre-order emails.
    var emailRecipients = "cbuonocore@toasttab.com, mhuh@toasttab.com";//, fasdfasf@adsfsdf.com";
    console.log(emailPass)

    // create reusable transporter object using the default SMTP transport
    var transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
            user: emailSource, 
            pass: emailPass 
        }
    });

    // setup email data with unicode symbols
    function createMailOptions(subject, body) {
        // body = '<b>Hello world</b>';
        let mailOptions = {
            from: '"Toast PreOrders 👻" <' + emailSource + '>', // sender address
            to: emailRecipients, // list of receivers
            subject: subject, // 'Hello ✔', // Subject line
            text: 'Toast Preorders Text',
            html: body// html body
        };
        return mailOptions;
    }

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
        console.log(options.uri);
        return rp(options);
    }

    function getOrdersForDate(token, date) {
        // GET request.
        var options = {
            uri: orderDateUrl + "?businessDate=" + date,
            headers: {
                'User-Agent': 'Request-Promise',
                'Authorization': util.format('Bearer %s', token),
                'Toast-Restaurant-External-ID': restaurantGuid 
            },
            body: {
                businessDate: date
            },
            json: true // Automatically parses the JSON string in the response
        };
        console.log(options.uri);
        return rp(options);
    }

    // Retrieves information for a particular order.
    function getOrderInformation(token, guid, dateString) {
        var options = {
            method: "GET",
            uri: orderInfoUrl + "/" + guid,
            headers: {
                'User-Agent': 'Request-Promise',
                'Authorization': util.format('Bearer %s', token),
                'Toast-Restaurant-External-ID': restaurantGuid
            },
            json: true // Automatically parses the JSON string in the response
        };
        console.log(options.uri);
        return rp(options);
    }


    // TODO: Helper Functions for requesting and aggregating pre-order data by date.

    // ** Aggregating Order Information ** //

    function recursiveGetInfo(token, aggregated, orders, dateString) {
        if (orders.length == 0) {
            // Completed order processing.
            // console.log("Aggregated: " + JSON.stringify(aggregated));
            var quantityMap = parseModifiersFromAggregate(aggregated);
            console.log('qtyMap: ' + JSON.stringify(quantityMap));
            sendOrderEmail(dateString, quantityMap); 
            return quantityMap; 
        }
        var order = orders[0];
        getOrderInformation(token, order, dateString).then(function(res) {
            // console.log('Order ' + order + ": " + res);
            aggregated[order] = res;
            return recursiveGetInfo(token, aggregated, orders.slice(1), dateString);
        }).catch(function(err) {
            console.error('Error: Order ' + order + ": " + err);
            // aggregated[order] = err;
            return recursiveGetInfo(token, aggregated, orders.slice(1), dateString);
        });
    }

    function aggregateOrders(token, dateString) {
        var aggregated = {};
        getOrdersForDate(token, dateString).then(function(res) {
            var orders = res;
            console.log('orders: ' + orders.length);
            return recursiveGetInfo(token, aggregated, orders, dateString);
        }).catch(function(err) {
            console.error("Fatal %s", err);
            return aggregated;
        });
    }

    // ** Emailing ** //

    function sendOrderEmail(dateString, quantityMap) {
        var mailOptions = createMailOptions("Toast PreOrders for " + dateString, generateEmailContent(quantityMap));
        // send mail with defined transport object.
        transporter.sendMail(mailOptions, (error, info) => {
            if (error) {
                return console.error("Email Error: " + error);
            }
            console.log('Message %s sent: %s', info.messageId, info.response);
        });
    }

    function parseModifiersFromAggregate(aggregateOrders) {
        var quantityMap = {}
        Object.keys(aggregateOrders).forEach(function(key) {
            var order = aggregateOrders[key];
            console.log("Parsing order: " + JSON.stringify(order));
            var checks = order['checks'];
            checks.forEach(function(check) {
                var selections = check['selections'];
                selections.forEach(function(sel) {
                    var selDispName = sel.displayName;
                    var modifiers = sel.modifiers;
                    if (!quantityMap.hasOwnProperty(selDispName)) {
                        quantityMap[selDispName]= {};
                    }
                    for (var j in modifiers) {
                        var modifier = modifiers[j];
                        var modDispName = modifier.displayName;
                        console.log(JSON.stringify(modDispName));
                        if (quantityMap[selDispName].hasOwnProperty(modDispName)) {
                            quantityMap[selDispName][modDispName] += modifier.quantity || 0;
                        } else {
                            quantityMap[selDispName][modDispName] = modifier.quantity || 0;
                        }
                    }
                });
            });
        });
        return quantityMap;
    }

    function generateEmailContent(quantityMap) {
        var htmlContent = util.format("<h2>Toast Preorders for %s</h2>", clientId); //util.inspect(quantityMap, {depth: null, colors: true}) 
        htmlContent += "<table><th>Selections</th><th>Modifiers</th><th>Quantities</th>"
        Object.keys(quantityMap).forEach(function(selection) {
            var mods = quantityMap[selection];
            var modKeys = Object.keys(mods);
            if (modKeys.length) {
                modKeys.forEach(function(mod) {
                    htmlContent += "<tr>"
                    htmlContent += util.format("<td>%s</td><td>%s</td><td>%s</td>", selection, mod, mods[mod]); 
                    htmlContent += "</tr>"
                });
            } else {
                htmlContent += "<tr>"
                htmlContent += util.format("<td>%s</td><td>%s</td><td>%s</td>", selection, "", "");
                htmlContent += "</tr>"
            }
        });
        htmlContent += "</table>"
        console.log(htmlContent);
        return htmlContent;
    }

    return {
        BASE_URL: baseUrl,
        CLIENT_ID: clientId,
        SECRET_KEY: secretKey,
        NAMING_AUTH: namingAuth,
        getAuthToken: getAuthToken,
        getOrdersForDate: getOrdersForDate,
        sendOrderEmail: sendOrderEmail,
        aggregateOrders: aggregateOrders
    };
})();
module.exports = library;