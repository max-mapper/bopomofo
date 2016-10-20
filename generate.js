var fs = require('fs')

var hundo = require('./100-most-common-radicals.json')

var svgs = []
hundo.forEach(function (o) {
  var code = o.traditional.charCodeAt(0)
  svgs.push(fs.readFileSync('./svgs/' + code + '.svg').toString())
})

fs.writeFileSync('./one-hundred-svgs.json', JSON.stringify(svgs, null, '  '))

var hanban = require('./hanban-300-characters.json')

var threesvgs = []
hanban.forEach(function (o) {
  var code = o.traditional.charCodeAt(0)
  console.log(o.traditional)
  threesvgs.push(fs.readFileSync('./svgs/' + code + '.svg').toString())
})

fs.writeFileSync('./three-hundred-svgs.json', JSON.stringify(threesvgs, null, '  '))
