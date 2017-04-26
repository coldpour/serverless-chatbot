'use strict';

const aws = require('aws-sdk');
const https = require('https');
const qs = require('querystring');
const request = require('request');
const s3 = new aws.S3();
const decrypt = require('./decrypt');

const getSignedUrl = function(bucket, key) {
    console.log('Getting signed url for bucket');

    return new Promise((resolve, reject) => {
        const params = {
            Bucket: bucket,
            Key: key,
            Expires: 604800
        };
        const url = s3.getSignedUrl('getObject', params);
        resolve(url);
    });
};

const getShortUrl = function(key, url) {
    console.log('Getting short url');

    return new Promise((resolve, reject) => {
        const req = {
            uri: process.env.SHORTENER_API_URL + qs.stringify({
                key
            }),
            method: 'POST',
            json: true,
            body: {
                longUrl: url
            }
        };

        request(req, (err, res, body) => {
            if (err && res.statusCode !== 200) {
                reject(err);
            } else {
                resolve(body.id);
            }
        });
    });
};

const writeToSlack = function(token, url) {
    console.log('Posting image back to slack');

    return new Promise((resolve, reject) => {
        const slackParams = {
            token,
            channel: process.env.CHANNEL_ID,
            text: url
        };

        const slackurl = process.env.POST_MESSAGE_URL + qs.stringify(slackParams);

        https.get(slackurl, (res) => {
            const statusCode = res.statusCode;
            resolve();
        });
    });
};

module.exports.execute = (event, context, callback) => {
    const bucket = event.Records[0].s3.bucket.name;
    const key = decodeURIComponent(event.Records[0].s3.object.key.replace(/\+/g, " "));
    let decrypted_bot_token = null;
    let decrypted_shortener_token = null;

    decrypt(process.env.BOT_ACCESS_TOKEN)
        .then((token) => decrypted_bot_token = token)
        .then(() => decrypt(process.env.SHORTENER_API_KEY))
        .then((token) => decrypted_shortener_token = token)
        .then(() => getSignedUrl(bucket, key))
        .then((url) => getShortUrl(decrypted_shortener_token, url))
        .then((url) => writeToSlack(decrypted_bot_token, url))
        .then(() => {
            console.log('Finished processing image');
            callback(null);
        })
        .catch((err) => {
            console.log(err);
            callback(err);
        });
};
