const tpl = require(__dirname + '/../vendor/tpl.js');
const qrcode = require('qrcode');
const { authenticator } = require('@otplib/preset-default');
const speakeasy = require('speakeasy');
const OTPAuth = require('otpauth');
const axios = require('axios');

/**
 * https://github.com/google/google-authenticator/wiki/Key-Uri-Format
 * https://hectorm.github.io/otpauth/
 * 
 * https://authenticatorapi.com/
 * https://www.authenticatorApi.com/pair.aspx?AppName=TropiPay&AppInfo=Antonio&SecretCode=AIIAW2DJBNCH2STD
 * https://www.authenticatorApi.com/Validate.aspx?Pin=804944&SecretCode=AIIAW2DJBNCH2STD
 */
class DefaultController {

    constructor() {
        this.lib = 'OTP';  //... OTP | OTPAUTH | Speakeasy
    }

    home(req, res) {
        let cache = tpl.getCache('token', 'json');
        let template = tpl.compile('home', cache);
        res.end(template);
    }

    generate(req, res) {
        this.lib = req.body['lib'] || this.lib;
        if(this.lib == 'GoogleAPI'){
            this['generate' + this.lib](req, res);
        }else{
            let token = this['generate' + this.lib](req.body);
            qrcode.toDataURL(token.otpauth, (err, qrsrc) => {
                console.log(err ? '>> Error with QR' : '>> Generated');
                token['qrsrc'] = qrsrc;
                token['verify'] = false;
                tpl.setCache('token', token);
                console.log("Token << " + JSON.stringify(token));
                res.redirect('/');
            });
        }
    }

    verify(req, res) {
        this.lib = req.body['lib'] || this.lib;
        if(this.lib == 'GoogleAPI'){
            this['verify' + this.lib](req, res);
        }else{
            let cache = this['verify' + this.lib](req.body);
            tpl.setCache('token', cache);
            res.redirect('/');
        }
    }

    //........................... lib OTPAUTH
    generateOTPAUTH(req) {
        let user = req['user'];
        let service = req['service'];
        var secret = 'NB2W45DFOIZA' //OTPAuth.Secret.fromB32('NB2W45DFOIZA');
        console.log(secret);
        let totp = new OTPAuth.TOTP({
            issuer: service,
            label: user,
            algorithm: 'SHA1',
            digits: 6,
            period: 30,
            secret
        });
        let expected = totp.generate();
        var otpauth = totp.toString();
        console.log("------------------------------- generate OTPAUTH ");
        console.log("TimeUsed << " + authenticator.timeUsed());
        console.log("TimeRemaining << " + authenticator.timeRemaining());
        return { token: '000000', expected, otpauth, user, service, secret };
    }
    verifyOTPAUTH(req) {
        try {
            let cache = tpl.getCache('token', 'json');
            let totp = new OTPAuth.TOTP({
                issuer: cache.service,
                label: cache.user,
                algorithm: 'SHA1',
                digits: 6,
                period: 30,
                secret: cache.secret
            });
            cache['expected'] = totp.generate();
            cache['token'] = req['token'];
            let out = totp.validate({ token: cache['token'], window: 1 }) ? 'Valid user' : 'Invalid user';
            console.log("-------------------------------------- verify OTPAUTH");
            console.log("verify:" + out);
            console.log("token:" + cache.token);
            console.log("expected:" + cache['expected']);
            console.log("--------------------------------------");
            cache['verify'] = out;
            return cache;
        } catch (err) {
            console.error(err);
            return {};
        }
    }
    //........................... lib OTP
    generateOTP(req) {
        const user = req['user'];
        const service = req['service'];
        var secret = authenticator.generateSecret();
        var expected = authenticator.generate(secret);
        var otpauth = authenticator.keyuri(user, service, secret);
        console.log("------------------------------- generate OTP ");
        console.log(authenticator.allOptions());
        console.log("TimeUsed << " + authenticator.timeUsed());
        console.log("TimeRemaining << " + authenticator.timeRemaining());
        return { token: '000000', expected, otpauth, user, service, secret };
    }
    verifyOTP(req) {
        let cache = tpl.getCache('token', 'json');
        cache['token'] = req['token'];
        cache['expected'] = authenticator.generate(cache.secret);
        try {
            let out = authenticator.check(cache.token, cache.secret) ? 'Valid user' : 'Invalid user';
            console.log("-------------------------------------- verify OTP");
            console.log("verify:" + authenticator.verify(cache));
            console.log("token:" + cache.token);
            console.log("expected:" + cache['expected']);
            console.log("--------------------------------------");
            cache['verify'] = out;
            return cache;
        } catch (err) {
            console.error(err);
            return {};
        }
    }
    //........................... lib Speakeasy
    generateSpeakeasy(req) {
        const user = req['user'];
        const service = req['service'];
        let token = speakeasy.generateSecret({ length: 20 });
        let secret = token['base32'];
        let otpauth = speakeasy.otpauthURL({ secret: secret, label: user, algorithm: 'sha1', digits: 6 });
        let expected = speakeasy.totp({
            secret: secret, encoding: "base32"
        });
        console.log("------------------------------- generate Speakeasy ");
        console.log("TimeRemaining << " + (30 - Math.floor((new Date()).getTime() / 1000.0 % 30)));
        return { token: '000000', expected, otpauth, user, service, secret };
    }
    verifySpeakeasy(req) {
        let cache = tpl.getCache('token', 'json');
        cache['token'] = req['token'];
        cache['expected'] = speakeasy.totp({ secret: cache.secret, encoding: "base32", digits: 6 });
        try {
            var out = speakeasy.totp.verify({ secret: cache.secret, encoding: "base32", token: cache.token, window: 0 }) ? 'Valid user' : 'Invalid user';
            console.log("-------------------------------------- verify Speakeasy ");
            console.log("verify:" + out);
            console.log("token:" + cache.token);
            console.log("expected:" + cache['expected']);
            console.log("--------------------------------------");
            cache['verify'] = out;
            return cache;
        } catch (err) {
            console.error(err);
            return {};
        }
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