const ENCODING = 'utf8';

module.exports = {

    handleErr : function (err) {
        console.log(err);
        process.exit(1);
    },

    checkOpts : function (opts) {
        opts.encoding = opts.encoding || ENCODING;
        if (!opts.input)
            this.handleErr(new Error('no input file provided'));
        if (!opts.output)
            this.handleErr(new Error('no output directory provided'));
    }
}

