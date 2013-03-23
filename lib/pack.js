var fs = require('fs'),
    cheerio = require('cheerio'),
    path = require('path'),
    mkdirp = require('mkdirp'),
    async = require('async'),
    Js = require('./js'),
    Css = require('./css'),
    Import = require('./import'),
    exec = require('child_process').exec,
    u = require('./utils');

const DEFAULTS_TECHS = ['css', 'js'];

/**
* TODO
* input
* output
* copy
* dirty << TODO removing temps
* verbose
* remove
*/
module.exports = function (opts) {
    u.checkOpts(opts);
    fs.readFile(path.resolve(opts.input), opts.encoding, function (err, html) {
        if (err)  u.handleErr(err);

        var $ = cheerio.load(html),
            scripts = ($('script')),
            styles = $('link, style'),
            queue = [];

        for (var i = 0; i < scripts.length; i++) {
            if (scripts[i].attribs.src) {
                queue.push(new Js(scripts[i].attribs.src, i));
            } else {
                queue.push(new Js(scripts[i].children[0].data, i, true));
            }
        }
        for (var i = 0; i < styles.length; i++) {
            if (styles[i].attribs.href) {
                queue.push(new Css(styles[i].attribs.href, i));
            } else {
                queue.push(new Css(styles[i].children[0].data, i, true));
            }
        }

        mkdirp(path.resolve(opts.output), function (err) {
            if (err)  u.handleErr(err);

            var tasks = [],
                imports = new Import(opts);

            for (var i = 0; i < queue.length; i++) {
                var tech = queue[i];
                    (function (i, tech) {
                        tasks.push(function (callback) {
                            tech.prepareForImport(opts, function(err) {
                                if (err) callback(err);

                                imports.push(tech);
                                callback(null);
                            });
                        });
                    })(i, tech);
            }
            async.series(tasks, function (err) {
                if (err) u.handleErr(err);

                async.parallel(saveImportsFiles(imports, opts), function (err) {
                    if (err) u.handleErr(err);

                    async.parallel(execBorschik(imports, opts), function (err) {
                            if (err) u.handleErr(err);

                            // DONE
                    });
                });
            });
        });
    });
};

function saveImportsFiles (imports, opts) {
    return DEFAULTS_TECHS.map(function (tech) {
        return function (callback) {
            fs.writeFile(path.join(opts.output, imports.getFileName(tech)), imports.getContent(tech), function (err) {
                if (err) callback(err);

                callback(null);
            });
        }
    });
}

function execBorschik (imports, opts) {
    return DEFAULTS_TECHS.map(function (tech) {
        return function (callback) {
            exec('./node_modules/borschik/bin/borschik -i ' + path.resolve(path.join(opts.output, imports.getFileName(tech))) + ' -m no -t ' + tech,
                function (err, out) {
                    if (err) callback(err);

                    fs.writeFile(path.join(opts.output, opts.name || imports.getFileName(tech, true)), out, function (err) {
                        if (err) callback(err);

                        callback(null);
                    });
                }
            );
        }
    });
}
