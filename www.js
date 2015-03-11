/*jslint node: true */
/*jslint nomen: true */
/*jslint plusplus: true */
'use strict';

var fs = require('fs');
var path = require('path');
var compress = require('compression');
var express = require('express');
var Curl = require('node-curl/lib/Curl');
var app = express();
var bodyParser = require('body-parser');

app.use(compress());
app.use(bodyParser.urlencoded({
    extended: true
}));
var http = require('http').Server(app);

var balance = 'pending';

function updateBalance() {
    var post_data = {
        jsonrpc: '2.0',
        method: 'getbalance',
        id: 'nodetestnetfaucet',
        params: {}

    };

    var curl = new Curl();
    curl.setopt('URL', 'http://localhost:18085/json_rpc');
    curl.setopt('POST', 1);
    curl.setopt('POSTFIELDS', JSON.stringify(post_data));

    var received = '';

    curl.on('data', function (chunk) {
        received += chunk;
        return chunk.length;
    });

    curl.on('header', function (chunk) {
        return chunk.length;
    });

    curl.on('error', function (e) {
        console.error('error get_bulk_payments', e, e.stack);
        curl.close();
    });

    curl.on('end', function () {
        try {

            console.log(received);
            var result = JSON.parse(received);

            balance = result.result.unlocked_balance / 1000000000000;

        } catch (ex) {
            console.error('error get_bulk_payments', ex, req, ex.stack);
        }

        curl.close();
    });

    curl.perform();
}

setInterval(updateBalance, 1000 * 60 * 1);
updateBalance();

app.get('/', function (req, res) {
    res.setHeader('Content-Type', 'text/html');
    res.setHeader("Cache-Control", "no-cache, no-store, must-revalidate");
    res.setHeader("Pragma", "no-cache");
    res.setHeader("Expires", 0);
    fs.readFile(path.join(__dirname, 'public', 'index.html'), function read(err, data) {
        if (err) {
            throw err;
        }
        res.end((data + '').replace('{{BALANCE}}', balance));
    });
});

app.post('/', function (req, res) {
    res.setHeader('Content-Type', 'text/html');
    res.setHeader("Cache-Control", "no-cache, no-store, must-revalidate");
    res.setHeader("Pragma", "no-cache");
    res.setHeader("Expires", 0);
    fs.readFile(path.join(__dirname, 'public', 'sent.html'), function read(err, data) {

        console.log('SEND 10XMR TO ' + req.body.rec);


        var post_data = {
            jsonrpc: '2.0',
            method: 'transfer',
            id: 'nodetestnetfaucet',
            params: {
                destinations: [
                    {
                        amount: 10 * 1000000000000,
                        address: req.body.rec
                    }

                ]
            }

        };

        var curl = new Curl();
        curl.setopt('URL', 'http://localhost:18085/json_rpc');
        curl.setopt('POST', 1);
        curl.setopt('POSTFIELDS', JSON.stringify(post_data));

        var received = '';

        curl.on('data', function (chunk) {
            received += chunk;
            return chunk.length;
        });

        curl.on('header', function (chunk) {
            return chunk.length;
        });

        curl.on('error', function (e) {
            console.error('error transfer', e, e.stack);
            curl.close();
        });

        curl.on('end', function () {
            try {

                var result = JSON.parse(received);
                
                updateBalance();
                res.end((data + '').replace('{{RESULT}}', JSON.stringify(result, null, 2)));

            } catch (ex) {
                console.error('error transfer', ex, req, ex.stack);
            }

            curl.close();
        });

        curl.perform();


    });
});

app.get('/favicon.ico', function (req, res) {
    res.setHeader('Content-Type', 'image/x-icon');
    res.setHeader("Cache-Control", "no-cache, no-store, must-revalidate");
    res.setHeader("Pragma", "no-cache");
    res.setHeader("Expires", 0);
    res.sendFile(path.join(__dirname, 'public', 'favicon.ico'));
});


http.listen(3002, function () {
    console.log('listening on *:3002');
});