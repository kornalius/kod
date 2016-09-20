import { error } from '../../globals.js'
import { Node } from '../lexer/node.js'

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
export var fn_args_def

export var var_assign
export var array_def
export var type_def

loop_while = (lexer, fn, args, matches, end, end_next, skip) => {
  let nodes = []
  if (skip) { lexer.skip(skip) }
  while (!lexer.eos && (!end || !lexer.is(end)) && (!matches || lexer.match(matches))) {
    nodes.push(fn(lexer, ...args))
    if (skip) { lexer.skip(skip) }
  }
  if (end) { lexer.expect(end, end_next) }
  return nodes
}

next_expr_node = (lexer, left) => {
  let token = lexer.token
  let data = {}
  if (left) {
    lexer.next()
    data = { left, right: expr(lexer) }
  }
  let node = new Node(lexer, token, data)
  if (!left) { lexer.next() }
  return node
}

block = (lexer, end, end_next = true) => loop_while(lexer, statement, [], null, end, end_next, 'eol')

statements = lexer => block(lexer)

if_statement = (lexer, expect_end = true) => {
  let token = lexer.token
  lexer.next()
  let expr_block
  if (lexer.is('open_paren')) {
    lexer.next()
    expr_block = expr(lexer)
    lexer.expect('close_paren')
  }
  else {
    expr_block = expr(lexer)
  }
  let true_body = block(lexer, ['else', 'end'], false)
  let false_body = lexer.is('else') ? else_statement(lexer, false) : null
  if (expect_end) { lexer.expect('end') }
  return new Node(lexer, token, { expr: expr_block, true_body, false_body })
}

else_statement = (lexer, expect_end = true) => {
  let token = lexer.token
  let node = null
  lexer.next()
  if (lexer.is('if')) {
    node = if_statement(lexer, false)
    node.token = token
  }
  else {
    node = new Node(lexer, token, { false_body: block(lexer, 'end', false) })
  }
  if (expect_end) { lexer.expect('end') }
  return node
}

while_statement = lexer => {
  let token = lexer.token
  lexer.next()
  let expr_block
  if (lexer.is('open_paren')) {
    lexer.next()
    expr_block = expr(lexer)
    lexer.expect('close_paren')
  }
  else {
    expr_block = expr(lexer)
  }
  let body = block(lexer, 'end')
  return new Node(lexer, token, { expr: expr_block, body })
}

statement = lexer => {
  if (lexer.match(['type', 'id'])) { return type_def(lexer) } // variable or function definition
  else if (lexer.is('var')) { return var_assign(lexer) } // variable or function assignment
  else if (lexer.is('if')) { return if_statement(lexer) } // if block
  else if (lexer.is('while')) { return while_statement(lexer) } // while block
  else if (lexer.is('fn')) { return fn_call(lexer) } // function call
  else {
    error(lexer, lexer.token, 'syntax error')
    lexer.next()
  }
  return null
}

term_expr = (lexer, left) => lexer.is(/\+|-/) ? next_expr_node(lexer, left) : null

factor_expr = (lexer, left) => lexer.is(/\/|\*/) ? next_expr_node(lexer, left) : null

conditional_expr = (lexer, left) => lexer.is(/>|>=|<|<=|!=|<>|==/) ? next_expr_node(lexer, left) : null

junction_expr = (lexer, left) => lexer.is(/&|\|/) ? next_expr_node(lexer, left) : null

sub_expr = lexer => {
  let nodes = []
  nodes.push(new Node(lexer, lexer.token))
  lexer.expect('open_paren')
  nodes.push(expr(lexer))
  nodes.push(new Node(lexer, lexer.token))
  lexer.expect('close_paren')
  return nodes
}

simple_expr = lexer => {
  if (lexer.is(['number', 'string', 'var'])) { return next_expr_node(lexer) }
  else if (lexer.is('open_paren')) { return sub_expr(lexer) }
  else {
    error(lexer, lexer.token, 'number, string, variable, paren or function call/expression expected')
    lexer.next()
  }
  return null
}

exprs = (lexer, end, end_next) => loop_while(lexer, expr, [], null, end, end_next, 'comma')

expr = lexer => {
  let node = simple_expr(lexer)
  if (node) {
    let term = term_expr(lexer, node)
    if (term) { return term }

    let factor = factor_expr(lexer, node)
    if (factor) { return factor }

    let conditional = conditional_expr(lexer, node)
    if (conditional) { return conditional }

    let junction = junction_expr(lexer, node)
    if (junction) { return junction }
  }
  return node
}

fn_call = lexer => {
  let end = 'eol'
  let node = new Node(lexer, lexer.token)
  lexer.next()
  if (lexer.is('open_paren')) {
    end = 'close_paren'
    lexer.next()
  }
  node.data.args = exprs(lexer, end)
  return node
}

fn_args_def = lexer => loop_while(lexer, type_def, [false, true], ['type', 'id'], null, false, 'comma')

var_assign = (lexer, type, allow_fn = true, args_def = false, allow_dimensions = false) => {
  let node = null
  let dimensions = null
  let id = lexer.token
  lexer.next()
  // Array dimensions definition
  if (allow_dimensions && lexer.is('open_bracket')) {
    dimensions = array_def(lexer)
  }
  node = new Node(lexer, lexer.token, { type, id, dimensions })
  if (lexer.is('assign')) {
    lexer.next()
    node.data.expr = expr(lexer)
  }
  else if (allow_fn && lexer.is('fn_assign')) {
    lexer.frames.start(node.data.id.value)
    lexer.frames.add('fn', node)
    lexer.next()
    if (lexer.is('open_paren')) {
      lexer.next()
      node.data.args = fn_args_def(lexer)
      lexer.expect('close_paren')
    }
    node.data.body = block(lexer, 'end', true)
    lexer.frames.end()
  }
  return node
}

array_def = lexer => {
  let nodes = []
  nodes.push(new Node(lexer, lexer.token))
  lexer.expect('open_bracket')
  nodes.push(exprs(lexer, 'close_bracket', false))
  nodes.push(new Node(lexer, lexer.token))
  lexer.expect('close_bracket')
  return nodes
}

type_def = (lexer, allow_fn = true, args_def = false) => {
  let type = lexer.token
  lexer.next()
  let node = var_assign(lexer, type, allow_fn, args_def, true)
  lexer.frames.add(node.is('fn_assign') ? 'fn' : 'var', node)
  node.def = true
  return node
}
