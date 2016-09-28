import { error } from '../globals.js'
import { Node } from './node.js'

var loop_while
var next_expr_node

export var block
export var statements
export var if_statement
export var else_statement
export var while_statement
export var statement

export var expr
export var exprs
export var term_expr
export var factor_expr
export var conditional_expr
export var junction_expr
export var sub_expr
export var simple_expr

export var fn_call
export var return_call
export var arg_def
export var fn_args_def

export var array_literal
export var dict_literal
export var key_literal
export var field_literal

export var single

export var var_expr
export var var_def
export var var_assign
export var fn_expr
export var fn_assign

loop_while = (parser, fn, matches, end, end_next, skip) => {
  let nodes = []
  if (skip) { parser.skip(skip) }
  while (!parser.eos && (!end || !parser.is(end)) && (!matches || parser.match(matches))) {
    nodes.push(fn(parser))
    if (skip) { parser.skip(skip) }
  }
  if (end) { parser.expect(end, end_next) }
  return nodes
}

next_expr_node = (parser, left) => {
  let token = parser.token
  let data = {}
  if (left) {
    parser.next()
    data = { left, right: expr(parser) }
  }
  let node = new Node(parser, token, data)
  if (!left) { parser.next() }
  return node
}

block = (parser, end, end_next = true, start_frame = null) => {
  if (start_frame) {
    parser.frames.start(start_frame)
  }
  let nodes = loop_while(parser, statement, null, end, end_next, 'eol')
  if (start_frame) {
    parser.frames.end()
  }
  return nodes
}

statements = parser => block(parser)

if_statement = (parser, expect_end = true) => {
  let token = parser.token
  parser.next()
  let expr_block
  if (parser.is('open_paren')) {
    parser.next()
    expr_block = expr(parser)
    parser.expect('close_paren')
  }
  else {
    expr_block = expr(parser)
  }
  let true_body = block(parser, ['else', 'end'], false, 'if')
  let false_body = parser.is('else') ? else_statement(parser, false) : null
  if (expect_end) { parser.expect('end') }
  return new Node(parser, token, { expr: expr_block, true_body, false_body })
}

else_statement = (parser, expect_end = true) => {
  let token = parser.token
  let node = null
  parser.next()
  if (parser.is('if')) {
    node = if_statement(parser, false)
    node.token = token
  }
  else {
    node = new Node(parser, token, { false_body: block(parser, 'end', false, 'else') })
  }
  if (expect_end) { parser.expect('end') }
  return node
}

while_statement = parser => {
  let token = parser.token
  parser.next()
  let expr_block
  if (parser.is('open_paren')) {
    parser.next()
    expr_block = expr(parser)
    parser.expect('close_paren')
  }
  else {
    expr_block = expr(parser)
  }
  let body = block(parser, 'end', false, 'while')
  parser.expect('end')
  return new Node(parser, token, { expr: expr_block, body })
}

statement = parser => {
  if (parser.match(['let', 'id|var'])) { return var_def(parser) } // variable definition
  else if (parser.match(['var', 'assign'])) { return var_assign(parser) } // variable assignment
  else if (parser.match(['var', 'fn_assign'])) { return fn_assign(parser) } // function assignment
  else if (parser.is('if')) { return if_statement(parser) } // if block
  else if (parser.is('while')) { return while_statement(parser) } // while block
  else if (parser.is('fn')) { return fn_call(parser) } // function call
  else if (parser.is('return')) { return return_call(parser) } // return value(s) from function
  else if (parser.is(['break', 'continue'])) { return single(parser) } // single statement
  else {
    error(parser, parser.token, 'syntax error')
    parser.next()
  }
  return null
}

term_expr = (parser, left) => parser.is(/\+|-/) ? next_expr_node(parser, left) : null

factor_expr = (parser, left) => parser.is(/\/|\*/) ? next_expr_node(parser, left) : null

conditional_expr = (parser, left) => parser.is(/>|>=|<|<=|!=|<>|==/) ? next_expr_node(parser, left) : null

junction_expr = (parser, left) => parser.is(/&|\|/) ? next_expr_node(parser, left) : null

sub_expr = parser => {
  let nodes = []
  nodes.push(new Node(parser, parser.token))
  parser.expect('open_paren')
  nodes.push(expr(parser))
  nodes.push(new Node(parser, parser.token))
  parser.expect('close_paren')
  return nodes
}

simple_expr = parser => {
  if (parser.is(['number', 'string', 'char'])) { return next_expr_node(parser) }
  else if (parser.is('var')) { return var_expr(parser) }
  else if (parser.is('fn_assign')) { return fn_expr(parser) }
  else if (parser.is('open_paren')) { return sub_expr(parser) }
  else if (parser.is('open_bracket')) { return array_literal(parser) }
  else if (parser.is('open_curly')) { return dict_literal(parser) }
  else {
    error(parser, parser.token, 'number, string, variable, variable paren or function call/expression expected')
    parser.next()
  }
  return null
}

