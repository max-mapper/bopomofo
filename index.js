var yo = require('yo-yo')
var bpmf = require('./bopomofo.js')
var hundred = require('./one-hundred-common.json')
var svgs = require('./one-hundred-svgs.json')
var threehundred = require('./three-hundred-common.json')
var threesvgs = require('./three-hundred-svgs.json')
var interval
var content = document.querySelector('.content')
var input = document.querySelector('input')

window.bpmf = bpmf

var state = {
  svgs: svgs,
  data: hundred,
  current: 0
}

document.querySelector('.hundred').addEventListener('click', function () {
  state.svgs = svgs
  state.data = hundred
  state.current = 0
  render(0)
})

document.querySelector('.threehundred').addEventListener('click', function () {
  state.svgs = threesvgs
  state.data = threehundred
  state.current = 0
  render(0)
})

document.querySelector('.random').addEventListener('click', function () {
  render(Math.floor(Math.random() * state.data.length))
})

document.querySelector('.previous').addEventListener('click', function () {
  render(state.current - 1)
})

document.querySelector('.next').addEventListener('click', function () {
  render(state.current + 1)
})

document.querySelector('.speak').addEventListener('click', function () {
  var msg = new SpeechSynthesisUtterance(state.data[state.current][1][0])
  msg.lang = 'zh-TW'
  window.speechSynthesis.speak(msg)
})

document.querySelector('.taiwan').addEventListener('click', function () {
  alert('yep')
})

render(0)

function render (num) {
  state.current = num
  var code = state.data[state.current][1].charCodeAt(0)
  var str = state.svgs[state.current]
  str = str.replace('<svg ', '<svg foo="' + Date.now() + '" ') // force re-animation
  var b64 = "data:image/svg+xml;base64," + new Buffer(str).toString('base64')
  var pinyin = state.data[state.current][4]
  var html = yo`
    <div class="content">
      <img src=${b64}></img>
      <ul>
        <li>${state.data[state.current][1]}</li>
        <li>${state.data[state.current][3]}</li>
        <li>${pinyin}</li>
        <li>${bpmf(pinyin)}</li>
        <li class="comment">${state.data[state.current][6]}</li>
      </ul>
    </div>
  `
  yo.update(content, html)
  clearInterval(interval)
  interval = setInterval(function () {
    render(state.current)
  }, 7000)
}

input.addEventListener('keypress', checkInput)
input.addEventListener('paste', checkInput)

function checkInput () {
  setTimeout(function () {
    var val = input.value.trim()[0]
    console.log('val', val)
    var curchar = state.data[state.current][1]
    if (val === curchar) {
      input.value = ''
      var next = state.current + 1
      if (state.data[next] === undefined) next = 0
      render(next)
    }
  }, 0)
}

window.render = render