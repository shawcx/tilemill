// Useful filesystem utilities.
var fs = require('fs');
var Step = require('step');
var path = require('path');
var constants = require('constants');
var _ = require('underscore');
// node v6 -> v8 compatibility
var existsSync = require('fs').existsSync || require('path').existsSync;

var path_sep = process.platform === 'win32' ? '\\' : '/';

// Returns a file stat object with additional `data` and `basename` properties.
function read(filepath, callback) {
    fs.stat(filepath, function(err, stat) {
        if (err) return callback(err);
        fs.readFile(filepath, 'utf8', function(err, data) {
            if (err) return callback(err);
            stat.data = data;
            stat.basename = path.basename(filepath);
            callback(null, stat);
        });
    });
};

// Returns an array of stat objects with additional `basename` property.
function readdir(filepath, callback) {
    Step(function() {
        fs.readdir(filepath, this);
    },
    function(err, files) {
        if (err) return callback(err);
        if (!files.length) return callback(null, []);
        var s = function(file, attr, callback) {
            attr = attr || {};
            fs.stat(path.join(filepath, file), function(err, stat) {
                // Skip broken symlinks
                if (err && err.code !== 'ENOENT') return callback(err);
                if (stat) _(stat).extend(attr);
                callback(null, stat);
            });
        };
        var group = this.group();
        _(files).each(function(file) {
            s(file, {basename: file}, group());
        });
    },
    function(err, stats) {
        callback(err, _(stats).compact());
    });
};

// `mkdir -p`. Calls back with only an error, if any.
function mkdirp(dir, mode, callback) {
    if (typeof mode === 'function') {
        callback = mode;
        mode = undefined;
    }
    fs.mkdir(dir, { recursive: true, mode: mode }, function(err) {
        callback(err);
    });
};

function mkdirpSync(dir, mode) {
    fs.mkdirSync(dir, { recursive: true, mode: mode });
};

// `rm -rf`. Missing paths are not an error. Retries on ENOTEMPTY/EBUSY, as
// rimraf did, for directories that are still being written to.
function rm(filepath, callback) {
    fs.rm(filepath, { recursive: true, force: true, maxRetries: 5, retryDelay: 100 }, function(err) {
        callback(err);
    });
};

// Utility function. Implements a `cp -r` like method in node.
function cprSync(from, to) {
    var stat = fs.lstatSync(from);
    if (stat.isSymbolicLink()) {
        return;
    } else if (stat.isFile()) {
        mkdirpSync(path.dirname(to), 0755);
        fs.writeFileSync(to, fs.readFileSync(from));
    } else if (stat.isDirectory()) {
        mkdirpSync(to, stat.mode);
        var files = fs.readdirSync(from);
        if (!files.length) return;
        for (var i = 0; i < files.length; i++) {
            cprSync(path.join(from, files[i]), path.join(to, files[i]));
        }
    }
};

// poor man's windows drive detection because
// shelling out to `fsutil fsinfo drives`
// would require admin and there does not appear to be an
// ffi solution given https://github.com/Benvie/node-Windows/blob/ffi-registry/lib/driveAlias.js
// uses fsutil
function winDrives() {
    var letters = 'abcdefghijklmnopqrstuvwxyz'.split('').filter(function(s){
	    return existsSync(s+':\\');
	});
	return letters.map(function(s) { return s+':\\'});
}

module.exports = {
    read: read,
    readdir: readdir,
    mkdirp: mkdirp,
    mkdirpSync: mkdirpSync,
    cprSync: cprSync,
    rm: rm,
    winDrives: winDrives
};

