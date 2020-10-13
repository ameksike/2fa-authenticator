const tpl = require(__dirname + '/../vendor/tpl.js');
const qrcode = require('qrcode');
const { authenticator } = require('@otplib/preset-default');
/**
 * https://github.com/google/google-authenticator/wiki/Key-Uri-Format
 */
class DefaultController {

    constructor() {

    }

    home(req, res) {
        let cache = tpl.getCache('token', 'json');
        let template = tpl.compile('home', cache);
        res.end(template);
    }

    generate(req, res) {
        let token = this.generateOTP(req.body);
        qrcode.toDataURL(token.otpauth, (err, qrsrc) => {

            console.log(err ? '>> Error with QR' : '>> Generated');
            console.log(err);

            token['qrsrc'] = qrsrc;
            token['verify'] = false;
            tpl.setCache('token', token);

            console.log("Token << " + JSON.stringify(token));
            res.redirect('/');
        });
    }

    verify(req, res) {
        let cache = this.verifyOTP(req.body);
        tpl.setCache('token', cache);
        res.redirect('/');
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

}

module.exports = DefaultController;