import _ from 'lodash'

export var comma
export var string
export var eol
export var indent
export var l
export var i
export var a
export var f
export var c
export var s
export var b
export var e

export var Transpiler

string = value => '\'' + value.replace(/'/g, '\'') + '\''

comma = nodes => {
  let a = []
  for (let n of nodes) {
    a.push(n instanceof Node ? e(n) : n)
  }
  return a.join(', ')
}

eol = s => s ? ';' : ''

indent = 0

// generate line
l = str => str + (!_.endsWith(str, '\n') ? '\n' : '')

// indent line
i = str => _.padStart('', indent * 2) + str

// generate assignment
a = node => {
  let t = {}
  if (node) {
    let d = node.data || {}

    if (node.is('assign')) {
      t = {
        tmpl: '#{let}#{id} #{op} #{expr};',
        dat: { let: node._let ? 'var ' : '', id: d.id.value, op: node.token.value, expr: e(d.expr) }
      }
    }

    else if (node.is('fn_assign')) {
      t = {
        tmpl: '#{let}#{id} = #{fn}',
        dat: { let: node._let ? 'var ' : '', id: d.id.value, fn: f(d.args, d.body, true) }
      }
    }
  }
  return t
}

// generate function definition
f = (args, body, semi) => {
  args = e(args, ', ')
  return _.template('function (#{args}) #{body}')({ args, body: b(body, semi, args) })
}

// generate function call
c = (node, semi = false) => {
  let t = {}
  if (node) {
    let d = node.data || {}
    t = {
      tmpl: '#{field}#{public}#{fn}(#{args})#{semi}',
      dat: { field: node._field ? '.' : '', public: node.token._publics ? '_vm.publics.' : '', fn: node.value, args: e(d.args, ', '), semi: semi ? ';' : '' }
    }
  }
  return t
}

// generate statement line(s)
s = node => {
  let str = ''

  if (_.isArray(node)) {
    for (let n of node) {
      str += s(n)
    }
  }
  else if (node) {
    let d = node.data || {}
    let t = {}

    if (node.is(['assign', 'fn_assign'])) {
      t = a(node)
    }
    else if (node.is('fn')) {
      t = c(node, true)
    }
    else if (node.is('if')) {
      t = {
        tmpl: 'if (#{expr}) #{true_body}#{false_body}',
        dat: { expr: e(d.expr), true_body: b(d.true_body, false, ''), false_body: s(d.false_body) }
      }
    }
    else if (node.is('else')) {
      if (d.expr) { // else if
        t = {
          tmpl: 'else if (#{expr}) #{true_body}#{false_body}',
          dat: { expr: e(d.expr), true_body: b(d.true_body, false, ''), false_body: s(d.false_body) }
        }
      }
      else {
        t = {
          tmpl: 'else #{false_body}',
          dat: { false_body: b(d.false_body, false, '') }
        }
      }
    }
    else if (node.is('while')) {
      t = {
        tmpl: 'while (#{expr}) #{body}',
        dat: { expr: e(d.expr), body: b(d.body, false, '') }
      }
    }
    else if (node.is('for')) {
      t = {
        tmpl: 'for (var #{v} = #{min_expr}; #{v} < #{max_expr}; #{v} += #{step_expr}) #{body}',
        dat: { v: d.v.value, min_expr: e(d.min_expr), max_expr: e(d.max_expr), step_expr: d.step_expr ? e(d.step_expr) : '1', body: b(d.body, false) }
      }
    }
    else if (node.is('return')) {
      t = {
        tmpl: 'return #{args};',
        dat: { args: e(d.args, ', ') }
      }
    }
    else if (node.is(['break', 'continue'])) {
      t = {
        tmpl: '#{word};',
        dat: { word: node.token.value }
      }
    }

    str = _.template(t.tmpl)(t.dat)
  }

  return l(i(str))
}

// generate indented block of statement(s)
b = (node, semi = false) => {
  let str = l('{')

  indent++

  if (_.isArray(node)) {
    for (let n of node) {
      str += s(n)
    }
  }
  else {
    str = s(node)
  }

  indent--

  str += l(i('}' + (semi ? ';' : '')))

  return str
}

// generate expression(s)
e = (node, separator) => {
  let str = ''

  if (_.isArray(node)) {
    let a = []
    for (let n of node) {
      a.push(e(n))
    }
    str = a.join(separator || '')
  }
  else {
    let d = node && node.data || {}
    let t = { tmpl: '', dat: {} }

    if (node) {
      if (_.isString(node)) {
        t = {
          tmpl: '#{node}',
          dat: { node }
        }
      }
      else if (node.is('fn')) {
        t = c(node)
      }
      else if (node.is('fn_assign')) {
        t = {
          tmpl: '#{fn}',
          dat: { fn: f(d.args, d.body, false) }
        }
      }
      else if (node.is('open_bracket')) {
        t = {
          tmpl: '[#{args}]#{fields}',
          dat: { args: e(d.args, ', '), fields: d.fields ? e(d.fields, '') : '' }
        }
      }
      else if (node.is('open_curly')) {
        let def = _.map(d.def, f => _.template('#{value}: #{expr}')({ value: f.value, expr: e(f.data.expr) }))
        t = {
          tmpl: '{#{def}}#{fields}',
          dat: { def: e(def, ', '), fields: d.fields ? e(d.fields, '') : '' }
        }
      }
      else if (node.is(['math', 'logic', 'comp'])) {
        t = {
          tmpl: '#{left} #{op} #{right}',
          dat: { op: node.value, left: e(d.left), right: e(d.right) }
        }
      }
      else if (node.is(['char', 'string'])) {
        t = {
          tmpl: '#{value}',
          dat: { value: string(node.value) }
        }
      }
      else if (node.is('id')) {
        t = {
          tmpl: '#{field}#{value}#{fields}',
          dat: { field: node._field ? '.' : '', value: node.value, fields: d.fields ? e(d.fields, '') : '' }
        }
      }
      else {
        t = {
          tmpl: '#{value}',
          dat: { value: node.value }
        }
      }
    }
    else {
      t = {
        tmpl: 'undefined',
        dat: {}
      }
    }

    str = _.template(t.tmpl)(t.dat)
  }

  return str
}

Transpiler = class {

  constructor (nodes) {
    this.reset(nodes || [])
  }

  get length () { return this.lines.length }

  get eos () { return this.offset >= this.nodes.length }

  get node () { return this.node_at(this.offset) }

  validOffset (offset) { return offset >= 0 && offset < this.nodes.length }

  node_at (offset) { return this.validOffset(offset) ? this.nodes[offset] : null }

  peek (c = 1) { return this.node_at(this.offset + c) }

  next (c = 1) { this.offset += c }

  write (...values) { this.line += values.join('') }

  writeln (...values) {
    this.write(...values)
    this.lines = this.lines.concat(this.line.split('\n'))
    this.line = ''
  }

  reset (nodes) {
    this.errors = 0
    this.nodes = nodes
    this.lines = []
    this.line = ''
    this.offset = 0
    this.code = ''
    indent = 0
  }

  code_start () {
    this.writeln()
  }

  code_end () {
    this.writeln()
  }

  run (nodes) {
    this.reset(nodes)
    this.code_start()
    while (!this.eos) {
      this.writeln(s(this.node))
      this.next()
    }
    this.code_end()
    this.code = this.lines.join('\n')
    return this.code
  }

  dump () {
    console.info('transpiler dump')
    console.log(this.code)
    console.log('')
  }

}
