var yo = require('yo-yo')
var vkey = require('vkey')
var bpmf = require('./bopomofo.js')
var radicals = require('./radicals.json')
var words = require('./common-characters.json')
var svgs = require('./svgs.json')
var keys = require('./config/keyMap.json')
var keyNames = require('./config/keyNames.js')

var interval
var content = document.querySelector('.content')
var input = document.querySelector('.write')
var form = document.querySelector('.form')

var state = {
  data: radicals,
  current: 0
}

window.addEventListener('keyup', function (e) {
  if (document.querySelector('.keyboard').hidden) return
  var pressed = vkey[e.keyCode]
  handlePressed(pressed.toLowerCase())
})

document.querySelectorAll('.keyboard .letter, .keyboard .symbol').forEach(function (key) {
  key.addEventListener('mousedown', function (e) {
    var pressed = e.currentTarget.getAttribute('data-key')
    if (!pressed) return
    handlePressed(pressed)
  })
})

document.querySelector('.select-set').addEventListener('change', function () {
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
  speak(state.data[state.current].traditional)
})

document.querySelector('.show-help').addEventListener('click', function () {
  document.querySelector('.help').hidden = false
})

document.querySelector('.hide-help').addEventListener('click', function () {
  document.querySelector('.help').hidden = true
})

document.querySelector('.show-keyboard').addEventListener('click', function () {
  document.querySelector('.keyboard').hidden = false
})

document.querySelector('.hide-keyboard').addEventListener('click', function () {
  document.querySelector('.keyboard').hidden = true
})

document.querySelector('.taiwan').addEventListener('click', function () {
  alert('yep')
})

function handlePressed (pressed) {
  var key = (keyNames[pressed] || pressed)
  if (!key) return
  showKeypress(key)
  var bopokey = keys[key]
  console.log(bopokey)
  speak(bopokey)
}

function speak (str) {
  var msg = new SpeechSynthesisUtterance(str)
  msg.lang = 'zh-TW'
  window.speechSynthesis.speak(msg)
}

function showKeypress (pressed) {
  var keyEl = document.querySelector('li[data-key="' + pressed.toLowerCase() + '"]')
  if (keyEl) {
    keyEl.classList.add('pressed')
    setTimeout(function() {
      keyEl.classList.remove('pressed')
    }, 200)
  }
}

render(0)

function render (num, noFocus) {
  if (num !== state.current) {
    input.value = ''
  }

  state.current = num
  var item = state.data[state.current]
  var char = item.traditional
  var code = char.charCodeAt(0)
  var svgstr = svgs[char] || ''
  if (svgstr) svgstr = svgstr.replace('<svg ', '<svg foo="' + Date.now() + '" ') // force re-animation
  var b64 = "data:image/svg+xml;base64," + new Buffer(svgstr).toString('base64')
  
  var html = yo`
    <div class="content">
      <img class="strokes-img" src=${b64}></img>
      <span class="char">${char}${prettifybpmf(item.pinyin)}</span>
      ${item.pinyin}<br>
      <p class="clear">${item.definition}<br>
      <span class="comment">${item.notes}</span></p>
    </div>
  `
  yo.update(content, html)
  clearInterval(interval)
  input.classList.remove('error')
  if (!noFocus) input.focus()
  interval = setInterval(function () {
    render(state.current, true)
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