var fs = require('fs')

var appcache = `CACHE MANIFEST
bundle.js
how.png
how2.png
index.html
#${Date.now()}
NETWORK:
*
`

fs.writeFileSync('./index.appcache', appcache)