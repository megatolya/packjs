var inherit = require('inherit'),
    request = require('request'),
    fs = require('fs'),
    path = require('path'),
    isUrl =  /^((https?|ftp):)?\/\/.*\..*\//,
    uid = require('node-uuid').v4,
    u = require('./utils');

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
            name = uid() + '-' + this.src;
        }
        this._name = name;

        return name;
    },

    withInclude : function (opts) {
        this.finalPath = this.getName();
    },

    getExtension : function() {
        return this.ext;
    },

    prepareForImport : function(opts, callback) {
        var _this = this;

        if (_this.type === 'file') {
            u.verbose('Copying file: ' + this.getName().grey);

            var pathToFile = path.resolve(path.join(path.dirname(opts.input), _this.src));
            fs.readFile(pathToFile, opts.encoding, function (err, data) {
                if (err)  callback(err);

                fs.writeFile(path.join(opts.output, _this.getName()), data, function (err) {
                    if (err)  callback(err);

                    return callback(null);
                });
            });
        } else if (_this.type === 'inline') {
            u.verbose('Writing inline content to file: ' + this.getName().grey);
            fs.writeFile(path.join(opts.output, _this.getName()), _this.data, function (err) {
                if (err) u.handleErr(err);

                return callback(null);
            });
        } else {
            u.verbose('Downloading file: ' + this.src.grey);
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
