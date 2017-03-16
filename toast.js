'use strict';
// Library containing Toast helper functions for authenticating and accessing orders for the current client.
var library = (function () {
    var d3 = require("d3");
    var fs = require('fs');
    var moment = require('moment');
    var nodemailer = require('nodemailer')
    var request = require('request');
    var rp = require('request-promise');
    var util = require('util');
    var inlineCss = require('nodemailer-juice');

    var cssCode = require('./cssCode').cssCode;

    // var baseUrl = "https://ws-sandbox.eng.toasttab.com";
    var baseUrl = "https://ws-sandbox-api.eng.toasttab.com/";
    var authUrl = baseUrl + "usermgmt/v1/oauth/token";
    var orderDateUrl = baseUrl + "orders/v2/orders";
    var orderInfoUrl = baseUrl + "orders/v2/orders"; 

    var clientId = "toast-sweetmandy"
    var namingAuth = "TSTSWEETMANDY"
    var companyName = "SweetMandy";
    var secretKey = process.env.MANDY_SECRET || null;
    var restaurantGuid = "d24417d1-fd75-41b8-a45f-c80d9cb41195";

    var emailSource = "transientglasses@gmail.com";
    var emailPass = process.env.EMAIL_PASS || null;
    // Comma-separated list of recipients for the pre-order emails.
    var emailRecipients = "cbuonocore@toasttab.com, mhuh@toasttab.com";//, fasdfasf@adsfsdf.com";

    // create reusable transporter object using the default SMTP transport
    var transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
            user: emailSource, 
            pass: emailPass 
        }
    });
    transporter.use('compile', inlineCss());

    // setup email data with unicode symbols
    function createMailOptions(subject, body, attachments) {
        // body = '<b>Hello world</b>';

        let mailOptions = {
            from: '"Toast PreOrders 👻" <' + emailSource + '>', // sender address
            to: emailRecipients, // list of receivers
            subject: subject, // 'Hello ✔', // Subject line
            text: 'Toast Preorders Text',
            html: body// html body
        };
        if (attachments != undefined && attachments != null) {
            mailOptions.attachments = attachments;
        }
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
            // fs.writeFile('test/agg2.txt', JSON.stringify(aggregated), (err) => {
            //     if (err) throw err;
            //     console.log('It\'s saved!');
            // });

            // console.log('qtyMap: ' + JSON.stringify(quantityMap));
            var day = moment(dateString, "YYYYMMDD");
            var formattedDate = day.format("MM-DD-YYYY");
            var content = generateEmailContent(quantityMap, formattedDate);
            sendOrderEmail("Toast PreOrders for " + formattedDate, content);
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

    function sendOrderEmail(subject, body, attachments) {
        var mailOptions = createMailOptions(subject, body, attachments);
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
                        var modName = modifier.displayName;
                        var subMods = [];
                        modifier.modifiers.forEach(function(subMod) {
                            subMods.push(subMod.displayName);
                        });
                        var subModName = "-";
                        if (subMods.length) subModName = subMods.join(", ");

                        console.log(JSON.stringify(modName) + ": " + subModName);

                        if (!quantityMap[selDispName].hasOwnProperty(modName)) {
                            quantityMap[selDispName][modName] = {};
                        }

                        if (quantityMap[selDispName][modName].hasOwnProperty(subModName)) {
                            quantityMap[selDispName][modName][subModName] += modifier.quantity || 0;
                        } else {
                            quantityMap[selDispName][modName][subModName] = modifier.quantity || 0;
                        }
                    }
                });
            });
        });
       fs.writeFile('test/exp2.txt', JSON.stringify(quantityMap), (err) => {
                if (err) throw err;
                console.log('It\'s saved!');
            })
        return quantityMap;
    }

    function generateEmailContent(quantityMap, dateString) {
        var htmlContent = cssCode;
        htmlContent += util.format("<h2>Toast Preorders for %s</h2>", companyName); //util.inspect(quantityMap, {depth: null, colors: true}) 
        htmlContent += util.format("%s<br/><hr/>", dateString); 
        htmlContent += "<table><th>Selections</th><th>Modifiers</th><th>SubModifiers</th><th>Quantities</th>"
        Object.keys(quantityMap).forEach(function(selection) {
            var mods = quantityMap[selection];
            var modKeys = Object.keys(mods);
            if (modKeys.length) {
                modKeys.forEach(function(mod) {
                    // console.log('mod: ' + JSON.stringify(mod));
                    Object.keys(mods[mod]).forEach(function(subMod) {
                        var qty = mods[mod][subMod];
                        htmlContent += "<tr>"
                        htmlContent += util.format("<td>%s</td><td>%s</td><td>%s</td><td>%s</td>", 
                            selection, mod, subMod, qty); 
                        htmlContent += "</tr>"
                    });
                });
            } else {
                htmlContent += "<tr>"
                htmlContent += util.format("<td>%s</td><td>%s</td><td>%s</td><td>%s</td>", selection, "", "", "");
                htmlContent += "</tr>"
            }
        });
        htmlContent += "</table>"
        // console.log(htmlContent);
        return htmlContent;
    }

    function generateChartContent() {
        var htmlContent = '<script src="https://code.highcharts.com/highcharts.js"></script>'
        htmlContent += '<script src="https://code.highcharts.com/modules/exporting.js"></script>'
        htmlContent += '<div id="container" style="min-width: 310px; height: 400px; max-width: 600px; margin: 0 auto"></div>';
        htmlContent += `<script>
       Highcharts.chart('container', {
    chart: {
        plotBackgroundColor: null,
        plotBorderWidth: null,
        plotShadow: false,
        type: 'pie'
    },
    title: {
        text: 'Browser market shares January, 2015 to May, 2015'
    },
    tooltip: {
        pointFormat: '{series.name}: <b>{point.percentage:.1f}%</b>'
    },
    plotOptions: {
        pie: {
            allowPointSelect: true,
            cursor: 'pointer',
            dataLabels: {
                enabled: true,
                format: '<b>{point.name}</b>: {point.percentage:.1f} %',
                style: {
                    color: (Highcharts.theme && Highcharts.theme.contrastTextColor) || 'black'
                }
            }
        }
    },
    series: [{
        name: 'Brands',
        colorByPoint: true,
        data: [{
            name: 'Microsoft Internet Explorer',
            y: 56.33
        }, {
            name: 'Chrome',
            y: 24.03,
            sliced: true,
            selected: true
        }, {
            name: 'Firefox',
            y: 10.38
        }, {
            name: 'Safari',
            y: 4.77
        }, {
            name: 'Opera',
            y: 0.91
        }, {
            name: 'Proprietary or Undetectable',
            y: 0.2
        }]
    }]
});</script>`;

        return htmlContent;
    }
    var Highcharts = require('highcharts'); 

    function generateChartContent() {
        var fs = require('fs');
        var myChart = Highcharts.chart('container', {
        chart: {
            type: 'bar'
        },
        title: {
            text: 'Fruit Consumption'
        },
        xAxis: {
            categories: ['Apples', 'Bananas', 'Oranges']
        },
        yAxis: {
            title: {
                text: 'Fruit eaten'
            }
        },
        series: [{
            name: 'Jane',
            data: [1, 0, 4]
        }, {
            name: 'John',
            data: [5, 7, 3]
        }]
    });
            myChart.exportChart({
                type: 'application/pdf',
                filename: 'my-pdf'
            });
        }

    return {
        BASE_URL: baseUrl,
        CLIENT_ID: clientId,
        SECRET_KEY: secretKey,
        NAMING_AUTH: namingAuth,
        getAuthToken: getAuthToken,
        getOrdersForDate: getOrdersForDate,
        sendOrderEmail: sendOrderEmail,
        aggregateOrders: aggregateOrders,
        generateChartContent: generateChartContent,
        parseModifiersFromAggregate: parseModifiersFromAggregate

    };
})();
module.exports = library;