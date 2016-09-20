import _ from 'lodash'

export var token_data_type
export var comma
export var string
export var eol
export var indent
export var l
export var i
export var s
export var b
export var e

export var Transpiler

token_data_type = {
  i8: 'b',
  int8: 'b',
  byte: 'b',

  u8: 'B',
  uint8: 'B',
  ubyte: 'B',

  i16: 'w',
  int16: 'w',
  int: 'w',
  word: 'w',
  short: 'w',

  u16: 'W',
  uint16: 'W',
  uint: 'W',
  uword: 'W',
  ushort: 'W',

  i32: 'i',
  int32: 'i',
  long: 'i',
  dword: 'i',
  let: 'i',

  u32: 'I',
  uint32: 'I',
  ulong: 'I',
  udword: 'I',

  f32: 'f',
  float: 'f',
  float32: 'f',

  f64: 'd',
  float64: 'd',
  double: 'd',

  string: 's',
}

string = value => '\'' + value.replace(/'/g, '\'') + '\''

comma = nodes => {
  let a = []
  for (let n of nodes) {
    a.push(e(n))
  }
  return a.join(', ')
}

eol = s => s ? ';' : ''

indent = 0

// generate line
l = str => str + (!_.endsWith(str, '\n') ? '\n' : '')

// indent line
i = str => _.padStart('', indent * 2) + str

// generate statement line(s)
s = node => {
  let str = ''

  if (_.isArray(node)) {
    for (let n of node) {
      str += s(n)
    }
  }
  else {
    let d = node.data
    let tmpl = ''
    let dat = {}

    if (node.is('assign')) {
      if (node.def) {
        tmpl = 'var #{id} = alloc(#{type}, #{dimensions}, #{expr});'
        dat = { id: e(d.id), type: e(d.type), dimensions: d.dimensions ? e(d.dimensions) : '1', expr: e(d.expr) }
      }
      else {
        tmpl = '#{id} = #{expr};'
        dat = { id: e(d.id), expr: e(d.expr) }
      }
    }
    else if (node.is('fn_assign')) {
      tmpl = '#{id} = function (#{args}) #{body}'
      dat = { id: e(d.id), args: e(_.map(d.args, a => a.data.id), ', '), body: b(d.body, true) }
      if (node.def) {
        tmpl = 'var ' + tmpl
      }
    }
    else if (node.is('fn')) {
      tmpl = '#{fn}(#{args});'
      dat = { fn: node.value, args: e(d.args, ', ') }
    }
    else if (node.is('if')) {
      tmpl = 'if (#{expr}) #{true_body}#{false_body}'
      dat = { expr: e(d.expr), true_body: b(d.true_body), false_body: s(d.false_body) }
    }
    else if (node.is('else')) {
      if (d.expr) { // else if
        tmpl = 'else if (#{expr}) #{true_body}#{false_body}'
        dat = { expr: e(d.expr), true_body: b(d.true_body), false_body: s(d.false_body) }
      }
      else {
        tmpl = 'else #{false_body}'
        dat = { false_body: b(d.false_body) }
      }
    }
    else if (node.is('while')) {
      tmpl = 'while (#{expr}) #{body}'
      dat = { expr: e(d.expr), body: b(d.body) }
    }

    str = _.template(tmpl)(dat)
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
    let d = node.data
    let tmpl = ''
    let dat = {}

    if (node.is('fn')) {
      tmpl = '#{fn}(#{args})'
      dat = { fn: node.value, args: e(d.args, ', ') }
    }
    else if (node.is(['math', 'logic', 'comp'])) {
      tmpl = '#{left} #{op} #{right}'
      dat = { op: node.value, left: e(d.left), right: e(d.right) }
    }
    else if (node.is('type') || node.is('char') || node.is('string')) {
      tmpl = '#{value}'
      dat = { value: string(node.is('type') ? token_data_type[node.value] : node.value) }
    }
    else {
      tmpl = '#{value}'
      dat = { value: node.value }
    }

    str = _.template(tmpl)(dat)
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
    this.writeln('var alloc = _vm.mm.alloc.bind(_vm.mm);')
    this.writeln('var free = _vm.mm.free.bind(_vm.mm);')
    this.writeln('var print = console.log.bind(console);')
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
