import { defaults, delay, runtime_error } from '../globals.js'
import { Tokenizer } from '../compiler/tokenizer/tokenizer.js'
import { Lexer } from '../compiler/lexer/lexer.js'
import { Transpiler } from '../compiler/transpiler.js'
import { Memory, MemoryManager } from './mem.js'
import { Interrupt } from './int.js'
import { Debugger } from './dbg.js'
import { define_property } from './prop.js'

export var VM

export const _VM_STOPPED = 0
export const _VM_RUNNING = 1
export const _VM_PAUSED = 2

VM = class {

  constructor (mem_size) {
    window._vm = this

    this.mem_size = mem_size || defaults.vm.mem_size
    this.mem = new Memory(null, 0, this.mem_size)
    this.mm = new MemoryManager(this.mem)
    this.int = new Interrupt(this)
    this.dbg = new Debugger(this)

    this.code = ''
    this.fn = null

    this.boot(true)

    this.def_prop = define_property

    this.tickBound = this.tick.bind(this)
    PIXI.ticker.shared.add(this.tickBound)
  }

  boot (cold = false) {
    this.reset()

    if (cold) {
      this.mem.clear()
    }
  }

  restart (cold = false) {
    if (cold) {
      this.shut()
    }
    this.boot(cold)
  }

  reset () {
    this.status = _VM_RUNNING
    this.int.reset()
    this.mem.reset()
    this.mm.reset()
    this.dbg.reset()
  }

  shut () {
    this.int.shut()
    this.dbg.shut()
    this.mm.shut()
    this.mem.shut()
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

    let tokenizer = new Tokenizer()
    tokenizer.run(uri)

    let lexer = new Lexer(tokenizer)
    let transpiler = new Transpiler()

    if (tokenizer.errors === 0) {
      lexer.run()

      if (lexer.errors === 0) {
        this.code = transpiler.run(lexer.nodes)
      }
    }

    if (this.code) {
      this.fn = new Function(['args'], this.code)
    }

    tokenizer.dump()
    lexer.dump()
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

      this.int.tick(t, delta)
      this.mem.tick(t, delta)
      this.mm.tick(t, delta)
      this.dbg.tick(t, delta)
    }
  }

  wait (ms) { delay(ms) }

  dump () {
    console.info('vm dump')
    this.mem.dump()
    this.mm.dump()
  }

}
