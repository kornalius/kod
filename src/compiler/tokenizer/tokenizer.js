import { Token } from './token.js'

export var Tokenizer

Tokenizer = class {

  constructor (text) {
    this.token_types = {
      eol: /^[\r\n]/,
      comma: /^,/,
      colon: /^:/,
      semi: /^;/,

      comment: /^;([^\r\n]*)/,

      hex: /^\$([0-9A-F]+)|0x([0-9A-F]+)/i,
      number: /^([-+]?[0-9]*\.?[0-9]+([eE][-+]?[0-9]+)?)/,
      string: /^"([^"]*)"/,
      char: /^'(.)'/,
      id: /^([A-Z_][A-Z_0-9\.]*)/i,

      open_paren: /^\(/,
      close_paren: /^\)/,
      open_bracket: /^\[/,
      close_bracket: /^\]/,
      open_curly: /^\{/,
      close_curly: /^\}/,

      symbol: /^[@#\$%_]/,
      math: /^[\+\-\*\/]/,
      logic: /^[!&\|\^]/,
      comp: /^>|<|>=|<=|!=|==/,

      assign: /^([=])[^=>]/,
      fn_assign: /^=>/,
    }

    this.reset(text)
  }

  reset (text) {
    this.errors = 0
    this.lexer = null
    this.text = text || ''
    this.length = this.text.length
    this.offset = 0
    this.line = 1
    this.column = 1
    this.tokens = []
    return this
  }

  validOffset (offset) { return offset >= 0 && offset < this.length }

  eos () { return this.validOffset(this.offset) }

  char_at (i) { return this.text.charAt(i) }

  subtext (i) { return this.text.substring(i) }

  peek () {
    let pos_info = (offset, line, column) => { return { offset, line, column } }

    let token = null
    let l = _.last(this.tokens)
    let offset = this.offset
    let len = 0

    while ([' ', '\t'].indexOf(this.char_at(offset)) !== -1) {
      if (l && !l.next_is_space) {
        l.next_is_space = true
      }
      if (!this.validOffset(offset)) {
        return { token, offset }
      }
      offset++
    }

    let line = this.line
    let column = this.column
    for (let k in this.token_types) {
      let r = this.subtext(offset).match(this.token_types[k])
      if (r && r.index === 0) {
        let value = r.length > 1 ? r.slice(1).join('') : r.join('')
        len = r[0].length
        token = new Token(this, k, value, pos_info(offset, line, column), pos_info(offset + len, line, column + len - 1))
        offset += len
        break
      }
    }
    return { token, offset, len }
  }

  next () {
    let { token, offset, len } = this.peek()
    if (token) {
      this.tokens.push(token)
      this.offset = offset
      this.column += len + 1
      if (token.is('eol')) {
        this.line++
        this.column = 1
      }
    }
    return token
  }

  run (text) {
    this.reset(text)
    while (this.validOffset(this.offset)) {
      this.next()
    }
    return this
  }

  dump () {
    console.info('tokenizer dump')
    console.log(this.tokens)
    console.log('')
  }

}
