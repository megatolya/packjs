var app = require('commander'),
    fs = require('fs'),
    path = require('path'),
    jsonPath = path.resolve(path.join(__dirname, '../package.json'));

fs.readFile(jsonPath, 'utf8',  function(err, data) {
    app
        .version(JSON.parse(data).version)
        .option('-i, --input [path]', 'Input html file')
        .option('-o, --output [path]', 'Output dir')
        .option('--verbose', 'Show full log')
        .option('--with-inline', 'include inline scripts and styles in final files')
        .option('--encoding [type]', 'Input files encoding')
        .option('--dirty', 'Don\'t remove temp files after compiling')
        .parse(process.argv);

    require('./pack.js')({
        input: app.input,
        output:  app.output || path.dirname(app.input),
        dirty: app.dirty || false,
        encoding: app.encoding,
        verbosity: app.verbose ? 'verbose' : 'info',
        withInline: app.withInline || false
    });

});
