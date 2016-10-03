import _ from 'lodash'
import { fs, path } from '../../utils.js'
import { Chip } from '../chip.js'

export var TextChip

class BDF {

  constructor () {
    this.meta = null
    this.glyphs = null
  }

  load (data) {
    this.meta = {}
    this.glyphs = {}

    let fontLines = data.split('\n')
    let declarationStack = []
    let currentChar = null

    for (let i = 0; i < fontLines.length; i++) {
      let line = fontLines[i]
      let line_data = line.split(/\s+/)
      let declaration = line_data[0]

      switch (declaration) {
        case 'STARTFONT':
          declarationStack.push(declaration)
          this.meta.version = Math.abs(line_data[1])
          break
        case 'FONT':
          this.meta.name = Math.abs(line_data[1])
          break
        case 'SIZE':
          this.meta.size = {
            points: Math.abs(line_data[1]),
            resolutionX: Math.abs(line_data[2]),
            resolutionY: Math.abs(line_data[3]),
          }
          break
        case 'FONTBOUNDINGBOX':
          this.meta.boundingBox = {
            width: Math.abs(line_data[1]),
            height: Math.abs(line_data[2]),
            x: Math.abs(line_data[3]),
            y: Math.abs(line_data[4]),
          }
          break
        case 'STARTPROPERTIES':
          declarationStack.push(declaration)
          this.meta.properties = {}
          break
        case 'FONT_DESCENT':
          this.meta.properties.fontDescent = Math.abs(line_data[1])
          break
        case 'FONT_ASCENT':
          this.meta.properties.fontAscent = Math.abs(line_data[1])
          break
        case 'DEFAULT_CHAR':
          this.meta.properties.defaultChar = Math.abs(line_data[1])
          break
        case 'ENDPROPERTIES':
          declarationStack.pop()
          break
        case 'CHARS':
          this.meta.totalChars = Math.abs(line_data[1])
          break
        case 'STARTCHAR':
          declarationStack.push(declaration)
          currentChar = {
            name: Math.abs(line_data[1]),
            bytes: [],
            bitmap: [],
          }
          break
        case 'ENCODING':
          currentChar.code = Math.abs(line_data[1])
          currentChar.char = String.fromCharCode(Math.abs(line_data[1]))
          break
        case 'SWIDTH':
          currentChar.scalableWidthX = Math.abs(line_data[1])
          currentChar.scalableWidthY = Math.abs(line_data[2])
          break
        case 'DWIDTH':
          currentChar.deviceWidthX = Math.abs(line_data[1])
          currentChar.deviceWidthY = Math.abs(line_data[2])
          break
        case 'BBX':
          currentChar.boundingBox = {
            x: Math.abs(line_data[3]),
            y: Math.abs(line_data[4]),
            width: Math.abs(line_data[1]),
            height: Math.abs(line_data[2]),
          }
          break
        case 'BITMAP':
          for (let row = 0; row < currentChar.boundingBox.height; row++, i++) {
            let byte = parseInt(fontLines[i + 1], 16)
            currentChar.bytes.push(byte)
            currentChar.bitmap[row] = []
            for (let bit = 7; bit >= 0; bit--) {
              currentChar.bitmap[row][7 - bit] = byte & 1 << bit ? 1 : 0
            }
          }
          break
        case 'ENDCHAR':
          declarationStack.pop()
          this.glyphs[currentChar.code] = currentChar
          currentChar = null
          break
        case 'ENDFONT':
          declarationStack.pop()
          break
      }
    }

    if (declarationStack.length) {
      throw "Couldn't correctly parse font"
    }
  }
}


