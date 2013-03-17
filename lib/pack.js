var fs = require('fs'),
    cheerio = require('cheerio'),
    path = require('path'),
    mkdirp = require('mkdirp'),
    async = require('async'),
    request = require('request');

function handleErr (err) {
    console.log(err);
    throw err;
}

function Script (src, index, isPlain) {
    this.index = index;

    if (isPlain) {
        this.data = src;
        this.type = 'inline';
        return this;
    }
    var isUrl =  /^((https?|ftp):)?\/\/.*\..*\//;
    if (isUrl.test(src)) {
        this.type = 'web';
        this.src = src;
        this.data = null;
    } else {
        this.type = 'file';
        this.src = src;
        this.data = null;
    }
    return this;
}

Script.prototype.getName = function () {
    var type = this.type,
        index = this.index;

    if (type === 'inline')
        return '__plain__script__' + index + '.js';
    if (type === 'web')
        return '__web__script__' + index + '.js';
}


module.exports = {
    /*
     * TODO
     */
    pack: function(opts) {
        fs.readFile(path.resolve(opts.input), 'utf8', function(err, html) {
            var $ = cheerio.load(html),
                scripts = ($('script')),
                queue = [];

            for (var i = 0; i < scripts.length; i++) {
                if (scripts[i].attribs.src) {
                    queue.push(new Script(scripts[i].attribs.src, i));
                } else {
                    queue.push(new Script(scripts[i].children[0].data, i,  true));
                }
            }
            mkdirp(opts.output, function(err) {
                if (err)  handleErr(err);

                var tasks = [],
                    importsJs = '';

                for (var i = 0; i < queue.length; i++) {
                    var script = queue[i];
                        (function(i, script) {
                            tasks.push(function(callback) {
                                if (script.type === 'file') {
                                    importsJs += 'include(\'' + script.src + '\');\n';
                                    callback(null);
                                } else if (script.type === 'inline') {

                                    fs.writeFile(path.join(opts.output, script.getName()), script.data, function (err) {
                                        if (err) handleErr(err);

                                        importsJs += 'include(\'' + script.getName() + '\');\n';
                                        callback(null);
                                    });
                                } else {
                                    request(script.src, function(err, res, body) {
                                        if (err) handleErr(err);

                                        fs.writeFile(path.join(opts.output, script.getName()), body, function (err) {
                                            if (err) handleErr(err);

                                            importsJs += 'include(\'' + script.getName() + '\');\n';
                                            callback(null);
                                        });
                                    })
                                }
                            });
                        })(i, script);
                    }
                async.parallel(tasks, function(err) {
                    if (err) handleErr(err);
                    console.log('done');

                    console.log(importsJs);
                });
            });
        });
    }
};
