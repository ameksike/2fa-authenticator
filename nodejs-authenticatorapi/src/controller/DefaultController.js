const tpl = require(__dirname + '/../vendor/tpl.js');
const { authenticator } = require('@otplib/preset-default');
const axios = require('axios');

class DefaultController {

    constructor() {
    }

    home(req, res) {
        let cache = tpl.getCache('token', 'json');
        let template = tpl.compile('home', cache);
        res.end(template);
    }

    generate(req, res) {
        this.generateGoogleAPI(req, res);
    }

    verify(req, res) {
        this.verifyGoogleAPI(req, res);
    }


    //........................... lib GOOGLEAPI 
    generateGoogleAPI(req, res) {
        let user = req.body['user'];
        let service = req.body['service'];
        let secret = authenticator.generateSecret();
        console.log("------------------------------- generate GoogleAPI ");
        axios.get('https://www.authenticatorApi.com/pair.aspx', {
            params: {
                AppName: service,
                AppInfo: user,
                SecretCode: secret
            }
        })
        .then(function (response) {
            console.log("------------------------ response");
            console.log(response.data);
            let qrsrc = response.data.match(/src='(.*)'/);
            qrsrc = qrsrc[1];
            let resrc = { token: '000000', expected:'', user, service, secret, qrsrc };
            tpl.setCache('token', resrc);
            res.redirect('/');
        })
        .catch(function (error) {
            console.log("------------------------ error");
            console.log(error);
        });
    }
    verifyGoogleAPI(req, res) {
        var cache = tpl.getCache('token', 'json');
        cache['token'] = req.body['token'];
        console.log("-------------------------------------- verify GoogleAPI ");
        axios.get('https://www.authenticatorApi.com/Validate.aspx', {
            params: {
                Pin: cache['token'] ,
                SecretCode: cache['secret'] 
            }
        })
        .then(function (response) {
            console.log("------------------------ response");
            console.log(response.data);
            cache['verify'] = response.data == 'True' ? 'Valid user' : 'Invalid user';
            tpl.setCache('token', cache);
            res.redirect('/');
        })
        .catch(function (error) {
            console.log("------------------------ error");
            console.log(error);
        });
    }
}

module.exports = DefaultController;