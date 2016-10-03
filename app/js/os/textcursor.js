import { TextRegion } from './textbuffer.js'
import { EventEmitter2 } from 'eventemitter2'

export var TextCursor

TextCursor = class extends EventEmitter2 {

  constructor (buffer, row, col) {
    super({ wildcard: true, delimiter: '.' })
    this.buffer = buffer
    this.point = this.buffer.point(row, col)
    this.point.on('move', () => this.emit('move'))
    this.buffer.on('line:change', () => this.point ? this.point.round() : null)
    this.buffer.on('line:insert', () => this.point ? this.point.round() : null)
    this.buffer.on('line:delete', () => this.point ? this.point.round() : null)
  }

  serialize () {
    if (this.point) {
      return { row: this.point.row, col: this.point.col }
    }
    else {
      return {
        begin: { row: this.region.begin.row, col: this.region.begin.col },
        end: { row: this.region.end.row, col: this.region.end.col },
      }
    }
  }

  deserialize (data) {
    if (data.row !== null) {
      return this.moveTo(data.row, data.col)
    }
    else {
      return this.select(data)
    }
  }

  toTextPoint () {
    if (this.point) {
      return this
    }
    this.point = this.region.end
    this.region = null
    this.point.on('move', () => this.emit('move'))
    return this
  }

  toTextRegion () {
    if (this.region) {
      return this
    }
    this.region = new TextRegion(this.point, this.point.clone())
    this.point = null
    this.region.begin.removeAllListeners('move')
    this.region.begin.on('move', () => this.emit('move'))
    this.region.end.on('move', () => this.emit('move'))
    return this
  }

  moveTo (row, col) {
    this.toTextPoint()
    this.point.moveTo(row, col)
    return this.point.round()
  }

  select (region) {
    this.toTextRegion()
    this.region.begin.moveTo(region.begin)
    return this.region.end.moveTo(region.end)
  }

  selectTo (row, col) {
    this.toTextRegion()
    this.region.end.moveTo(row, col)
    return this.region.end.round()
  }

  extendTo (region) {
    this.toTextRegion()
    return this.region.extendTo(region)
  }

  moveVertical (amount) {
    this.toTextPoint()
    this.point.moveVertical(amount)
    return this.point.round()
  }

  selectVertical (amount) {
    this.toTextRegion()
    this.region.end.moveVertical(amount)
    return this.region.end.round()
  }

  selectAll () {
    this.toTextRegion()
    let lastRow = this.buffer.lineCount() - 1
    let lastCol = this.buffer.lineLength(lastRow)
    this.region.begin.moveTo(0, 0)
    return this.region.end.moveTo(lastRow, lastCol)
  }

  selectRow (row) {
    this.toTextRegion()
    return this.region.selectRow(row)
  }

  selectRows (r1, r2) {
    this.toTextRegion()
    return this.region.selectRows(r1, r2)
  }

  insert (text) {
    this.deleteSelection()
    this.toTextPoint()
    return this.point.insert(text)
  }

  overwrite (text) {
    this.toTextPoint()
    return this.point.overwrite(text)
  }

  deleteBack () {
    if (this.deleteSelection()) {
      return this
    }
    this.toTextPoint()
    return this.point.deleteBack()
  }

  deleteForward () {
    if (this.deleteSelection()) {
      return this
    }
    this.toTextPoint()
    return this.point.deleteForward()
  }

  deleteWordBack () {
    this.deleteSelection()
    this.toTextPoint()
    return this.point.deleteWordBack()
  }

  deleteWordForward () {
    this.deleteSelection()
    this.toTextPoint()
    return this.point.deleteWordForward()
  }

  newLine () {
    this.toTextPoint()
    return this.point.newLine()
  }

  deleteSelection () {
    if (!this.region || this.region.isEmpty()) {
      return false
    }
    else {
      this.region['delete']()
      this.emit('move')
      return true
    }
  }

  deleteRows () {
    this.toTextRegion()
    let ref1 = this.region.ordered()
    let begin = ref1.begin
    let end = ref1.end
    this.buffer.deleteLines(begin.row, end.row)
    this.toTextPoint()
    this.point.moveTo(begin)
    return this.point.round()
  }

  text () {
    this.toTextRegion()
    return this.region.text()
  }

  indent (tab) {
    if (this.point || this.region.isEmpty()) {
      return this.insert(tab)
    }
    else {
      return this.region.indent(tab)
    }
  }

  outdent (tab) {
    this.toTextRegion()
    return this.region.outdent(tab)
  }

  pageUp () {
    return this.toTextPoint()
  }

  pageDown () {
    return this.toTextPoint()
  }

}


let pointMethods = ['moveToLineBegin', 'moveToLineEnd', 'moveToPrevWord', 'moveToNextWord', 'moveToDocBegin', 'moveToDocEnd', 'moveLeft', 'moveRight', 'moveUp', 'moveDown']

let fn = method => {
  TextCursor.prototype[method] = () => {
    this.toTextPoint()
    this.point[method]()
    return this.point.round()
  }
  TextCursor.prototype[method.replace(/^move/, 'select')] = () => {
    this.toTextRegion()
    this.region.end[method]()
    return this.region.end.round()
  }
}

let len = pointMethods.length
for (let i = 0; i < len; i++) {
  fn(pointMethods[i])
}


let regionMethods = ['shiftLinesDown', 'shiftLinesUp']

let fn1 = method => {
  TextCursor.prototype[method] = () => {
    this.toTextRegion()
    return this.region[method]()
  }
}

let len1 = regionMethods.length
for (let j = 0; j < len1; j++) {
  fn1(regionMethods[j])
}
