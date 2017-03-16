var fs = require('fs');
var toast = require('../toast');
var assert = require('assert');
var expect    = require("chai").expect;

var testAggFile1 = "test/agg1.txt";
var testAggFile2 = "test/agg2.txt";

describe("Order Parsing", function() {
    var data1;
    var data2;

    before(function(done){
       fs.readFile(testAggFile1, function read(err, data) {
            if (err) throw err;
            data1 = data;
            fs.readFile(testAggFile2, function read(err, data) {
                if (err) throw err;
                data2 = data;
                done();
            });
        });
    });

    it('Selection counts should match (3/25/17 data)', function() {
        var aggregate = JSON.parse(data1);
        var qtyMap = toast.parseModifiersFromAggregate(aggregate);
        var expected = {"Half Sheet 1-Layer Cake":{"1/2 Sheet - Devil's Food Cake":1,"Vanilla White Buttercream Icing":2,"Younger Kid's - Half Sheet":1,"H 3rd B Anna":1,"1/2 Sheet - Confetti Cake":1,"Suitcase Deco":1,"Pic in Box":1},"Smash Cake":{"Smash - Yellow Cake":1,"Vanilla White Buttercream Icing":1,"Writing Color in Red":1,"H1stB GREYSON!":1},"Open Decoration":{},"Carrot Cupcake":{},"Chocolate Cupcake Vanilla":{}};
        console.log(qtyMap);
        assert.deepEqual(expected, qtyMap);
    });

     it('Selection counts should match (3/26/17 data)', function() {
        var aggregate = JSON.parse(data2);
        var qtyMap = toast.parseModifiersFromAggregate(aggregate);
        var expected = {"Half Sheet 1-Layer Cake":{"1/2 Sheet - Devil's Food Cake":1,"Vanilla White Buttercream Icing":2,"Younger Kid's - Half Sheet":1,"H 3rd B Anna":1,"1/2 Sheet - Confetti Cake":1,"Suitcase Deco":1,"Pic in Box":1},"Smash Cake":{"Smash - Yellow Cake":1,"Vanilla White Buttercream Icing":1,"Writing Color in Red":1,"H1stB GREYSON!":1},"Open Decoration":{},"Carrot Cupcake":{},"Chocolate Cupcake Vanilla":{}};
        console.log(qtyMap);
        assert.deepEqual(expected, qtyMap);
     });
});

// describe("Email HTML Generation", function() {
//     var data1;
//     var data2;

//     before(function(done){
//        fs.readFile(testAggFile1, function read(err, data) {
//             if (err) throw err;
//             data1 = data;
//             fs.readFile(testAggFile2, function read(err, data) {
//                 if (err) throw err;
//                 data2 = data;
//                 done();
//             });
//         });
//     });

//     it('Selection counts should match (3/25/17 data)', function() {
//         var aggregate = JSON.parse(data1);
//         var qtyMap = toast.parseModifiersFromAggregate(aggregate);
//         var expected = {"Half Sheet 1-Layer Cake":{"1/2 Sheet - Devil's Food Cake":1,"Vanilla White Buttercream Icing":2,"Younger Kid's - Half Sheet":1,"H 3rd B Anna":1,"1/2 Sheet - Confetti Cake":1,"Suitcase Deco":1,"Pic in Box":1},"Smash Cake":{"Smash - Yellow Cake":1,"Vanilla White Buttercream Icing":1,"Writing Color in Red":1,"H1stB GREYSON!":1},"Open Decoration":{},"Carrot Cupcake":{},"Chocolate Cupcake Vanilla":{}};
//         console.log(qtyMap);
//         assert.deepEqual(expected, qtyMap);
//     });
// });