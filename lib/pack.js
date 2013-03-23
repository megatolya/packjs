var fs = require('fs'),
    cheerio = require('cheerio'),
    path = require('path'),
    mkdirp = require('mkdirp'),
    async = require('async'),
    request = require('request'),
    inherit = require('inherit');

const INCLUDES_FILE = '__includes.js';
const IMPORTS_FILE = '__includes.css';

const FINAL_DEFAULT_NAME = '_';

function rmDir(dirPath) {
    try { var files = fs.readdirSync(dirPath); }
    catch(e) { return; }
    if (files.length > 0)
    for (var i = 0; i < files.length; i++) {
        var filePath = dirPath + '/' + files[i];
        if (fs.statSync(filePath).isFile())
        fs.unlinkSync(filePath);
        else
        rmDir(filePath);
    }
    fs.rmdirSync(dirPath);
}
function handleErr (err) {
    process.exit(0);
}

var Import = inherit({
    __constructor : function (opts) {
        this._opts = opts;
    },
    _js : [],
    _css : [],
    _opts : null,

    push : function(tech) {
        this['_' + tech.getExtension()].push(tech.withInclude(this._opts));
    },

    getText : function(ext) {
        return this['_' + ext].join('\n');
    }
});

var Tech = inherit({
    __constructor : function (src, index, isPlain) {
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
    },

    getName : function () {
        if (this._name)
                return this._name;

        var type = this.type,
            index = this.index,
            name;

        if (type === 'inline')
            name = '__plain__file__' + index + '.' + this.ext;
        if (type === 'web')
            name = '__web__file__' + index + '.' + this.ext;
        if (type === 'file') {
            name = require('node-uuid').v4() + '-' + this.src;
        }
        this._name = name;
        return name;
    },

    withInclude : function (opts) {
        if (this.type === 'file') {
            if (opts.copy) {
                this.finalPath = this.getName();
            } else {
                var pathToFile = path.resolve(path.join(path.dirname(opts.input), this.src));
                this.finalPath = path.relative(path.resolve(opts.output), pathToFile);
            }
        } else {
            this.finalPath = this.getName();
        }
    },

    getExtension : function() {
        return this.ext;
    }
});

var Script = inherit(Tech, {
    __constructor : function() {
        this.__base.apply(this, arguments);
        this.ext = 'js';
    },

    withInclude : function() {
        this.__base.apply(this, arguments);
        return '"borschik:include:' + this.finalPath + '";\n';
    }
});


var Style = inherit(Tech, {
    __constructor : function() {
        this.__base.apply(this, arguments);
        this.ext = 'css';
    },

    withInclude : function() {
        this.__base.apply(this, arguments);
        return '@import url(' + this.finalPath + ');\n';
    }
});


module.exports = {
    /*
     * TODO
     * input
     * output
     * copy
     * save << TODO removing temps
     * remove 
     */
    pack: function(opts) {
        fs.readFile(path.resolve(opts.input), 'utf8', function(err, html) {
            var $ = cheerio.load(html),
                scripts = ($('script')),
                styles = $('link, style'),
                queue = [];

            for (var i = 0; i < scripts.length; i++) {
                if (scripts[i].attribs.src) {
                    queue.push(new Script(scripts[i].attribs.src, i));
                } else {
                    queue.push(new Script(scripts[i].children[0].data, i, true));
                }
            }
            for (var i = 0; i < styles.length; i++) {
                if (styles[i].attribs.href) {
                    queue.push(new Style(styles[i].attribs.href, i));
                } else {
                    queue.push(new Style(styles[i].children[0].data, i, true));
                }
            }
            if (opts.remove)
                rmDir(path.resolve(opts.output), true);

            mkdirp(path.resolve(opts.output), function(err) {
                if (err)  handleErr(err);

                var tasks = [],
                    importsCSS = '',
                    importsJS = '',
                    imports = new Import(opts);

                for (var i = 0; i < queue.length; i++) {
                    var script = queue[i];
                        (function(i, script) {
                            tasks.push(function(callback) {
                                if (script.type === 'file') {
                                    if (opts.copy) {
                                        var pathToFile = path.resolve(path.join(path.dirname(opts.input), script.src));
                                        fs.readFile(pathToFile, 'utf8', function(err, data) {
                                            fs.writeFile(path.join(opts.output, script.getName()), data, function(err) {
                                                if (script.getExtension() === 'js')
                                                    importsJS += script.withInclude(opts);
                                                else
                                                    importsCSS += script.withInclude(opts);
                                                imports.push(script, opts);
                                                callback(null);
                                            });
                                        });
                                    } else {
                                        if (script.getExtension() === 'js')
                                            importsJS += script.withInclude(opts);
                                        else
                                            importsCSS += script.withInclude(opts);
                                        imports.push(script, opts);
                                        callback(null);
                                    }
                                } else if (script.type === 'inline') {

                                    fs.writeFile(path.join(opts.output, script.getName()), script.data, function (err) {
                                        if (err) handleErr(err);

                                        if (script.getExtension() === 'js')
                                            importsJS += script.withInclude(opts);
                                        else
                                            importsCSS += script.withInclude(opts);
                                        imports.push(script, opts);
                                        callback(null);
                                    });
                                } else {
                                    request(script.src, function(err, res, body) {
                                        if (err) handleErr(err);

                                        fs.writeFile(path.join(opts.output, script.getName()), body, function (err) {
                                            if (err) handleErr(err);

                                            if (script.getExtension() === 'js')
                                                importsJS += script.withInclude(opts);
                                            else
                                                importsCSS += script.withInclude(opts);
                                            imports.push(script, opts);
                                            callback(null);
                                        });
                                    })
                                }
                            });
                        })(i, script);
                    }
                    async.series(tasks, function(err) {
                        if (err) handleErr(err);

                        fs.writeFile(path.join(opts.output, INCLUDES_FILE), importsJS, function (err) {
                            fs.writeFile(path.join(opts.output, IMPORTS_FILE), importsCSS, function (err) {
                                var exec = require('child_process').exec;
                                path.resolve(path.join(opts.output, IMPORTS_FILE));
                                // TODO вынести
                                async.parallel([function(callback) {
                                    exec('./node_modules/borschik/bin/borschik -i ' + path.resolve(path.join(opts.output, IMPORTS_FILE)) + ' -m no -t css',
                                        function(err, out) {
                                            if (err) callback(err);

                                            fs.writeFile(path.join(opts.output, opts.name || FINAL_DEFAULT_NAME + '.css'), out, function(err) {
                                                if (err) callback(err);

                                                callback(null, err);
                                            });
                                        }
                                    );
                                }, function (callback) {
                                    exec('./node_modules/borschik/bin/borschik -i ' + path.resolve(path.join(opts.output, INCLUDES_FILE)) + ' -m no -t js',
                                        function(err, out) {
                                            if (err) handleErr(err);

                                            fs.writeFile(path.join(opts.output, opts.name || FINAL_DEFAULT_NAME + '.js'), out, function(err) {
                                                if (err) callback(err);

                                                callback(null);
                                            });
                                        }
                                    );
                                }], function (err, results) {
                                    // console.log('done');
                                });
                            });
                        });
                    });
                });
        });
    }
};
