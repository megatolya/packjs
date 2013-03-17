var app = require('commander'),
    fs = require('fs'),
    path = require('path');


fs.readFile(path.resolve('./package.json'), 'utf8',  function(err, data) {
    app
        .version(JSON.parse(data).version)
        .option('-i, --input [path]', 'html file')
        .option('-o, --output [path]', 'output dir')
        .parse(process.argv);
    if (!app.input) {
        return app.help();
    }

    if (!app.output)
        app.output = path.dirname(app.input);

    require('./pack.js').pack({
        input: app.input,
        output: app.output
    });

});
