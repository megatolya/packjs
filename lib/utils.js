const ENCODING = 'utf8';

require('colors').setTheme({
    verbose: 'cyan',
    info: 'green',
    error: 'red'
});

function getTime() {
    var now = new Date,
        mins = now.getMinutes(),
        secs = now.getSeconds() < 10 ? '0' + now.getSeconds() : now.getSeconds();

    return mins + ':' + secs + ' ';
}

var _opts = '';

module.exports = {

    handleErr : function (err) {
        if (_opts.verbosity === 'info' || _opts.verbosity === 'verbose')
            this.error('Error!');
        console.log(err);
        throw err;
    },

    checkOpts : function (opts) {
        opts.encoding = opts.encoding || ENCODING;
        if (!opts.input)
            this.handleErr(new Error('no input file provided'));
        if (!opts.output)
            this.handleErr(new Error('no output directory provided'));

        _opts = opts;

    },

    verbose : function (msg) {
        if (_opts.verbosity === 'verbose')
            console.log(getTime() + 'verb '.verbose + msg.white);
    },

    info : function (msg) {
        if (_opts.verbosity === 'info' || _opts.verbosity === 'verbose')
            console.log(getTime() + 'info '.info + msg.white);
    },

    error : function (msg) {
        console.log(getTime() + 'err! '.error + msg.white);
    }
}

