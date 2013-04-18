var app = require('commander'),
    fs = require('fs'),
    path = require('path'),
    jsonPath = path.resolve(path.join(__dirname, '../package.json'));

fs.readFile(jsonPath, 'utf8',  function(err, data) {
    app
        .version(JSON.parse(data).version)
        .option('-i, --input [path]', 'Input html file')
        .option('-o, --output [path]', 'Output dir')
        .option('-c, --copy', 'Copy already existing in file system files')
        .option('--dirty', 'Don\'t remove temp files after compiling')
        .option('--verbose', 'Show full log')
        .option('--encoding [type]', 'Input files encoding')
        .parse(process.argv);

    require('./pack.js')({
        input: app.input,
        output: app.output ? app.output : path.dirname(app.input),
        copy: app.copy,
        dirty: app.dirty,
        encoding: app.encoding,
        verbosity: app.verbose ? 'verbose' : 'info'
    });

});
