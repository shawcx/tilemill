if (global.__BonesPlugin__) {
    console.trace("\033[0;31mMultiple instances of bones are not supported.\033[0m");
    process.exit(4);
}

exports.$ = require('jquery')(new (require('jsdom').JSDOM)('').window);
exports._ = require('underscore');
exports.mirror = require('mirror');

// Command line arguments, parsed once on first use so that every module
// (and code that sets defaults before `start()`) shares the same object.
var argv;
Object.defineProperty(exports, 'argv', {
    enumerable: true,
    get: function() {
        if (!argv) {
            argv = require('minimist')(process.argv.slice(2));
            // `$0` as optimist reported it, for help output.
            argv.$0 = process.argv.slice(0, 2).map(function(x) {
                var rel = require('path').relative(process.cwd(), x);
                return x[0] === '/' && rel.length < x.length ? rel : x;
            }).join(' ');
        }
        return argv;
    }
});

exports.utils = require('bones/server/utils');
exports.middleware = require('bones/server/middleware');

exports.server = true;

exports.Backbone = require('bones/server/backbone');
exports.Controller = require('bones/server/controller');
exports.Model = require('bones/server/model');
exports.Collection = require('bones/server/collection');
exports.View = require('bones/server/view');
exports.Server = require('bones/server/server');
exports.Command = require('bones/server/command');

exports.load = function(dir) {
    return exports.plugin.load(dir);
};

exports.start = function(callback) {
    return exports.plugin.start(callback);
};

var Plugin = require('./server/plugin');
global.__BonesPath__ = require.resolve('bones');
exports.plugin = global.__BonesPlugin__ = new Plugin();
exports.plugin.load(__dirname);
