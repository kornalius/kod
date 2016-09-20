import { error } from '../../globals.js'
import { statements } from './syntax.js'
import { Frames } from './frame.js'

export var Lexer

Lexer = class {

  constructor (tokenizer) {
    this.tokenizer = tokenizer
    this.tokenizer.lexer = this
    this.frames = new Frames(this)
    this.reset()
  }

  reset () {
    this.errors = 0
    this.offset = 0
    this.frames.reset()
    this.nodes = []
  }

  validOffset (offset) { return offset >= 0 && offset < this.length }

  token_at (offset) { return this.validOffset(offset) ? this.tokens[offset] : null }

  get eos () { return this.offset >= this.length }

  get length () { return this.tokens.length }

  get tokens () { return this.tokenizer.tokens }

  get token () { return this.token_at(this.offset) }

  skip (e) { while (this.is(e) && !this.eos) { this.next() } }

  is (e) { return this.token ? this.token.is(e) : false }

  expect (e, next = true) {
    let r = this.token ? this.token.is(e) : false
    if (r) {
      if (next) { this.next() }
    }
    else { error(this, this.token, e, 'expected') }
    return r
  }

  match (offset, matches) {
    if (!_.isNumber(offset)) {
      matches = offset
      offset = this.offset
    }
    let tokens = []
    let m = 0
    while (this.validOffset(offset) && m < matches.length) {
      let token = this.tokens[offset++]
      if (!token.is(matches[m++])) { return null }
      tokens.push(token)
    }
    return tokens.length ? tokens : null
  }

  peek (c = 1) { return this.token_at(this.offset + c) }

  next (c = 1) {
    this.offset += c
    return this
  }

  run () {
    this.reset()
    this.frames.start('main')
    let nodes = statements(this)
    this.frames.end()
    this.nodes = nodes
    return nodes
  }

  dump () {
    console.info('lexer dump')
    console.log(this.nodes)
    console.log('')
  }

}
