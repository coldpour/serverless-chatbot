'use strict';

const aws = require('aws-sdk');
const kms = new aws.KMS();

module.exports = function(encrypted_token) {
  console.log('Decrypting token');

  const params = {
    CiphertextBlob: new Buffer(encrypted_token, 'base64')
  };

  return new Promise((resolve, reject) => {
    kms.decrypt(params, function(err, data) {
      if (err) {
        reject(err);
      } else {
        resolve(data.Plaintext.toString('utf-8'));
      }
    });
  });
};
