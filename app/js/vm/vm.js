import { delay, runtime_error } from '../globals.js'

import { Lexer } from '../compiler/lexer.js'
import { Parser } from '../compiler/parser.js'
import { Transpiler } from '../compiler/transpiler.js'

import { Interrupt } from './int.js'
import { Debugger } from './dbg.js'

import { CpuChip } from './chips/cpu.js'
import { KeyboardChip } from './chips/keyboard.js'
import { MouseChip } from './chips/mouse.js'
import { PaletteChip } from './chips/palette.js'

export var VM

export const _VM_STOPPED = 0
export const _VM_RUNNING = 1
export const _VM_PAUSED = 2

VM = class {

  constructor () {
    window._vm = this

    this.PObject = {
      get: (target, prop) => {
        let value = target[prop]
        return !_.isFunction(value) ? () => value : value
      }
    }

    this.PArray = {
      get: (target, prop) => {
        let value = target[prop]
        return !_.isFunction(value) || prop === 'length' ? () => value : value
      }
    }

    this.publics = {}

    this.int = new Interrupt(this)
    this.dbg = new Debugger(this)

    this.code = ''
    this.fn = null

    this.boot(true)

    this.tickBound = this.tick.bind(this)
    PIXI.ticker.shared.add(this.tickBound)
  }

  boot (cold = false) {
    this.reset()

    if (cold) {
      this.chips = {
        cpu: new CpuChip(this),
        keyboard: new KeyboardChip(this),
        mouse: new MouseChip(this),
        palette: new PaletteChip(this),
      }
    }
  }

  restart (cold = false) {
    for (let k in this.chips) {
      this.chips[k].boot(cold)
    }
    if (cold) {
      this.shut()
    }
    this.boot(cold)
  }

  reset () {
    for (let k in this.chips) {
      this.chips[k].reset()
    }
    this.status = _VM_RUNNING
    this.int.reset()
    this.dbg.reset()
  }

  shut () {
    for (let k in this.chips) {
      this.chips[k].shut()
    }
    this.int.shut()
    this.dbg.shut()
  }

  hlt (code) {
    if (code > 0) {
      runtime_error(this, code)
    }
    this.stop()
  }

  load (uri) {
    this.fn = null
    this.code = null

    let lexer = new Lexer(this)
    lexer.run(uri)

    let parser = new Parser(lexer)
    let transpiler = new Transpiler()

    if (lexer.errors === 0) {
      parser.run()

      if (parser.errors === 0) {
        this.code = transpiler.run(parser.nodes)
      }
    }

    if (this.code) {
      this.fn = new Function(['args'], this.code)
    }

    lexer.dump()
    parser.dump()
    transpiler.dump()
  }

  run (...args) {
    if (this.fn) {
      this.fn.apply(this, args)
    }
  }

  stop () { this.status = _VM_STOPPED }

  pause () { this.status = _VM_PAUSED }

  resume () { this.status = _VM_RUNNING }

  tick (delta) {
    if (this.status === _VM_RUNNING) {
      let t = performance.now()

      for (let k in this.chips) {
        this.chips[k].tick(t, delta)
      }

      this.int.tick(t, delta)
      this.dbg.tick(t, delta)
    }
  }

  wait (ms) { delay(ms) }

}
