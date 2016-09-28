import _ from 'lodash'

export var Token

Token = class {

  constructor (tokenizer, type, value, start, end) {
    if (tokenizer instanceof Token) {
      let t = tokenizer
      this.tokenizer = t.tokenizer
      this._type = t._type
      this._reserved = t._reserved
      this.value = t.value
      this.start = _.clone(t.start)
      this.end = _.clone(t.end)
      this.length = t.value.length
    }
    else {
      this.tokenizer = tokenizer
      this._type = type
      this._reserved = false
      this.value = value || ''
      this.start = start || { offset: 0, line: 0, column: 0 }
      this.end = end || { offset: 0, line: 0, column: 0 }
      this.length = this.end.offset - this.start.offset
    }
  }

  get lexer () { return this.tokenizer.lexer }

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
      let r = this.value.match(this.tokenizer.publics_regexp) // public words
      if (r && r.length > 0) {
        this._type = _.isFunction(this.tokenizer.vm.publics[r[0]]) ? 'fn' : 'var'
        this._scope = '_vm.publics'
      }
      else if (this.lexer && !this.lexer.var_def_mode) {
        let i = this.lexer.frames.exists(this.value)
        if (i) {
          this._type = i.item_type
          this._scope = i.frame.name
        }
      }
    }
    return this._type
  }

  toString () {
    return _.template('"#{value}" (Line: #{line}, Column: #{column})')({ value: this.value, line: this.start.line, column: this.start.column })
  }

}
