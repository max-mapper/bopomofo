var yo = require('yo-yo')
var hundred = require('./one-hundred-common.json')
var svgs = require('./one-hundred-svgs.json')
var current
var interval
var content = document.querySelector('.content')
var input = document.querySelector('input')

render(0)

function render (num) {
  current = num
  var code = hundred[current][1].charCodeAt(0)
  var str = svgs[current]
  str = str.replace('<svg ', '<svg foo="' + Date.now() + '" ') // force re-animation
  var b64 = "data:image/svg+xml;base64," + new Buffer(str).toString('base64')
  var html = yo`
    <div class="content">
      <img src=${b64}></img>
      <ul>
        <li>${hundred[current][1]}</li>
        <li>${hundred[current][3]}</li>
        <li>${hundred[current][4]}</li>
        <li class="comment">${hundred[current][6]}</li>
      </ul>
    </div>
  `
  yo.update(content, html)
  clearInterval(interval)
  interval = setInterval(function () {
    render(current)
  }, 7000)
}

input.addEventListener('keypress', checkInput)
input.addEventListener('paste', checkInput)

function checkInput () {
  setTimeout(function () {
    var val = input.value.trim()[0]
    console.log('val', val)
    var curchar = hundred[current][1]
    if (val === curchar) {
      input.value = ''
      var next = current + 1
      if (hundred[next] === undefined) next = 0
      render(next)
    }
  }, 0)
}

window.render = render