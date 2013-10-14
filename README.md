# reflip

Redis-backed or file-backed feature flipping middleware for connect/express.js. It should be straightforward to write additional storage adapters.

[![Build Status](https://secure.travis-ci.org/ceejbot/reflip.png)](http://travis-ci.org/ceejbot/reflip) [![Dependencies](https://david-dm.org/ceejbot/reflip.png)](https://david-dm.org/ceejbot/reflip) 

[![NPM](https://nodei.co/npm/reflip.png)](https://nodei.co/npm/reflip/)

## API

### new Reflip(options)

The options object may include the following fields:

- `storage`: a storage adapter; can be nil if you are operating from a predefined object only
- `ttl`: refresh interval in milliseconds; defaults to 5 minutes
- `default`: default response for unknown features; defaults to `false`
- `httpcode`: the status code to use when blocking requests for disabled features; defaults to 404 
- `features`: an object pre-defining feature defaults; is overridden after `ttl` milliseconds by the values in remote storage if that is enabled


### reflip.register('feature-name', function(request) {})

Register a custom feature name with a function that decides based on the request object if it is enabled or not. Can return a promise. (I think.)

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

## File adapter

Usage: `storage = new Reflip.FileAdapter({ filename: './features.json'});`

Example file:

```javascript
{
    "ttl": 60000,
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

## Redis adapter

TBD



## Example

```javascript
var Reflip = require('reflip'),
    express = require('express');
  
var reflip = new Reflip(
{
    storage: new Reflip.RedisAdapter(
    { 
        client: redis.createClient(), 
        namespace: 'myapp'
    }),
    ttl: 60 * 1000
});

reflip.register('aardvarks', 'custom', function(request)
{
    return reflip.check('aardvark-enabled') && !!request.user;
});
  
var app = express();
app.use(express.session()); // etc
app.use(reflip.flip());

app.get('/aarvarks', serveArdvarks);
app.get('/anteaters', reflip.gate('anteaters'), serveAnteaters);

function serveArdvarks(request, response)
{
    // has access to the session info; can make exciting decisions
    if (!request.check('ardvarks') || request.session.alpacasPreferred)
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

## LICENSE

MIT.
