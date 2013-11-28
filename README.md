# reflip

Redis-backed or file-backed feature flipping middleware for connect/express.js. It should be straightforward to write additional storage adapters.

[![Build Status](https://secure.travis-ci.org/ceejbot/reflip.png)](http://travis-ci.org/ceejbot/reflip) [![Dependencies](https://david-dm.org/ceejbot/reflip.png)](https://david-dm.org/ceejbot/reflip) [![Coverage Status](https://coveralls.io/repos/ceejbot/reflip/badge.png)](https://coveralls.io/r/ceejbot/reflip)

[![NPM](https://nodei.co/npm/reflip.png)](https://nodei.co/npm/reflip/)

## Example

```javascript
var Reflip = require('reflip'),
    express = require('express');
  
var reflip = new Reflip(
{
    storage: new Reflip.RedisAdapter(
    { 
        client: redis.createClient(), 
        namespace: 'myapp:',
        ttl: 60 * 1000
    }),
});

reflip.register('aardvarks', 'custom', function(request)
{
    return reflip.check('aardvark-enabled') && !!request.user;
});
  
var app = express();
app.use(express.session()); // etc
app.use(reflip.flip());

app.get('/aardvarks', serveArdvarks);
app.get('/anteaters', reflip.gate('anteaters'), serveAnteaters);

function serveArdvarks(request, response)
{
    // has access to the session info; can make exciting decisions
    if (!request.check('aardvarks') || request.session.alpacasPreferred)
    {
        response.redirect('/alpacas');
        return;
    }
    
    response.render('aardvarks');
}

function serveAnteaters(request, response)
{
    // if we reach here at all, the anteater feature is enabled
    response.render('anteaters');
}
```

## API

### new Reflip(options)

The options object may include the following fields:

- `storage`: a storage adapter; can be nil if you are operating from a predefined object only
- `default`: default response for unknown features; defaults to `false`
- `httpcode`: the status code to use when blocking requests for disabled features; defaults to 404 
- `features`: an object pre-defining feature defaults; is overridden after `ttl` milliseconds by the values in remote storage if that is enabled


### reflip.register('feature-name', function(request) {})

Register a custom feature name with a function that decides based on the request object if it is enabled or not. Can return a promise. (This is a lie; I need to make this work.)

### reflip.register(new Reflip.Feature(opts))

Register a pre-constructed feature that makes its decisions in any manner you define.

### reflip.flip()

The middleware that decorates each request object with the result of feature checks.

```javascript
app.use(reflip.flip());
```

The middleware pre-calculates the answers for all feature checks & adds a `check()` function to each request object.

### request.check('feature-name')

Looks in the request's cache (in `request.features`) to see if the named feature is turned on or not. Returns a falsey value if this feature is off for this request. Returns a truthy value if it should be enabled. If the feature is of type `grouped`, it will return a string indicating which group this request is in.

### reflip.gate('feature-name')

Use as middleware for specific routes; responds to the request with `reflip.httpcode` if the feature is not enabled for that request.

```javascript
app.get('/anteaters', reflip.gate('anteaters'), serveAnteaters);
```

### reflip.refresh()

Forces the adapter layer to refresh; normally called by the interval timer. Returns a promise that resolves when the lookup is complete. Updates the list of features completely, adding new ones and removing older ones. Also updates the timeout.

## Feature

The feature object represents a feature that can be flipped on or off.

```javascript
var feature = new Reflip.Feature(
{
    name: 'anteaters',
    type: 'metered',
    chance: 50,
});
```

Valid types: 

* `boolean`: on or off.
* `metered`: the feature has a percent chance of being turned on
* `grouped`: a list of possible values for the feature, each of which has an equal chance of appearing; useful for rudimentary a/b testing
* `custom`: you provide the function used to decide if the feature is enabled. The checker function is given the express request object to use to make its decision.

Valid feature fields:

* `name`: required, string name of feature
* `type`: required; string type of feature
* `enabled`: boolean, used for boolean features
* `groups`: array, used for grouped features
* `chance`: number from 0-100, used for metered features
* `checker`: called by check() in lieu of other decision-making; used for custom features

## File adapter

Usage: `storage = new Reflip.FileAdapter({ filename: './features.json'});`

Example file:

```javascript
{
    "features":
    [
        {
            "name": "aardvarks",
            "type": "boolean",
            "enabled": true
        },
        {
            "name": "archaeopteryx",
            "type": "boolean",
            "enabled": false
        },
        {
            "name": "anteaters",
            "type": "metered",
            "enabled": true,
            "chance": 25
        },
        {
            "name": "alpacas",
            "type": "grouped",
            "enabled": true,
            "groups": [ "a", "b", "c" ]
        }
    ]
}
```

The `ttl` field, if present in the features hash, is ignored. The file adapter uses `fs.watch()` to observe changes in the file. The [usual fs.watch() caveats](http://nodejs.org/api/fs.html#fs_fs_watch_filename_options_listener) apply.

## Redis adapter

```javascript
var storage = new Reflip.RedisAdapter(
{
    client: redis.createClient(), // or supply `host` and `port` fields
    namespace: 'key-prefix:',     // optional
    ttl: 60000                    // optional; refresh interval in milliseconds; defaults to 5 minutes
});
```

The redis adapter expects to find the following keys:

* `key-prefix:ttl`: integer giving time until next refresh, in milliseconds
* `key-prefix:features`: set giving string feature names
* `key-prefix:<name>`: hash, one per feature. The hash is passed directly to the Feature constructor as documented above.

## TODO

The module should work well as a express middleware right now. However, it would be nice to have conveniences for adding/editing/removing feature switches from redis, out of band of the Reflip instance (since it is intended to update itself periodically). Maybe a tiny web app that does nothing but update redis?

## LICENSE

MIT.
