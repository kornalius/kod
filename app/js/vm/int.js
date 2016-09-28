import { runtime_error } from '../globals.js'


export const _INT_STOPPED = 0
export const _INT_RUNNING = 1
export const _INT_PAUSED = 2

export class Interrupt {

  constructor (vm) {
    this.vm = vm
    this.interrupts = {}
  }

  reset () {
    this.stop_all()
  }

  shut () {
    this.reset()
  }

  find (name) { return this.interrupts[name] }

  create (name, fn, ms = 500) {
    if (!this.find(name)) {
      this.interrupts[name] = { name, status: _INT_RUNNING, ms, fn, last: 0 }
    }
    else {
      runtime_error(0x06)
    }
  }

  resume (name) {
    if (this.find(name)) {
      this.interrupts[name].status = _INT_RUNNING
      this.interrupts[name].last = performance.now()
    }
    else {
      runtime_error(0x07)
    }
  }

  pause (name) {
    if (this.find(name)) {
      this.interrupts[name].status = _INT_PAUSED
    }
    else {
      runtime_error(0x07)
    }
  }

  stop (name) {
    if (this.find(name)) {
      delete this.interrupts[name]
    }
    else {
      runtime_error(0x07)
    }
  }

  stop_all () {
    for (let k in this.interrupts) {
      this.stop(k)
    }
    this.interrupts = {}
  }

  tick (t) {
    for (let k in this.interrupts) {
      let i = this.interrupts[k]
      if (i.status === _INT_RUNNING) {
        let delay = t - i.last
        if (delay >= i.ms) {
          i.fn.apply(this, [delay - i.ms])
          i.last = t
        }
      }
    }
  }

}
