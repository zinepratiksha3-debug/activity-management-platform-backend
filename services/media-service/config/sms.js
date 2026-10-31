const url = 'https://www.fast2sms.com/dev/otp/send';

const options = {
  method: 'POST',
  headers: {
    accept: 'application/json',
    Authorization: process?.env.SMS_KEY,
    'content-type': 'application/json'
  }
};

fetch(url, options)
  .then(res => res.json())
  .then(json => console.log(json))
  .catch(err => console.error(err));