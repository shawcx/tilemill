// Client-side `Backbone.View` overrides. Adds an `attach()` method that can be
// triggered after `render()` to allow client-side specific JS event handlers,
// UI libraries to be attached or inited. `template()` and `html()` are mirrors
// of their server-side counterparts for templating and easy generation of a
// View's HTML contents.
Backbone.View.augment({
    attach: function() {},
    preinitialize: function(parent, options) {
        parent.call(this, options);
        this.bind('attach', this.attach);
    }
});

// Hash URLs keep their leading slash (`#/project/foo` routes as
// `/project/foo`), as in Backbone 0.3. Older `#!/...` URLs still work.
Backbone.History.prototype.getFragment = function(fragment) {
    if (fragment == null) fragment = this.getHash();
    return fragment.replace(/^[#!]+/, '').replace(/\s+$/, '');
};

// Generate CSRF protection token that is valid for the specified amount of
// msec. The default is 1 second. Callers should provide the request path to
// ensure the cookie is not pervasive across requests.
Backbone.csrf = function(path, timeout) {
    var chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXZY0123456789';
    var token = '';
    while (token.length < 32) {
        token += chars.charAt(Math.floor(Math.random() * chars.length));
    }

    // Remove hashes, query strings from cookie path.
    path = path || '/';
    path = path.split('#')[0].split('?')[0];

    var expires = new Date(+new Date + (timeout || 2000)).toGMTString();
    document.cookie = 'bones.token=' + token
        + ';expires=' + expires
        + ';path=' + path + ';';
    return token;
};

// Client-side override of `Backbone.sync`. Adds CSRF double-cookie
// confirmation protection to all PUT/POST/DELETE requests. The csrf middleware
// must be used server-side to invalidate requests without this CSRF
// protection. The original `Backbone.sync` cannot be reused because it does
// not send a request body for DELETE requests.
Backbone.sync = function(method, model, options) {
    options = options || {};
    function getUrl(object) {
        if (!(object && object.url)) throw new Error("A 'url' property or function must be specified");
        return _.isFunction(object.url) ? object.url() : object.url;
    };

    var type = {
        'create': 'POST',
        'update': 'PUT',
        'delete': 'DELETE',
        'read'  : 'GET'
    }[method];

    if (method !== 'read') {
        var modelJSON = model.toJSON ? model.toJSON() : model;
        modelJSON['bones.token'] = Backbone.csrf(getUrl(model));
        modelJSON = JSON.stringify(modelJSON);
    }

    // Default JSON-request options.
    var params = {
        url:          getUrl(model),
        type:         type,
        contentType:  'application/json',
        data:         (modelJSON || null),
        dataType:     'json',
        processData:  false,
        success:      function(resp) {
            options.bonesResponse = true;
            if (options.success) options.success(resp);
        },
        error:        function(xhr) {
            if (options.error) options.error(xhr);
        }
    };

    // Make the request.
    return options.xhr = $.ajax(params);
};
