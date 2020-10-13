const tpl = require(__dirname + '/../vendor/tpl.js');
const qrcode = require('qrcode');
const speakeasy = require('speakeasy');

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
        let token = this.generateSpeakeasy(req.body);
        qrcode.toDataURL(token.otpauth, (err, qrsrc) => {
            console.log(err ? '>> Error with QR' : '>> Generated');
            token['qrsrc'] = qrsrc;
            token['verify'] = false;
            tpl.setCache('token', token);
            console.log("Token << " + JSON.stringify(token));
            res.redirect('/');
        });
    }

    verify(req, res) {
        let cache = this.verifySpeakeasy(req.body);
        tpl.setCache('token', cache);
        res.redirect('/');
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

}

module.exports = DefaultController;