import _ from 'lodash'
import { EventEmitter2 } from 'eventemitter2'

export var TextBuffer
export var TextPoint
export var TextRegion

TextBuffer = class extends EventEmitter2 {

  constructor (text, saveCursor, placeCursor) {
    super({ wildcard: true, delimiter: '.' })
    this.lines = ['']
    this.setText(text.replace(/\r/g, ''))
    this.undoStack = []
    this.redoStack = []
    this.currentSteps = []
    this.saveCursor = saveCursor || false
    this.placeCursor = placeCursor || false
  }

  point (row, col, anchor) { return new TextPoint(this, row, col, anchor) }

  text (row, col) {
    if (row && col) {
      return row >= 0 && row < this.lineCount ? this.lines[row][col] : ''
    }
    else if (row) {
      return row >= 0 && row < this.lineCount ? this.lines[row] : ''
    }
    else {
      return this.lines.join('\n')
    }
  }

  get lineCount () { return this.lines.length }

  lineLength (row) { return this.text(row).length }

  search (match, startRow = 0, startCol = 0) {
    return _.isRegExp(match) ? this.searchRegex(match, startRow, startCol) : this.searchText(match, startRow, startCol)
  }

  searchText (subText, startRow, startCol) {
    let text = this.text(startRow).substr(startCol)
    let maxRow = this.lineCount
    while (startRow < maxRow) {
      let result = text.indexOf(subText)
      if (result !== -1) {
        let length = subText.length
        let begin = this.point(startRow, startCol + result)
        let end = this.point(startRow, startCol + result + length)
        return new TextRegion(begin, end)
      }
      startCol = 0
      text = this.text
      ++startRow
    }
    return null
  }

  searchRegex (regex, startRow, startCol) {
    let text = this.text(startRow).substr(startCol)
    let maxRow = this.lineCount
    while (startRow < maxRow) {
      let result = regex.exec(text)
      if (result) {
        let length = result[0].length
        let index = result.index
        let begin = this.point(startRow, startCol + index)
        let end = this.point(startRow, startCol + index + length)
        let region = new TextRegion(begin, end)
        region.captures = result
        return region
      }
      startCol = 0
      text = this.text
      ++startRow
    }
    return null
  }

  searchAll (match) {
    let regions = []
    let row = 0
    let col = 0
    let region = this.search(match, row, col)
    while (region) {
      regions.push(region)
      row = region.end.row
      col = region.end.col
      region = this.search(match, row, col)
    }
    return regions
  }

  replace (match, newText, startRow, startCol) {
    if (_.isUndefined(startRow)) {
      startRow = 0
    }
    if (_.isUndefined(startCol)) {
      startCol = 0
    }
    let matchRegion = this.search(match, startRow, startCol)
    if (!matchRegion) {
      return null
    }
    if (matchRegion.captures) {
      let ref = matchRegion.captures
      let j = 0
      let len = ref.length
      for (let i = 0; j < len; i = ++j) {
        newText = newText.replace(new RegExp('[$]' + i, 'g'), ref[i])
      }
    }
    matchRegion.replaceWith(newText)
    return matchRegion
  }

  replaceAll (match, newText, startRow, startCol) {
    if (_.isUndefined(startRow)) {
      startRow = 0
    }
    if (_.isUndefined(startCol)) {
      startCol = 0
    }
    let replacementCount = 0
    let matchRegion = this.replace(match, newText, startRow, startCol)
    while (matchRegion) {
      startRow = matchRegion.end.row
      startCol = matchRegion.end.col
      replacementCount++
      matchRegion = this.replace(match, newText, startRow, startCol)
    }
    return replacementCount
  }

  deleteLine (row) {
    let line = this.text(row)
    if (row === 0 && this.lineCount === 1) {
      this.setLine(0, '')
    }
    else {
      this.lines.splice(row, 1)
      if (!this.noHistory) {
        this.currentSteps.push({ type: 'delete', row, oldText: line })
      }
      this.emit('line:delete', row)
    }
    return line
  }

  setLine (row, text) {
    let oldText = this.text(row)
    this.lines[row] = text
    if (!this.noHistory) {
      this.currentSteps.push({ type: 'change', row, oldText, newText: text })
    }
    this.emit('line:change', row, text)
    return this
  }

  insertLine (row, text) {
    this.lines.splice(row, 0, text)
    if (!this.noHistory) {
      this.currentSteps.push({ type: 'insert', row, newText: text })
    }
    this.emit('line:insert', row, text)
    return this
  }

  setText (text) {
    this.lines = text.split('\n')
    this.emit('reset')
    return this
  }

  undo () {
    this.commitTransaction()
    let steps = this.undoStack.pop()
    if (steps) {
      this.redoStack.push(steps)
      this.noHistory = true
      let ref = steps.slice().reverse()
      for (let j = 0, len = ref.length; j < len; j++) {
        let step = ref[j]
        switch (step.type) {
          case 'change':
            this.setLine(step.row, step.oldText)
            break
          case 'delete':
            this.insertLine(step.row, step.oldText)
            break
          case 'insert':
            this.deleteLine(step.row)
        }
      }
      let prev = this.undoStack[this.undoStack.length - 1]
      if (prev && prev.cursor) {
        this.placeCursor(prev.cursor)
      }
      this.noHistory = false
    }
    return this
  }

  redo () {
    let steps = this.redoStack.pop()
    if (steps) {
      this.undoStack.push(steps)
      this.noHistory = true
      let ref = steps.slice()
      for (let j = 0, len = ref.length; j < len; j++) {
        let step = ref[j]
        switch (step.type) {
          case 'change':
            this.setLine(step.row, step.newText)
            break
          case 'delete':
            this.deleteLine(step.row)
            break
          case 'insert':
            this.insertLine(step.row, step.newText)
        }
      }
      if (steps.cursor) {
        this.placeCursor(steps.cursor)
      }
      this.noHistory = false
    }
    return this
  }

  commitTransaction () {
    if (this.currentSteps.length) {
      if (this.saveCursor) {
        this.currentSteps.cursor = this.saveCursor()
      }
      this.undoStack.push(this.currentSteps)
      this.currentSteps = []
    }
    return this
  }

  insert (text, row, col) {
    let line = this.text(row)
    let textBefore = line.substr(0, col)
    let textAfter = line.substr(col)
    if (text.indexOf('\n') === -1) {
      this.setLine(row, textBefore + text + textAfter)
      return this.point(row, textBefore.length + text.length)
    }
    else {
      let insertedLines = text.split('\n')
      let insertedLineCount = insertedLines.length
      this.setLine(row, textBefore + insertedLines[0])
      let ref = insertedLines.slice(1, -1)
      let j = 0
      let len = ref.length
      for (let i = 0; j < len; i = ++j) {
        this.insertLine(row + i + 1, ref[i])
      }
      let lastRow = row + insertedLineCount - 1
      let lastLine = insertedLines[insertedLineCount - 1]
      this.insertLine(lastRow, lastLine + textAfter)
      return this.point(lastRow, lastLine.length)
    }
  }

  overwrite (text, row, col) {
    let line = this.text(row)
    let textBefore = line.substr(0, col)
    let textAfter = line.substr(col + text.length)
    this.setLine(row, textBefore + text + textAfter)
    return this.point(row, textBefore.length + text.length)
  }

  insertNewLine (row, col) {
    let line = this.text(row)
    let textBefore = line.substr(0, col)
    let textAfter = line.substr(col)
    this.setLine(row, textBefore)
    return this.insertLine(row + 1, textAfter)
  }

  joinLines (row) {
    let line = this.text(row)
    let line2 = this.text(row + 1)
    this.setLine(row, line + line2)
    return this.deleteLine(row + 1)
  }

  wordAt (row, col, wordRe) {
    let ref
    if (_.isUndefined(wordRe)) {
      wordRe = '\\w+'
    }
    if (row instanceof TextPoint) {
      ref = row
      row = ref.row
      col = ref.col
    }
    let line = this.text(row)
    let regex = new RegExp('(' + wordRe + ')|(.)', 'g')
    let isNext = false
    let match = regex.exec(line)
    while (match) {
      let text = match[1] || match[2]
      let index = match.index
      let length = text.length
      if (isNext || col <= index + length) {
        let region = new TextRegion(this.point(row, index), this.point(row, index + length))
        region.isSolid = Boolean(match[1])
        if (!isNext && !region.isSolid && index + 1 !== line.length) {
          isNext = true
          continue
        }
        return region
      }
      match = regex.exec(line)
    }
    return new TextRegion(this.point(row, col), this.point(row, col))
  }

  shiftLinesUp (beginRow, endRow) {
    if (!beginRow) {
      return false
    }
    let prevLine = this.deleteLine(beginRow - 1)
    this.insertLine(endRow, prevLine)
    return true
  }

  shiftLinesDown (beginRow, endRow) {
    if (endRow === this.lineCount - 1) {
      return false
    }
    let nextLine = this.deleteLine(endRow + 1)
    this.insertLine(beginRow, nextLine)
    return true
  }

  deleteLines (beginRow, endRow) {
    let ref = beginRow
    let j = beginRow
    let ref1 = endRow
    for (let i = beginRow; ref <= ref1 ? j <= ref1 : j >= ref1; i = ref <= ref1 ? ++j : --j) {
      this.deleteLine(beginRow)
    }
  }
}


