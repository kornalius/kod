import { Shell } from './shell.js'

export var OS_VERSION = '0.0.1'

export var OS

OS = class {

  constructor (vm) {
    this.vm = vm
    this.shell = null
  }

  boot (cold = true) {
    if (cold) {
      this.vm.addProcess(this)
      this.shell = new Shell(this)
    }
    this.shell.boot(cold)
    if (!cold) {
      this.autorun()
    }
  }

  autorun () {
    let dsk = this.vm.chips.drive.disk
    if (dsk) {
    }
  }

  shut () {
    this.vm.removeProcess(this)
  }

  tick (t, delta) {
  }
}
