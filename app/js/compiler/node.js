
export var Node

Node = class {

  constructor (parser, token, data) {
    this.parser = parser
    this.token = token
    this.data = data || {}
  }

  token_prop (name) { return this.token ? this.token[name] : null }

  get value () { return this.token_prop('value') }

  get type () { return this.token_prop('type') }

  get start () { return this.token_prop('start') }

  get end () { return this.token_prop('end') }

  get length () { return this.token_prop('length') }

  is (e) { return this.token ? this.token.is(e) : false }

  toString () { return this.token ? this.token.toString() : '' }

}
