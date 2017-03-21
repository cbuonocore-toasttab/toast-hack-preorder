# Toast Preorder Engine -- Nodejs Server
Toast Hackathon Project 

## Description
Server aggregates pre-orders for each day with a list of materials needed to fufill all the orders. 
Delivers email formatted with d3 charts and visualizations for the required materials.

## Dev Notes

### Starting the Server
* Set environment variable dependencies (see index.js for variable naming).
* npm install
* node index.js

Configurable to either send order email immediately, or start a server which is currently set to send pre-order emails every day at 8:00am each morning.

## Running Tests
* npm test

See the test/ folder.

## Meeting Notes - 3/10/16
1. Request for orders on a particular business date (returns all the orders that are associated with a particular day including pre-orders).
    1. This API call will return a list of orders. For each of those order, need to do another api call to get a list of contents for that order.
    2. Aggregate the list of contents for all the orders and dump into a table.
    3. There is support for exporting this information into a cvs, but this is currently very manual. The value-add of the project is to add automation to the pre-order report.
        1. Current way of delivery is to send an email (html formatted with charts, etc that shows the pre-order report.
        2. Report should have information on the core items (such as Cakes) and then the modifiers in a separate table 
    4. Stick to day-level aggregation in the reporting.
    5. Store the data used to generate an html report (perhaps in mongodb), do longer term analysis could be done without having to do repeat queries on the DB.
