var yo = require('yo-yo')
var bpmf = require('./bopomofo.js')
var radicals = require('./100-most-common-radicals.json')
var svgs = require('./one-hundred-svgs.json')
var words = require('./hanban-300-characters.json')
var threesvgs = require('./three-hundred-svgs.json')
var interval
var content = document.querySelector('.content')
var input = document.querySelector('.write')
var form = document.querySelector('.form')

window.bpmf = bpmf

var state = {
  svgs: svgs,
  data: radicals,
  current: 0
}

document.querySelector('.select-set').addEventListener('change', function () {
  state.svgs = this.value === "radicals" ? svgs : threesvgs
  state.data = this.value === "radicals" ? radicals : words
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

document.querySelector('.show-help').addEventListener('click', function () {
  document.querySelector('.help').hidden = false
})

document.querySelector('.hide-help').addEventListener('click', function () {
  document.querySelector('.help').hidden = true
})

document.querySelector('.taiwan').addEventListener('click', function () {
  alert('yep')
})

render(0)

function render (num) {
  if (num !== state.current) {
    input.value = ''
  }

  state.current = num
  var code = state.data[state.current].traditional.charCodeAt(0)
  var str = state.svgs[state.current]
  str = str.replace('<svg ', '<svg foo="' + Date.now() + '" ') // force re-animation
  var b64 = "data:image/svg+xml;base64," + new Buffer(str).toString('base64')
  var pinyin = state.data[state.current].pinyin
  var html = yo`
    <div class="content">
      <img class="strokes-img" src=${b64}></img>
      <span class="char">${state.data[state.current].traditional}${prettifybpmf(pinyin)}</span>
      ${pinyin}<br>
      <p class="clear">${state.data[state.current].definition}<br>
      <span class="comment">${state.data[state.current].notes}</span></p>
    </div>
  `
  yo.update(content, html)
  input.focus()
  clearInterval(interval)
  input.classList.remove('error')
  interval = setInterval(function () {
    render(state.current)
  }, 7000)
}

form.addEventListener('submit', checkInput)

function checkInput (e) {
  var val = input.value.trim()[0]
  console.log('val', val)
  var curchar = state.data[state.current].traditional
  if (val === curchar) {
    input.value = ''
    var next = state.current + 1
    if (state.data[next] === undefined) next = 0
    render(next)
  } else {
    input.classList.add('error')
  }

  e.preventDefault()
}

function prettifybpmf (pinyin) {
  var toneClass
  var bpmfTags = []
  bpmf(pinyin).split(",").forEach(function (py) {
    var result = py.replace(/\(|\)|\s/g, "")
    var tone = result[result.length - 1]

    if (["ˇ","ˋ","ˊ"].indexOf(tone) >= 0) {
      toneClass = result.length === 2 ? "bpmf-top-right" : "bpmf-side"
    } else if (tone === "˙") {
      toneClass = "bpmf-top"
    }

    if (toneClass) {
      bpmfTags.push(yo`
        <span class="bpmf">${result.substr(0, result.length - 1)} <span class="${toneClass}">${tone}</span></span>
      `)
    } else {
      bpmfTags.push(yo`
        <span class="bpmf">${result}</span>
      `)
    }
  })

  return bpmfTags
}

window.render = render