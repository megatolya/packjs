var inherit = require('inherit'),
    Tech = require('./tech');

var Css = inherit(Tech, {
    __constructor : function() {
        this.__base.apply(this, arguments);
        this.ext = 'css';
    },

    withInclude : function() {
        this.__base.apply(this, arguments);
        return '@import url(' + this.finalPath + ');\n';
    }
});

module.exports = Css;
