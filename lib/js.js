var inherit = require('inherit'),
    Tech = require('./tech');

var Js = inherit(Tech, {
    __constructor : function() {
        this.__base.apply(this, arguments);
        this.ext = 'js';
    },

    withInclude : function() {
        this.__base.apply(this, arguments);
        return '"borschik:include:' + this.finalPath + '";\n';
    }
});

module.exports = Js;
