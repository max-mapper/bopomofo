var fs = require('fs')
var lines = fs.readFileSync('./100-most-common-radicals.tsv')
  .toString()
  .split('\n')
  .map(function (l) { return l.split('\t') })

var head = lines[0]
var hundo = []
for (var i = 1; i < lines.length; i++) {
  var k = {};
  for (var j = 0; j < head.length; j++) {
    k[head[j]] = lines[i][j];
  }
  hundo.push(k);
}

var svgs = []
hundo.forEach(function (o) {
  var code = o.traditional.charCodeAt(0)
  svgs.push(fs.readFileSync('./svgs/' + code + '.svg').toString())
})

fs.writeFileSync('./one-hundred-svgs.json', JSON.stringify(svgs, null, '  '))
fs.writeFileSync('./100-most-common-radicals.json', JSON.stringify(hundo, null, '  '))

var lines = fs.readFileSync('./hanban-300.tsv')
  .toString()
  .split('\n')
  .map(function (l) { return l.split('\t') })

var head = lines[0]
var hanban = []
for (var i = 1; i < lines.length; i++) {
  var k = {};
  for (var j = 0; j < head.length; j++) {
    k[head[j]] = lines[i][j];
  }
  hanban.push(k);
}

var threesvgs = []
hanban.forEach(function (o) {
  var code = o.traditional.charCodeAt(0)
  console.log(o.traditional)
  threesvgs.push(fs.readFileSync('./svgs/' + code + '.svg').toString())
})
fs.writeFileSync('./three-hundred-svgs.json', JSON.stringify(threesvgs, null, '  '))
fs.writeFileSync('./hanban-300-characters.json', JSON.stringify(hanban, null, '  '))
