# reflip

Redis-backed or file-backed feature flipping middleware for connect/express.js. It should be straightforward to write additional storage adapters.

## API

### new Reflip(options)

The options object may include the following fields:

- `storage`: a storage adapter; can be nil if you are operating from a predefined object only
- `ttl`: refresh interval in milliseconds; defaults to 300,000
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

## Implementation notes

Middleware runs through all known features & builds a structure recording their values for the current request. It then decorates the request with the function `check()`. This function takes a string feature name & returns response synchronously.

Should note here what this implies about the data stored in whatever the backing store is.

## LICENSE

MIT.
