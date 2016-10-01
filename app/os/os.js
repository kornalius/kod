import { Shell } from './shell.js'

export var OS_VERSION = '0.0.1'

export var OS

OS = class {

  constructor (vm) {
    this.vm = vm
    this.shell = new Shell(this)
  }

  boot (cold = true) {
    this.shell.boot(cold)
    this.vm.addTicker(this)
  }

  reset () {
    this.shell.reset()
  }

  shut () {
    this.shell.shut()
    this.vm.removeTicker(this)
  }

  tick (t, delta) {
  }
}
