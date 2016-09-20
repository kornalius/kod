
export var Node

Node = class {

  constructor (lexer, token, data) {
    this.lexer = lexer
    this.token = token
    this.data = data || {}
  }

  get_token_prop (name) { return this.token ? this.token[name] : null }

  get value () { return this.get_token_prop('value') }

  get type () { return this.get_token_prop('type') }

  get start () { return this.get_token_prop('start') }

  get end () { return this.get_token_prop('end') }

  get length () { return this.get_token_prop('length') }

  is (e) { return this.token ? this.token.is(e) : false }

  toString () { return this.token ? this.token.toString() : '' }

}
