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
* dirty << TODO removing temps
* verbose
* remove
* withInclude
*/
module.exports = function (opts) {
    u.verbose('Checking arguments');

    u.checkOpts(opts);

    u.verbose('Arguments is ok.');
    u.verbose('Going to read input file: ' + path.resolve(opts.input).grey);

    fs.readFile(path.resolve(opts.input), opts.encoding, function (err, html) {
        if (err)  u.handleErr(err);

        var $ = cheerio.load(html),
            scripts = ($('script')),
            styles = $('link, style'),
            queue = [];

        u.verbose('Parsing started');
        for (var i = 0; i < scripts.length; i++) {
            if (scripts[i].attribs.src) {
                queue.push(new Js(scripts[i].attribs.src, i));
            } else {
                if (opts.withInclude)
                    queue.push(new Js(scripts[i].children[0].data, i, true));
            }
        }
        for (var i = 0; i < styles.length; i++) {
            if (styles[i].attribs.href) {
                queue.push(new Css(styles[i].attribs.href, i));
            } else {
                if (opts.withInclude)
                    queue.push(new Css(styles[i].children[0].data, i, true));
            }
        }
        u.info('Parsing done');

        mkdirp(path.resolve(opts.output), function (err) {
            if (err)  u.handleErr(err);

            var tasks = [],
                imports = new Import(opts);

            u.info('Going to download and copy depended files');
            for (var i = 0; i < queue.length; i++) {
                var tech = queue[i];
                    (function (i, tech) {
                        u.verbose('Going to create file: ' + tech.getName().grey);
                        tasks.push(function (callback) {
                            tech.prepareForImport(opts, function(err) {
                                if (err) callback(err);

                                imports.push(tech);
                                u.verbose('Done creating for temp file: ' + tech.getName().grey);
                                callback(null);
                            });
                        });
                    })(i, tech);
            }
            async.series(tasks, function (err) {
                if (err) u.handleErr(err);

                u.info('Copying and downloading done');
                async.parallel(saveImportsFiles(imports, opts), function (err) {
                    if (err) u.handleErr(err);

                    async.parallel(execBorschik(imports, opts), function (err) {
                        if (err) u.handleErr(err);

                        u.info('Done for borschik');
                        if (!opts.dirty) {
                            u.verbose('Removing temp files');
                            var removing = imports._temp.map(function(file) {
                                return function (callback) {
                                    fs.unlink(path.resolve(path.join(opts.output, file)), function(err) {
                                        if (err) callback(err);

                                        callback(null);
                                    });
                                }
                            });
                            async.parallel(removing, function(err) {
                                if (err) u.handleErr(e);

                                u.info('Temp files removed');
                             });
                        }
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
            u.verbose('Executing borschik for tech: ' + tech);
            exec(path.resolve(path.join(__dirname, '../node_modules/borschik/bin/borschik -i ')) + path.resolve(path.join(opts.output, imports.getFileName(tech))) + ' -m no -t ' + tech,
                function (err, out) {
                    if (err) callback(err);

                    fs.writeFile(path.join(opts.output, opts.name || imports.getFileName(tech, true)), out, function (err) {
                        if (err) callback(err);

                        callback(null);
                        u.verbose('Borschik done for tech: ' + tech);
                    });
                }
            );
        }
    });
}
