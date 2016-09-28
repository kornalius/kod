import _ from 'lodash'
import { path, dirs, fs } from '../utils.js'

export var Token
export var Lexer

Token = class {

  constructor (lexer, type, value, start, end) {
    if (lexer instanceof Token) {
      let t = lexer
      this.lexer = t.lexer
      this._type = t._type
      this._reserved = t._reserved
      this.value = t.value
      this.start = _.clone(t.start)
      this.end = _.clone(t.end)
      this.length = t.value.length
    }
    else {
      this.lexer = lexer
      this._type = type
      this._reserved = false
      this.value = value || ''
      this.start = start || { offset: 0, line: 0, column: 0 }
      this.end = end || { offset: 0, line: 0, column: 0 }
      this.length = this.end.offset - this.start.offset
    }
  }

  get parser () { return this.lexer.parser }

  is (e) {
    if (_.isString(e)) {
      let parts = e.split('|')
      if (parts.length > 1) {
        for (let p of parts) {
          if (this.is(p)) {
            return true
          }
        }
      }
      else {
        return e === '.' || this.type === e || this.value === e
      }
    }
    else if (_.isRegExp(e)) {
      return this.type.match(e) || this.value.match(e)
    }
    else if (_.isArray(e)) {
      for (let i of e) {
        if (this.is(i)) {
          return true
        }
      }
    }
    return false
  }

  get type () {
    if (this._type === 'id') {
      let r = this.value.match(this.lexer.publics_regexp) // public words
      if (r && r.length > 0) {
        this._type = _.isFunction(this.lexer.vm.publics[r[0]]) ? 'fn' : 'var'
        this._scope = '_vm.publics'
        return this._type
      }

      r = this.value.match(this.lexer.globals_regexp) // global words
      if (r && r.length > 0) {
        this._type = 'var'
        return this._type
      }

      if (this.parser && !this.parser.var_def_mode) {
        let i = this.parser.frames.exists(this.value)
        if (i) {
          this._type = i.item_type
          this._scope = i.frame.name
          return this._type
        }
      }
    }
    return this._type
  }

  toString () {
    return _.template('"#{value}" (Line: #{line}, Column: #{column})')({ value: this.value, line: this.start.line, column: this.start.column })
  }

}


Lexer = class {

  constructor (vm, path, text) {
    this.vm = vm

    this.publics_regexp = new RegExp('^' + _.keys(this.vm.publics).join('|') + '$', 'i')
    this.globals_regexp = new RegExp('^' + ['Math'].join('|') + '$', 'i')

    this.token_types = {
      eol: /^[\r\n]/,
      comma: /^,/,

      comment: /^(;|\/\/)([^\r\n]*)/,

      hex: /^\$([0-9A-F]+)|0x([0-9A-F]+)/i,
      number: /^([-+]?[0-9]*\.?[0-9]+([eE][-+]?[0-9]+)?)/,

      string: /^"([^"]*)"/,
      char: /^'(.)'/,

      include: /^#"([^"]*)"/i,

      const: /^#([A-Z_][A-Z_0-9]*)/i,

      key: /^:([A-Z_][A-Z_0-9]*)/i,

      id_field: /^\.([A-Z_][A-Z_0-9]*)/i,
      id: /^([A-Z_][A-Z_0-9]*)/i,

      open_paren: /^\(/,
      close_paren: /^\)/,
      open_bracket: /^\[/,
      close_bracket: /^\]/,
      open_curly: /^\{/,
      close_curly: /^\}/,

      symbol: /^[@\$_]/,
      math: /^[\+\-\*\/%]/,
      logic: /^[!&\|\^]/,
      comp: /^>|<|>=|<=|!=|==/,

      assign: /^([=])[^=>]/,
      fn_assign: /^=>/,
    }

    this.reset(path, text)
  }

  reset (path, text) {
    this.errors = 0
    this.parser = null
    this.path = path || ''
    this.text = text || ''
    this.length = this.text.length
    this.offset = 0
    this.line = 1
    this.column = 1
    this.tokens = []
    this.constants = {}
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
    while (token && token._type === 'comment') {
      let t = this.peek()
      token = t.token
      offset = t.offset
      len = t.len
      this.offset = offset
      this.column += len + 1
    }
    if (token) {
      if (token.type === 'const') {
        let c = []
        this.constants[token.value.toLowerCase()] = c
        this.offset = offset
        this.column += len + 1
        while (true) {
          let p = this.peek()
          token = p.token
          if (token) {
            this.offset = p.offset
            this.column += p.len + 1
          }
          if (!token || token.is('eol')) {
            break
          }
          if (token) {
            c.push(token)
          }
        }
      }
      else if (token.type === 'include') {
        this.offset = offset
        this.column += len + 1
        let fn = token.value + (path.extname(token.value) === '' ? '.kod' : '')
        let pn = path.join(__dirname, fn)
        try {
          fs.statSync(pn)
        }
        catch (e) {
          try {
            pn = path.join(dirs.user, fn)
            fs.statSync(pn)
          }
          catch (e) {
            pn = ''
          }
        }

        if (pn !== '') {
          let src = fs.readFileSync(pn, 'utf8')
          let lx = new Lexer(this.vm)
          lx.run(pn, src)
          if (!lx.errors) {
            _.extend(this.constants, lx.constants)
            this.tokens = this.tokens.concat(lx.tokens)
          }
        }
      }
      else {
        let c = this.constants[token.value.toLowerCase()]
        if (c) {
          this.tokens = this.tokens.concat(c)
        }
        else {
          this.tokens.push(token)
        }
        this.offset = offset
        this.column += len + 1
      }
      if (token && token.is('eol')) {
        this.line++
        this.column = 1
      }
    }
    return token
  }

  run (path, text) {
    if (!text) {
      text = path
      path = ''
    }
    this.reset(path, text)
    while (this.validOffset(this.offset)) {
      this.next()
    }
    return this
  }

  dump () {
    console.info('lexer dump')
    console.log(this.tokens)
    console.log('')
  }

}