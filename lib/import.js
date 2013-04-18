var inherit = require('inherit');

const INCLUDES_DEFAULT_NAME = 'includes.';
const FINAL_DEFAULT_NAME = '_.';

var Import = inherit({
    __constructor : function (opts) {
        if (!opts)
            throw new Error('Input file required');

        this._opts = opts || {};
    },
    _js : [],
    _css : [],
    _temp : [
        INCLUDES_DEFAULT_NAME + 'css',
        INCLUDES_DEFAULT_NAME + 'js'
    ],
    _opts : null,

    push : function(tech) {
        this['_' + tech.getExtension()].push(tech.withInclude(this._opts));
        if (tech.type !== 'file')
            this._temp.push(tech.getName());
        else
            this._temp.push(tech.getName());
    },

    getContent : function(ext) {
        return this['_' + ext].join('\n');
    },

    getFileName : function(ext, isResolved) {
        if (isResolved)
            return FINAL_DEFAULT_NAME + ext;

        return INCLUDES_DEFAULT_NAME + ext;
    }
});

module.exports = Import;
