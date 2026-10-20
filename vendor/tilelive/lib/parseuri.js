// Parse a tilesource URI into a `url.parse()`-shaped object using the WHATWG
// URL API. Strings that are not absolute URLs (plain paths, optionally with a
// query string) get a null protocol, as with `url.parse()`.
var querystring = require('querystring');

module.exports = function parseUri(str, parseQuery) {
    var uri;
    try {
        uri = new URL(str);
    } catch (err) {
        var i = str.indexOf('?');
        var search = i < 0 ? '' : str.slice(i);
        return {
            protocol: null,
            slashes: false,
            auth: null,
            host: null,
            port: null,
            hostname: null,
            hash: null,
            search: search || null,
            query: parseQuery ? querystring.parse(search.slice(1)) : (search.slice(1) || null),
            pathname: i < 0 ? str : str.slice(0, i),
            path: str,
            href: str
        };
    }
    var auth = uri.username
        ? decodeURIComponent(uri.username) + (uri.password ? ':' + decodeURIComponent(uri.password) : '')
        : null;
    return {
        protocol: uri.protocol,
        slashes: /^[a-z][a-z0-9+.-]*:\/\//i.test(str),
        auth: auth,
        host: uri.host,
        port: uri.port || null,
        hostname: uri.hostname,
        hash: uri.hash || null,
        search: uri.search || null,
        query: parseQuery ? querystring.parse(uri.search.slice(1)) : (uri.search.slice(1) || null),
        pathname: uri.pathname,
        path: uri.pathname + uri.search,
        href: uri.href
    };
};
