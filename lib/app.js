var app = require('commander'),
    fs = require('fs'),
    path = require('path');


fs.readFile(path.resolve('./package.json'), 'utf8',  function(err, data) {
    app
        .version(JSON.parse(data).version)
        .option('-i, --input [path]', 'html file')
        .option('-o, --output [path]', 'output dir')
        .option('-c, --copy', 'copy already existing in file system files')
        .option('--dirty', 'don\'t remove temp files after compiling')
        .option('--encoding [type]', 'Input files encoding')
        .parse(process.argv);

    if (!app.input) {
        return app.help();
    }

    if (!app.output)
        app.output = path.dirname(app.input);

    require('./pack.js')({
        input: app.input,
        output: app.output,
        copy: app.copy,
        dirty: app.dirty,
        encoding: app.encoding
    });

});
