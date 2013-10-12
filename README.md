# reflip

Redis-backed feature flipping middleware for connect/express.js.

## API

### new Reflip(options)

The options object may include the following fields:

- `storage`: a storage adapter; can be nil if you are operating from a predefined object only
- `refresh`: refresh interval in seconds; defaults to 300
- `default`: default response for unknown features; defaults to `false`
- `httpcode`: the status code to use when blocking requests for disabled features; defaults to 404 
- `features`: an object pre-defining feature defaults; is overridden after `refresh` seconds by the values in remote storage if that is enabled


### reflip.check('feature-name')

Looks in local cache to see if feature turned on or not. Returns a boolean.

### reflip.variation('feature-name')

Returns a string indicating the variation of a feature to use. 

### reflip.register('feature-name', function(request) {})

Register a custom feature name with a function that decides based on the request object if it is enabled or not. Can return a promise. (I think.)

### reflip.refresh()

Forces a lookup for all features. Returns a promise that resolves when the lookup is complete.

## Example

```javascript
var Reflip = require('reflip'),
    express = require('express');
  
var reflip = new Reflip(
{
    storage: redis.createClient(),
    refresh: 60
});

reflip.register('aardvarks', 'custom', function(request)
{
    // may also return a promise?
    return reflip.check('aardvark-enabled') && !!request.user;
});
  
var app = express();
app.use(express.session());
// all the middlewares
app.use(reflip.features());

app.get('/aarvarks', serveArdvarks);
app.get('/anteaters', reflip.check('anteaters'), serveAnteaters);

function serveArdvarks(request, response)
{
    // has access to the session info; can make exciting decisions
    if (!request.check('ardvarks'))
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
