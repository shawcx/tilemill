if (typeof process !== 'undefined' && process.versions && process.versions.node) {
    module.exports = Backbone = require('backbone');
    _ = require('underscore');
    $ = require('jquery');
}

// Backbone 0.3 compatibility on top of Backbone 1.x. Bones and the code built
// on it were written against Backbone 0.3.3; the shims below keep its
// behavior where 1.x changed it.

// `Backbone.Controller` was renamed to `Backbone.Router` in 0.5.
Backbone.Controller = Backbone.Router;

// Routes: match 0.3, which tried routes in the order they were added (the
// first match wins) and did not escape regular expression characters in route
// strings, so routes like `.*\?goto=*path` and `/manual/:page?` work.
Backbone.History.prototype.route = function(route, callback) {
    this.handlers.push({route: route, callback: callback});
};
Backbone.Router.prototype._bindRoutes = function() {
    if (!this.routes) return;
    var routes = _.result(this, 'routes');
    _.each(_.keys(routes), function(route) {
        this.route(route, routes[route]);
    }, this);
};
Backbone.Router.prototype._routeToRegExp = function(route) {
    route = route.replace(/:([\w\d]+)/g, '([^\/]*)').replace(/\*([\w\d]+)/g, '(.*?)');
    return new RegExp('^' + route + '$');
};
Backbone.Router.prototype._extractParameters = function(route, fragment) {
    return route.exec(fragment).slice(1);
};

// Sync: 0.3 sync functions take `(method, model, success, error)`; 1.x calls
// `sync(method, model, options)`. Adapt old-style functions wherever they are
// assigned: `Backbone.sync` and any model or collection `sync`. The adapted
// function still accepts old-style calls, which some callers make directly.
function adaptSync(fn) {
    if (typeof fn !== 'function' || fn.length < 4 || fn.bonesLegacySync) return fn;
    var adapted = function(method, model, options) {
        if (typeof options === 'function' || arguments.length > 3) {
            return fn.apply(this, arguments);
        }
        options = options || {};
        var success = options.success, error = options.error;
        return fn.call(this, method, model, function(resp) {
            // 0.3 accepted a model as the response.
            if (resp instanceof Backbone.Model) resp = resp.attributes;
            options.bonesResponse = true;
            if (success) return success(resp);
        }, function(resp) {
            if (error) return error(resp);
        });
    };
    adapted.bonesLegacySync = fn;
    return adapted;
}

var bonesSync = adaptSync(Backbone.sync);
Object.defineProperty(Backbone, 'sync', {
    configurable: true,
    enumerable: true,
    get: function() { return bonesSync; },
    set: function(fn) { bonesSync = adaptSync(fn); }
});

_.each([Backbone.Model.prototype, Backbone.Collection.prototype], function(proto) {
    var defaultSync = proto.sync;
    Object.defineProperty(proto, 'sync', {
        configurable: true,
        get: function() { return this.bonesSync || defaultSync; },
        set: function(fn) {
            Object.defineProperty(this, 'bonesSync', {
                value: adaptSync(fn), writable: true, configurable: true
            });
        }
    });
});

// Validation: 0.3 validated on every `set` except silent ones and the one in
// the constructor, passed `validate` only the attributes being set, and
// reported failures to `options.error(model, error)` or as an `"error"` event.
Backbone.Model.prototype._validate = function(attrs, options) {
    if (!this.validate || !attrs || options.silent || options.validate === false) return true;
    if (this._previousAttributes === undefined) return true;
    var error = this.validationError = this.validate(attrs, options) || null;
    if (!error) return true;
    if (options.error) {
        // While handling a response, `options.error` has already been
        // wrapped by Backbone and takes just the error.
        if (options.bonesResponse) options.error(error);
        else options.error(this, error);
    } else {
        this.trigger('error', this, error, options);
    }
    this.trigger('invalid', this, error, _.extend(options, {validationError: error}));
    return false;
};

// 0.3 decided between create and update by the `id` property, which some
// models set directly (`this.id = 'config'`) rather than as an attribute.
Backbone.Model.prototype.isNew = function() {
    return !this.id;
};

// 0.3 collections replaced their contents on fetch (the `"refresh"` event,
// now `"reset"`) instead of merging.
var collectionFetch = Backbone.Collection.prototype.fetch;
Backbone.Collection.prototype.fetch = function(options) {
    return collectionFetch.call(this, _.extend({reset: true}, options));
};

// Views: 0.3 kept the constructor options as `this.options`, and unbound all
// handlers on `el` before delegating, so views that share an element
// (#drawer, #page, #popup) replace each other's handlers.
Backbone.View.prototype.preinitialize = function(options) {
    this.options = _.extend({}, this.options, options);
};
var delegateEvents = Backbone.View.prototype.delegateEvents;
Backbone.View.prototype.delegateEvents = function(events) {
    if (this.$el && this.$el.off) this.$el.off();
    return delegateEvents.call(this, events);
};

Backbone.Model.augment = Backbone.Collection.augment =
Backbone.Controller.augment = Backbone.View.augment = function(props) {
    var obj = this.prototype;
    for (var key in props) {
        if (typeof props[key] === 'function') {
            obj[key] = _.wrap(obj[key], props[key]);
        } else if (_.isArray(props[key])) {
            obj[key] = _.isArray(obj[key]) ? obj[key].concat(props[key]) : props[key];
        } else if (typeof props[key] === 'object') {
            obj[key] = _.extend({}, obj[key], props[key]);
        } else {
            obj[key] = props[key];
        }
    }

    return this;
};

var extend = Backbone.Controller.extend;
Backbone.Model.extend = Backbone.Collection.extend =
Backbone.Controller.extend = Backbone.View.extend = function(protoProps, staticProps) {
    var child = extend.apply(this, arguments);
    // Backbone 1.x copies the parent's static properties, including the
    // `title` bones uses to register components; each child gets its own.
    if (!(staticProps && 'title' in staticProps)) delete child.title;
    for (var key in this) {
        if (key === '__super__' || key === 'prototype' || key === 'title') continue;
        child[key] = this[key];
    }
    return child;
};

Backbone.View.prototype.html = function() {
    return $(this.el).html();
};
