import _ from 'lodash'
import { error } from '../globals.js'
import { Frames } from './frame.js'

export var Node
export var Parser

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


Parser = class {

  constructor (lexer) {
    this.lexer = lexer
    this.lexer.parser = this
    this.frames = new Frames(this)
    this.reset()
  }

  reset () {
    this.errors = 0
    this.offset = 0
    this.nodes = []
    this.constants = {}
    this.frames.reset()
    this.prev_frame = null
  }

  validOffset (offset) { return offset >= 0 && offset < this.length }

  token_at (offset) { return this.validOffset(offset) ? this.tokens[offset] : null }

  get eos () { return this.offset >= this.length }

  get length () { return this.tokens.length }

  get tokens () { return this.lexer.tokens }

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
    let nodes = this.statements()
    this.frames.end()
    this.nodes = nodes
    return nodes
  }

  dump () {
    console.info('parser dump')
    console.log(this.nodes)
    console.log('')
  }

  loop_while (fn, matches, end, end_next, skip) {
    let nodes = []
    if (skip) { this.skip(skip) }
    while (!this.eos && (!end || !this.is(end)) && (!matches || this.match(matches))) {
      nodes.push(fn.call(this))
      if (skip) { this.skip(skip) }
    }
    if (end) { this.expect(end, end_next) }
    return nodes
  }

  next_expr_node (left) {
    let token = this.token
    let data = {}
    if (left) {
      this.next()
      data = { left, right: this.expr() }
    }
    let node = new Node(this, token, data)
    if (!left) { this.next() }
    return node
  }

  block (end, end_next = true, start_frame = null) {
    if (start_frame) {
      this.frames.start(start_frame)
    }
    let nodes = this.loop_while(this.statement, null, end, end_next, 'eol')
    if (start_frame) {
      this.prev_frame = this.frames.current
      this.frames.end()
    }
    return nodes
  }

  statements () { return this.block() }

  statement () {
    if (this.match(['let', 'id|var'])) { return this.var_def() } // variable definition
    else if (this.match(['var', 'assign'])) { return this.var_assign() } // variable assignment
    else if (this.match(['var', 'fn_assign'])) { return this.fn_assign() } // function assignment
    else if (this.is('if')) { return this.if_statement() } // if block
    else if (this.is('for')) { return this.for_statement() } // while block
    else if (this.is('while')) { return this.while_statement() } // while block
    else if (this.is('fn')) { return this.fn_call() } // function call
    else if (this.is('return')) { return this.return_call() } // return value(s) from function
    else if (this.is(['break', 'continue'])) { return this.single() } // single statement
    else {
      error(this, this.token, 'syntax error')
      this.next()
    }
    return null
  }

  if_statement (expect_end = true) {
    let token = this.token
    this.next()
    let expr_block
    if (this.is('open_paren')) {
      this.next()
      expr_block = this.expr()
      this.expect('close_paren')
    }
    else {
      expr_block = this.expr()
    }
    let true_body = this.block(['else', 'end'], false, 'if')
    let false_body = this.is('else') ? this.else_statement(false) : null
    if (expect_end) { this.expect('end') }
    return new Node(this, token, { expr: expr_block, true_body, false_body })
  }

  else_statement (expect_end = true) {
    let token = this.token
    let node = null
    this.next()
    if (this.is('if')) {
      node = this.if_statement(false)
      node.token = token
    }
    else {
      node = new Node(this, token, { false_body: this.block('end', false, 'else') })
    }
    if (expect_end) { this.expect('end') }
    return node
  }

  for_statement () {
    let token = this.token
    this.next()

    let v = this.token
    this.expect('id|var')
    this.expect('assign')
    let min_expr = this.expr()
    this.expect('to')
    let max_expr = this.expr()
    let step_expr = null
    if (this.is('step')) {
      this.next()
      step_expr = this.expr()
    }
    let nodes = []
    this.frames.start('for')
    this.frames.current.add('var', v)
    let body = this.block('end', false)
    token._scope = this.frames.current.name
    this.frames.end()
    this.expect('end')
    nodes.push(new Node(this, token, { v, min_expr, max_expr, step_expr, body }))
    return nodes
  }

  while_statement () {
    let token = this.token
    this.next()
    let expr_block
    if (this.is('open_paren')) {
      this.next()
      expr_block = this.expr()
      this.expect('close_paren')
    }
    else {
      expr_block = this.expr()
    }
    let body = this.block('end', false, 'while')
    this.expect('end')
    return new Node(this, token, { expr: expr_block, body })
  }

  term_expr (left) { return this.is(/\+|-/) ? this.next_expr_node(left) : null }

  factor_expr (left) { return this.is(/\/|\*/) ? this.next_expr_node(left) : null }

  conditional_expr (left) { return this.is(/>|>=|<|<=|!=|<>|==/) ? this.next_expr_node(left) : null }

  junction_expr (left) { return this.is(/&|\|/) ? this.next_expr_node(left) : null }

  sub_expr () {
    let nodes = []
    nodes.push(new Node(this, this.token))
    this.expect('open_paren')
    nodes.push(this.expr())
    nodes.push(new Node(this, this.token))
    this.expect('close_paren')
    return nodes
  }

  simple_expr () {
    if (this.is(['number', 'string', 'char'])) { return this.next_expr_node() }
    else if (this.is('var')) { return this.var_expr() }
    else if (this.is('fn_assign')) { return this.fn_expr() }
    else if (this.is('open_paren')) { return this.sub_expr() }
    else if (this.is('open_bracket')) { return this.array_literal() }
    else if (this.is('open_curly')) { return this.dict_literal() }
    else {
      error(this, this.token, 'number, string, variable, variable paren or function call/expression expected')
      this.next()
    }
    return null
  }

  exprs (end, end_next) { return this.loop_while(this.expr, null, end, end_next, 'comma') }

  expr () {
    let node = this.simple_expr()
    if (node) {
      let term = this.term_expr(node)
      if (term) { return term }

      let factor = this.factor_expr(node)
      if (factor) { return factor }

      let conditional = this.conditional_expr(node)
      if (conditional) { return conditional }

      let junction = this.junction_expr(node)
      if (junction) { return junction }
    }
    return node
  }

  fn_call () {
    let p = false
    let end = 'eol|end'
    let node = new Node(this, this.token)
    node.data.args = []
    this.next()
    if (this.is('open_paren')) {
      p = true
      end = 'close_paren'
      this.next()
    }
    node.data.args = this.exprs(end, false)
    if (p) {
      this.expect('close_paren')
    }
    return node
  }

  return_call () {
    let p = false
    let end = 'eol|end|close_paren'
    let node = new Node(this, this.token)
    this.next()
    if (this.is('open_paren')) {
      p = true
      end = 'close_paren'
      this.next()
    }
    node.data.args = this.exprs(end, false)
    if (p) {
      this.expect('close_paren')
    }
    return node
  }

  single () {
    let node = new Node(this, this.token)
    this.next()
    return node
  }

  array_literal () {
    let node = new Node(this, this.token)
    node.data.args = []
    this.expect('open_bracket')
    if (!this.is('close_bracket')) {
      node.data.args = this.loop_while(this.expr, null, 'close_bracket', false, 'comma')
    }
    this.expect('close_bracket')
    return node
  }

  dict_literal () {
    let node = new Node(this, this.token)
    node.data.def = []
    this.expect('open_curly')
    if (!this.is('close_curly')) {
      node.data.def = this.loop_while(this.key_literal, ['key'], 'close_curly', false, 'comma')
    }
    this.expect('close_curly')
    return node
  }

  key_literal () {
    let node = new Node(this, this.token)
    this.expect('key')
    node.data.expr = this.expr()
    return node
  }

  arg_def () {
    let node = new Node(this, this.token)
    this.frames.add('var', node)
    node.token._scope = this.frames.current.name
    this.next()
    return node
  }

  fn_args_def () { return this.loop_while(this.arg_def, ['id'], 'close_paren', false, 'comma') }

  field_literal () {
    let node = new Node(this, this.token)
    node.data.args = []
    node._field = true

    if (this.is('open_bracket')) {
      this.next()
      if (!this.is('close_bracket')) {
        node.data.args = this.loop_while(this.expr, null, 'close_bracket', false, 'comma')
      }
      this.expect('close_bracket')
      return node
    }

    let p = false
    let end = 'eol|end'
    this.next()

    if (this.is('open_paren')) {
      p = true
      end = 'close_paren'
      this.next()
    }

    if (!this.is(['comma', 'id_field'])) {
      if (!node.data.fields) {
        node.data.fields = []
      }
      node.data.args = this.exprs(end, false)
    }

    if (p) {
      this.expect('close_paren')
    }

    node.token._type = p ? 'fn' : 'var'

    return node
  }

  var_expr () {
    let node = new Node(this, this.token)
    this.next()
    while (this.is(['id_field', 'open_bracket'])) {
      if (!node.data.fields) {
        node.data.fields = []
      }
      node.data.fields.push(this.field_literal())
    }
    return node
  }

  var_def () {
    this.next()

    let id = this.token

    let node = new Node(this, id)
    this.frames.add('var', node)
    id._scope = this.frames.current.name

    let p = this.peek()
    if (!p.is('assign') && !p.is('fn_assign')) {
      this.next()
    }

    return node
  }

  var_assign () {
    let id = this.token
    this.next()

    let node = new Node(this, this.token, { id })

    this.next()

    node.data.expr = this.expr()

    return node
  }

  fn_expr (id) {
    let node = new Node(this, this.token, { id })
    node.data.args = []

    this.frames.start(id ? id.type : 'fn')

    this.next()

    if (id) {
      let f = this.frames.exists(id.value)
      if (f) {
        f.item_type = 'fn'
      }
    }

    if (this.is('open_paren')) {
      this.next()
      this.var_def_mode = true
      if (!this.is('close_paren')) {
        node.data.args = this.fn_args_def()
      }
      this.var_def_mode = false
      this.expect('close_paren')
    }

    node.data.body = this.block('end', false)

    this.expect('end')

    this.frames.end()

    return node
  }

  fn_assign () {
    let id = this.token
    this.next()
    return this.fn_expr(id)
  }

}
