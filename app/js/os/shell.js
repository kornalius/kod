import { OS_VERSION } from './os.js'
import { Readline } from './readline.js'

export var SHELL_VERSION = '0.0.1'

export var Shell

Shell = class {

  constructor (os, prompt) {
    this.os = os
    this.vm = this.os.vm
    this.txt = this.vm.chips.text
    this.prompt = prompt || '> '
    this.rdl = new Readline(this.vm, this.prompt)
    this.cwd = ''
    this.history = []
    this.history_ptr = 0
    this._readlineBound = this.onReadline.bind(this)
  }

  boot (cold = true) {
    this.reset()
    if (cold) {
      this.history = []
      this.history_ptr = 0
      this.vm.addProcess(this)
      this.welcome()
      this.start()
    }
  }

  reset () {
    this.clear()
  }

  shut () {
    this.vm.removeProcess(this)
  }

  tick (t, delta) {
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

  welcome () {
    this.txt.println('Welcome to Kod Shell v' + SHELL_VERSION)
    this.txt.println('Running Kod OS v' + OS_VERSION)
    this.txt.println()
  }

  clear () {
    this.txt.clear()
  }

  printPrompt () {
    this.txt.print(this.prompt)
  }

  start (text) {
    this.printPrompt()
    this.rdl.start(text)
    this.vm.on('readline.end', this._readlineBound)
  }

  end () {
    this.vm.off('readline.end', this._readlineBound)
    this.rdl.end()
  }

  onReadline (e) {
    console.log(e)
  }

}
