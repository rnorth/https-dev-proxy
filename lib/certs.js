var forge = require('node-forge'),
    mkdirp = require('mkdirp'),
    fs = require('fs'),
    colors = require('colors'),
    os = require('os');

var pki = forge.pki;

var createCA = function (configPath, caKeyPath, caCertPath) {

    try {
        fs.statSync(caKeyPath);
        fs.statSync(caCertPath);

        console.log('Certificate Authority key material already exists under ' + configPath);
        return;
    } catch (err) {

    }

    console.log('Creating a new Certificate Authority in ' + configPath);
    var keys = pki.rsa.generateKeyPair(2048);
    var cert = pki.createCertificate();
    cert.publicKey = keys.publicKey;

    cert.serialNumber = '01';
    cert.validity.notBefore = new Date();
    cert.validity.notAfter = new Date();
    cert.validity.notAfter.setFullYear(cert.validity.notBefore.getFullYear() + 1);

    var attributes = [
        {
            name: 'commonName',
            value: 'xip.io'
        },
        {
            name: 'organizationName',
            value: 'Test'
        }
    ];
    cert.setSubject(attributes);
    cert.setIssuer(attributes);
    cert.setExtensions([
        {
            name: 'basicConstraints',
            cA: true
        },
        {
            name: 'keyUsage',
            keyCertSign: true
        }
        //},
        //{
        //    name: '2.5.29.30',
        //    value: 'permitted;DNS:xip.io'
        //
        //}
    ]);

    cert.sign(keys.privateKey, forge.md.sha256.create());

    var keyPem = pki.privateKeyToPem(keys.privateKey);
    var certPem = pki.certificateToPem(cert);

    fs.writeFileSync(caKeyPath, keyPem);
    fs.writeFileSync(caCertPath, certPem);

    console.log('New Certificate Authority created'.green);
    console.log('IMPORTANT: You must import the new CA Cert into your system and set it to trusted!'.yellow);
    console.log('If you don\'t do this, requests to the HTTPS proxy'.yellow + ' WILL FAIL'.red);
    console.log(('The CA certificate that you need to import is: ' + caCertPath).yellow);

    if (os.type() === 'Darwin') {
        console.log("For Mac OS X, you should import this certificate AND change its trust setting for 'X.509 Basic Policy' to 'Always Trust'".yellow);
        //console.log("The following command will accomplish this:".yellow);
        //console.log("\n    sudo security add-trusted-cert -d -r trustRoot -p basic " + caCertPath)
    }
};

var loadCA = function (caKeyPath, caCertPath) {

    var keyPem = fs.readFileSync(caKeyPath, 'utf8');
    var certPem = fs.readFileSync(caCertPath, 'utf8');

    return {
        privateKey: pki.privateKeyFromPem(keyPem),
        certificate: pki.certificateFromPem(certPem),
        keyPem: keyPem,
        certPem: certPem
    }
};

var CertificateAuthority = function (opts) {

    var configPath = opts.baseDirectory + '/.dev-proxy';
    mkdirp.mkdirp.sync(configPath);

    var caKeyPath = configPath + '/' + os.hostname() + '-ca-key.pem';
    var caCertPath = configPath + '/' + os.hostname() + '-ca-cert.pem';

    createCA(configPath, caKeyPath, caCertPath);

    var ca = loadCA(caKeyPath, caCertPath);

    this.assetsForDomain = function (domain) {

        var keyPath = configPath + '/' + domain + '-key.pem';
        var certPath = configPath + '/' + domain + '-cert.pem';

        try {
            fs.statSync(keyPath);
            fs.statSync(certPath);

            console.log('Key material for domain ' + domain + ' already exists');
            return {
                cert: fs.readFileSync(certPath, 'utf8'),
                key: fs.readFileSync(keyPath, 'utf8'),
                certPath: certPath,
                keyPath: keyPath
            }
        } catch (err) {
        }

        console.log('Creating Certificate for ' + domain);
        var keys = pki.rsa.generateKeyPair(2048);
        var cert = pki.createCertificate();
        cert.publicKey = keys.publicKey;

        cert.serialNumber = '02';
        cert.validity.notBefore = new Date();
        cert.validity.notAfter = new Date();
        cert.validity.notAfter.setFullYear(cert.validity.notBefore.getFullYear() + 1);

        var attributes = [
            {
                name: 'commonName',
                value: domain
            },
            {
                name: 'organizationName',
                value: 'Test'
            }
        ];
        cert.setSubject(attributes);
        cert.setIssuer(ca.certificate.subject.attributes);

        cert.sign(ca.privateKey, forge.md.sha256.create());

        var keyPem = pki.privateKeyToPem(keys.privateKey);
        var certPem = pki.certificateToPem(cert);

        fs.writeFileSync(keyPath, keyPem);
        fs.writeFileSync(certPath, certPem);

        return {
            cert: certPem,
            key: keyPem,
            certPath: certPath,
            keyPath: keyPath
        }
    };

    this.caCert = function () {
        return ca.certPem;
    }
};

exports = module.exports || {};

exports.ca = function (baseDirectory) {
    return new CertificateAuthority({
        baseDirectory: baseDirectory
    });
};