exprs = (parser, end, end_next) => loop_while(parser, expr, null, end, end_next, 'comma')

expr = parser => {
  let node = simple_expr(parser)
  if (node) {
    let term = term_expr(parser, node)
    if (term) { return term }

    let factor = factor_expr(parser, node)
    if (factor) { return factor }

    let conditional = conditional_expr(parser, node)
    if (conditional) { return conditional }

    let junction = junction_expr(parser, node)
    if (junction) { return junction }
  }
  return node
}

fn_call = parser => {
  let p = false
  let end = 'eol|end'
  let node = new Node(parser, parser.token)
  node.data.args = []
  parser.next()
  if (parser.is('open_paren')) {
    p = true
    end = 'close_paren'
    parser.next()
  }
  node.data.args = exprs(parser, end, false)
  if (p) {
    parser.expect('close_paren')
  }
  return node
}

return_call = parser => {
  let p = false
  let end = 'eol|end|close_paren'
  let node = new Node(parser, parser.token)
  parser.next()
  if (parser.is('open_paren')) {
    p = true
    end = 'close_paren'
    parser.next()
  }
  node.data.args = exprs(parser, end, false)
  if (p) {
    parser.expect('close_paren')
  }
  return node
}

single = parser => {
  let node = new Node(parser, parser.token)
  parser.next()
  return node
}

array_literal = parser => {
  let node = new Node(parser, parser.token)
  node.data.args = []
  parser.expect('open_bracket')
  if (!parser.is('close_bracket')) {
    node.data.args = loop_while(parser, expr, null, 'close_bracket', false, 'comma')
  }
  parser.expect('close_bracket')
  return node
}

dict_literal = parser => {
  let node = new Node(parser, parser.token)
  node.data.def = []
  parser.expect('open_curly')
  if (!parser.is('close_curly')) {
    node.data.def = loop_while(parser, key_literal, ['key'], 'close_curly', false, 'comma')
  }
  parser.expect('close_curly')
  return node
}

key_literal = parser => {
  let node = new Node(parser, parser.token)
  parser.expect('key')
  node.data.expr = expr(parser)
  return node
}

arg_def = parser => {
  let node = new Node(parser, parser.token)
  parser.frames.add('var', node)
  node.token._scope = parser.frames.current.name
  parser.next()
  return node
}

fn_args_def = parser => loop_while(parser, arg_def, ['id'], 'close_paren', false, 'comma')

field_literal = parser => {
  let node = new Node(parser, parser.token)
  node.data.args = []
  node._field = true

  if (parser.is('open_bracket')) {
    parser.next()
    if (!parser.is('close_bracket')) {
      node.data.args = loop_while(parser, expr, null, 'close_bracket', false, 'comma')
    }
    parser.expect('close_bracket')
    return node
  }

  let p = false
  let end = 'eol|end'
  node.token._type = 'fn'
  parser.next()

  if (parser.is('open_paren')) {
    p = true
    end = 'close_paren'
    parser.next()
  }

  if (!parser.is(['comma', 'id_field'])) {
    if (!node.data.fields) {
      node.data.fields = []
    }
    node.data.args = exprs(parser, end, false)
  }

  if (p) {
    parser.expect('close_paren')
  }

  return node
}

var_expr = parser => {
  let node = new Node(parser, parser.token)
  parser.next()
  while (parser.is(['id_field', 'open_bracket'])) {
    if (!node.data.fields) {
      node.data.fields = []
    }
    node.data.fields.push(field_literal(parser))
  }
  return node
}

var_def = parser => {
  let node = null

  parser.next()

  let id = parser.token

  node = new Node(parser, id)
  parser.frames.add('var', node)
  id._scope = parser.frames.current.name

  let p = parser.peek()
  if (!p.is('assign') && !p.is('fn_assign')) {
    parser.next()
  }

  return node
}

var_assign = parser => {
  let node = null

  let id = parser.token
  parser.next()

  node = new Node(parser, parser.token, { id })

  parser.next()

  node.data.expr = expr(parser)

  return node
}

fn_expr = (parser, id) => {
  let node = new Node(parser, parser.token, { id })
  node.data.args = []

  parser.frames.start(id ? id.type : 'fn')

  parser.next()

  if (id) {
    let f = parser.frames.exists(id.value)
    if (f) {
      f.item_type = 'fn'
    }
  }

  if (parser.is('open_paren')) {
    parser.next()
    parser.var_def_mode = true
    if (!parser.is('close_paren')) {
      node.data.args = fn_args_def(parser)
    }
    parser.var_def_mode = false
    parser.expect('close_paren')
  }

  node.data.body = block(parser, 'end', false)

  parser.expect('end')

  parser.frames.end()

  return node
}

fn_assign = parser => {
  let id = parser.token
  parser.next()
  return fn_expr(parser, id)
}
