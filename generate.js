var fs = require('fs')

var rads = require('./radicals.json')
var common = require('./common-characters.json')

var svgs = {}
rads.forEach(function (o) {
  var code = o.traditional.charCodeAt(0)
  svgs[o.traditional] = fs.readFileSync('./svgs/' + code + '.svg').toString()
})

common.forEach(function (o) {
  var code = o.traditional.charCodeAt(0)
  svgs[o.traditional] = fs.readFileSync('./svgs/' + code + '.svg').toString()
})

fs.writeFileSync('./svgs.json', JSON.stringify(svgs, null, '  '))
