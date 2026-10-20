var Backbone = require('./backbone');
var _ = require('underscore');
var express = require('express');
var middleware = require('..').middleware;

require('./compat');

module.exports = Server;
function Server(plugin) {
    // Each server is an express application. Give the app this server's
    // prototype chain so subclass methods and properties are available on it,
    // while express' own methods stay on the app itself.
    var app = express();
    Object.setPrototypeOf(app, Object.getPrototypeOf(this));
    app._errorHandlers = [];
    app.del = app['delete'];
    app.listen = Server.prototype.listen;
    app.plugin = plugin;
    app.initialize.apply(app, arguments);
    app.conclude.apply(app, arguments);
    return app;
};

Server.prototype = Object.create(Function.prototype);
Server.prototype.constructor = Server;

_.extend(Server.prototype, Backbone.Events, {
    initialize : function(plugin) {},

    conclude: function(plugin) {
        // Add catchall 404 middleware and error handler for root servers.
        // Error handlers registered with `error()` run before the default
        // one, as they did in express 2.
        if (this.port) {
            this.use(middleware.notFound());
            this._errorHandlers.forEach(function(fn) { this.use(fn); }, this);
            this.use(middleware.showError());
        } else {
            this._errorHandlers.forEach(function(fn) { this.use(fn); }, this);
        }
    },

    port: null,

    // express 2 `app.error(fn)` compatibility.
    error: function(fn) {
        this._errorHandlers.push(fn);
        return this;
    },

    listen: function() {
        var server = require('http').createServer(this);
        this.httpServer = server;
        return server.listen.apply(server, arguments);
    },

    address: function() {
        return this.httpServer ? this.httpServer.address() : null;
    },

    close: function(callback) {
        if (this.httpServer) this.httpServer.close(callback);
        return this;
    },

    start: function(callback) {
        this.port && this.listen(this.port, callback);
        return this;
    },

    toString: function() {
        if (this.port) {
            return '[Server ' + this.constructor.title + ':' + this.address().port + ']';
        } else {
            return '[Server ' + this.constructor.title + ']';
        }
    }
});

Server.augment = Backbone.Controller.augment;
Server.extend = Backbone.Controller.extend;
Server.toString = function() {
    return '<Server ' + this.title + '>';
};
