'use strict';

const https = require('https');
const qs = require('querystring');

module.exports.endpoint = (event, context, callback) => {
    console.log('Received event:', event);

    const request = {
      token: 'xoxp-174814806819-174319201057-175713065623-29085567ab810fc9d0c512b3bbea0781'
    };

    const url = 'https://slack.com/api/users.list?' + qs.stringify(request);

    https.get(url, (res) => {
        res.setEncoding('utf8');
        let rawData = '';
        res.on('data', (chunk) => rawData += chunk);
        res.on('end', () => {
            try {
              console.log("Data:", JSON.parse(rawData));
            } catch (e) {
                console.log("Error:", e.message);
            }
        });
    });
};
