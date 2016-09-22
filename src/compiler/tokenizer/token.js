import _ from 'lodash'

export var Token
export var reserved = {}

Token = class {

  constructor (tokenizer, type, value, start, end) {
    this.tokenizer = tokenizer
    this._type = type
    this._reserved = false
    this.value = value || ''
    this.start = start || { offset: 0, line: 0, column: 0 }
    this.end = end || { offset: 0, line: 0, column: 0 }
    this.length = this.end.offset - this.start.offset
  }

  get lexer () { return this.tokenizer.lexer }

  is (e) {
    if (_.isString(e)) {
      return e === '.' || this.type === e || this.value === e
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
      let r = this.value.match(new RegExp('^' + _.keys(reserved).join('|') + '$', 'i')) // reserved words
      if (r && r.length > 0) {
        this._type = reserved[r[0]]
        this._reserved = true
      }
      else if (this.lexer) {
        let i = this.lexer.frames.exists(this.value)
        if (i) {
          this._type = i.item_type
          this._global = i.is_global
        }
      }
    }
    return this._type
  }

  toString () {
    return _.template('"#{value}" (Line: #{line}, Column: #{column})')({ value: this.value, line: this.start.line, column: this.start.column })
  }

}
