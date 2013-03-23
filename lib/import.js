var inherit = require('inherit');

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

module.exports = Import;
