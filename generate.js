var fs = require('fs')
var hundred = fs.readFileSync('./100-most-common-radicals.txt').toString()
var oh = []
hundred.split('\n').forEach(function (line) {
  oh.push(line.split('\t'))
})
fs.writeFileSync('./one-hundred-common.json', JSON.stringify(oh, null, '  '))
var svgs = []
oh.forEach(function (o) {
  var code = o[1].charCodeAt(0)
  svgs.push(fs.readFileSync('./svgs/' + code + '.svg').toString())
})
fs.writeFileSync('./one-hundred-svgs.json', JSON.stringify(svgs, null, '  '))