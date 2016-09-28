import { _VM_RUNNING, _VM_PAUSED, _VM_STOPPED } from './vm.js'

export const _DBG_STEP_OUT = -1
export const _DBG_STEP_IN = -2

export class Debugger {

  constructor (vm) {
    this.vm = vm
    this.lines_display = 10
    this.reset()
  }

  tick (t) {
  }

  reset () {
    this.current_line = -1
    this.lines = []
    this.frames = []
  }

  shut () {
  }

  src (text) {
    this.lines = text.split('\n')
    this.current_line = -1
  }

  line (line) {
    this.current_line = line
  }

  frame (name, enter) {
    if (enter) {
      this.frames.push({ name })
    }
    else {
      this.frames.pop()
    }
  }

  brk () {
    this.status = _VM_PAUSED
  }

  step (inside = false) {
    this.status = inside ? _.isNumber(inside) ? inside : _DBG_STEP_IN : _DBG_STEP_OUT
  }

  run () {
    if (this.status === _VM_PAUSED) {
      this.status = _VM_RUNNING
    }
  }

  stop () {
    this.status = _VM_STOPPED
    this.current_line = -1
  }

  list (type) {
    let l = []

    switch (type) {
      case 'frames':
      case 'f':
        for (let f of this.frames) {
          l.shift(f.name)
        }
        break

      default:
        for (let i = Math.max(0, this.current_line - this.lines_display); i < Math.min(this.current_line + this.lines_display, this.lines.length); i++) {
          l.push(this.lines[i])
        }
    }

    return l
  }

}
