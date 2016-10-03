var CustomEvent, EventEmitter, TextBuffer, TextCursor, TextPoint, TextRegion, fn, fn1, i, j, len, len1, method, pointMethods, ref, regionMethods,
  extend = function(child, parent) { for (var key in parent) { if (hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
  hasProp = {}.hasOwnProperty;

EventEmitter = TOS.EventEmitter, CustomEvent = TOS.CustomEvent;

ref = require('./textbuffer'), TextBuffer = ref.TextBuffer, TextPoint = ref.TextPoint, TextRegion = ref.TextRegion;

TextCursor = TextCursor = (function(superClass) {
  extend(TextCursor, superClass);

  function TextCursor(buffer, row, col) {
    this.buffer = buffer;
    EventEmitter(this);
    this.point = this.buffer.point(row, col);
    this.point.on("move", (function(_this) {
      return function() {
        return _this.emit("move");
      };
    })(this));
    this.buffer.on("line:change", (function(_this) {
      return function() {
        var ref1;
        return (ref1 = _this.point) != null ? ref1.round() : void 0;
      };
    })(this));
    this.buffer.on("line:insert", (function(_this) {
      return function() {
        var ref1;
        return (ref1 = _this.point) != null ? ref1.round() : void 0;
      };
    })(this));
    this.buffer.on("line:delete", (function(_this) {
      return function() {
        var ref1;
        return (ref1 = _this.point) != null ? ref1.round() : void 0;
      };
    })(this));
  }

  TextCursor.prototype.serialize = function() {
    if (this.point) {
      return {
        row: this.point.row,
        col: this.point.col
      };
    } else {
      return {
        begin: {
          row: this.region.begin.row,
          col: this.region.begin.col
        },
        end: {
          row: this.region.end.row,
          col: this.region.end.col
        }
      };
    }
  };

  TextCursor.prototype.deserialize = function(data) {
    if (data.row != null) {
      return this.moveTo(data.row, data.col);
    } else {
      return this.select(data);
    }
  };

  TextCursor.prototype.toTextPoint = function() {
    if (this.point) {
      return;
    }
    this.point = this.region.end;
    this.region = null;
    return this.point.on("move", (function(_this) {
      return function() {
        return _this.emit("move");
      };
    })(this));
  };

  TextCursor.prototype.toTextRegion = function() {
    if (this.region) {
      return;
    }
    this.region = new TextRegion(this.point, this.point.clone());
    this.point = null;
    this.region.begin.removeAllListeners("move");
    this.region.begin.on("move", (function(_this) {
      return function() {
        return _this.emit("move");
      };
    })(this));
    return this.region.end.on("move", (function(_this) {
      return function() {
        return _this.emit("move");
      };
    })(this));
  };

  TextCursor.prototype.moveTo = function(row, col) {
    this.toTextPoint();
    this.point.moveTo(row, col);
    return this.point.round();
  };

  TextCursor.prototype.select = function(region) {
    this.toTextRegion();
    this.region.begin.moveTo(region.begin);
    return this.region.end.moveTo(region.end);
  };

  TextCursor.prototype.selectTo = function(row, col) {
    this.toTextRegion();
    this.region.end.moveTo(row, col);
    return this.region.end.round();
  };

  TextCursor.prototype.extendTo = function(region) {
    this.toTextRegion();
    return this.region.extendTo(region);
  };

  TextCursor.prototype.moveVertical = function(amount) {
    this.toTextPoint();
    this.point.moveVertical(amount);
    return this.point.round();
  };

  TextCursor.prototype.selectVertical = function(amount) {
    this.toTextRegion();
    this.region.end.moveVertical(amount);
    return this.region.end.round();
  };

  TextCursor.prototype.selectAll = function() {
    var lastCol, lastRow;
    this.toTextRegion();
    lastRow = this.buffer.lineCount() - 1;
    lastCol = this.buffer.lineLength(lastRow);
    this.region.begin.moveTo(0, 0);
    return this.region.end.moveTo(lastRow, lastCol);
  };

  TextCursor.prototype.selectRow = function(row) {
    this.toTextRegion();
    return this.region.selectRow(row);
  };

  TextCursor.prototype.selectRows = function(r1, r2) {
    this.toTextRegion();
    return this.region.selectRows(r1, r2);
  };

  TextCursor.prototype.insert = function(text) {
    this.deleteSelection();
    this.toTextPoint();
    return this.point.insert(text);
  };

  TextCursor.prototype.overwrite = function(text) {
    this.toTextPoint();
    return this.point.overwrite(text);
  };

  TextCursor.prototype.deleteBack = function() {
    if (this.deleteSelection()) {
      return;
    }
    this.toTextPoint();
    return this.point.deleteBack();
  };

  TextCursor.prototype.deleteForward = function() {
    if (this.deleteSelection()) {
      return;
    }
    this.toTextPoint();
    return this.point.deleteForward();
  };

  TextCursor.prototype.deleteWordBack = function() {
    this.deleteSelection();
    this.toTextPoint();
    return this.point.deleteWordBack();
  };

  TextCursor.prototype.deleteWordForward = function() {
    this.deleteSelection();
    this.toTextPoint();
    return this.point.deleteWordForward();
  };

  TextCursor.prototype.newLine = function() {
    this.toTextPoint();
    return this.point.newLine();
  };

  TextCursor.prototype.deleteSelection = function() {
    if (!this.region || this.region.isEmpty()) {
      return false;
    } else {
      this.region["delete"]();
      this.emit("move");
      return true;
    }
  };

  TextCursor.prototype.deleteRows = function() {
    var begin, end, ref1;
    this.toTextRegion();
    ref1 = this.region.ordered(), begin = ref1.begin, end = ref1.end;
    this.buffer.deleteLines(begin.row, end.row);
    this.toTextPoint();
    this.point.moveTo(begin);
    return this.point.round();
  };

  TextCursor.prototype.text = function() {
    this.toTextRegion();
    return this.region.text();
  };

  TextCursor.prototype.indent = function(tab) {
    if (this.point || this.region.isEmpty()) {
      return this.insert(tab);
    } else {
      return this.region.indent(tab);
    }
  };

  TextCursor.prototype.outdent = function(tab) {
    this.toTextRegion();
    return this.region.outdent(tab);
  };

  TextCursor.prototype.pageUp = function() {
    return this.toTextPoint();
  };

  TextCursor.prototype.pageDown = function() {
    return this.toTextPoint();
  };

  return TextCursor;

})(EventEmitter);

pointMethods = ["moveToLineBegin", "moveToLineEnd", "moveToPrevWord", "moveToNextWord", "moveToDocBegin", "moveToDocEnd", "moveLeft", "moveRight", "moveUp", "moveDown"];

fn = function(method) {
  TextCursor.prototype[method] = function() {
    this.toTextPoint();
    this.point[method]();
    return this.point.round();
  };
  return TextCursor.prototype[method.replace(/^move/, "select")] = function() {
    this.toTextRegion();
    this.region.end[method]();
    return this.region.end.round();
  };
};
for (i = 0, len = pointMethods.length; i < len; i++) {
  method = pointMethods[i];
  fn(method);
}

regionMethods = ["shiftLinesDown", "shiftLinesUp"];

fn1 = function(method) {
  return TextCursor.prototype[method] = function() {
    this.toTextRegion();
    return this.region[method]();
  };
};
for (j = 0, len1 = regionMethods.length; j < len1; j++) {
  method = regionMethods[j];
  fn1(method);
}

module.exports = {
  TextCursor: TextCursor
};
