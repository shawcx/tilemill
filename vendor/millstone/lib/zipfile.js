// Minimal pure-JS replacement for the native `zipfile` module's ZipFile API
// (`names` and `copyFile`), backed by adm-zip.
var fs = require('fs');
var AdmZip = require('adm-zip');

function ZipFile(file) {
    this._zip = new AdmZip(file);
    this.names = this._zip.getEntries().map(function(entry) {
        return entry.entryName;
    });
}

ZipFile.prototype.copyFile = function(name, dest, callback) {
    var data;
    try {
        data = this._zip.readFile(name);
        if (!data) throw new Error('could not read ' + name + ' from zip archive');
    } catch (err) {
        return callback(err);
    }
    fs.writeFile(dest, data, callback);
};

exports.ZipFile = ZipFile;
