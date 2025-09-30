const midtransClient = require('midtrans-client');
require('dotenv').config();


const isProduction = false; // untuk sandbox mode

const snap = new midtransClient.Snap({
    isProduction: isProduction,
    serverKey: process.env.MIDTRANS_SERVER_KEY,
    clientKey: process.env.MIDTRANS_CLIENT_KEY
});

const core = new midtransClient.CoreApi({
    isProduction: isProduction,
    serverKey: process.env.MIDTRANS_SERVER_KEY,
    clientKey: process.env.MIDTRANS_CLIENT_KEY
});

module.exports = {
    snap,
    core,
    isProduction
};
