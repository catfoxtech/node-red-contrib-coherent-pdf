module.exports = function (RED) {
    'use strict';


    function CoherentPdfNode(config) {
        RED.nodes.createNode(this, config);

        this.squeeze = config.squeeze || false;

        const {exec} = require('child_process');
        const tmp = require('tmp');
        const fs = require('fs');

        let cpdf;
        if (process.platform === 'win32') {
            cpdf = __dirname + '/cpdf-binaries/Windows64bin/cpdf.exe';
        } else if (process.platform === 'darwin') {
            cpdf = __dirname + '/cpdf-binaries/OSX-Intel/cpdf';
        } else if (process.platform === 'linux') {
            cpdf = __dirname + '/cpdf-binaries/Linux-Intel-64bit/cpdf';
        }

        const node = this;

        this.on('input', async function (msg, _send, done) {
            const pages = msg.pages.map(function (page) {
                return parseInt(page) + 1;
            }).join(',');
            const input = tmp.tmpNameSync({postfix: '.pdf'});
            const output = tmp.tmpNameSync({postfix: '.pdf'});

            fs.writeFileSync(input, msg.payload);

            const command = [cpdf, input, pages, '-recrypt'];
            if (node.squeeze) {
                command.push('-squeeze');
            }
            command.push('-o', output);

            exec(command.join(' '), function (error, stdout, stderr) {
                if (error) {
                    if (done) {
                        done(error);
                    } else {
                        node.error(error.message, msg);
                    }
                } else {
                    node.log(stdout);
                    node.log(stderr);

                    msg.payload = fs.readFileSync(output);

                    _send(msg);
                    if (done) {
                        done();
                    }
                }
            });
        });
    }

    RED.nodes.registerType('coherentgraphics-cpdf-split', CoherentPdfNode);
}
