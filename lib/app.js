var app = require('commander'),
    fs = require('fs'),
    path = require('path');


fs.readFile(path.resolve('./package.json'), 'utf8',  function(err, data) {
    app
        .version(JSON.parse(data).version)
        .option('-i, --input [path]', 'html file')
        .option('-o, --output [path]', 'output dir')
        .option('-c, --copy', 'copy already existing in file system files')
        .option('-s, --save', 'don\'t remove temp files after compiling')
        .option('-r, --remove', 'remove all files from output dir before compiling')
        .parse(process.argv);

    if (!app.input) {
        return app.help();
    }

    if (!app.output)
        app.output = path.dirname(app.input);

    require('./pack.js').pack({
        input: app.input,
        output: app.output,
        copy: app.copy,
        save: app.save,
        remove: app.remove
    });

});
