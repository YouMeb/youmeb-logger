'use strict';

var fs = require('fs');
var util = require('util');
var path = require('path');
var mkdirp = require('mkdirp');
var EventEmitter = require('events').EventEmitter;

module.exports = Logger;

var levels = [
  'EMERGENCY',  // system unusable
  'ALERT',      // immediate action required
  'CRITICAL',   // condition critical
  'ERROR',      // condition error
  'WARNING',    // condition warning
  'NOTICE',     // condition normal, but significant
  'INFO',       // a purely informational message
  'DEBUG'       // debugging information
];

function Logger(level, dir, filenameFormat) {
  EventEmitter.call(this);
  
  if (typeof level === 'string') {
    level = Logger[level.toUpperCase()];
  }
  
  this.level = isFinite(level) ? level : this.DEBUG;
  this.filenameFormat = filenameFormat;
  this.dir = dir;
  this._enable = true;

  this.parse = Logger.parse;
  this.read = Logger.read;

  if (dir) {
    mkdirp.sync(dir);
  }
}

levels.forEach(function (val, index) {
  Logger[val] = index;
});

Logger.create = function (level, dir, filenameFormat) {
  return new Logger(level, dir, filenameFormat);
};

Logger.parse = function (content) {
  var list = [];
  content.replace(/^\[(.*)\]\s+(\w+)\s+(.*)$/gm, function (origin, time, level, message) {
    level = level.toUpperCase();
    if (!Logger.hasOwnProperty(level)) {
      return;
    }
    list.push({
      time: Date.parse(time),
      level: level,
      message: message
    });
  });
  return list;
};

Logger.read = function (file, done) {
  fs.readFile(file, 'utf8', function (err, content) {
    if (err) {
      return done(err);
    }
    done(null, Logger.parse(content));
  });
};

util.inherits(Logger, EventEmitter);

Logger.prototype.getStream = function () {
  if (!this.filenameFormat) {
    return process.stdout;
  }
  var d = new Date();
  var now = d.getTime() / 86400000 | 0;
  if (!this.timestamp || this.timestamp < now) {
    if (this.stream) {
      this.stream.end();
    }
    this.stream = fs.createWriteStream(path.join(this.dir, util.format(this.filenameFormat, [d.getFullYear(), d.getMonth(), d.getDate()].join('-'))), {flags: 'a'});
  }
  return this.stream;
};

Logger.prototype.disable = function () {
  this._enable = false;
  return this;
};

Logger.prototype.enable = function () {
  this._enable = true;
  return this;
};

Logger.prototype.log = function (level, args) {
  if (this._enable && Logger[level] <= this.level) {
    var msg = util.format.apply(null, args);
    var now = new Date();
    var log = {
      str: '[' + now + ']'
        + ' ' + level
        + ' ' + msg
        + '\n',
      level: level,
      message: msg,
      date: now
    };
    this.getStream().write(log.str);
    this.emit(level, log);
    this.emit('LOG', log);
  }
  return this;
};

levels.forEach(function (level) {
  Logger.prototype[level.toLowerCase()] = function (msg) {
    return this.log(level, arguments);
  };
});

Logger.prototype.getFiles = function (from, to) {
  var argslen = arguments.length;
  var dateRe = /\d{4}-\d{1,2}-\d{1,2}/;
  var filter = (function () {
    switch (argslen) {
      case 0:
        return function () {
          return true;
        };
        break;
      case 1:
        from = (from instanceof Date) ? from : new Date(from);
        return function (date) {
          return date.getTime() === from.getTime();
        };
        break;
      case 2:
        from = (from instanceof Date) ? from : new Date(from);
        to = (to instanceof Date) ? to : new Date(to);
        return function (date) {
          return date >= from && date <= to;
        };
        break;
      default:
        return function () {
          return false;
        };
    }
  })();
  var files = fs.readdirSync(this.dir);
  var result = [];
  var dir = this.dir;

  files.forEach(function (file) {
    var date = file.match(dateRe);
    if (date) {
      date = new Date(date[0]);
      if (filter(date)) {
        result.push({
          path: path.join(dir, file),
          date: date
        });
      };
    }
  });

  return result;
}; 

// 從 1970 到 date 的所有 log 檔
Logger.prototype.getFilesBefore = function (date) {
  date = (date instanceof Date) ? date : Date.parse(date);
  date = new Date(date - 86400000);
  return this.getFiles(new Date('1970-01-01'), date);
};

// 從 date 到現在的所有 log 檔
Logger.prototype.getFilesAfter = function (date) {
  date = (date instanceof Date) ? date : Date.parse(date);
  date = new Date(date + 86400000);
  return this.getFiles(date, new Date());
};

Logger.prototype.clear = function (before, after) {
  var files = this.getFiles(befor, after);
  files.forEach(function (file) {
    fs.unlink(file.path);
  });
  return this;
};

Logger.prototype.clearBefore = function (before, after) {
  var files = this.getFilesBefore(befor, after);
  files.forEach(function (file) {
    fs.unlink(file.path);
  });
  return this;
};

Logger.prototype.clearAfter = function (before, after) {
  var files = this.getFilesAfter(befor, after);
  files.forEach(function (file) {
    fs.unlink(file.path);
  });
  return this;
};
