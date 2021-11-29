const path = require('path');
const fs = require('fs');

var packagePath = path.resolve(__dirname, 'package.json')
var package = JSON.parse(fs.readFileSync(packagePath))

module.exports = {
    entry: './src/index.js',
    output: {
        library:{
            name: package.name,
            type: "umd",
        },
        filename: package.name+'.min.js',
        path: path.resolve(__dirname, 'build'),
    },
};