TextPoint = class {

  constructor (buffer, row1, col1, anchor) {
    this.buffer = buffer
    this.row = row1
    this.col = col1
    this.anchor = anchor !== null ? anchor : true
  }

  moveTo (row, col) {
    if (row instanceof TextPoint) {
      this.row = row.row
      this.col = row.col
      this.emit('move')
    }
    else {
      if (row !== null) {
        this.row = row
      }
      if (col !== null) {
        this.col = col
      }
      this.emit('move')
    }
    return this
  }

  equals (point) { return this.row === point.row && this.col === point.col }

  isBefore (point) {
    let sameRow = this.row === point.row
    return this.row < point.row || sameRow && this.col < point.col
  }

  isAfter (point) { return !this.isBefore(point) && !this.equals(point) }

  clone () { return new TextPoint(this.buffer, this.row, this.col, this.anchor) }

  toString () { return '(' + this.row + ', ' + this.col + ')' }

  round () {
    let newRow = this.row
    let newCol = this.col
    if (newRow < 0) {
      newRow = 0
    }
    if (newCol < 0) {
      newCol = 0
    }
    let lastRow = this.buffer.lineCount - 1
    if (newRow > lastRow) {
      newRow = lastRow
    }
    let lastCol = this.buffer.lineLength(newRow)
    if (newCol > lastCol) {
      newCol = lastCol
    }
    if (newRow !== this.row || newCol !== this.col) {
      this.moveTo(newRow, newCol)
    }
    return this
  }

  prevLoc () {
    if (this.col === 0) {
      if (this.row === 0) {
        return this.buffer.point(0, 0)
      }
      else {
        return this.buffer.point(this.row - 1, this.buffer.lineLength(this.row - 1))
      }
    }
    else {
      return this.buffer.point(this.row, this.col - 1)
    }
  }

  nextLoc () {
    if (this.col === this.buffer.lineLength(this.row)) {
      if (this.row === this.buffer.lineCount - 1) {
        return this.buffer.point(this.row, this.col)
      }
      else {
        return this.buffer.point(this.row + 1, 0)
      }
    }
    else {
      return this.buffer.point(this.row, this.col + 1)
    }
  }

  moveToLineBegin () {
    this.idealCol = 0
    return this.moveTo(null, 0)
  }

  moveToLineEnd () {
    this.idealCol = 0
    return this.moveTo(null, this.buffer.lineLength(this.row))
  }

  moveLeft () {
    if (!this.isAtDocBegin()) {
      this.idealCol = 0
      if (this.col === 0) {
        if (this.row) {
          return this.moveTo(this.row - 1, this.buffer.lineLength(this.row - 1))
        }
      }
      else {
        return this.moveTo(null, this.col - 1)
      }
    }
    return this
  }

  moveRight () {
    if (!this.isAtDocEnd()) {
      this.idealCol = 0
      if (this.col === this.buffer.lineLength(this.row)) {
        if (this.row < this.buffer.lineCount) {
          return this.moveTo(this.row + 1, 0)
        }
      }
      else {
        return this.moveTo(null, this.col + 1)
      }
    }
    return this
  }

  moveDown () {
    if (this.isAtLastLine()) {
      return this.moveToLineEnd()
    }
    else {
      return this.moveVertical(1)
    }
  }

  moveUp () {
    if (this.row === 0) {
      return this.moveToLineBegin()
    }
    else {
      return this.moveVertical(-1)
    }
  }

  moveVertical (amount) {
    if (!this.idealCol || this.col >= this.idealCol) {
      this.idealCol = this.col
    }
    let newRow = this.row + amount
    let newCol = this.col
    if (this.idealCol > this.col) {
      newCol = this.idealCol
    }
    let limit = this.buffer.lineLength(newRow)
    if (this.col > limit) {
      newCol = limit
    }
    return this.moveTo(newRow, newCol)
  }

  moveToPrevWord () {
    if (!this.isAtDocBegin()) {
      let carat = this.prevLoc()
      let char = this.buffer.text(carat.row, carat.col)
      while (!char || !/\w/.test(char)) {
        carat = carat.prevLoc()
        if (carat.isAtDocBegin()) {
          return this.moveToDocBegin()
        }
        char = this.buffer.text(carat.row, carat.col)
      }
      return this.moveTo(this.buffer.wordAt(carat).begin)
    }
    return this
  }

  moveToNextWord () {
    if (!this.isAtDocEnd()) {
      let carat = this.clone()
      let char = this.buffer.text(carat.row, carat.col)
      while (!char || !/\w/.test(char)) {
        carat = carat.nextLoc()
        if (carat.isAtDocEnd()) {
          return this.moveToDocEnd()
        }
        if (carat.isAtLineEnd()) {
          carat = carat.nextLoc()
        }
        char = this.buffer.text(carat.row, carat.col)
      }
      carat.moveRight()
      return this.moveTo(this.buffer.wordAt(carat).end)
    }
    return this
  }

  moveToDocBegin () { return this.moveTo(0, 0) }

  moveToDocEnd () {
    let lastRow = this.buffer.lineCount - 1
    return this.moveTo(lastRow, this.buffer.lineLength(lastRow))
  }

  isAtDocBegin () { return !this.row && !this.col }

  isAtDocEnd () {
    let lastRow = this.buffer.lineCount - 1
    return this.row === lastRow && this.col === this.buffer.lineLength(lastRow)
  }

  isAtLineEnd () { return this.col === this.buffer.lineLength(this.row) }

  isAtLastLine () { return this.row === this.buffer.lineCount - 1 }

  insert (text) { return this.moveTo(this.buffer.insert(text, this.row, this.col)) }

  overwrite (text) { return this.moveTo(this.buffer.overwrite(text, this.row, this.col)) }

  deleteBack () {
    if (!this.isAtDocBegin()) {
      let row = this.row
      let col = this.col
      this.moveLeft()
      if (col === 0) {
        this.buffer.joinLines(row - 1)
      }
      else {
        let line = this.buffer.text(row)
        this.buffer.setLine(row, line.substr(0, col - 1) + line.substr(col))
      }
    }
    return this
  }

  deleteForward () {
    if (!this.isAtDocEnd()) {
      if (this.isAtLineEnd()) {
        this.buffer.joinLines(this.row)
      }
      else {
        let line = this.buffer.text(this.row)
        this.buffer.setLine(this.row, line.substr(0, this.col) + line.substr(this.col + 1))
      }
    }
    return this
  }

  deleteWordBack () {
    let rowBegin = this.row
    let colBegin = this.col
    this.moveToPrevWord()
    let ptBegin = this.buffer.point(this.row, this.col)
    let ptEnd = this.buffer.point(rowBegin, colBegin)
    return (new TextRegion(ptBegin, ptEnd))['delete']()
  }

  deleteWordForward () {
    let rowBegin = this.row
    let colBegin = this.col
    this.moveToNextWord()
    let ptBegin = this.buffer.point(rowBegin, colBegin)
    return (new TextRegion(ptBegin, this))['delete']()
  }

  newLine () {
    this.buffer.insertNewLine(this.row, this.col)
    return this.moveTo(this.row + 1, 0)
  }
}


