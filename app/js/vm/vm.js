import _ from 'lodash'

import { delay, runtime_error } from '../globals.js'

import { Lexer } from '../compiler/lexer.js'
import { Parser } from '../compiler/parser.js'
import { Transpiler } from '../compiler/transpiler.js'

import { Interrupt } from './int.js'
import { Debugger } from './dbg.js'

import { CpuChip } from './chips/cpu.js'
import { DriveChip } from './chips/drive.js'
import { KeyboardChip } from './chips/keyboard.js'
import { MouseChip } from './chips/mouse.js'
import { PaletteChip } from './chips/palette.js'
import { SpriteChip } from './chips/sprite.js'
import { TextChip } from './chips/text.js'
import { VideoChip } from './chips/video.js'
import { SoundChip } from './chips/sound.js'

import { EventEmitter2 } from 'eventemitter2'

export var VM

export const _VM_STOPPED = 0
export const _VM_RUNNING = 1
export const _VM_PAUSED = 2

VM = class extends EventEmitter2 {

  constructor () {
    super({ wildcard: true, delimiter: '.' })

    window._vm = this

    // Check for littleEndian
    let b = new ArrayBuffer(4)
    let a = new Uint32Array(b)
    let c = new Uint8Array(b)
    a[0] = 0xdeadbeef
    this.littleEndian = c[0] === 0xef

    this.rom = {}

    this.processes = []

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
      this.processes = []

      this.chips = {}
      this.chips.cpu = new CpuChip(this)
      this.chips.drive = new DriveChip(this, 'fda')
      this.chips.video = new VideoChip(this)
      this.chips.palette = new PaletteChip(this)
      this.chips.text = new TextChip(this)
      this.chips.sprite = new SpriteChip(this)
      this.chips.keyboard = new KeyboardChip(this)
      this.chips.mouse = new MouseChip(this)
      this.chips.sound = new SoundChip(this)
    }

    for (let p of this.processes) {
      if (_.isFunction(p.boot)) {
        p.boot(cold)
      }
    }

    for (let k in this.chips) {
      this.chips[k].boot(cold)
    }
  }

  restart (cold = false) {
    if (cold) {
      this.shut()
    }

    this.boot(cold)
  }

  reset () {
    for (let p of this.processes) {
      if (_.isFunction(p.reset)) {
        p.reset()
      }
    }

    for (let k in this.chips) {
      this.chips[k].reset()
    }

    this.status = _VM_RUNNING
    this.int.reset()
    this.dbg.reset()
  }

  shut () {
    for (let p of this.processes) {
      if (_.isFunction(p.shut)) {
        p.shut()
      }
    }

    for (let k in this.chips) {
      this.chips[k].shut()
    }

    this.int.shut()
    this.dbg.shut()
  }

  hlt (code) {
    if (code > 0) {
      runtime_error(code)
    }
    this.stop()
  }

  load (path, src) {
    this.path = path

    this.fn = null
    this.code = null

    let lexer = new Lexer(this)
    lexer.run(this.path, src)

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
      try {
        this.fn(args)
      }
      catch (e) {
        console.error(e)
        this.stop()
      }
    }
  }

  stop () { this.status = _VM_STOPPED }

  pause () { this.status = _VM_PAUSED }

  resume () { this.status = _VM_RUNNING }

  addProcess (p) {
    this.processes.push(p)
  }

  removeProcess (p) {
    _.pull(this.processes, p)
  }

  tick (delta) {
    if (this.status === _VM_RUNNING) {
      let t = performance.now()

      for (let p of this.processes) {
        if (_.isFunction(p.tick)) {
          p.tick(t, delta)
        }
      }

      for (let k in this.chips) {
        this.chips[k].tick(t, delta)
      }

      this.int.tick(t, delta)
      this.dbg.tick(t, delta)
    }
  }

  wait (ms) { delay(ms) }

}
