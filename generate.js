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

var threehundred = fs.readFileSync('./hanban-300chars-list-with-definitions.csv').toString()
var threeh = []
threehundred.split('\n').forEach(function (l) {
  threeh.push(l.split('\t'))
})
threeh.shift()
fs.writeFileSync('./three-hundred-common.json', JSON.stringify(threeh, null, '  '))

var threesvgs = []
threeh.forEach(function (o) {
  var code = o[1].charCodeAt(0)
  console.log(o[1])
  threesvgs.push(fs.readFileSync('./svgs/' + code + '.svg').toString())
})
fs.writeFileSync('./three-hundred-svgs.json', JSON.stringify(threesvgs, null, '  '))