TextRegion = class {

  constructor (begin1, end1) {
    this.begin = begin1
    this.end = end1
    this.buffer = this.begin.buffer
  }

  clone () { return new TextRegion(this.begin, this.end) }

  ordered () {
    if (this.begin.isBefore(this.end)) {
      return new TextRegion(this.begin, this.end)
    }
    else {
      return new TextRegion(this.end, this.begin)
    }
  }

  isEmpty () { return this.begin.equals(this.end) }

  text () {
    let ref = this.ordered()
    let begin = ref.begin
    let end = ref.end
    if (begin.row === end.row) {
      return this.buffer.text(begin.row).substring(begin.col, end.col)
    }
    let lines = []
    lines.push(this.buffer.text(begin.row).substring(begin.col))
    if (end.row - 1 >= begin.row + 1) {
      let ref1 = begin.row + 1
      let ref2 = end.row - 1
      let row = ref1
      for (let i = ref1; ref1 <= ref2 ? i <= ref2 : i >= ref2; row = ref1 <= ref2 ? ++i : --i) {
        lines.push(this.buffer.text(row))
      }
    }
    lines.push(this.buffer.text(end.row).substring(0, end.col))
    return lines.join('\n')
  }

  replaceWith (text) {
    let ref = this.ordered()
    let begin = ref.begin
    let end = ref.end
    let line = this.buffer.text(begin.row)
    let beforeText = line.substr(0, begin.col)
    let afterText
    let lastLine
    if (begin.row === end.row) {
      afterText = line.substr(end.col)
    }
    else {
      lastLine = this.buffer.text(end.row)
      afterText = lastLine.substr(end.col)
    }
    if (begin.row !== end.row) {
      let delRow = begin.row + 1
      let ref1 = delRow
      let ref2 = end.row
      let row = ref1
      for (let i = ref1; ref1 <= ref2 ? i <= ref2 : i >= ref2; row = ref1 <= ref2 ? ++i : --i) {
        this.buffer.deleteLine(delRow)
      }
    }
    this.buffer.setLine(begin.row, beforeText)
    end.moveTo(this.buffer.insert(text, begin.row, begin.col))
    this.buffer.insert(afterText, end.row, end.col)
    return this
  }

  delete () { return this.replaceWith('') }

  selectRow (row) { return this.selectRows(row, row) }

  selectRows (rowBegin, rowEnd) {
    let ref
    if (rowBegin > rowEnd) {
      ref = [rowEnd, rowBegin]
      rowBegin = ref[0]
      rowEnd = ref[1]
    }
    this.begin.moveTo(rowBegin, 0)
    return this.end.moveTo(rowEnd, this.buffer.lineLength(rowEnd))
  }

  shiftLinesUp () {
    let ref = this.ordered()
    let begin = ref.begin
    let end = ref.end
    if (!this.buffer.shiftLinesUp(begin.row, end.row)) {
      return this
    }
    begin.moveUp()
    return end.moveUp()
  }

  shiftLinesDown () {
    let ref = this.ordered()
    let begin = ref.begin
    let end = ref.end
    if (!this.buffer.shiftLinesDown(begin.row, end.row)) {
      return this.moveTo(null, null)
    }
    begin.moveDown()
    return end.moveDown()
  }

  indent (tabChars) {
    let ref = this.ordered()
    let begin = ref.begin
    let end = ref.end
    let ref1 = begin.row
    let ref2 = end.row
    let row = ref1
    for (let i = ref1; ref1 <= ref2 ? i <= ref2 : i >= ref2; row = ref1 <= ref2 ? ++i : --i) {
      this.buffer.setLine(row, tabChars + this.buffer.text(row))
    }
    begin.moveTo(null, begin.col + tabChars.length)
    return end.moveTo(null, end.col + tabChars.length)
  }

  outdent (tabChars) {
    let ref = this.ordered()
    let begin = ref.begin
    let end = ref.end
    let re = new RegExp('^' + tabChars.replace(/(.)/g, '[$1]?'))
    let changed = false
    let ref1 = begin.row
    let ref2 = end.row
    let row = ref1
    for (let i = ref1; ref1 <= ref2 ? i <= ref2 : i >= ref2; row = ref1 <= ref2 ? ++i : --i) {
      let oldLine = this.buffer.text(row)
      let line = oldLine.replace(re, '')
      this.buffer.setLine(row, line)
      if (line !== oldLine) {
        changed = true
      }
    }
    if (!changed) {
      return this
    }
    let beginCol = begin.col - tabChars.length
    if (beginCol < 0) {
      beginCol = 0
    }
    let endCol = end.col - tabChars.length
    if (endCol < 0) {
      endCol = 0
    }
    begin.moveTo(null, beginCol)
    return end.moveTo(null, endCol)
  }

  toString () {
    return '[' + this.begin.toString() + ', ' + this.end.toString() + ']'
  }
}
