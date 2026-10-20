// express 2 request/response API compatibility on top of express 4.
var http = require('http');
var express = require('express');

var req = express.request;
var res = express.response;

if (!res.__bonesCompat) {
    res.__bonesCompat = true;

    // `req.param(name)` looks in route params, then body, then query.
    req.param = function(name, defaultValue) {
        var params = this.params || {};
        var body = this.body || {};
        var query = this.query || {};
        if (params[name] != null && params.hasOwnProperty(name)) return params[name];
        if (body[name] != null) return body[name];
        if (query[name] != null) return query[name];
        return defaultValue;
    };

    // Supports the express 2 signatures:
    //   res.send(status)
    //   res.send(body, [headers], [status])
    //   res.send(body, status)
    // Objects are sent as JSON, or as JSONP when the app has
    // `jsonp callback` enabled and the request has a `callback` param.
    var send = res.send;
    res.send = function(body, headers, status) {
        if (arguments.length === 1 && typeof body === 'number') {
            if (!this.get('Content-Type')) this.type('txt');
            return send.call(this.status(body), http.STATUS_CODES[body] || String(body));
        }
        if (typeof headers === 'number') {
            status = headers;
            headers = null;
        }
        if (headers) this.set(headers);
        if (status) this.status(status);
        if (body === undefined) return send.call(this, '');
        if (body !== null && typeof body === 'object' && !Buffer.isBuffer(body)) {
            var callback = this.req && this.req.query && this.req.query.callback;
            if (callback && this.app && this.app.enabled('jsonp callback')) {
                return this.jsonp(body);
            }
            return this.json(body);
        }
        return send.call(this, body);
    };

    // express 4's json() and jsonp() call send() with a single string, which
    // the wrapper above passes straight through.

    // `res.redirect(url, status)`
    var redirect = res.redirect;
    res.redirect = function(url, status) {
        if (typeof status === 'number') return redirect.call(this, status, url);
        return redirect.apply(this, arguments);
    };

    // `res.sendfile(path, options, [callback])` with the express 2 `hidden`
    // option for dotfiles. Errors go to the next error handler.
    res.sendfile = function(path, options, callback) {
        if (typeof options === 'function') {
            callback = options;
            options = {};
        }
        options = Object.assign({}, options);
        if (options.hidden) options.dotfiles = 'allow';
        delete options.hidden;
        var self = this;
        return this.sendFile(path, options, callback || function(err) {
            if (err && self.req.next) self.req.next(err);
        });
    };
}
