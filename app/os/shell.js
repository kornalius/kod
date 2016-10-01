import { OS_VERSION } from './os.js'
import { Readline } from './readline.js'

export var SHELL_VERSION = '0.0.1'

export var Shell

Shell = class {

  constructor (os, prompt) {
    this.os = os
    this.vm = this.os.vm
    this.txt = this.vm.chips.text
    this.prompt = prompt || '>'
    this.rdl = new Readline(this.vm, this.prompt)
    this.history = []
    this.history_ptr = 0
  }

  add_to_history (text) {
    this.history.push(text)
    this.history_ptr = this.history.length - 1
  }

  prev_history () {
    if (this.history_ptr < 0) {
      this.history_ptr = this.history.length
    }
  }

  next_history () {
    if (this.history_ptr > this.history.length - 1) {
      this.history_ptr = 0
    }
  }

  clear_history () {
    this.history = []
    this.history_ptr = 0
  }

  boot (cold = true) {
    this.reset()
    if (cold) {
      this.history = []
      this.history_ptr = 0
      this.vm.addTicker(this)
      this.welcome()
    }
  }

  reset () {
    this.clear()
  }

  shut () {
    this.vm.removeTicker(this)
  }

  tick (t, delta) {
  }

  clear () {
    this.txt.clear()
  }

  welcome () {
    this.txt.println('Welcome to Kod Shell v' + SHELL_VERSION)
    this.txt.println('Running Kod OS v' + OS_VERSION)
    this.txt.println()
  }

  start (text) {
    this.printPrompt()
    this.rdl.start(text)
  }

  end () {
    this.rdl.end()
  }

}
