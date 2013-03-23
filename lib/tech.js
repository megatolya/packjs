var inherit = require('inherit'),
    request = require('request'),
    fs = require('fs'),
    path = require('path'),
    isUrl =  /^((https?|ftp):)?\/\/.*\..*\//;

var Tech = inherit({
    __constructor : function (src, index, isPlain) {
        this.index = index;

        if (isPlain) {
            this.data = src;
            this.type = 'inline';
            return;
        }
        if (isUrl.test(src)) {
            this.type = 'web';
            this.src = src;
            this.data = null;
        } else {
            this.type = 'file';
            this.src = src;
            this.data = null;
        }
        return;
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
    },

    prepareForImport : function(opts, callback) {
        var _this = this;


        if (_this.type === 'file') {
            if (opts.copy) {
                var pathToFile = path.resolve(path.join(path.dirname(opts.input), _this.src));
                fs.readFile(pathToFile, opts.encoding, function (err, data) {
                    if (err)  callback(err);

                    fs.writeFile(path.join(opts.output, _this.getName()), data, function (err) {
                        if (err)  callback(err);

                        return callback(null);
                    });
                });
            } else {
                return callback(null);
            }
        } else if (_this.type === 'inline') {
            fs.writeFile(path.join(opts.output, _this.getName()), _this.data, function (err) {
                if (err) u.handleErr(err);

                return callback(null);
            });
        } else {
            request(_this.src, function (err, res, body) {
                if (err) u.handleErr(err);

                fs.writeFile(path.join(opts.output, _this.getName()), body, function (err) {
                    if (err) u.handleErr(err);

                    return callback(null);
                });
            })
        }
    }
});


module.exports = Tech;