TextChip = class extends Chip {

  constructor (vm, offset, char_count, char_width, char_height, char_offset) {
    super(vm)

    this.video = this.vm.chips.video

    this.offset_x = offset ? offset.x : 0
    this.offset_y = offset ? offset.y : 0

    this.chr_count = char_count || 256

    this.chr_width = char_width || 4
    this.chr_height = char_height || 7
    this.chr_size = this.chr_width * this.chr_height
    this.chr_offset_x = char_offset ? char_offset.x : 0
    this.chr_offset_y = char_offset ? char_offset.y : 3
    this.chr_font = '4x6'

    this.width = Math.round(this.video.width / this.chr_width)
    this.height = Math.round(this.video.height / this.chr_height)
    this.size = this.width * this.height * 3
    this.data = new Uint8ClampedArray(this.size)

    this.fnt_size = this.chr_count * this.chr_size
    this.fnt_data = new Uint8ClampedArray(this.fnt_size)

    this.fg = 1
    this.bg = 0

    this.publicize([
      { name: 'chr_count', readonly: true },
      { name: 'chr_width', readonly: true },
      { name: 'chr_height', readonly: true },
      { name: 'chr_offset_x', readonly: true },
      { name: 'chr_offset_y', readonly: true },
      { name: 'chr_size', readonly: true },

      { name: 'txt_width', value: 'width', readonly: true },
      { name: 'txt_height', value: 'height', readonly: true },
      { name: 'txt_size', value: 'size', readonly: true },
      { name: 'fnt_size', readonly: true },
      { name: 'fnt_data' },
      { name: 'txt_data', value: 'data', readonly: true },

      { name: 'txt_fg', value: 'fg' },
      { name: 'txt_bg', value: 'bg' },
      { name: 'txt_flip', value: 'flip' },
      { name: 'txt_refresh', value: 'refresh' },
      { name: 'txt_scroll', value: 'scroll' },
      { name: 'idx', value: 'index' },
      { name: 'lin', value: 'line' },
      { name: 'at', value: 'char_at' },
      { name: 'put' },
      { name: 'print' },
      { name: 'println' },
      { name: 'pos' },
      { name: 'move_to' },
      { name: 'move_by' },
      { name: 'bol' },
      { name: 'eol' },
      { name: 'bos' },
      { name: 'eos' },
      { name: 'bs' },
      { name: 'cr' },
      { name: 'lf' },
      { name: 'up' },
      { name: 'left' },
      { name: 'down' },
      { name: 'right' },
      { name: 'clr', value: 'clear' },
      { name: 'clr_eol', value: 'clear_eol' },
      { name: 'clr_os', value: 'clear_eos' },
      { name: 'clr_bl', value: 'clear_bol' },
      { name: 'clr_bs', value: 'clear_bos' },
      { name: 'cpy_lin', value: 'copy_line' },
      { name: 'cpy_col', value: 'copy_col' },
      { name: 'erase_lin', value: 'erase_line' },
      { name: 'erase_col', value: 'erase_col' },
    ])
  }

  boot (cold) {
    if (cold) {
      this.textCursor = this.video.monitor.overlays.textCursor
      this.load_fnt()
    }
    super.boot(cold)
  }

  tick (t, delta) {
    super.tick(t, delta)
    if (this.force_update) {
      this.video.force_update = true
      this.force_update = false
      if (this.force_flip) {
        this.flip()
        this.video.force_flip = true
      }
    }
  }

  reset () {
    this.force_update = false
    this.force_flip = false
    this.clear()
    super.reset()
  }

  load_fnt () {
    let b = new BDF()
    fs.readFile(path.join(__dirname, '../app/assets/fonts/' + this.chr_font + '.bdf'), 'utf8', (err, data) => {
      if (!err) {
        b.load(data)
        // let points = b.meta.size.points
        let fontAscent = b.meta.properties.fontAscent
        // let fontDescent = b.meta.properties.fontDescent
        let baseline = fontAscent + this.chr_offset_y

        let cw = this.chr_width
        let fnt_sz = this.chr_size
        let osx = this.chr_offset_x

        var fnt_data = this.fnt_data

        for (let k in b.glyphs) {
          let g = b.glyphs[k]
          let bb = g.boundingBox
          let dsc = baseline - bb.height - bb.y
          let ptr = g.code * fnt_sz

          for (let y = 0; y < bb.height; y++) {
            let p = ptr + (y + dsc) * cw
            for (let x = 0; x < bb.width; x++) {
              fnt_data[p + x + bb.x + osx] |= g.bitmap[y][x]
            }
          }
        }

        // this.test()
      }
    })
    return b
  }

  flip () {
    this.force_flip = false

    let cw = this.chr_width
    let ch = this.chr_height
    let tw = this.width
    let th = this.height
    let w = this.video.width
    let fnt_sz = this.chr_size

    let fnt_data = this.fnt_data
    let data = this.data

    let pixels = this.video.data

    let idx = 0
    let px = 0
    let py = 0

    for (let y = 0; y < th; y++) {
      px = 0
      for (let x = 0; x < tw; x++) {
        let c = data[idx]
        if (c > 31 && c < 256) {
          let fg = data[idx + 1]
          let bg = data[idx + 2]

          let ptr = c * fnt_sz
          for (let by = 0; by < ch; by++) {
            let pi = (py + by) * w + px
            for (let bx = 0; bx < cw; bx++) {
              pixels[pi++] = fnt_data[ptr++] ? fg : bg
            }
          }
        }
        else {
          for (let by = py; by < py + ch; by++) {
            let pi = by * w + px
            pixels.fill(0, pi, pi + cw)
          }
        }
        idx += 3
        px += cw
      }
      py += ch
    }
    return this
  }

  refresh (flip = true) {
    this.force_update = true
    this.force_flip = flip
    return this
  }

  index (x, y) {
    return ((y - 1) * this.width + (x - 1)) * 3
  }

  line (y) {
    let l = this.width * 3
    return { start: y * l, end: (y + 1) * l - 3, length: l }
  }

  char_at (x, y) {
    let tidx = this.index(x, y)
    let data = this.data
    return { ch: data[tidx], fg: data[tidx + 1], bg: data[tidx + 2] }
  }

  put (ch, fg, bg) {
    let cc = _.isString(ch) ? ch.charCodeAt(0) : ch

    switch (cc) {
      case 13: case 10:
        return this.cr()
      case 8:
        return this.bs()
      case 9:
        return this.print('  ')
    }

    let { x, y } = this.pos
    this.data.set([cc, fg !== undefined ? fg : this.fg, bg !== undefined ? bg : this.bg], this.index(x, y))

    return this.move_by(1, 0, true, true)
  }

  print (text, fg, bg) {
    for (let c of text || '') {
      this.put(c, fg, bg)
    }
    return this
  }

  println (text, fg, bg) { return this.print((text || '') + '\n', fg, bg) }

  get pos () { return { x: this.textCursor.x, y: this.textCursor.y } }

  set pos (value) { return this.move_to(value.x, value.y) }

  move_to (x, y, wrap = false, flip = false) {
    if (x > this.width) {
      if (wrap) {
        x = 1
        y++
      }
      else {
        x = this.width
      }
    }
    else if (x < 1) {
      if (wrap) {
        x = this.width
        y--
      }
      else {
        x = 1
      }
    }

    if (y > this.height) {
      if (wrap) {
        y = 1
        x = 1
      }
      else {
        y = this.height
      }
    }
    else if (y < 1) {
      if (wrap) {
        y = this.height
        x = 1
      }
      else {
        y = 1
      }
    }

    this.textCursor.x = x
    this.textCursor.y = y
    this.textCursor.sprite.visible = true
    this.textCursor.last = performance.now()
    this.textCursor.update(flip)

    return this.refresh(false)
  }

  move_by (x, y, wrap = true, flip = false) { return this.move_to(this.textCursor.x + x, this.textCursor.y + y, wrap, flip) }

  bol () { return this.move_to(1, this.textCursor.y) }

  eol () { return this.move_to(this.width, this.textCursor.y) }

  bos () { return this.move_to(1, 1) }

  eos () { return this.move_to(this.width, this.height) }

  bs () { return this.left().put(' ').left() }

  cr () { return this.move_to(1, this.textCursor.y + 1) }

  lf () { return this.move_to(this.textCursor.x, this.textCursor.y + 1) }

  up () { return this.move_to(this.textCursor.x, this.textCursor.y - 1) }

  left () { return this.move_to(this.textCursor.x - 1, this.textCursor.y) }

  down () { return this.move_to(this.textCursor.x, this.textCursor.y + 1) }

  right () { return this.move_to(this.textCursor.x + 1, this.textCursor.y) }

  clear () {
    this.data.fill(0)
    return this.bos().refresh()
  }

  clear_eol () {
    let { x, y } = this.pos
    this.data.fill(0, this.index(x, y), this.index(this.width, y) + 3)
    return this.refresh()
  }

  clear_eos () {
    let { x, y } = this.pos
    this.data.fill(0, this.index(x, y), this.size)
    return this.refresh()
  }

  clear_bol () {
    let { x, y } = this.pos
    this.data.fill(0, this.index(x, y), this.index(1, y) + 3)
    return this.refresh()
  }

  clear_bos () {
    let { x, y } = this.pos
    this.data.fill(0, 0, this.index(x, y) + 3)
    return this.refresh()
  }

  copy_line (sy, ty) {
    let si = this.line(sy)
    this.data.copy(si.start, this.line(ty), si.length)
    return this.refresh()
  }

  copy_col (sx, tx) {
    let data = this.data
    sx *= 3
    tx *= 3
    for (let y = 0; y < this.height; y++) {
      let i = this.line(y)
      data.copy(i.start + sx, i.start + tx, 3)
    }
    return this.refresh()
  }

  erase_line (y) {
    let i = this.line(y)
    this.data.fill(0, i.start, i.length + 3)
    return this.refresh()
  }

  erase_col (x) {
    let data = this.data
    let ls = this.line(0).start + x * 3
    for (let y = 0; y < this.height; y++) {
      data.fill(0, ls, ls + 3)
      ls += this.width * 3
    }
    return this.refresh()
  }

  scroll (dy) {
    if (dy > 0) {
      let i = this.line(dy + 1)
      this.data.copy(i.start, 0, this.size)
      i = this.line(dy)
      let s = i.start
      this.data.fill(0, s, this.size)
    }
    else if (dy < 0) {
      let i = this.line(dy + 1)
      this.data.copy(i.start, 0, this.size)
      i = this.line(dy)
      let s = i.start
      this.data.fill(0, s, this.size)
    }
    return this.refresh()
  }

  test () {
    this.move_to(1, 1).put('A', 29, 15)

    this.move_to(10, 11).print('Welcome to DX32\nÉgalitée!', 2, 6)

    let chars = ''
    for (let i = 33; i < 256; i++) {
      chars += String.fromCharCode(i)
    }
    this.move_to(1, 2).print(chars, 25, 0)

    this.move_to(15, 2).bs().bs().bs().bs()

    this.move_to(25, 2).clear_eol()

    this.move_to(1, 22).print('Second to last line', 1, 0)

    this.move_to(1, 23).print('012345678901234567890123456789012345678901234567890123', 21, 0)

    // let y = 1
    // for (let c = 1; c < 4; c++) {
    //   for (let i = 0; i < 10; i++) {
    //     this.move_to(1, y++)
    //     this.put('0'.charCodeAt(0) + i)
    //   }
    // }

    this.refresh()

    // setTimeout(() => {
      // setInterval(() => {
        // for (var i = 0; i < 50; i++) {
          // this.move_to(_.random(1, this.width), _.random(1, this.height))
          // this.print(String.fromCharCode(_.random(1, 255)), _.random(0, 31), _.random(0, 31))
        // }
        // this.refresh()
      // }, 1)
    // }, 1500)
  }

}
