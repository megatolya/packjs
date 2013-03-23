var inherit = require('inherit'),
    path = require('path');

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


module.exports = Tech;
