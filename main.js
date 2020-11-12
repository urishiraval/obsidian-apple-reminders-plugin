'use strict';

var obsidian = require('obsidian');
var require$$0 = require('child_process');
var require$$1 = require('path');
var require$$2 = require('fs');

function _interopDefaultLegacy (e) { return e && typeof e === 'object' && 'default' in e ? e : { 'default': e }; }

var require$$0__default = /*#__PURE__*/_interopDefaultLegacy(require$$0);
var require$$1__default = /*#__PURE__*/_interopDefaultLegacy(require$$1);
var require$$2__default = /*#__PURE__*/_interopDefaultLegacy(require$$2);

/*! *****************************************************************************
Copyright (c) Microsoft Corporation.

Permission to use, copy, modify, and/or distribute this software for any
purpose with or without fee is hereby granted.

THE SOFTWARE IS PROVIDED "AS IS" AND THE AUTHOR DISCLAIMS ALL WARRANTIES WITH
REGARD TO THIS SOFTWARE INCLUDING ALL IMPLIED WARRANTIES OF MERCHANTABILITY
AND FITNESS. IN NO EVENT SHALL THE AUTHOR BE LIABLE FOR ANY SPECIAL, DIRECT,
INDIRECT, OR CONSEQUENTIAL DAMAGES OR ANY DAMAGES WHATSOEVER RESULTING FROM
LOSS OF USE, DATA OR PROFITS, WHETHER IN AN ACTION OF CONTRACT, NEGLIGENCE OR
OTHER TORTIOUS ACTION, ARISING OUT OF OR IN CONNECTION WITH THE USE OR
PERFORMANCE OF THIS SOFTWARE.
***************************************************************************** */

function __awaiter(thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
}

function isNothing(subject) {
  return (typeof subject === 'undefined') || (subject === null);
}


function isObject(subject) {
  return (typeof subject === 'object') && (subject !== null);
}


function toArray(sequence) {
  if (Array.isArray(sequence)) return sequence;
  else if (isNothing(sequence)) return [];

  return [ sequence ];
}


function extend(target, source) {
  var index, length, key, sourceKeys;

  if (source) {
    sourceKeys = Object.keys(source);

    for (index = 0, length = sourceKeys.length; index < length; index += 1) {
      key = sourceKeys[index];
      target[key] = source[key];
    }
  }

  return target;
}


function repeat(string, count) {
  var result = '', cycle;

  for (cycle = 0; cycle < count; cycle += 1) {
    result += string;
  }

  return result;
}


function isNegativeZero(number) {
  return (number === 0) && (Number.NEGATIVE_INFINITY === 1 / number);
}


var isNothing_1      = isNothing;
var isObject_1       = isObject;
var toArray_1        = toArray;
var repeat_1         = repeat;
var isNegativeZero_1 = isNegativeZero;
var extend_1         = extend;

var common = {
	isNothing: isNothing_1,
	isObject: isObject_1,
	toArray: toArray_1,
	repeat: repeat_1,
	isNegativeZero: isNegativeZero_1,
	extend: extend_1
};

// YAML error class. http://stackoverflow.com/questions/8458984

function YAMLException(reason, mark) {
  // Super constructor
  Error.call(this);

  this.name = 'YAMLException';
  this.reason = reason;
  this.mark = mark;
  this.message = (this.reason || '(unknown reason)') + (this.mark ? ' ' + this.mark.toString() : '');

  // Include stack trace in error object
  if (Error.captureStackTrace) {
    // Chrome and NodeJS
    Error.captureStackTrace(this, this.constructor);
  } else {
    // FF, IE 10+ and Safari 6+. Fallback for others
    this.stack = (new Error()).stack || '';
  }
}


// Inherit from Error
YAMLException.prototype = Object.create(Error.prototype);
YAMLException.prototype.constructor = YAMLException;


YAMLException.prototype.toString = function toString(compact) {
  var result = this.name + ': ';

  result += this.reason || '(unknown reason)';

  if (!compact && this.mark) {
    result += ' ' + this.mark.toString();
  }

  return result;
};


var exception = YAMLException;

function Mark(name, buffer, position, line, column) {
  this.name     = name;
  this.buffer   = buffer;
  this.position = position;
  this.line     = line;
  this.column   = column;
}


Mark.prototype.getSnippet = function getSnippet(indent, maxLength) {
  var head, start, tail, end, snippet;

  if (!this.buffer) return null;

  indent = indent || 4;
  maxLength = maxLength || 75;

  head = '';
  start = this.position;

  while (start > 0 && '\x00\r\n\x85\u2028\u2029'.indexOf(this.buffer.charAt(start - 1)) === -1) {
    start -= 1;
    if (this.position - start > (maxLength / 2 - 1)) {
      head = ' ... ';
      start += 5;
      break;
    }
  }

  tail = '';
  end = this.position;

  while (end < this.buffer.length && '\x00\r\n\x85\u2028\u2029'.indexOf(this.buffer.charAt(end)) === -1) {
    end += 1;
    if (end - this.position > (maxLength / 2 - 1)) {
      tail = ' ... ';
      end -= 5;
      break;
    }
  }

  snippet = this.buffer.slice(start, end);

  return common.repeat(' ', indent) + head + snippet + tail + '\n' +
         common.repeat(' ', indent + this.position - start + head.length) + '^';
};


Mark.prototype.toString = function toString(compact) {
  var snippet, where = '';

  if (this.name) {
    where += 'in "' + this.name + '" ';
  }

  where += 'at line ' + (this.line + 1) + ', column ' + (this.column + 1);

  if (!compact) {
    snippet = this.getSnippet();

    if (snippet) {
      where += ':\n' + snippet;
    }
  }

  return where;
};


var mark = Mark;

var TYPE_CONSTRUCTOR_OPTIONS = [
  'kind',
  'resolve',
  'construct',
  'instanceOf',
  'predicate',
  'represent',
  'defaultStyle',
  'styleAliases'
];

var YAML_NODE_KINDS = [
  'scalar',
  'sequence',
  'mapping'
];

function compileStyleAliases(map) {
  var result = {};

  if (map !== null) {
    Object.keys(map).forEach(function (style) {
      map[style].forEach(function (alias) {
        result[String(alias)] = style;
      });
    });
  }

  return result;
}

function Type(tag, options) {
  options = options || {};

  Object.keys(options).forEach(function (name) {
    if (TYPE_CONSTRUCTOR_OPTIONS.indexOf(name) === -1) {
      throw new exception('Unknown option "' + name + '" is met in definition of "' + tag + '" YAML type.');
    }
  });

  // TODO: Add tag format check.
  this.tag          = tag;
  this.kind         = options['kind']         || null;
  this.resolve      = options['resolve']      || function () { return true; };
  this.construct    = options['construct']    || function (data) { return data; };
  this.instanceOf   = options['instanceOf']   || null;
  this.predicate    = options['predicate']    || null;
  this.represent    = options['represent']    || null;
  this.defaultStyle = options['defaultStyle'] || null;
  this.styleAliases = compileStyleAliases(options['styleAliases'] || null);

  if (YAML_NODE_KINDS.indexOf(this.kind) === -1) {
    throw new exception('Unknown kind "' + this.kind + '" is specified for "' + tag + '" YAML type.');
  }
}

var type = Type;

/*eslint-disable max-len*/






function compileList(schema, name, result) {
  var exclude = [];

  schema.include.forEach(function (includedSchema) {
    result = compileList(includedSchema, name, result);
  });

  schema[name].forEach(function (currentType) {
    result.forEach(function (previousType, previousIndex) {
      if (previousType.tag === currentType.tag && previousType.kind === currentType.kind) {
        exclude.push(previousIndex);
      }
    });

    result.push(currentType);
  });

  return result.filter(function (type, index) {
    return exclude.indexOf(index) === -1;
  });
}


function compileMap(/* lists... */) {
  var result = {
        scalar: {},
        sequence: {},
        mapping: {},
        fallback: {}
      }, index, length;

  function collectType(type) {
    result[type.kind][type.tag] = result['fallback'][type.tag] = type;
  }

  for (index = 0, length = arguments.length; index < length; index += 1) {
    arguments[index].forEach(collectType);
  }
  return result;
}


function Schema(definition) {
  this.include  = definition.include  || [];
  this.implicit = definition.implicit || [];
  this.explicit = definition.explicit || [];

  this.implicit.forEach(function (type) {
    if (type.loadKind && type.loadKind !== 'scalar') {
      throw new exception('There is a non-scalar type in the implicit list of a schema. Implicit resolving of such types is not supported.');
    }
  });

  this.compiledImplicit = compileList(this, 'implicit', []);
  this.compiledExplicit = compileList(this, 'explicit', []);
  this.compiledTypeMap  = compileMap(this.compiledImplicit, this.compiledExplicit);
}


Schema.DEFAULT = null;


Schema.create = function createSchema() {
  var schemas, types;

  switch (arguments.length) {
    case 1:
      schemas = Schema.DEFAULT;
      types = arguments[0];
      break;

    case 2:
      schemas = arguments[0];
      types = arguments[1];
      break;

    default:
      throw new exception('Wrong number of arguments for Schema.create function');
  }

  schemas = common.toArray(schemas);
  types = common.toArray(types);

  if (!schemas.every(function (schema) { return schema instanceof Schema; })) {
    throw new exception('Specified list of super schemas (or a single Schema object) contains a non-Schema object.');
  }

  if (!types.every(function (type$1) { return type$1 instanceof type; })) {
    throw new exception('Specified list of YAML types (or a single Type object) contains a non-Type object.');
  }

  return new Schema({
    include: schemas,
    explicit: types
  });
};


var schema = Schema;

var str = new type('tag:yaml.org,2002:str', {
  kind: 'scalar',
  construct: function (data) { return data !== null ? data : ''; }
});

var seq = new type('tag:yaml.org,2002:seq', {
  kind: 'sequence',
  construct: function (data) { return data !== null ? data : []; }
});

var map = new type('tag:yaml.org,2002:map', {
  kind: 'mapping',
  construct: function (data) { return data !== null ? data : {}; }
});

var failsafe = new schema({
  explicit: [
    str,
    seq,
    map
  ]
});

function resolveYamlNull(data) {
  if (data === null) return true;

  var max = data.length;

  return (max === 1 && data === '~') ||
         (max === 4 && (data === 'null' || data === 'Null' || data === 'NULL'));
}

function constructYamlNull() {
  return null;
}

function isNull(object) {
  return object === null;
}

var _null = new type('tag:yaml.org,2002:null', {
  kind: 'scalar',
  resolve: resolveYamlNull,
  construct: constructYamlNull,
  predicate: isNull,
  represent: {
    canonical: function () { return '~';    },
    lowercase: function () { return 'null'; },
    uppercase: function () { return 'NULL'; },
    camelcase: function () { return 'Null'; }
  },
  defaultStyle: 'lowercase'
});

function resolveYamlBoolean(data) {
  if (data === null) return false;

  var max = data.length;

  return (max === 4 && (data === 'true' || data === 'True' || data === 'TRUE')) ||
         (max === 5 && (data === 'false' || data === 'False' || data === 'FALSE'));
}

function constructYamlBoolean(data) {
  return data === 'true' ||
         data === 'True' ||
         data === 'TRUE';
}

function isBoolean(object) {
  return Object.prototype.toString.call(object) === '[object Boolean]';
}

var bool = new type('tag:yaml.org,2002:bool', {
  kind: 'scalar',
  resolve: resolveYamlBoolean,
  construct: constructYamlBoolean,
  predicate: isBoolean,
  represent: {
    lowercase: function (object) { return object ? 'true' : 'false'; },
    uppercase: function (object) { return object ? 'TRUE' : 'FALSE'; },
    camelcase: function (object) { return object ? 'True' : 'False'; }
  },
  defaultStyle: 'lowercase'
});

function isHexCode(c) {
  return ((0x30/* 0 */ <= c) && (c <= 0x39/* 9 */)) ||
         ((0x41/* A */ <= c) && (c <= 0x46/* F */)) ||
         ((0x61/* a */ <= c) && (c <= 0x66/* f */));
}

function isOctCode(c) {
  return ((0x30/* 0 */ <= c) && (c <= 0x37/* 7 */));
}

function isDecCode(c) {
  return ((0x30/* 0 */ <= c) && (c <= 0x39/* 9 */));
}

function resolveYamlInteger(data) {
  if (data === null) return false;

  var max = data.length,
      index = 0,
      hasDigits = false,
      ch;

  if (!max) return false;

  ch = data[index];

  // sign
  if (ch === '-' || ch === '+') {
    ch = data[++index];
  }

  if (ch === '0') {
    // 0
    if (index + 1 === max) return true;
    ch = data[++index];

    // base 2, base 8, base 16

    if (ch === 'b') {
      // base 2
      index++;

      for (; index < max; index++) {
        ch = data[index];
        if (ch === '_') continue;
        if (ch !== '0' && ch !== '1') return false;
        hasDigits = true;
      }
      return hasDigits && ch !== '_';
    }


    if (ch === 'x') {
      // base 16
      index++;

      for (; index < max; index++) {
        ch = data[index];
        if (ch === '_') continue;
        if (!isHexCode(data.charCodeAt(index))) return false;
        hasDigits = true;
      }
      return hasDigits && ch !== '_';
    }

    // base 8
    for (; index < max; index++) {
      ch = data[index];
      if (ch === '_') continue;
      if (!isOctCode(data.charCodeAt(index))) return false;
      hasDigits = true;
    }
    return hasDigits && ch !== '_';
  }

  // base 10 (except 0) or base 60

  // value should not start with `_`;
  if (ch === '_') return false;

  for (; index < max; index++) {
    ch = data[index];
    if (ch === '_') continue;
    if (ch === ':') break;
    if (!isDecCode(data.charCodeAt(index))) {
      return false;
    }
    hasDigits = true;
  }

  // Should have digits and should not end with `_`
  if (!hasDigits || ch === '_') return false;

  // if !base60 - done;
  if (ch !== ':') return true;

  // base60 almost not used, no needs to optimize
  return /^(:[0-5]?[0-9])+$/.test(data.slice(index));
}

function constructYamlInteger(data) {
  var value = data, sign = 1, ch, base, digits = [];

  if (value.indexOf('_') !== -1) {
    value = value.replace(/_/g, '');
  }

  ch = value[0];

  if (ch === '-' || ch === '+') {
    if (ch === '-') sign = -1;
    value = value.slice(1);
    ch = value[0];
  }

  if (value === '0') return 0;

  if (ch === '0') {
    if (value[1] === 'b') return sign * parseInt(value.slice(2), 2);
    if (value[1] === 'x') return sign * parseInt(value, 16);
    return sign * parseInt(value, 8);
  }

  if (value.indexOf(':') !== -1) {
    value.split(':').forEach(function (v) {
      digits.unshift(parseInt(v, 10));
    });

    value = 0;
    base = 1;

    digits.forEach(function (d) {
      value += (d * base);
      base *= 60;
    });

    return sign * value;

  }

  return sign * parseInt(value, 10);
}

function isInteger(object) {
  return (Object.prototype.toString.call(object)) === '[object Number]' &&
         (object % 1 === 0 && !common.isNegativeZero(object));
}

var int_1 = new type('tag:yaml.org,2002:int', {
  kind: 'scalar',
  resolve: resolveYamlInteger,
  construct: constructYamlInteger,
  predicate: isInteger,
  represent: {
    binary:      function (obj) { return obj >= 0 ? '0b' + obj.toString(2) : '-0b' + obj.toString(2).slice(1); },
    octal:       function (obj) { return obj >= 0 ? '0'  + obj.toString(8) : '-0'  + obj.toString(8).slice(1); },
    decimal:     function (obj) { return obj.toString(10); },
    /* eslint-disable max-len */
    hexadecimal: function (obj) { return obj >= 0 ? '0x' + obj.toString(16).toUpperCase() :  '-0x' + obj.toString(16).toUpperCase().slice(1); }
  },
  defaultStyle: 'decimal',
  styleAliases: {
    binary:      [ 2,  'bin' ],
    octal:       [ 8,  'oct' ],
    decimal:     [ 10, 'dec' ],
    hexadecimal: [ 16, 'hex' ]
  }
});

var YAML_FLOAT_PATTERN = new RegExp(
  // 2.5e4, 2.5 and integers
  '^(?:[-+]?(?:0|[1-9][0-9_]*)(?:\\.[0-9_]*)?(?:[eE][-+]?[0-9]+)?' +
  // .2e4, .2
  // special case, seems not from spec
  '|\\.[0-9_]+(?:[eE][-+]?[0-9]+)?' +
  // 20:59
  '|[-+]?[0-9][0-9_]*(?::[0-5]?[0-9])+\\.[0-9_]*' +
  // .inf
  '|[-+]?\\.(?:inf|Inf|INF)' +
  // .nan
  '|\\.(?:nan|NaN|NAN))$');

function resolveYamlFloat(data) {
  if (data === null) return false;

  if (!YAML_FLOAT_PATTERN.test(data) ||
      // Quick hack to not allow integers end with `_`
      // Probably should update regexp & check speed
      data[data.length - 1] === '_') {
    return false;
  }

  return true;
}

function constructYamlFloat(data) {
  var value, sign, base, digits;

  value  = data.replace(/_/g, '').toLowerCase();
  sign   = value[0] === '-' ? -1 : 1;
  digits = [];

  if ('+-'.indexOf(value[0]) >= 0) {
    value = value.slice(1);
  }

  if (value === '.inf') {
    return (sign === 1) ? Number.POSITIVE_INFINITY : Number.NEGATIVE_INFINITY;

  } else if (value === '.nan') {
    return NaN;

  } else if (value.indexOf(':') >= 0) {
    value.split(':').forEach(function (v) {
      digits.unshift(parseFloat(v, 10));
    });

    value = 0.0;
    base = 1;

    digits.forEach(function (d) {
      value += d * base;
      base *= 60;
    });

    return sign * value;

  }
  return sign * parseFloat(value, 10);
}


var SCIENTIFIC_WITHOUT_DOT = /^[-+]?[0-9]+e/;

function representYamlFloat(object, style) {
  var res;

  if (isNaN(object)) {
    switch (style) {
      case 'lowercase': return '.nan';
      case 'uppercase': return '.NAN';
      case 'camelcase': return '.NaN';
    }
  } else if (Number.POSITIVE_INFINITY === object) {
    switch (style) {
      case 'lowercase': return '.inf';
      case 'uppercase': return '.INF';
      case 'camelcase': return '.Inf';
    }
  } else if (Number.NEGATIVE_INFINITY === object) {
    switch (style) {
      case 'lowercase': return '-.inf';
      case 'uppercase': return '-.INF';
      case 'camelcase': return '-.Inf';
    }
  } else if (common.isNegativeZero(object)) {
    return '-0.0';
  }

  res = object.toString(10);

  // JS stringifier can build scientific format without dots: 5e-100,
  // while YAML requres dot: 5.e-100. Fix it with simple hack

  return SCIENTIFIC_WITHOUT_DOT.test(res) ? res.replace('e', '.e') : res;
}

function isFloat(object) {
  return (Object.prototype.toString.call(object) === '[object Number]') &&
         (object % 1 !== 0 || common.isNegativeZero(object));
}

var float_1 = new type('tag:yaml.org,2002:float', {
  kind: 'scalar',
  resolve: resolveYamlFloat,
  construct: constructYamlFloat,
  predicate: isFloat,
  represent: representYamlFloat,
  defaultStyle: 'lowercase'
});

var json = new schema({
  include: [
    failsafe
  ],
  implicit: [
    _null,
    bool,
    int_1,
    float_1
  ]
});

var core = new schema({
  include: [
    json
  ]
});

var YAML_DATE_REGEXP = new RegExp(
  '^([0-9][0-9][0-9][0-9])'          + // [1] year
  '-([0-9][0-9])'                    + // [2] month
  '-([0-9][0-9])$');                   // [3] day

var YAML_TIMESTAMP_REGEXP = new RegExp(
  '^([0-9][0-9][0-9][0-9])'          + // [1] year
  '-([0-9][0-9]?)'                   + // [2] month
  '-([0-9][0-9]?)'                   + // [3] day
  '(?:[Tt]|[ \\t]+)'                 + // ...
  '([0-9][0-9]?)'                    + // [4] hour
  ':([0-9][0-9])'                    + // [5] minute
  ':([0-9][0-9])'                    + // [6] second
  '(?:\\.([0-9]*))?'                 + // [7] fraction
  '(?:[ \\t]*(Z|([-+])([0-9][0-9]?)' + // [8] tz [9] tz_sign [10] tz_hour
  '(?::([0-9][0-9]))?))?$');           // [11] tz_minute

function resolveYamlTimestamp(data) {
  if (data === null) return false;
  if (YAML_DATE_REGEXP.exec(data) !== null) return true;
  if (YAML_TIMESTAMP_REGEXP.exec(data) !== null) return true;
  return false;
}

function constructYamlTimestamp(data) {
  var match, year, month, day, hour, minute, second, fraction = 0,
      delta = null, tz_hour, tz_minute, date;

  match = YAML_DATE_REGEXP.exec(data);
  if (match === null) match = YAML_TIMESTAMP_REGEXP.exec(data);

  if (match === null) throw new Error('Date resolve error');

  // match: [1] year [2] month [3] day

  year = +(match[1]);
  month = +(match[2]) - 1; // JS month starts with 0
  day = +(match[3]);

  if (!match[4]) { // no hour
    return new Date(Date.UTC(year, month, day));
  }

  // match: [4] hour [5] minute [6] second [7] fraction

  hour = +(match[4]);
  minute = +(match[5]);
  second = +(match[6]);

  if (match[7]) {
    fraction = match[7].slice(0, 3);
    while (fraction.length < 3) { // milli-seconds
      fraction += '0';
    }
    fraction = +fraction;
  }

  // match: [8] tz [9] tz_sign [10] tz_hour [11] tz_minute

  if (match[9]) {
    tz_hour = +(match[10]);
    tz_minute = +(match[11] || 0);
    delta = (tz_hour * 60 + tz_minute) * 60000; // delta in mili-seconds
    if (match[9] === '-') delta = -delta;
  }

  date = new Date(Date.UTC(year, month, day, hour, minute, second, fraction));

  if (delta) date.setTime(date.getTime() - delta);

  return date;
}

function representYamlTimestamp(object /*, style*/) {
  return object.toISOString();
}

var timestamp = new type('tag:yaml.org,2002:timestamp', {
  kind: 'scalar',
  resolve: resolveYamlTimestamp,
  construct: constructYamlTimestamp,
  instanceOf: Date,
  represent: representYamlTimestamp
});

function resolveYamlMerge(data) {
  return data === '<<' || data === null;
}

var merge = new type('tag:yaml.org,2002:merge', {
  kind: 'scalar',
  resolve: resolveYamlMerge
});

function commonjsRequire () {
	throw new Error('Dynamic requires are not currently supported by @rollup/plugin-commonjs');
}

/*eslint-disable no-bitwise*/

var NodeBuffer;

try {
  // A trick for browserified version, to not include `Buffer` shim
  var _require = commonjsRequire;
  NodeBuffer = _require('buffer').Buffer;
} catch (__) {}




// [ 64, 65, 66 ] -> [ padding, CR, LF ]
var BASE64_MAP = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=\n\r';


function resolveYamlBinary(data) {
  if (data === null) return false;

  var code, idx, bitlen = 0, max = data.length, map = BASE64_MAP;

  // Convert one by one.
  for (idx = 0; idx < max; idx++) {
    code = map.indexOf(data.charAt(idx));

    // Skip CR/LF
    if (code > 64) continue;

    // Fail on illegal characters
    if (code < 0) return false;

    bitlen += 6;
  }

  // If there are any bits left, source was corrupted
  return (bitlen % 8) === 0;
}

function constructYamlBinary(data) {
  var idx, tailbits,
      input = data.replace(/[\r\n=]/g, ''), // remove CR/LF & padding to simplify scan
      max = input.length,
      map = BASE64_MAP,
      bits = 0,
      result = [];

  // Collect by 6*4 bits (3 bytes)

  for (idx = 0; idx < max; idx++) {
    if ((idx % 4 === 0) && idx) {
      result.push((bits >> 16) & 0xFF);
      result.push((bits >> 8) & 0xFF);
      result.push(bits & 0xFF);
    }

    bits = (bits << 6) | map.indexOf(input.charAt(idx));
  }

  // Dump tail

  tailbits = (max % 4) * 6;

  if (tailbits === 0) {
    result.push((bits >> 16) & 0xFF);
    result.push((bits >> 8) & 0xFF);
    result.push(bits & 0xFF);
  } else if (tailbits === 18) {
    result.push((bits >> 10) & 0xFF);
    result.push((bits >> 2) & 0xFF);
  } else if (tailbits === 12) {
    result.push((bits >> 4) & 0xFF);
  }

  // Wrap into Buffer for NodeJS and leave Array for browser
  if (NodeBuffer) {
    // Support node 6.+ Buffer API when available
    return NodeBuffer.from ? NodeBuffer.from(result) : new NodeBuffer(result);
  }

  return result;
}

function representYamlBinary(object /*, style*/) {
  var result = '', bits = 0, idx, tail,
      max = object.length,
      map = BASE64_MAP;

  // Convert every three bytes to 4 ASCII characters.

  for (idx = 0; idx < max; idx++) {
    if ((idx % 3 === 0) && idx) {
      result += map[(bits >> 18) & 0x3F];
      result += map[(bits >> 12) & 0x3F];
      result += map[(bits >> 6) & 0x3F];
      result += map[bits & 0x3F];
    }

    bits = (bits << 8) + object[idx];
  }

  // Dump tail

  tail = max % 3;

  if (tail === 0) {
    result += map[(bits >> 18) & 0x3F];
    result += map[(bits >> 12) & 0x3F];
    result += map[(bits >> 6) & 0x3F];
    result += map[bits & 0x3F];
  } else if (tail === 2) {
    result += map[(bits >> 10) & 0x3F];
    result += map[(bits >> 4) & 0x3F];
    result += map[(bits << 2) & 0x3F];
    result += map[64];
  } else if (tail === 1) {
    result += map[(bits >> 2) & 0x3F];
    result += map[(bits << 4) & 0x3F];
    result += map[64];
    result += map[64];
  }

  return result;
}

function isBinary(object) {
  return NodeBuffer && NodeBuffer.isBuffer(object);
}

var binary = new type('tag:yaml.org,2002:binary', {
  kind: 'scalar',
  resolve: resolveYamlBinary,
  construct: constructYamlBinary,
  predicate: isBinary,
  represent: representYamlBinary
});

var _hasOwnProperty = Object.prototype.hasOwnProperty;
var _toString       = Object.prototype.toString;

function resolveYamlOmap(data) {
  if (data === null) return true;

  var objectKeys = [], index, length, pair, pairKey, pairHasKey,
      object = data;

  for (index = 0, length = object.length; index < length; index += 1) {
    pair = object[index];
    pairHasKey = false;

    if (_toString.call(pair) !== '[object Object]') return false;

    for (pairKey in pair) {
      if (_hasOwnProperty.call(pair, pairKey)) {
        if (!pairHasKey) pairHasKey = true;
        else return false;
      }
    }

    if (!pairHasKey) return false;

    if (objectKeys.indexOf(pairKey) === -1) objectKeys.push(pairKey);
    else return false;
  }

  return true;
}

function constructYamlOmap(data) {
  return data !== null ? data : [];
}

var omap = new type('tag:yaml.org,2002:omap', {
  kind: 'sequence',
  resolve: resolveYamlOmap,
  construct: constructYamlOmap
});

var _toString$1 = Object.prototype.toString;

function resolveYamlPairs(data) {
  if (data === null) return true;

  var index, length, pair, keys, result,
      object = data;

  result = new Array(object.length);

  for (index = 0, length = object.length; index < length; index += 1) {
    pair = object[index];

    if (_toString$1.call(pair) !== '[object Object]') return false;

    keys = Object.keys(pair);

    if (keys.length !== 1) return false;

    result[index] = [ keys[0], pair[keys[0]] ];
  }

  return true;
}

function constructYamlPairs(data) {
  if (data === null) return [];

  var index, length, pair, keys, result,
      object = data;

  result = new Array(object.length);

  for (index = 0, length = object.length; index < length; index += 1) {
    pair = object[index];

    keys = Object.keys(pair);

    result[index] = [ keys[0], pair[keys[0]] ];
  }

  return result;
}

var pairs = new type('tag:yaml.org,2002:pairs', {
  kind: 'sequence',
  resolve: resolveYamlPairs,
  construct: constructYamlPairs
});

var _hasOwnProperty$1 = Object.prototype.hasOwnProperty;

function resolveYamlSet(data) {
  if (data === null) return true;

  var key, object = data;

  for (key in object) {
    if (_hasOwnProperty$1.call(object, key)) {
      if (object[key] !== null) return false;
    }
  }

  return true;
}

function constructYamlSet(data) {
  return data !== null ? data : {};
}

var set = new type('tag:yaml.org,2002:set', {
  kind: 'mapping',
  resolve: resolveYamlSet,
  construct: constructYamlSet
});

var default_safe = new schema({
  include: [
    core
  ],
  implicit: [
    timestamp,
    merge
  ],
  explicit: [
    binary,
    omap,
    pairs,
    set
  ]
});

function resolveJavascriptUndefined() {
  return true;
}

function constructJavascriptUndefined() {
  /*eslint-disable no-undefined*/
  return undefined;
}

function representJavascriptUndefined() {
  return '';
}

function isUndefined(object) {
  return typeof object === 'undefined';
}

var _undefined = new type('tag:yaml.org,2002:js/undefined', {
  kind: 'scalar',
  resolve: resolveJavascriptUndefined,
  construct: constructJavascriptUndefined,
  predicate: isUndefined,
  represent: representJavascriptUndefined
});

function resolveJavascriptRegExp(data) {
  if (data === null) return false;
  if (data.length === 0) return false;

  var regexp = data,
      tail   = /\/([gim]*)$/.exec(data),
      modifiers = '';

  // if regexp starts with '/' it can have modifiers and must be properly closed
  // `/foo/gim` - modifiers tail can be maximum 3 chars
  if (regexp[0] === '/') {
    if (tail) modifiers = tail[1];

    if (modifiers.length > 3) return false;
    // if expression starts with /, is should be properly terminated
    if (regexp[regexp.length - modifiers.length - 1] !== '/') return false;
  }

  return true;
}

function constructJavascriptRegExp(data) {
  var regexp = data,
      tail   = /\/([gim]*)$/.exec(data),
      modifiers = '';

  // `/foo/gim` - tail can be maximum 4 chars
  if (regexp[0] === '/') {
    if (tail) modifiers = tail[1];
    regexp = regexp.slice(1, regexp.length - modifiers.length - 1);
  }

  return new RegExp(regexp, modifiers);
}

function representJavascriptRegExp(object /*, style*/) {
  var result = '/' + object.source + '/';

  if (object.global) result += 'g';
  if (object.multiline) result += 'm';
  if (object.ignoreCase) result += 'i';

  return result;
}

function isRegExp(object) {
  return Object.prototype.toString.call(object) === '[object RegExp]';
}

var regexp = new type('tag:yaml.org,2002:js/regexp', {
  kind: 'scalar',
  resolve: resolveJavascriptRegExp,
  construct: constructJavascriptRegExp,
  predicate: isRegExp,
  represent: representJavascriptRegExp
});

var esprima;

// Browserified version does not have esprima
//
// 1. For node.js just require module as deps
// 2. For browser try to require mudule via external AMD system.
//    If not found - try to fallback to window.esprima. If not
//    found too - then fail to parse.
//
try {
  // workaround to exclude package from browserify list.
  var _require$1 = commonjsRequire;
  esprima = _require$1('esprima');
} catch (_) {
  /* eslint-disable no-redeclare */
  /* global window */
  if (typeof window !== 'undefined') esprima = window.esprima;
}



function resolveJavascriptFunction(data) {
  if (data === null) return false;

  try {
    var source = '(' + data + ')',
        ast    = esprima.parse(source, { range: true });

    if (ast.type                    !== 'Program'             ||
        ast.body.length             !== 1                     ||
        ast.body[0].type            !== 'ExpressionStatement' ||
        (ast.body[0].expression.type !== 'ArrowFunctionExpression' &&
          ast.body[0].expression.type !== 'FunctionExpression')) {
      return false;
    }

    return true;
  } catch (err) {
    return false;
  }
}

function constructJavascriptFunction(data) {
  /*jslint evil:true*/

  var source = '(' + data + ')',
      ast    = esprima.parse(source, { range: true }),
      params = [],
      body;

  if (ast.type                    !== 'Program'             ||
      ast.body.length             !== 1                     ||
      ast.body[0].type            !== 'ExpressionStatement' ||
      (ast.body[0].expression.type !== 'ArrowFunctionExpression' &&
        ast.body[0].expression.type !== 'FunctionExpression')) {
    throw new Error('Failed to resolve function');
  }

  ast.body[0].expression.params.forEach(function (param) {
    params.push(param.name);
  });

  body = ast.body[0].expression.body.range;

  // Esprima's ranges include the first '{' and the last '}' characters on
  // function expressions. So cut them out.
  if (ast.body[0].expression.body.type === 'BlockStatement') {
    /*eslint-disable no-new-func*/
    return new Function(params, source.slice(body[0] + 1, body[1] - 1));
  }
  // ES6 arrow functions can omit the BlockStatement. In that case, just return
  // the body.
  /*eslint-disable no-new-func*/
  return new Function(params, 'return ' + source.slice(body[0], body[1]));
}

function representJavascriptFunction(object /*, style*/) {
  return object.toString();
}

function isFunction(object) {
  return Object.prototype.toString.call(object) === '[object Function]';
}

var _function = new type('tag:yaml.org,2002:js/function', {
  kind: 'scalar',
  resolve: resolveJavascriptFunction,
  construct: constructJavascriptFunction,
  predicate: isFunction,
  represent: representJavascriptFunction
});

var default_full = schema.DEFAULT = new schema({
  include: [
    default_safe
  ],
  explicit: [
    _undefined,
    regexp,
    _function
  ]
});

/*eslint-disable max-len,no-use-before-define*/








var _hasOwnProperty$2 = Object.prototype.hasOwnProperty;


var CONTEXT_FLOW_IN   = 1;
var CONTEXT_FLOW_OUT  = 2;
var CONTEXT_BLOCK_IN  = 3;
var CONTEXT_BLOCK_OUT = 4;


var CHOMPING_CLIP  = 1;
var CHOMPING_STRIP = 2;
var CHOMPING_KEEP  = 3;


var PATTERN_NON_PRINTABLE         = /[\x00-\x08\x0B\x0C\x0E-\x1F\x7F-\x84\x86-\x9F\uFFFE\uFFFF]|[\uD800-\uDBFF](?![\uDC00-\uDFFF])|(?:[^\uD800-\uDBFF]|^)[\uDC00-\uDFFF]/;
var PATTERN_NON_ASCII_LINE_BREAKS = /[\x85\u2028\u2029]/;
var PATTERN_FLOW_INDICATORS       = /[,\[\]\{\}]/;
var PATTERN_TAG_HANDLE            = /^(?:!|!!|![a-z\-]+!)$/i;
var PATTERN_TAG_URI               = /^(?:!|[^,\[\]\{\}])(?:%[0-9a-f]{2}|[0-9a-z\-#;\/\?:@&=\+\$,_\.!~\*'\(\)\[\]])*$/i;


function _class(obj) { return Object.prototype.toString.call(obj); }

function is_EOL(c) {
  return (c === 0x0A/* LF */) || (c === 0x0D/* CR */);
}

function is_WHITE_SPACE(c) {
  return (c === 0x09/* Tab */) || (c === 0x20/* Space */);
}

function is_WS_OR_EOL(c) {
  return (c === 0x09/* Tab */) ||
         (c === 0x20/* Space */) ||
         (c === 0x0A/* LF */) ||
         (c === 0x0D/* CR */);
}

function is_FLOW_INDICATOR(c) {
  return c === 0x2C/* , */ ||
         c === 0x5B/* [ */ ||
         c === 0x5D/* ] */ ||
         c === 0x7B/* { */ ||
         c === 0x7D/* } */;
}

function fromHexCode(c) {
  var lc;

  if ((0x30/* 0 */ <= c) && (c <= 0x39/* 9 */)) {
    return c - 0x30;
  }

  /*eslint-disable no-bitwise*/
  lc = c | 0x20;

  if ((0x61/* a */ <= lc) && (lc <= 0x66/* f */)) {
    return lc - 0x61 + 10;
  }

  return -1;
}

function escapedHexLen(c) {
  if (c === 0x78/* x */) { return 2; }
  if (c === 0x75/* u */) { return 4; }
  if (c === 0x55/* U */) { return 8; }
  return 0;
}

function fromDecimalCode(c) {
  if ((0x30/* 0 */ <= c) && (c <= 0x39/* 9 */)) {
    return c - 0x30;
  }

  return -1;
}

function simpleEscapeSequence(c) {
  /* eslint-disable indent */
  return (c === 0x30/* 0 */) ? '\x00' :
        (c === 0x61/* a */) ? '\x07' :
        (c === 0x62/* b */) ? '\x08' :
        (c === 0x74/* t */) ? '\x09' :
        (c === 0x09/* Tab */) ? '\x09' :
        (c === 0x6E/* n */) ? '\x0A' :
        (c === 0x76/* v */) ? '\x0B' :
        (c === 0x66/* f */) ? '\x0C' :
        (c === 0x72/* r */) ? '\x0D' :
        (c === 0x65/* e */) ? '\x1B' :
        (c === 0x20/* Space */) ? ' ' :
        (c === 0x22/* " */) ? '\x22' :
        (c === 0x2F/* / */) ? '/' :
        (c === 0x5C/* \ */) ? '\x5C' :
        (c === 0x4E/* N */) ? '\x85' :
        (c === 0x5F/* _ */) ? '\xA0' :
        (c === 0x4C/* L */) ? '\u2028' :
        (c === 0x50/* P */) ? '\u2029' : '';
}

function charFromCodepoint(c) {
  if (c <= 0xFFFF) {
    return String.fromCharCode(c);
  }
  // Encode UTF-16 surrogate pair
  // https://en.wikipedia.org/wiki/UTF-16#Code_points_U.2B010000_to_U.2B10FFFF
  return String.fromCharCode(
    ((c - 0x010000) >> 10) + 0xD800,
    ((c - 0x010000) & 0x03FF) + 0xDC00
  );
}

var simpleEscapeCheck = new Array(256); // integer, for fast access
var simpleEscapeMap = new Array(256);
for (var i = 0; i < 256; i++) {
  simpleEscapeCheck[i] = simpleEscapeSequence(i) ? 1 : 0;
  simpleEscapeMap[i] = simpleEscapeSequence(i);
}


function State(input, options) {
  this.input = input;

  this.filename  = options['filename']  || null;
  this.schema    = options['schema']    || default_full;
  this.onWarning = options['onWarning'] || null;
  this.legacy    = options['legacy']    || false;
  this.json      = options['json']      || false;
  this.listener  = options['listener']  || null;

  this.implicitTypes = this.schema.compiledImplicit;
  this.typeMap       = this.schema.compiledTypeMap;

  this.length     = input.length;
  this.position   = 0;
  this.line       = 0;
  this.lineStart  = 0;
  this.lineIndent = 0;

  this.documents = [];

  /*
  this.version;
  this.checkLineBreaks;
  this.tagMap;
  this.anchorMap;
  this.tag;
  this.anchor;
  this.kind;
  this.result;*/

}


function generateError(state, message) {
  return new exception(
    message,
    new mark(state.filename, state.input, state.position, state.line, (state.position - state.lineStart)));
}

function throwError(state, message) {
  throw generateError(state, message);
}

function throwWarning(state, message) {
  if (state.onWarning) {
    state.onWarning.call(null, generateError(state, message));
  }
}


var directiveHandlers = {

  YAML: function handleYamlDirective(state, name, args) {

    var match, major, minor;

    if (state.version !== null) {
      throwError(state, 'duplication of %YAML directive');
    }

    if (args.length !== 1) {
      throwError(state, 'YAML directive accepts exactly one argument');
    }

    match = /^([0-9]+)\.([0-9]+)$/.exec(args[0]);

    if (match === null) {
      throwError(state, 'ill-formed argument of the YAML directive');
    }

    major = parseInt(match[1], 10);
    minor = parseInt(match[2], 10);

    if (major !== 1) {
      throwError(state, 'unacceptable YAML version of the document');
    }

    state.version = args[0];
    state.checkLineBreaks = (minor < 2);

    if (minor !== 1 && minor !== 2) {
      throwWarning(state, 'unsupported YAML version of the document');
    }
  },

  TAG: function handleTagDirective(state, name, args) {

    var handle, prefix;

    if (args.length !== 2) {
      throwError(state, 'TAG directive accepts exactly two arguments');
    }

    handle = args[0];
    prefix = args[1];

    if (!PATTERN_TAG_HANDLE.test(handle)) {
      throwError(state, 'ill-formed tag handle (first argument) of the TAG directive');
    }

    if (_hasOwnProperty$2.call(state.tagMap, handle)) {
      throwError(state, 'there is a previously declared suffix for "' + handle + '" tag handle');
    }

    if (!PATTERN_TAG_URI.test(prefix)) {
      throwError(state, 'ill-formed tag prefix (second argument) of the TAG directive');
    }

    state.tagMap[handle] = prefix;
  }
};


function captureSegment(state, start, end, checkJson) {
  var _position, _length, _character, _result;

  if (start < end) {
    _result = state.input.slice(start, end);

    if (checkJson) {
      for (_position = 0, _length = _result.length; _position < _length; _position += 1) {
        _character = _result.charCodeAt(_position);
        if (!(_character === 0x09 ||
              (0x20 <= _character && _character <= 0x10FFFF))) {
          throwError(state, 'expected valid JSON character');
        }
      }
    } else if (PATTERN_NON_PRINTABLE.test(_result)) {
      throwError(state, 'the stream contains non-printable characters');
    }

    state.result += _result;
  }
}

function mergeMappings(state, destination, source, overridableKeys) {
  var sourceKeys, key, index, quantity;

  if (!common.isObject(source)) {
    throwError(state, 'cannot merge mappings; the provided source object is unacceptable');
  }

  sourceKeys = Object.keys(source);

  for (index = 0, quantity = sourceKeys.length; index < quantity; index += 1) {
    key = sourceKeys[index];

    if (!_hasOwnProperty$2.call(destination, key)) {
      destination[key] = source[key];
      overridableKeys[key] = true;
    }
  }
}

function storeMappingPair(state, _result, overridableKeys, keyTag, keyNode, valueNode, startLine, startPos) {
  var index, quantity;

  // The output is a plain object here, so keys can only be strings.
  // We need to convert keyNode to a string, but doing so can hang the process
  // (deeply nested arrays that explode exponentially using aliases).
  if (Array.isArray(keyNode)) {
    keyNode = Array.prototype.slice.call(keyNode);

    for (index = 0, quantity = keyNode.length; index < quantity; index += 1) {
      if (Array.isArray(keyNode[index])) {
        throwError(state, 'nested arrays are not supported inside keys');
      }

      if (typeof keyNode === 'object' && _class(keyNode[index]) === '[object Object]') {
        keyNode[index] = '[object Object]';
      }
    }
  }

  // Avoid code execution in load() via toString property
  // (still use its own toString for arrays, timestamps,
  // and whatever user schema extensions happen to have @@toStringTag)
  if (typeof keyNode === 'object' && _class(keyNode) === '[object Object]') {
    keyNode = '[object Object]';
  }


  keyNode = String(keyNode);

  if (_result === null) {
    _result = {};
  }

  if (keyTag === 'tag:yaml.org,2002:merge') {
    if (Array.isArray(valueNode)) {
      for (index = 0, quantity = valueNode.length; index < quantity; index += 1) {
        mergeMappings(state, _result, valueNode[index], overridableKeys);
      }
    } else {
      mergeMappings(state, _result, valueNode, overridableKeys);
    }
  } else {
    if (!state.json &&
        !_hasOwnProperty$2.call(overridableKeys, keyNode) &&
        _hasOwnProperty$2.call(_result, keyNode)) {
      state.line = startLine || state.line;
      state.position = startPos || state.position;
      throwError(state, 'duplicated mapping key');
    }
    _result[keyNode] = valueNode;
    delete overridableKeys[keyNode];
  }

  return _result;
}

function readLineBreak(state) {
  var ch;

  ch = state.input.charCodeAt(state.position);

  if (ch === 0x0A/* LF */) {
    state.position++;
  } else if (ch === 0x0D/* CR */) {
    state.position++;
    if (state.input.charCodeAt(state.position) === 0x0A/* LF */) {
      state.position++;
    }
  } else {
    throwError(state, 'a line break is expected');
  }

  state.line += 1;
  state.lineStart = state.position;
}

function skipSeparationSpace(state, allowComments, checkIndent) {
  var lineBreaks = 0,
      ch = state.input.charCodeAt(state.position);

  while (ch !== 0) {
    while (is_WHITE_SPACE(ch)) {
      ch = state.input.charCodeAt(++state.position);
    }

    if (allowComments && ch === 0x23/* # */) {
      do {
        ch = state.input.charCodeAt(++state.position);
      } while (ch !== 0x0A/* LF */ && ch !== 0x0D/* CR */ && ch !== 0);
    }

    if (is_EOL(ch)) {
      readLineBreak(state);

      ch = state.input.charCodeAt(state.position);
      lineBreaks++;
      state.lineIndent = 0;

      while (ch === 0x20/* Space */) {
        state.lineIndent++;
        ch = state.input.charCodeAt(++state.position);
      }
    } else {
      break;
    }
  }

  if (checkIndent !== -1 && lineBreaks !== 0 && state.lineIndent < checkIndent) {
    throwWarning(state, 'deficient indentation');
  }

  return lineBreaks;
}

function testDocumentSeparator(state) {
  var _position = state.position,
      ch;

  ch = state.input.charCodeAt(_position);

  // Condition state.position === state.lineStart is tested
  // in parent on each call, for efficiency. No needs to test here again.
  if ((ch === 0x2D/* - */ || ch === 0x2E/* . */) &&
      ch === state.input.charCodeAt(_position + 1) &&
      ch === state.input.charCodeAt(_position + 2)) {

    _position += 3;

    ch = state.input.charCodeAt(_position);

    if (ch === 0 || is_WS_OR_EOL(ch)) {
      return true;
    }
  }

  return false;
}

function writeFoldedLines(state, count) {
  if (count === 1) {
    state.result += ' ';
  } else if (count > 1) {
    state.result += common.repeat('\n', count - 1);
  }
}


function readPlainScalar(state, nodeIndent, withinFlowCollection) {
  var preceding,
      following,
      captureStart,
      captureEnd,
      hasPendingContent,
      _line,
      _lineStart,
      _lineIndent,
      _kind = state.kind,
      _result = state.result,
      ch;

  ch = state.input.charCodeAt(state.position);

  if (is_WS_OR_EOL(ch)      ||
      is_FLOW_INDICATOR(ch) ||
      ch === 0x23/* # */    ||
      ch === 0x26/* & */    ||
      ch === 0x2A/* * */    ||
      ch === 0x21/* ! */    ||
      ch === 0x7C/* | */    ||
      ch === 0x3E/* > */    ||
      ch === 0x27/* ' */    ||
      ch === 0x22/* " */    ||
      ch === 0x25/* % */    ||
      ch === 0x40/* @ */    ||
      ch === 0x60/* ` */) {
    return false;
  }

  if (ch === 0x3F/* ? */ || ch === 0x2D/* - */) {
    following = state.input.charCodeAt(state.position + 1);

    if (is_WS_OR_EOL(following) ||
        withinFlowCollection && is_FLOW_INDICATOR(following)) {
      return false;
    }
  }

  state.kind = 'scalar';
  state.result = '';
  captureStart = captureEnd = state.position;
  hasPendingContent = false;

  while (ch !== 0) {
    if (ch === 0x3A/* : */) {
      following = state.input.charCodeAt(state.position + 1);

      if (is_WS_OR_EOL(following) ||
          withinFlowCollection && is_FLOW_INDICATOR(following)) {
        break;
      }

    } else if (ch === 0x23/* # */) {
      preceding = state.input.charCodeAt(state.position - 1);

      if (is_WS_OR_EOL(preceding)) {
        break;
      }

    } else if ((state.position === state.lineStart && testDocumentSeparator(state)) ||
               withinFlowCollection && is_FLOW_INDICATOR(ch)) {
      break;

    } else if (is_EOL(ch)) {
      _line = state.line;
      _lineStart = state.lineStart;
      _lineIndent = state.lineIndent;
      skipSeparationSpace(state, false, -1);

      if (state.lineIndent >= nodeIndent) {
        hasPendingContent = true;
        ch = state.input.charCodeAt(state.position);
        continue;
      } else {
        state.position = captureEnd;
        state.line = _line;
        state.lineStart = _lineStart;
        state.lineIndent = _lineIndent;
        break;
      }
    }

    if (hasPendingContent) {
      captureSegment(state, captureStart, captureEnd, false);
      writeFoldedLines(state, state.line - _line);
      captureStart = captureEnd = state.position;
      hasPendingContent = false;
    }

    if (!is_WHITE_SPACE(ch)) {
      captureEnd = state.position + 1;
    }

    ch = state.input.charCodeAt(++state.position);
  }

  captureSegment(state, captureStart, captureEnd, false);

  if (state.result) {
    return true;
  }

  state.kind = _kind;
  state.result = _result;
  return false;
}

function readSingleQuotedScalar(state, nodeIndent) {
  var ch,
      captureStart, captureEnd;

  ch = state.input.charCodeAt(state.position);

  if (ch !== 0x27/* ' */) {
    return false;
  }

  state.kind = 'scalar';
  state.result = '';
  state.position++;
  captureStart = captureEnd = state.position;

  while ((ch = state.input.charCodeAt(state.position)) !== 0) {
    if (ch === 0x27/* ' */) {
      captureSegment(state, captureStart, state.position, true);
      ch = state.input.charCodeAt(++state.position);

      if (ch === 0x27/* ' */) {
        captureStart = state.position;
        state.position++;
        captureEnd = state.position;
      } else {
        return true;
      }

    } else if (is_EOL(ch)) {
      captureSegment(state, captureStart, captureEnd, true);
      writeFoldedLines(state, skipSeparationSpace(state, false, nodeIndent));
      captureStart = captureEnd = state.position;

    } else if (state.position === state.lineStart && testDocumentSeparator(state)) {
      throwError(state, 'unexpected end of the document within a single quoted scalar');

    } else {
      state.position++;
      captureEnd = state.position;
    }
  }

  throwError(state, 'unexpected end of the stream within a single quoted scalar');
}

function readDoubleQuotedScalar(state, nodeIndent) {
  var captureStart,
      captureEnd,
      hexLength,
      hexResult,
      tmp,
      ch;

  ch = state.input.charCodeAt(state.position);

  if (ch !== 0x22/* " */) {
    return false;
  }

  state.kind = 'scalar';
  state.result = '';
  state.position++;
  captureStart = captureEnd = state.position;

  while ((ch = state.input.charCodeAt(state.position)) !== 0) {
    if (ch === 0x22/* " */) {
      captureSegment(state, captureStart, state.position, true);
      state.position++;
      return true;

    } else if (ch === 0x5C/* \ */) {
      captureSegment(state, captureStart, state.position, true);
      ch = state.input.charCodeAt(++state.position);

      if (is_EOL(ch)) {
        skipSeparationSpace(state, false, nodeIndent);

        // TODO: rework to inline fn with no type cast?
      } else if (ch < 256 && simpleEscapeCheck[ch]) {
        state.result += simpleEscapeMap[ch];
        state.position++;

      } else if ((tmp = escapedHexLen(ch)) > 0) {
        hexLength = tmp;
        hexResult = 0;

        for (; hexLength > 0; hexLength--) {
          ch = state.input.charCodeAt(++state.position);

          if ((tmp = fromHexCode(ch)) >= 0) {
            hexResult = (hexResult << 4) + tmp;

          } else {
            throwError(state, 'expected hexadecimal character');
          }
        }

        state.result += charFromCodepoint(hexResult);

        state.position++;

      } else {
        throwError(state, 'unknown escape sequence');
      }

      captureStart = captureEnd = state.position;

    } else if (is_EOL(ch)) {
      captureSegment(state, captureStart, captureEnd, true);
      writeFoldedLines(state, skipSeparationSpace(state, false, nodeIndent));
      captureStart = captureEnd = state.position;

    } else if (state.position === state.lineStart && testDocumentSeparator(state)) {
      throwError(state, 'unexpected end of the document within a double quoted scalar');

    } else {
      state.position++;
      captureEnd = state.position;
    }
  }

  throwError(state, 'unexpected end of the stream within a double quoted scalar');
}

function readFlowCollection(state, nodeIndent) {
  var readNext = true,
      _line,
      _tag     = state.tag,
      _result,
      _anchor  = state.anchor,
      following,
      terminator,
      isPair,
      isExplicitPair,
      isMapping,
      overridableKeys = {},
      keyNode,
      keyTag,
      valueNode,
      ch;

  ch = state.input.charCodeAt(state.position);

  if (ch === 0x5B/* [ */) {
    terminator = 0x5D;/* ] */
    isMapping = false;
    _result = [];
  } else if (ch === 0x7B/* { */) {
    terminator = 0x7D;/* } */
    isMapping = true;
    _result = {};
  } else {
    return false;
  }

  if (state.anchor !== null) {
    state.anchorMap[state.anchor] = _result;
  }

  ch = state.input.charCodeAt(++state.position);

  while (ch !== 0) {
    skipSeparationSpace(state, true, nodeIndent);

    ch = state.input.charCodeAt(state.position);

    if (ch === terminator) {
      state.position++;
      state.tag = _tag;
      state.anchor = _anchor;
      state.kind = isMapping ? 'mapping' : 'sequence';
      state.result = _result;
      return true;
    } else if (!readNext) {
      throwError(state, 'missed comma between flow collection entries');
    }

    keyTag = keyNode = valueNode = null;
    isPair = isExplicitPair = false;

    if (ch === 0x3F/* ? */) {
      following = state.input.charCodeAt(state.position + 1);

      if (is_WS_OR_EOL(following)) {
        isPair = isExplicitPair = true;
        state.position++;
        skipSeparationSpace(state, true, nodeIndent);
      }
    }

    _line = state.line;
    composeNode(state, nodeIndent, CONTEXT_FLOW_IN, false, true);
    keyTag = state.tag;
    keyNode = state.result;
    skipSeparationSpace(state, true, nodeIndent);

    ch = state.input.charCodeAt(state.position);

    if ((isExplicitPair || state.line === _line) && ch === 0x3A/* : */) {
      isPair = true;
      ch = state.input.charCodeAt(++state.position);
      skipSeparationSpace(state, true, nodeIndent);
      composeNode(state, nodeIndent, CONTEXT_FLOW_IN, false, true);
      valueNode = state.result;
    }

    if (isMapping) {
      storeMappingPair(state, _result, overridableKeys, keyTag, keyNode, valueNode);
    } else if (isPair) {
      _result.push(storeMappingPair(state, null, overridableKeys, keyTag, keyNode, valueNode));
    } else {
      _result.push(keyNode);
    }

    skipSeparationSpace(state, true, nodeIndent);

    ch = state.input.charCodeAt(state.position);

    if (ch === 0x2C/* , */) {
      readNext = true;
      ch = state.input.charCodeAt(++state.position);
    } else {
      readNext = false;
    }
  }

  throwError(state, 'unexpected end of the stream within a flow collection');
}

function readBlockScalar(state, nodeIndent) {
  var captureStart,
      folding,
      chomping       = CHOMPING_CLIP,
      didReadContent = false,
      detectedIndent = false,
      textIndent     = nodeIndent,
      emptyLines     = 0,
      atMoreIndented = false,
      tmp,
      ch;

  ch = state.input.charCodeAt(state.position);

  if (ch === 0x7C/* | */) {
    folding = false;
  } else if (ch === 0x3E/* > */) {
    folding = true;
  } else {
    return false;
  }

  state.kind = 'scalar';
  state.result = '';

  while (ch !== 0) {
    ch = state.input.charCodeAt(++state.position);

    if (ch === 0x2B/* + */ || ch === 0x2D/* - */) {
      if (CHOMPING_CLIP === chomping) {
        chomping = (ch === 0x2B/* + */) ? CHOMPING_KEEP : CHOMPING_STRIP;
      } else {
        throwError(state, 'repeat of a chomping mode identifier');
      }

    } else if ((tmp = fromDecimalCode(ch)) >= 0) {
      if (tmp === 0) {
        throwError(state, 'bad explicit indentation width of a block scalar; it cannot be less than one');
      } else if (!detectedIndent) {
        textIndent = nodeIndent + tmp - 1;
        detectedIndent = true;
      } else {
        throwError(state, 'repeat of an indentation width identifier');
      }

    } else {
      break;
    }
  }

  if (is_WHITE_SPACE(ch)) {
    do { ch = state.input.charCodeAt(++state.position); }
    while (is_WHITE_SPACE(ch));

    if (ch === 0x23/* # */) {
      do { ch = state.input.charCodeAt(++state.position); }
      while (!is_EOL(ch) && (ch !== 0));
    }
  }

  while (ch !== 0) {
    readLineBreak(state);
    state.lineIndent = 0;

    ch = state.input.charCodeAt(state.position);

    while ((!detectedIndent || state.lineIndent < textIndent) &&
           (ch === 0x20/* Space */)) {
      state.lineIndent++;
      ch = state.input.charCodeAt(++state.position);
    }

    if (!detectedIndent && state.lineIndent > textIndent) {
      textIndent = state.lineIndent;
    }

    if (is_EOL(ch)) {
      emptyLines++;
      continue;
    }

    // End of the scalar.
    if (state.lineIndent < textIndent) {

      // Perform the chomping.
      if (chomping === CHOMPING_KEEP) {
        state.result += common.repeat('\n', didReadContent ? 1 + emptyLines : emptyLines);
      } else if (chomping === CHOMPING_CLIP) {
        if (didReadContent) { // i.e. only if the scalar is not empty.
          state.result += '\n';
        }
      }

      // Break this `while` cycle and go to the funciton's epilogue.
      break;
    }

    // Folded style: use fancy rules to handle line breaks.
    if (folding) {

      // Lines starting with white space characters (more-indented lines) are not folded.
      if (is_WHITE_SPACE(ch)) {
        atMoreIndented = true;
        // except for the first content line (cf. Example 8.1)
        state.result += common.repeat('\n', didReadContent ? 1 + emptyLines : emptyLines);

      // End of more-indented block.
      } else if (atMoreIndented) {
        atMoreIndented = false;
        state.result += common.repeat('\n', emptyLines + 1);

      // Just one line break - perceive as the same line.
      } else if (emptyLines === 0) {
        if (didReadContent) { // i.e. only if we have already read some scalar content.
          state.result += ' ';
        }

      // Several line breaks - perceive as different lines.
      } else {
        state.result += common.repeat('\n', emptyLines);
      }

    // Literal style: just add exact number of line breaks between content lines.
    } else {
      // Keep all line breaks except the header line break.
      state.result += common.repeat('\n', didReadContent ? 1 + emptyLines : emptyLines);
    }

    didReadContent = true;
    detectedIndent = true;
    emptyLines = 0;
    captureStart = state.position;

    while (!is_EOL(ch) && (ch !== 0)) {
      ch = state.input.charCodeAt(++state.position);
    }

    captureSegment(state, captureStart, state.position, false);
  }

  return true;
}

function readBlockSequence(state, nodeIndent) {
  var _line,
      _tag      = state.tag,
      _anchor   = state.anchor,
      _result   = [],
      following,
      detected  = false,
      ch;

  if (state.anchor !== null) {
    state.anchorMap[state.anchor] = _result;
  }

  ch = state.input.charCodeAt(state.position);

  while (ch !== 0) {

    if (ch !== 0x2D/* - */) {
      break;
    }

    following = state.input.charCodeAt(state.position + 1);

    if (!is_WS_OR_EOL(following)) {
      break;
    }

    detected = true;
    state.position++;

    if (skipSeparationSpace(state, true, -1)) {
      if (state.lineIndent <= nodeIndent) {
        _result.push(null);
        ch = state.input.charCodeAt(state.position);
        continue;
      }
    }

    _line = state.line;
    composeNode(state, nodeIndent, CONTEXT_BLOCK_IN, false, true);
    _result.push(state.result);
    skipSeparationSpace(state, true, -1);

    ch = state.input.charCodeAt(state.position);

    if ((state.line === _line || state.lineIndent > nodeIndent) && (ch !== 0)) {
      throwError(state, 'bad indentation of a sequence entry');
    } else if (state.lineIndent < nodeIndent) {
      break;
    }
  }

  if (detected) {
    state.tag = _tag;
    state.anchor = _anchor;
    state.kind = 'sequence';
    state.result = _result;
    return true;
  }
  return false;
}

function readBlockMapping(state, nodeIndent, flowIndent) {
  var following,
      allowCompact,
      _line,
      _pos,
      _tag          = state.tag,
      _anchor       = state.anchor,
      _result       = {},
      overridableKeys = {},
      keyTag        = null,
      keyNode       = null,
      valueNode     = null,
      atExplicitKey = false,
      detected      = false,
      ch;

  if (state.anchor !== null) {
    state.anchorMap[state.anchor] = _result;
  }

  ch = state.input.charCodeAt(state.position);

  while (ch !== 0) {
    following = state.input.charCodeAt(state.position + 1);
    _line = state.line; // Save the current line.
    _pos = state.position;

    //
    // Explicit notation case. There are two separate blocks:
    // first for the key (denoted by "?") and second for the value (denoted by ":")
    //
    if ((ch === 0x3F/* ? */ || ch === 0x3A/* : */) && is_WS_OR_EOL(following)) {

      if (ch === 0x3F/* ? */) {
        if (atExplicitKey) {
          storeMappingPair(state, _result, overridableKeys, keyTag, keyNode, null);
          keyTag = keyNode = valueNode = null;
        }

        detected = true;
        atExplicitKey = true;
        allowCompact = true;

      } else if (atExplicitKey) {
        // i.e. 0x3A/* : */ === character after the explicit key.
        atExplicitKey = false;
        allowCompact = true;

      } else {
        throwError(state, 'incomplete explicit mapping pair; a key node is missed; or followed by a non-tabulated empty line');
      }

      state.position += 1;
      ch = following;

    //
    // Implicit notation case. Flow-style node as the key first, then ":", and the value.
    //
    } else if (composeNode(state, flowIndent, CONTEXT_FLOW_OUT, false, true)) {

      if (state.line === _line) {
        ch = state.input.charCodeAt(state.position);

        while (is_WHITE_SPACE(ch)) {
          ch = state.input.charCodeAt(++state.position);
        }

        if (ch === 0x3A/* : */) {
          ch = state.input.charCodeAt(++state.position);

          if (!is_WS_OR_EOL(ch)) {
            throwError(state, 'a whitespace character is expected after the key-value separator within a block mapping');
          }

          if (atExplicitKey) {
            storeMappingPair(state, _result, overridableKeys, keyTag, keyNode, null);
            keyTag = keyNode = valueNode = null;
          }

          detected = true;
          atExplicitKey = false;
          allowCompact = false;
          keyTag = state.tag;
          keyNode = state.result;

        } else if (detected) {
          throwError(state, 'can not read an implicit mapping pair; a colon is missed');

        } else {
          state.tag = _tag;
          state.anchor = _anchor;
          return true; // Keep the result of `composeNode`.
        }

      } else if (detected) {
        throwError(state, 'can not read a block mapping entry; a multiline key may not be an implicit key');

      } else {
        state.tag = _tag;
        state.anchor = _anchor;
        return true; // Keep the result of `composeNode`.
      }

    } else {
      break; // Reading is done. Go to the epilogue.
    }

    //
    // Common reading code for both explicit and implicit notations.
    //
    if (state.line === _line || state.lineIndent > nodeIndent) {
      if (composeNode(state, nodeIndent, CONTEXT_BLOCK_OUT, true, allowCompact)) {
        if (atExplicitKey) {
          keyNode = state.result;
        } else {
          valueNode = state.result;
        }
      }

      if (!atExplicitKey) {
        storeMappingPair(state, _result, overridableKeys, keyTag, keyNode, valueNode, _line, _pos);
        keyTag = keyNode = valueNode = null;
      }

      skipSeparationSpace(state, true, -1);
      ch = state.input.charCodeAt(state.position);
    }

    if (state.lineIndent > nodeIndent && (ch !== 0)) {
      throwError(state, 'bad indentation of a mapping entry');
    } else if (state.lineIndent < nodeIndent) {
      break;
    }
  }

  //
  // Epilogue.
  //

  // Special case: last mapping's node contains only the key in explicit notation.
  if (atExplicitKey) {
    storeMappingPair(state, _result, overridableKeys, keyTag, keyNode, null);
  }

  // Expose the resulting mapping.
  if (detected) {
    state.tag = _tag;
    state.anchor = _anchor;
    state.kind = 'mapping';
    state.result = _result;
  }

  return detected;
}

function readTagProperty(state) {
  var _position,
      isVerbatim = false,
      isNamed    = false,
      tagHandle,
      tagName,
      ch;

  ch = state.input.charCodeAt(state.position);

  if (ch !== 0x21/* ! */) return false;

  if (state.tag !== null) {
    throwError(state, 'duplication of a tag property');
  }

  ch = state.input.charCodeAt(++state.position);

  if (ch === 0x3C/* < */) {
    isVerbatim = true;
    ch = state.input.charCodeAt(++state.position);

  } else if (ch === 0x21/* ! */) {
    isNamed = true;
    tagHandle = '!!';
    ch = state.input.charCodeAt(++state.position);

  } else {
    tagHandle = '!';
  }

  _position = state.position;

  if (isVerbatim) {
    do { ch = state.input.charCodeAt(++state.position); }
    while (ch !== 0 && ch !== 0x3E/* > */);

    if (state.position < state.length) {
      tagName = state.input.slice(_position, state.position);
      ch = state.input.charCodeAt(++state.position);
    } else {
      throwError(state, 'unexpected end of the stream within a verbatim tag');
    }
  } else {
    while (ch !== 0 && !is_WS_OR_EOL(ch)) {

      if (ch === 0x21/* ! */) {
        if (!isNamed) {
          tagHandle = state.input.slice(_position - 1, state.position + 1);

          if (!PATTERN_TAG_HANDLE.test(tagHandle)) {
            throwError(state, 'named tag handle cannot contain such characters');
          }

          isNamed = true;
          _position = state.position + 1;
        } else {
          throwError(state, 'tag suffix cannot contain exclamation marks');
        }
      }

      ch = state.input.charCodeAt(++state.position);
    }

    tagName = state.input.slice(_position, state.position);

    if (PATTERN_FLOW_INDICATORS.test(tagName)) {
      throwError(state, 'tag suffix cannot contain flow indicator characters');
    }
  }

  if (tagName && !PATTERN_TAG_URI.test(tagName)) {
    throwError(state, 'tag name cannot contain such characters: ' + tagName);
  }

  if (isVerbatim) {
    state.tag = tagName;

  } else if (_hasOwnProperty$2.call(state.tagMap, tagHandle)) {
    state.tag = state.tagMap[tagHandle] + tagName;

  } else if (tagHandle === '!') {
    state.tag = '!' + tagName;

  } else if (tagHandle === '!!') {
    state.tag = 'tag:yaml.org,2002:' + tagName;

  } else {
    throwError(state, 'undeclared tag handle "' + tagHandle + '"');
  }

  return true;
}

function readAnchorProperty(state) {
  var _position,
      ch;

  ch = state.input.charCodeAt(state.position);

  if (ch !== 0x26/* & */) return false;

  if (state.anchor !== null) {
    throwError(state, 'duplication of an anchor property');
  }

  ch = state.input.charCodeAt(++state.position);
  _position = state.position;

  while (ch !== 0 && !is_WS_OR_EOL(ch) && !is_FLOW_INDICATOR(ch)) {
    ch = state.input.charCodeAt(++state.position);
  }

  if (state.position === _position) {
    throwError(state, 'name of an anchor node must contain at least one character');
  }

  state.anchor = state.input.slice(_position, state.position);
  return true;
}

function readAlias(state) {
  var _position, alias,
      ch;

  ch = state.input.charCodeAt(state.position);

  if (ch !== 0x2A/* * */) return false;

  ch = state.input.charCodeAt(++state.position);
  _position = state.position;

  while (ch !== 0 && !is_WS_OR_EOL(ch) && !is_FLOW_INDICATOR(ch)) {
    ch = state.input.charCodeAt(++state.position);
  }

  if (state.position === _position) {
    throwError(state, 'name of an alias node must contain at least one character');
  }

  alias = state.input.slice(_position, state.position);

  if (!state.anchorMap.hasOwnProperty(alias)) {
    throwError(state, 'unidentified alias "' + alias + '"');
  }

  state.result = state.anchorMap[alias];
  skipSeparationSpace(state, true, -1);
  return true;
}

function composeNode(state, parentIndent, nodeContext, allowToSeek, allowCompact) {
  var allowBlockStyles,
      allowBlockScalars,
      allowBlockCollections,
      indentStatus = 1, // 1: this>parent, 0: this=parent, -1: this<parent
      atNewLine  = false,
      hasContent = false,
      typeIndex,
      typeQuantity,
      type,
      flowIndent,
      blockIndent;

  if (state.listener !== null) {
    state.listener('open', state);
  }

  state.tag    = null;
  state.anchor = null;
  state.kind   = null;
  state.result = null;

  allowBlockStyles = allowBlockScalars = allowBlockCollections =
    CONTEXT_BLOCK_OUT === nodeContext ||
    CONTEXT_BLOCK_IN  === nodeContext;

  if (allowToSeek) {
    if (skipSeparationSpace(state, true, -1)) {
      atNewLine = true;

      if (state.lineIndent > parentIndent) {
        indentStatus = 1;
      } else if (state.lineIndent === parentIndent) {
        indentStatus = 0;
      } else if (state.lineIndent < parentIndent) {
        indentStatus = -1;
      }
    }
  }

  if (indentStatus === 1) {
    while (readTagProperty(state) || readAnchorProperty(state)) {
      if (skipSeparationSpace(state, true, -1)) {
        atNewLine = true;
        allowBlockCollections = allowBlockStyles;

        if (state.lineIndent > parentIndent) {
          indentStatus = 1;
        } else if (state.lineIndent === parentIndent) {
          indentStatus = 0;
        } else if (state.lineIndent < parentIndent) {
          indentStatus = -1;
        }
      } else {
        allowBlockCollections = false;
      }
    }
  }

  if (allowBlockCollections) {
    allowBlockCollections = atNewLine || allowCompact;
  }

  if (indentStatus === 1 || CONTEXT_BLOCK_OUT === nodeContext) {
    if (CONTEXT_FLOW_IN === nodeContext || CONTEXT_FLOW_OUT === nodeContext) {
      flowIndent = parentIndent;
    } else {
      flowIndent = parentIndent + 1;
    }

    blockIndent = state.position - state.lineStart;

    if (indentStatus === 1) {
      if (allowBlockCollections &&
          (readBlockSequence(state, blockIndent) ||
           readBlockMapping(state, blockIndent, flowIndent)) ||
          readFlowCollection(state, flowIndent)) {
        hasContent = true;
      } else {
        if ((allowBlockScalars && readBlockScalar(state, flowIndent)) ||
            readSingleQuotedScalar(state, flowIndent) ||
            readDoubleQuotedScalar(state, flowIndent)) {
          hasContent = true;

        } else if (readAlias(state)) {
          hasContent = true;

          if (state.tag !== null || state.anchor !== null) {
            throwError(state, 'alias node should not have any properties');
          }

        } else if (readPlainScalar(state, flowIndent, CONTEXT_FLOW_IN === nodeContext)) {
          hasContent = true;

          if (state.tag === null) {
            state.tag = '?';
          }
        }

        if (state.anchor !== null) {
          state.anchorMap[state.anchor] = state.result;
        }
      }
    } else if (indentStatus === 0) {
      // Special case: block sequences are allowed to have same indentation level as the parent.
      // http://www.yaml.org/spec/1.2/spec.html#id2799784
      hasContent = allowBlockCollections && readBlockSequence(state, blockIndent);
    }
  }

  if (state.tag !== null && state.tag !== '!') {
    if (state.tag === '?') {
      // Implicit resolving is not allowed for non-scalar types, and '?'
      // non-specific tag is only automatically assigned to plain scalars.
      //
      // We only need to check kind conformity in case user explicitly assigns '?'
      // tag, for example like this: "!<?> [0]"
      //
      if (state.result !== null && state.kind !== 'scalar') {
        throwError(state, 'unacceptable node kind for !<?> tag; it should be "scalar", not "' + state.kind + '"');
      }

      for (typeIndex = 0, typeQuantity = state.implicitTypes.length; typeIndex < typeQuantity; typeIndex += 1) {
        type = state.implicitTypes[typeIndex];

        if (type.resolve(state.result)) { // `state.result` updated in resolver if matched
          state.result = type.construct(state.result);
          state.tag = type.tag;
          if (state.anchor !== null) {
            state.anchorMap[state.anchor] = state.result;
          }
          break;
        }
      }
    } else if (_hasOwnProperty$2.call(state.typeMap[state.kind || 'fallback'], state.tag)) {
      type = state.typeMap[state.kind || 'fallback'][state.tag];

      if (state.result !== null && type.kind !== state.kind) {
        throwError(state, 'unacceptable node kind for !<' + state.tag + '> tag; it should be "' + type.kind + '", not "' + state.kind + '"');
      }

      if (!type.resolve(state.result)) { // `state.result` updated in resolver if matched
        throwError(state, 'cannot resolve a node with !<' + state.tag + '> explicit tag');
      } else {
        state.result = type.construct(state.result);
        if (state.anchor !== null) {
          state.anchorMap[state.anchor] = state.result;
        }
      }
    } else {
      throwError(state, 'unknown tag !<' + state.tag + '>');
    }
  }

  if (state.listener !== null) {
    state.listener('close', state);
  }
  return state.tag !== null ||  state.anchor !== null || hasContent;
}

function readDocument(state) {
  var documentStart = state.position,
      _position,
      directiveName,
      directiveArgs,
      hasDirectives = false,
      ch;

  state.version = null;
  state.checkLineBreaks = state.legacy;
  state.tagMap = {};
  state.anchorMap = {};

  while ((ch = state.input.charCodeAt(state.position)) !== 0) {
    skipSeparationSpace(state, true, -1);

    ch = state.input.charCodeAt(state.position);

    if (state.lineIndent > 0 || ch !== 0x25/* % */) {
      break;
    }

    hasDirectives = true;
    ch = state.input.charCodeAt(++state.position);
    _position = state.position;

    while (ch !== 0 && !is_WS_OR_EOL(ch)) {
      ch = state.input.charCodeAt(++state.position);
    }

    directiveName = state.input.slice(_position, state.position);
    directiveArgs = [];

    if (directiveName.length < 1) {
      throwError(state, 'directive name must not be less than one character in length');
    }

    while (ch !== 0) {
      while (is_WHITE_SPACE(ch)) {
        ch = state.input.charCodeAt(++state.position);
      }

      if (ch === 0x23/* # */) {
        do { ch = state.input.charCodeAt(++state.position); }
        while (ch !== 0 && !is_EOL(ch));
        break;
      }

      if (is_EOL(ch)) break;

      _position = state.position;

      while (ch !== 0 && !is_WS_OR_EOL(ch)) {
        ch = state.input.charCodeAt(++state.position);
      }

      directiveArgs.push(state.input.slice(_position, state.position));
    }

    if (ch !== 0) readLineBreak(state);

    if (_hasOwnProperty$2.call(directiveHandlers, directiveName)) {
      directiveHandlers[directiveName](state, directiveName, directiveArgs);
    } else {
      throwWarning(state, 'unknown document directive "' + directiveName + '"');
    }
  }

  skipSeparationSpace(state, true, -1);

  if (state.lineIndent === 0 &&
      state.input.charCodeAt(state.position)     === 0x2D/* - */ &&
      state.input.charCodeAt(state.position + 1) === 0x2D/* - */ &&
      state.input.charCodeAt(state.position + 2) === 0x2D/* - */) {
    state.position += 3;
    skipSeparationSpace(state, true, -1);

  } else if (hasDirectives) {
    throwError(state, 'directives end mark is expected');
  }

  composeNode(state, state.lineIndent - 1, CONTEXT_BLOCK_OUT, false, true);
  skipSeparationSpace(state, true, -1);

  if (state.checkLineBreaks &&
      PATTERN_NON_ASCII_LINE_BREAKS.test(state.input.slice(documentStart, state.position))) {
    throwWarning(state, 'non-ASCII line breaks are interpreted as content');
  }

  state.documents.push(state.result);

  if (state.position === state.lineStart && testDocumentSeparator(state)) {

    if (state.input.charCodeAt(state.position) === 0x2E/* . */) {
      state.position += 3;
      skipSeparationSpace(state, true, -1);
    }
    return;
  }

  if (state.position < (state.length - 1)) {
    throwError(state, 'end of the stream or a document separator is expected');
  } else {
    return;
  }
}


function loadDocuments(input, options) {
  input = String(input);
  options = options || {};

  if (input.length !== 0) {

    // Add tailing `\n` if not exists
    if (input.charCodeAt(input.length - 1) !== 0x0A/* LF */ &&
        input.charCodeAt(input.length - 1) !== 0x0D/* CR */) {
      input += '\n';
    }

    // Strip BOM
    if (input.charCodeAt(0) === 0xFEFF) {
      input = input.slice(1);
    }
  }

  var state = new State(input, options);

  var nullpos = input.indexOf('\0');

  if (nullpos !== -1) {
    state.position = nullpos;
    throwError(state, 'null byte is not allowed in input');
  }

  // Use 0 as string terminator. That significantly simplifies bounds check.
  state.input += '\0';

  while (state.input.charCodeAt(state.position) === 0x20/* Space */) {
    state.lineIndent += 1;
    state.position += 1;
  }

  while (state.position < (state.length - 1)) {
    readDocument(state);
  }

  return state.documents;
}


function loadAll(input, iterator, options) {
  if (iterator !== null && typeof iterator === 'object' && typeof options === 'undefined') {
    options = iterator;
    iterator = null;
  }

  var documents = loadDocuments(input, options);

  if (typeof iterator !== 'function') {
    return documents;
  }

  for (var index = 0, length = documents.length; index < length; index += 1) {
    iterator(documents[index]);
  }
}


function load(input, options) {
  var documents = loadDocuments(input, options);

  if (documents.length === 0) {
    /*eslint-disable no-undefined*/
    return undefined;
  } else if (documents.length === 1) {
    return documents[0];
  }
  throw new exception('expected a single document in the stream, but found more');
}


function safeLoadAll(input, iterator, options) {
  if (typeof iterator === 'object' && iterator !== null && typeof options === 'undefined') {
    options = iterator;
    iterator = null;
  }

  return loadAll(input, iterator, common.extend({ schema: default_safe }, options));
}


function safeLoad(input, options) {
  return load(input, common.extend({ schema: default_safe }, options));
}


var loadAll_1     = loadAll;
var load_1        = load;
var safeLoadAll_1 = safeLoadAll;
var safeLoad_1    = safeLoad;

var loader = {
	loadAll: loadAll_1,
	load: load_1,
	safeLoadAll: safeLoadAll_1,
	safeLoad: safeLoad_1
};

/*eslint-disable no-use-before-define*/






var _toString$2       = Object.prototype.toString;
var _hasOwnProperty$3 = Object.prototype.hasOwnProperty;

var CHAR_TAB                  = 0x09; /* Tab */
var CHAR_LINE_FEED            = 0x0A; /* LF */
var CHAR_CARRIAGE_RETURN      = 0x0D; /* CR */
var CHAR_SPACE                = 0x20; /* Space */
var CHAR_EXCLAMATION          = 0x21; /* ! */
var CHAR_DOUBLE_QUOTE         = 0x22; /* " */
var CHAR_SHARP                = 0x23; /* # */
var CHAR_PERCENT              = 0x25; /* % */
var CHAR_AMPERSAND            = 0x26; /* & */
var CHAR_SINGLE_QUOTE         = 0x27; /* ' */
var CHAR_ASTERISK             = 0x2A; /* * */
var CHAR_COMMA                = 0x2C; /* , */
var CHAR_MINUS                = 0x2D; /* - */
var CHAR_COLON                = 0x3A; /* : */
var CHAR_EQUALS               = 0x3D; /* = */
var CHAR_GREATER_THAN         = 0x3E; /* > */
var CHAR_QUESTION             = 0x3F; /* ? */
var CHAR_COMMERCIAL_AT        = 0x40; /* @ */
var CHAR_LEFT_SQUARE_BRACKET  = 0x5B; /* [ */
var CHAR_RIGHT_SQUARE_BRACKET = 0x5D; /* ] */
var CHAR_GRAVE_ACCENT         = 0x60; /* ` */
var CHAR_LEFT_CURLY_BRACKET   = 0x7B; /* { */
var CHAR_VERTICAL_LINE        = 0x7C; /* | */
var CHAR_RIGHT_CURLY_BRACKET  = 0x7D; /* } */

var ESCAPE_SEQUENCES = {};

ESCAPE_SEQUENCES[0x00]   = '\\0';
ESCAPE_SEQUENCES[0x07]   = '\\a';
ESCAPE_SEQUENCES[0x08]   = '\\b';
ESCAPE_SEQUENCES[0x09]   = '\\t';
ESCAPE_SEQUENCES[0x0A]   = '\\n';
ESCAPE_SEQUENCES[0x0B]   = '\\v';
ESCAPE_SEQUENCES[0x0C]   = '\\f';
ESCAPE_SEQUENCES[0x0D]   = '\\r';
ESCAPE_SEQUENCES[0x1B]   = '\\e';
ESCAPE_SEQUENCES[0x22]   = '\\"';
ESCAPE_SEQUENCES[0x5C]   = '\\\\';
ESCAPE_SEQUENCES[0x85]   = '\\N';
ESCAPE_SEQUENCES[0xA0]   = '\\_';
ESCAPE_SEQUENCES[0x2028] = '\\L';
ESCAPE_SEQUENCES[0x2029] = '\\P';

var DEPRECATED_BOOLEANS_SYNTAX = [
  'y', 'Y', 'yes', 'Yes', 'YES', 'on', 'On', 'ON',
  'n', 'N', 'no', 'No', 'NO', 'off', 'Off', 'OFF'
];

function compileStyleMap(schema, map) {
  var result, keys, index, length, tag, style, type;

  if (map === null) return {};

  result = {};
  keys = Object.keys(map);

  for (index = 0, length = keys.length; index < length; index += 1) {
    tag = keys[index];
    style = String(map[tag]);

    if (tag.slice(0, 2) === '!!') {
      tag = 'tag:yaml.org,2002:' + tag.slice(2);
    }
    type = schema.compiledTypeMap['fallback'][tag];

    if (type && _hasOwnProperty$3.call(type.styleAliases, style)) {
      style = type.styleAliases[style];
    }

    result[tag] = style;
  }

  return result;
}

function encodeHex(character) {
  var string, handle, length;

  string = character.toString(16).toUpperCase();

  if (character <= 0xFF) {
    handle = 'x';
    length = 2;
  } else if (character <= 0xFFFF) {
    handle = 'u';
    length = 4;
  } else if (character <= 0xFFFFFFFF) {
    handle = 'U';
    length = 8;
  } else {
    throw new exception('code point within a string may not be greater than 0xFFFFFFFF');
  }

  return '\\' + handle + common.repeat('0', length - string.length) + string;
}

function State$1(options) {
  this.schema        = options['schema'] || default_full;
  this.indent        = Math.max(1, (options['indent'] || 2));
  this.noArrayIndent = options['noArrayIndent'] || false;
  this.skipInvalid   = options['skipInvalid'] || false;
  this.flowLevel     = (common.isNothing(options['flowLevel']) ? -1 : options['flowLevel']);
  this.styleMap      = compileStyleMap(this.schema, options['styles'] || null);
  this.sortKeys      = options['sortKeys'] || false;
  this.lineWidth     = options['lineWidth'] || 80;
  this.noRefs        = options['noRefs'] || false;
  this.noCompatMode  = options['noCompatMode'] || false;
  this.condenseFlow  = options['condenseFlow'] || false;

  this.implicitTypes = this.schema.compiledImplicit;
  this.explicitTypes = this.schema.compiledExplicit;

  this.tag = null;
  this.result = '';

  this.duplicates = [];
  this.usedDuplicates = null;
}

// Indents every line in a string. Empty lines (\n only) are not indented.
function indentString(string, spaces) {
  var ind = common.repeat(' ', spaces),
      position = 0,
      next = -1,
      result = '',
      line,
      length = string.length;

  while (position < length) {
    next = string.indexOf('\n', position);
    if (next === -1) {
      line = string.slice(position);
      position = length;
    } else {
      line = string.slice(position, next + 1);
      position = next + 1;
    }

    if (line.length && line !== '\n') result += ind;

    result += line;
  }

  return result;
}

function generateNextLine(state, level) {
  return '\n' + common.repeat(' ', state.indent * level);
}

function testImplicitResolving(state, str) {
  var index, length, type;

  for (index = 0, length = state.implicitTypes.length; index < length; index += 1) {
    type = state.implicitTypes[index];

    if (type.resolve(str)) {
      return true;
    }
  }

  return false;
}

// [33] s-white ::= s-space | s-tab
function isWhitespace(c) {
  return c === CHAR_SPACE || c === CHAR_TAB;
}

// Returns true if the character can be printed without escaping.
// From YAML 1.2: "any allowed characters known to be non-printable
// should also be escaped. [However,] This isn’t mandatory"
// Derived from nb-char - \t - #x85 - #xA0 - #x2028 - #x2029.
function isPrintable(c) {
  return  (0x00020 <= c && c <= 0x00007E)
      || ((0x000A1 <= c && c <= 0x00D7FF) && c !== 0x2028 && c !== 0x2029)
      || ((0x0E000 <= c && c <= 0x00FFFD) && c !== 0xFEFF /* BOM */)
      ||  (0x10000 <= c && c <= 0x10FFFF);
}

// [34] ns-char ::= nb-char - s-white
// [27] nb-char ::= c-printable - b-char - c-byte-order-mark
// [26] b-char  ::= b-line-feed | b-carriage-return
// [24] b-line-feed       ::=     #xA    /* LF */
// [25] b-carriage-return ::=     #xD    /* CR */
// [3]  c-byte-order-mark ::=     #xFEFF
function isNsChar(c) {
  return isPrintable(c) && !isWhitespace(c)
    // byte-order-mark
    && c !== 0xFEFF
    // b-char
    && c !== CHAR_CARRIAGE_RETURN
    && c !== CHAR_LINE_FEED;
}

// Simplified test for values allowed after the first character in plain style.
function isPlainSafe(c, prev) {
  // Uses a subset of nb-char - c-flow-indicator - ":" - "#"
  // where nb-char ::= c-printable - b-char - c-byte-order-mark.
  return isPrintable(c) && c !== 0xFEFF
    // - c-flow-indicator
    && c !== CHAR_COMMA
    && c !== CHAR_LEFT_SQUARE_BRACKET
    && c !== CHAR_RIGHT_SQUARE_BRACKET
    && c !== CHAR_LEFT_CURLY_BRACKET
    && c !== CHAR_RIGHT_CURLY_BRACKET
    // - ":" - "#"
    // /* An ns-char preceding */ "#"
    && c !== CHAR_COLON
    && ((c !== CHAR_SHARP) || (prev && isNsChar(prev)));
}

// Simplified test for values allowed as the first character in plain style.
function isPlainSafeFirst(c) {
  // Uses a subset of ns-char - c-indicator
  // where ns-char = nb-char - s-white.
  return isPrintable(c) && c !== 0xFEFF
    && !isWhitespace(c) // - s-white
    // - (c-indicator ::=
    // “-” | “?” | “:” | “,” | “[” | “]” | “{” | “}”
    && c !== CHAR_MINUS
    && c !== CHAR_QUESTION
    && c !== CHAR_COLON
    && c !== CHAR_COMMA
    && c !== CHAR_LEFT_SQUARE_BRACKET
    && c !== CHAR_RIGHT_SQUARE_BRACKET
    && c !== CHAR_LEFT_CURLY_BRACKET
    && c !== CHAR_RIGHT_CURLY_BRACKET
    // | “#” | “&” | “*” | “!” | “|” | “=” | “>” | “'” | “"”
    && c !== CHAR_SHARP
    && c !== CHAR_AMPERSAND
    && c !== CHAR_ASTERISK
    && c !== CHAR_EXCLAMATION
    && c !== CHAR_VERTICAL_LINE
    && c !== CHAR_EQUALS
    && c !== CHAR_GREATER_THAN
    && c !== CHAR_SINGLE_QUOTE
    && c !== CHAR_DOUBLE_QUOTE
    // | “%” | “@” | “`”)
    && c !== CHAR_PERCENT
    && c !== CHAR_COMMERCIAL_AT
    && c !== CHAR_GRAVE_ACCENT;
}

// Determines whether block indentation indicator is required.
function needIndentIndicator(string) {
  var leadingSpaceRe = /^\n* /;
  return leadingSpaceRe.test(string);
}

var STYLE_PLAIN   = 1,
    STYLE_SINGLE  = 2,
    STYLE_LITERAL = 3,
    STYLE_FOLDED  = 4,
    STYLE_DOUBLE  = 5;

// Determines which scalar styles are possible and returns the preferred style.
// lineWidth = -1 => no limit.
// Pre-conditions: str.length > 0.
// Post-conditions:
//    STYLE_PLAIN or STYLE_SINGLE => no \n are in the string.
//    STYLE_LITERAL => no lines are suitable for folding (or lineWidth is -1).
//    STYLE_FOLDED => a line > lineWidth and can be folded (and lineWidth != -1).
function chooseScalarStyle(string, singleLineOnly, indentPerLevel, lineWidth, testAmbiguousType) {
  var i;
  var char, prev_char;
  var hasLineBreak = false;
  var hasFoldableLine = false; // only checked if shouldTrackWidth
  var shouldTrackWidth = lineWidth !== -1;
  var previousLineBreak = -1; // count the first line correctly
  var plain = isPlainSafeFirst(string.charCodeAt(0))
          && !isWhitespace(string.charCodeAt(string.length - 1));

  if (singleLineOnly) {
    // Case: no block styles.
    // Check for disallowed characters to rule out plain and single.
    for (i = 0; i < string.length; i++) {
      char = string.charCodeAt(i);
      if (!isPrintable(char)) {
        return STYLE_DOUBLE;
      }
      prev_char = i > 0 ? string.charCodeAt(i - 1) : null;
      plain = plain && isPlainSafe(char, prev_char);
    }
  } else {
    // Case: block styles permitted.
    for (i = 0; i < string.length; i++) {
      char = string.charCodeAt(i);
      if (char === CHAR_LINE_FEED) {
        hasLineBreak = true;
        // Check if any line can be folded.
        if (shouldTrackWidth) {
          hasFoldableLine = hasFoldableLine ||
            // Foldable line = too long, and not more-indented.
            (i - previousLineBreak - 1 > lineWidth &&
             string[previousLineBreak + 1] !== ' ');
          previousLineBreak = i;
        }
      } else if (!isPrintable(char)) {
        return STYLE_DOUBLE;
      }
      prev_char = i > 0 ? string.charCodeAt(i - 1) : null;
      plain = plain && isPlainSafe(char, prev_char);
    }
    // in case the end is missing a \n
    hasFoldableLine = hasFoldableLine || (shouldTrackWidth &&
      (i - previousLineBreak - 1 > lineWidth &&
       string[previousLineBreak + 1] !== ' '));
  }
  // Although every style can represent \n without escaping, prefer block styles
  // for multiline, since they're more readable and they don't add empty lines.
  // Also prefer folding a super-long line.
  if (!hasLineBreak && !hasFoldableLine) {
    // Strings interpretable as another type have to be quoted;
    // e.g. the string 'true' vs. the boolean true.
    return plain && !testAmbiguousType(string)
      ? STYLE_PLAIN : STYLE_SINGLE;
  }
  // Edge case: block indentation indicator can only have one digit.
  if (indentPerLevel > 9 && needIndentIndicator(string)) {
    return STYLE_DOUBLE;
  }
  // At this point we know block styles are valid.
  // Prefer literal style unless we want to fold.
  return hasFoldableLine ? STYLE_FOLDED : STYLE_LITERAL;
}

// Note: line breaking/folding is implemented for only the folded style.
// NB. We drop the last trailing newline (if any) of a returned block scalar
//  since the dumper adds its own newline. This always works:
//    • No ending newline => unaffected; already using strip "-" chomping.
//    • Ending newline    => removed then restored.
//  Importantly, this keeps the "+" chomp indicator from gaining an extra line.
function writeScalar(state, string, level, iskey) {
  state.dump = (function () {
    if (string.length === 0) {
      return "''";
    }
    if (!state.noCompatMode &&
        DEPRECATED_BOOLEANS_SYNTAX.indexOf(string) !== -1) {
      return "'" + string + "'";
    }

    var indent = state.indent * Math.max(1, level); // no 0-indent scalars
    // As indentation gets deeper, let the width decrease monotonically
    // to the lower bound min(state.lineWidth, 40).
    // Note that this implies
    //  state.lineWidth ≤ 40 + state.indent: width is fixed at the lower bound.
    //  state.lineWidth > 40 + state.indent: width decreases until the lower bound.
    // This behaves better than a constant minimum width which disallows narrower options,
    // or an indent threshold which causes the width to suddenly increase.
    var lineWidth = state.lineWidth === -1
      ? -1 : Math.max(Math.min(state.lineWidth, 40), state.lineWidth - indent);

    // Without knowing if keys are implicit/explicit, assume implicit for safety.
    var singleLineOnly = iskey
      // No block styles in flow mode.
      || (state.flowLevel > -1 && level >= state.flowLevel);
    function testAmbiguity(string) {
      return testImplicitResolving(state, string);
    }

    switch (chooseScalarStyle(string, singleLineOnly, state.indent, lineWidth, testAmbiguity)) {
      case STYLE_PLAIN:
        return string;
      case STYLE_SINGLE:
        return "'" + string.replace(/'/g, "''") + "'";
      case STYLE_LITERAL:
        return '|' + blockHeader(string, state.indent)
          + dropEndingNewline(indentString(string, indent));
      case STYLE_FOLDED:
        return '>' + blockHeader(string, state.indent)
          + dropEndingNewline(indentString(foldString(string, lineWidth), indent));
      case STYLE_DOUBLE:
        return '"' + escapeString(string) + '"';
      default:
        throw new exception('impossible error: invalid scalar style');
    }
  }());
}

// Pre-conditions: string is valid for a block scalar, 1 <= indentPerLevel <= 9.
function blockHeader(string, indentPerLevel) {
  var indentIndicator = needIndentIndicator(string) ? String(indentPerLevel) : '';

  // note the special case: the string '\n' counts as a "trailing" empty line.
  var clip =          string[string.length - 1] === '\n';
  var keep = clip && (string[string.length - 2] === '\n' || string === '\n');
  var chomp = keep ? '+' : (clip ? '' : '-');

  return indentIndicator + chomp + '\n';
}

// (See the note for writeScalar.)
function dropEndingNewline(string) {
  return string[string.length - 1] === '\n' ? string.slice(0, -1) : string;
}

// Note: a long line without a suitable break point will exceed the width limit.
// Pre-conditions: every char in str isPrintable, str.length > 0, width > 0.
function foldString(string, width) {
  // In folded style, $k$ consecutive newlines output as $k+1$ newlines—
  // unless they're before or after a more-indented line, or at the very
  // beginning or end, in which case $k$ maps to $k$.
  // Therefore, parse each chunk as newline(s) followed by a content line.
  var lineRe = /(\n+)([^\n]*)/g;

  // first line (possibly an empty line)
  var result = (function () {
    var nextLF = string.indexOf('\n');
    nextLF = nextLF !== -1 ? nextLF : string.length;
    lineRe.lastIndex = nextLF;
    return foldLine(string.slice(0, nextLF), width);
  }());
  // If we haven't reached the first content line yet, don't add an extra \n.
  var prevMoreIndented = string[0] === '\n' || string[0] === ' ';
  var moreIndented;

  // rest of the lines
  var match;
  while ((match = lineRe.exec(string))) {
    var prefix = match[1], line = match[2];
    moreIndented = (line[0] === ' ');
    result += prefix
      + (!prevMoreIndented && !moreIndented && line !== ''
        ? '\n' : '')
      + foldLine(line, width);
    prevMoreIndented = moreIndented;
  }

  return result;
}

// Greedy line breaking.
// Picks the longest line under the limit each time,
// otherwise settles for the shortest line over the limit.
// NB. More-indented lines *cannot* be folded, as that would add an extra \n.
function foldLine(line, width) {
  if (line === '' || line[0] === ' ') return line;

  // Since a more-indented line adds a \n, breaks can't be followed by a space.
  var breakRe = / [^ ]/g; // note: the match index will always be <= length-2.
  var match;
  // start is an inclusive index. end, curr, and next are exclusive.
  var start = 0, end, curr = 0, next = 0;
  var result = '';

  // Invariants: 0 <= start <= length-1.
  //   0 <= curr <= next <= max(0, length-2). curr - start <= width.
  // Inside the loop:
  //   A match implies length >= 2, so curr and next are <= length-2.
  while ((match = breakRe.exec(line))) {
    next = match.index;
    // maintain invariant: curr - start <= width
    if (next - start > width) {
      end = (curr > start) ? curr : next; // derive end <= length-2
      result += '\n' + line.slice(start, end);
      // skip the space that was output as \n
      start = end + 1;                    // derive start <= length-1
    }
    curr = next;
  }

  // By the invariants, start <= length-1, so there is something left over.
  // It is either the whole string or a part starting from non-whitespace.
  result += '\n';
  // Insert a break if the remainder is too long and there is a break available.
  if (line.length - start > width && curr > start) {
    result += line.slice(start, curr) + '\n' + line.slice(curr + 1);
  } else {
    result += line.slice(start);
  }

  return result.slice(1); // drop extra \n joiner
}

// Escapes a double-quoted string.
function escapeString(string) {
  var result = '';
  var char, nextChar;
  var escapeSeq;

  for (var i = 0; i < string.length; i++) {
    char = string.charCodeAt(i);
    // Check for surrogate pairs (reference Unicode 3.0 section "3.7 Surrogates").
    if (char >= 0xD800 && char <= 0xDBFF/* high surrogate */) {
      nextChar = string.charCodeAt(i + 1);
      if (nextChar >= 0xDC00 && nextChar <= 0xDFFF/* low surrogate */) {
        // Combine the surrogate pair and store it escaped.
        result += encodeHex((char - 0xD800) * 0x400 + nextChar - 0xDC00 + 0x10000);
        // Advance index one extra since we already used that char here.
        i++; continue;
      }
    }
    escapeSeq = ESCAPE_SEQUENCES[char];
    result += !escapeSeq && isPrintable(char)
      ? string[i]
      : escapeSeq || encodeHex(char);
  }

  return result;
}

function writeFlowSequence(state, level, object) {
  var _result = '',
      _tag    = state.tag,
      index,
      length;

  for (index = 0, length = object.length; index < length; index += 1) {
    // Write only valid elements.
    if (writeNode(state, level, object[index], false, false)) {
      if (index !== 0) _result += ',' + (!state.condenseFlow ? ' ' : '');
      _result += state.dump;
    }
  }

  state.tag = _tag;
  state.dump = '[' + _result + ']';
}

function writeBlockSequence(state, level, object, compact) {
  var _result = '',
      _tag    = state.tag,
      index,
      length;

  for (index = 0, length = object.length; index < length; index += 1) {
    // Write only valid elements.
    if (writeNode(state, level + 1, object[index], true, true)) {
      if (!compact || index !== 0) {
        _result += generateNextLine(state, level);
      }

      if (state.dump && CHAR_LINE_FEED === state.dump.charCodeAt(0)) {
        _result += '-';
      } else {
        _result += '- ';
      }

      _result += state.dump;
    }
  }

  state.tag = _tag;
  state.dump = _result || '[]'; // Empty sequence if no valid values.
}

function writeFlowMapping(state, level, object) {
  var _result       = '',
      _tag          = state.tag,
      objectKeyList = Object.keys(object),
      index,
      length,
      objectKey,
      objectValue,
      pairBuffer;

  for (index = 0, length = objectKeyList.length; index < length; index += 1) {

    pairBuffer = '';
    if (index !== 0) pairBuffer += ', ';

    if (state.condenseFlow) pairBuffer += '"';

    objectKey = objectKeyList[index];
    objectValue = object[objectKey];

    if (!writeNode(state, level, objectKey, false, false)) {
      continue; // Skip this pair because of invalid key;
    }

    if (state.dump.length > 1024) pairBuffer += '? ';

    pairBuffer += state.dump + (state.condenseFlow ? '"' : '') + ':' + (state.condenseFlow ? '' : ' ');

    if (!writeNode(state, level, objectValue, false, false)) {
      continue; // Skip this pair because of invalid value.
    }

    pairBuffer += state.dump;

    // Both key and value are valid.
    _result += pairBuffer;
  }

  state.tag = _tag;
  state.dump = '{' + _result + '}';
}

function writeBlockMapping(state, level, object, compact) {
  var _result       = '',
      _tag          = state.tag,
      objectKeyList = Object.keys(object),
      index,
      length,
      objectKey,
      objectValue,
      explicitPair,
      pairBuffer;

  // Allow sorting keys so that the output file is deterministic
  if (state.sortKeys === true) {
    // Default sorting
    objectKeyList.sort();
  } else if (typeof state.sortKeys === 'function') {
    // Custom sort function
    objectKeyList.sort(state.sortKeys);
  } else if (state.sortKeys) {
    // Something is wrong
    throw new exception('sortKeys must be a boolean or a function');
  }

  for (index = 0, length = objectKeyList.length; index < length; index += 1) {
    pairBuffer = '';

    if (!compact || index !== 0) {
      pairBuffer += generateNextLine(state, level);
    }

    objectKey = objectKeyList[index];
    objectValue = object[objectKey];

    if (!writeNode(state, level + 1, objectKey, true, true, true)) {
      continue; // Skip this pair because of invalid key.
    }

    explicitPair = (state.tag !== null && state.tag !== '?') ||
                   (state.dump && state.dump.length > 1024);

    if (explicitPair) {
      if (state.dump && CHAR_LINE_FEED === state.dump.charCodeAt(0)) {
        pairBuffer += '?';
      } else {
        pairBuffer += '? ';
      }
    }

    pairBuffer += state.dump;

    if (explicitPair) {
      pairBuffer += generateNextLine(state, level);
    }

    if (!writeNode(state, level + 1, objectValue, true, explicitPair)) {
      continue; // Skip this pair because of invalid value.
    }

    if (state.dump && CHAR_LINE_FEED === state.dump.charCodeAt(0)) {
      pairBuffer += ':';
    } else {
      pairBuffer += ': ';
    }

    pairBuffer += state.dump;

    // Both key and value are valid.
    _result += pairBuffer;
  }

  state.tag = _tag;
  state.dump = _result || '{}'; // Empty mapping if no valid pairs.
}

function detectType(state, object, explicit) {
  var _result, typeList, index, length, type, style;

  typeList = explicit ? state.explicitTypes : state.implicitTypes;

  for (index = 0, length = typeList.length; index < length; index += 1) {
    type = typeList[index];

    if ((type.instanceOf  || type.predicate) &&
        (!type.instanceOf || ((typeof object === 'object') && (object instanceof type.instanceOf))) &&
        (!type.predicate  || type.predicate(object))) {

      state.tag = explicit ? type.tag : '?';

      if (type.represent) {
        style = state.styleMap[type.tag] || type.defaultStyle;

        if (_toString$2.call(type.represent) === '[object Function]') {
          _result = type.represent(object, style);
        } else if (_hasOwnProperty$3.call(type.represent, style)) {
          _result = type.represent[style](object, style);
        } else {
          throw new exception('!<' + type.tag + '> tag resolver accepts not "' + style + '" style');
        }

        state.dump = _result;
      }

      return true;
    }
  }

  return false;
}

// Serializes `object` and writes it to global `result`.
// Returns true on success, or false on invalid object.
//
function writeNode(state, level, object, block, compact, iskey) {
  state.tag = null;
  state.dump = object;

  if (!detectType(state, object, false)) {
    detectType(state, object, true);
  }

  var type = _toString$2.call(state.dump);

  if (block) {
    block = (state.flowLevel < 0 || state.flowLevel > level);
  }

  var objectOrArray = type === '[object Object]' || type === '[object Array]',
      duplicateIndex,
      duplicate;

  if (objectOrArray) {
    duplicateIndex = state.duplicates.indexOf(object);
    duplicate = duplicateIndex !== -1;
  }

  if ((state.tag !== null && state.tag !== '?') || duplicate || (state.indent !== 2 && level > 0)) {
    compact = false;
  }

  if (duplicate && state.usedDuplicates[duplicateIndex]) {
    state.dump = '*ref_' + duplicateIndex;
  } else {
    if (objectOrArray && duplicate && !state.usedDuplicates[duplicateIndex]) {
      state.usedDuplicates[duplicateIndex] = true;
    }
    if (type === '[object Object]') {
      if (block && (Object.keys(state.dump).length !== 0)) {
        writeBlockMapping(state, level, state.dump, compact);
        if (duplicate) {
          state.dump = '&ref_' + duplicateIndex + state.dump;
        }
      } else {
        writeFlowMapping(state, level, state.dump);
        if (duplicate) {
          state.dump = '&ref_' + duplicateIndex + ' ' + state.dump;
        }
      }
    } else if (type === '[object Array]') {
      var arrayLevel = (state.noArrayIndent && (level > 0)) ? level - 1 : level;
      if (block && (state.dump.length !== 0)) {
        writeBlockSequence(state, arrayLevel, state.dump, compact);
        if (duplicate) {
          state.dump = '&ref_' + duplicateIndex + state.dump;
        }
      } else {
        writeFlowSequence(state, arrayLevel, state.dump);
        if (duplicate) {
          state.dump = '&ref_' + duplicateIndex + ' ' + state.dump;
        }
      }
    } else if (type === '[object String]') {
      if (state.tag !== '?') {
        writeScalar(state, state.dump, level, iskey);
      }
    } else {
      if (state.skipInvalid) return false;
      throw new exception('unacceptable kind of an object to dump ' + type);
    }

    if (state.tag !== null && state.tag !== '?') {
      state.dump = '!<' + state.tag + '> ' + state.dump;
    }
  }

  return true;
}

function getDuplicateReferences(object, state) {
  var objects = [],
      duplicatesIndexes = [],
      index,
      length;

  inspectNode(object, objects, duplicatesIndexes);

  for (index = 0, length = duplicatesIndexes.length; index < length; index += 1) {
    state.duplicates.push(objects[duplicatesIndexes[index]]);
  }
  state.usedDuplicates = new Array(length);
}

function inspectNode(object, objects, duplicatesIndexes) {
  var objectKeyList,
      index,
      length;

  if (object !== null && typeof object === 'object') {
    index = objects.indexOf(object);
    if (index !== -1) {
      if (duplicatesIndexes.indexOf(index) === -1) {
        duplicatesIndexes.push(index);
      }
    } else {
      objects.push(object);

      if (Array.isArray(object)) {
        for (index = 0, length = object.length; index < length; index += 1) {
          inspectNode(object[index], objects, duplicatesIndexes);
        }
      } else {
        objectKeyList = Object.keys(object);

        for (index = 0, length = objectKeyList.length; index < length; index += 1) {
          inspectNode(object[objectKeyList[index]], objects, duplicatesIndexes);
        }
      }
    }
  }
}

function dump(input, options) {
  options = options || {};

  var state = new State$1(options);

  if (!state.noRefs) getDuplicateReferences(input, state);

  if (writeNode(state, 0, input, true, true)) return state.dump + '\n';

  return '';
}

function safeDump(input, options) {
  return dump(input, common.extend({ schema: default_safe }, options));
}

var dump_1     = dump;
var safeDump_1 = safeDump;

var dumper = {
	dump: dump_1,
	safeDump: safeDump_1
};

function deprecated(name) {
  return function () {
    throw new Error('Function ' + name + ' is deprecated and cannot be used.');
  };
}


var Type$1                = type;
var Schema$1              = schema;
var FAILSAFE_SCHEMA     = failsafe;
var JSON_SCHEMA         = json;
var CORE_SCHEMA         = core;
var DEFAULT_SAFE_SCHEMA = default_safe;
var DEFAULT_FULL_SCHEMA = default_full;
var load$1                = loader.load;
var loadAll$1             = loader.loadAll;
var safeLoad$1            = loader.safeLoad;
var safeLoadAll$1         = loader.safeLoadAll;
var dump$1                = dumper.dump;
var safeDump$1            = dumper.safeDump;
var YAMLException$1       = exception;

// Deprecated schema names from JS-YAML 2.0.x
var MINIMAL_SCHEMA = failsafe;
var SAFE_SCHEMA    = default_safe;
var DEFAULT_SCHEMA = default_full;

// Deprecated functions from JS-YAML 1.x.x
var scan           = deprecated('scan');
var parse          = deprecated('parse');
var compose        = deprecated('compose');
var addConstructor = deprecated('addConstructor');

var jsYaml = {
	Type: Type$1,
	Schema: Schema$1,
	FAILSAFE_SCHEMA: FAILSAFE_SCHEMA,
	JSON_SCHEMA: JSON_SCHEMA,
	CORE_SCHEMA: CORE_SCHEMA,
	DEFAULT_SAFE_SCHEMA: DEFAULT_SAFE_SCHEMA,
	DEFAULT_FULL_SCHEMA: DEFAULT_FULL_SCHEMA,
	load: load$1,
	loadAll: loadAll$1,
	safeLoad: safeLoad$1,
	safeLoadAll: safeLoadAll$1,
	dump: dump$1,
	safeDump: safeDump$1,
	YAMLException: YAMLException$1,
	MINIMAL_SCHEMA: MINIMAL_SCHEMA,
	SAFE_SCHEMA: SAFE_SCHEMA,
	DEFAULT_SCHEMA: DEFAULT_SCHEMA,
	scan: scan,
	parse: parse,
	compose: compose,
	addConstructor: addConstructor
};

var jsYaml$1 = jsYaml;

const REMINDERS_CLASS = "reminders";
// <a href="https://iconscout.com/icons/apple-reminders" target="_blank">Apple Reminders Icon</a> on <a href="https://iconscout.com">Iconscout</a>
const RibbonIcon = `<?xml version="1.0" encoding="UTF-8"?><svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" version="1.1" id="Layer_1" x="0px" y="0px" viewBox="0 0 100 100" xml:space="preserve"><style type="text/css">.st0{fill:#515151;} .st1{fill:#B7B7B7;} .st2{fill:#FF9500;} .st3{fill:#1BADF8;} .st4{fill:#63DA38;}</style><path class="st0" d="M80.4 67.3c-3.1 0-5.6 2.5-5.6 5.6 0 3.1 2.5 5.6 5.6 5.6 3.1 0 5.6-2.5 5.6-5.6 0-3.1-2.5-5.6-5.6-5.6zm0 10.5c-2.7 0-4.9-2.2-4.9-4.9s2.2-4.9 4.9-4.9 4.9 2.2 4.9 4.9-2.2 4.9-4.9 4.9z" fill="#FFF"/><path class="st0" d="M80.4 24.5c-3.1 0-5.6 2.5-5.6 5.6 0 3.1 2.5 5.6 5.6 5.6 3.1 0 5.6-2.5 5.6-5.6 0-3.1-2.5-5.6-5.6-5.6zm0 10.5c-2.7 0-4.9-2.2-4.9-4.9s2.2-4.9 4.9-4.9 4.9 2.2 4.9 4.9-2.2 4.9-4.9 4.9z" fill="#FFF"/><path class="st0" d="M80.4 45.9c-3.1 0-5.6 2.5-5.6 5.6s2.5 5.6 5.6 5.6c3.1 0 5.6-2.5 5.6-5.6s-2.5-5.6-5.6-5.6zm0 10.5c-2.7 0-4.9-2.2-4.9-4.9s2.2-4.9 4.9-4.9 4.9 2.2 4.9 4.9-2.2 4.9-4.9 4.9z" fill="#FFF"/><path class="st0" d="M93.5 18c-1.9-5.3-6.1-9.5-11.4-11.4C77.2 5 72.7 5 63.6 5H36.4c-9 0-13.6 0-18.4 1.5C13 8.3 9 12.1 7 17h59.5v.8H6.6v.1C5 22.8 5 27.3 5 36.4v3.1h61.5v.7H5v20.3h61.5v.7H5v2.4c0 9 0 13.6 1.5 18.4.1.3.3.7.4 1h59.6v.8H7.3c2.1 4.4 6 7.9 10.6 9.6C22.8 95 27.3 95 36.4 95h27.2c9 0 13.6 0 18.4-1.5 5.3-1.9 9.5-6.1 11.4-11.4C95 77.2 95 72.7 95 63.6V36.4c0-9 0-13.6-1.5-18.4zM80.4 79.3c-3.5 0-6.4-2.9-6.4-6.4s2.9-6.4 6.4-6.4 6.4 2.9 6.4 6.4-2.9 6.4-6.4 6.4zm0-21.4c-3.5 0-6.4-2.9-6.4-6.4s2.9-6.4 6.4-6.4 6.4 2.9 6.4 6.4-2.9 6.4-6.4 6.4zm0-21.4c-3.5 0-6.4-2.9-6.4-6.4s2.9-6.4 6.4-6.4 6.4 2.9 6.4 6.4-2.9 6.4-6.4 6.4z" fill="#FFF"/><path class="st1" d="M66.5 83.8V83H6.9c.1.3.2.5.3.8h59.3z" fill="#B7B7B7"/><path class="st1" fill="#B7B7B7" d="M66.5 61.2v-.7H5v.7h61.1z"/><path class="st1" fill="#B7B7B7" d="M66.5 40.2v-.7H5v.7h61.1z"/><path class="st1" d="M66.5 17.8V17H7c-.1.3-.2.5-.3.8h59.8z" fill="#B7B7B7"/><ellipse transform="matrix(0.7071 -0.7071 0.7071 0.7071 2.2647 65.6675)" class="st2" cx="80.4" cy="30.1" rx="4.9" ry="4.9" fill="#FF9500"/><path class="st2" d="M80.4 23.7c-3.5 0-6.4 2.9-6.4 6.4s2.9 6.4 6.4 6.4 6.4-2.9 6.4-6.4-2.9-6.4-6.4-6.4zm0 12c-3.1 0-5.6-2.5-5.6-5.6 0-3.1 2.5-5.6 5.6-5.6 3.1 0 5.6 2.5 5.6 5.6 0 3.1-2.5 5.6-5.6 5.6z" fill="#FF9500"/><ellipse transform="matrix(0.3827 -0.9239 0.9239 0.3827 2.0525 106.0718)" class="st3" cx="80.4" cy="51.5" rx="4.9" ry="4.9" fill="#1BADF8"/><path class="st3" d="M80.4 45.1c-3.5 0-6.4 2.9-6.4 6.4s2.9 6.4 6.4 6.4 6.4-2.9 6.4-6.4-2.9-6.4-6.4-6.4zm0 12c-3.1 0-5.6-2.5-5.6-5.6s2.5-5.6 5.6-5.6c3.1 0 5.6 2.5 5.6 5.6s-2.5 5.6-5.6 5.6z" fill="#1BADF8"/><path class="st4" d="M80.4 66.5c-3.5 0-6.4 2.9-6.4 6.4s2.9 6.4 6.4 6.4 6.4-2.9 6.4-6.4-2.9-6.4-6.4-6.4zm0 12c-3.1 0-5.6-2.5-5.6-5.6 0-3.1 2.5-5.6 5.6-5.6 3.1 0 5.6 2.5 5.6 5.6 0 3.1-2.5 5.6-5.6 5.6z" fill="#63DA38"/><ellipse transform="matrix(0.9732 -0.2298 0.2298 0.9732 -14.5981 20.4222)" class="st4" cx="80.4" cy="72.9" rx="4.9" ry="4.9" fill="#63DA38"/><metadata><rdf:RDF xmlns:rdf="http://www.w3.org/1999/02/22-rdf-syntax-ns#" xmlns:rdfs="http://www.w3.org/2000/01/rdf-schema#" xmlns:dc="http://purl.org/dc/elements/1.1/"><rdf:Description about="https://iconscout.com/legal#licenses" dc:title="apple,reminders" dc:description="apple,reminders" dc:publisher="Iconscout" dc:date="2017-10-27" dc:format="image/svg+xml" dc:language="en"><dc:creator><rdf:Bag><rdf:li>Vicons Design</rdf:li></rdf:Bag></dc:creator></rdf:Description></rdf:RDF></metadata></svg>`;

function logger(source, msg, data) {
    if (data)
        console.log({
            source,
            msg,
            data
        });
    else
        console.log({ source, msg });
}

class StatusBar {
    constructor(statusBar) {
        this.loaders = new Map();
        this.statusBar = statusBar;
    }
    message(msg, disapearIn) {
        logger(this, msg);
        if (disapearIn) {
            this.statusBar.setText(msg);
            setTimeout(() => {
                this.statusBar.setText("Ready.");
            }, disapearIn);
        }
        else
            this.statusBar.setText(msg);
    }
    loading(node, isLoading) {
        this.loaders.set(node, isLoading);
    }
}
class Cache {
    constructor(plugin) {
        this.plugin = plugin;
        this.ready = false;
    }
    isReady() {
        return ready;
    }
    load() {
        return new Promise((resolve, reject) => {
            this.plugin.loadData().then(data => {
                if (null == data) {
                    this.data = {
                        settings: {
                            centralFilePath: "Reminders.app.md"
                        },
                    };
                    this.ready = true;
                    resolve(this.data);
                    this.save();
                }
                else {
                    this.data = data;
                    this.ready = true;
                    resolve(data);
                }
            });
        });
    }
    update(key, value) { }
    save() {
        return this.plugin.saveData(this.data);
    }
}

function noop() { }
function run(fn) {
    return fn();
}
function blank_object() {
    return Object.create(null);
}
function run_all(fns) {
    fns.forEach(run);
}
function is_function(thing) {
    return typeof thing === 'function';
}
function safe_not_equal(a, b) {
    return a != a ? b == b : a !== b || ((a && typeof a === 'object') || typeof a === 'function');
}
function is_empty(obj) {
    return Object.keys(obj).length === 0;
}

function append(target, node) {
    target.appendChild(node);
}
function insert(target, node, anchor) {
    target.insertBefore(node, anchor || null);
}
function detach(node) {
    node.parentNode.removeChild(node);
}
function destroy_each(iterations, detaching) {
    for (let i = 0; i < iterations.length; i += 1) {
        if (iterations[i])
            iterations[i].d(detaching);
    }
}
function element(name) {
    return document.createElement(name);
}
function text(data) {
    return document.createTextNode(data);
}
function space() {
    return text(' ');
}
function listen(node, event, handler, options) {
    node.addEventListener(event, handler, options);
    return () => node.removeEventListener(event, handler, options);
}
function attr(node, attribute, value) {
    if (value == null)
        node.removeAttribute(attribute);
    else if (node.getAttribute(attribute) !== value)
        node.setAttribute(attribute, value);
}
function children(element) {
    return Array.from(element.childNodes);
}
function set_data(text, data) {
    data = '' + data;
    if (text.wholeText !== data)
        text.data = data;
}
function set_style(node, key, value, important) {
    node.style.setProperty(key, value, important ? 'important' : '');
}

let current_component;
function set_current_component(component) {
    current_component = component;
}

const dirty_components = [];
const binding_callbacks = [];
const render_callbacks = [];
const flush_callbacks = [];
const resolved_promise = Promise.resolve();
let update_scheduled = false;
function schedule_update() {
    if (!update_scheduled) {
        update_scheduled = true;
        resolved_promise.then(flush);
    }
}
function add_render_callback(fn) {
    render_callbacks.push(fn);
}
let flushing = false;
const seen_callbacks = new Set();
function flush() {
    if (flushing)
        return;
    flushing = true;
    do {
        // first, call beforeUpdate functions
        // and update components
        for (let i = 0; i < dirty_components.length; i += 1) {
            const component = dirty_components[i];
            set_current_component(component);
            update(component.$$);
        }
        set_current_component(null);
        dirty_components.length = 0;
        while (binding_callbacks.length)
            binding_callbacks.pop()();
        // then, once components are updated, call
        // afterUpdate functions. This may cause
        // subsequent updates...
        for (let i = 0; i < render_callbacks.length; i += 1) {
            const callback = render_callbacks[i];
            if (!seen_callbacks.has(callback)) {
                // ...so guard against infinite loops
                seen_callbacks.add(callback);
                callback();
            }
        }
        render_callbacks.length = 0;
    } while (dirty_components.length);
    while (flush_callbacks.length) {
        flush_callbacks.pop()();
    }
    update_scheduled = false;
    flushing = false;
    seen_callbacks.clear();
}
function update($$) {
    if ($$.fragment !== null) {
        $$.update();
        run_all($$.before_update);
        const dirty = $$.dirty;
        $$.dirty = [-1];
        $$.fragment && $$.fragment.p($$.ctx, dirty);
        $$.after_update.forEach(add_render_callback);
    }
}
const outroing = new Set();
let outros;
function group_outros() {
    outros = {
        r: 0,
        c: [],
        p: outros // parent group
    };
}
function check_outros() {
    if (!outros.r) {
        run_all(outros.c);
    }
    outros = outros.p;
}
function transition_in(block, local) {
    if (block && block.i) {
        outroing.delete(block);
        block.i(local);
    }
}
function transition_out(block, local, detach, callback) {
    if (block && block.o) {
        if (outroing.has(block))
            return;
        outroing.add(block);
        outros.c.push(() => {
            outroing.delete(block);
            if (callback) {
                if (detach)
                    block.d(1);
                callback();
            }
        });
        block.o(local);
    }
}
function create_component(block) {
    block && block.c();
}
function mount_component(component, target, anchor) {
    const { fragment, on_mount, on_destroy, after_update } = component.$$;
    fragment && fragment.m(target, anchor);
    // onMount happens before the initial afterUpdate
    add_render_callback(() => {
        const new_on_destroy = on_mount.map(run).filter(is_function);
        if (on_destroy) {
            on_destroy.push(...new_on_destroy);
        }
        else {
            // Edge case - component was destroyed immediately,
            // most likely as a result of a binding initialising
            run_all(new_on_destroy);
        }
        component.$$.on_mount = [];
    });
    after_update.forEach(add_render_callback);
}
function destroy_component(component, detaching) {
    const $$ = component.$$;
    if ($$.fragment !== null) {
        run_all($$.on_destroy);
        $$.fragment && $$.fragment.d(detaching);
        // TODO null out other refs, including component.$$ (but need to
        // preserve final state?)
        $$.on_destroy = $$.fragment = null;
        $$.ctx = [];
    }
}
function make_dirty(component, i) {
    if (component.$$.dirty[0] === -1) {
        dirty_components.push(component);
        schedule_update();
        component.$$.dirty.fill(0);
    }
    component.$$.dirty[(i / 31) | 0] |= (1 << (i % 31));
}
function init(component, options, instance, create_fragment, not_equal, props, dirty = [-1]) {
    const parent_component = current_component;
    set_current_component(component);
    const prop_values = options.props || {};
    const $$ = component.$$ = {
        fragment: null,
        ctx: null,
        // state
        props,
        update: noop,
        not_equal,
        bound: blank_object(),
        // lifecycle
        on_mount: [],
        on_destroy: [],
        before_update: [],
        after_update: [],
        context: new Map(parent_component ? parent_component.$$.context : []),
        // everything else
        callbacks: blank_object(),
        dirty,
        skip_bound: false
    };
    let ready = false;
    $$.ctx = instance
        ? instance(component, prop_values, (i, ret, ...rest) => {
            const value = rest.length ? rest[0] : ret;
            if ($$.ctx && not_equal($$.ctx[i], $$.ctx[i] = value)) {
                if (!$$.skip_bound && $$.bound[i])
                    $$.bound[i](value);
                if (ready)
                    make_dirty(component, i);
            }
            return ret;
        })
        : [];
    $$.update();
    ready = true;
    run_all($$.before_update);
    // `false` as a special case of no DOM component
    $$.fragment = create_fragment ? create_fragment($$.ctx) : false;
    if (options.target) {
        if (options.hydrate) {
            const nodes = children(options.target);
            // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
            $$.fragment && $$.fragment.l(nodes);
            nodes.forEach(detach);
        }
        else {
            // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
            $$.fragment && $$.fragment.c();
        }
        if (options.intro)
            transition_in(component.$$.fragment);
        mount_component(component, options.target, options.anchor);
        flush();
    }
    set_current_component(parent_component);
}
class SvelteComponent {
    $destroy() {
        destroy_component(this, 1);
        this.$destroy = noop;
    }
    $on(type, callback) {
        const callbacks = (this.$$.callbacks[type] || (this.$$.callbacks[type] = []));
        callbacks.push(callback);
        return () => {
            const index = callbacks.indexOf(callback);
            if (index !== -1)
                callbacks.splice(index, 1);
        };
    }
    $set($$props) {
        if (this.$$set && !is_empty($$props)) {
            this.$$.skip_bound = true;
            this.$$set($$props);
            this.$$.skip_bound = false;
        }
    }
}

var buffers = Buffers;

function Buffers (bufs) {
    if (!(this instanceof Buffers)) return new Buffers(bufs);
    this.buffers = bufs || [];
    this.length = this.buffers.reduce(function (size, buf) {
        return size + buf.length
    }, 0);
}

Buffers.prototype.push = function () {
    for (var i = 0; i < arguments.length; i++) {
        if (!Buffer.isBuffer(arguments[i])) {
            throw new TypeError('Tried to push a non-buffer');
        }
    }
    
    for (var i = 0; i < arguments.length; i++) {
        var buf = arguments[i];
        this.buffers.push(buf);
        this.length += buf.length;
    }
    return this.length;
};

Buffers.prototype.unshift = function () {
    for (var i = 0; i < arguments.length; i++) {
        if (!Buffer.isBuffer(arguments[i])) {
            throw new TypeError('Tried to unshift a non-buffer');
        }
    }
    
    for (var i = 0; i < arguments.length; i++) {
        var buf = arguments[i];
        this.buffers.unshift(buf);
        this.length += buf.length;
    }
    return this.length;
};

Buffers.prototype.copy = function (dst, dStart, start, end) {
    return this.slice(start, end).copy(dst, dStart, 0, end - start);
};

Buffers.prototype.splice = function (i, howMany) {
    var buffers = this.buffers;
    var index = i >= 0 ? i : this.length - i;
    var reps = [].slice.call(arguments, 2);
    
    if (howMany === undefined) {
        howMany = this.length - index;
    }
    else if (howMany > this.length - index) {
        howMany = this.length - index;
    }
    
    for (var i = 0; i < reps.length; i++) {
        this.length += reps[i].length;
    }
    
    var removed = new Buffers();
    
    var startBytes = 0;
    for (
        var ii = 0;
        ii < buffers.length && startBytes + buffers[ii].length < index;
        ii ++
    ) { startBytes += buffers[ii].length; }
    
    if (index - startBytes > 0) {
        var start = index - startBytes;
        
        if (start + howMany < buffers[ii].length) {
            removed.push(buffers[ii].slice(start, start + howMany));
            
            var orig = buffers[ii];
            //var buf = new Buffer(orig.length - howMany);
            var buf0 = new Buffer(start);
            for (var i = 0; i < start; i++) {
                buf0[i] = orig[i];
            }
            
            var buf1 = new Buffer(orig.length - start - howMany);
            for (var i = start + howMany; i < orig.length; i++) {
                buf1[ i - howMany - start ] = orig[i];
            }
            
            if (reps.length > 0) {
                var reps_ = reps.slice();
                reps_.unshift(buf0);
                reps_.push(buf1);
                buffers.splice.apply(buffers, [ ii, 1 ].concat(reps_));
                ii += reps_.length;
                reps = [];
            }
            else {
                buffers.splice(ii, 1, buf0, buf1);
                //buffers[ii] = buf;
                ii += 2;
            }
        }
        else {
            removed.push(buffers[ii].slice(start));
            buffers[ii] = buffers[ii].slice(0, start);
            ii ++;
        }
    }
    
    if (reps.length > 0) {
        buffers.splice.apply(buffers, [ ii, 0 ].concat(reps));
        ii += reps.length;
    }
    
    while (removed.length < howMany) {
        var buf = buffers[ii];
        var len = buf.length;
        var take = Math.min(len, howMany - removed.length);
        
        if (take === len) {
            removed.push(buf);
            buffers.splice(ii, 1);
        }
        else {
            removed.push(buf.slice(0, take));
            buffers[ii] = buffers[ii].slice(take);
        }
    }
    
    this.length -= removed.length;
    
    return removed;
};
 
Buffers.prototype.slice = function (i, j) {
    var buffers = this.buffers;
    if (j === undefined) j = this.length;
    if (i === undefined) i = 0;
    
    if (j > this.length) j = this.length;
    
    var startBytes = 0;
    for (
        var si = 0;
        si < buffers.length && startBytes + buffers[si].length <= i;
        si ++
    ) { startBytes += buffers[si].length; }
    
    var target = new Buffer(j - i);
    
    var ti = 0;
    for (var ii = si; ti < j - i && ii < buffers.length; ii++) {
        var len = buffers[ii].length;
        
        var start = ti === 0 ? i - startBytes : 0;
        var end = ti + len >= j - i
            ? Math.min(start + (j - i) - ti, len)
            : len
        ;
        
        buffers[ii].copy(target, ti, start, end);
        ti += end - start;
    }
    
    return target;
};

Buffers.prototype.pos = function (i) {
    if (i < 0 || i >= this.length) throw new Error('oob');
    var l = i, bi = 0, bu = null;
    for (;;) {
        bu = this.buffers[bi];
        if (l < bu.length) {
            return {buf: bi, offset: l};
        } else {
            l -= bu.length;
        }
        bi++;
    }
};

Buffers.prototype.get = function get (i) {
    var pos = this.pos(i);

    return this.buffers[pos.buf].get(pos.offset);
};

Buffers.prototype.set = function set (i, b) {
    var pos = this.pos(i);

    return this.buffers[pos.buf].set(pos.offset, b);
};

Buffers.prototype.indexOf = function (needle, offset) {
    if ("string" === typeof needle) {
        needle = new Buffer(needle);
    } else if (needle instanceof Buffer) ; else {
        throw new Error('Invalid type for a search string');
    }

    if (!needle.length) {
        return 0;
    }

    if (!this.length) {
        return -1;
    }

    var i = 0, j = 0, match = 0, mstart, pos = 0;

    // start search from a particular point in the virtual buffer
    if (offset) {
        var p = this.pos(offset);
        i = p.buf;
        j = p.offset;
        pos = offset;
    }

    // for each character in virtual buffer
    for (;;) {
        while (j >= this.buffers[i].length) {
            j = 0;
            i++;

            if (i >= this.buffers.length) {
                // search string not found
                return -1;
            }
        }

        var char = this.buffers[i][j];

        if (char == needle[match]) {
            // keep track where match started
            if (match == 0) {
                mstart = {
                    i: i,
                    j: j,
                    pos: pos
                };
            }
            match++;
            if (match == needle.length) {
                // full match
                return mstart.pos;
            }
        } else if (match != 0) {
            // a partial match ended, go back to match starting position
            // this will continue the search at the next character
            i = mstart.i;
            j = mstart.j;
            pos = mstart.pos;
            match = 0;
        }

        j++;
        pos++;
    }
};

Buffers.prototype.toBuffer = function() {
    return this.slice();
};

Buffers.prototype.toString = function(encoding, start, end) {
    return this.slice(start, end).toString(encoding);
};

/*
 * Generated by PEG.js 0.10.0.
 *
 * http://pegjs.org/
 */

function peg$subclass(child, parent) {
  function ctor() { this.constructor = child; }
  ctor.prototype = parent.prototype;
  child.prototype = new ctor();
}

function peg$SyntaxError(message, expected, found, location) {
  this.message  = message;
  this.expected = expected;
  this.found    = found;
  this.location = location;
  this.name     = "SyntaxError";

  if (typeof Error.captureStackTrace === "function") {
    Error.captureStackTrace(this, peg$SyntaxError);
  }
}

peg$subclass(peg$SyntaxError, Error);

peg$SyntaxError.buildMessage = function(expected, found) {
  var DESCRIBE_EXPECTATION_FNS = {
        literal: function(expectation) {
          return "\"" + literalEscape(expectation.text) + "\"";
        },

        "class": function(expectation) {
          var escapedParts = "",
              i;

          for (i = 0; i < expectation.parts.length; i++) {
            escapedParts += expectation.parts[i] instanceof Array
              ? classEscape(expectation.parts[i][0]) + "-" + classEscape(expectation.parts[i][1])
              : classEscape(expectation.parts[i]);
          }

          return "[" + (expectation.inverted ? "^" : "") + escapedParts + "]";
        },

        any: function(expectation) {
          return "any character";
        },

        end: function(expectation) {
          return "end of input";
        },

        other: function(expectation) {
          return expectation.description;
        }
      };

  function hex(ch) {
    return ch.charCodeAt(0).toString(16).toUpperCase();
  }

  function literalEscape(s) {
    return s
      .replace(/\\/g, '\\\\')
      .replace(/"/g,  '\\"')
      .replace(/\0/g, '\\0')
      .replace(/\t/g, '\\t')
      .replace(/\n/g, '\\n')
      .replace(/\r/g, '\\r')
      .replace(/[\x00-\x0F]/g,          function(ch) { return '\\x0' + hex(ch); })
      .replace(/[\x10-\x1F\x7F-\x9F]/g, function(ch) { return '\\x'  + hex(ch); });
  }

  function classEscape(s) {
    return s
      .replace(/\\/g, '\\\\')
      .replace(/\]/g, '\\]')
      .replace(/\^/g, '\\^')
      .replace(/-/g,  '\\-')
      .replace(/\0/g, '\\0')
      .replace(/\t/g, '\\t')
      .replace(/\n/g, '\\n')
      .replace(/\r/g, '\\r')
      .replace(/[\x00-\x0F]/g,          function(ch) { return '\\x0' + hex(ch); })
      .replace(/[\x10-\x1F\x7F-\x9F]/g, function(ch) { return '\\x'  + hex(ch); });
  }

  function describeExpectation(expectation) {
    return DESCRIBE_EXPECTATION_FNS[expectation.type](expectation);
  }

  function describeExpected(expected) {
    var descriptions = new Array(expected.length),
        i, j;

    for (i = 0; i < expected.length; i++) {
      descriptions[i] = describeExpectation(expected[i]);
    }

    descriptions.sort();

    if (descriptions.length > 0) {
      for (i = 1, j = 1; i < descriptions.length; i++) {
        if (descriptions[i - 1] !== descriptions[i]) {
          descriptions[j] = descriptions[i];
          j++;
        }
      }
      descriptions.length = j;
    }

    switch (descriptions.length) {
      case 1:
        return descriptions[0];

      case 2:
        return descriptions[0] + " or " + descriptions[1];

      default:
        return descriptions.slice(0, -1).join(", ")
          + ", or "
          + descriptions[descriptions.length - 1];
    }
  }

  function describeFound(found) {
    return found ? "\"" + literalEscape(found) + "\"" : "end of input";
  }

  return "Expected " + describeExpected(expected) + " but " + describeFound(found) + " found.";
};

function peg$parse(input, options) {
  options = options !== void 0 ? options : {};

  var peg$FAILED = {},

      peg$startRuleFunctions = { osascript: peg$parseosascript },
      peg$startRuleFunction  = peg$parseosascript,

      peg$c0 = function(value) { return value; },
      peg$c1 = "{",
      peg$c2 = peg$literalExpectation("{", false),
      peg$c3 = "}",
      peg$c4 = peg$literalExpectation("}", false),
      peg$c5 = ":",
      peg$c6 = peg$literalExpectation(":", false),
      peg$c7 = ",",
      peg$c8 = peg$literalExpectation(",", false),
      peg$c9 = peg$otherExpectation("whitespace"),
      peg$c10 = /^[ \t\n\r]/,
      peg$c11 = peg$classExpectation([" ", "\t", "\n", "\r"], false, false),
      peg$c12 = "false",
      peg$c13 = peg$literalExpectation("false", false),
      peg$c14 = function() { return false; },
      peg$c15 = "true",
      peg$c16 = peg$literalExpectation("true", false),
      peg$c17 = function() { return true;  },
      peg$c18 = peg$anyExpectation(),
      peg$c19 = function(chars) { return (chars.length > 0) ? chars.join('') : null; },
      peg$c20 = function(first, m) { return m; },
      peg$c21 = function(first, rest) {
              var result = {}, i;

              result[first.name] = first.value;

              for (i = 0; i < rest.length; i++) {
                result[rest[i].name] = rest[i].value;
              }

              return result;
            },
      peg$c22 = function(members) { return members !== null ? members: {}; },
      peg$c23 = function(name, value) {
            return { name: name, value: value };
          },
      peg$c24 = /^[ a-z0-9\-]/i,
      peg$c25 = peg$classExpectation([" ", ["a", "z"], ["0", "9"], "-"], false, true),
      peg$c26 = function(chars) { return chars.join("").trim(); },
      peg$c27 = function(first, v) { return v; },
      peg$c28 = function(first, rest) { return [first].concat(rest); },
      peg$c29 = function(values) { return values !== null ? values : []; },
      peg$c30 = peg$otherExpectation("number"),
      peg$c31 = function() { return parseFloat(text()); },
      peg$c32 = ".",
      peg$c33 = peg$literalExpectation(".", false),
      peg$c34 = /^[1-9]/,
      peg$c35 = peg$classExpectation([["1", "9"]], false, false),
      peg$c36 = /^[eE]/,
      peg$c37 = peg$classExpectation(["e", "E"], false, false),
      peg$c38 = "-",
      peg$c39 = peg$literalExpectation("-", false),
      peg$c40 = "+",
      peg$c41 = peg$literalExpectation("+", false),
      peg$c42 = "0",
      peg$c43 = peg$literalExpectation("0", false),
      peg$c44 = peg$otherExpectation("string"),
      peg$c45 = function(chars) { return chars.join(""); },
      peg$c46 = "\n",
      peg$c47 = peg$literalExpectation("\n", false),
      peg$c48 = "\t",
      peg$c49 = peg$literalExpectation("\t", false),
      peg$c50 = "\"",
      peg$c51 = peg$literalExpectation("\"", false),
      peg$c52 = "\\",
      peg$c53 = peg$literalExpectation("\\", false),
      peg$c54 = "/",
      peg$c55 = peg$literalExpectation("/", false),
      peg$c56 = "b",
      peg$c57 = peg$literalExpectation("b", false),
      peg$c58 = function() { return "\b"; },
      peg$c59 = "f",
      peg$c60 = peg$literalExpectation("f", false),
      peg$c61 = function() { return "\f"; },
      peg$c62 = "n",
      peg$c63 = peg$literalExpectation("n", false),
      peg$c64 = function() { return "\n"; },
      peg$c65 = "r",
      peg$c66 = peg$literalExpectation("r", false),
      peg$c67 = function() { return "\r"; },
      peg$c68 = "t",
      peg$c69 = peg$literalExpectation("t", false),
      peg$c70 = function() { return "\t"; },
      peg$c71 = "u",
      peg$c72 = peg$literalExpectation("u", false),
      peg$c73 = function(digits) {
                return String.fromCharCode(parseInt(digits, 16));
              },
      peg$c74 = function(sequence) { return sequence; },
      peg$c75 = /^[^\0-\x1F"\\]/,
      peg$c76 = peg$classExpectation([["\0", "\x1F"], "\"", "\\"], true, false),
      peg$c77 = peg$otherExpectation("unquoted string"),
      peg$c78 = function(first_char, chars) { return first_char+chars.join(""); },
      peg$c79 = /^[a-z ]/,
      peg$c80 = peg$classExpectation([["a", "z"], " "], false, false),
      peg$c81 = /^[^,}]/,
      peg$c82 = peg$classExpectation([",", "}"], true, false),
      peg$c83 = peg$otherExpectation("date"),
      peg$c84 = "date",
      peg$c85 = peg$literalExpectation("date", false),
      peg$c86 = function(date) {
        var dateObject = new Date(date);
        return !isNaN(dateObject.getTime()) ? dateObject : date;
       },
      peg$c87 = /^[0-9]/,
      peg$c88 = peg$classExpectation([["0", "9"]], false, false),
      peg$c89 = /^[0-9a-f]/i,
      peg$c90 = peg$classExpectation([["0", "9"], ["a", "f"]], false, true),

      peg$currPos          = 0,
      peg$savedPos         = 0,
      peg$posDetailsCache  = [{ line: 1, column: 1 }],
      peg$maxFailPos       = 0,
      peg$maxFailExpected  = [],
      peg$silentFails      = 0,

      peg$result;

  if ("startRule" in options) {
    if (!(options.startRule in peg$startRuleFunctions)) {
      throw new Error("Can't start parsing from rule \"" + options.startRule + "\".");
    }

    peg$startRuleFunction = peg$startRuleFunctions[options.startRule];
  }

  function text() {
    return input.substring(peg$savedPos, peg$currPos);
  }

  function peg$literalExpectation(text, ignoreCase) {
    return { type: "literal", text: text, ignoreCase: ignoreCase };
  }

  function peg$classExpectation(parts, inverted, ignoreCase) {
    return { type: "class", parts: parts, inverted: inverted, ignoreCase: ignoreCase };
  }

  function peg$anyExpectation() {
    return { type: "any" };
  }

  function peg$endExpectation() {
    return { type: "end" };
  }

  function peg$otherExpectation(description) {
    return { type: "other", description: description };
  }

  function peg$computePosDetails(pos) {
    var details = peg$posDetailsCache[pos], p;

    if (details) {
      return details;
    } else {
      p = pos - 1;
      while (!peg$posDetailsCache[p]) {
        p--;
      }

      details = peg$posDetailsCache[p];
      details = {
        line:   details.line,
        column: details.column
      };

      while (p < pos) {
        if (input.charCodeAt(p) === 10) {
          details.line++;
          details.column = 1;
        } else {
          details.column++;
        }

        p++;
      }

      peg$posDetailsCache[pos] = details;
      return details;
    }
  }

  function peg$computeLocation(startPos, endPos) {
    var startPosDetails = peg$computePosDetails(startPos),
        endPosDetails   = peg$computePosDetails(endPos);

    return {
      start: {
        offset: startPos,
        line:   startPosDetails.line,
        column: startPosDetails.column
      },
      end: {
        offset: endPos,
        line:   endPosDetails.line,
        column: endPosDetails.column
      }
    };
  }

  function peg$fail(expected) {
    if (peg$currPos < peg$maxFailPos) { return; }

    if (peg$currPos > peg$maxFailPos) {
      peg$maxFailPos = peg$currPos;
      peg$maxFailExpected = [];
    }

    peg$maxFailExpected.push(expected);
  }

  function peg$buildStructuredError(expected, found, location) {
    return new peg$SyntaxError(
      peg$SyntaxError.buildMessage(expected, found),
      expected,
      found,
      location
    );
  }

  function peg$parseosascript() {
    var s0, s1, s2, s3;

    s0 = peg$currPos;
    s1 = peg$parsews();
    if (s1 !== peg$FAILED) {
      s2 = peg$parsevalue();
      if (s2 !== peg$FAILED) {
        s3 = peg$parsews();
        if (s3 !== peg$FAILED) {
          peg$savedPos = s0;
          s1 = peg$c0(s2);
          s0 = s1;
        } else {
          peg$currPos = s0;
          s0 = peg$FAILED;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }
    } else {
      peg$currPos = s0;
      s0 = peg$FAILED;
    }

    return s0;
  }

  function peg$parsebegin_object() {
    var s0, s1, s2, s3;

    s0 = peg$currPos;
    s1 = peg$parsews();
    if (s1 !== peg$FAILED) {
      if (input.charCodeAt(peg$currPos) === 123) {
        s2 = peg$c1;
        peg$currPos++;
      } else {
        s2 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c2); }
      }
      if (s2 !== peg$FAILED) {
        s3 = peg$parsews();
        if (s3 !== peg$FAILED) {
          s1 = [s1, s2, s3];
          s0 = s1;
        } else {
          peg$currPos = s0;
          s0 = peg$FAILED;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }
    } else {
      peg$currPos = s0;
      s0 = peg$FAILED;
    }

    return s0;
  }

  function peg$parseend_object() {
    var s0, s1, s2, s3;

    s0 = peg$currPos;
    s1 = peg$parsews();
    if (s1 !== peg$FAILED) {
      if (input.charCodeAt(peg$currPos) === 125) {
        s2 = peg$c3;
        peg$currPos++;
      } else {
        s2 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c4); }
      }
      if (s2 !== peg$FAILED) {
        s3 = peg$parsews();
        if (s3 !== peg$FAILED) {
          s1 = [s1, s2, s3];
          s0 = s1;
        } else {
          peg$currPos = s0;
          s0 = peg$FAILED;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }
    } else {
      peg$currPos = s0;
      s0 = peg$FAILED;
    }

    return s0;
  }

  function peg$parsename_separator() {
    var s0, s1, s2, s3;

    s0 = peg$currPos;
    s1 = peg$parsews();
    if (s1 !== peg$FAILED) {
      if (input.charCodeAt(peg$currPos) === 58) {
        s2 = peg$c5;
        peg$currPos++;
      } else {
        s2 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c6); }
      }
      if (s2 !== peg$FAILED) {
        s3 = peg$parsews();
        if (s3 !== peg$FAILED) {
          s1 = [s1, s2, s3];
          s0 = s1;
        } else {
          peg$currPos = s0;
          s0 = peg$FAILED;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }
    } else {
      peg$currPos = s0;
      s0 = peg$FAILED;
    }

    return s0;
  }

  function peg$parsevalue_separator() {
    var s0, s1, s2, s3;

    s0 = peg$currPos;
    s1 = peg$parsews();
    if (s1 !== peg$FAILED) {
      if (input.charCodeAt(peg$currPos) === 44) {
        s2 = peg$c7;
        peg$currPos++;
      } else {
        s2 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c8); }
      }
      if (s2 !== peg$FAILED) {
        s3 = peg$parsews();
        if (s3 !== peg$FAILED) {
          s1 = [s1, s2, s3];
          s0 = s1;
        } else {
          peg$currPos = s0;
          s0 = peg$FAILED;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }
    } else {
      peg$currPos = s0;
      s0 = peg$FAILED;
    }

    return s0;
  }

  function peg$parsews() {
    var s0, s1;

    peg$silentFails++;
    s0 = [];
    if (peg$c10.test(input.charAt(peg$currPos))) {
      s1 = input.charAt(peg$currPos);
      peg$currPos++;
    } else {
      s1 = peg$FAILED;
      if (peg$silentFails === 0) { peg$fail(peg$c11); }
    }
    while (s1 !== peg$FAILED) {
      s0.push(s1);
      if (peg$c10.test(input.charAt(peg$currPos))) {
        s1 = input.charAt(peg$currPos);
        peg$currPos++;
      } else {
        s1 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c11); }
      }
    }
    peg$silentFails--;
    if (s0 === peg$FAILED) {
      s1 = peg$FAILED;
      if (peg$silentFails === 0) { peg$fail(peg$c9); }
    }

    return s0;
  }

  function peg$parsevalue() {
    var s0;

    s0 = peg$parsefalse();
    if (s0 === peg$FAILED) {
      s0 = peg$parsetrue();
      if (s0 === peg$FAILED) {
        s0 = peg$parseobject();
        if (s0 === peg$FAILED) {
          s0 = peg$parsearray();
          if (s0 === peg$FAILED) {
            s0 = peg$parsenumber();
            if (s0 === peg$FAILED) {
              s0 = peg$parsestring();
              if (s0 === peg$FAILED) {
                s0 = peg$parsedate();
                if (s0 === peg$FAILED) {
                  s0 = peg$parseunquoted_string();
                  if (s0 === peg$FAILED) {
                    s0 = peg$parseraw();
                  }
                }
              }
            }
          }
        }
      }
    }

    return s0;
  }

  function peg$parsefalse() {
    var s0, s1;

    s0 = peg$currPos;
    if (input.substr(peg$currPos, 5) === peg$c12) {
      s1 = peg$c12;
      peg$currPos += 5;
    } else {
      s1 = peg$FAILED;
      if (peg$silentFails === 0) { peg$fail(peg$c13); }
    }
    if (s1 !== peg$FAILED) {
      peg$savedPos = s0;
      s1 = peg$c14();
    }
    s0 = s1;

    return s0;
  }

  function peg$parsetrue() {
    var s0, s1;

    s0 = peg$currPos;
    if (input.substr(peg$currPos, 4) === peg$c15) {
      s1 = peg$c15;
      peg$currPos += 4;
    } else {
      s1 = peg$FAILED;
      if (peg$silentFails === 0) { peg$fail(peg$c16); }
    }
    if (s1 !== peg$FAILED) {
      peg$savedPos = s0;
      s1 = peg$c17();
    }
    s0 = s1;

    return s0;
  }

  function peg$parseraw() {
    var s0, s1, s2, s3;

    s0 = peg$currPos;
    s1 = peg$parsews();
    if (s1 !== peg$FAILED) {
      s2 = [];
      if (input.length > peg$currPos) {
        s3 = input.charAt(peg$currPos);
        peg$currPos++;
      } else {
        s3 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c18); }
      }
      while (s3 !== peg$FAILED) {
        s2.push(s3);
        if (input.length > peg$currPos) {
          s3 = input.charAt(peg$currPos);
          peg$currPos++;
        } else {
          s3 = peg$FAILED;
          if (peg$silentFails === 0) { peg$fail(peg$c18); }
        }
      }
      if (s2 !== peg$FAILED) {
        s3 = peg$parsews();
        if (s3 !== peg$FAILED) {
          peg$savedPos = s0;
          s1 = peg$c19(s2);
          s0 = s1;
        } else {
          peg$currPos = s0;
          s0 = peg$FAILED;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }
    } else {
      peg$currPos = s0;
      s0 = peg$FAILED;
    }

    return s0;
  }

  function peg$parseobject() {
    var s0, s1, s2, s3, s4, s5, s6, s7;

    s0 = peg$currPos;
    s1 = peg$parsebegin_object();
    if (s1 !== peg$FAILED) {
      s2 = peg$currPos;
      s3 = peg$parsemember();
      if (s3 !== peg$FAILED) {
        s4 = [];
        s5 = peg$currPos;
        s6 = peg$parsevalue_separator();
        if (s6 !== peg$FAILED) {
          s7 = peg$parsemember();
          if (s7 !== peg$FAILED) {
            peg$savedPos = s5;
            s6 = peg$c20(s3, s7);
            s5 = s6;
          } else {
            peg$currPos = s5;
            s5 = peg$FAILED;
          }
        } else {
          peg$currPos = s5;
          s5 = peg$FAILED;
        }
        while (s5 !== peg$FAILED) {
          s4.push(s5);
          s5 = peg$currPos;
          s6 = peg$parsevalue_separator();
          if (s6 !== peg$FAILED) {
            s7 = peg$parsemember();
            if (s7 !== peg$FAILED) {
              peg$savedPos = s5;
              s6 = peg$c20(s3, s7);
              s5 = s6;
            } else {
              peg$currPos = s5;
              s5 = peg$FAILED;
            }
          } else {
            peg$currPos = s5;
            s5 = peg$FAILED;
          }
        }
        if (s4 !== peg$FAILED) {
          peg$savedPos = s2;
          s3 = peg$c21(s3, s4);
          s2 = s3;
        } else {
          peg$currPos = s2;
          s2 = peg$FAILED;
        }
      } else {
        peg$currPos = s2;
        s2 = peg$FAILED;
      }
      if (s2 === peg$FAILED) {
        s2 = null;
      }
      if (s2 !== peg$FAILED) {
        s3 = peg$parseend_object();
        if (s3 !== peg$FAILED) {
          peg$savedPos = s0;
          s1 = peg$c22(s2);
          s0 = s1;
        } else {
          peg$currPos = s0;
          s0 = peg$FAILED;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }
    } else {
      peg$currPos = s0;
      s0 = peg$FAILED;
    }

    return s0;
  }

  function peg$parsemember() {
    var s0, s1, s2, s3;

    s0 = peg$currPos;
    s1 = peg$parsekey();
    if (s1 !== peg$FAILED) {
      s2 = peg$parsename_separator();
      if (s2 !== peg$FAILED) {
        s3 = peg$parsevalue();
        if (s3 !== peg$FAILED) {
          peg$savedPos = s0;
          s1 = peg$c23(s1, s3);
          s0 = s1;
        } else {
          peg$currPos = s0;
          s0 = peg$FAILED;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }
    } else {
      peg$currPos = s0;
      s0 = peg$FAILED;
    }

    return s0;
  }

  function peg$parsekey() {
    var s0, s1, s2;

    s0 = peg$currPos;
    s1 = [];
    if (peg$c24.test(input.charAt(peg$currPos))) {
      s2 = input.charAt(peg$currPos);
      peg$currPos++;
    } else {
      s2 = peg$FAILED;
      if (peg$silentFails === 0) { peg$fail(peg$c25); }
    }
    if (s2 !== peg$FAILED) {
      while (s2 !== peg$FAILED) {
        s1.push(s2);
        if (peg$c24.test(input.charAt(peg$currPos))) {
          s2 = input.charAt(peg$currPos);
          peg$currPos++;
        } else {
          s2 = peg$FAILED;
          if (peg$silentFails === 0) { peg$fail(peg$c25); }
        }
      }
    } else {
      s1 = peg$FAILED;
    }
    if (s1 !== peg$FAILED) {
      peg$savedPos = s0;
      s1 = peg$c26(s1);
    }
    s0 = s1;

    return s0;
  }

  function peg$parsearray() {
    var s0, s1, s2, s3, s4, s5, s6, s7;

    s0 = peg$currPos;
    s1 = peg$parsebegin_object();
    if (s1 !== peg$FAILED) {
      s2 = peg$currPos;
      s3 = peg$parsevalue();
      if (s3 !== peg$FAILED) {
        s4 = [];
        s5 = peg$currPos;
        s6 = peg$parsevalue_separator();
        if (s6 !== peg$FAILED) {
          s7 = peg$parsevalue();
          if (s7 !== peg$FAILED) {
            peg$savedPos = s5;
            s6 = peg$c27(s3, s7);
            s5 = s6;
          } else {
            peg$currPos = s5;
            s5 = peg$FAILED;
          }
        } else {
          peg$currPos = s5;
          s5 = peg$FAILED;
        }
        while (s5 !== peg$FAILED) {
          s4.push(s5);
          s5 = peg$currPos;
          s6 = peg$parsevalue_separator();
          if (s6 !== peg$FAILED) {
            s7 = peg$parsevalue();
            if (s7 !== peg$FAILED) {
              peg$savedPos = s5;
              s6 = peg$c27(s3, s7);
              s5 = s6;
            } else {
              peg$currPos = s5;
              s5 = peg$FAILED;
            }
          } else {
            peg$currPos = s5;
            s5 = peg$FAILED;
          }
        }
        if (s4 !== peg$FAILED) {
          peg$savedPos = s2;
          s3 = peg$c28(s3, s4);
          s2 = s3;
        } else {
          peg$currPos = s2;
          s2 = peg$FAILED;
        }
      } else {
        peg$currPos = s2;
        s2 = peg$FAILED;
      }
      if (s2 === peg$FAILED) {
        s2 = null;
      }
      if (s2 !== peg$FAILED) {
        s3 = peg$parseend_object();
        if (s3 !== peg$FAILED) {
          peg$savedPos = s0;
          s1 = peg$c29(s2);
          s0 = s1;
        } else {
          peg$currPos = s0;
          s0 = peg$FAILED;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }
    } else {
      peg$currPos = s0;
      s0 = peg$FAILED;
    }

    return s0;
  }

  function peg$parsenumber() {
    var s0, s1, s2, s3, s4;

    peg$silentFails++;
    s0 = peg$currPos;
    s1 = peg$parseminus();
    if (s1 === peg$FAILED) {
      s1 = null;
    }
    if (s1 !== peg$FAILED) {
      s2 = peg$parseint();
      if (s2 !== peg$FAILED) {
        s3 = peg$parsefrac();
        if (s3 === peg$FAILED) {
          s3 = null;
        }
        if (s3 !== peg$FAILED) {
          s4 = peg$parseexp();
          if (s4 === peg$FAILED) {
            s4 = null;
          }
          if (s4 !== peg$FAILED) {
            peg$savedPos = s0;
            s1 = peg$c31();
            s0 = s1;
          } else {
            peg$currPos = s0;
            s0 = peg$FAILED;
          }
        } else {
          peg$currPos = s0;
          s0 = peg$FAILED;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }
    } else {
      peg$currPos = s0;
      s0 = peg$FAILED;
    }
    peg$silentFails--;
    if (s0 === peg$FAILED) {
      s1 = peg$FAILED;
      if (peg$silentFails === 0) { peg$fail(peg$c30); }
    }

    return s0;
  }

  function peg$parsedecimal_point() {
    var s0;

    if (input.charCodeAt(peg$currPos) === 46) {
      s0 = peg$c32;
      peg$currPos++;
    } else {
      s0 = peg$FAILED;
      if (peg$silentFails === 0) { peg$fail(peg$c33); }
    }

    return s0;
  }

  function peg$parsedigit1_9() {
    var s0;

    if (peg$c34.test(input.charAt(peg$currPos))) {
      s0 = input.charAt(peg$currPos);
      peg$currPos++;
    } else {
      s0 = peg$FAILED;
      if (peg$silentFails === 0) { peg$fail(peg$c35); }
    }

    return s0;
  }

  function peg$parsee() {
    var s0;

    if (peg$c36.test(input.charAt(peg$currPos))) {
      s0 = input.charAt(peg$currPos);
      peg$currPos++;
    } else {
      s0 = peg$FAILED;
      if (peg$silentFails === 0) { peg$fail(peg$c37); }
    }

    return s0;
  }

  function peg$parseexp() {
    var s0, s1, s2, s3, s4;

    s0 = peg$currPos;
    s1 = peg$parsee();
    if (s1 !== peg$FAILED) {
      s2 = peg$parseminus();
      if (s2 === peg$FAILED) {
        s2 = peg$parseplus();
      }
      if (s2 === peg$FAILED) {
        s2 = null;
      }
      if (s2 !== peg$FAILED) {
        s3 = [];
        s4 = peg$parseDIGIT();
        if (s4 !== peg$FAILED) {
          while (s4 !== peg$FAILED) {
            s3.push(s4);
            s4 = peg$parseDIGIT();
          }
        } else {
          s3 = peg$FAILED;
        }
        if (s3 !== peg$FAILED) {
          s1 = [s1, s2, s3];
          s0 = s1;
        } else {
          peg$currPos = s0;
          s0 = peg$FAILED;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }
    } else {
      peg$currPos = s0;
      s0 = peg$FAILED;
    }

    return s0;
  }

  function peg$parsefrac() {
    var s0, s1, s2, s3;

    s0 = peg$currPos;
    s1 = peg$parsedecimal_point();
    if (s1 !== peg$FAILED) {
      s2 = [];
      s3 = peg$parseDIGIT();
      if (s3 !== peg$FAILED) {
        while (s3 !== peg$FAILED) {
          s2.push(s3);
          s3 = peg$parseDIGIT();
        }
      } else {
        s2 = peg$FAILED;
      }
      if (s2 !== peg$FAILED) {
        s1 = [s1, s2];
        s0 = s1;
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }
    } else {
      peg$currPos = s0;
      s0 = peg$FAILED;
    }

    return s0;
  }

  function peg$parseint() {
    var s0, s1, s2, s3;

    s0 = peg$parsezero();
    if (s0 === peg$FAILED) {
      s0 = peg$currPos;
      s1 = peg$parsedigit1_9();
      if (s1 !== peg$FAILED) {
        s2 = [];
        s3 = peg$parseDIGIT();
        while (s3 !== peg$FAILED) {
          s2.push(s3);
          s3 = peg$parseDIGIT();
        }
        if (s2 !== peg$FAILED) {
          s1 = [s1, s2];
          s0 = s1;
        } else {
          peg$currPos = s0;
          s0 = peg$FAILED;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }
    }

    return s0;
  }

  function peg$parseminus() {
    var s0;

    if (input.charCodeAt(peg$currPos) === 45) {
      s0 = peg$c38;
      peg$currPos++;
    } else {
      s0 = peg$FAILED;
      if (peg$silentFails === 0) { peg$fail(peg$c39); }
    }

    return s0;
  }

  function peg$parseplus() {
    var s0;

    if (input.charCodeAt(peg$currPos) === 43) {
      s0 = peg$c40;
      peg$currPos++;
    } else {
      s0 = peg$FAILED;
      if (peg$silentFails === 0) { peg$fail(peg$c41); }
    }

    return s0;
  }

  function peg$parsezero() {
    var s0;

    if (input.charCodeAt(peg$currPos) === 48) {
      s0 = peg$c42;
      peg$currPos++;
    } else {
      s0 = peg$FAILED;
      if (peg$silentFails === 0) { peg$fail(peg$c43); }
    }

    return s0;
  }

  function peg$parsestring() {
    var s0, s1, s2, s3;

    peg$silentFails++;
    s0 = peg$currPos;
    s1 = peg$parsequotation_mark();
    if (s1 !== peg$FAILED) {
      s2 = [];
      s3 = peg$parsechar();
      while (s3 !== peg$FAILED) {
        s2.push(s3);
        s3 = peg$parsechar();
      }
      if (s2 !== peg$FAILED) {
        s3 = peg$parsequotation_mark();
        if (s3 !== peg$FAILED) {
          peg$savedPos = s0;
          s1 = peg$c45(s2);
          s0 = s1;
        } else {
          peg$currPos = s0;
          s0 = peg$FAILED;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }
    } else {
      peg$currPos = s0;
      s0 = peg$FAILED;
    }
    peg$silentFails--;
    if (s0 === peg$FAILED) {
      s1 = peg$FAILED;
      if (peg$silentFails === 0) { peg$fail(peg$c44); }
    }

    return s0;
  }

  function peg$parsechar() {
    var s0, s1, s2, s3, s4, s5, s6, s7, s8, s9;

    s0 = peg$parseunescaped();
    if (s0 === peg$FAILED) {
      if (input.charCodeAt(peg$currPos) === 10) {
        s0 = peg$c46;
        peg$currPos++;
      } else {
        s0 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c47); }
      }
      if (s0 === peg$FAILED) {
        if (input.charCodeAt(peg$currPos) === 9) {
          s0 = peg$c48;
          peg$currPos++;
        } else {
          s0 = peg$FAILED;
          if (peg$silentFails === 0) { peg$fail(peg$c49); }
        }
        if (s0 === peg$FAILED) {
          s0 = peg$currPos;
          s1 = peg$parseescape();
          if (s1 !== peg$FAILED) {
            if (input.charCodeAt(peg$currPos) === 34) {
              s2 = peg$c50;
              peg$currPos++;
            } else {
              s2 = peg$FAILED;
              if (peg$silentFails === 0) { peg$fail(peg$c51); }
            }
            if (s2 === peg$FAILED) {
              if (input.charCodeAt(peg$currPos) === 92) {
                s2 = peg$c52;
                peg$currPos++;
              } else {
                s2 = peg$FAILED;
                if (peg$silentFails === 0) { peg$fail(peg$c53); }
              }
              if (s2 === peg$FAILED) {
                if (input.charCodeAt(peg$currPos) === 47) {
                  s2 = peg$c54;
                  peg$currPos++;
                } else {
                  s2 = peg$FAILED;
                  if (peg$silentFails === 0) { peg$fail(peg$c55); }
                }
                if (s2 === peg$FAILED) {
                  s2 = peg$currPos;
                  if (input.charCodeAt(peg$currPos) === 98) {
                    s3 = peg$c56;
                    peg$currPos++;
                  } else {
                    s3 = peg$FAILED;
                    if (peg$silentFails === 0) { peg$fail(peg$c57); }
                  }
                  if (s3 !== peg$FAILED) {
                    peg$savedPos = s2;
                    s3 = peg$c58();
                  }
                  s2 = s3;
                  if (s2 === peg$FAILED) {
                    s2 = peg$currPos;
                    if (input.charCodeAt(peg$currPos) === 102) {
                      s3 = peg$c59;
                      peg$currPos++;
                    } else {
                      s3 = peg$FAILED;
                      if (peg$silentFails === 0) { peg$fail(peg$c60); }
                    }
                    if (s3 !== peg$FAILED) {
                      peg$savedPos = s2;
                      s3 = peg$c61();
                    }
                    s2 = s3;
                    if (s2 === peg$FAILED) {
                      s2 = peg$currPos;
                      if (input.charCodeAt(peg$currPos) === 110) {
                        s3 = peg$c62;
                        peg$currPos++;
                      } else {
                        s3 = peg$FAILED;
                        if (peg$silentFails === 0) { peg$fail(peg$c63); }
                      }
                      if (s3 !== peg$FAILED) {
                        peg$savedPos = s2;
                        s3 = peg$c64();
                      }
                      s2 = s3;
                      if (s2 === peg$FAILED) {
                        s2 = peg$currPos;
                        if (input.charCodeAt(peg$currPos) === 114) {
                          s3 = peg$c65;
                          peg$currPos++;
                        } else {
                          s3 = peg$FAILED;
                          if (peg$silentFails === 0) { peg$fail(peg$c66); }
                        }
                        if (s3 !== peg$FAILED) {
                          peg$savedPos = s2;
                          s3 = peg$c67();
                        }
                        s2 = s3;
                        if (s2 === peg$FAILED) {
                          s2 = peg$currPos;
                          if (input.charCodeAt(peg$currPos) === 116) {
                            s3 = peg$c68;
                            peg$currPos++;
                          } else {
                            s3 = peg$FAILED;
                            if (peg$silentFails === 0) { peg$fail(peg$c69); }
                          }
                          if (s3 !== peg$FAILED) {
                            peg$savedPos = s2;
                            s3 = peg$c70();
                          }
                          s2 = s3;
                          if (s2 === peg$FAILED) {
                            s2 = peg$currPos;
                            if (input.charCodeAt(peg$currPos) === 117) {
                              s3 = peg$c71;
                              peg$currPos++;
                            } else {
                              s3 = peg$FAILED;
                              if (peg$silentFails === 0) { peg$fail(peg$c72); }
                            }
                            if (s3 !== peg$FAILED) {
                              s4 = peg$currPos;
                              s5 = peg$currPos;
                              s6 = peg$parseHEXDIG();
                              if (s6 !== peg$FAILED) {
                                s7 = peg$parseHEXDIG();
                                if (s7 !== peg$FAILED) {
                                  s8 = peg$parseHEXDIG();
                                  if (s8 !== peg$FAILED) {
                                    s9 = peg$parseHEXDIG();
                                    if (s9 !== peg$FAILED) {
                                      s6 = [s6, s7, s8, s9];
                                      s5 = s6;
                                    } else {
                                      peg$currPos = s5;
                                      s5 = peg$FAILED;
                                    }
                                  } else {
                                    peg$currPos = s5;
                                    s5 = peg$FAILED;
                                  }
                                } else {
                                  peg$currPos = s5;
                                  s5 = peg$FAILED;
                                }
                              } else {
                                peg$currPos = s5;
                                s5 = peg$FAILED;
                              }
                              if (s5 !== peg$FAILED) {
                                s4 = input.substring(s4, peg$currPos);
                              } else {
                                s4 = s5;
                              }
                              if (s4 !== peg$FAILED) {
                                peg$savedPos = s2;
                                s3 = peg$c73(s4);
                                s2 = s3;
                              } else {
                                peg$currPos = s2;
                                s2 = peg$FAILED;
                              }
                            } else {
                              peg$currPos = s2;
                              s2 = peg$FAILED;
                            }
                          }
                        }
                      }
                    }
                  }
                }
              }
            }
            if (s2 !== peg$FAILED) {
              peg$savedPos = s0;
              s1 = peg$c74(s2);
              s0 = s1;
            } else {
              peg$currPos = s0;
              s0 = peg$FAILED;
            }
          } else {
            peg$currPos = s0;
            s0 = peg$FAILED;
          }
        }
      }
    }

    return s0;
  }

  function peg$parseescape() {
    var s0;

    if (input.charCodeAt(peg$currPos) === 92) {
      s0 = peg$c52;
      peg$currPos++;
    } else {
      s0 = peg$FAILED;
      if (peg$silentFails === 0) { peg$fail(peg$c53); }
    }

    return s0;
  }

  function peg$parsequotation_mark() {
    var s0;

    if (input.charCodeAt(peg$currPos) === 34) {
      s0 = peg$c50;
      peg$currPos++;
    } else {
      s0 = peg$FAILED;
      if (peg$silentFails === 0) { peg$fail(peg$c51); }
    }

    return s0;
  }

  function peg$parseunescaped() {
    var s0;

    if (peg$c75.test(input.charAt(peg$currPos))) {
      s0 = input.charAt(peg$currPos);
      peg$currPos++;
    } else {
      s0 = peg$FAILED;
      if (peg$silentFails === 0) { peg$fail(peg$c76); }
    }

    return s0;
  }

  function peg$parseunquoted_string() {
    var s0, s1, s2, s3;

    peg$silentFails++;
    s0 = peg$currPos;
    s1 = peg$parsefirst_unquoted_char();
    if (s1 !== peg$FAILED) {
      s2 = [];
      s3 = peg$parseunquoted_char();
      while (s3 !== peg$FAILED) {
        s2.push(s3);
        s3 = peg$parseunquoted_char();
      }
      if (s2 !== peg$FAILED) {
        peg$savedPos = s0;
        s1 = peg$c78(s1, s2);
        s0 = s1;
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }
    } else {
      peg$currPos = s0;
      s0 = peg$FAILED;
    }
    peg$silentFails--;
    if (s0 === peg$FAILED) {
      s1 = peg$FAILED;
      if (peg$silentFails === 0) { peg$fail(peg$c77); }
    }

    return s0;
  }

  function peg$parsefirst_unquoted_char() {
    var s0;

    if (peg$c79.test(input.charAt(peg$currPos))) {
      s0 = input.charAt(peg$currPos);
      peg$currPos++;
    } else {
      s0 = peg$FAILED;
      if (peg$silentFails === 0) { peg$fail(peg$c80); }
    }

    return s0;
  }

  function peg$parseunquoted_char() {
    var s0;

    if (peg$c81.test(input.charAt(peg$currPos))) {
      s0 = input.charAt(peg$currPos);
      peg$currPos++;
    } else {
      s0 = peg$FAILED;
      if (peg$silentFails === 0) { peg$fail(peg$c82); }
    }

    return s0;
  }

  function peg$parsedate() {
    var s0, s1, s2, s3;

    peg$silentFails++;
    s0 = peg$currPos;
    if (input.substr(peg$currPos, 4) === peg$c84) {
      s1 = peg$c84;
      peg$currPos += 4;
    } else {
      s1 = peg$FAILED;
      if (peg$silentFails === 0) { peg$fail(peg$c85); }
    }
    if (s1 !== peg$FAILED) {
      s2 = peg$parsews();
      if (s2 !== peg$FAILED) {
        s3 = peg$parsestring();
        if (s3 !== peg$FAILED) {
          peg$savedPos = s0;
          s1 = peg$c86(s3);
          s0 = s1;
        } else {
          peg$currPos = s0;
          s0 = peg$FAILED;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }
    } else {
      peg$currPos = s0;
      s0 = peg$FAILED;
    }
    peg$silentFails--;
    if (s0 === peg$FAILED) {
      s1 = peg$FAILED;
      if (peg$silentFails === 0) { peg$fail(peg$c83); }
    }

    return s0;
  }

  function peg$parseDIGIT() {
    var s0;

    if (peg$c87.test(input.charAt(peg$currPos))) {
      s0 = input.charAt(peg$currPos);
      peg$currPos++;
    } else {
      s0 = peg$FAILED;
      if (peg$silentFails === 0) { peg$fail(peg$c88); }
    }

    return s0;
  }

  function peg$parseHEXDIG() {
    var s0;

    if (peg$c89.test(input.charAt(peg$currPos))) {
      s0 = input.charAt(peg$currPos);
      peg$currPos++;
    } else {
      s0 = peg$FAILED;
      if (peg$silentFails === 0) { peg$fail(peg$c90); }
    }

    return s0;
  }

  peg$result = peg$startRuleFunction();

  if (peg$result !== peg$FAILED && peg$currPos === input.length) {
    return peg$result;
  } else {
    if (peg$result !== peg$FAILED && peg$currPos < input.length) {
      peg$fail(peg$endExpectation());
    }

    throw peg$buildStructuredError(
      peg$maxFailExpected,
      peg$maxFailPos < input.length ? input.charAt(peg$maxFailPos) : null,
      peg$maxFailPos < input.length
        ? peg$computeLocation(peg$maxFailPos, peg$maxFailPos + 1)
        : peg$computeLocation(peg$maxFailPos, peg$maxFailPos)
    );
  }
}

var osaParser = {
  SyntaxError: peg$SyntaxError,
  parse:       peg$parse
};

/**
 * Serialize a javascript object to AppleScript
 */
function serializeObject(value) {
	if (value === null) {
		return '';
	}
	var result;
	var typeOf = typeof value;

	if (typeOf === 'object' && (value !== null)) {
		result = '{';
		if (Array.isArray(value)) {
			value.forEach(function (arrayValue, i) {
				if (i !== 0) {
					result += ',';
				}
				result += serializeObject(arrayValue);
			});
		} else {
			Object.keys(value).forEach(function (key, i) {
				if (i !== 0) {
					result += ',';
				}
				result += key + ':' + serializeObject(value[key]);
			});
		}

		result += '}';
	} else if (typeOf === 'string') {
		result = '"' + value + '"';
	} else if (value === undefined) {
		result = 'null';
	}

	return result || value;
}

var osaVargen = {
	serializeObject: serializeObject,
  // Generate apple script from javascript object
	generate: function (object) {
		var aScript = '';

		Object.keys(object).forEach(function (key) {
			aScript += 'set ' + key + ' to ' + serializeObject(object[key]) + '\n';
		});

		return aScript;
	}
};

var spawn = require$$0__default['default'].spawn;
var dirname = require$$1__default['default'].dirname;
var readFileSync = require$$2__default['default'].readFileSync;



var parse$1 = osaParser.parse;
var varGenerator = osaVargen.generate;

var bufferStream = function (stream) {
	var buffer = new buffers();
	stream.on('data', function (chunk) {
		buffer.push(chunk);
	});
	return buffer;
};

var execute = function (path, script, vars, cb) {
	if (cb === undefined) {
		cb = vars;
	}
	var opts;
	if (typeof path === 'undefined') {
		opts = {};
	} else {
		opts = {cwd: dirname(path)};
	}

	var cp = spawn('osascript', ['-ss', '-'], opts);

	var outBuffer = bufferStream(cp.stdout);
	var errBuffer = bufferStream(cp.stderr);

	cp.on('close', function (code) {
		var error;
		var result;

		if (code) {
			error = new Error(errBuffer.toString());
		} else {
			try {
				result = parse$1(outBuffer.toString());
			} catch (err) {
				error = err;
			}
		}

		if (cb) {
			cb(error, result, outBuffer);
		}
	});

	if (!script) {
		script = readFileSync(path);
	}

	if (vars) {
		script = varGenerator(vars) + '\n' + script;
	}

	cp.stdin.write(script);
	cp.stdin.end();

	return cp;
};

var lib = {
	execute: function (script, vars, cb) {
		return execute(undefined, script, vars, cb);
	},
	executeFile: function (path, vars, cb) {
		return execute(path, undefined, vars, cb);
	}
};

const executor = (script, variables, callback) => {
    let childProcess = lib.execute(script, variables, (err, res, raw) => {
        if (err)
            throw err;
        callback(res, raw);
    });
    setTimeout(() => {
        childProcess.stdin.pause();
        childProcess.kill();
    }, 30000);
};
class AppleList {
    constructor(properties) {
        this.reminders = new Map();
        this.className = "apple-list";
        this.stale = true;
        this.properties = properties;
        this.syncReminders();
        setInterval(() => {
            this.syncReminders();
        }, 60000);
    }
    sync() {
        return new Promise((resolve, reject) => {
            console.log('syncing');
            executor(`tell application "Reminders"
                    try
                        return properties of list list_name
                    on error
                        set lis to make new list
                        set name of lis to list_name
                        return properties of lis
                    end try
                end tell`, { list_name: this.properties.name }, (res, raw) => {
                logger(this, "Sync", { res, raw });
                var temp = Object.assign(Object.assign({}, this.properties), res);
                this.properties = temp;
                resolve(this);
            });
        });
    }
    syncReminders() {
        return new Promise((resolve, reject) => {
            executor(`tell list list_name in application "Reminders"
            	    set buffer to ((current date) - hours * 1)
            	    return properties of reminders whose completion date comes after buffer or completed is false	
                end tell`, { list_name: this.properties.name }, (res, raw) => {
                if (res && res.length > 0) {
                    res.forEach(element => {
                        // logger(this, "Reminder", element);
                        this.addReminder(element);
                    });
                }
                resolve(Array.from(this.reminders, ([name, val]) => val));
            });
        });
    }
    getReminders() {
        return Array.from(this.reminders, ([name, val]) => val);
    }
    update(properties) {
        return __awaiter(this, void 0, void 0, function* () {
            return this;
        });
    }
    addReminder(reminder) {
        let rem = this.reminders.get(reminder.name);
        if (rem) {
            rem.properties = reminder;
        }
        else
            this.reminders.set(reminder.name, new AppleReminder(reminder, this));
    }
    addCustomReminder(properties) {
        logger(this, "Adding Custom Rmeinder", properties);
        lib.execute(`tell list list_name in application "Reminders"
                                try
                                    return properties of reminder reminder_name
                                on error
                                    set rem to make new reminder
                                    set name of rem to reminder_name
                                    return properties of rem
                                end try
                            end tell`, { list_name: this.properties.name, reminder_name: properties.name }, (err, res, raw) => {
            if (err)
                throw err;
            logger(this, "Made Custom Reminder", { err, res, raw });
            this.addReminder(res);
        });
    }
    getReminder(name) {
        return this.reminders.get(name);
    }
    toString() {
        return this.properties.toString();
    }
}
class AppleReminder {
    constructor(properties, parent) {
        this.container = parent;
        this.properties = properties;
    }
    sync() {
        return __awaiter(this, void 0, void 0, function* () {
            logger(this, "Sync Reminder", this.properties);
            return this;
        });
    }
    update(properties) {
        return __awaiter(this, void 0, void 0, function* () {
            logger(this, "NeedsUpdate", { from: this.properties, to: properties });
            var temp = Object.assign(Object.assign({}, this.properties), properties);
            this.properties = temp;
            return this;
        });
    }
    markDone() {
        return __awaiter(this, void 0, void 0, function* () {
            lib.execute(`tell list list_name in application "Reminders"
                                set rem to reminder reminder_name
                                set completed in rem to true
                                return properties of rem
                            end tell`, { list_name: this.container.properties.name, reminder_name: this.properties.name }, (err, res, raw) => {
                logger(this, "Marked Done", { err, res, raw });
                this.properties = Object.assign(Object.assign({}, this.properties), res);
            });
            // return await this.update({ name: this.properties.name, completed: true });
        });
    }
    markNotDone() {
        return __awaiter(this, void 0, void 0, function* () {
            lib.execute(`tell list list_name in application "Reminders"
                                set rem to reminder reminder_name
                                set completed in rem to false
                                return properties of rem
                            end tell`, { list_name: this.container.properties.name, reminder_name: this.properties.name }, (err, res, raw) => {
                logger(this, "Marked Not Done", { err, res, raw });
                this.properties = Object.assign(Object.assign({}, this.properties), res);
            });
        });
    }
    toString() {
        return this.properties.toString();
    }
}

/* src/ui/Reminder.svelte generated by Svelte v3.29.7 */

function add_css() {
	var style = element("style");
	style.id = "svelte-1wwji2u-style";
	style.textContent = ".checkbox-round.svelte-1wwji2u{width:1.3em;height:1.3em;background-color:rgba(255, 255, 255, 0);border-radius:50%;vertical-align:middle;border:1px solid rgb(170, 168, 168);-webkit-appearance:none;outline:none;cursor:pointer}.checkbox-round.svelte-1wwji2u:checked{background-color:gray}.apple-reminder-name.svelte-1wwji2u{padding-left:1rem}";
	append(document.head, style);
}

function create_fragment(ctx) {
	let input;
	let input_checked_value;
	let t0;
	let span;
	let t1_value = /*m*/ ctx[1].name + "";
	let t1;
	let mounted;
	let dispose;

	return {
		c() {
			input = element("input");
			t0 = space();
			span = element("span");
			t1 = text(t1_value);
			attr(input, "type", "checkbox");
			attr(input, "class", "checkbox-round svelte-1wwji2u");
			input.checked = input_checked_value = /*m*/ ctx[1].completed;
			attr(span, "class", "apple-reminder-name svelte-1wwji2u");
		},
		m(target, anchor) {
			insert(target, input, anchor);
			insert(target, t0, anchor);
			insert(target, span, anchor);
			append(span, t1);

			if (!mounted) {
				dispose = listen(input, "change", /*change_handler*/ ctx[2]);
				mounted = true;
			}
		},
		p(ctx, [dirty]) {
			if (dirty & /*m*/ 2 && input_checked_value !== (input_checked_value = /*m*/ ctx[1].completed)) {
				input.checked = input_checked_value;
			}

			if (dirty & /*m*/ 2 && t1_value !== (t1_value = /*m*/ ctx[1].name + "")) set_data(t1, t1_value);
		},
		i: noop,
		o: noop,
		d(detaching) {
			if (detaching) detach(input);
			if (detaching) detach(t0);
			if (detaching) detach(span);
			mounted = false;
			dispose();
		}
	};
}

function instance($$self, $$props, $$invalidate) {
	let { model } = $$props;

	setInterval(
		() => {
			$$invalidate(1, m = model.properties);
		},
		1000
	);

	const change_handler = event => {
		if (event.target.checked) model.markDone(); else model.markNotDone();
	};

	$$self.$$set = $$props => {
		if ("model" in $$props) $$invalidate(0, model = $$props.model);
	};

	let m;

	$$self.$$.update = () => {
		if ($$self.$$.dirty & /*model*/ 1) {
			 $$invalidate(1, m = model.properties);
		}
	};

	return [model, m, change_handler];
}

class Reminder extends SvelteComponent {
	constructor(options) {
		super();
		if (!document.getElementById("svelte-1wwji2u-style")) add_css();
		init(this, options, instance, create_fragment, safe_not_equal, { model: 0 });
	}
}

/* src/ui/List.svelte generated by Svelte v3.29.7 */

function get_each_context(ctx, list, i) {
	const child_ctx = ctx.slice();
	child_ctx[3] = list[i];
	child_ctx[5] = i;
	return child_ctx;
}

// (20:1) {#each rems as reminder, i}
function create_each_block(ctx) {
	let reminderhtml;
	let br;
	let current;
	reminderhtml = new Reminder({ props: { model: /*reminder*/ ctx[3] } });

	return {
		c() {
			create_component(reminderhtml.$$.fragment);
			br = element("br");
		},
		m(target, anchor) {
			mount_component(reminderhtml, target, anchor);
			insert(target, br, anchor);
			current = true;
		},
		p(ctx, dirty) {
			const reminderhtml_changes = {};
			if (dirty & /*rems*/ 2) reminderhtml_changes.model = /*reminder*/ ctx[3];
			reminderhtml.$set(reminderhtml_changes);
		},
		i(local) {
			if (current) return;
			transition_in(reminderhtml.$$.fragment, local);
			current = true;
		},
		o(local) {
			transition_out(reminderhtml.$$.fragment, local);
			current = false;
		},
		d(detaching) {
			destroy_component(reminderhtml, detaching);
			if (detaching) detach(br);
		}
	};
}

function create_fragment$1(ctx) {
	let div;
	let hr0;
	let t0;
	let h2;
	let span;
	let t1_value = /*model*/ ctx[0].properties.name + "";
	let t1;
	let t2;
	let t3;
	let br;
	let t4;
	let button;
	let t6;
	let hr1;
	let current;
	let mounted;
	let dispose;
	let each_value = /*rems*/ ctx[1];
	let each_blocks = [];

	for (let i = 0; i < each_value.length; i += 1) {
		each_blocks[i] = create_each_block(get_each_context(ctx, each_value, i));
	}

	const out = i => transition_out(each_blocks[i], 1, 1, () => {
		each_blocks[i] = null;
	});

	return {
		c() {
			div = element("div");
			hr0 = element("hr");
			t0 = space();
			h2 = element("h2");
			span = element("span");
			t1 = text(t1_value);
			t2 = space();

			for (let i = 0; i < each_blocks.length; i += 1) {
				each_blocks[i].c();
			}

			t3 = space();
			br = element("br");
			t4 = space();
			button = element("button");
			button.textContent = "Refresh";
			t6 = space();
			hr1 = element("hr");
			set_style(span, "color", /*model*/ ctx[0].properties.color);
			attr(hr1, "class", "apple-list-bottom-rule");
			attr(div, "class", "apple-list-container");
		},
		m(target, anchor) {
			insert(target, div, anchor);
			append(div, hr0);
			append(div, t0);
			append(div, h2);
			append(h2, span);
			append(span, t1);
			append(div, t2);

			for (let i = 0; i < each_blocks.length; i += 1) {
				each_blocks[i].m(div, null);
			}

			append(div, t3);
			append(div, br);
			append(div, t4);
			append(div, button);
			append(div, t6);
			append(div, hr1);
			current = true;

			if (!mounted) {
				dispose = listen(button, "click", /*refresh*/ ctx[2]);
				mounted = true;
			}
		},
		p(ctx, [dirty]) {
			if ((!current || dirty & /*model*/ 1) && t1_value !== (t1_value = /*model*/ ctx[0].properties.name + "")) set_data(t1, t1_value);

			if (!current || dirty & /*model*/ 1) {
				set_style(span, "color", /*model*/ ctx[0].properties.color);
			}

			if (dirty & /*rems*/ 2) {
				each_value = /*rems*/ ctx[1];
				let i;

				for (i = 0; i < each_value.length; i += 1) {
					const child_ctx = get_each_context(ctx, each_value, i);

					if (each_blocks[i]) {
						each_blocks[i].p(child_ctx, dirty);
						transition_in(each_blocks[i], 1);
					} else {
						each_blocks[i] = create_each_block(child_ctx);
						each_blocks[i].c();
						transition_in(each_blocks[i], 1);
						each_blocks[i].m(div, t3);
					}
				}

				group_outros();

				for (i = each_value.length; i < each_blocks.length; i += 1) {
					out(i);
				}

				check_outros();
			}
		},
		i(local) {
			if (current) return;

			for (let i = 0; i < each_value.length; i += 1) {
				transition_in(each_blocks[i]);
			}

			current = true;
		},
		o(local) {
			each_blocks = each_blocks.filter(Boolean);

			for (let i = 0; i < each_blocks.length; i += 1) {
				transition_out(each_blocks[i]);
			}

			current = false;
		},
		d(detaching) {
			if (detaching) detach(div);
			destroy_each(each_blocks, detaching);
			mounted = false;
			dispose();
		}
	};
}

function instance$1($$self, $$props, $$invalidate) {
	let { model } = $$props;

	function refresh() {
		// console.log("Refreshig list");
		$$invalidate(1, rems = Array.from(model.reminders, ([name, val]) => val));
	}

	setInterval(refresh, 1000);

	$$self.$$set = $$props => {
		if ("model" in $$props) $$invalidate(0, model = $$props.model);
	};

	let rems;

	$$self.$$.update = () => {
		if ($$self.$$.dirty & /*model*/ 1) {
			 $$invalidate(1, rems = Array.from(model.reminders, ([name, val]) => val));
		}
	};

	return [model, rems, refresh];
}

class List extends SvelteComponent {
	constructor(options) {
		super();
		init(this, options, instance$1, create_fragment$1, safe_not_equal, { model: 0 });
	}
}

// import { MainInterface } from './models/MainInterface';
obsidian.addIcon("reminders-app", RibbonIcon);
class AppleRemindersPlugin extends obsidian.Plugin {
    constructor(app, manifest) {
        super(app, manifest);
        // private view: MainInterface;
        this.lists = new Map();
        this.statusBar = new StatusBar(this.addStatusBarItem());
        this.statusBar.message("Apple Reminders Sync Enabled");
        this.cache = new Cache(this);
        this.injections = [];
    }
    onload() {
        return __awaiter(this, void 0, void 0, function* () {
            logger(this, "Apple Reminders Plugin is Loading...");
            this.registerInterval(window.setInterval(this.injectQueries.bind(this), 1000));
            // We need to manually call destroy on the injected Svelte components when they are removed.
            this.observer = new MutationObserver((mutations, observer) => {
                if (this.injections.length == 0) {
                    return;
                }
                mutations.forEach((mutation) => {
                    mutation.removedNodes.forEach((removed) => {
                        const removedIndex = this.injections.findIndex((ele) => ele.workspaceLeaf == removed);
                        if (removedIndex == -1) {
                            return;
                        }
                        const { workspaceLeaf, component } = this.injections[removedIndex];
                        logger(this, "Removing mounted Svelte component", {
                            root: workspaceLeaf,
                            component: component,
                        });
                        this.injections.splice(removedIndex, 1);
                        component.$destroy();
                    });
                });
            });
            const workspaceRoot = document.getElementsByClassName("workspace")[0];
            this.observer.observe(workspaceRoot, { childList: true, subtree: true });
        });
    }
    injectQueries() {
        return __awaiter(this, void 0, void 0, function* () {
            var settings;
            let settingsElements = document.querySelectorAll(`pre[class*="${REMINDERS_CLASS}"]`);
            for (let i = 0; i < settingsElements.length; ++i) {
                let node = settingsElements[i];
                settings = jsYaml$1.load(node.innerText);
                logger(this, "Settings", settings);
                if (!settings.list)
                    throw ("No List Specified!");
                let lst = this.lists.get(settings.list);
                if (!lst) {
                    lst = yield (new AppleList({ name: settings.list })).sync();
                    logger(this, "Created New List", lst);
                    this.lists.set(settings.list, lst);
                    // this.view.addList(lst);
                }
                if (settings.reminders) {
                    settings.reminders.forEach(elem => {
                        logger(this, "Custom Reminders", { name: elem, completed: false });
                        lst.addCustomReminder({ name: elem, completed: false });
                    });
                }
                logger(this, "Found Main Reminders.app block.", { context: node });
                this.statusBar.message("Found Reminders Block", 10000);
                const root = node.parentElement;
                if (root) {
                    root.removeChild(node);
                    let queryNode = new List({
                        target: root,
                        props: {
                            model: lst
                        }
                    });
                    const workspaceLeaf = root.closest(".workspace-leaf");
                    workspaceLeaf.classList.add("contains-reminder-list");
                    const injection = {
                        component: queryNode,
                        workspaceLeaf: workspaceLeaf,
                    };
                    logger(this, "Injected into Main Reminders.app Block.", { context: injection });
                    this.injections.push(injection);
                }
                else {
                    logger(this, "UNDEFINED", node);
                }
            }
        });
    }
    onunload() {
        logger(this, "Apple Reminders Plugin is Unloading...");
        this.observer.disconnect();
        this.observer = null;
        this.injections.forEach((injection) => injection.component.$destroy());
        this.injections = [];
        this.app.workspace.getLeavesOfType("apple-reminders-interface").forEach((leaf) => leaf.detach());
    }
}

module.exports = AppleRemindersPlugin;
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibWFpbi5qcyIsInNvdXJjZXMiOlsibm9kZV9tb2R1bGVzL3RzbGliL3RzbGliLmVzNi5qcyIsIm5vZGVfbW9kdWxlcy9qcy15YW1sL2xpYi9qcy15YW1sL2NvbW1vbi5qcyIsIm5vZGVfbW9kdWxlcy9qcy15YW1sL2xpYi9qcy15YW1sL2V4Y2VwdGlvbi5qcyIsIm5vZGVfbW9kdWxlcy9qcy15YW1sL2xpYi9qcy15YW1sL21hcmsuanMiLCJub2RlX21vZHVsZXMvanMteWFtbC9saWIvanMteWFtbC90eXBlLmpzIiwibm9kZV9tb2R1bGVzL2pzLXlhbWwvbGliL2pzLXlhbWwvc2NoZW1hLmpzIiwibm9kZV9tb2R1bGVzL2pzLXlhbWwvbGliL2pzLXlhbWwvdHlwZS9zdHIuanMiLCJub2RlX21vZHVsZXMvanMteWFtbC9saWIvanMteWFtbC90eXBlL3NlcS5qcyIsIm5vZGVfbW9kdWxlcy9qcy15YW1sL2xpYi9qcy15YW1sL3R5cGUvbWFwLmpzIiwibm9kZV9tb2R1bGVzL2pzLXlhbWwvbGliL2pzLXlhbWwvc2NoZW1hL2ZhaWxzYWZlLmpzIiwibm9kZV9tb2R1bGVzL2pzLXlhbWwvbGliL2pzLXlhbWwvdHlwZS9udWxsLmpzIiwibm9kZV9tb2R1bGVzL2pzLXlhbWwvbGliL2pzLXlhbWwvdHlwZS9ib29sLmpzIiwibm9kZV9tb2R1bGVzL2pzLXlhbWwvbGliL2pzLXlhbWwvdHlwZS9pbnQuanMiLCJub2RlX21vZHVsZXMvanMteWFtbC9saWIvanMteWFtbC90eXBlL2Zsb2F0LmpzIiwibm9kZV9tb2R1bGVzL2pzLXlhbWwvbGliL2pzLXlhbWwvc2NoZW1hL2pzb24uanMiLCJub2RlX21vZHVsZXMvanMteWFtbC9saWIvanMteWFtbC9zY2hlbWEvY29yZS5qcyIsIm5vZGVfbW9kdWxlcy9qcy15YW1sL2xpYi9qcy15YW1sL3R5cGUvdGltZXN0YW1wLmpzIiwibm9kZV9tb2R1bGVzL2pzLXlhbWwvbGliL2pzLXlhbWwvdHlwZS9tZXJnZS5qcyIsIm5vZGVfbW9kdWxlcy9qcy15YW1sL2xpYi9qcy15YW1sL3R5cGUvYmluYXJ5LmpzIiwibm9kZV9tb2R1bGVzL2pzLXlhbWwvbGliL2pzLXlhbWwvdHlwZS9vbWFwLmpzIiwibm9kZV9tb2R1bGVzL2pzLXlhbWwvbGliL2pzLXlhbWwvdHlwZS9wYWlycy5qcyIsIm5vZGVfbW9kdWxlcy9qcy15YW1sL2xpYi9qcy15YW1sL3R5cGUvc2V0LmpzIiwibm9kZV9tb2R1bGVzL2pzLXlhbWwvbGliL2pzLXlhbWwvc2NoZW1hL2RlZmF1bHRfc2FmZS5qcyIsIm5vZGVfbW9kdWxlcy9qcy15YW1sL2xpYi9qcy15YW1sL3R5cGUvanMvdW5kZWZpbmVkLmpzIiwibm9kZV9tb2R1bGVzL2pzLXlhbWwvbGliL2pzLXlhbWwvdHlwZS9qcy9yZWdleHAuanMiLCJub2RlX21vZHVsZXMvanMteWFtbC9saWIvanMteWFtbC90eXBlL2pzL2Z1bmN0aW9uLmpzIiwibm9kZV9tb2R1bGVzL2pzLXlhbWwvbGliL2pzLXlhbWwvc2NoZW1hL2RlZmF1bHRfZnVsbC5qcyIsIm5vZGVfbW9kdWxlcy9qcy15YW1sL2xpYi9qcy15YW1sL2xvYWRlci5qcyIsIm5vZGVfbW9kdWxlcy9qcy15YW1sL2xpYi9qcy15YW1sL2R1bXBlci5qcyIsIm5vZGVfbW9kdWxlcy9qcy15YW1sL2xpYi9qcy15YW1sLmpzIiwibm9kZV9tb2R1bGVzL2pzLXlhbWwvaW5kZXguanMiLCJzcmMvY29uc3RhbnRzLnRzIiwic3JjL3Rvb2xzLnRzIiwic3JjL2hlbHBlcnMudHMiLCJub2RlX21vZHVsZXMvc3ZlbHRlL2ludGVybmFsL2luZGV4Lm1qcyIsIm5vZGVfbW9kdWxlcy9idWZmZXJzL2luZGV4LmpzIiwibm9kZV9tb2R1bGVzL25vZGUtb3Nhc2NyaXB0L2xpYi9vc2EtcGFyc2VyLmpzIiwibm9kZV9tb2R1bGVzL25vZGUtb3Nhc2NyaXB0L2xpYi9vc2EtdmFyZ2VuLmpzIiwibm9kZV9tb2R1bGVzL25vZGUtb3Nhc2NyaXB0L2xpYi9pbmRleC5qcyIsInNyYy9tb2RlbHMvUmVtaW5kZXJzLmFwcC50cyIsInNyYy91aS9SZW1pbmRlci5zdmVsdGUiLCJzcmMvdWkvTGlzdC5zdmVsdGUiLCJzcmMvbWFpbi50cyJdLCJzb3VyY2VzQ29udGVudCI6WyIvKiEgKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKipcclxuQ29weXJpZ2h0IChjKSBNaWNyb3NvZnQgQ29ycG9yYXRpb24uXHJcblxyXG5QZXJtaXNzaW9uIHRvIHVzZSwgY29weSwgbW9kaWZ5LCBhbmQvb3IgZGlzdHJpYnV0ZSB0aGlzIHNvZnR3YXJlIGZvciBhbnlcclxucHVycG9zZSB3aXRoIG9yIHdpdGhvdXQgZmVlIGlzIGhlcmVieSBncmFudGVkLlxyXG5cclxuVEhFIFNPRlRXQVJFIElTIFBST1ZJREVEIFwiQVMgSVNcIiBBTkQgVEhFIEFVVEhPUiBESVNDTEFJTVMgQUxMIFdBUlJBTlRJRVMgV0lUSFxyXG5SRUdBUkQgVE8gVEhJUyBTT0ZUV0FSRSBJTkNMVURJTkcgQUxMIElNUExJRUQgV0FSUkFOVElFUyBPRiBNRVJDSEFOVEFCSUxJVFlcclxuQU5EIEZJVE5FU1MuIElOIE5PIEVWRU5UIFNIQUxMIFRIRSBBVVRIT1IgQkUgTElBQkxFIEZPUiBBTlkgU1BFQ0lBTCwgRElSRUNULFxyXG5JTkRJUkVDVCwgT1IgQ09OU0VRVUVOVElBTCBEQU1BR0VTIE9SIEFOWSBEQU1BR0VTIFdIQVRTT0VWRVIgUkVTVUxUSU5HIEZST01cclxuTE9TUyBPRiBVU0UsIERBVEEgT1IgUFJPRklUUywgV0hFVEhFUiBJTiBBTiBBQ1RJT04gT0YgQ09OVFJBQ1QsIE5FR0xJR0VOQ0UgT1JcclxuT1RIRVIgVE9SVElPVVMgQUNUSU9OLCBBUklTSU5HIE9VVCBPRiBPUiBJTiBDT05ORUNUSU9OIFdJVEggVEhFIFVTRSBPUlxyXG5QRVJGT1JNQU5DRSBPRiBUSElTIFNPRlRXQVJFLlxyXG4qKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKiAqL1xyXG4vKiBnbG9iYWwgUmVmbGVjdCwgUHJvbWlzZSAqL1xyXG5cclxudmFyIGV4dGVuZFN0YXRpY3MgPSBmdW5jdGlvbihkLCBiKSB7XHJcbiAgICBleHRlbmRTdGF0aWNzID0gT2JqZWN0LnNldFByb3RvdHlwZU9mIHx8XHJcbiAgICAgICAgKHsgX19wcm90b19fOiBbXSB9IGluc3RhbmNlb2YgQXJyYXkgJiYgZnVuY3Rpb24gKGQsIGIpIHsgZC5fX3Byb3RvX18gPSBiOyB9KSB8fFxyXG4gICAgICAgIGZ1bmN0aW9uIChkLCBiKSB7IGZvciAodmFyIHAgaW4gYikgaWYgKE9iamVjdC5wcm90b3R5cGUuaGFzT3duUHJvcGVydHkuY2FsbChiLCBwKSkgZFtwXSA9IGJbcF07IH07XHJcbiAgICByZXR1cm4gZXh0ZW5kU3RhdGljcyhkLCBiKTtcclxufTtcclxuXHJcbmV4cG9ydCBmdW5jdGlvbiBfX2V4dGVuZHMoZCwgYikge1xyXG4gICAgZXh0ZW5kU3RhdGljcyhkLCBiKTtcclxuICAgIGZ1bmN0aW9uIF9fKCkgeyB0aGlzLmNvbnN0cnVjdG9yID0gZDsgfVxyXG4gICAgZC5wcm90b3R5cGUgPSBiID09PSBudWxsID8gT2JqZWN0LmNyZWF0ZShiKSA6IChfXy5wcm90b3R5cGUgPSBiLnByb3RvdHlwZSwgbmV3IF9fKCkpO1xyXG59XHJcblxyXG5leHBvcnQgdmFyIF9fYXNzaWduID0gZnVuY3Rpb24oKSB7XHJcbiAgICBfX2Fzc2lnbiA9IE9iamVjdC5hc3NpZ24gfHwgZnVuY3Rpb24gX19hc3NpZ24odCkge1xyXG4gICAgICAgIGZvciAodmFyIHMsIGkgPSAxLCBuID0gYXJndW1lbnRzLmxlbmd0aDsgaSA8IG47IGkrKykge1xyXG4gICAgICAgICAgICBzID0gYXJndW1lbnRzW2ldO1xyXG4gICAgICAgICAgICBmb3IgKHZhciBwIGluIHMpIGlmIChPYmplY3QucHJvdG90eXBlLmhhc093blByb3BlcnR5LmNhbGwocywgcCkpIHRbcF0gPSBzW3BdO1xyXG4gICAgICAgIH1cclxuICAgICAgICByZXR1cm4gdDtcclxuICAgIH1cclxuICAgIHJldHVybiBfX2Fzc2lnbi5hcHBseSh0aGlzLCBhcmd1bWVudHMpO1xyXG59XHJcblxyXG5leHBvcnQgZnVuY3Rpb24gX19yZXN0KHMsIGUpIHtcclxuICAgIHZhciB0ID0ge307XHJcbiAgICBmb3IgKHZhciBwIGluIHMpIGlmIChPYmplY3QucHJvdG90eXBlLmhhc093blByb3BlcnR5LmNhbGwocywgcCkgJiYgZS5pbmRleE9mKHApIDwgMClcclxuICAgICAgICB0W3BdID0gc1twXTtcclxuICAgIGlmIChzICE9IG51bGwgJiYgdHlwZW9mIE9iamVjdC5nZXRPd25Qcm9wZXJ0eVN5bWJvbHMgPT09IFwiZnVuY3Rpb25cIilcclxuICAgICAgICBmb3IgKHZhciBpID0gMCwgcCA9IE9iamVjdC5nZXRPd25Qcm9wZXJ0eVN5bWJvbHMocyk7IGkgPCBwLmxlbmd0aDsgaSsrKSB7XHJcbiAgICAgICAgICAgIGlmIChlLmluZGV4T2YocFtpXSkgPCAwICYmIE9iamVjdC5wcm90b3R5cGUucHJvcGVydHlJc0VudW1lcmFibGUuY2FsbChzLCBwW2ldKSlcclxuICAgICAgICAgICAgICAgIHRbcFtpXV0gPSBzW3BbaV1dO1xyXG4gICAgICAgIH1cclxuICAgIHJldHVybiB0O1xyXG59XHJcblxyXG5leHBvcnQgZnVuY3Rpb24gX19kZWNvcmF0ZShkZWNvcmF0b3JzLCB0YXJnZXQsIGtleSwgZGVzYykge1xyXG4gICAgdmFyIGMgPSBhcmd1bWVudHMubGVuZ3RoLCByID0gYyA8IDMgPyB0YXJnZXQgOiBkZXNjID09PSBudWxsID8gZGVzYyA9IE9iamVjdC5nZXRPd25Qcm9wZXJ0eURlc2NyaXB0b3IodGFyZ2V0LCBrZXkpIDogZGVzYywgZDtcclxuICAgIGlmICh0eXBlb2YgUmVmbGVjdCA9PT0gXCJvYmplY3RcIiAmJiB0eXBlb2YgUmVmbGVjdC5kZWNvcmF0ZSA9PT0gXCJmdW5jdGlvblwiKSByID0gUmVmbGVjdC5kZWNvcmF0ZShkZWNvcmF0b3JzLCB0YXJnZXQsIGtleSwgZGVzYyk7XHJcbiAgICBlbHNlIGZvciAodmFyIGkgPSBkZWNvcmF0b3JzLmxlbmd0aCAtIDE7IGkgPj0gMDsgaS0tKSBpZiAoZCA9IGRlY29yYXRvcnNbaV0pIHIgPSAoYyA8IDMgPyBkKHIpIDogYyA+IDMgPyBkKHRhcmdldCwga2V5LCByKSA6IGQodGFyZ2V0LCBrZXkpKSB8fCByO1xyXG4gICAgcmV0dXJuIGMgPiAzICYmIHIgJiYgT2JqZWN0LmRlZmluZVByb3BlcnR5KHRhcmdldCwga2V5LCByKSwgcjtcclxufVxyXG5cclxuZXhwb3J0IGZ1bmN0aW9uIF9fcGFyYW0ocGFyYW1JbmRleCwgZGVjb3JhdG9yKSB7XHJcbiAgICByZXR1cm4gZnVuY3Rpb24gKHRhcmdldCwga2V5KSB7IGRlY29yYXRvcih0YXJnZXQsIGtleSwgcGFyYW1JbmRleCk7IH1cclxufVxyXG5cclxuZXhwb3J0IGZ1bmN0aW9uIF9fbWV0YWRhdGEobWV0YWRhdGFLZXksIG1ldGFkYXRhVmFsdWUpIHtcclxuICAgIGlmICh0eXBlb2YgUmVmbGVjdCA9PT0gXCJvYmplY3RcIiAmJiB0eXBlb2YgUmVmbGVjdC5tZXRhZGF0YSA9PT0gXCJmdW5jdGlvblwiKSByZXR1cm4gUmVmbGVjdC5tZXRhZGF0YShtZXRhZGF0YUtleSwgbWV0YWRhdGFWYWx1ZSk7XHJcbn1cclxuXHJcbmV4cG9ydCBmdW5jdGlvbiBfX2F3YWl0ZXIodGhpc0FyZywgX2FyZ3VtZW50cywgUCwgZ2VuZXJhdG9yKSB7XHJcbiAgICBmdW5jdGlvbiBhZG9wdCh2YWx1ZSkgeyByZXR1cm4gdmFsdWUgaW5zdGFuY2VvZiBQID8gdmFsdWUgOiBuZXcgUChmdW5jdGlvbiAocmVzb2x2ZSkgeyByZXNvbHZlKHZhbHVlKTsgfSk7IH1cclxuICAgIHJldHVybiBuZXcgKFAgfHwgKFAgPSBQcm9taXNlKSkoZnVuY3Rpb24gKHJlc29sdmUsIHJlamVjdCkge1xyXG4gICAgICAgIGZ1bmN0aW9uIGZ1bGZpbGxlZCh2YWx1ZSkgeyB0cnkgeyBzdGVwKGdlbmVyYXRvci5uZXh0KHZhbHVlKSk7IH0gY2F0Y2ggKGUpIHsgcmVqZWN0KGUpOyB9IH1cclxuICAgICAgICBmdW5jdGlvbiByZWplY3RlZCh2YWx1ZSkgeyB0cnkgeyBzdGVwKGdlbmVyYXRvcltcInRocm93XCJdKHZhbHVlKSk7IH0gY2F0Y2ggKGUpIHsgcmVqZWN0KGUpOyB9IH1cclxuICAgICAgICBmdW5jdGlvbiBzdGVwKHJlc3VsdCkgeyByZXN1bHQuZG9uZSA/IHJlc29sdmUocmVzdWx0LnZhbHVlKSA6IGFkb3B0KHJlc3VsdC52YWx1ZSkudGhlbihmdWxmaWxsZWQsIHJlamVjdGVkKTsgfVxyXG4gICAgICAgIHN0ZXAoKGdlbmVyYXRvciA9IGdlbmVyYXRvci5hcHBseSh0aGlzQXJnLCBfYXJndW1lbnRzIHx8IFtdKSkubmV4dCgpKTtcclxuICAgIH0pO1xyXG59XHJcblxyXG5leHBvcnQgZnVuY3Rpb24gX19nZW5lcmF0b3IodGhpc0FyZywgYm9keSkge1xyXG4gICAgdmFyIF8gPSB7IGxhYmVsOiAwLCBzZW50OiBmdW5jdGlvbigpIHsgaWYgKHRbMF0gJiAxKSB0aHJvdyB0WzFdOyByZXR1cm4gdFsxXTsgfSwgdHJ5czogW10sIG9wczogW10gfSwgZiwgeSwgdCwgZztcclxuICAgIHJldHVybiBnID0geyBuZXh0OiB2ZXJiKDApLCBcInRocm93XCI6IHZlcmIoMSksIFwicmV0dXJuXCI6IHZlcmIoMikgfSwgdHlwZW9mIFN5bWJvbCA9PT0gXCJmdW5jdGlvblwiICYmIChnW1N5bWJvbC5pdGVyYXRvcl0gPSBmdW5jdGlvbigpIHsgcmV0dXJuIHRoaXM7IH0pLCBnO1xyXG4gICAgZnVuY3Rpb24gdmVyYihuKSB7IHJldHVybiBmdW5jdGlvbiAodikgeyByZXR1cm4gc3RlcChbbiwgdl0pOyB9OyB9XHJcbiAgICBmdW5jdGlvbiBzdGVwKG9wKSB7XHJcbiAgICAgICAgaWYgKGYpIHRocm93IG5ldyBUeXBlRXJyb3IoXCJHZW5lcmF0b3IgaXMgYWxyZWFkeSBleGVjdXRpbmcuXCIpO1xyXG4gICAgICAgIHdoaWxlIChfKSB0cnkge1xyXG4gICAgICAgICAgICBpZiAoZiA9IDEsIHkgJiYgKHQgPSBvcFswXSAmIDIgPyB5W1wicmV0dXJuXCJdIDogb3BbMF0gPyB5W1widGhyb3dcIl0gfHwgKCh0ID0geVtcInJldHVyblwiXSkgJiYgdC5jYWxsKHkpLCAwKSA6IHkubmV4dCkgJiYgISh0ID0gdC5jYWxsKHksIG9wWzFdKSkuZG9uZSkgcmV0dXJuIHQ7XHJcbiAgICAgICAgICAgIGlmICh5ID0gMCwgdCkgb3AgPSBbb3BbMF0gJiAyLCB0LnZhbHVlXTtcclxuICAgICAgICAgICAgc3dpdGNoIChvcFswXSkge1xyXG4gICAgICAgICAgICAgICAgY2FzZSAwOiBjYXNlIDE6IHQgPSBvcDsgYnJlYWs7XHJcbiAgICAgICAgICAgICAgICBjYXNlIDQ6IF8ubGFiZWwrKzsgcmV0dXJuIHsgdmFsdWU6IG9wWzFdLCBkb25lOiBmYWxzZSB9O1xyXG4gICAgICAgICAgICAgICAgY2FzZSA1OiBfLmxhYmVsKys7IHkgPSBvcFsxXTsgb3AgPSBbMF07IGNvbnRpbnVlO1xyXG4gICAgICAgICAgICAgICAgY2FzZSA3OiBvcCA9IF8ub3BzLnBvcCgpOyBfLnRyeXMucG9wKCk7IGNvbnRpbnVlO1xyXG4gICAgICAgICAgICAgICAgZGVmYXVsdDpcclxuICAgICAgICAgICAgICAgICAgICBpZiAoISh0ID0gXy50cnlzLCB0ID0gdC5sZW5ndGggPiAwICYmIHRbdC5sZW5ndGggLSAxXSkgJiYgKG9wWzBdID09PSA2IHx8IG9wWzBdID09PSAyKSkgeyBfID0gMDsgY29udGludWU7IH1cclxuICAgICAgICAgICAgICAgICAgICBpZiAob3BbMF0gPT09IDMgJiYgKCF0IHx8IChvcFsxXSA+IHRbMF0gJiYgb3BbMV0gPCB0WzNdKSkpIHsgXy5sYWJlbCA9IG9wWzFdOyBicmVhazsgfVxyXG4gICAgICAgICAgICAgICAgICAgIGlmIChvcFswXSA9PT0gNiAmJiBfLmxhYmVsIDwgdFsxXSkgeyBfLmxhYmVsID0gdFsxXTsgdCA9IG9wOyBicmVhazsgfVxyXG4gICAgICAgICAgICAgICAgICAgIGlmICh0ICYmIF8ubGFiZWwgPCB0WzJdKSB7IF8ubGFiZWwgPSB0WzJdOyBfLm9wcy5wdXNoKG9wKTsgYnJlYWs7IH1cclxuICAgICAgICAgICAgICAgICAgICBpZiAodFsyXSkgXy5vcHMucG9wKCk7XHJcbiAgICAgICAgICAgICAgICAgICAgXy50cnlzLnBvcCgpOyBjb250aW51ZTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICBvcCA9IGJvZHkuY2FsbCh0aGlzQXJnLCBfKTtcclxuICAgICAgICB9IGNhdGNoIChlKSB7IG9wID0gWzYsIGVdOyB5ID0gMDsgfSBmaW5hbGx5IHsgZiA9IHQgPSAwOyB9XHJcbiAgICAgICAgaWYgKG9wWzBdICYgNSkgdGhyb3cgb3BbMV07IHJldHVybiB7IHZhbHVlOiBvcFswXSA/IG9wWzFdIDogdm9pZCAwLCBkb25lOiB0cnVlIH07XHJcbiAgICB9XHJcbn1cclxuXHJcbmV4cG9ydCB2YXIgX19jcmVhdGVCaW5kaW5nID0gT2JqZWN0LmNyZWF0ZSA/IChmdW5jdGlvbihvLCBtLCBrLCBrMikge1xyXG4gICAgaWYgKGsyID09PSB1bmRlZmluZWQpIGsyID0gaztcclxuICAgIE9iamVjdC5kZWZpbmVQcm9wZXJ0eShvLCBrMiwgeyBlbnVtZXJhYmxlOiB0cnVlLCBnZXQ6IGZ1bmN0aW9uKCkgeyByZXR1cm4gbVtrXTsgfSB9KTtcclxufSkgOiAoZnVuY3Rpb24obywgbSwgaywgazIpIHtcclxuICAgIGlmIChrMiA9PT0gdW5kZWZpbmVkKSBrMiA9IGs7XHJcbiAgICBvW2syXSA9IG1ba107XHJcbn0pO1xyXG5cclxuZXhwb3J0IGZ1bmN0aW9uIF9fZXhwb3J0U3RhcihtLCBvKSB7XHJcbiAgICBmb3IgKHZhciBwIGluIG0pIGlmIChwICE9PSBcImRlZmF1bHRcIiAmJiAhT2JqZWN0LnByb3RvdHlwZS5oYXNPd25Qcm9wZXJ0eS5jYWxsKG8sIHApKSBfX2NyZWF0ZUJpbmRpbmcobywgbSwgcCk7XHJcbn1cclxuXHJcbmV4cG9ydCBmdW5jdGlvbiBfX3ZhbHVlcyhvKSB7XHJcbiAgICB2YXIgcyA9IHR5cGVvZiBTeW1ib2wgPT09IFwiZnVuY3Rpb25cIiAmJiBTeW1ib2wuaXRlcmF0b3IsIG0gPSBzICYmIG9bc10sIGkgPSAwO1xyXG4gICAgaWYgKG0pIHJldHVybiBtLmNhbGwobyk7XHJcbiAgICBpZiAobyAmJiB0eXBlb2Ygby5sZW5ndGggPT09IFwibnVtYmVyXCIpIHJldHVybiB7XHJcbiAgICAgICAgbmV4dDogZnVuY3Rpb24gKCkge1xyXG4gICAgICAgICAgICBpZiAobyAmJiBpID49IG8ubGVuZ3RoKSBvID0gdm9pZCAwO1xyXG4gICAgICAgICAgICByZXR1cm4geyB2YWx1ZTogbyAmJiBvW2krK10sIGRvbmU6ICFvIH07XHJcbiAgICAgICAgfVxyXG4gICAgfTtcclxuICAgIHRocm93IG5ldyBUeXBlRXJyb3IocyA/IFwiT2JqZWN0IGlzIG5vdCBpdGVyYWJsZS5cIiA6IFwiU3ltYm9sLml0ZXJhdG9yIGlzIG5vdCBkZWZpbmVkLlwiKTtcclxufVxyXG5cclxuZXhwb3J0IGZ1bmN0aW9uIF9fcmVhZChvLCBuKSB7XHJcbiAgICB2YXIgbSA9IHR5cGVvZiBTeW1ib2wgPT09IFwiZnVuY3Rpb25cIiAmJiBvW1N5bWJvbC5pdGVyYXRvcl07XHJcbiAgICBpZiAoIW0pIHJldHVybiBvO1xyXG4gICAgdmFyIGkgPSBtLmNhbGwobyksIHIsIGFyID0gW10sIGU7XHJcbiAgICB0cnkge1xyXG4gICAgICAgIHdoaWxlICgobiA9PT0gdm9pZCAwIHx8IG4tLSA+IDApICYmICEociA9IGkubmV4dCgpKS5kb25lKSBhci5wdXNoKHIudmFsdWUpO1xyXG4gICAgfVxyXG4gICAgY2F0Y2ggKGVycm9yKSB7IGUgPSB7IGVycm9yOiBlcnJvciB9OyB9XHJcbiAgICBmaW5hbGx5IHtcclxuICAgICAgICB0cnkge1xyXG4gICAgICAgICAgICBpZiAociAmJiAhci5kb25lICYmIChtID0gaVtcInJldHVyblwiXSkpIG0uY2FsbChpKTtcclxuICAgICAgICB9XHJcbiAgICAgICAgZmluYWxseSB7IGlmIChlKSB0aHJvdyBlLmVycm9yOyB9XHJcbiAgICB9XHJcbiAgICByZXR1cm4gYXI7XHJcbn1cclxuXHJcbmV4cG9ydCBmdW5jdGlvbiBfX3NwcmVhZCgpIHtcclxuICAgIGZvciAodmFyIGFyID0gW10sIGkgPSAwOyBpIDwgYXJndW1lbnRzLmxlbmd0aDsgaSsrKVxyXG4gICAgICAgIGFyID0gYXIuY29uY2F0KF9fcmVhZChhcmd1bWVudHNbaV0pKTtcclxuICAgIHJldHVybiBhcjtcclxufVxyXG5cclxuZXhwb3J0IGZ1bmN0aW9uIF9fc3ByZWFkQXJyYXlzKCkge1xyXG4gICAgZm9yICh2YXIgcyA9IDAsIGkgPSAwLCBpbCA9IGFyZ3VtZW50cy5sZW5ndGg7IGkgPCBpbDsgaSsrKSBzICs9IGFyZ3VtZW50c1tpXS5sZW5ndGg7XHJcbiAgICBmb3IgKHZhciByID0gQXJyYXkocyksIGsgPSAwLCBpID0gMDsgaSA8IGlsOyBpKyspXHJcbiAgICAgICAgZm9yICh2YXIgYSA9IGFyZ3VtZW50c1tpXSwgaiA9IDAsIGpsID0gYS5sZW5ndGg7IGogPCBqbDsgaisrLCBrKyspXHJcbiAgICAgICAgICAgIHJba10gPSBhW2pdO1xyXG4gICAgcmV0dXJuIHI7XHJcbn07XHJcblxyXG5leHBvcnQgZnVuY3Rpb24gX19hd2FpdCh2KSB7XHJcbiAgICByZXR1cm4gdGhpcyBpbnN0YW5jZW9mIF9fYXdhaXQgPyAodGhpcy52ID0gdiwgdGhpcykgOiBuZXcgX19hd2FpdCh2KTtcclxufVxyXG5cclxuZXhwb3J0IGZ1bmN0aW9uIF9fYXN5bmNHZW5lcmF0b3IodGhpc0FyZywgX2FyZ3VtZW50cywgZ2VuZXJhdG9yKSB7XHJcbiAgICBpZiAoIVN5bWJvbC5hc3luY0l0ZXJhdG9yKSB0aHJvdyBuZXcgVHlwZUVycm9yKFwiU3ltYm9sLmFzeW5jSXRlcmF0b3IgaXMgbm90IGRlZmluZWQuXCIpO1xyXG4gICAgdmFyIGcgPSBnZW5lcmF0b3IuYXBwbHkodGhpc0FyZywgX2FyZ3VtZW50cyB8fCBbXSksIGksIHEgPSBbXTtcclxuICAgIHJldHVybiBpID0ge30sIHZlcmIoXCJuZXh0XCIpLCB2ZXJiKFwidGhyb3dcIiksIHZlcmIoXCJyZXR1cm5cIiksIGlbU3ltYm9sLmFzeW5jSXRlcmF0b3JdID0gZnVuY3Rpb24gKCkgeyByZXR1cm4gdGhpczsgfSwgaTtcclxuICAgIGZ1bmN0aW9uIHZlcmIobikgeyBpZiAoZ1tuXSkgaVtuXSA9IGZ1bmN0aW9uICh2KSB7IHJldHVybiBuZXcgUHJvbWlzZShmdW5jdGlvbiAoYSwgYikgeyBxLnB1c2goW24sIHYsIGEsIGJdKSA+IDEgfHwgcmVzdW1lKG4sIHYpOyB9KTsgfTsgfVxyXG4gICAgZnVuY3Rpb24gcmVzdW1lKG4sIHYpIHsgdHJ5IHsgc3RlcChnW25dKHYpKTsgfSBjYXRjaCAoZSkgeyBzZXR0bGUocVswXVszXSwgZSk7IH0gfVxyXG4gICAgZnVuY3Rpb24gc3RlcChyKSB7IHIudmFsdWUgaW5zdGFuY2VvZiBfX2F3YWl0ID8gUHJvbWlzZS5yZXNvbHZlKHIudmFsdWUudikudGhlbihmdWxmaWxsLCByZWplY3QpIDogc2V0dGxlKHFbMF1bMl0sIHIpOyB9XHJcbiAgICBmdW5jdGlvbiBmdWxmaWxsKHZhbHVlKSB7IHJlc3VtZShcIm5leHRcIiwgdmFsdWUpOyB9XHJcbiAgICBmdW5jdGlvbiByZWplY3QodmFsdWUpIHsgcmVzdW1lKFwidGhyb3dcIiwgdmFsdWUpOyB9XHJcbiAgICBmdW5jdGlvbiBzZXR0bGUoZiwgdikgeyBpZiAoZih2KSwgcS5zaGlmdCgpLCBxLmxlbmd0aCkgcmVzdW1lKHFbMF1bMF0sIHFbMF1bMV0pOyB9XHJcbn1cclxuXHJcbmV4cG9ydCBmdW5jdGlvbiBfX2FzeW5jRGVsZWdhdG9yKG8pIHtcclxuICAgIHZhciBpLCBwO1xyXG4gICAgcmV0dXJuIGkgPSB7fSwgdmVyYihcIm5leHRcIiksIHZlcmIoXCJ0aHJvd1wiLCBmdW5jdGlvbiAoZSkgeyB0aHJvdyBlOyB9KSwgdmVyYihcInJldHVyblwiKSwgaVtTeW1ib2wuaXRlcmF0b3JdID0gZnVuY3Rpb24gKCkgeyByZXR1cm4gdGhpczsgfSwgaTtcclxuICAgIGZ1bmN0aW9uIHZlcmIobiwgZikgeyBpW25dID0gb1tuXSA/IGZ1bmN0aW9uICh2KSB7IHJldHVybiAocCA9ICFwKSA/IHsgdmFsdWU6IF9fYXdhaXQob1tuXSh2KSksIGRvbmU6IG4gPT09IFwicmV0dXJuXCIgfSA6IGYgPyBmKHYpIDogdjsgfSA6IGY7IH1cclxufVxyXG5cclxuZXhwb3J0IGZ1bmN0aW9uIF9fYXN5bmNWYWx1ZXMobykge1xyXG4gICAgaWYgKCFTeW1ib2wuYXN5bmNJdGVyYXRvcikgdGhyb3cgbmV3IFR5cGVFcnJvcihcIlN5bWJvbC5hc3luY0l0ZXJhdG9yIGlzIG5vdCBkZWZpbmVkLlwiKTtcclxuICAgIHZhciBtID0gb1tTeW1ib2wuYXN5bmNJdGVyYXRvcl0sIGk7XHJcbiAgICByZXR1cm4gbSA/IG0uY2FsbChvKSA6IChvID0gdHlwZW9mIF9fdmFsdWVzID09PSBcImZ1bmN0aW9uXCIgPyBfX3ZhbHVlcyhvKSA6IG9bU3ltYm9sLml0ZXJhdG9yXSgpLCBpID0ge30sIHZlcmIoXCJuZXh0XCIpLCB2ZXJiKFwidGhyb3dcIiksIHZlcmIoXCJyZXR1cm5cIiksIGlbU3ltYm9sLmFzeW5jSXRlcmF0b3JdID0gZnVuY3Rpb24gKCkgeyByZXR1cm4gdGhpczsgfSwgaSk7XHJcbiAgICBmdW5jdGlvbiB2ZXJiKG4pIHsgaVtuXSA9IG9bbl0gJiYgZnVuY3Rpb24gKHYpIHsgcmV0dXJuIG5ldyBQcm9taXNlKGZ1bmN0aW9uIChyZXNvbHZlLCByZWplY3QpIHsgdiA9IG9bbl0odiksIHNldHRsZShyZXNvbHZlLCByZWplY3QsIHYuZG9uZSwgdi52YWx1ZSk7IH0pOyB9OyB9XHJcbiAgICBmdW5jdGlvbiBzZXR0bGUocmVzb2x2ZSwgcmVqZWN0LCBkLCB2KSB7IFByb21pc2UucmVzb2x2ZSh2KS50aGVuKGZ1bmN0aW9uKHYpIHsgcmVzb2x2ZSh7IHZhbHVlOiB2LCBkb25lOiBkIH0pOyB9LCByZWplY3QpOyB9XHJcbn1cclxuXHJcbmV4cG9ydCBmdW5jdGlvbiBfX21ha2VUZW1wbGF0ZU9iamVjdChjb29rZWQsIHJhdykge1xyXG4gICAgaWYgKE9iamVjdC5kZWZpbmVQcm9wZXJ0eSkgeyBPYmplY3QuZGVmaW5lUHJvcGVydHkoY29va2VkLCBcInJhd1wiLCB7IHZhbHVlOiByYXcgfSk7IH0gZWxzZSB7IGNvb2tlZC5yYXcgPSByYXc7IH1cclxuICAgIHJldHVybiBjb29rZWQ7XHJcbn07XHJcblxyXG52YXIgX19zZXRNb2R1bGVEZWZhdWx0ID0gT2JqZWN0LmNyZWF0ZSA/IChmdW5jdGlvbihvLCB2KSB7XHJcbiAgICBPYmplY3QuZGVmaW5lUHJvcGVydHkobywgXCJkZWZhdWx0XCIsIHsgZW51bWVyYWJsZTogdHJ1ZSwgdmFsdWU6IHYgfSk7XHJcbn0pIDogZnVuY3Rpb24obywgdikge1xyXG4gICAgb1tcImRlZmF1bHRcIl0gPSB2O1xyXG59O1xyXG5cclxuZXhwb3J0IGZ1bmN0aW9uIF9faW1wb3J0U3Rhcihtb2QpIHtcclxuICAgIGlmIChtb2QgJiYgbW9kLl9fZXNNb2R1bGUpIHJldHVybiBtb2Q7XHJcbiAgICB2YXIgcmVzdWx0ID0ge307XHJcbiAgICBpZiAobW9kICE9IG51bGwpIGZvciAodmFyIGsgaW4gbW9kKSBpZiAoayAhPT0gXCJkZWZhdWx0XCIgJiYgT2JqZWN0LnByb3RvdHlwZS5oYXNPd25Qcm9wZXJ0eS5jYWxsKG1vZCwgaykpIF9fY3JlYXRlQmluZGluZyhyZXN1bHQsIG1vZCwgayk7XHJcbiAgICBfX3NldE1vZHVsZURlZmF1bHQocmVzdWx0LCBtb2QpO1xyXG4gICAgcmV0dXJuIHJlc3VsdDtcclxufVxyXG5cclxuZXhwb3J0IGZ1bmN0aW9uIF9faW1wb3J0RGVmYXVsdChtb2QpIHtcclxuICAgIHJldHVybiAobW9kICYmIG1vZC5fX2VzTW9kdWxlKSA/IG1vZCA6IHsgZGVmYXVsdDogbW9kIH07XHJcbn1cclxuXHJcbmV4cG9ydCBmdW5jdGlvbiBfX2NsYXNzUHJpdmF0ZUZpZWxkR2V0KHJlY2VpdmVyLCBwcml2YXRlTWFwKSB7XHJcbiAgICBpZiAoIXByaXZhdGVNYXAuaGFzKHJlY2VpdmVyKSkge1xyXG4gICAgICAgIHRocm93IG5ldyBUeXBlRXJyb3IoXCJhdHRlbXB0ZWQgdG8gZ2V0IHByaXZhdGUgZmllbGQgb24gbm9uLWluc3RhbmNlXCIpO1xyXG4gICAgfVxyXG4gICAgcmV0dXJuIHByaXZhdGVNYXAuZ2V0KHJlY2VpdmVyKTtcclxufVxyXG5cclxuZXhwb3J0IGZ1bmN0aW9uIF9fY2xhc3NQcml2YXRlRmllbGRTZXQocmVjZWl2ZXIsIHByaXZhdGVNYXAsIHZhbHVlKSB7XHJcbiAgICBpZiAoIXByaXZhdGVNYXAuaGFzKHJlY2VpdmVyKSkge1xyXG4gICAgICAgIHRocm93IG5ldyBUeXBlRXJyb3IoXCJhdHRlbXB0ZWQgdG8gc2V0IHByaXZhdGUgZmllbGQgb24gbm9uLWluc3RhbmNlXCIpO1xyXG4gICAgfVxyXG4gICAgcHJpdmF0ZU1hcC5zZXQocmVjZWl2ZXIsIHZhbHVlKTtcclxuICAgIHJldHVybiB2YWx1ZTtcclxufVxyXG4iLCIndXNlIHN0cmljdCc7XG5cblxuZnVuY3Rpb24gaXNOb3RoaW5nKHN1YmplY3QpIHtcbiAgcmV0dXJuICh0eXBlb2Ygc3ViamVjdCA9PT0gJ3VuZGVmaW5lZCcpIHx8IChzdWJqZWN0ID09PSBudWxsKTtcbn1cblxuXG5mdW5jdGlvbiBpc09iamVjdChzdWJqZWN0KSB7XG4gIHJldHVybiAodHlwZW9mIHN1YmplY3QgPT09ICdvYmplY3QnKSAmJiAoc3ViamVjdCAhPT0gbnVsbCk7XG59XG5cblxuZnVuY3Rpb24gdG9BcnJheShzZXF1ZW5jZSkge1xuICBpZiAoQXJyYXkuaXNBcnJheShzZXF1ZW5jZSkpIHJldHVybiBzZXF1ZW5jZTtcbiAgZWxzZSBpZiAoaXNOb3RoaW5nKHNlcXVlbmNlKSkgcmV0dXJuIFtdO1xuXG4gIHJldHVybiBbIHNlcXVlbmNlIF07XG59XG5cblxuZnVuY3Rpb24gZXh0ZW5kKHRhcmdldCwgc291cmNlKSB7XG4gIHZhciBpbmRleCwgbGVuZ3RoLCBrZXksIHNvdXJjZUtleXM7XG5cbiAgaWYgKHNvdXJjZSkge1xuICAgIHNvdXJjZUtleXMgPSBPYmplY3Qua2V5cyhzb3VyY2UpO1xuXG4gICAgZm9yIChpbmRleCA9IDAsIGxlbmd0aCA9IHNvdXJjZUtleXMubGVuZ3RoOyBpbmRleCA8IGxlbmd0aDsgaW5kZXggKz0gMSkge1xuICAgICAga2V5ID0gc291cmNlS2V5c1tpbmRleF07XG4gICAgICB0YXJnZXRba2V5XSA9IHNvdXJjZVtrZXldO1xuICAgIH1cbiAgfVxuXG4gIHJldHVybiB0YXJnZXQ7XG59XG5cblxuZnVuY3Rpb24gcmVwZWF0KHN0cmluZywgY291bnQpIHtcbiAgdmFyIHJlc3VsdCA9ICcnLCBjeWNsZTtcblxuICBmb3IgKGN5Y2xlID0gMDsgY3ljbGUgPCBjb3VudDsgY3ljbGUgKz0gMSkge1xuICAgIHJlc3VsdCArPSBzdHJpbmc7XG4gIH1cblxuICByZXR1cm4gcmVzdWx0O1xufVxuXG5cbmZ1bmN0aW9uIGlzTmVnYXRpdmVaZXJvKG51bWJlcikge1xuICByZXR1cm4gKG51bWJlciA9PT0gMCkgJiYgKE51bWJlci5ORUdBVElWRV9JTkZJTklUWSA9PT0gMSAvIG51bWJlcik7XG59XG5cblxubW9kdWxlLmV4cG9ydHMuaXNOb3RoaW5nICAgICAgPSBpc05vdGhpbmc7XG5tb2R1bGUuZXhwb3J0cy5pc09iamVjdCAgICAgICA9IGlzT2JqZWN0O1xubW9kdWxlLmV4cG9ydHMudG9BcnJheSAgICAgICAgPSB0b0FycmF5O1xubW9kdWxlLmV4cG9ydHMucmVwZWF0ICAgICAgICAgPSByZXBlYXQ7XG5tb2R1bGUuZXhwb3J0cy5pc05lZ2F0aXZlWmVybyA9IGlzTmVnYXRpdmVaZXJvO1xubW9kdWxlLmV4cG9ydHMuZXh0ZW5kICAgICAgICAgPSBleHRlbmQ7XG4iLCIvLyBZQU1MIGVycm9yIGNsYXNzLiBodHRwOi8vc3RhY2tvdmVyZmxvdy5jb20vcXVlc3Rpb25zLzg0NTg5ODRcbi8vXG4ndXNlIHN0cmljdCc7XG5cbmZ1bmN0aW9uIFlBTUxFeGNlcHRpb24ocmVhc29uLCBtYXJrKSB7XG4gIC8vIFN1cGVyIGNvbnN0cnVjdG9yXG4gIEVycm9yLmNhbGwodGhpcyk7XG5cbiAgdGhpcy5uYW1lID0gJ1lBTUxFeGNlcHRpb24nO1xuICB0aGlzLnJlYXNvbiA9IHJlYXNvbjtcbiAgdGhpcy5tYXJrID0gbWFyaztcbiAgdGhpcy5tZXNzYWdlID0gKHRoaXMucmVhc29uIHx8ICcodW5rbm93biByZWFzb24pJykgKyAodGhpcy5tYXJrID8gJyAnICsgdGhpcy5tYXJrLnRvU3RyaW5nKCkgOiAnJyk7XG5cbiAgLy8gSW5jbHVkZSBzdGFjayB0cmFjZSBpbiBlcnJvciBvYmplY3RcbiAgaWYgKEVycm9yLmNhcHR1cmVTdGFja1RyYWNlKSB7XG4gICAgLy8gQ2hyb21lIGFuZCBOb2RlSlNcbiAgICBFcnJvci5jYXB0dXJlU3RhY2tUcmFjZSh0aGlzLCB0aGlzLmNvbnN0cnVjdG9yKTtcbiAgfSBlbHNlIHtcbiAgICAvLyBGRiwgSUUgMTArIGFuZCBTYWZhcmkgNisuIEZhbGxiYWNrIGZvciBvdGhlcnNcbiAgICB0aGlzLnN0YWNrID0gKG5ldyBFcnJvcigpKS5zdGFjayB8fCAnJztcbiAgfVxufVxuXG5cbi8vIEluaGVyaXQgZnJvbSBFcnJvclxuWUFNTEV4Y2VwdGlvbi5wcm90b3R5cGUgPSBPYmplY3QuY3JlYXRlKEVycm9yLnByb3RvdHlwZSk7XG5ZQU1MRXhjZXB0aW9uLnByb3RvdHlwZS5jb25zdHJ1Y3RvciA9IFlBTUxFeGNlcHRpb247XG5cblxuWUFNTEV4Y2VwdGlvbi5wcm90b3R5cGUudG9TdHJpbmcgPSBmdW5jdGlvbiB0b1N0cmluZyhjb21wYWN0KSB7XG4gIHZhciByZXN1bHQgPSB0aGlzLm5hbWUgKyAnOiAnO1xuXG4gIHJlc3VsdCArPSB0aGlzLnJlYXNvbiB8fCAnKHVua25vd24gcmVhc29uKSc7XG5cbiAgaWYgKCFjb21wYWN0ICYmIHRoaXMubWFyaykge1xuICAgIHJlc3VsdCArPSAnICcgKyB0aGlzLm1hcmsudG9TdHJpbmcoKTtcbiAgfVxuXG4gIHJldHVybiByZXN1bHQ7XG59O1xuXG5cbm1vZHVsZS5leHBvcnRzID0gWUFNTEV4Y2VwdGlvbjtcbiIsIid1c2Ugc3RyaWN0JztcblxuXG52YXIgY29tbW9uID0gcmVxdWlyZSgnLi9jb21tb24nKTtcblxuXG5mdW5jdGlvbiBNYXJrKG5hbWUsIGJ1ZmZlciwgcG9zaXRpb24sIGxpbmUsIGNvbHVtbikge1xuICB0aGlzLm5hbWUgICAgID0gbmFtZTtcbiAgdGhpcy5idWZmZXIgICA9IGJ1ZmZlcjtcbiAgdGhpcy5wb3NpdGlvbiA9IHBvc2l0aW9uO1xuICB0aGlzLmxpbmUgICAgID0gbGluZTtcbiAgdGhpcy5jb2x1bW4gICA9IGNvbHVtbjtcbn1cblxuXG5NYXJrLnByb3RvdHlwZS5nZXRTbmlwcGV0ID0gZnVuY3Rpb24gZ2V0U25pcHBldChpbmRlbnQsIG1heExlbmd0aCkge1xuICB2YXIgaGVhZCwgc3RhcnQsIHRhaWwsIGVuZCwgc25pcHBldDtcblxuICBpZiAoIXRoaXMuYnVmZmVyKSByZXR1cm4gbnVsbDtcblxuICBpbmRlbnQgPSBpbmRlbnQgfHwgNDtcbiAgbWF4TGVuZ3RoID0gbWF4TGVuZ3RoIHx8IDc1O1xuXG4gIGhlYWQgPSAnJztcbiAgc3RhcnQgPSB0aGlzLnBvc2l0aW9uO1xuXG4gIHdoaWxlIChzdGFydCA+IDAgJiYgJ1xceDAwXFxyXFxuXFx4ODVcXHUyMDI4XFx1MjAyOScuaW5kZXhPZih0aGlzLmJ1ZmZlci5jaGFyQXQoc3RhcnQgLSAxKSkgPT09IC0xKSB7XG4gICAgc3RhcnQgLT0gMTtcbiAgICBpZiAodGhpcy5wb3NpdGlvbiAtIHN0YXJ0ID4gKG1heExlbmd0aCAvIDIgLSAxKSkge1xuICAgICAgaGVhZCA9ICcgLi4uICc7XG4gICAgICBzdGFydCArPSA1O1xuICAgICAgYnJlYWs7XG4gICAgfVxuICB9XG5cbiAgdGFpbCA9ICcnO1xuICBlbmQgPSB0aGlzLnBvc2l0aW9uO1xuXG4gIHdoaWxlIChlbmQgPCB0aGlzLmJ1ZmZlci5sZW5ndGggJiYgJ1xceDAwXFxyXFxuXFx4ODVcXHUyMDI4XFx1MjAyOScuaW5kZXhPZih0aGlzLmJ1ZmZlci5jaGFyQXQoZW5kKSkgPT09IC0xKSB7XG4gICAgZW5kICs9IDE7XG4gICAgaWYgKGVuZCAtIHRoaXMucG9zaXRpb24gPiAobWF4TGVuZ3RoIC8gMiAtIDEpKSB7XG4gICAgICB0YWlsID0gJyAuLi4gJztcbiAgICAgIGVuZCAtPSA1O1xuICAgICAgYnJlYWs7XG4gICAgfVxuICB9XG5cbiAgc25pcHBldCA9IHRoaXMuYnVmZmVyLnNsaWNlKHN0YXJ0LCBlbmQpO1xuXG4gIHJldHVybiBjb21tb24ucmVwZWF0KCcgJywgaW5kZW50KSArIGhlYWQgKyBzbmlwcGV0ICsgdGFpbCArICdcXG4nICtcbiAgICAgICAgIGNvbW1vbi5yZXBlYXQoJyAnLCBpbmRlbnQgKyB0aGlzLnBvc2l0aW9uIC0gc3RhcnQgKyBoZWFkLmxlbmd0aCkgKyAnXic7XG59O1xuXG5cbk1hcmsucHJvdG90eXBlLnRvU3RyaW5nID0gZnVuY3Rpb24gdG9TdHJpbmcoY29tcGFjdCkge1xuICB2YXIgc25pcHBldCwgd2hlcmUgPSAnJztcblxuICBpZiAodGhpcy5uYW1lKSB7XG4gICAgd2hlcmUgKz0gJ2luIFwiJyArIHRoaXMubmFtZSArICdcIiAnO1xuICB9XG5cbiAgd2hlcmUgKz0gJ2F0IGxpbmUgJyArICh0aGlzLmxpbmUgKyAxKSArICcsIGNvbHVtbiAnICsgKHRoaXMuY29sdW1uICsgMSk7XG5cbiAgaWYgKCFjb21wYWN0KSB7XG4gICAgc25pcHBldCA9IHRoaXMuZ2V0U25pcHBldCgpO1xuXG4gICAgaWYgKHNuaXBwZXQpIHtcbiAgICAgIHdoZXJlICs9ICc6XFxuJyArIHNuaXBwZXQ7XG4gICAgfVxuICB9XG5cbiAgcmV0dXJuIHdoZXJlO1xufTtcblxuXG5tb2R1bGUuZXhwb3J0cyA9IE1hcms7XG4iLCIndXNlIHN0cmljdCc7XG5cbnZhciBZQU1MRXhjZXB0aW9uID0gcmVxdWlyZSgnLi9leGNlcHRpb24nKTtcblxudmFyIFRZUEVfQ09OU1RSVUNUT1JfT1BUSU9OUyA9IFtcbiAgJ2tpbmQnLFxuICAncmVzb2x2ZScsXG4gICdjb25zdHJ1Y3QnLFxuICAnaW5zdGFuY2VPZicsXG4gICdwcmVkaWNhdGUnLFxuICAncmVwcmVzZW50JyxcbiAgJ2RlZmF1bHRTdHlsZScsXG4gICdzdHlsZUFsaWFzZXMnXG5dO1xuXG52YXIgWUFNTF9OT0RFX0tJTkRTID0gW1xuICAnc2NhbGFyJyxcbiAgJ3NlcXVlbmNlJyxcbiAgJ21hcHBpbmcnXG5dO1xuXG5mdW5jdGlvbiBjb21waWxlU3R5bGVBbGlhc2VzKG1hcCkge1xuICB2YXIgcmVzdWx0ID0ge307XG5cbiAgaWYgKG1hcCAhPT0gbnVsbCkge1xuICAgIE9iamVjdC5rZXlzKG1hcCkuZm9yRWFjaChmdW5jdGlvbiAoc3R5bGUpIHtcbiAgICAgIG1hcFtzdHlsZV0uZm9yRWFjaChmdW5jdGlvbiAoYWxpYXMpIHtcbiAgICAgICAgcmVzdWx0W1N0cmluZyhhbGlhcyldID0gc3R5bGU7XG4gICAgICB9KTtcbiAgICB9KTtcbiAgfVxuXG4gIHJldHVybiByZXN1bHQ7XG59XG5cbmZ1bmN0aW9uIFR5cGUodGFnLCBvcHRpb25zKSB7XG4gIG9wdGlvbnMgPSBvcHRpb25zIHx8IHt9O1xuXG4gIE9iamVjdC5rZXlzKG9wdGlvbnMpLmZvckVhY2goZnVuY3Rpb24gKG5hbWUpIHtcbiAgICBpZiAoVFlQRV9DT05TVFJVQ1RPUl9PUFRJT05TLmluZGV4T2YobmFtZSkgPT09IC0xKSB7XG4gICAgICB0aHJvdyBuZXcgWUFNTEV4Y2VwdGlvbignVW5rbm93biBvcHRpb24gXCInICsgbmFtZSArICdcIiBpcyBtZXQgaW4gZGVmaW5pdGlvbiBvZiBcIicgKyB0YWcgKyAnXCIgWUFNTCB0eXBlLicpO1xuICAgIH1cbiAgfSk7XG5cbiAgLy8gVE9ETzogQWRkIHRhZyBmb3JtYXQgY2hlY2suXG4gIHRoaXMudGFnICAgICAgICAgID0gdGFnO1xuICB0aGlzLmtpbmQgICAgICAgICA9IG9wdGlvbnNbJ2tpbmQnXSAgICAgICAgIHx8IG51bGw7XG4gIHRoaXMucmVzb2x2ZSAgICAgID0gb3B0aW9uc1sncmVzb2x2ZSddICAgICAgfHwgZnVuY3Rpb24gKCkgeyByZXR1cm4gdHJ1ZTsgfTtcbiAgdGhpcy5jb25zdHJ1Y3QgICAgPSBvcHRpb25zWydjb25zdHJ1Y3QnXSAgICB8fCBmdW5jdGlvbiAoZGF0YSkgeyByZXR1cm4gZGF0YTsgfTtcbiAgdGhpcy5pbnN0YW5jZU9mICAgPSBvcHRpb25zWydpbnN0YW5jZU9mJ10gICB8fCBudWxsO1xuICB0aGlzLnByZWRpY2F0ZSAgICA9IG9wdGlvbnNbJ3ByZWRpY2F0ZSddICAgIHx8IG51bGw7XG4gIHRoaXMucmVwcmVzZW50ICAgID0gb3B0aW9uc1sncmVwcmVzZW50J10gICAgfHwgbnVsbDtcbiAgdGhpcy5kZWZhdWx0U3R5bGUgPSBvcHRpb25zWydkZWZhdWx0U3R5bGUnXSB8fCBudWxsO1xuICB0aGlzLnN0eWxlQWxpYXNlcyA9IGNvbXBpbGVTdHlsZUFsaWFzZXMob3B0aW9uc1snc3R5bGVBbGlhc2VzJ10gfHwgbnVsbCk7XG5cbiAgaWYgKFlBTUxfTk9ERV9LSU5EUy5pbmRleE9mKHRoaXMua2luZCkgPT09IC0xKSB7XG4gICAgdGhyb3cgbmV3IFlBTUxFeGNlcHRpb24oJ1Vua25vd24ga2luZCBcIicgKyB0aGlzLmtpbmQgKyAnXCIgaXMgc3BlY2lmaWVkIGZvciBcIicgKyB0YWcgKyAnXCIgWUFNTCB0eXBlLicpO1xuICB9XG59XG5cbm1vZHVsZS5leHBvcnRzID0gVHlwZTtcbiIsIid1c2Ugc3RyaWN0JztcblxuLyplc2xpbnQtZGlzYWJsZSBtYXgtbGVuKi9cblxudmFyIGNvbW1vbiAgICAgICAgPSByZXF1aXJlKCcuL2NvbW1vbicpO1xudmFyIFlBTUxFeGNlcHRpb24gPSByZXF1aXJlKCcuL2V4Y2VwdGlvbicpO1xudmFyIFR5cGUgICAgICAgICAgPSByZXF1aXJlKCcuL3R5cGUnKTtcblxuXG5mdW5jdGlvbiBjb21waWxlTGlzdChzY2hlbWEsIG5hbWUsIHJlc3VsdCkge1xuICB2YXIgZXhjbHVkZSA9IFtdO1xuXG4gIHNjaGVtYS5pbmNsdWRlLmZvckVhY2goZnVuY3Rpb24gKGluY2x1ZGVkU2NoZW1hKSB7XG4gICAgcmVzdWx0ID0gY29tcGlsZUxpc3QoaW5jbHVkZWRTY2hlbWEsIG5hbWUsIHJlc3VsdCk7XG4gIH0pO1xuXG4gIHNjaGVtYVtuYW1lXS5mb3JFYWNoKGZ1bmN0aW9uIChjdXJyZW50VHlwZSkge1xuICAgIHJlc3VsdC5mb3JFYWNoKGZ1bmN0aW9uIChwcmV2aW91c1R5cGUsIHByZXZpb3VzSW5kZXgpIHtcbiAgICAgIGlmIChwcmV2aW91c1R5cGUudGFnID09PSBjdXJyZW50VHlwZS50YWcgJiYgcHJldmlvdXNUeXBlLmtpbmQgPT09IGN1cnJlbnRUeXBlLmtpbmQpIHtcbiAgICAgICAgZXhjbHVkZS5wdXNoKHByZXZpb3VzSW5kZXgpO1xuICAgICAgfVxuICAgIH0pO1xuXG4gICAgcmVzdWx0LnB1c2goY3VycmVudFR5cGUpO1xuICB9KTtcblxuICByZXR1cm4gcmVzdWx0LmZpbHRlcihmdW5jdGlvbiAodHlwZSwgaW5kZXgpIHtcbiAgICByZXR1cm4gZXhjbHVkZS5pbmRleE9mKGluZGV4KSA9PT0gLTE7XG4gIH0pO1xufVxuXG5cbmZ1bmN0aW9uIGNvbXBpbGVNYXAoLyogbGlzdHMuLi4gKi8pIHtcbiAgdmFyIHJlc3VsdCA9IHtcbiAgICAgICAgc2NhbGFyOiB7fSxcbiAgICAgICAgc2VxdWVuY2U6IHt9LFxuICAgICAgICBtYXBwaW5nOiB7fSxcbiAgICAgICAgZmFsbGJhY2s6IHt9XG4gICAgICB9LCBpbmRleCwgbGVuZ3RoO1xuXG4gIGZ1bmN0aW9uIGNvbGxlY3RUeXBlKHR5cGUpIHtcbiAgICByZXN1bHRbdHlwZS5raW5kXVt0eXBlLnRhZ10gPSByZXN1bHRbJ2ZhbGxiYWNrJ11bdHlwZS50YWddID0gdHlwZTtcbiAgfVxuXG4gIGZvciAoaW5kZXggPSAwLCBsZW5ndGggPSBhcmd1bWVudHMubGVuZ3RoOyBpbmRleCA8IGxlbmd0aDsgaW5kZXggKz0gMSkge1xuICAgIGFyZ3VtZW50c1tpbmRleF0uZm9yRWFjaChjb2xsZWN0VHlwZSk7XG4gIH1cbiAgcmV0dXJuIHJlc3VsdDtcbn1cblxuXG5mdW5jdGlvbiBTY2hlbWEoZGVmaW5pdGlvbikge1xuICB0aGlzLmluY2x1ZGUgID0gZGVmaW5pdGlvbi5pbmNsdWRlICB8fCBbXTtcbiAgdGhpcy5pbXBsaWNpdCA9IGRlZmluaXRpb24uaW1wbGljaXQgfHwgW107XG4gIHRoaXMuZXhwbGljaXQgPSBkZWZpbml0aW9uLmV4cGxpY2l0IHx8IFtdO1xuXG4gIHRoaXMuaW1wbGljaXQuZm9yRWFjaChmdW5jdGlvbiAodHlwZSkge1xuICAgIGlmICh0eXBlLmxvYWRLaW5kICYmIHR5cGUubG9hZEtpbmQgIT09ICdzY2FsYXInKSB7XG4gICAgICB0aHJvdyBuZXcgWUFNTEV4Y2VwdGlvbignVGhlcmUgaXMgYSBub24tc2NhbGFyIHR5cGUgaW4gdGhlIGltcGxpY2l0IGxpc3Qgb2YgYSBzY2hlbWEuIEltcGxpY2l0IHJlc29sdmluZyBvZiBzdWNoIHR5cGVzIGlzIG5vdCBzdXBwb3J0ZWQuJyk7XG4gICAgfVxuICB9KTtcblxuICB0aGlzLmNvbXBpbGVkSW1wbGljaXQgPSBjb21waWxlTGlzdCh0aGlzLCAnaW1wbGljaXQnLCBbXSk7XG4gIHRoaXMuY29tcGlsZWRFeHBsaWNpdCA9IGNvbXBpbGVMaXN0KHRoaXMsICdleHBsaWNpdCcsIFtdKTtcbiAgdGhpcy5jb21waWxlZFR5cGVNYXAgID0gY29tcGlsZU1hcCh0aGlzLmNvbXBpbGVkSW1wbGljaXQsIHRoaXMuY29tcGlsZWRFeHBsaWNpdCk7XG59XG5cblxuU2NoZW1hLkRFRkFVTFQgPSBudWxsO1xuXG5cblNjaGVtYS5jcmVhdGUgPSBmdW5jdGlvbiBjcmVhdGVTY2hlbWEoKSB7XG4gIHZhciBzY2hlbWFzLCB0eXBlcztcblxuICBzd2l0Y2ggKGFyZ3VtZW50cy5sZW5ndGgpIHtcbiAgICBjYXNlIDE6XG4gICAgICBzY2hlbWFzID0gU2NoZW1hLkRFRkFVTFQ7XG4gICAgICB0eXBlcyA9IGFyZ3VtZW50c1swXTtcbiAgICAgIGJyZWFrO1xuXG4gICAgY2FzZSAyOlxuICAgICAgc2NoZW1hcyA9IGFyZ3VtZW50c1swXTtcbiAgICAgIHR5cGVzID0gYXJndW1lbnRzWzFdO1xuICAgICAgYnJlYWs7XG5cbiAgICBkZWZhdWx0OlxuICAgICAgdGhyb3cgbmV3IFlBTUxFeGNlcHRpb24oJ1dyb25nIG51bWJlciBvZiBhcmd1bWVudHMgZm9yIFNjaGVtYS5jcmVhdGUgZnVuY3Rpb24nKTtcbiAgfVxuXG4gIHNjaGVtYXMgPSBjb21tb24udG9BcnJheShzY2hlbWFzKTtcbiAgdHlwZXMgPSBjb21tb24udG9BcnJheSh0eXBlcyk7XG5cbiAgaWYgKCFzY2hlbWFzLmV2ZXJ5KGZ1bmN0aW9uIChzY2hlbWEpIHsgcmV0dXJuIHNjaGVtYSBpbnN0YW5jZW9mIFNjaGVtYTsgfSkpIHtcbiAgICB0aHJvdyBuZXcgWUFNTEV4Y2VwdGlvbignU3BlY2lmaWVkIGxpc3Qgb2Ygc3VwZXIgc2NoZW1hcyAob3IgYSBzaW5nbGUgU2NoZW1hIG9iamVjdCkgY29udGFpbnMgYSBub24tU2NoZW1hIG9iamVjdC4nKTtcbiAgfVxuXG4gIGlmICghdHlwZXMuZXZlcnkoZnVuY3Rpb24gKHR5cGUpIHsgcmV0dXJuIHR5cGUgaW5zdGFuY2VvZiBUeXBlOyB9KSkge1xuICAgIHRocm93IG5ldyBZQU1MRXhjZXB0aW9uKCdTcGVjaWZpZWQgbGlzdCBvZiBZQU1MIHR5cGVzIChvciBhIHNpbmdsZSBUeXBlIG9iamVjdCkgY29udGFpbnMgYSBub24tVHlwZSBvYmplY3QuJyk7XG4gIH1cblxuICByZXR1cm4gbmV3IFNjaGVtYSh7XG4gICAgaW5jbHVkZTogc2NoZW1hcyxcbiAgICBleHBsaWNpdDogdHlwZXNcbiAgfSk7XG59O1xuXG5cbm1vZHVsZS5leHBvcnRzID0gU2NoZW1hO1xuIiwiJ3VzZSBzdHJpY3QnO1xuXG52YXIgVHlwZSA9IHJlcXVpcmUoJy4uL3R5cGUnKTtcblxubW9kdWxlLmV4cG9ydHMgPSBuZXcgVHlwZSgndGFnOnlhbWwub3JnLDIwMDI6c3RyJywge1xuICBraW5kOiAnc2NhbGFyJyxcbiAgY29uc3RydWN0OiBmdW5jdGlvbiAoZGF0YSkgeyByZXR1cm4gZGF0YSAhPT0gbnVsbCA/IGRhdGEgOiAnJzsgfVxufSk7XG4iLCIndXNlIHN0cmljdCc7XG5cbnZhciBUeXBlID0gcmVxdWlyZSgnLi4vdHlwZScpO1xuXG5tb2R1bGUuZXhwb3J0cyA9IG5ldyBUeXBlKCd0YWc6eWFtbC5vcmcsMjAwMjpzZXEnLCB7XG4gIGtpbmQ6ICdzZXF1ZW5jZScsXG4gIGNvbnN0cnVjdDogZnVuY3Rpb24gKGRhdGEpIHsgcmV0dXJuIGRhdGEgIT09IG51bGwgPyBkYXRhIDogW107IH1cbn0pO1xuIiwiJ3VzZSBzdHJpY3QnO1xuXG52YXIgVHlwZSA9IHJlcXVpcmUoJy4uL3R5cGUnKTtcblxubW9kdWxlLmV4cG9ydHMgPSBuZXcgVHlwZSgndGFnOnlhbWwub3JnLDIwMDI6bWFwJywge1xuICBraW5kOiAnbWFwcGluZycsXG4gIGNvbnN0cnVjdDogZnVuY3Rpb24gKGRhdGEpIHsgcmV0dXJuIGRhdGEgIT09IG51bGwgPyBkYXRhIDoge307IH1cbn0pO1xuIiwiLy8gU3RhbmRhcmQgWUFNTCdzIEZhaWxzYWZlIHNjaGVtYS5cbi8vIGh0dHA6Ly93d3cueWFtbC5vcmcvc3BlYy8xLjIvc3BlYy5odG1sI2lkMjgwMjM0NlxuXG5cbid1c2Ugc3RyaWN0JztcblxuXG52YXIgU2NoZW1hID0gcmVxdWlyZSgnLi4vc2NoZW1hJyk7XG5cblxubW9kdWxlLmV4cG9ydHMgPSBuZXcgU2NoZW1hKHtcbiAgZXhwbGljaXQ6IFtcbiAgICByZXF1aXJlKCcuLi90eXBlL3N0cicpLFxuICAgIHJlcXVpcmUoJy4uL3R5cGUvc2VxJyksXG4gICAgcmVxdWlyZSgnLi4vdHlwZS9tYXAnKVxuICBdXG59KTtcbiIsIid1c2Ugc3RyaWN0JztcblxudmFyIFR5cGUgPSByZXF1aXJlKCcuLi90eXBlJyk7XG5cbmZ1bmN0aW9uIHJlc29sdmVZYW1sTnVsbChkYXRhKSB7XG4gIGlmIChkYXRhID09PSBudWxsKSByZXR1cm4gdHJ1ZTtcblxuICB2YXIgbWF4ID0gZGF0YS5sZW5ndGg7XG5cbiAgcmV0dXJuIChtYXggPT09IDEgJiYgZGF0YSA9PT0gJ34nKSB8fFxuICAgICAgICAgKG1heCA9PT0gNCAmJiAoZGF0YSA9PT0gJ251bGwnIHx8IGRhdGEgPT09ICdOdWxsJyB8fCBkYXRhID09PSAnTlVMTCcpKTtcbn1cblxuZnVuY3Rpb24gY29uc3RydWN0WWFtbE51bGwoKSB7XG4gIHJldHVybiBudWxsO1xufVxuXG5mdW5jdGlvbiBpc051bGwob2JqZWN0KSB7XG4gIHJldHVybiBvYmplY3QgPT09IG51bGw7XG59XG5cbm1vZHVsZS5leHBvcnRzID0gbmV3IFR5cGUoJ3RhZzp5YW1sLm9yZywyMDAyOm51bGwnLCB7XG4gIGtpbmQ6ICdzY2FsYXInLFxuICByZXNvbHZlOiByZXNvbHZlWWFtbE51bGwsXG4gIGNvbnN0cnVjdDogY29uc3RydWN0WWFtbE51bGwsXG4gIHByZWRpY2F0ZTogaXNOdWxsLFxuICByZXByZXNlbnQ6IHtcbiAgICBjYW5vbmljYWw6IGZ1bmN0aW9uICgpIHsgcmV0dXJuICd+JzsgICAgfSxcbiAgICBsb3dlcmNhc2U6IGZ1bmN0aW9uICgpIHsgcmV0dXJuICdudWxsJzsgfSxcbiAgICB1cHBlcmNhc2U6IGZ1bmN0aW9uICgpIHsgcmV0dXJuICdOVUxMJzsgfSxcbiAgICBjYW1lbGNhc2U6IGZ1bmN0aW9uICgpIHsgcmV0dXJuICdOdWxsJzsgfVxuICB9LFxuICBkZWZhdWx0U3R5bGU6ICdsb3dlcmNhc2UnXG59KTtcbiIsIid1c2Ugc3RyaWN0JztcblxudmFyIFR5cGUgPSByZXF1aXJlKCcuLi90eXBlJyk7XG5cbmZ1bmN0aW9uIHJlc29sdmVZYW1sQm9vbGVhbihkYXRhKSB7XG4gIGlmIChkYXRhID09PSBudWxsKSByZXR1cm4gZmFsc2U7XG5cbiAgdmFyIG1heCA9IGRhdGEubGVuZ3RoO1xuXG4gIHJldHVybiAobWF4ID09PSA0ICYmIChkYXRhID09PSAndHJ1ZScgfHwgZGF0YSA9PT0gJ1RydWUnIHx8IGRhdGEgPT09ICdUUlVFJykpIHx8XG4gICAgICAgICAobWF4ID09PSA1ICYmIChkYXRhID09PSAnZmFsc2UnIHx8IGRhdGEgPT09ICdGYWxzZScgfHwgZGF0YSA9PT0gJ0ZBTFNFJykpO1xufVxuXG5mdW5jdGlvbiBjb25zdHJ1Y3RZYW1sQm9vbGVhbihkYXRhKSB7XG4gIHJldHVybiBkYXRhID09PSAndHJ1ZScgfHxcbiAgICAgICAgIGRhdGEgPT09ICdUcnVlJyB8fFxuICAgICAgICAgZGF0YSA9PT0gJ1RSVUUnO1xufVxuXG5mdW5jdGlvbiBpc0Jvb2xlYW4ob2JqZWN0KSB7XG4gIHJldHVybiBPYmplY3QucHJvdG90eXBlLnRvU3RyaW5nLmNhbGwob2JqZWN0KSA9PT0gJ1tvYmplY3QgQm9vbGVhbl0nO1xufVxuXG5tb2R1bGUuZXhwb3J0cyA9IG5ldyBUeXBlKCd0YWc6eWFtbC5vcmcsMjAwMjpib29sJywge1xuICBraW5kOiAnc2NhbGFyJyxcbiAgcmVzb2x2ZTogcmVzb2x2ZVlhbWxCb29sZWFuLFxuICBjb25zdHJ1Y3Q6IGNvbnN0cnVjdFlhbWxCb29sZWFuLFxuICBwcmVkaWNhdGU6IGlzQm9vbGVhbixcbiAgcmVwcmVzZW50OiB7XG4gICAgbG93ZXJjYXNlOiBmdW5jdGlvbiAob2JqZWN0KSB7IHJldHVybiBvYmplY3QgPyAndHJ1ZScgOiAnZmFsc2UnOyB9LFxuICAgIHVwcGVyY2FzZTogZnVuY3Rpb24gKG9iamVjdCkgeyByZXR1cm4gb2JqZWN0ID8gJ1RSVUUnIDogJ0ZBTFNFJzsgfSxcbiAgICBjYW1lbGNhc2U6IGZ1bmN0aW9uIChvYmplY3QpIHsgcmV0dXJuIG9iamVjdCA/ICdUcnVlJyA6ICdGYWxzZSc7IH1cbiAgfSxcbiAgZGVmYXVsdFN0eWxlOiAnbG93ZXJjYXNlJ1xufSk7XG4iLCIndXNlIHN0cmljdCc7XG5cbnZhciBjb21tb24gPSByZXF1aXJlKCcuLi9jb21tb24nKTtcbnZhciBUeXBlICAgPSByZXF1aXJlKCcuLi90eXBlJyk7XG5cbmZ1bmN0aW9uIGlzSGV4Q29kZShjKSB7XG4gIHJldHVybiAoKDB4MzAvKiAwICovIDw9IGMpICYmIChjIDw9IDB4MzkvKiA5ICovKSkgfHxcbiAgICAgICAgICgoMHg0MS8qIEEgKi8gPD0gYykgJiYgKGMgPD0gMHg0Ni8qIEYgKi8pKSB8fFxuICAgICAgICAgKCgweDYxLyogYSAqLyA8PSBjKSAmJiAoYyA8PSAweDY2LyogZiAqLykpO1xufVxuXG5mdW5jdGlvbiBpc09jdENvZGUoYykge1xuICByZXR1cm4gKCgweDMwLyogMCAqLyA8PSBjKSAmJiAoYyA8PSAweDM3LyogNyAqLykpO1xufVxuXG5mdW5jdGlvbiBpc0RlY0NvZGUoYykge1xuICByZXR1cm4gKCgweDMwLyogMCAqLyA8PSBjKSAmJiAoYyA8PSAweDM5LyogOSAqLykpO1xufVxuXG5mdW5jdGlvbiByZXNvbHZlWWFtbEludGVnZXIoZGF0YSkge1xuICBpZiAoZGF0YSA9PT0gbnVsbCkgcmV0dXJuIGZhbHNlO1xuXG4gIHZhciBtYXggPSBkYXRhLmxlbmd0aCxcbiAgICAgIGluZGV4ID0gMCxcbiAgICAgIGhhc0RpZ2l0cyA9IGZhbHNlLFxuICAgICAgY2g7XG5cbiAgaWYgKCFtYXgpIHJldHVybiBmYWxzZTtcblxuICBjaCA9IGRhdGFbaW5kZXhdO1xuXG4gIC8vIHNpZ25cbiAgaWYgKGNoID09PSAnLScgfHwgY2ggPT09ICcrJykge1xuICAgIGNoID0gZGF0YVsrK2luZGV4XTtcbiAgfVxuXG4gIGlmIChjaCA9PT0gJzAnKSB7XG4gICAgLy8gMFxuICAgIGlmIChpbmRleCArIDEgPT09IG1heCkgcmV0dXJuIHRydWU7XG4gICAgY2ggPSBkYXRhWysraW5kZXhdO1xuXG4gICAgLy8gYmFzZSAyLCBiYXNlIDgsIGJhc2UgMTZcblxuICAgIGlmIChjaCA9PT0gJ2InKSB7XG4gICAgICAvLyBiYXNlIDJcbiAgICAgIGluZGV4Kys7XG5cbiAgICAgIGZvciAoOyBpbmRleCA8IG1heDsgaW5kZXgrKykge1xuICAgICAgICBjaCA9IGRhdGFbaW5kZXhdO1xuICAgICAgICBpZiAoY2ggPT09ICdfJykgY29udGludWU7XG4gICAgICAgIGlmIChjaCAhPT0gJzAnICYmIGNoICE9PSAnMScpIHJldHVybiBmYWxzZTtcbiAgICAgICAgaGFzRGlnaXRzID0gdHJ1ZTtcbiAgICAgIH1cbiAgICAgIHJldHVybiBoYXNEaWdpdHMgJiYgY2ggIT09ICdfJztcbiAgICB9XG5cblxuICAgIGlmIChjaCA9PT0gJ3gnKSB7XG4gICAgICAvLyBiYXNlIDE2XG4gICAgICBpbmRleCsrO1xuXG4gICAgICBmb3IgKDsgaW5kZXggPCBtYXg7IGluZGV4KyspIHtcbiAgICAgICAgY2ggPSBkYXRhW2luZGV4XTtcbiAgICAgICAgaWYgKGNoID09PSAnXycpIGNvbnRpbnVlO1xuICAgICAgICBpZiAoIWlzSGV4Q29kZShkYXRhLmNoYXJDb2RlQXQoaW5kZXgpKSkgcmV0dXJuIGZhbHNlO1xuICAgICAgICBoYXNEaWdpdHMgPSB0cnVlO1xuICAgICAgfVxuICAgICAgcmV0dXJuIGhhc0RpZ2l0cyAmJiBjaCAhPT0gJ18nO1xuICAgIH1cblxuICAgIC8vIGJhc2UgOFxuICAgIGZvciAoOyBpbmRleCA8IG1heDsgaW5kZXgrKykge1xuICAgICAgY2ggPSBkYXRhW2luZGV4XTtcbiAgICAgIGlmIChjaCA9PT0gJ18nKSBjb250aW51ZTtcbiAgICAgIGlmICghaXNPY3RDb2RlKGRhdGEuY2hhckNvZGVBdChpbmRleCkpKSByZXR1cm4gZmFsc2U7XG4gICAgICBoYXNEaWdpdHMgPSB0cnVlO1xuICAgIH1cbiAgICByZXR1cm4gaGFzRGlnaXRzICYmIGNoICE9PSAnXyc7XG4gIH1cblxuICAvLyBiYXNlIDEwIChleGNlcHQgMCkgb3IgYmFzZSA2MFxuXG4gIC8vIHZhbHVlIHNob3VsZCBub3Qgc3RhcnQgd2l0aCBgX2A7XG4gIGlmIChjaCA9PT0gJ18nKSByZXR1cm4gZmFsc2U7XG5cbiAgZm9yICg7IGluZGV4IDwgbWF4OyBpbmRleCsrKSB7XG4gICAgY2ggPSBkYXRhW2luZGV4XTtcbiAgICBpZiAoY2ggPT09ICdfJykgY29udGludWU7XG4gICAgaWYgKGNoID09PSAnOicpIGJyZWFrO1xuICAgIGlmICghaXNEZWNDb2RlKGRhdGEuY2hhckNvZGVBdChpbmRleCkpKSB7XG4gICAgICByZXR1cm4gZmFsc2U7XG4gICAgfVxuICAgIGhhc0RpZ2l0cyA9IHRydWU7XG4gIH1cblxuICAvLyBTaG91bGQgaGF2ZSBkaWdpdHMgYW5kIHNob3VsZCBub3QgZW5kIHdpdGggYF9gXG4gIGlmICghaGFzRGlnaXRzIHx8IGNoID09PSAnXycpIHJldHVybiBmYWxzZTtcblxuICAvLyBpZiAhYmFzZTYwIC0gZG9uZTtcbiAgaWYgKGNoICE9PSAnOicpIHJldHVybiB0cnVlO1xuXG4gIC8vIGJhc2U2MCBhbG1vc3Qgbm90IHVzZWQsIG5vIG5lZWRzIHRvIG9wdGltaXplXG4gIHJldHVybiAvXig6WzAtNV0/WzAtOV0pKyQvLnRlc3QoZGF0YS5zbGljZShpbmRleCkpO1xufVxuXG5mdW5jdGlvbiBjb25zdHJ1Y3RZYW1sSW50ZWdlcihkYXRhKSB7XG4gIHZhciB2YWx1ZSA9IGRhdGEsIHNpZ24gPSAxLCBjaCwgYmFzZSwgZGlnaXRzID0gW107XG5cbiAgaWYgKHZhbHVlLmluZGV4T2YoJ18nKSAhPT0gLTEpIHtcbiAgICB2YWx1ZSA9IHZhbHVlLnJlcGxhY2UoL18vZywgJycpO1xuICB9XG5cbiAgY2ggPSB2YWx1ZVswXTtcblxuICBpZiAoY2ggPT09ICctJyB8fCBjaCA9PT0gJysnKSB7XG4gICAgaWYgKGNoID09PSAnLScpIHNpZ24gPSAtMTtcbiAgICB2YWx1ZSA9IHZhbHVlLnNsaWNlKDEpO1xuICAgIGNoID0gdmFsdWVbMF07XG4gIH1cblxuICBpZiAodmFsdWUgPT09ICcwJykgcmV0dXJuIDA7XG5cbiAgaWYgKGNoID09PSAnMCcpIHtcbiAgICBpZiAodmFsdWVbMV0gPT09ICdiJykgcmV0dXJuIHNpZ24gKiBwYXJzZUludCh2YWx1ZS5zbGljZSgyKSwgMik7XG4gICAgaWYgKHZhbHVlWzFdID09PSAneCcpIHJldHVybiBzaWduICogcGFyc2VJbnQodmFsdWUsIDE2KTtcbiAgICByZXR1cm4gc2lnbiAqIHBhcnNlSW50KHZhbHVlLCA4KTtcbiAgfVxuXG4gIGlmICh2YWx1ZS5pbmRleE9mKCc6JykgIT09IC0xKSB7XG4gICAgdmFsdWUuc3BsaXQoJzonKS5mb3JFYWNoKGZ1bmN0aW9uICh2KSB7XG4gICAgICBkaWdpdHMudW5zaGlmdChwYXJzZUludCh2LCAxMCkpO1xuICAgIH0pO1xuXG4gICAgdmFsdWUgPSAwO1xuICAgIGJhc2UgPSAxO1xuXG4gICAgZGlnaXRzLmZvckVhY2goZnVuY3Rpb24gKGQpIHtcbiAgICAgIHZhbHVlICs9IChkICogYmFzZSk7XG4gICAgICBiYXNlICo9IDYwO1xuICAgIH0pO1xuXG4gICAgcmV0dXJuIHNpZ24gKiB2YWx1ZTtcblxuICB9XG5cbiAgcmV0dXJuIHNpZ24gKiBwYXJzZUludCh2YWx1ZSwgMTApO1xufVxuXG5mdW5jdGlvbiBpc0ludGVnZXIob2JqZWN0KSB7XG4gIHJldHVybiAoT2JqZWN0LnByb3RvdHlwZS50b1N0cmluZy5jYWxsKG9iamVjdCkpID09PSAnW29iamVjdCBOdW1iZXJdJyAmJlxuICAgICAgICAgKG9iamVjdCAlIDEgPT09IDAgJiYgIWNvbW1vbi5pc05lZ2F0aXZlWmVybyhvYmplY3QpKTtcbn1cblxubW9kdWxlLmV4cG9ydHMgPSBuZXcgVHlwZSgndGFnOnlhbWwub3JnLDIwMDI6aW50Jywge1xuICBraW5kOiAnc2NhbGFyJyxcbiAgcmVzb2x2ZTogcmVzb2x2ZVlhbWxJbnRlZ2VyLFxuICBjb25zdHJ1Y3Q6IGNvbnN0cnVjdFlhbWxJbnRlZ2VyLFxuICBwcmVkaWNhdGU6IGlzSW50ZWdlcixcbiAgcmVwcmVzZW50OiB7XG4gICAgYmluYXJ5OiAgICAgIGZ1bmN0aW9uIChvYmopIHsgcmV0dXJuIG9iaiA+PSAwID8gJzBiJyArIG9iai50b1N0cmluZygyKSA6ICctMGInICsgb2JqLnRvU3RyaW5nKDIpLnNsaWNlKDEpOyB9LFxuICAgIG9jdGFsOiAgICAgICBmdW5jdGlvbiAob2JqKSB7IHJldHVybiBvYmogPj0gMCA/ICcwJyAgKyBvYmoudG9TdHJpbmcoOCkgOiAnLTAnICArIG9iai50b1N0cmluZyg4KS5zbGljZSgxKTsgfSxcbiAgICBkZWNpbWFsOiAgICAgZnVuY3Rpb24gKG9iaikgeyByZXR1cm4gb2JqLnRvU3RyaW5nKDEwKTsgfSxcbiAgICAvKiBlc2xpbnQtZGlzYWJsZSBtYXgtbGVuICovXG4gICAgaGV4YWRlY2ltYWw6IGZ1bmN0aW9uIChvYmopIHsgcmV0dXJuIG9iaiA+PSAwID8gJzB4JyArIG9iai50b1N0cmluZygxNikudG9VcHBlckNhc2UoKSA6ICAnLTB4JyArIG9iai50b1N0cmluZygxNikudG9VcHBlckNhc2UoKS5zbGljZSgxKTsgfVxuICB9LFxuICBkZWZhdWx0U3R5bGU6ICdkZWNpbWFsJyxcbiAgc3R5bGVBbGlhc2VzOiB7XG4gICAgYmluYXJ5OiAgICAgIFsgMiwgICdiaW4nIF0sXG4gICAgb2N0YWw6ICAgICAgIFsgOCwgICdvY3QnIF0sXG4gICAgZGVjaW1hbDogICAgIFsgMTAsICdkZWMnIF0sXG4gICAgaGV4YWRlY2ltYWw6IFsgMTYsICdoZXgnIF1cbiAgfVxufSk7XG4iLCIndXNlIHN0cmljdCc7XG5cbnZhciBjb21tb24gPSByZXF1aXJlKCcuLi9jb21tb24nKTtcbnZhciBUeXBlICAgPSByZXF1aXJlKCcuLi90eXBlJyk7XG5cbnZhciBZQU1MX0ZMT0FUX1BBVFRFUk4gPSBuZXcgUmVnRXhwKFxuICAvLyAyLjVlNCwgMi41IGFuZCBpbnRlZ2Vyc1xuICAnXig/OlstK10/KD86MHxbMS05XVswLTlfXSopKD86XFxcXC5bMC05X10qKT8oPzpbZUVdWy0rXT9bMC05XSspPycgK1xuICAvLyAuMmU0LCAuMlxuICAvLyBzcGVjaWFsIGNhc2UsIHNlZW1zIG5vdCBmcm9tIHNwZWNcbiAgJ3xcXFxcLlswLTlfXSsoPzpbZUVdWy0rXT9bMC05XSspPycgK1xuICAvLyAyMDo1OVxuICAnfFstK10/WzAtOV1bMC05X10qKD86OlswLTVdP1swLTldKStcXFxcLlswLTlfXSonICtcbiAgLy8gLmluZlxuICAnfFstK10/XFxcXC4oPzppbmZ8SW5mfElORiknICtcbiAgLy8gLm5hblxuICAnfFxcXFwuKD86bmFufE5hTnxOQU4pKSQnKTtcblxuZnVuY3Rpb24gcmVzb2x2ZVlhbWxGbG9hdChkYXRhKSB7XG4gIGlmIChkYXRhID09PSBudWxsKSByZXR1cm4gZmFsc2U7XG5cbiAgaWYgKCFZQU1MX0ZMT0FUX1BBVFRFUk4udGVzdChkYXRhKSB8fFxuICAgICAgLy8gUXVpY2sgaGFjayB0byBub3QgYWxsb3cgaW50ZWdlcnMgZW5kIHdpdGggYF9gXG4gICAgICAvLyBQcm9iYWJseSBzaG91bGQgdXBkYXRlIHJlZ2V4cCAmIGNoZWNrIHNwZWVkXG4gICAgICBkYXRhW2RhdGEubGVuZ3RoIC0gMV0gPT09ICdfJykge1xuICAgIHJldHVybiBmYWxzZTtcbiAgfVxuXG4gIHJldHVybiB0cnVlO1xufVxuXG5mdW5jdGlvbiBjb25zdHJ1Y3RZYW1sRmxvYXQoZGF0YSkge1xuICB2YXIgdmFsdWUsIHNpZ24sIGJhc2UsIGRpZ2l0cztcblxuICB2YWx1ZSAgPSBkYXRhLnJlcGxhY2UoL18vZywgJycpLnRvTG93ZXJDYXNlKCk7XG4gIHNpZ24gICA9IHZhbHVlWzBdID09PSAnLScgPyAtMSA6IDE7XG4gIGRpZ2l0cyA9IFtdO1xuXG4gIGlmICgnKy0nLmluZGV4T2YodmFsdWVbMF0pID49IDApIHtcbiAgICB2YWx1ZSA9IHZhbHVlLnNsaWNlKDEpO1xuICB9XG5cbiAgaWYgKHZhbHVlID09PSAnLmluZicpIHtcbiAgICByZXR1cm4gKHNpZ24gPT09IDEpID8gTnVtYmVyLlBPU0lUSVZFX0lORklOSVRZIDogTnVtYmVyLk5FR0FUSVZFX0lORklOSVRZO1xuXG4gIH0gZWxzZSBpZiAodmFsdWUgPT09ICcubmFuJykge1xuICAgIHJldHVybiBOYU47XG5cbiAgfSBlbHNlIGlmICh2YWx1ZS5pbmRleE9mKCc6JykgPj0gMCkge1xuICAgIHZhbHVlLnNwbGl0KCc6JykuZm9yRWFjaChmdW5jdGlvbiAodikge1xuICAgICAgZGlnaXRzLnVuc2hpZnQocGFyc2VGbG9hdCh2LCAxMCkpO1xuICAgIH0pO1xuXG4gICAgdmFsdWUgPSAwLjA7XG4gICAgYmFzZSA9IDE7XG5cbiAgICBkaWdpdHMuZm9yRWFjaChmdW5jdGlvbiAoZCkge1xuICAgICAgdmFsdWUgKz0gZCAqIGJhc2U7XG4gICAgICBiYXNlICo9IDYwO1xuICAgIH0pO1xuXG4gICAgcmV0dXJuIHNpZ24gKiB2YWx1ZTtcblxuICB9XG4gIHJldHVybiBzaWduICogcGFyc2VGbG9hdCh2YWx1ZSwgMTApO1xufVxuXG5cbnZhciBTQ0lFTlRJRklDX1dJVEhPVVRfRE9UID0gL15bLStdP1swLTldK2UvO1xuXG5mdW5jdGlvbiByZXByZXNlbnRZYW1sRmxvYXQob2JqZWN0LCBzdHlsZSkge1xuICB2YXIgcmVzO1xuXG4gIGlmIChpc05hTihvYmplY3QpKSB7XG4gICAgc3dpdGNoIChzdHlsZSkge1xuICAgICAgY2FzZSAnbG93ZXJjYXNlJzogcmV0dXJuICcubmFuJztcbiAgICAgIGNhc2UgJ3VwcGVyY2FzZSc6IHJldHVybiAnLk5BTic7XG4gICAgICBjYXNlICdjYW1lbGNhc2UnOiByZXR1cm4gJy5OYU4nO1xuICAgIH1cbiAgfSBlbHNlIGlmIChOdW1iZXIuUE9TSVRJVkVfSU5GSU5JVFkgPT09IG9iamVjdCkge1xuICAgIHN3aXRjaCAoc3R5bGUpIHtcbiAgICAgIGNhc2UgJ2xvd2VyY2FzZSc6IHJldHVybiAnLmluZic7XG4gICAgICBjYXNlICd1cHBlcmNhc2UnOiByZXR1cm4gJy5JTkYnO1xuICAgICAgY2FzZSAnY2FtZWxjYXNlJzogcmV0dXJuICcuSW5mJztcbiAgICB9XG4gIH0gZWxzZSBpZiAoTnVtYmVyLk5FR0FUSVZFX0lORklOSVRZID09PSBvYmplY3QpIHtcbiAgICBzd2l0Y2ggKHN0eWxlKSB7XG4gICAgICBjYXNlICdsb3dlcmNhc2UnOiByZXR1cm4gJy0uaW5mJztcbiAgICAgIGNhc2UgJ3VwcGVyY2FzZSc6IHJldHVybiAnLS5JTkYnO1xuICAgICAgY2FzZSAnY2FtZWxjYXNlJzogcmV0dXJuICctLkluZic7XG4gICAgfVxuICB9IGVsc2UgaWYgKGNvbW1vbi5pc05lZ2F0aXZlWmVybyhvYmplY3QpKSB7XG4gICAgcmV0dXJuICctMC4wJztcbiAgfVxuXG4gIHJlcyA9IG9iamVjdC50b1N0cmluZygxMCk7XG5cbiAgLy8gSlMgc3RyaW5naWZpZXIgY2FuIGJ1aWxkIHNjaWVudGlmaWMgZm9ybWF0IHdpdGhvdXQgZG90czogNWUtMTAwLFxuICAvLyB3aGlsZSBZQU1MIHJlcXVyZXMgZG90OiA1LmUtMTAwLiBGaXggaXQgd2l0aCBzaW1wbGUgaGFja1xuXG4gIHJldHVybiBTQ0lFTlRJRklDX1dJVEhPVVRfRE9ULnRlc3QocmVzKSA/IHJlcy5yZXBsYWNlKCdlJywgJy5lJykgOiByZXM7XG59XG5cbmZ1bmN0aW9uIGlzRmxvYXQob2JqZWN0KSB7XG4gIHJldHVybiAoT2JqZWN0LnByb3RvdHlwZS50b1N0cmluZy5jYWxsKG9iamVjdCkgPT09ICdbb2JqZWN0IE51bWJlcl0nKSAmJlxuICAgICAgICAgKG9iamVjdCAlIDEgIT09IDAgfHwgY29tbW9uLmlzTmVnYXRpdmVaZXJvKG9iamVjdCkpO1xufVxuXG5tb2R1bGUuZXhwb3J0cyA9IG5ldyBUeXBlKCd0YWc6eWFtbC5vcmcsMjAwMjpmbG9hdCcsIHtcbiAga2luZDogJ3NjYWxhcicsXG4gIHJlc29sdmU6IHJlc29sdmVZYW1sRmxvYXQsXG4gIGNvbnN0cnVjdDogY29uc3RydWN0WWFtbEZsb2F0LFxuICBwcmVkaWNhdGU6IGlzRmxvYXQsXG4gIHJlcHJlc2VudDogcmVwcmVzZW50WWFtbEZsb2F0LFxuICBkZWZhdWx0U3R5bGU6ICdsb3dlcmNhc2UnXG59KTtcbiIsIi8vIFN0YW5kYXJkIFlBTUwncyBKU09OIHNjaGVtYS5cbi8vIGh0dHA6Ly93d3cueWFtbC5vcmcvc3BlYy8xLjIvc3BlYy5odG1sI2lkMjgwMzIzMVxuLy9cbi8vIE5PVEU6IEpTLVlBTUwgZG9lcyBub3Qgc3VwcG9ydCBzY2hlbWEtc3BlY2lmaWMgdGFnIHJlc29sdXRpb24gcmVzdHJpY3Rpb25zLlxuLy8gU28sIHRoaXMgc2NoZW1hIGlzIG5vdCBzdWNoIHN0cmljdCBhcyBkZWZpbmVkIGluIHRoZSBZQU1MIHNwZWNpZmljYXRpb24uXG4vLyBJdCBhbGxvd3MgbnVtYmVycyBpbiBiaW5hcnkgbm90YWlvbiwgdXNlIGBOdWxsYCBhbmQgYE5VTExgIGFzIGBudWxsYCwgZXRjLlxuXG5cbid1c2Ugc3RyaWN0JztcblxuXG52YXIgU2NoZW1hID0gcmVxdWlyZSgnLi4vc2NoZW1hJyk7XG5cblxubW9kdWxlLmV4cG9ydHMgPSBuZXcgU2NoZW1hKHtcbiAgaW5jbHVkZTogW1xuICAgIHJlcXVpcmUoJy4vZmFpbHNhZmUnKVxuICBdLFxuICBpbXBsaWNpdDogW1xuICAgIHJlcXVpcmUoJy4uL3R5cGUvbnVsbCcpLFxuICAgIHJlcXVpcmUoJy4uL3R5cGUvYm9vbCcpLFxuICAgIHJlcXVpcmUoJy4uL3R5cGUvaW50JyksXG4gICAgcmVxdWlyZSgnLi4vdHlwZS9mbG9hdCcpXG4gIF1cbn0pO1xuIiwiLy8gU3RhbmRhcmQgWUFNTCdzIENvcmUgc2NoZW1hLlxuLy8gaHR0cDovL3d3dy55YW1sLm9yZy9zcGVjLzEuMi9zcGVjLmh0bWwjaWQyODA0OTIzXG4vL1xuLy8gTk9URTogSlMtWUFNTCBkb2VzIG5vdCBzdXBwb3J0IHNjaGVtYS1zcGVjaWZpYyB0YWcgcmVzb2x1dGlvbiByZXN0cmljdGlvbnMuXG4vLyBTbywgQ29yZSBzY2hlbWEgaGFzIG5vIGRpc3RpbmN0aW9ucyBmcm9tIEpTT04gc2NoZW1hIGlzIEpTLVlBTUwuXG5cblxuJ3VzZSBzdHJpY3QnO1xuXG5cbnZhciBTY2hlbWEgPSByZXF1aXJlKCcuLi9zY2hlbWEnKTtcblxuXG5tb2R1bGUuZXhwb3J0cyA9IG5ldyBTY2hlbWEoe1xuICBpbmNsdWRlOiBbXG4gICAgcmVxdWlyZSgnLi9qc29uJylcbiAgXVxufSk7XG4iLCIndXNlIHN0cmljdCc7XG5cbnZhciBUeXBlID0gcmVxdWlyZSgnLi4vdHlwZScpO1xuXG52YXIgWUFNTF9EQVRFX1JFR0VYUCA9IG5ldyBSZWdFeHAoXG4gICdeKFswLTldWzAtOV1bMC05XVswLTldKScgICAgICAgICAgKyAvLyBbMV0geWVhclxuICAnLShbMC05XVswLTldKScgICAgICAgICAgICAgICAgICAgICsgLy8gWzJdIG1vbnRoXG4gICctKFswLTldWzAtOV0pJCcpOyAgICAgICAgICAgICAgICAgICAvLyBbM10gZGF5XG5cbnZhciBZQU1MX1RJTUVTVEFNUF9SRUdFWFAgPSBuZXcgUmVnRXhwKFxuICAnXihbMC05XVswLTldWzAtOV1bMC05XSknICAgICAgICAgICsgLy8gWzFdIHllYXJcbiAgJy0oWzAtOV1bMC05XT8pJyAgICAgICAgICAgICAgICAgICArIC8vIFsyXSBtb250aFxuICAnLShbMC05XVswLTldPyknICAgICAgICAgICAgICAgICAgICsgLy8gWzNdIGRheVxuICAnKD86W1R0XXxbIFxcXFx0XSspJyAgICAgICAgICAgICAgICAgKyAvLyAuLi5cbiAgJyhbMC05XVswLTldPyknICAgICAgICAgICAgICAgICAgICArIC8vIFs0XSBob3VyXG4gICc6KFswLTldWzAtOV0pJyAgICAgICAgICAgICAgICAgICAgKyAvLyBbNV0gbWludXRlXG4gICc6KFswLTldWzAtOV0pJyAgICAgICAgICAgICAgICAgICAgKyAvLyBbNl0gc2Vjb25kXG4gICcoPzpcXFxcLihbMC05XSopKT8nICAgICAgICAgICAgICAgICArIC8vIFs3XSBmcmFjdGlvblxuICAnKD86WyBcXFxcdF0qKFp8KFstK10pKFswLTldWzAtOV0/KScgKyAvLyBbOF0gdHogWzldIHR6X3NpZ24gWzEwXSB0el9ob3VyXG4gICcoPzo6KFswLTldWzAtOV0pKT8pKT8kJyk7ICAgICAgICAgICAvLyBbMTFdIHR6X21pbnV0ZVxuXG5mdW5jdGlvbiByZXNvbHZlWWFtbFRpbWVzdGFtcChkYXRhKSB7XG4gIGlmIChkYXRhID09PSBudWxsKSByZXR1cm4gZmFsc2U7XG4gIGlmIChZQU1MX0RBVEVfUkVHRVhQLmV4ZWMoZGF0YSkgIT09IG51bGwpIHJldHVybiB0cnVlO1xuICBpZiAoWUFNTF9USU1FU1RBTVBfUkVHRVhQLmV4ZWMoZGF0YSkgIT09IG51bGwpIHJldHVybiB0cnVlO1xuICByZXR1cm4gZmFsc2U7XG59XG5cbmZ1bmN0aW9uIGNvbnN0cnVjdFlhbWxUaW1lc3RhbXAoZGF0YSkge1xuICB2YXIgbWF0Y2gsIHllYXIsIG1vbnRoLCBkYXksIGhvdXIsIG1pbnV0ZSwgc2Vjb25kLCBmcmFjdGlvbiA9IDAsXG4gICAgICBkZWx0YSA9IG51bGwsIHR6X2hvdXIsIHR6X21pbnV0ZSwgZGF0ZTtcblxuICBtYXRjaCA9IFlBTUxfREFURV9SRUdFWFAuZXhlYyhkYXRhKTtcbiAgaWYgKG1hdGNoID09PSBudWxsKSBtYXRjaCA9IFlBTUxfVElNRVNUQU1QX1JFR0VYUC5leGVjKGRhdGEpO1xuXG4gIGlmIChtYXRjaCA9PT0gbnVsbCkgdGhyb3cgbmV3IEVycm9yKCdEYXRlIHJlc29sdmUgZXJyb3InKTtcblxuICAvLyBtYXRjaDogWzFdIHllYXIgWzJdIG1vbnRoIFszXSBkYXlcblxuICB5ZWFyID0gKyhtYXRjaFsxXSk7XG4gIG1vbnRoID0gKyhtYXRjaFsyXSkgLSAxOyAvLyBKUyBtb250aCBzdGFydHMgd2l0aCAwXG4gIGRheSA9ICsobWF0Y2hbM10pO1xuXG4gIGlmICghbWF0Y2hbNF0pIHsgLy8gbm8gaG91clxuICAgIHJldHVybiBuZXcgRGF0ZShEYXRlLlVUQyh5ZWFyLCBtb250aCwgZGF5KSk7XG4gIH1cblxuICAvLyBtYXRjaDogWzRdIGhvdXIgWzVdIG1pbnV0ZSBbNl0gc2Vjb25kIFs3XSBmcmFjdGlvblxuXG4gIGhvdXIgPSArKG1hdGNoWzRdKTtcbiAgbWludXRlID0gKyhtYXRjaFs1XSk7XG4gIHNlY29uZCA9ICsobWF0Y2hbNl0pO1xuXG4gIGlmIChtYXRjaFs3XSkge1xuICAgIGZyYWN0aW9uID0gbWF0Y2hbN10uc2xpY2UoMCwgMyk7XG4gICAgd2hpbGUgKGZyYWN0aW9uLmxlbmd0aCA8IDMpIHsgLy8gbWlsbGktc2Vjb25kc1xuICAgICAgZnJhY3Rpb24gKz0gJzAnO1xuICAgIH1cbiAgICBmcmFjdGlvbiA9ICtmcmFjdGlvbjtcbiAgfVxuXG4gIC8vIG1hdGNoOiBbOF0gdHogWzldIHR6X3NpZ24gWzEwXSB0el9ob3VyIFsxMV0gdHpfbWludXRlXG5cbiAgaWYgKG1hdGNoWzldKSB7XG4gICAgdHpfaG91ciA9ICsobWF0Y2hbMTBdKTtcbiAgICB0el9taW51dGUgPSArKG1hdGNoWzExXSB8fCAwKTtcbiAgICBkZWx0YSA9ICh0el9ob3VyICogNjAgKyB0el9taW51dGUpICogNjAwMDA7IC8vIGRlbHRhIGluIG1pbGktc2Vjb25kc1xuICAgIGlmIChtYXRjaFs5XSA9PT0gJy0nKSBkZWx0YSA9IC1kZWx0YTtcbiAgfVxuXG4gIGRhdGUgPSBuZXcgRGF0ZShEYXRlLlVUQyh5ZWFyLCBtb250aCwgZGF5LCBob3VyLCBtaW51dGUsIHNlY29uZCwgZnJhY3Rpb24pKTtcblxuICBpZiAoZGVsdGEpIGRhdGUuc2V0VGltZShkYXRlLmdldFRpbWUoKSAtIGRlbHRhKTtcblxuICByZXR1cm4gZGF0ZTtcbn1cblxuZnVuY3Rpb24gcmVwcmVzZW50WWFtbFRpbWVzdGFtcChvYmplY3QgLyosIHN0eWxlKi8pIHtcbiAgcmV0dXJuIG9iamVjdC50b0lTT1N0cmluZygpO1xufVxuXG5tb2R1bGUuZXhwb3J0cyA9IG5ldyBUeXBlKCd0YWc6eWFtbC5vcmcsMjAwMjp0aW1lc3RhbXAnLCB7XG4gIGtpbmQ6ICdzY2FsYXInLFxuICByZXNvbHZlOiByZXNvbHZlWWFtbFRpbWVzdGFtcCxcbiAgY29uc3RydWN0OiBjb25zdHJ1Y3RZYW1sVGltZXN0YW1wLFxuICBpbnN0YW5jZU9mOiBEYXRlLFxuICByZXByZXNlbnQ6IHJlcHJlc2VudFlhbWxUaW1lc3RhbXBcbn0pO1xuIiwiJ3VzZSBzdHJpY3QnO1xuXG52YXIgVHlwZSA9IHJlcXVpcmUoJy4uL3R5cGUnKTtcblxuZnVuY3Rpb24gcmVzb2x2ZVlhbWxNZXJnZShkYXRhKSB7XG4gIHJldHVybiBkYXRhID09PSAnPDwnIHx8IGRhdGEgPT09IG51bGw7XG59XG5cbm1vZHVsZS5leHBvcnRzID0gbmV3IFR5cGUoJ3RhZzp5YW1sLm9yZywyMDAyOm1lcmdlJywge1xuICBraW5kOiAnc2NhbGFyJyxcbiAgcmVzb2x2ZTogcmVzb2x2ZVlhbWxNZXJnZVxufSk7XG4iLCIndXNlIHN0cmljdCc7XG5cbi8qZXNsaW50LWRpc2FibGUgbm8tYml0d2lzZSovXG5cbnZhciBOb2RlQnVmZmVyO1xuXG50cnkge1xuICAvLyBBIHRyaWNrIGZvciBicm93c2VyaWZpZWQgdmVyc2lvbiwgdG8gbm90IGluY2x1ZGUgYEJ1ZmZlcmAgc2hpbVxuICB2YXIgX3JlcXVpcmUgPSByZXF1aXJlO1xuICBOb2RlQnVmZmVyID0gX3JlcXVpcmUoJ2J1ZmZlcicpLkJ1ZmZlcjtcbn0gY2F0Y2ggKF9fKSB7fVxuXG52YXIgVHlwZSAgICAgICA9IHJlcXVpcmUoJy4uL3R5cGUnKTtcblxuXG4vLyBbIDY0LCA2NSwgNjYgXSAtPiBbIHBhZGRpbmcsIENSLCBMRiBdXG52YXIgQkFTRTY0X01BUCA9ICdBQkNERUZHSElKS0xNTk9QUVJTVFVWV1hZWmFiY2RlZmdoaWprbG1ub3BxcnN0dXZ3eHl6MDEyMzQ1Njc4OSsvPVxcblxccic7XG5cblxuZnVuY3Rpb24gcmVzb2x2ZVlhbWxCaW5hcnkoZGF0YSkge1xuICBpZiAoZGF0YSA9PT0gbnVsbCkgcmV0dXJuIGZhbHNlO1xuXG4gIHZhciBjb2RlLCBpZHgsIGJpdGxlbiA9IDAsIG1heCA9IGRhdGEubGVuZ3RoLCBtYXAgPSBCQVNFNjRfTUFQO1xuXG4gIC8vIENvbnZlcnQgb25lIGJ5IG9uZS5cbiAgZm9yIChpZHggPSAwOyBpZHggPCBtYXg7IGlkeCsrKSB7XG4gICAgY29kZSA9IG1hcC5pbmRleE9mKGRhdGEuY2hhckF0KGlkeCkpO1xuXG4gICAgLy8gU2tpcCBDUi9MRlxuICAgIGlmIChjb2RlID4gNjQpIGNvbnRpbnVlO1xuXG4gICAgLy8gRmFpbCBvbiBpbGxlZ2FsIGNoYXJhY3RlcnNcbiAgICBpZiAoY29kZSA8IDApIHJldHVybiBmYWxzZTtcblxuICAgIGJpdGxlbiArPSA2O1xuICB9XG5cbiAgLy8gSWYgdGhlcmUgYXJlIGFueSBiaXRzIGxlZnQsIHNvdXJjZSB3YXMgY29ycnVwdGVkXG4gIHJldHVybiAoYml0bGVuICUgOCkgPT09IDA7XG59XG5cbmZ1bmN0aW9uIGNvbnN0cnVjdFlhbWxCaW5hcnkoZGF0YSkge1xuICB2YXIgaWR4LCB0YWlsYml0cyxcbiAgICAgIGlucHV0ID0gZGF0YS5yZXBsYWNlKC9bXFxyXFxuPV0vZywgJycpLCAvLyByZW1vdmUgQ1IvTEYgJiBwYWRkaW5nIHRvIHNpbXBsaWZ5IHNjYW5cbiAgICAgIG1heCA9IGlucHV0Lmxlbmd0aCxcbiAgICAgIG1hcCA9IEJBU0U2NF9NQVAsXG4gICAgICBiaXRzID0gMCxcbiAgICAgIHJlc3VsdCA9IFtdO1xuXG4gIC8vIENvbGxlY3QgYnkgNio0IGJpdHMgKDMgYnl0ZXMpXG5cbiAgZm9yIChpZHggPSAwOyBpZHggPCBtYXg7IGlkeCsrKSB7XG4gICAgaWYgKChpZHggJSA0ID09PSAwKSAmJiBpZHgpIHtcbiAgICAgIHJlc3VsdC5wdXNoKChiaXRzID4+IDE2KSAmIDB4RkYpO1xuICAgICAgcmVzdWx0LnB1c2goKGJpdHMgPj4gOCkgJiAweEZGKTtcbiAgICAgIHJlc3VsdC5wdXNoKGJpdHMgJiAweEZGKTtcbiAgICB9XG5cbiAgICBiaXRzID0gKGJpdHMgPDwgNikgfCBtYXAuaW5kZXhPZihpbnB1dC5jaGFyQXQoaWR4KSk7XG4gIH1cblxuICAvLyBEdW1wIHRhaWxcblxuICB0YWlsYml0cyA9IChtYXggJSA0KSAqIDY7XG5cbiAgaWYgKHRhaWxiaXRzID09PSAwKSB7XG4gICAgcmVzdWx0LnB1c2goKGJpdHMgPj4gMTYpICYgMHhGRik7XG4gICAgcmVzdWx0LnB1c2goKGJpdHMgPj4gOCkgJiAweEZGKTtcbiAgICByZXN1bHQucHVzaChiaXRzICYgMHhGRik7XG4gIH0gZWxzZSBpZiAodGFpbGJpdHMgPT09IDE4KSB7XG4gICAgcmVzdWx0LnB1c2goKGJpdHMgPj4gMTApICYgMHhGRik7XG4gICAgcmVzdWx0LnB1c2goKGJpdHMgPj4gMikgJiAweEZGKTtcbiAgfSBlbHNlIGlmICh0YWlsYml0cyA9PT0gMTIpIHtcbiAgICByZXN1bHQucHVzaCgoYml0cyA+PiA0KSAmIDB4RkYpO1xuICB9XG5cbiAgLy8gV3JhcCBpbnRvIEJ1ZmZlciBmb3IgTm9kZUpTIGFuZCBsZWF2ZSBBcnJheSBmb3IgYnJvd3NlclxuICBpZiAoTm9kZUJ1ZmZlcikge1xuICAgIC8vIFN1cHBvcnQgbm9kZSA2LisgQnVmZmVyIEFQSSB3aGVuIGF2YWlsYWJsZVxuICAgIHJldHVybiBOb2RlQnVmZmVyLmZyb20gPyBOb2RlQnVmZmVyLmZyb20ocmVzdWx0KSA6IG5ldyBOb2RlQnVmZmVyKHJlc3VsdCk7XG4gIH1cblxuICByZXR1cm4gcmVzdWx0O1xufVxuXG5mdW5jdGlvbiByZXByZXNlbnRZYW1sQmluYXJ5KG9iamVjdCAvKiwgc3R5bGUqLykge1xuICB2YXIgcmVzdWx0ID0gJycsIGJpdHMgPSAwLCBpZHgsIHRhaWwsXG4gICAgICBtYXggPSBvYmplY3QubGVuZ3RoLFxuICAgICAgbWFwID0gQkFTRTY0X01BUDtcblxuICAvLyBDb252ZXJ0IGV2ZXJ5IHRocmVlIGJ5dGVzIHRvIDQgQVNDSUkgY2hhcmFjdGVycy5cblxuICBmb3IgKGlkeCA9IDA7IGlkeCA8IG1heDsgaWR4KyspIHtcbiAgICBpZiAoKGlkeCAlIDMgPT09IDApICYmIGlkeCkge1xuICAgICAgcmVzdWx0ICs9IG1hcFsoYml0cyA+PiAxOCkgJiAweDNGXTtcbiAgICAgIHJlc3VsdCArPSBtYXBbKGJpdHMgPj4gMTIpICYgMHgzRl07XG4gICAgICByZXN1bHQgKz0gbWFwWyhiaXRzID4+IDYpICYgMHgzRl07XG4gICAgICByZXN1bHQgKz0gbWFwW2JpdHMgJiAweDNGXTtcbiAgICB9XG5cbiAgICBiaXRzID0gKGJpdHMgPDwgOCkgKyBvYmplY3RbaWR4XTtcbiAgfVxuXG4gIC8vIER1bXAgdGFpbFxuXG4gIHRhaWwgPSBtYXggJSAzO1xuXG4gIGlmICh0YWlsID09PSAwKSB7XG4gICAgcmVzdWx0ICs9IG1hcFsoYml0cyA+PiAxOCkgJiAweDNGXTtcbiAgICByZXN1bHQgKz0gbWFwWyhiaXRzID4+IDEyKSAmIDB4M0ZdO1xuICAgIHJlc3VsdCArPSBtYXBbKGJpdHMgPj4gNikgJiAweDNGXTtcbiAgICByZXN1bHQgKz0gbWFwW2JpdHMgJiAweDNGXTtcbiAgfSBlbHNlIGlmICh0YWlsID09PSAyKSB7XG4gICAgcmVzdWx0ICs9IG1hcFsoYml0cyA+PiAxMCkgJiAweDNGXTtcbiAgICByZXN1bHQgKz0gbWFwWyhiaXRzID4+IDQpICYgMHgzRl07XG4gICAgcmVzdWx0ICs9IG1hcFsoYml0cyA8PCAyKSAmIDB4M0ZdO1xuICAgIHJlc3VsdCArPSBtYXBbNjRdO1xuICB9IGVsc2UgaWYgKHRhaWwgPT09IDEpIHtcbiAgICByZXN1bHQgKz0gbWFwWyhiaXRzID4+IDIpICYgMHgzRl07XG4gICAgcmVzdWx0ICs9IG1hcFsoYml0cyA8PCA0KSAmIDB4M0ZdO1xuICAgIHJlc3VsdCArPSBtYXBbNjRdO1xuICAgIHJlc3VsdCArPSBtYXBbNjRdO1xuICB9XG5cbiAgcmV0dXJuIHJlc3VsdDtcbn1cblxuZnVuY3Rpb24gaXNCaW5hcnkob2JqZWN0KSB7XG4gIHJldHVybiBOb2RlQnVmZmVyICYmIE5vZGVCdWZmZXIuaXNCdWZmZXIob2JqZWN0KTtcbn1cblxubW9kdWxlLmV4cG9ydHMgPSBuZXcgVHlwZSgndGFnOnlhbWwub3JnLDIwMDI6YmluYXJ5Jywge1xuICBraW5kOiAnc2NhbGFyJyxcbiAgcmVzb2x2ZTogcmVzb2x2ZVlhbWxCaW5hcnksXG4gIGNvbnN0cnVjdDogY29uc3RydWN0WWFtbEJpbmFyeSxcbiAgcHJlZGljYXRlOiBpc0JpbmFyeSxcbiAgcmVwcmVzZW50OiByZXByZXNlbnRZYW1sQmluYXJ5XG59KTtcbiIsIid1c2Ugc3RyaWN0JztcblxudmFyIFR5cGUgPSByZXF1aXJlKCcuLi90eXBlJyk7XG5cbnZhciBfaGFzT3duUHJvcGVydHkgPSBPYmplY3QucHJvdG90eXBlLmhhc093blByb3BlcnR5O1xudmFyIF90b1N0cmluZyAgICAgICA9IE9iamVjdC5wcm90b3R5cGUudG9TdHJpbmc7XG5cbmZ1bmN0aW9uIHJlc29sdmVZYW1sT21hcChkYXRhKSB7XG4gIGlmIChkYXRhID09PSBudWxsKSByZXR1cm4gdHJ1ZTtcblxuICB2YXIgb2JqZWN0S2V5cyA9IFtdLCBpbmRleCwgbGVuZ3RoLCBwYWlyLCBwYWlyS2V5LCBwYWlySGFzS2V5LFxuICAgICAgb2JqZWN0ID0gZGF0YTtcblxuICBmb3IgKGluZGV4ID0gMCwgbGVuZ3RoID0gb2JqZWN0Lmxlbmd0aDsgaW5kZXggPCBsZW5ndGg7IGluZGV4ICs9IDEpIHtcbiAgICBwYWlyID0gb2JqZWN0W2luZGV4XTtcbiAgICBwYWlySGFzS2V5ID0gZmFsc2U7XG5cbiAgICBpZiAoX3RvU3RyaW5nLmNhbGwocGFpcikgIT09ICdbb2JqZWN0IE9iamVjdF0nKSByZXR1cm4gZmFsc2U7XG5cbiAgICBmb3IgKHBhaXJLZXkgaW4gcGFpcikge1xuICAgICAgaWYgKF9oYXNPd25Qcm9wZXJ0eS5jYWxsKHBhaXIsIHBhaXJLZXkpKSB7XG4gICAgICAgIGlmICghcGFpckhhc0tleSkgcGFpckhhc0tleSA9IHRydWU7XG4gICAgICAgIGVsc2UgcmV0dXJuIGZhbHNlO1xuICAgICAgfVxuICAgIH1cblxuICAgIGlmICghcGFpckhhc0tleSkgcmV0dXJuIGZhbHNlO1xuXG4gICAgaWYgKG9iamVjdEtleXMuaW5kZXhPZihwYWlyS2V5KSA9PT0gLTEpIG9iamVjdEtleXMucHVzaChwYWlyS2V5KTtcbiAgICBlbHNlIHJldHVybiBmYWxzZTtcbiAgfVxuXG4gIHJldHVybiB0cnVlO1xufVxuXG5mdW5jdGlvbiBjb25zdHJ1Y3RZYW1sT21hcChkYXRhKSB7XG4gIHJldHVybiBkYXRhICE9PSBudWxsID8gZGF0YSA6IFtdO1xufVxuXG5tb2R1bGUuZXhwb3J0cyA9IG5ldyBUeXBlKCd0YWc6eWFtbC5vcmcsMjAwMjpvbWFwJywge1xuICBraW5kOiAnc2VxdWVuY2UnLFxuICByZXNvbHZlOiByZXNvbHZlWWFtbE9tYXAsXG4gIGNvbnN0cnVjdDogY29uc3RydWN0WWFtbE9tYXBcbn0pO1xuIiwiJ3VzZSBzdHJpY3QnO1xuXG52YXIgVHlwZSA9IHJlcXVpcmUoJy4uL3R5cGUnKTtcblxudmFyIF90b1N0cmluZyA9IE9iamVjdC5wcm90b3R5cGUudG9TdHJpbmc7XG5cbmZ1bmN0aW9uIHJlc29sdmVZYW1sUGFpcnMoZGF0YSkge1xuICBpZiAoZGF0YSA9PT0gbnVsbCkgcmV0dXJuIHRydWU7XG5cbiAgdmFyIGluZGV4LCBsZW5ndGgsIHBhaXIsIGtleXMsIHJlc3VsdCxcbiAgICAgIG9iamVjdCA9IGRhdGE7XG5cbiAgcmVzdWx0ID0gbmV3IEFycmF5KG9iamVjdC5sZW5ndGgpO1xuXG4gIGZvciAoaW5kZXggPSAwLCBsZW5ndGggPSBvYmplY3QubGVuZ3RoOyBpbmRleCA8IGxlbmd0aDsgaW5kZXggKz0gMSkge1xuICAgIHBhaXIgPSBvYmplY3RbaW5kZXhdO1xuXG4gICAgaWYgKF90b1N0cmluZy5jYWxsKHBhaXIpICE9PSAnW29iamVjdCBPYmplY3RdJykgcmV0dXJuIGZhbHNlO1xuXG4gICAga2V5cyA9IE9iamVjdC5rZXlzKHBhaXIpO1xuXG4gICAgaWYgKGtleXMubGVuZ3RoICE9PSAxKSByZXR1cm4gZmFsc2U7XG5cbiAgICByZXN1bHRbaW5kZXhdID0gWyBrZXlzWzBdLCBwYWlyW2tleXNbMF1dIF07XG4gIH1cblxuICByZXR1cm4gdHJ1ZTtcbn1cblxuZnVuY3Rpb24gY29uc3RydWN0WWFtbFBhaXJzKGRhdGEpIHtcbiAgaWYgKGRhdGEgPT09IG51bGwpIHJldHVybiBbXTtcblxuICB2YXIgaW5kZXgsIGxlbmd0aCwgcGFpciwga2V5cywgcmVzdWx0LFxuICAgICAgb2JqZWN0ID0gZGF0YTtcblxuICByZXN1bHQgPSBuZXcgQXJyYXkob2JqZWN0Lmxlbmd0aCk7XG5cbiAgZm9yIChpbmRleCA9IDAsIGxlbmd0aCA9IG9iamVjdC5sZW5ndGg7IGluZGV4IDwgbGVuZ3RoOyBpbmRleCArPSAxKSB7XG4gICAgcGFpciA9IG9iamVjdFtpbmRleF07XG5cbiAgICBrZXlzID0gT2JqZWN0LmtleXMocGFpcik7XG5cbiAgICByZXN1bHRbaW5kZXhdID0gWyBrZXlzWzBdLCBwYWlyW2tleXNbMF1dIF07XG4gIH1cblxuICByZXR1cm4gcmVzdWx0O1xufVxuXG5tb2R1bGUuZXhwb3J0cyA9IG5ldyBUeXBlKCd0YWc6eWFtbC5vcmcsMjAwMjpwYWlycycsIHtcbiAga2luZDogJ3NlcXVlbmNlJyxcbiAgcmVzb2x2ZTogcmVzb2x2ZVlhbWxQYWlycyxcbiAgY29uc3RydWN0OiBjb25zdHJ1Y3RZYW1sUGFpcnNcbn0pO1xuIiwiJ3VzZSBzdHJpY3QnO1xuXG52YXIgVHlwZSA9IHJlcXVpcmUoJy4uL3R5cGUnKTtcblxudmFyIF9oYXNPd25Qcm9wZXJ0eSA9IE9iamVjdC5wcm90b3R5cGUuaGFzT3duUHJvcGVydHk7XG5cbmZ1bmN0aW9uIHJlc29sdmVZYW1sU2V0KGRhdGEpIHtcbiAgaWYgKGRhdGEgPT09IG51bGwpIHJldHVybiB0cnVlO1xuXG4gIHZhciBrZXksIG9iamVjdCA9IGRhdGE7XG5cbiAgZm9yIChrZXkgaW4gb2JqZWN0KSB7XG4gICAgaWYgKF9oYXNPd25Qcm9wZXJ0eS5jYWxsKG9iamVjdCwga2V5KSkge1xuICAgICAgaWYgKG9iamVjdFtrZXldICE9PSBudWxsKSByZXR1cm4gZmFsc2U7XG4gICAgfVxuICB9XG5cbiAgcmV0dXJuIHRydWU7XG59XG5cbmZ1bmN0aW9uIGNvbnN0cnVjdFlhbWxTZXQoZGF0YSkge1xuICByZXR1cm4gZGF0YSAhPT0gbnVsbCA/IGRhdGEgOiB7fTtcbn1cblxubW9kdWxlLmV4cG9ydHMgPSBuZXcgVHlwZSgndGFnOnlhbWwub3JnLDIwMDI6c2V0Jywge1xuICBraW5kOiAnbWFwcGluZycsXG4gIHJlc29sdmU6IHJlc29sdmVZYW1sU2V0LFxuICBjb25zdHJ1Y3Q6IGNvbnN0cnVjdFlhbWxTZXRcbn0pO1xuIiwiLy8gSlMtWUFNTCdzIGRlZmF1bHQgc2NoZW1hIGZvciBgc2FmZUxvYWRgIGZ1bmN0aW9uLlxuLy8gSXQgaXMgbm90IGRlc2NyaWJlZCBpbiB0aGUgWUFNTCBzcGVjaWZpY2F0aW9uLlxuLy9cbi8vIFRoaXMgc2NoZW1hIGlzIGJhc2VkIG9uIHN0YW5kYXJkIFlBTUwncyBDb3JlIHNjaGVtYSBhbmQgaW5jbHVkZXMgbW9zdCBvZlxuLy8gZXh0cmEgdHlwZXMgZGVzY3JpYmVkIGF0IFlBTUwgdGFnIHJlcG9zaXRvcnkuIChodHRwOi8veWFtbC5vcmcvdHlwZS8pXG5cblxuJ3VzZSBzdHJpY3QnO1xuXG5cbnZhciBTY2hlbWEgPSByZXF1aXJlKCcuLi9zY2hlbWEnKTtcblxuXG5tb2R1bGUuZXhwb3J0cyA9IG5ldyBTY2hlbWEoe1xuICBpbmNsdWRlOiBbXG4gICAgcmVxdWlyZSgnLi9jb3JlJylcbiAgXSxcbiAgaW1wbGljaXQ6IFtcbiAgICByZXF1aXJlKCcuLi90eXBlL3RpbWVzdGFtcCcpLFxuICAgIHJlcXVpcmUoJy4uL3R5cGUvbWVyZ2UnKVxuICBdLFxuICBleHBsaWNpdDogW1xuICAgIHJlcXVpcmUoJy4uL3R5cGUvYmluYXJ5JyksXG4gICAgcmVxdWlyZSgnLi4vdHlwZS9vbWFwJyksXG4gICAgcmVxdWlyZSgnLi4vdHlwZS9wYWlycycpLFxuICAgIHJlcXVpcmUoJy4uL3R5cGUvc2V0JylcbiAgXVxufSk7XG4iLCIndXNlIHN0cmljdCc7XG5cbnZhciBUeXBlID0gcmVxdWlyZSgnLi4vLi4vdHlwZScpO1xuXG5mdW5jdGlvbiByZXNvbHZlSmF2YXNjcmlwdFVuZGVmaW5lZCgpIHtcbiAgcmV0dXJuIHRydWU7XG59XG5cbmZ1bmN0aW9uIGNvbnN0cnVjdEphdmFzY3JpcHRVbmRlZmluZWQoKSB7XG4gIC8qZXNsaW50LWRpc2FibGUgbm8tdW5kZWZpbmVkKi9cbiAgcmV0dXJuIHVuZGVmaW5lZDtcbn1cblxuZnVuY3Rpb24gcmVwcmVzZW50SmF2YXNjcmlwdFVuZGVmaW5lZCgpIHtcbiAgcmV0dXJuICcnO1xufVxuXG5mdW5jdGlvbiBpc1VuZGVmaW5lZChvYmplY3QpIHtcbiAgcmV0dXJuIHR5cGVvZiBvYmplY3QgPT09ICd1bmRlZmluZWQnO1xufVxuXG5tb2R1bGUuZXhwb3J0cyA9IG5ldyBUeXBlKCd0YWc6eWFtbC5vcmcsMjAwMjpqcy91bmRlZmluZWQnLCB7XG4gIGtpbmQ6ICdzY2FsYXInLFxuICByZXNvbHZlOiByZXNvbHZlSmF2YXNjcmlwdFVuZGVmaW5lZCxcbiAgY29uc3RydWN0OiBjb25zdHJ1Y3RKYXZhc2NyaXB0VW5kZWZpbmVkLFxuICBwcmVkaWNhdGU6IGlzVW5kZWZpbmVkLFxuICByZXByZXNlbnQ6IHJlcHJlc2VudEphdmFzY3JpcHRVbmRlZmluZWRcbn0pO1xuIiwiJ3VzZSBzdHJpY3QnO1xuXG52YXIgVHlwZSA9IHJlcXVpcmUoJy4uLy4uL3R5cGUnKTtcblxuZnVuY3Rpb24gcmVzb2x2ZUphdmFzY3JpcHRSZWdFeHAoZGF0YSkge1xuICBpZiAoZGF0YSA9PT0gbnVsbCkgcmV0dXJuIGZhbHNlO1xuICBpZiAoZGF0YS5sZW5ndGggPT09IDApIHJldHVybiBmYWxzZTtcblxuICB2YXIgcmVnZXhwID0gZGF0YSxcbiAgICAgIHRhaWwgICA9IC9cXC8oW2dpbV0qKSQvLmV4ZWMoZGF0YSksXG4gICAgICBtb2RpZmllcnMgPSAnJztcblxuICAvLyBpZiByZWdleHAgc3RhcnRzIHdpdGggJy8nIGl0IGNhbiBoYXZlIG1vZGlmaWVycyBhbmQgbXVzdCBiZSBwcm9wZXJseSBjbG9zZWRcbiAgLy8gYC9mb28vZ2ltYCAtIG1vZGlmaWVycyB0YWlsIGNhbiBiZSBtYXhpbXVtIDMgY2hhcnNcbiAgaWYgKHJlZ2V4cFswXSA9PT0gJy8nKSB7XG4gICAgaWYgKHRhaWwpIG1vZGlmaWVycyA9IHRhaWxbMV07XG5cbiAgICBpZiAobW9kaWZpZXJzLmxlbmd0aCA+IDMpIHJldHVybiBmYWxzZTtcbiAgICAvLyBpZiBleHByZXNzaW9uIHN0YXJ0cyB3aXRoIC8sIGlzIHNob3VsZCBiZSBwcm9wZXJseSB0ZXJtaW5hdGVkXG4gICAgaWYgKHJlZ2V4cFtyZWdleHAubGVuZ3RoIC0gbW9kaWZpZXJzLmxlbmd0aCAtIDFdICE9PSAnLycpIHJldHVybiBmYWxzZTtcbiAgfVxuXG4gIHJldHVybiB0cnVlO1xufVxuXG5mdW5jdGlvbiBjb25zdHJ1Y3RKYXZhc2NyaXB0UmVnRXhwKGRhdGEpIHtcbiAgdmFyIHJlZ2V4cCA9IGRhdGEsXG4gICAgICB0YWlsICAgPSAvXFwvKFtnaW1dKikkLy5leGVjKGRhdGEpLFxuICAgICAgbW9kaWZpZXJzID0gJyc7XG5cbiAgLy8gYC9mb28vZ2ltYCAtIHRhaWwgY2FuIGJlIG1heGltdW0gNCBjaGFyc1xuICBpZiAocmVnZXhwWzBdID09PSAnLycpIHtcbiAgICBpZiAodGFpbCkgbW9kaWZpZXJzID0gdGFpbFsxXTtcbiAgICByZWdleHAgPSByZWdleHAuc2xpY2UoMSwgcmVnZXhwLmxlbmd0aCAtIG1vZGlmaWVycy5sZW5ndGggLSAxKTtcbiAgfVxuXG4gIHJldHVybiBuZXcgUmVnRXhwKHJlZ2V4cCwgbW9kaWZpZXJzKTtcbn1cblxuZnVuY3Rpb24gcmVwcmVzZW50SmF2YXNjcmlwdFJlZ0V4cChvYmplY3QgLyosIHN0eWxlKi8pIHtcbiAgdmFyIHJlc3VsdCA9ICcvJyArIG9iamVjdC5zb3VyY2UgKyAnLyc7XG5cbiAgaWYgKG9iamVjdC5nbG9iYWwpIHJlc3VsdCArPSAnZyc7XG4gIGlmIChvYmplY3QubXVsdGlsaW5lKSByZXN1bHQgKz0gJ20nO1xuICBpZiAob2JqZWN0Lmlnbm9yZUNhc2UpIHJlc3VsdCArPSAnaSc7XG5cbiAgcmV0dXJuIHJlc3VsdDtcbn1cblxuZnVuY3Rpb24gaXNSZWdFeHAob2JqZWN0KSB7XG4gIHJldHVybiBPYmplY3QucHJvdG90eXBlLnRvU3RyaW5nLmNhbGwob2JqZWN0KSA9PT0gJ1tvYmplY3QgUmVnRXhwXSc7XG59XG5cbm1vZHVsZS5leHBvcnRzID0gbmV3IFR5cGUoJ3RhZzp5YW1sLm9yZywyMDAyOmpzL3JlZ2V4cCcsIHtcbiAga2luZDogJ3NjYWxhcicsXG4gIHJlc29sdmU6IHJlc29sdmVKYXZhc2NyaXB0UmVnRXhwLFxuICBjb25zdHJ1Y3Q6IGNvbnN0cnVjdEphdmFzY3JpcHRSZWdFeHAsXG4gIHByZWRpY2F0ZTogaXNSZWdFeHAsXG4gIHJlcHJlc2VudDogcmVwcmVzZW50SmF2YXNjcmlwdFJlZ0V4cFxufSk7XG4iLCIndXNlIHN0cmljdCc7XG5cbnZhciBlc3ByaW1hO1xuXG4vLyBCcm93c2VyaWZpZWQgdmVyc2lvbiBkb2VzIG5vdCBoYXZlIGVzcHJpbWFcbi8vXG4vLyAxLiBGb3Igbm9kZS5qcyBqdXN0IHJlcXVpcmUgbW9kdWxlIGFzIGRlcHNcbi8vIDIuIEZvciBicm93c2VyIHRyeSB0byByZXF1aXJlIG11ZHVsZSB2aWEgZXh0ZXJuYWwgQU1EIHN5c3RlbS5cbi8vICAgIElmIG5vdCBmb3VuZCAtIHRyeSB0byBmYWxsYmFjayB0byB3aW5kb3cuZXNwcmltYS4gSWYgbm90XG4vLyAgICBmb3VuZCB0b28gLSB0aGVuIGZhaWwgdG8gcGFyc2UuXG4vL1xudHJ5IHtcbiAgLy8gd29ya2Fyb3VuZCB0byBleGNsdWRlIHBhY2thZ2UgZnJvbSBicm93c2VyaWZ5IGxpc3QuXG4gIHZhciBfcmVxdWlyZSA9IHJlcXVpcmU7XG4gIGVzcHJpbWEgPSBfcmVxdWlyZSgnZXNwcmltYScpO1xufSBjYXRjaCAoXykge1xuICAvKiBlc2xpbnQtZGlzYWJsZSBuby1yZWRlY2xhcmUgKi9cbiAgLyogZ2xvYmFsIHdpbmRvdyAqL1xuICBpZiAodHlwZW9mIHdpbmRvdyAhPT0gJ3VuZGVmaW5lZCcpIGVzcHJpbWEgPSB3aW5kb3cuZXNwcmltYTtcbn1cblxudmFyIFR5cGUgPSByZXF1aXJlKCcuLi8uLi90eXBlJyk7XG5cbmZ1bmN0aW9uIHJlc29sdmVKYXZhc2NyaXB0RnVuY3Rpb24oZGF0YSkge1xuICBpZiAoZGF0YSA9PT0gbnVsbCkgcmV0dXJuIGZhbHNlO1xuXG4gIHRyeSB7XG4gICAgdmFyIHNvdXJjZSA9ICcoJyArIGRhdGEgKyAnKScsXG4gICAgICAgIGFzdCAgICA9IGVzcHJpbWEucGFyc2Uoc291cmNlLCB7IHJhbmdlOiB0cnVlIH0pO1xuXG4gICAgaWYgKGFzdC50eXBlICAgICAgICAgICAgICAgICAgICAhPT0gJ1Byb2dyYW0nICAgICAgICAgICAgIHx8XG4gICAgICAgIGFzdC5ib2R5Lmxlbmd0aCAgICAgICAgICAgICAhPT0gMSAgICAgICAgICAgICAgICAgICAgIHx8XG4gICAgICAgIGFzdC5ib2R5WzBdLnR5cGUgICAgICAgICAgICAhPT0gJ0V4cHJlc3Npb25TdGF0ZW1lbnQnIHx8XG4gICAgICAgIChhc3QuYm9keVswXS5leHByZXNzaW9uLnR5cGUgIT09ICdBcnJvd0Z1bmN0aW9uRXhwcmVzc2lvbicgJiZcbiAgICAgICAgICBhc3QuYm9keVswXS5leHByZXNzaW9uLnR5cGUgIT09ICdGdW5jdGlvbkV4cHJlc3Npb24nKSkge1xuICAgICAgcmV0dXJuIGZhbHNlO1xuICAgIH1cblxuICAgIHJldHVybiB0cnVlO1xuICB9IGNhdGNoIChlcnIpIHtcbiAgICByZXR1cm4gZmFsc2U7XG4gIH1cbn1cblxuZnVuY3Rpb24gY29uc3RydWN0SmF2YXNjcmlwdEZ1bmN0aW9uKGRhdGEpIHtcbiAgLypqc2xpbnQgZXZpbDp0cnVlKi9cblxuICB2YXIgc291cmNlID0gJygnICsgZGF0YSArICcpJyxcbiAgICAgIGFzdCAgICA9IGVzcHJpbWEucGFyc2Uoc291cmNlLCB7IHJhbmdlOiB0cnVlIH0pLFxuICAgICAgcGFyYW1zID0gW10sXG4gICAgICBib2R5O1xuXG4gIGlmIChhc3QudHlwZSAgICAgICAgICAgICAgICAgICAgIT09ICdQcm9ncmFtJyAgICAgICAgICAgICB8fFxuICAgICAgYXN0LmJvZHkubGVuZ3RoICAgICAgICAgICAgICE9PSAxICAgICAgICAgICAgICAgICAgICAgfHxcbiAgICAgIGFzdC5ib2R5WzBdLnR5cGUgICAgICAgICAgICAhPT0gJ0V4cHJlc3Npb25TdGF0ZW1lbnQnIHx8XG4gICAgICAoYXN0LmJvZHlbMF0uZXhwcmVzc2lvbi50eXBlICE9PSAnQXJyb3dGdW5jdGlvbkV4cHJlc3Npb24nICYmXG4gICAgICAgIGFzdC5ib2R5WzBdLmV4cHJlc3Npb24udHlwZSAhPT0gJ0Z1bmN0aW9uRXhwcmVzc2lvbicpKSB7XG4gICAgdGhyb3cgbmV3IEVycm9yKCdGYWlsZWQgdG8gcmVzb2x2ZSBmdW5jdGlvbicpO1xuICB9XG5cbiAgYXN0LmJvZHlbMF0uZXhwcmVzc2lvbi5wYXJhbXMuZm9yRWFjaChmdW5jdGlvbiAocGFyYW0pIHtcbiAgICBwYXJhbXMucHVzaChwYXJhbS5uYW1lKTtcbiAgfSk7XG5cbiAgYm9keSA9IGFzdC5ib2R5WzBdLmV4cHJlc3Npb24uYm9keS5yYW5nZTtcblxuICAvLyBFc3ByaW1hJ3MgcmFuZ2VzIGluY2x1ZGUgdGhlIGZpcnN0ICd7JyBhbmQgdGhlIGxhc3QgJ30nIGNoYXJhY3RlcnMgb25cbiAgLy8gZnVuY3Rpb24gZXhwcmVzc2lvbnMuIFNvIGN1dCB0aGVtIG91dC5cbiAgaWYgKGFzdC5ib2R5WzBdLmV4cHJlc3Npb24uYm9keS50eXBlID09PSAnQmxvY2tTdGF0ZW1lbnQnKSB7XG4gICAgLyplc2xpbnQtZGlzYWJsZSBuby1uZXctZnVuYyovXG4gICAgcmV0dXJuIG5ldyBGdW5jdGlvbihwYXJhbXMsIHNvdXJjZS5zbGljZShib2R5WzBdICsgMSwgYm9keVsxXSAtIDEpKTtcbiAgfVxuICAvLyBFUzYgYXJyb3cgZnVuY3Rpb25zIGNhbiBvbWl0IHRoZSBCbG9ja1N0YXRlbWVudC4gSW4gdGhhdCBjYXNlLCBqdXN0IHJldHVyblxuICAvLyB0aGUgYm9keS5cbiAgLyplc2xpbnQtZGlzYWJsZSBuby1uZXctZnVuYyovXG4gIHJldHVybiBuZXcgRnVuY3Rpb24ocGFyYW1zLCAncmV0dXJuICcgKyBzb3VyY2Uuc2xpY2UoYm9keVswXSwgYm9keVsxXSkpO1xufVxuXG5mdW5jdGlvbiByZXByZXNlbnRKYXZhc2NyaXB0RnVuY3Rpb24ob2JqZWN0IC8qLCBzdHlsZSovKSB7XG4gIHJldHVybiBvYmplY3QudG9TdHJpbmcoKTtcbn1cblxuZnVuY3Rpb24gaXNGdW5jdGlvbihvYmplY3QpIHtcbiAgcmV0dXJuIE9iamVjdC5wcm90b3R5cGUudG9TdHJpbmcuY2FsbChvYmplY3QpID09PSAnW29iamVjdCBGdW5jdGlvbl0nO1xufVxuXG5tb2R1bGUuZXhwb3J0cyA9IG5ldyBUeXBlKCd0YWc6eWFtbC5vcmcsMjAwMjpqcy9mdW5jdGlvbicsIHtcbiAga2luZDogJ3NjYWxhcicsXG4gIHJlc29sdmU6IHJlc29sdmVKYXZhc2NyaXB0RnVuY3Rpb24sXG4gIGNvbnN0cnVjdDogY29uc3RydWN0SmF2YXNjcmlwdEZ1bmN0aW9uLFxuICBwcmVkaWNhdGU6IGlzRnVuY3Rpb24sXG4gIHJlcHJlc2VudDogcmVwcmVzZW50SmF2YXNjcmlwdEZ1bmN0aW9uXG59KTtcbiIsIi8vIEpTLVlBTUwncyBkZWZhdWx0IHNjaGVtYSBmb3IgYGxvYWRgIGZ1bmN0aW9uLlxuLy8gSXQgaXMgbm90IGRlc2NyaWJlZCBpbiB0aGUgWUFNTCBzcGVjaWZpY2F0aW9uLlxuLy9cbi8vIFRoaXMgc2NoZW1hIGlzIGJhc2VkIG9uIEpTLVlBTUwncyBkZWZhdWx0IHNhZmUgc2NoZW1hIGFuZCBpbmNsdWRlc1xuLy8gSmF2YVNjcmlwdC1zcGVjaWZpYyB0eXBlczogISFqcy91bmRlZmluZWQsICEhanMvcmVnZXhwIGFuZCAhIWpzL2Z1bmN0aW9uLlxuLy9cbi8vIEFsc28gdGhpcyBzY2hlbWEgaXMgdXNlZCBhcyBkZWZhdWx0IGJhc2Ugc2NoZW1hIGF0IGBTY2hlbWEuY3JlYXRlYCBmdW5jdGlvbi5cblxuXG4ndXNlIHN0cmljdCc7XG5cblxudmFyIFNjaGVtYSA9IHJlcXVpcmUoJy4uL3NjaGVtYScpO1xuXG5cbm1vZHVsZS5leHBvcnRzID0gU2NoZW1hLkRFRkFVTFQgPSBuZXcgU2NoZW1hKHtcbiAgaW5jbHVkZTogW1xuICAgIHJlcXVpcmUoJy4vZGVmYXVsdF9zYWZlJylcbiAgXSxcbiAgZXhwbGljaXQ6IFtcbiAgICByZXF1aXJlKCcuLi90eXBlL2pzL3VuZGVmaW5lZCcpLFxuICAgIHJlcXVpcmUoJy4uL3R5cGUvanMvcmVnZXhwJyksXG4gICAgcmVxdWlyZSgnLi4vdHlwZS9qcy9mdW5jdGlvbicpXG4gIF1cbn0pO1xuIiwiJ3VzZSBzdHJpY3QnO1xuXG4vKmVzbGludC1kaXNhYmxlIG1heC1sZW4sbm8tdXNlLWJlZm9yZS1kZWZpbmUqL1xuXG52YXIgY29tbW9uICAgICAgICAgICAgICA9IHJlcXVpcmUoJy4vY29tbW9uJyk7XG52YXIgWUFNTEV4Y2VwdGlvbiAgICAgICA9IHJlcXVpcmUoJy4vZXhjZXB0aW9uJyk7XG52YXIgTWFyayAgICAgICAgICAgICAgICA9IHJlcXVpcmUoJy4vbWFyaycpO1xudmFyIERFRkFVTFRfU0FGRV9TQ0hFTUEgPSByZXF1aXJlKCcuL3NjaGVtYS9kZWZhdWx0X3NhZmUnKTtcbnZhciBERUZBVUxUX0ZVTExfU0NIRU1BID0gcmVxdWlyZSgnLi9zY2hlbWEvZGVmYXVsdF9mdWxsJyk7XG5cblxudmFyIF9oYXNPd25Qcm9wZXJ0eSA9IE9iamVjdC5wcm90b3R5cGUuaGFzT3duUHJvcGVydHk7XG5cblxudmFyIENPTlRFWFRfRkxPV19JTiAgID0gMTtcbnZhciBDT05URVhUX0ZMT1dfT1VUICA9IDI7XG52YXIgQ09OVEVYVF9CTE9DS19JTiAgPSAzO1xudmFyIENPTlRFWFRfQkxPQ0tfT1VUID0gNDtcblxuXG52YXIgQ0hPTVBJTkdfQ0xJUCAgPSAxO1xudmFyIENIT01QSU5HX1NUUklQID0gMjtcbnZhciBDSE9NUElOR19LRUVQICA9IDM7XG5cblxudmFyIFBBVFRFUk5fTk9OX1BSSU5UQUJMRSAgICAgICAgID0gL1tcXHgwMC1cXHgwOFxceDBCXFx4MENcXHgwRS1cXHgxRlxceDdGLVxceDg0XFx4ODYtXFx4OUZcXHVGRkZFXFx1RkZGRl18W1xcdUQ4MDAtXFx1REJGRl0oPyFbXFx1REMwMC1cXHVERkZGXSl8KD86W15cXHVEODAwLVxcdURCRkZdfF4pW1xcdURDMDAtXFx1REZGRl0vO1xudmFyIFBBVFRFUk5fTk9OX0FTQ0lJX0xJTkVfQlJFQUtTID0gL1tcXHg4NVxcdTIwMjhcXHUyMDI5XS87XG52YXIgUEFUVEVSTl9GTE9XX0lORElDQVRPUlMgICAgICAgPSAvWyxcXFtcXF1cXHtcXH1dLztcbnZhciBQQVRURVJOX1RBR19IQU5ETEUgICAgICAgICAgICA9IC9eKD86IXwhIXwhW2EtelxcLV0rISkkL2k7XG52YXIgUEFUVEVSTl9UQUdfVVJJICAgICAgICAgICAgICAgPSAvXig/OiF8W14sXFxbXFxdXFx7XFx9XSkoPzolWzAtOWEtZl17Mn18WzAtOWEtelxcLSM7XFwvXFw/OkAmPVxcK1xcJCxfXFwuIX5cXConXFwoXFwpXFxbXFxdXSkqJC9pO1xuXG5cbmZ1bmN0aW9uIF9jbGFzcyhvYmopIHsgcmV0dXJuIE9iamVjdC5wcm90b3R5cGUudG9TdHJpbmcuY2FsbChvYmopOyB9XG5cbmZ1bmN0aW9uIGlzX0VPTChjKSB7XG4gIHJldHVybiAoYyA9PT0gMHgwQS8qIExGICovKSB8fCAoYyA9PT0gMHgwRC8qIENSICovKTtcbn1cblxuZnVuY3Rpb24gaXNfV0hJVEVfU1BBQ0UoYykge1xuICByZXR1cm4gKGMgPT09IDB4MDkvKiBUYWIgKi8pIHx8IChjID09PSAweDIwLyogU3BhY2UgKi8pO1xufVxuXG5mdW5jdGlvbiBpc19XU19PUl9FT0woYykge1xuICByZXR1cm4gKGMgPT09IDB4MDkvKiBUYWIgKi8pIHx8XG4gICAgICAgICAoYyA9PT0gMHgyMC8qIFNwYWNlICovKSB8fFxuICAgICAgICAgKGMgPT09IDB4MEEvKiBMRiAqLykgfHxcbiAgICAgICAgIChjID09PSAweDBELyogQ1IgKi8pO1xufVxuXG5mdW5jdGlvbiBpc19GTE9XX0lORElDQVRPUihjKSB7XG4gIHJldHVybiBjID09PSAweDJDLyogLCAqLyB8fFxuICAgICAgICAgYyA9PT0gMHg1Qi8qIFsgKi8gfHxcbiAgICAgICAgIGMgPT09IDB4NUQvKiBdICovIHx8XG4gICAgICAgICBjID09PSAweDdCLyogeyAqLyB8fFxuICAgICAgICAgYyA9PT0gMHg3RC8qIH0gKi87XG59XG5cbmZ1bmN0aW9uIGZyb21IZXhDb2RlKGMpIHtcbiAgdmFyIGxjO1xuXG4gIGlmICgoMHgzMC8qIDAgKi8gPD0gYykgJiYgKGMgPD0gMHgzOS8qIDkgKi8pKSB7XG4gICAgcmV0dXJuIGMgLSAweDMwO1xuICB9XG5cbiAgLyplc2xpbnQtZGlzYWJsZSBuby1iaXR3aXNlKi9cbiAgbGMgPSBjIHwgMHgyMDtcblxuICBpZiAoKDB4NjEvKiBhICovIDw9IGxjKSAmJiAobGMgPD0gMHg2Ni8qIGYgKi8pKSB7XG4gICAgcmV0dXJuIGxjIC0gMHg2MSArIDEwO1xuICB9XG5cbiAgcmV0dXJuIC0xO1xufVxuXG5mdW5jdGlvbiBlc2NhcGVkSGV4TGVuKGMpIHtcbiAgaWYgKGMgPT09IDB4NzgvKiB4ICovKSB7IHJldHVybiAyOyB9XG4gIGlmIChjID09PSAweDc1LyogdSAqLykgeyByZXR1cm4gNDsgfVxuICBpZiAoYyA9PT0gMHg1NS8qIFUgKi8pIHsgcmV0dXJuIDg7IH1cbiAgcmV0dXJuIDA7XG59XG5cbmZ1bmN0aW9uIGZyb21EZWNpbWFsQ29kZShjKSB7XG4gIGlmICgoMHgzMC8qIDAgKi8gPD0gYykgJiYgKGMgPD0gMHgzOS8qIDkgKi8pKSB7XG4gICAgcmV0dXJuIGMgLSAweDMwO1xuICB9XG5cbiAgcmV0dXJuIC0xO1xufVxuXG5mdW5jdGlvbiBzaW1wbGVFc2NhcGVTZXF1ZW5jZShjKSB7XG4gIC8qIGVzbGludC1kaXNhYmxlIGluZGVudCAqL1xuICByZXR1cm4gKGMgPT09IDB4MzAvKiAwICovKSA/ICdcXHgwMCcgOlxuICAgICAgICAoYyA9PT0gMHg2MS8qIGEgKi8pID8gJ1xceDA3JyA6XG4gICAgICAgIChjID09PSAweDYyLyogYiAqLykgPyAnXFx4MDgnIDpcbiAgICAgICAgKGMgPT09IDB4NzQvKiB0ICovKSA/ICdcXHgwOScgOlxuICAgICAgICAoYyA9PT0gMHgwOS8qIFRhYiAqLykgPyAnXFx4MDknIDpcbiAgICAgICAgKGMgPT09IDB4NkUvKiBuICovKSA/ICdcXHgwQScgOlxuICAgICAgICAoYyA9PT0gMHg3Ni8qIHYgKi8pID8gJ1xceDBCJyA6XG4gICAgICAgIChjID09PSAweDY2LyogZiAqLykgPyAnXFx4MEMnIDpcbiAgICAgICAgKGMgPT09IDB4NzIvKiByICovKSA/ICdcXHgwRCcgOlxuICAgICAgICAoYyA9PT0gMHg2NS8qIGUgKi8pID8gJ1xceDFCJyA6XG4gICAgICAgIChjID09PSAweDIwLyogU3BhY2UgKi8pID8gJyAnIDpcbiAgICAgICAgKGMgPT09IDB4MjIvKiBcIiAqLykgPyAnXFx4MjInIDpcbiAgICAgICAgKGMgPT09IDB4MkYvKiAvICovKSA/ICcvJyA6XG4gICAgICAgIChjID09PSAweDVDLyogXFwgKi8pID8gJ1xceDVDJyA6XG4gICAgICAgIChjID09PSAweDRFLyogTiAqLykgPyAnXFx4ODUnIDpcbiAgICAgICAgKGMgPT09IDB4NUYvKiBfICovKSA/ICdcXHhBMCcgOlxuICAgICAgICAoYyA9PT0gMHg0Qy8qIEwgKi8pID8gJ1xcdTIwMjgnIDpcbiAgICAgICAgKGMgPT09IDB4NTAvKiBQICovKSA/ICdcXHUyMDI5JyA6ICcnO1xufVxuXG5mdW5jdGlvbiBjaGFyRnJvbUNvZGVwb2ludChjKSB7XG4gIGlmIChjIDw9IDB4RkZGRikge1xuICAgIHJldHVybiBTdHJpbmcuZnJvbUNoYXJDb2RlKGMpO1xuICB9XG4gIC8vIEVuY29kZSBVVEYtMTYgc3Vycm9nYXRlIHBhaXJcbiAgLy8gaHR0cHM6Ly9lbi53aWtpcGVkaWEub3JnL3dpa2kvVVRGLTE2I0NvZGVfcG9pbnRzX1UuMkIwMTAwMDBfdG9fVS4yQjEwRkZGRlxuICByZXR1cm4gU3RyaW5nLmZyb21DaGFyQ29kZShcbiAgICAoKGMgLSAweDAxMDAwMCkgPj4gMTApICsgMHhEODAwLFxuICAgICgoYyAtIDB4MDEwMDAwKSAmIDB4MDNGRikgKyAweERDMDBcbiAgKTtcbn1cblxudmFyIHNpbXBsZUVzY2FwZUNoZWNrID0gbmV3IEFycmF5KDI1Nik7IC8vIGludGVnZXIsIGZvciBmYXN0IGFjY2Vzc1xudmFyIHNpbXBsZUVzY2FwZU1hcCA9IG5ldyBBcnJheSgyNTYpO1xuZm9yICh2YXIgaSA9IDA7IGkgPCAyNTY7IGkrKykge1xuICBzaW1wbGVFc2NhcGVDaGVja1tpXSA9IHNpbXBsZUVzY2FwZVNlcXVlbmNlKGkpID8gMSA6IDA7XG4gIHNpbXBsZUVzY2FwZU1hcFtpXSA9IHNpbXBsZUVzY2FwZVNlcXVlbmNlKGkpO1xufVxuXG5cbmZ1bmN0aW9uIFN0YXRlKGlucHV0LCBvcHRpb25zKSB7XG4gIHRoaXMuaW5wdXQgPSBpbnB1dDtcblxuICB0aGlzLmZpbGVuYW1lICA9IG9wdGlvbnNbJ2ZpbGVuYW1lJ10gIHx8IG51bGw7XG4gIHRoaXMuc2NoZW1hICAgID0gb3B0aW9uc1snc2NoZW1hJ10gICAgfHwgREVGQVVMVF9GVUxMX1NDSEVNQTtcbiAgdGhpcy5vbldhcm5pbmcgPSBvcHRpb25zWydvbldhcm5pbmcnXSB8fCBudWxsO1xuICB0aGlzLmxlZ2FjeSAgICA9IG9wdGlvbnNbJ2xlZ2FjeSddICAgIHx8IGZhbHNlO1xuICB0aGlzLmpzb24gICAgICA9IG9wdGlvbnNbJ2pzb24nXSAgICAgIHx8IGZhbHNlO1xuICB0aGlzLmxpc3RlbmVyICA9IG9wdGlvbnNbJ2xpc3RlbmVyJ10gIHx8IG51bGw7XG5cbiAgdGhpcy5pbXBsaWNpdFR5cGVzID0gdGhpcy5zY2hlbWEuY29tcGlsZWRJbXBsaWNpdDtcbiAgdGhpcy50eXBlTWFwICAgICAgID0gdGhpcy5zY2hlbWEuY29tcGlsZWRUeXBlTWFwO1xuXG4gIHRoaXMubGVuZ3RoICAgICA9IGlucHV0Lmxlbmd0aDtcbiAgdGhpcy5wb3NpdGlvbiAgID0gMDtcbiAgdGhpcy5saW5lICAgICAgID0gMDtcbiAgdGhpcy5saW5lU3RhcnQgID0gMDtcbiAgdGhpcy5saW5lSW5kZW50ID0gMDtcblxuICB0aGlzLmRvY3VtZW50cyA9IFtdO1xuXG4gIC8qXG4gIHRoaXMudmVyc2lvbjtcbiAgdGhpcy5jaGVja0xpbmVCcmVha3M7XG4gIHRoaXMudGFnTWFwO1xuICB0aGlzLmFuY2hvck1hcDtcbiAgdGhpcy50YWc7XG4gIHRoaXMuYW5jaG9yO1xuICB0aGlzLmtpbmQ7XG4gIHRoaXMucmVzdWx0OyovXG5cbn1cblxuXG5mdW5jdGlvbiBnZW5lcmF0ZUVycm9yKHN0YXRlLCBtZXNzYWdlKSB7XG4gIHJldHVybiBuZXcgWUFNTEV4Y2VwdGlvbihcbiAgICBtZXNzYWdlLFxuICAgIG5ldyBNYXJrKHN0YXRlLmZpbGVuYW1lLCBzdGF0ZS5pbnB1dCwgc3RhdGUucG9zaXRpb24sIHN0YXRlLmxpbmUsIChzdGF0ZS5wb3NpdGlvbiAtIHN0YXRlLmxpbmVTdGFydCkpKTtcbn1cblxuZnVuY3Rpb24gdGhyb3dFcnJvcihzdGF0ZSwgbWVzc2FnZSkge1xuICB0aHJvdyBnZW5lcmF0ZUVycm9yKHN0YXRlLCBtZXNzYWdlKTtcbn1cblxuZnVuY3Rpb24gdGhyb3dXYXJuaW5nKHN0YXRlLCBtZXNzYWdlKSB7XG4gIGlmIChzdGF0ZS5vbldhcm5pbmcpIHtcbiAgICBzdGF0ZS5vbldhcm5pbmcuY2FsbChudWxsLCBnZW5lcmF0ZUVycm9yKHN0YXRlLCBtZXNzYWdlKSk7XG4gIH1cbn1cblxuXG52YXIgZGlyZWN0aXZlSGFuZGxlcnMgPSB7XG5cbiAgWUFNTDogZnVuY3Rpb24gaGFuZGxlWWFtbERpcmVjdGl2ZShzdGF0ZSwgbmFtZSwgYXJncykge1xuXG4gICAgdmFyIG1hdGNoLCBtYWpvciwgbWlub3I7XG5cbiAgICBpZiAoc3RhdGUudmVyc2lvbiAhPT0gbnVsbCkge1xuICAgICAgdGhyb3dFcnJvcihzdGF0ZSwgJ2R1cGxpY2F0aW9uIG9mICVZQU1MIGRpcmVjdGl2ZScpO1xuICAgIH1cblxuICAgIGlmIChhcmdzLmxlbmd0aCAhPT0gMSkge1xuICAgICAgdGhyb3dFcnJvcihzdGF0ZSwgJ1lBTUwgZGlyZWN0aXZlIGFjY2VwdHMgZXhhY3RseSBvbmUgYXJndW1lbnQnKTtcbiAgICB9XG5cbiAgICBtYXRjaCA9IC9eKFswLTldKylcXC4oWzAtOV0rKSQvLmV4ZWMoYXJnc1swXSk7XG5cbiAgICBpZiAobWF0Y2ggPT09IG51bGwpIHtcbiAgICAgIHRocm93RXJyb3Ioc3RhdGUsICdpbGwtZm9ybWVkIGFyZ3VtZW50IG9mIHRoZSBZQU1MIGRpcmVjdGl2ZScpO1xuICAgIH1cblxuICAgIG1ham9yID0gcGFyc2VJbnQobWF0Y2hbMV0sIDEwKTtcbiAgICBtaW5vciA9IHBhcnNlSW50KG1hdGNoWzJdLCAxMCk7XG5cbiAgICBpZiAobWFqb3IgIT09IDEpIHtcbiAgICAgIHRocm93RXJyb3Ioc3RhdGUsICd1bmFjY2VwdGFibGUgWUFNTCB2ZXJzaW9uIG9mIHRoZSBkb2N1bWVudCcpO1xuICAgIH1cblxuICAgIHN0YXRlLnZlcnNpb24gPSBhcmdzWzBdO1xuICAgIHN0YXRlLmNoZWNrTGluZUJyZWFrcyA9IChtaW5vciA8IDIpO1xuXG4gICAgaWYgKG1pbm9yICE9PSAxICYmIG1pbm9yICE9PSAyKSB7XG4gICAgICB0aHJvd1dhcm5pbmcoc3RhdGUsICd1bnN1cHBvcnRlZCBZQU1MIHZlcnNpb24gb2YgdGhlIGRvY3VtZW50Jyk7XG4gICAgfVxuICB9LFxuXG4gIFRBRzogZnVuY3Rpb24gaGFuZGxlVGFnRGlyZWN0aXZlKHN0YXRlLCBuYW1lLCBhcmdzKSB7XG5cbiAgICB2YXIgaGFuZGxlLCBwcmVmaXg7XG5cbiAgICBpZiAoYXJncy5sZW5ndGggIT09IDIpIHtcbiAgICAgIHRocm93RXJyb3Ioc3RhdGUsICdUQUcgZGlyZWN0aXZlIGFjY2VwdHMgZXhhY3RseSB0d28gYXJndW1lbnRzJyk7XG4gICAgfVxuXG4gICAgaGFuZGxlID0gYXJnc1swXTtcbiAgICBwcmVmaXggPSBhcmdzWzFdO1xuXG4gICAgaWYgKCFQQVRURVJOX1RBR19IQU5ETEUudGVzdChoYW5kbGUpKSB7XG4gICAgICB0aHJvd0Vycm9yKHN0YXRlLCAnaWxsLWZvcm1lZCB0YWcgaGFuZGxlIChmaXJzdCBhcmd1bWVudCkgb2YgdGhlIFRBRyBkaXJlY3RpdmUnKTtcbiAgICB9XG5cbiAgICBpZiAoX2hhc093blByb3BlcnR5LmNhbGwoc3RhdGUudGFnTWFwLCBoYW5kbGUpKSB7XG4gICAgICB0aHJvd0Vycm9yKHN0YXRlLCAndGhlcmUgaXMgYSBwcmV2aW91c2x5IGRlY2xhcmVkIHN1ZmZpeCBmb3IgXCInICsgaGFuZGxlICsgJ1wiIHRhZyBoYW5kbGUnKTtcbiAgICB9XG5cbiAgICBpZiAoIVBBVFRFUk5fVEFHX1VSSS50ZXN0KHByZWZpeCkpIHtcbiAgICAgIHRocm93RXJyb3Ioc3RhdGUsICdpbGwtZm9ybWVkIHRhZyBwcmVmaXggKHNlY29uZCBhcmd1bWVudCkgb2YgdGhlIFRBRyBkaXJlY3RpdmUnKTtcbiAgICB9XG5cbiAgICBzdGF0ZS50YWdNYXBbaGFuZGxlXSA9IHByZWZpeDtcbiAgfVxufTtcblxuXG5mdW5jdGlvbiBjYXB0dXJlU2VnbWVudChzdGF0ZSwgc3RhcnQsIGVuZCwgY2hlY2tKc29uKSB7XG4gIHZhciBfcG9zaXRpb24sIF9sZW5ndGgsIF9jaGFyYWN0ZXIsIF9yZXN1bHQ7XG5cbiAgaWYgKHN0YXJ0IDwgZW5kKSB7XG4gICAgX3Jlc3VsdCA9IHN0YXRlLmlucHV0LnNsaWNlKHN0YXJ0LCBlbmQpO1xuXG4gICAgaWYgKGNoZWNrSnNvbikge1xuICAgICAgZm9yIChfcG9zaXRpb24gPSAwLCBfbGVuZ3RoID0gX3Jlc3VsdC5sZW5ndGg7IF9wb3NpdGlvbiA8IF9sZW5ndGg7IF9wb3NpdGlvbiArPSAxKSB7XG4gICAgICAgIF9jaGFyYWN0ZXIgPSBfcmVzdWx0LmNoYXJDb2RlQXQoX3Bvc2l0aW9uKTtcbiAgICAgICAgaWYgKCEoX2NoYXJhY3RlciA9PT0gMHgwOSB8fFxuICAgICAgICAgICAgICAoMHgyMCA8PSBfY2hhcmFjdGVyICYmIF9jaGFyYWN0ZXIgPD0gMHgxMEZGRkYpKSkge1xuICAgICAgICAgIHRocm93RXJyb3Ioc3RhdGUsICdleHBlY3RlZCB2YWxpZCBKU09OIGNoYXJhY3RlcicpO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgfSBlbHNlIGlmIChQQVRURVJOX05PTl9QUklOVEFCTEUudGVzdChfcmVzdWx0KSkge1xuICAgICAgdGhyb3dFcnJvcihzdGF0ZSwgJ3RoZSBzdHJlYW0gY29udGFpbnMgbm9uLXByaW50YWJsZSBjaGFyYWN0ZXJzJyk7XG4gICAgfVxuXG4gICAgc3RhdGUucmVzdWx0ICs9IF9yZXN1bHQ7XG4gIH1cbn1cblxuZnVuY3Rpb24gbWVyZ2VNYXBwaW5ncyhzdGF0ZSwgZGVzdGluYXRpb24sIHNvdXJjZSwgb3ZlcnJpZGFibGVLZXlzKSB7XG4gIHZhciBzb3VyY2VLZXlzLCBrZXksIGluZGV4LCBxdWFudGl0eTtcblxuICBpZiAoIWNvbW1vbi5pc09iamVjdChzb3VyY2UpKSB7XG4gICAgdGhyb3dFcnJvcihzdGF0ZSwgJ2Nhbm5vdCBtZXJnZSBtYXBwaW5nczsgdGhlIHByb3ZpZGVkIHNvdXJjZSBvYmplY3QgaXMgdW5hY2NlcHRhYmxlJyk7XG4gIH1cblxuICBzb3VyY2VLZXlzID0gT2JqZWN0LmtleXMoc291cmNlKTtcblxuICBmb3IgKGluZGV4ID0gMCwgcXVhbnRpdHkgPSBzb3VyY2VLZXlzLmxlbmd0aDsgaW5kZXggPCBxdWFudGl0eTsgaW5kZXggKz0gMSkge1xuICAgIGtleSA9IHNvdXJjZUtleXNbaW5kZXhdO1xuXG4gICAgaWYgKCFfaGFzT3duUHJvcGVydHkuY2FsbChkZXN0aW5hdGlvbiwga2V5KSkge1xuICAgICAgZGVzdGluYXRpb25ba2V5XSA9IHNvdXJjZVtrZXldO1xuICAgICAgb3ZlcnJpZGFibGVLZXlzW2tleV0gPSB0cnVlO1xuICAgIH1cbiAgfVxufVxuXG5mdW5jdGlvbiBzdG9yZU1hcHBpbmdQYWlyKHN0YXRlLCBfcmVzdWx0LCBvdmVycmlkYWJsZUtleXMsIGtleVRhZywga2V5Tm9kZSwgdmFsdWVOb2RlLCBzdGFydExpbmUsIHN0YXJ0UG9zKSB7XG4gIHZhciBpbmRleCwgcXVhbnRpdHk7XG5cbiAgLy8gVGhlIG91dHB1dCBpcyBhIHBsYWluIG9iamVjdCBoZXJlLCBzbyBrZXlzIGNhbiBvbmx5IGJlIHN0cmluZ3MuXG4gIC8vIFdlIG5lZWQgdG8gY29udmVydCBrZXlOb2RlIHRvIGEgc3RyaW5nLCBidXQgZG9pbmcgc28gY2FuIGhhbmcgdGhlIHByb2Nlc3NcbiAgLy8gKGRlZXBseSBuZXN0ZWQgYXJyYXlzIHRoYXQgZXhwbG9kZSBleHBvbmVudGlhbGx5IHVzaW5nIGFsaWFzZXMpLlxuICBpZiAoQXJyYXkuaXNBcnJheShrZXlOb2RlKSkge1xuICAgIGtleU5vZGUgPSBBcnJheS5wcm90b3R5cGUuc2xpY2UuY2FsbChrZXlOb2RlKTtcblxuICAgIGZvciAoaW5kZXggPSAwLCBxdWFudGl0eSA9IGtleU5vZGUubGVuZ3RoOyBpbmRleCA8IHF1YW50aXR5OyBpbmRleCArPSAxKSB7XG4gICAgICBpZiAoQXJyYXkuaXNBcnJheShrZXlOb2RlW2luZGV4XSkpIHtcbiAgICAgICAgdGhyb3dFcnJvcihzdGF0ZSwgJ25lc3RlZCBhcnJheXMgYXJlIG5vdCBzdXBwb3J0ZWQgaW5zaWRlIGtleXMnKTtcbiAgICAgIH1cblxuICAgICAgaWYgKHR5cGVvZiBrZXlOb2RlID09PSAnb2JqZWN0JyAmJiBfY2xhc3Moa2V5Tm9kZVtpbmRleF0pID09PSAnW29iamVjdCBPYmplY3RdJykge1xuICAgICAgICBrZXlOb2RlW2luZGV4XSA9ICdbb2JqZWN0IE9iamVjdF0nO1xuICAgICAgfVxuICAgIH1cbiAgfVxuXG4gIC8vIEF2b2lkIGNvZGUgZXhlY3V0aW9uIGluIGxvYWQoKSB2aWEgdG9TdHJpbmcgcHJvcGVydHlcbiAgLy8gKHN0aWxsIHVzZSBpdHMgb3duIHRvU3RyaW5nIGZvciBhcnJheXMsIHRpbWVzdGFtcHMsXG4gIC8vIGFuZCB3aGF0ZXZlciB1c2VyIHNjaGVtYSBleHRlbnNpb25zIGhhcHBlbiB0byBoYXZlIEBAdG9TdHJpbmdUYWcpXG4gIGlmICh0eXBlb2Yga2V5Tm9kZSA9PT0gJ29iamVjdCcgJiYgX2NsYXNzKGtleU5vZGUpID09PSAnW29iamVjdCBPYmplY3RdJykge1xuICAgIGtleU5vZGUgPSAnW29iamVjdCBPYmplY3RdJztcbiAgfVxuXG5cbiAga2V5Tm9kZSA9IFN0cmluZyhrZXlOb2RlKTtcblxuICBpZiAoX3Jlc3VsdCA9PT0gbnVsbCkge1xuICAgIF9yZXN1bHQgPSB7fTtcbiAgfVxuXG4gIGlmIChrZXlUYWcgPT09ICd0YWc6eWFtbC5vcmcsMjAwMjptZXJnZScpIHtcbiAgICBpZiAoQXJyYXkuaXNBcnJheSh2YWx1ZU5vZGUpKSB7XG4gICAgICBmb3IgKGluZGV4ID0gMCwgcXVhbnRpdHkgPSB2YWx1ZU5vZGUubGVuZ3RoOyBpbmRleCA8IHF1YW50aXR5OyBpbmRleCArPSAxKSB7XG4gICAgICAgIG1lcmdlTWFwcGluZ3Moc3RhdGUsIF9yZXN1bHQsIHZhbHVlTm9kZVtpbmRleF0sIG92ZXJyaWRhYmxlS2V5cyk7XG4gICAgICB9XG4gICAgfSBlbHNlIHtcbiAgICAgIG1lcmdlTWFwcGluZ3Moc3RhdGUsIF9yZXN1bHQsIHZhbHVlTm9kZSwgb3ZlcnJpZGFibGVLZXlzKTtcbiAgICB9XG4gIH0gZWxzZSB7XG4gICAgaWYgKCFzdGF0ZS5qc29uICYmXG4gICAgICAgICFfaGFzT3duUHJvcGVydHkuY2FsbChvdmVycmlkYWJsZUtleXMsIGtleU5vZGUpICYmXG4gICAgICAgIF9oYXNPd25Qcm9wZXJ0eS5jYWxsKF9yZXN1bHQsIGtleU5vZGUpKSB7XG4gICAgICBzdGF0ZS5saW5lID0gc3RhcnRMaW5lIHx8IHN0YXRlLmxpbmU7XG4gICAgICBzdGF0ZS5wb3NpdGlvbiA9IHN0YXJ0UG9zIHx8IHN0YXRlLnBvc2l0aW9uO1xuICAgICAgdGhyb3dFcnJvcihzdGF0ZSwgJ2R1cGxpY2F0ZWQgbWFwcGluZyBrZXknKTtcbiAgICB9XG4gICAgX3Jlc3VsdFtrZXlOb2RlXSA9IHZhbHVlTm9kZTtcbiAgICBkZWxldGUgb3ZlcnJpZGFibGVLZXlzW2tleU5vZGVdO1xuICB9XG5cbiAgcmV0dXJuIF9yZXN1bHQ7XG59XG5cbmZ1bmN0aW9uIHJlYWRMaW5lQnJlYWsoc3RhdGUpIHtcbiAgdmFyIGNoO1xuXG4gIGNoID0gc3RhdGUuaW5wdXQuY2hhckNvZGVBdChzdGF0ZS5wb3NpdGlvbik7XG5cbiAgaWYgKGNoID09PSAweDBBLyogTEYgKi8pIHtcbiAgICBzdGF0ZS5wb3NpdGlvbisrO1xuICB9IGVsc2UgaWYgKGNoID09PSAweDBELyogQ1IgKi8pIHtcbiAgICBzdGF0ZS5wb3NpdGlvbisrO1xuICAgIGlmIChzdGF0ZS5pbnB1dC5jaGFyQ29kZUF0KHN0YXRlLnBvc2l0aW9uKSA9PT0gMHgwQS8qIExGICovKSB7XG4gICAgICBzdGF0ZS5wb3NpdGlvbisrO1xuICAgIH1cbiAgfSBlbHNlIHtcbiAgICB0aHJvd0Vycm9yKHN0YXRlLCAnYSBsaW5lIGJyZWFrIGlzIGV4cGVjdGVkJyk7XG4gIH1cblxuICBzdGF0ZS5saW5lICs9IDE7XG4gIHN0YXRlLmxpbmVTdGFydCA9IHN0YXRlLnBvc2l0aW9uO1xufVxuXG5mdW5jdGlvbiBza2lwU2VwYXJhdGlvblNwYWNlKHN0YXRlLCBhbGxvd0NvbW1lbnRzLCBjaGVja0luZGVudCkge1xuICB2YXIgbGluZUJyZWFrcyA9IDAsXG4gICAgICBjaCA9IHN0YXRlLmlucHV0LmNoYXJDb2RlQXQoc3RhdGUucG9zaXRpb24pO1xuXG4gIHdoaWxlIChjaCAhPT0gMCkge1xuICAgIHdoaWxlIChpc19XSElURV9TUEFDRShjaCkpIHtcbiAgICAgIGNoID0gc3RhdGUuaW5wdXQuY2hhckNvZGVBdCgrK3N0YXRlLnBvc2l0aW9uKTtcbiAgICB9XG5cbiAgICBpZiAoYWxsb3dDb21tZW50cyAmJiBjaCA9PT0gMHgyMy8qICMgKi8pIHtcbiAgICAgIGRvIHtcbiAgICAgICAgY2ggPSBzdGF0ZS5pbnB1dC5jaGFyQ29kZUF0KCsrc3RhdGUucG9zaXRpb24pO1xuICAgICAgfSB3aGlsZSAoY2ggIT09IDB4MEEvKiBMRiAqLyAmJiBjaCAhPT0gMHgwRC8qIENSICovICYmIGNoICE9PSAwKTtcbiAgICB9XG5cbiAgICBpZiAoaXNfRU9MKGNoKSkge1xuICAgICAgcmVhZExpbmVCcmVhayhzdGF0ZSk7XG5cbiAgICAgIGNoID0gc3RhdGUuaW5wdXQuY2hhckNvZGVBdChzdGF0ZS5wb3NpdGlvbik7XG4gICAgICBsaW5lQnJlYWtzKys7XG4gICAgICBzdGF0ZS5saW5lSW5kZW50ID0gMDtcblxuICAgICAgd2hpbGUgKGNoID09PSAweDIwLyogU3BhY2UgKi8pIHtcbiAgICAgICAgc3RhdGUubGluZUluZGVudCsrO1xuICAgICAgICBjaCA9IHN0YXRlLmlucHV0LmNoYXJDb2RlQXQoKytzdGF0ZS5wb3NpdGlvbik7XG4gICAgICB9XG4gICAgfSBlbHNlIHtcbiAgICAgIGJyZWFrO1xuICAgIH1cbiAgfVxuXG4gIGlmIChjaGVja0luZGVudCAhPT0gLTEgJiYgbGluZUJyZWFrcyAhPT0gMCAmJiBzdGF0ZS5saW5lSW5kZW50IDwgY2hlY2tJbmRlbnQpIHtcbiAgICB0aHJvd1dhcm5pbmcoc3RhdGUsICdkZWZpY2llbnQgaW5kZW50YXRpb24nKTtcbiAgfVxuXG4gIHJldHVybiBsaW5lQnJlYWtzO1xufVxuXG5mdW5jdGlvbiB0ZXN0RG9jdW1lbnRTZXBhcmF0b3Ioc3RhdGUpIHtcbiAgdmFyIF9wb3NpdGlvbiA9IHN0YXRlLnBvc2l0aW9uLFxuICAgICAgY2g7XG5cbiAgY2ggPSBzdGF0ZS5pbnB1dC5jaGFyQ29kZUF0KF9wb3NpdGlvbik7XG5cbiAgLy8gQ29uZGl0aW9uIHN0YXRlLnBvc2l0aW9uID09PSBzdGF0ZS5saW5lU3RhcnQgaXMgdGVzdGVkXG4gIC8vIGluIHBhcmVudCBvbiBlYWNoIGNhbGwsIGZvciBlZmZpY2llbmN5LiBObyBuZWVkcyB0byB0ZXN0IGhlcmUgYWdhaW4uXG4gIGlmICgoY2ggPT09IDB4MkQvKiAtICovIHx8IGNoID09PSAweDJFLyogLiAqLykgJiZcbiAgICAgIGNoID09PSBzdGF0ZS5pbnB1dC5jaGFyQ29kZUF0KF9wb3NpdGlvbiArIDEpICYmXG4gICAgICBjaCA9PT0gc3RhdGUuaW5wdXQuY2hhckNvZGVBdChfcG9zaXRpb24gKyAyKSkge1xuXG4gICAgX3Bvc2l0aW9uICs9IDM7XG5cbiAgICBjaCA9IHN0YXRlLmlucHV0LmNoYXJDb2RlQXQoX3Bvc2l0aW9uKTtcblxuICAgIGlmIChjaCA9PT0gMCB8fCBpc19XU19PUl9FT0woY2gpKSB7XG4gICAgICByZXR1cm4gdHJ1ZTtcbiAgICB9XG4gIH1cblxuICByZXR1cm4gZmFsc2U7XG59XG5cbmZ1bmN0aW9uIHdyaXRlRm9sZGVkTGluZXMoc3RhdGUsIGNvdW50KSB7XG4gIGlmIChjb3VudCA9PT0gMSkge1xuICAgIHN0YXRlLnJlc3VsdCArPSAnICc7XG4gIH0gZWxzZSBpZiAoY291bnQgPiAxKSB7XG4gICAgc3RhdGUucmVzdWx0ICs9IGNvbW1vbi5yZXBlYXQoJ1xcbicsIGNvdW50IC0gMSk7XG4gIH1cbn1cblxuXG5mdW5jdGlvbiByZWFkUGxhaW5TY2FsYXIoc3RhdGUsIG5vZGVJbmRlbnQsIHdpdGhpbkZsb3dDb2xsZWN0aW9uKSB7XG4gIHZhciBwcmVjZWRpbmcsXG4gICAgICBmb2xsb3dpbmcsXG4gICAgICBjYXB0dXJlU3RhcnQsXG4gICAgICBjYXB0dXJlRW5kLFxuICAgICAgaGFzUGVuZGluZ0NvbnRlbnQsXG4gICAgICBfbGluZSxcbiAgICAgIF9saW5lU3RhcnQsXG4gICAgICBfbGluZUluZGVudCxcbiAgICAgIF9raW5kID0gc3RhdGUua2luZCxcbiAgICAgIF9yZXN1bHQgPSBzdGF0ZS5yZXN1bHQsXG4gICAgICBjaDtcblxuICBjaCA9IHN0YXRlLmlucHV0LmNoYXJDb2RlQXQoc3RhdGUucG9zaXRpb24pO1xuXG4gIGlmIChpc19XU19PUl9FT0woY2gpICAgICAgfHxcbiAgICAgIGlzX0ZMT1dfSU5ESUNBVE9SKGNoKSB8fFxuICAgICAgY2ggPT09IDB4MjMvKiAjICovICAgIHx8XG4gICAgICBjaCA9PT0gMHgyNi8qICYgKi8gICAgfHxcbiAgICAgIGNoID09PSAweDJBLyogKiAqLyAgICB8fFxuICAgICAgY2ggPT09IDB4MjEvKiAhICovICAgIHx8XG4gICAgICBjaCA9PT0gMHg3Qy8qIHwgKi8gICAgfHxcbiAgICAgIGNoID09PSAweDNFLyogPiAqLyAgICB8fFxuICAgICAgY2ggPT09IDB4MjcvKiAnICovICAgIHx8XG4gICAgICBjaCA9PT0gMHgyMi8qIFwiICovICAgIHx8XG4gICAgICBjaCA9PT0gMHgyNS8qICUgKi8gICAgfHxcbiAgICAgIGNoID09PSAweDQwLyogQCAqLyAgICB8fFxuICAgICAgY2ggPT09IDB4NjAvKiBgICovKSB7XG4gICAgcmV0dXJuIGZhbHNlO1xuICB9XG5cbiAgaWYgKGNoID09PSAweDNGLyogPyAqLyB8fCBjaCA9PT0gMHgyRC8qIC0gKi8pIHtcbiAgICBmb2xsb3dpbmcgPSBzdGF0ZS5pbnB1dC5jaGFyQ29kZUF0KHN0YXRlLnBvc2l0aW9uICsgMSk7XG5cbiAgICBpZiAoaXNfV1NfT1JfRU9MKGZvbGxvd2luZykgfHxcbiAgICAgICAgd2l0aGluRmxvd0NvbGxlY3Rpb24gJiYgaXNfRkxPV19JTkRJQ0FUT1IoZm9sbG93aW5nKSkge1xuICAgICAgcmV0dXJuIGZhbHNlO1xuICAgIH1cbiAgfVxuXG4gIHN0YXRlLmtpbmQgPSAnc2NhbGFyJztcbiAgc3RhdGUucmVzdWx0ID0gJyc7XG4gIGNhcHR1cmVTdGFydCA9IGNhcHR1cmVFbmQgPSBzdGF0ZS5wb3NpdGlvbjtcbiAgaGFzUGVuZGluZ0NvbnRlbnQgPSBmYWxzZTtcblxuICB3aGlsZSAoY2ggIT09IDApIHtcbiAgICBpZiAoY2ggPT09IDB4M0EvKiA6ICovKSB7XG4gICAgICBmb2xsb3dpbmcgPSBzdGF0ZS5pbnB1dC5jaGFyQ29kZUF0KHN0YXRlLnBvc2l0aW9uICsgMSk7XG5cbiAgICAgIGlmIChpc19XU19PUl9FT0woZm9sbG93aW5nKSB8fFxuICAgICAgICAgIHdpdGhpbkZsb3dDb2xsZWN0aW9uICYmIGlzX0ZMT1dfSU5ESUNBVE9SKGZvbGxvd2luZykpIHtcbiAgICAgICAgYnJlYWs7XG4gICAgICB9XG5cbiAgICB9IGVsc2UgaWYgKGNoID09PSAweDIzLyogIyAqLykge1xuICAgICAgcHJlY2VkaW5nID0gc3RhdGUuaW5wdXQuY2hhckNvZGVBdChzdGF0ZS5wb3NpdGlvbiAtIDEpO1xuXG4gICAgICBpZiAoaXNfV1NfT1JfRU9MKHByZWNlZGluZykpIHtcbiAgICAgICAgYnJlYWs7XG4gICAgICB9XG5cbiAgICB9IGVsc2UgaWYgKChzdGF0ZS5wb3NpdGlvbiA9PT0gc3RhdGUubGluZVN0YXJ0ICYmIHRlc3REb2N1bWVudFNlcGFyYXRvcihzdGF0ZSkpIHx8XG4gICAgICAgICAgICAgICB3aXRoaW5GbG93Q29sbGVjdGlvbiAmJiBpc19GTE9XX0lORElDQVRPUihjaCkpIHtcbiAgICAgIGJyZWFrO1xuXG4gICAgfSBlbHNlIGlmIChpc19FT0woY2gpKSB7XG4gICAgICBfbGluZSA9IHN0YXRlLmxpbmU7XG4gICAgICBfbGluZVN0YXJ0ID0gc3RhdGUubGluZVN0YXJ0O1xuICAgICAgX2xpbmVJbmRlbnQgPSBzdGF0ZS5saW5lSW5kZW50O1xuICAgICAgc2tpcFNlcGFyYXRpb25TcGFjZShzdGF0ZSwgZmFsc2UsIC0xKTtcblxuICAgICAgaWYgKHN0YXRlLmxpbmVJbmRlbnQgPj0gbm9kZUluZGVudCkge1xuICAgICAgICBoYXNQZW5kaW5nQ29udGVudCA9IHRydWU7XG4gICAgICAgIGNoID0gc3RhdGUuaW5wdXQuY2hhckNvZGVBdChzdGF0ZS5wb3NpdGlvbik7XG4gICAgICAgIGNvbnRpbnVlO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgc3RhdGUucG9zaXRpb24gPSBjYXB0dXJlRW5kO1xuICAgICAgICBzdGF0ZS5saW5lID0gX2xpbmU7XG4gICAgICAgIHN0YXRlLmxpbmVTdGFydCA9IF9saW5lU3RhcnQ7XG4gICAgICAgIHN0YXRlLmxpbmVJbmRlbnQgPSBfbGluZUluZGVudDtcbiAgICAgICAgYnJlYWs7XG4gICAgICB9XG4gICAgfVxuXG4gICAgaWYgKGhhc1BlbmRpbmdDb250ZW50KSB7XG4gICAgICBjYXB0dXJlU2VnbWVudChzdGF0ZSwgY2FwdHVyZVN0YXJ0LCBjYXB0dXJlRW5kLCBmYWxzZSk7XG4gICAgICB3cml0ZUZvbGRlZExpbmVzKHN0YXRlLCBzdGF0ZS5saW5lIC0gX2xpbmUpO1xuICAgICAgY2FwdHVyZVN0YXJ0ID0gY2FwdHVyZUVuZCA9IHN0YXRlLnBvc2l0aW9uO1xuICAgICAgaGFzUGVuZGluZ0NvbnRlbnQgPSBmYWxzZTtcbiAgICB9XG5cbiAgICBpZiAoIWlzX1dISVRFX1NQQUNFKGNoKSkge1xuICAgICAgY2FwdHVyZUVuZCA9IHN0YXRlLnBvc2l0aW9uICsgMTtcbiAgICB9XG5cbiAgICBjaCA9IHN0YXRlLmlucHV0LmNoYXJDb2RlQXQoKytzdGF0ZS5wb3NpdGlvbik7XG4gIH1cblxuICBjYXB0dXJlU2VnbWVudChzdGF0ZSwgY2FwdHVyZVN0YXJ0LCBjYXB0dXJlRW5kLCBmYWxzZSk7XG5cbiAgaWYgKHN0YXRlLnJlc3VsdCkge1xuICAgIHJldHVybiB0cnVlO1xuICB9XG5cbiAgc3RhdGUua2luZCA9IF9raW5kO1xuICBzdGF0ZS5yZXN1bHQgPSBfcmVzdWx0O1xuICByZXR1cm4gZmFsc2U7XG59XG5cbmZ1bmN0aW9uIHJlYWRTaW5nbGVRdW90ZWRTY2FsYXIoc3RhdGUsIG5vZGVJbmRlbnQpIHtcbiAgdmFyIGNoLFxuICAgICAgY2FwdHVyZVN0YXJ0LCBjYXB0dXJlRW5kO1xuXG4gIGNoID0gc3RhdGUuaW5wdXQuY2hhckNvZGVBdChzdGF0ZS5wb3NpdGlvbik7XG5cbiAgaWYgKGNoICE9PSAweDI3LyogJyAqLykge1xuICAgIHJldHVybiBmYWxzZTtcbiAgfVxuXG4gIHN0YXRlLmtpbmQgPSAnc2NhbGFyJztcbiAgc3RhdGUucmVzdWx0ID0gJyc7XG4gIHN0YXRlLnBvc2l0aW9uKys7XG4gIGNhcHR1cmVTdGFydCA9IGNhcHR1cmVFbmQgPSBzdGF0ZS5wb3NpdGlvbjtcblxuICB3aGlsZSAoKGNoID0gc3RhdGUuaW5wdXQuY2hhckNvZGVBdChzdGF0ZS5wb3NpdGlvbikpICE9PSAwKSB7XG4gICAgaWYgKGNoID09PSAweDI3LyogJyAqLykge1xuICAgICAgY2FwdHVyZVNlZ21lbnQoc3RhdGUsIGNhcHR1cmVTdGFydCwgc3RhdGUucG9zaXRpb24sIHRydWUpO1xuICAgICAgY2ggPSBzdGF0ZS5pbnB1dC5jaGFyQ29kZUF0KCsrc3RhdGUucG9zaXRpb24pO1xuXG4gICAgICBpZiAoY2ggPT09IDB4MjcvKiAnICovKSB7XG4gICAgICAgIGNhcHR1cmVTdGFydCA9IHN0YXRlLnBvc2l0aW9uO1xuICAgICAgICBzdGF0ZS5wb3NpdGlvbisrO1xuICAgICAgICBjYXB0dXJlRW5kID0gc3RhdGUucG9zaXRpb247XG4gICAgICB9IGVsc2Uge1xuICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICAgIH1cblxuICAgIH0gZWxzZSBpZiAoaXNfRU9MKGNoKSkge1xuICAgICAgY2FwdHVyZVNlZ21lbnQoc3RhdGUsIGNhcHR1cmVTdGFydCwgY2FwdHVyZUVuZCwgdHJ1ZSk7XG4gICAgICB3cml0ZUZvbGRlZExpbmVzKHN0YXRlLCBza2lwU2VwYXJhdGlvblNwYWNlKHN0YXRlLCBmYWxzZSwgbm9kZUluZGVudCkpO1xuICAgICAgY2FwdHVyZVN0YXJ0ID0gY2FwdHVyZUVuZCA9IHN0YXRlLnBvc2l0aW9uO1xuXG4gICAgfSBlbHNlIGlmIChzdGF0ZS5wb3NpdGlvbiA9PT0gc3RhdGUubGluZVN0YXJ0ICYmIHRlc3REb2N1bWVudFNlcGFyYXRvcihzdGF0ZSkpIHtcbiAgICAgIHRocm93RXJyb3Ioc3RhdGUsICd1bmV4cGVjdGVkIGVuZCBvZiB0aGUgZG9jdW1lbnQgd2l0aGluIGEgc2luZ2xlIHF1b3RlZCBzY2FsYXInKTtcblxuICAgIH0gZWxzZSB7XG4gICAgICBzdGF0ZS5wb3NpdGlvbisrO1xuICAgICAgY2FwdHVyZUVuZCA9IHN0YXRlLnBvc2l0aW9uO1xuICAgIH1cbiAgfVxuXG4gIHRocm93RXJyb3Ioc3RhdGUsICd1bmV4cGVjdGVkIGVuZCBvZiB0aGUgc3RyZWFtIHdpdGhpbiBhIHNpbmdsZSBxdW90ZWQgc2NhbGFyJyk7XG59XG5cbmZ1bmN0aW9uIHJlYWREb3VibGVRdW90ZWRTY2FsYXIoc3RhdGUsIG5vZGVJbmRlbnQpIHtcbiAgdmFyIGNhcHR1cmVTdGFydCxcbiAgICAgIGNhcHR1cmVFbmQsXG4gICAgICBoZXhMZW5ndGgsXG4gICAgICBoZXhSZXN1bHQsXG4gICAgICB0bXAsXG4gICAgICBjaDtcblxuICBjaCA9IHN0YXRlLmlucHV0LmNoYXJDb2RlQXQoc3RhdGUucG9zaXRpb24pO1xuXG4gIGlmIChjaCAhPT0gMHgyMi8qIFwiICovKSB7XG4gICAgcmV0dXJuIGZhbHNlO1xuICB9XG5cbiAgc3RhdGUua2luZCA9ICdzY2FsYXInO1xuICBzdGF0ZS5yZXN1bHQgPSAnJztcbiAgc3RhdGUucG9zaXRpb24rKztcbiAgY2FwdHVyZVN0YXJ0ID0gY2FwdHVyZUVuZCA9IHN0YXRlLnBvc2l0aW9uO1xuXG4gIHdoaWxlICgoY2ggPSBzdGF0ZS5pbnB1dC5jaGFyQ29kZUF0KHN0YXRlLnBvc2l0aW9uKSkgIT09IDApIHtcbiAgICBpZiAoY2ggPT09IDB4MjIvKiBcIiAqLykge1xuICAgICAgY2FwdHVyZVNlZ21lbnQoc3RhdGUsIGNhcHR1cmVTdGFydCwgc3RhdGUucG9zaXRpb24sIHRydWUpO1xuICAgICAgc3RhdGUucG9zaXRpb24rKztcbiAgICAgIHJldHVybiB0cnVlO1xuXG4gICAgfSBlbHNlIGlmIChjaCA9PT0gMHg1Qy8qIFxcICovKSB7XG4gICAgICBjYXB0dXJlU2VnbWVudChzdGF0ZSwgY2FwdHVyZVN0YXJ0LCBzdGF0ZS5wb3NpdGlvbiwgdHJ1ZSk7XG4gICAgICBjaCA9IHN0YXRlLmlucHV0LmNoYXJDb2RlQXQoKytzdGF0ZS5wb3NpdGlvbik7XG5cbiAgICAgIGlmIChpc19FT0woY2gpKSB7XG4gICAgICAgIHNraXBTZXBhcmF0aW9uU3BhY2Uoc3RhdGUsIGZhbHNlLCBub2RlSW5kZW50KTtcblxuICAgICAgICAvLyBUT0RPOiByZXdvcmsgdG8gaW5saW5lIGZuIHdpdGggbm8gdHlwZSBjYXN0P1xuICAgICAgfSBlbHNlIGlmIChjaCA8IDI1NiAmJiBzaW1wbGVFc2NhcGVDaGVja1tjaF0pIHtcbiAgICAgICAgc3RhdGUucmVzdWx0ICs9IHNpbXBsZUVzY2FwZU1hcFtjaF07XG4gICAgICAgIHN0YXRlLnBvc2l0aW9uKys7XG5cbiAgICAgIH0gZWxzZSBpZiAoKHRtcCA9IGVzY2FwZWRIZXhMZW4oY2gpKSA+IDApIHtcbiAgICAgICAgaGV4TGVuZ3RoID0gdG1wO1xuICAgICAgICBoZXhSZXN1bHQgPSAwO1xuXG4gICAgICAgIGZvciAoOyBoZXhMZW5ndGggPiAwOyBoZXhMZW5ndGgtLSkge1xuICAgICAgICAgIGNoID0gc3RhdGUuaW5wdXQuY2hhckNvZGVBdCgrK3N0YXRlLnBvc2l0aW9uKTtcblxuICAgICAgICAgIGlmICgodG1wID0gZnJvbUhleENvZGUoY2gpKSA+PSAwKSB7XG4gICAgICAgICAgICBoZXhSZXN1bHQgPSAoaGV4UmVzdWx0IDw8IDQpICsgdG1wO1xuXG4gICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHRocm93RXJyb3Ioc3RhdGUsICdleHBlY3RlZCBoZXhhZGVjaW1hbCBjaGFyYWN0ZXInKTtcbiAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgICAgICBzdGF0ZS5yZXN1bHQgKz0gY2hhckZyb21Db2RlcG9pbnQoaGV4UmVzdWx0KTtcblxuICAgICAgICBzdGF0ZS5wb3NpdGlvbisrO1xuXG4gICAgICB9IGVsc2Uge1xuICAgICAgICB0aHJvd0Vycm9yKHN0YXRlLCAndW5rbm93biBlc2NhcGUgc2VxdWVuY2UnKTtcbiAgICAgIH1cblxuICAgICAgY2FwdHVyZVN0YXJ0ID0gY2FwdHVyZUVuZCA9IHN0YXRlLnBvc2l0aW9uO1xuXG4gICAgfSBlbHNlIGlmIChpc19FT0woY2gpKSB7XG4gICAgICBjYXB0dXJlU2VnbWVudChzdGF0ZSwgY2FwdHVyZVN0YXJ0LCBjYXB0dXJlRW5kLCB0cnVlKTtcbiAgICAgIHdyaXRlRm9sZGVkTGluZXMoc3RhdGUsIHNraXBTZXBhcmF0aW9uU3BhY2Uoc3RhdGUsIGZhbHNlLCBub2RlSW5kZW50KSk7XG4gICAgICBjYXB0dXJlU3RhcnQgPSBjYXB0dXJlRW5kID0gc3RhdGUucG9zaXRpb247XG5cbiAgICB9IGVsc2UgaWYgKHN0YXRlLnBvc2l0aW9uID09PSBzdGF0ZS5saW5lU3RhcnQgJiYgdGVzdERvY3VtZW50U2VwYXJhdG9yKHN0YXRlKSkge1xuICAgICAgdGhyb3dFcnJvcihzdGF0ZSwgJ3VuZXhwZWN0ZWQgZW5kIG9mIHRoZSBkb2N1bWVudCB3aXRoaW4gYSBkb3VibGUgcXVvdGVkIHNjYWxhcicpO1xuXG4gICAgfSBlbHNlIHtcbiAgICAgIHN0YXRlLnBvc2l0aW9uKys7XG4gICAgICBjYXB0dXJlRW5kID0gc3RhdGUucG9zaXRpb247XG4gICAgfVxuICB9XG5cbiAgdGhyb3dFcnJvcihzdGF0ZSwgJ3VuZXhwZWN0ZWQgZW5kIG9mIHRoZSBzdHJlYW0gd2l0aGluIGEgZG91YmxlIHF1b3RlZCBzY2FsYXInKTtcbn1cblxuZnVuY3Rpb24gcmVhZEZsb3dDb2xsZWN0aW9uKHN0YXRlLCBub2RlSW5kZW50KSB7XG4gIHZhciByZWFkTmV4dCA9IHRydWUsXG4gICAgICBfbGluZSxcbiAgICAgIF90YWcgICAgID0gc3RhdGUudGFnLFxuICAgICAgX3Jlc3VsdCxcbiAgICAgIF9hbmNob3IgID0gc3RhdGUuYW5jaG9yLFxuICAgICAgZm9sbG93aW5nLFxuICAgICAgdGVybWluYXRvcixcbiAgICAgIGlzUGFpcixcbiAgICAgIGlzRXhwbGljaXRQYWlyLFxuICAgICAgaXNNYXBwaW5nLFxuICAgICAgb3ZlcnJpZGFibGVLZXlzID0ge30sXG4gICAgICBrZXlOb2RlLFxuICAgICAga2V5VGFnLFxuICAgICAgdmFsdWVOb2RlLFxuICAgICAgY2g7XG5cbiAgY2ggPSBzdGF0ZS5pbnB1dC5jaGFyQ29kZUF0KHN0YXRlLnBvc2l0aW9uKTtcblxuICBpZiAoY2ggPT09IDB4NUIvKiBbICovKSB7XG4gICAgdGVybWluYXRvciA9IDB4NUQ7LyogXSAqL1xuICAgIGlzTWFwcGluZyA9IGZhbHNlO1xuICAgIF9yZXN1bHQgPSBbXTtcbiAgfSBlbHNlIGlmIChjaCA9PT0gMHg3Qi8qIHsgKi8pIHtcbiAgICB0ZXJtaW5hdG9yID0gMHg3RDsvKiB9ICovXG4gICAgaXNNYXBwaW5nID0gdHJ1ZTtcbiAgICBfcmVzdWx0ID0ge307XG4gIH0gZWxzZSB7XG4gICAgcmV0dXJuIGZhbHNlO1xuICB9XG5cbiAgaWYgKHN0YXRlLmFuY2hvciAhPT0gbnVsbCkge1xuICAgIHN0YXRlLmFuY2hvck1hcFtzdGF0ZS5hbmNob3JdID0gX3Jlc3VsdDtcbiAgfVxuXG4gIGNoID0gc3RhdGUuaW5wdXQuY2hhckNvZGVBdCgrK3N0YXRlLnBvc2l0aW9uKTtcblxuICB3aGlsZSAoY2ggIT09IDApIHtcbiAgICBza2lwU2VwYXJhdGlvblNwYWNlKHN0YXRlLCB0cnVlLCBub2RlSW5kZW50KTtcblxuICAgIGNoID0gc3RhdGUuaW5wdXQuY2hhckNvZGVBdChzdGF0ZS5wb3NpdGlvbik7XG5cbiAgICBpZiAoY2ggPT09IHRlcm1pbmF0b3IpIHtcbiAgICAgIHN0YXRlLnBvc2l0aW9uKys7XG4gICAgICBzdGF0ZS50YWcgPSBfdGFnO1xuICAgICAgc3RhdGUuYW5jaG9yID0gX2FuY2hvcjtcbiAgICAgIHN0YXRlLmtpbmQgPSBpc01hcHBpbmcgPyAnbWFwcGluZycgOiAnc2VxdWVuY2UnO1xuICAgICAgc3RhdGUucmVzdWx0ID0gX3Jlc3VsdDtcbiAgICAgIHJldHVybiB0cnVlO1xuICAgIH0gZWxzZSBpZiAoIXJlYWROZXh0KSB7XG4gICAgICB0aHJvd0Vycm9yKHN0YXRlLCAnbWlzc2VkIGNvbW1hIGJldHdlZW4gZmxvdyBjb2xsZWN0aW9uIGVudHJpZXMnKTtcbiAgICB9XG5cbiAgICBrZXlUYWcgPSBrZXlOb2RlID0gdmFsdWVOb2RlID0gbnVsbDtcbiAgICBpc1BhaXIgPSBpc0V4cGxpY2l0UGFpciA9IGZhbHNlO1xuXG4gICAgaWYgKGNoID09PSAweDNGLyogPyAqLykge1xuICAgICAgZm9sbG93aW5nID0gc3RhdGUuaW5wdXQuY2hhckNvZGVBdChzdGF0ZS5wb3NpdGlvbiArIDEpO1xuXG4gICAgICBpZiAoaXNfV1NfT1JfRU9MKGZvbGxvd2luZykpIHtcbiAgICAgICAgaXNQYWlyID0gaXNFeHBsaWNpdFBhaXIgPSB0cnVlO1xuICAgICAgICBzdGF0ZS5wb3NpdGlvbisrO1xuICAgICAgICBza2lwU2VwYXJhdGlvblNwYWNlKHN0YXRlLCB0cnVlLCBub2RlSW5kZW50KTtcbiAgICAgIH1cbiAgICB9XG5cbiAgICBfbGluZSA9IHN0YXRlLmxpbmU7XG4gICAgY29tcG9zZU5vZGUoc3RhdGUsIG5vZGVJbmRlbnQsIENPTlRFWFRfRkxPV19JTiwgZmFsc2UsIHRydWUpO1xuICAgIGtleVRhZyA9IHN0YXRlLnRhZztcbiAgICBrZXlOb2RlID0gc3RhdGUucmVzdWx0O1xuICAgIHNraXBTZXBhcmF0aW9uU3BhY2Uoc3RhdGUsIHRydWUsIG5vZGVJbmRlbnQpO1xuXG4gICAgY2ggPSBzdGF0ZS5pbnB1dC5jaGFyQ29kZUF0KHN0YXRlLnBvc2l0aW9uKTtcblxuICAgIGlmICgoaXNFeHBsaWNpdFBhaXIgfHwgc3RhdGUubGluZSA9PT0gX2xpbmUpICYmIGNoID09PSAweDNBLyogOiAqLykge1xuICAgICAgaXNQYWlyID0gdHJ1ZTtcbiAgICAgIGNoID0gc3RhdGUuaW5wdXQuY2hhckNvZGVBdCgrK3N0YXRlLnBvc2l0aW9uKTtcbiAgICAgIHNraXBTZXBhcmF0aW9uU3BhY2Uoc3RhdGUsIHRydWUsIG5vZGVJbmRlbnQpO1xuICAgICAgY29tcG9zZU5vZGUoc3RhdGUsIG5vZGVJbmRlbnQsIENPTlRFWFRfRkxPV19JTiwgZmFsc2UsIHRydWUpO1xuICAgICAgdmFsdWVOb2RlID0gc3RhdGUucmVzdWx0O1xuICAgIH1cblxuICAgIGlmIChpc01hcHBpbmcpIHtcbiAgICAgIHN0b3JlTWFwcGluZ1BhaXIoc3RhdGUsIF9yZXN1bHQsIG92ZXJyaWRhYmxlS2V5cywga2V5VGFnLCBrZXlOb2RlLCB2YWx1ZU5vZGUpO1xuICAgIH0gZWxzZSBpZiAoaXNQYWlyKSB7XG4gICAgICBfcmVzdWx0LnB1c2goc3RvcmVNYXBwaW5nUGFpcihzdGF0ZSwgbnVsbCwgb3ZlcnJpZGFibGVLZXlzLCBrZXlUYWcsIGtleU5vZGUsIHZhbHVlTm9kZSkpO1xuICAgIH0gZWxzZSB7XG4gICAgICBfcmVzdWx0LnB1c2goa2V5Tm9kZSk7XG4gICAgfVxuXG4gICAgc2tpcFNlcGFyYXRpb25TcGFjZShzdGF0ZSwgdHJ1ZSwgbm9kZUluZGVudCk7XG5cbiAgICBjaCA9IHN0YXRlLmlucHV0LmNoYXJDb2RlQXQoc3RhdGUucG9zaXRpb24pO1xuXG4gICAgaWYgKGNoID09PSAweDJDLyogLCAqLykge1xuICAgICAgcmVhZE5leHQgPSB0cnVlO1xuICAgICAgY2ggPSBzdGF0ZS5pbnB1dC5jaGFyQ29kZUF0KCsrc3RhdGUucG9zaXRpb24pO1xuICAgIH0gZWxzZSB7XG4gICAgICByZWFkTmV4dCA9IGZhbHNlO1xuICAgIH1cbiAgfVxuXG4gIHRocm93RXJyb3Ioc3RhdGUsICd1bmV4cGVjdGVkIGVuZCBvZiB0aGUgc3RyZWFtIHdpdGhpbiBhIGZsb3cgY29sbGVjdGlvbicpO1xufVxuXG5mdW5jdGlvbiByZWFkQmxvY2tTY2FsYXIoc3RhdGUsIG5vZGVJbmRlbnQpIHtcbiAgdmFyIGNhcHR1cmVTdGFydCxcbiAgICAgIGZvbGRpbmcsXG4gICAgICBjaG9tcGluZyAgICAgICA9IENIT01QSU5HX0NMSVAsXG4gICAgICBkaWRSZWFkQ29udGVudCA9IGZhbHNlLFxuICAgICAgZGV0ZWN0ZWRJbmRlbnQgPSBmYWxzZSxcbiAgICAgIHRleHRJbmRlbnQgICAgID0gbm9kZUluZGVudCxcbiAgICAgIGVtcHR5TGluZXMgICAgID0gMCxcbiAgICAgIGF0TW9yZUluZGVudGVkID0gZmFsc2UsXG4gICAgICB0bXAsXG4gICAgICBjaDtcblxuICBjaCA9IHN0YXRlLmlucHV0LmNoYXJDb2RlQXQoc3RhdGUucG9zaXRpb24pO1xuXG4gIGlmIChjaCA9PT0gMHg3Qy8qIHwgKi8pIHtcbiAgICBmb2xkaW5nID0gZmFsc2U7XG4gIH0gZWxzZSBpZiAoY2ggPT09IDB4M0UvKiA+ICovKSB7XG4gICAgZm9sZGluZyA9IHRydWU7XG4gIH0gZWxzZSB7XG4gICAgcmV0dXJuIGZhbHNlO1xuICB9XG5cbiAgc3RhdGUua2luZCA9ICdzY2FsYXInO1xuICBzdGF0ZS5yZXN1bHQgPSAnJztcblxuICB3aGlsZSAoY2ggIT09IDApIHtcbiAgICBjaCA9IHN0YXRlLmlucHV0LmNoYXJDb2RlQXQoKytzdGF0ZS5wb3NpdGlvbik7XG5cbiAgICBpZiAoY2ggPT09IDB4MkIvKiArICovIHx8IGNoID09PSAweDJELyogLSAqLykge1xuICAgICAgaWYgKENIT01QSU5HX0NMSVAgPT09IGNob21waW5nKSB7XG4gICAgICAgIGNob21waW5nID0gKGNoID09PSAweDJCLyogKyAqLykgPyBDSE9NUElOR19LRUVQIDogQ0hPTVBJTkdfU1RSSVA7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICB0aHJvd0Vycm9yKHN0YXRlLCAncmVwZWF0IG9mIGEgY2hvbXBpbmcgbW9kZSBpZGVudGlmaWVyJyk7XG4gICAgICB9XG5cbiAgICB9IGVsc2UgaWYgKCh0bXAgPSBmcm9tRGVjaW1hbENvZGUoY2gpKSA+PSAwKSB7XG4gICAgICBpZiAodG1wID09PSAwKSB7XG4gICAgICAgIHRocm93RXJyb3Ioc3RhdGUsICdiYWQgZXhwbGljaXQgaW5kZW50YXRpb24gd2lkdGggb2YgYSBibG9jayBzY2FsYXI7IGl0IGNhbm5vdCBiZSBsZXNzIHRoYW4gb25lJyk7XG4gICAgICB9IGVsc2UgaWYgKCFkZXRlY3RlZEluZGVudCkge1xuICAgICAgICB0ZXh0SW5kZW50ID0gbm9kZUluZGVudCArIHRtcCAtIDE7XG4gICAgICAgIGRldGVjdGVkSW5kZW50ID0gdHJ1ZTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHRocm93RXJyb3Ioc3RhdGUsICdyZXBlYXQgb2YgYW4gaW5kZW50YXRpb24gd2lkdGggaWRlbnRpZmllcicpO1xuICAgICAgfVxuXG4gICAgfSBlbHNlIHtcbiAgICAgIGJyZWFrO1xuICAgIH1cbiAgfVxuXG4gIGlmIChpc19XSElURV9TUEFDRShjaCkpIHtcbiAgICBkbyB7IGNoID0gc3RhdGUuaW5wdXQuY2hhckNvZGVBdCgrK3N0YXRlLnBvc2l0aW9uKTsgfVxuICAgIHdoaWxlIChpc19XSElURV9TUEFDRShjaCkpO1xuXG4gICAgaWYgKGNoID09PSAweDIzLyogIyAqLykge1xuICAgICAgZG8geyBjaCA9IHN0YXRlLmlucHV0LmNoYXJDb2RlQXQoKytzdGF0ZS5wb3NpdGlvbik7IH1cbiAgICAgIHdoaWxlICghaXNfRU9MKGNoKSAmJiAoY2ggIT09IDApKTtcbiAgICB9XG4gIH1cblxuICB3aGlsZSAoY2ggIT09IDApIHtcbiAgICByZWFkTGluZUJyZWFrKHN0YXRlKTtcbiAgICBzdGF0ZS5saW5lSW5kZW50ID0gMDtcblxuICAgIGNoID0gc3RhdGUuaW5wdXQuY2hhckNvZGVBdChzdGF0ZS5wb3NpdGlvbik7XG5cbiAgICB3aGlsZSAoKCFkZXRlY3RlZEluZGVudCB8fCBzdGF0ZS5saW5lSW5kZW50IDwgdGV4dEluZGVudCkgJiZcbiAgICAgICAgICAgKGNoID09PSAweDIwLyogU3BhY2UgKi8pKSB7XG4gICAgICBzdGF0ZS5saW5lSW5kZW50Kys7XG4gICAgICBjaCA9IHN0YXRlLmlucHV0LmNoYXJDb2RlQXQoKytzdGF0ZS5wb3NpdGlvbik7XG4gICAgfVxuXG4gICAgaWYgKCFkZXRlY3RlZEluZGVudCAmJiBzdGF0ZS5saW5lSW5kZW50ID4gdGV4dEluZGVudCkge1xuICAgICAgdGV4dEluZGVudCA9IHN0YXRlLmxpbmVJbmRlbnQ7XG4gICAgfVxuXG4gICAgaWYgKGlzX0VPTChjaCkpIHtcbiAgICAgIGVtcHR5TGluZXMrKztcbiAgICAgIGNvbnRpbnVlO1xuICAgIH1cblxuICAgIC8vIEVuZCBvZiB0aGUgc2NhbGFyLlxuICAgIGlmIChzdGF0ZS5saW5lSW5kZW50IDwgdGV4dEluZGVudCkge1xuXG4gICAgICAvLyBQZXJmb3JtIHRoZSBjaG9tcGluZy5cbiAgICAgIGlmIChjaG9tcGluZyA9PT0gQ0hPTVBJTkdfS0VFUCkge1xuICAgICAgICBzdGF0ZS5yZXN1bHQgKz0gY29tbW9uLnJlcGVhdCgnXFxuJywgZGlkUmVhZENvbnRlbnQgPyAxICsgZW1wdHlMaW5lcyA6IGVtcHR5TGluZXMpO1xuICAgICAgfSBlbHNlIGlmIChjaG9tcGluZyA9PT0gQ0hPTVBJTkdfQ0xJUCkge1xuICAgICAgICBpZiAoZGlkUmVhZENvbnRlbnQpIHsgLy8gaS5lLiBvbmx5IGlmIHRoZSBzY2FsYXIgaXMgbm90IGVtcHR5LlxuICAgICAgICAgIHN0YXRlLnJlc3VsdCArPSAnXFxuJztcbiAgICAgICAgfVxuICAgICAgfVxuXG4gICAgICAvLyBCcmVhayB0aGlzIGB3aGlsZWAgY3ljbGUgYW5kIGdvIHRvIHRoZSBmdW5jaXRvbidzIGVwaWxvZ3VlLlxuICAgICAgYnJlYWs7XG4gICAgfVxuXG4gICAgLy8gRm9sZGVkIHN0eWxlOiB1c2UgZmFuY3kgcnVsZXMgdG8gaGFuZGxlIGxpbmUgYnJlYWtzLlxuICAgIGlmIChmb2xkaW5nKSB7XG5cbiAgICAgIC8vIExpbmVzIHN0YXJ0aW5nIHdpdGggd2hpdGUgc3BhY2UgY2hhcmFjdGVycyAobW9yZS1pbmRlbnRlZCBsaW5lcykgYXJlIG5vdCBmb2xkZWQuXG4gICAgICBpZiAoaXNfV0hJVEVfU1BBQ0UoY2gpKSB7XG4gICAgICAgIGF0TW9yZUluZGVudGVkID0gdHJ1ZTtcbiAgICAgICAgLy8gZXhjZXB0IGZvciB0aGUgZmlyc3QgY29udGVudCBsaW5lIChjZi4gRXhhbXBsZSA4LjEpXG4gICAgICAgIHN0YXRlLnJlc3VsdCArPSBjb21tb24ucmVwZWF0KCdcXG4nLCBkaWRSZWFkQ29udGVudCA/IDEgKyBlbXB0eUxpbmVzIDogZW1wdHlMaW5lcyk7XG5cbiAgICAgIC8vIEVuZCBvZiBtb3JlLWluZGVudGVkIGJsb2NrLlxuICAgICAgfSBlbHNlIGlmIChhdE1vcmVJbmRlbnRlZCkge1xuICAgICAgICBhdE1vcmVJbmRlbnRlZCA9IGZhbHNlO1xuICAgICAgICBzdGF0ZS5yZXN1bHQgKz0gY29tbW9uLnJlcGVhdCgnXFxuJywgZW1wdHlMaW5lcyArIDEpO1xuXG4gICAgICAvLyBKdXN0IG9uZSBsaW5lIGJyZWFrIC0gcGVyY2VpdmUgYXMgdGhlIHNhbWUgbGluZS5cbiAgICAgIH0gZWxzZSBpZiAoZW1wdHlMaW5lcyA9PT0gMCkge1xuICAgICAgICBpZiAoZGlkUmVhZENvbnRlbnQpIHsgLy8gaS5lLiBvbmx5IGlmIHdlIGhhdmUgYWxyZWFkeSByZWFkIHNvbWUgc2NhbGFyIGNvbnRlbnQuXG4gICAgICAgICAgc3RhdGUucmVzdWx0ICs9ICcgJztcbiAgICAgICAgfVxuXG4gICAgICAvLyBTZXZlcmFsIGxpbmUgYnJlYWtzIC0gcGVyY2VpdmUgYXMgZGlmZmVyZW50IGxpbmVzLlxuICAgICAgfSBlbHNlIHtcbiAgICAgICAgc3RhdGUucmVzdWx0ICs9IGNvbW1vbi5yZXBlYXQoJ1xcbicsIGVtcHR5TGluZXMpO1xuICAgICAgfVxuXG4gICAgLy8gTGl0ZXJhbCBzdHlsZToganVzdCBhZGQgZXhhY3QgbnVtYmVyIG9mIGxpbmUgYnJlYWtzIGJldHdlZW4gY29udGVudCBsaW5lcy5cbiAgICB9IGVsc2Uge1xuICAgICAgLy8gS2VlcCBhbGwgbGluZSBicmVha3MgZXhjZXB0IHRoZSBoZWFkZXIgbGluZSBicmVhay5cbiAgICAgIHN0YXRlLnJlc3VsdCArPSBjb21tb24ucmVwZWF0KCdcXG4nLCBkaWRSZWFkQ29udGVudCA/IDEgKyBlbXB0eUxpbmVzIDogZW1wdHlMaW5lcyk7XG4gICAgfVxuXG4gICAgZGlkUmVhZENvbnRlbnQgPSB0cnVlO1xuICAgIGRldGVjdGVkSW5kZW50ID0gdHJ1ZTtcbiAgICBlbXB0eUxpbmVzID0gMDtcbiAgICBjYXB0dXJlU3RhcnQgPSBzdGF0ZS5wb3NpdGlvbjtcblxuICAgIHdoaWxlICghaXNfRU9MKGNoKSAmJiAoY2ggIT09IDApKSB7XG4gICAgICBjaCA9IHN0YXRlLmlucHV0LmNoYXJDb2RlQXQoKytzdGF0ZS5wb3NpdGlvbik7XG4gICAgfVxuXG4gICAgY2FwdHVyZVNlZ21lbnQoc3RhdGUsIGNhcHR1cmVTdGFydCwgc3RhdGUucG9zaXRpb24sIGZhbHNlKTtcbiAgfVxuXG4gIHJldHVybiB0cnVlO1xufVxuXG5mdW5jdGlvbiByZWFkQmxvY2tTZXF1ZW5jZShzdGF0ZSwgbm9kZUluZGVudCkge1xuICB2YXIgX2xpbmUsXG4gICAgICBfdGFnICAgICAgPSBzdGF0ZS50YWcsXG4gICAgICBfYW5jaG9yICAgPSBzdGF0ZS5hbmNob3IsXG4gICAgICBfcmVzdWx0ICAgPSBbXSxcbiAgICAgIGZvbGxvd2luZyxcbiAgICAgIGRldGVjdGVkICA9IGZhbHNlLFxuICAgICAgY2g7XG5cbiAgaWYgKHN0YXRlLmFuY2hvciAhPT0gbnVsbCkge1xuICAgIHN0YXRlLmFuY2hvck1hcFtzdGF0ZS5hbmNob3JdID0gX3Jlc3VsdDtcbiAgfVxuXG4gIGNoID0gc3RhdGUuaW5wdXQuY2hhckNvZGVBdChzdGF0ZS5wb3NpdGlvbik7XG5cbiAgd2hpbGUgKGNoICE9PSAwKSB7XG5cbiAgICBpZiAoY2ggIT09IDB4MkQvKiAtICovKSB7XG4gICAgICBicmVhaztcbiAgICB9XG5cbiAgICBmb2xsb3dpbmcgPSBzdGF0ZS5pbnB1dC5jaGFyQ29kZUF0KHN0YXRlLnBvc2l0aW9uICsgMSk7XG5cbiAgICBpZiAoIWlzX1dTX09SX0VPTChmb2xsb3dpbmcpKSB7XG4gICAgICBicmVhaztcbiAgICB9XG5cbiAgICBkZXRlY3RlZCA9IHRydWU7XG4gICAgc3RhdGUucG9zaXRpb24rKztcblxuICAgIGlmIChza2lwU2VwYXJhdGlvblNwYWNlKHN0YXRlLCB0cnVlLCAtMSkpIHtcbiAgICAgIGlmIChzdGF0ZS5saW5lSW5kZW50IDw9IG5vZGVJbmRlbnQpIHtcbiAgICAgICAgX3Jlc3VsdC5wdXNoKG51bGwpO1xuICAgICAgICBjaCA9IHN0YXRlLmlucHV0LmNoYXJDb2RlQXQoc3RhdGUucG9zaXRpb24pO1xuICAgICAgICBjb250aW51ZTtcbiAgICAgIH1cbiAgICB9XG5cbiAgICBfbGluZSA9IHN0YXRlLmxpbmU7XG4gICAgY29tcG9zZU5vZGUoc3RhdGUsIG5vZGVJbmRlbnQsIENPTlRFWFRfQkxPQ0tfSU4sIGZhbHNlLCB0cnVlKTtcbiAgICBfcmVzdWx0LnB1c2goc3RhdGUucmVzdWx0KTtcbiAgICBza2lwU2VwYXJhdGlvblNwYWNlKHN0YXRlLCB0cnVlLCAtMSk7XG5cbiAgICBjaCA9IHN0YXRlLmlucHV0LmNoYXJDb2RlQXQoc3RhdGUucG9zaXRpb24pO1xuXG4gICAgaWYgKChzdGF0ZS5saW5lID09PSBfbGluZSB8fCBzdGF0ZS5saW5lSW5kZW50ID4gbm9kZUluZGVudCkgJiYgKGNoICE9PSAwKSkge1xuICAgICAgdGhyb3dFcnJvcihzdGF0ZSwgJ2JhZCBpbmRlbnRhdGlvbiBvZiBhIHNlcXVlbmNlIGVudHJ5Jyk7XG4gICAgfSBlbHNlIGlmIChzdGF0ZS5saW5lSW5kZW50IDwgbm9kZUluZGVudCkge1xuICAgICAgYnJlYWs7XG4gICAgfVxuICB9XG5cbiAgaWYgKGRldGVjdGVkKSB7XG4gICAgc3RhdGUudGFnID0gX3RhZztcbiAgICBzdGF0ZS5hbmNob3IgPSBfYW5jaG9yO1xuICAgIHN0YXRlLmtpbmQgPSAnc2VxdWVuY2UnO1xuICAgIHN0YXRlLnJlc3VsdCA9IF9yZXN1bHQ7XG4gICAgcmV0dXJuIHRydWU7XG4gIH1cbiAgcmV0dXJuIGZhbHNlO1xufVxuXG5mdW5jdGlvbiByZWFkQmxvY2tNYXBwaW5nKHN0YXRlLCBub2RlSW5kZW50LCBmbG93SW5kZW50KSB7XG4gIHZhciBmb2xsb3dpbmcsXG4gICAgICBhbGxvd0NvbXBhY3QsXG4gICAgICBfbGluZSxcbiAgICAgIF9wb3MsXG4gICAgICBfdGFnICAgICAgICAgID0gc3RhdGUudGFnLFxuICAgICAgX2FuY2hvciAgICAgICA9IHN0YXRlLmFuY2hvcixcbiAgICAgIF9yZXN1bHQgICAgICAgPSB7fSxcbiAgICAgIG92ZXJyaWRhYmxlS2V5cyA9IHt9LFxuICAgICAga2V5VGFnICAgICAgICA9IG51bGwsXG4gICAgICBrZXlOb2RlICAgICAgID0gbnVsbCxcbiAgICAgIHZhbHVlTm9kZSAgICAgPSBudWxsLFxuICAgICAgYXRFeHBsaWNpdEtleSA9IGZhbHNlLFxuICAgICAgZGV0ZWN0ZWQgICAgICA9IGZhbHNlLFxuICAgICAgY2g7XG5cbiAgaWYgKHN0YXRlLmFuY2hvciAhPT0gbnVsbCkge1xuICAgIHN0YXRlLmFuY2hvck1hcFtzdGF0ZS5hbmNob3JdID0gX3Jlc3VsdDtcbiAgfVxuXG4gIGNoID0gc3RhdGUuaW5wdXQuY2hhckNvZGVBdChzdGF0ZS5wb3NpdGlvbik7XG5cbiAgd2hpbGUgKGNoICE9PSAwKSB7XG4gICAgZm9sbG93aW5nID0gc3RhdGUuaW5wdXQuY2hhckNvZGVBdChzdGF0ZS5wb3NpdGlvbiArIDEpO1xuICAgIF9saW5lID0gc3RhdGUubGluZTsgLy8gU2F2ZSB0aGUgY3VycmVudCBsaW5lLlxuICAgIF9wb3MgPSBzdGF0ZS5wb3NpdGlvbjtcblxuICAgIC8vXG4gICAgLy8gRXhwbGljaXQgbm90YXRpb24gY2FzZS4gVGhlcmUgYXJlIHR3byBzZXBhcmF0ZSBibG9ja3M6XG4gICAgLy8gZmlyc3QgZm9yIHRoZSBrZXkgKGRlbm90ZWQgYnkgXCI/XCIpIGFuZCBzZWNvbmQgZm9yIHRoZSB2YWx1ZSAoZGVub3RlZCBieSBcIjpcIilcbiAgICAvL1xuICAgIGlmICgoY2ggPT09IDB4M0YvKiA/ICovIHx8IGNoID09PSAweDNBLyogOiAqLykgJiYgaXNfV1NfT1JfRU9MKGZvbGxvd2luZykpIHtcblxuICAgICAgaWYgKGNoID09PSAweDNGLyogPyAqLykge1xuICAgICAgICBpZiAoYXRFeHBsaWNpdEtleSkge1xuICAgICAgICAgIHN0b3JlTWFwcGluZ1BhaXIoc3RhdGUsIF9yZXN1bHQsIG92ZXJyaWRhYmxlS2V5cywga2V5VGFnLCBrZXlOb2RlLCBudWxsKTtcbiAgICAgICAgICBrZXlUYWcgPSBrZXlOb2RlID0gdmFsdWVOb2RlID0gbnVsbDtcbiAgICAgICAgfVxuXG4gICAgICAgIGRldGVjdGVkID0gdHJ1ZTtcbiAgICAgICAgYXRFeHBsaWNpdEtleSA9IHRydWU7XG4gICAgICAgIGFsbG93Q29tcGFjdCA9IHRydWU7XG5cbiAgICAgIH0gZWxzZSBpZiAoYXRFeHBsaWNpdEtleSkge1xuICAgICAgICAvLyBpLmUuIDB4M0EvKiA6ICovID09PSBjaGFyYWN0ZXIgYWZ0ZXIgdGhlIGV4cGxpY2l0IGtleS5cbiAgICAgICAgYXRFeHBsaWNpdEtleSA9IGZhbHNlO1xuICAgICAgICBhbGxvd0NvbXBhY3QgPSB0cnVlO1xuXG4gICAgICB9IGVsc2Uge1xuICAgICAgICB0aHJvd0Vycm9yKHN0YXRlLCAnaW5jb21wbGV0ZSBleHBsaWNpdCBtYXBwaW5nIHBhaXI7IGEga2V5IG5vZGUgaXMgbWlzc2VkOyBvciBmb2xsb3dlZCBieSBhIG5vbi10YWJ1bGF0ZWQgZW1wdHkgbGluZScpO1xuICAgICAgfVxuXG4gICAgICBzdGF0ZS5wb3NpdGlvbiArPSAxO1xuICAgICAgY2ggPSBmb2xsb3dpbmc7XG5cbiAgICAvL1xuICAgIC8vIEltcGxpY2l0IG5vdGF0aW9uIGNhc2UuIEZsb3ctc3R5bGUgbm9kZSBhcyB0aGUga2V5IGZpcnN0LCB0aGVuIFwiOlwiLCBhbmQgdGhlIHZhbHVlLlxuICAgIC8vXG4gICAgfSBlbHNlIGlmIChjb21wb3NlTm9kZShzdGF0ZSwgZmxvd0luZGVudCwgQ09OVEVYVF9GTE9XX09VVCwgZmFsc2UsIHRydWUpKSB7XG5cbiAgICAgIGlmIChzdGF0ZS5saW5lID09PSBfbGluZSkge1xuICAgICAgICBjaCA9IHN0YXRlLmlucHV0LmNoYXJDb2RlQXQoc3RhdGUucG9zaXRpb24pO1xuXG4gICAgICAgIHdoaWxlIChpc19XSElURV9TUEFDRShjaCkpIHtcbiAgICAgICAgICBjaCA9IHN0YXRlLmlucHV0LmNoYXJDb2RlQXQoKytzdGF0ZS5wb3NpdGlvbik7XG4gICAgICAgIH1cblxuICAgICAgICBpZiAoY2ggPT09IDB4M0EvKiA6ICovKSB7XG4gICAgICAgICAgY2ggPSBzdGF0ZS5pbnB1dC5jaGFyQ29kZUF0KCsrc3RhdGUucG9zaXRpb24pO1xuXG4gICAgICAgICAgaWYgKCFpc19XU19PUl9FT0woY2gpKSB7XG4gICAgICAgICAgICB0aHJvd0Vycm9yKHN0YXRlLCAnYSB3aGl0ZXNwYWNlIGNoYXJhY3RlciBpcyBleHBlY3RlZCBhZnRlciB0aGUga2V5LXZhbHVlIHNlcGFyYXRvciB3aXRoaW4gYSBibG9jayBtYXBwaW5nJyk7XG4gICAgICAgICAgfVxuXG4gICAgICAgICAgaWYgKGF0RXhwbGljaXRLZXkpIHtcbiAgICAgICAgICAgIHN0b3JlTWFwcGluZ1BhaXIoc3RhdGUsIF9yZXN1bHQsIG92ZXJyaWRhYmxlS2V5cywga2V5VGFnLCBrZXlOb2RlLCBudWxsKTtcbiAgICAgICAgICAgIGtleVRhZyA9IGtleU5vZGUgPSB2YWx1ZU5vZGUgPSBudWxsO1xuICAgICAgICAgIH1cblxuICAgICAgICAgIGRldGVjdGVkID0gdHJ1ZTtcbiAgICAgICAgICBhdEV4cGxpY2l0S2V5ID0gZmFsc2U7XG4gICAgICAgICAgYWxsb3dDb21wYWN0ID0gZmFsc2U7XG4gICAgICAgICAga2V5VGFnID0gc3RhdGUudGFnO1xuICAgICAgICAgIGtleU5vZGUgPSBzdGF0ZS5yZXN1bHQ7XG5cbiAgICAgICAgfSBlbHNlIGlmIChkZXRlY3RlZCkge1xuICAgICAgICAgIHRocm93RXJyb3Ioc3RhdGUsICdjYW4gbm90IHJlYWQgYW4gaW1wbGljaXQgbWFwcGluZyBwYWlyOyBhIGNvbG9uIGlzIG1pc3NlZCcpO1xuXG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgc3RhdGUudGFnID0gX3RhZztcbiAgICAgICAgICBzdGF0ZS5hbmNob3IgPSBfYW5jaG9yO1xuICAgICAgICAgIHJldHVybiB0cnVlOyAvLyBLZWVwIHRoZSByZXN1bHQgb2YgYGNvbXBvc2VOb2RlYC5cbiAgICAgICAgfVxuXG4gICAgICB9IGVsc2UgaWYgKGRldGVjdGVkKSB7XG4gICAgICAgIHRocm93RXJyb3Ioc3RhdGUsICdjYW4gbm90IHJlYWQgYSBibG9jayBtYXBwaW5nIGVudHJ5OyBhIG11bHRpbGluZSBrZXkgbWF5IG5vdCBiZSBhbiBpbXBsaWNpdCBrZXknKTtcblxuICAgICAgfSBlbHNlIHtcbiAgICAgICAgc3RhdGUudGFnID0gX3RhZztcbiAgICAgICAgc3RhdGUuYW5jaG9yID0gX2FuY2hvcjtcbiAgICAgICAgcmV0dXJuIHRydWU7IC8vIEtlZXAgdGhlIHJlc3VsdCBvZiBgY29tcG9zZU5vZGVgLlxuICAgICAgfVxuXG4gICAgfSBlbHNlIHtcbiAgICAgIGJyZWFrOyAvLyBSZWFkaW5nIGlzIGRvbmUuIEdvIHRvIHRoZSBlcGlsb2d1ZS5cbiAgICB9XG5cbiAgICAvL1xuICAgIC8vIENvbW1vbiByZWFkaW5nIGNvZGUgZm9yIGJvdGggZXhwbGljaXQgYW5kIGltcGxpY2l0IG5vdGF0aW9ucy5cbiAgICAvL1xuICAgIGlmIChzdGF0ZS5saW5lID09PSBfbGluZSB8fCBzdGF0ZS5saW5lSW5kZW50ID4gbm9kZUluZGVudCkge1xuICAgICAgaWYgKGNvbXBvc2VOb2RlKHN0YXRlLCBub2RlSW5kZW50LCBDT05URVhUX0JMT0NLX09VVCwgdHJ1ZSwgYWxsb3dDb21wYWN0KSkge1xuICAgICAgICBpZiAoYXRFeHBsaWNpdEtleSkge1xuICAgICAgICAgIGtleU5vZGUgPSBzdGF0ZS5yZXN1bHQ7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgdmFsdWVOb2RlID0gc3RhdGUucmVzdWx0O1xuICAgICAgICB9XG4gICAgICB9XG5cbiAgICAgIGlmICghYXRFeHBsaWNpdEtleSkge1xuICAgICAgICBzdG9yZU1hcHBpbmdQYWlyKHN0YXRlLCBfcmVzdWx0LCBvdmVycmlkYWJsZUtleXMsIGtleVRhZywga2V5Tm9kZSwgdmFsdWVOb2RlLCBfbGluZSwgX3Bvcyk7XG4gICAgICAgIGtleVRhZyA9IGtleU5vZGUgPSB2YWx1ZU5vZGUgPSBudWxsO1xuICAgICAgfVxuXG4gICAgICBza2lwU2VwYXJhdGlvblNwYWNlKHN0YXRlLCB0cnVlLCAtMSk7XG4gICAgICBjaCA9IHN0YXRlLmlucHV0LmNoYXJDb2RlQXQoc3RhdGUucG9zaXRpb24pO1xuICAgIH1cblxuICAgIGlmIChzdGF0ZS5saW5lSW5kZW50ID4gbm9kZUluZGVudCAmJiAoY2ggIT09IDApKSB7XG4gICAgICB0aHJvd0Vycm9yKHN0YXRlLCAnYmFkIGluZGVudGF0aW9uIG9mIGEgbWFwcGluZyBlbnRyeScpO1xuICAgIH0gZWxzZSBpZiAoc3RhdGUubGluZUluZGVudCA8IG5vZGVJbmRlbnQpIHtcbiAgICAgIGJyZWFrO1xuICAgIH1cbiAgfVxuXG4gIC8vXG4gIC8vIEVwaWxvZ3VlLlxuICAvL1xuXG4gIC8vIFNwZWNpYWwgY2FzZTogbGFzdCBtYXBwaW5nJ3Mgbm9kZSBjb250YWlucyBvbmx5IHRoZSBrZXkgaW4gZXhwbGljaXQgbm90YXRpb24uXG4gIGlmIChhdEV4cGxpY2l0S2V5KSB7XG4gICAgc3RvcmVNYXBwaW5nUGFpcihzdGF0ZSwgX3Jlc3VsdCwgb3ZlcnJpZGFibGVLZXlzLCBrZXlUYWcsIGtleU5vZGUsIG51bGwpO1xuICB9XG5cbiAgLy8gRXhwb3NlIHRoZSByZXN1bHRpbmcgbWFwcGluZy5cbiAgaWYgKGRldGVjdGVkKSB7XG4gICAgc3RhdGUudGFnID0gX3RhZztcbiAgICBzdGF0ZS5hbmNob3IgPSBfYW5jaG9yO1xuICAgIHN0YXRlLmtpbmQgPSAnbWFwcGluZyc7XG4gICAgc3RhdGUucmVzdWx0ID0gX3Jlc3VsdDtcbiAgfVxuXG4gIHJldHVybiBkZXRlY3RlZDtcbn1cblxuZnVuY3Rpb24gcmVhZFRhZ1Byb3BlcnR5KHN0YXRlKSB7XG4gIHZhciBfcG9zaXRpb24sXG4gICAgICBpc1ZlcmJhdGltID0gZmFsc2UsXG4gICAgICBpc05hbWVkICAgID0gZmFsc2UsXG4gICAgICB0YWdIYW5kbGUsXG4gICAgICB0YWdOYW1lLFxuICAgICAgY2g7XG5cbiAgY2ggPSBzdGF0ZS5pbnB1dC5jaGFyQ29kZUF0KHN0YXRlLnBvc2l0aW9uKTtcblxuICBpZiAoY2ggIT09IDB4MjEvKiAhICovKSByZXR1cm4gZmFsc2U7XG5cbiAgaWYgKHN0YXRlLnRhZyAhPT0gbnVsbCkge1xuICAgIHRocm93RXJyb3Ioc3RhdGUsICdkdXBsaWNhdGlvbiBvZiBhIHRhZyBwcm9wZXJ0eScpO1xuICB9XG5cbiAgY2ggPSBzdGF0ZS5pbnB1dC5jaGFyQ29kZUF0KCsrc3RhdGUucG9zaXRpb24pO1xuXG4gIGlmIChjaCA9PT0gMHgzQy8qIDwgKi8pIHtcbiAgICBpc1ZlcmJhdGltID0gdHJ1ZTtcbiAgICBjaCA9IHN0YXRlLmlucHV0LmNoYXJDb2RlQXQoKytzdGF0ZS5wb3NpdGlvbik7XG5cbiAgfSBlbHNlIGlmIChjaCA9PT0gMHgyMS8qICEgKi8pIHtcbiAgICBpc05hbWVkID0gdHJ1ZTtcbiAgICB0YWdIYW5kbGUgPSAnISEnO1xuICAgIGNoID0gc3RhdGUuaW5wdXQuY2hhckNvZGVBdCgrK3N0YXRlLnBvc2l0aW9uKTtcblxuICB9IGVsc2Uge1xuICAgIHRhZ0hhbmRsZSA9ICchJztcbiAgfVxuXG4gIF9wb3NpdGlvbiA9IHN0YXRlLnBvc2l0aW9uO1xuXG4gIGlmIChpc1ZlcmJhdGltKSB7XG4gICAgZG8geyBjaCA9IHN0YXRlLmlucHV0LmNoYXJDb2RlQXQoKytzdGF0ZS5wb3NpdGlvbik7IH1cbiAgICB3aGlsZSAoY2ggIT09IDAgJiYgY2ggIT09IDB4M0UvKiA+ICovKTtcblxuICAgIGlmIChzdGF0ZS5wb3NpdGlvbiA8IHN0YXRlLmxlbmd0aCkge1xuICAgICAgdGFnTmFtZSA9IHN0YXRlLmlucHV0LnNsaWNlKF9wb3NpdGlvbiwgc3RhdGUucG9zaXRpb24pO1xuICAgICAgY2ggPSBzdGF0ZS5pbnB1dC5jaGFyQ29kZUF0KCsrc3RhdGUucG9zaXRpb24pO1xuICAgIH0gZWxzZSB7XG4gICAgICB0aHJvd0Vycm9yKHN0YXRlLCAndW5leHBlY3RlZCBlbmQgb2YgdGhlIHN0cmVhbSB3aXRoaW4gYSB2ZXJiYXRpbSB0YWcnKTtcbiAgICB9XG4gIH0gZWxzZSB7XG4gICAgd2hpbGUgKGNoICE9PSAwICYmICFpc19XU19PUl9FT0woY2gpKSB7XG5cbiAgICAgIGlmIChjaCA9PT0gMHgyMS8qICEgKi8pIHtcbiAgICAgICAgaWYgKCFpc05hbWVkKSB7XG4gICAgICAgICAgdGFnSGFuZGxlID0gc3RhdGUuaW5wdXQuc2xpY2UoX3Bvc2l0aW9uIC0gMSwgc3RhdGUucG9zaXRpb24gKyAxKTtcblxuICAgICAgICAgIGlmICghUEFUVEVSTl9UQUdfSEFORExFLnRlc3QodGFnSGFuZGxlKSkge1xuICAgICAgICAgICAgdGhyb3dFcnJvcihzdGF0ZSwgJ25hbWVkIHRhZyBoYW5kbGUgY2Fubm90IGNvbnRhaW4gc3VjaCBjaGFyYWN0ZXJzJyk7XG4gICAgICAgICAgfVxuXG4gICAgICAgICAgaXNOYW1lZCA9IHRydWU7XG4gICAgICAgICAgX3Bvc2l0aW9uID0gc3RhdGUucG9zaXRpb24gKyAxO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIHRocm93RXJyb3Ioc3RhdGUsICd0YWcgc3VmZml4IGNhbm5vdCBjb250YWluIGV4Y2xhbWF0aW9uIG1hcmtzJyk7XG4gICAgICAgIH1cbiAgICAgIH1cblxuICAgICAgY2ggPSBzdGF0ZS5pbnB1dC5jaGFyQ29kZUF0KCsrc3RhdGUucG9zaXRpb24pO1xuICAgIH1cblxuICAgIHRhZ05hbWUgPSBzdGF0ZS5pbnB1dC5zbGljZShfcG9zaXRpb24sIHN0YXRlLnBvc2l0aW9uKTtcblxuICAgIGlmIChQQVRURVJOX0ZMT1dfSU5ESUNBVE9SUy50ZXN0KHRhZ05hbWUpKSB7XG4gICAgICB0aHJvd0Vycm9yKHN0YXRlLCAndGFnIHN1ZmZpeCBjYW5ub3QgY29udGFpbiBmbG93IGluZGljYXRvciBjaGFyYWN0ZXJzJyk7XG4gICAgfVxuICB9XG5cbiAgaWYgKHRhZ05hbWUgJiYgIVBBVFRFUk5fVEFHX1VSSS50ZXN0KHRhZ05hbWUpKSB7XG4gICAgdGhyb3dFcnJvcihzdGF0ZSwgJ3RhZyBuYW1lIGNhbm5vdCBjb250YWluIHN1Y2ggY2hhcmFjdGVyczogJyArIHRhZ05hbWUpO1xuICB9XG5cbiAgaWYgKGlzVmVyYmF0aW0pIHtcbiAgICBzdGF0ZS50YWcgPSB0YWdOYW1lO1xuXG4gIH0gZWxzZSBpZiAoX2hhc093blByb3BlcnR5LmNhbGwoc3RhdGUudGFnTWFwLCB0YWdIYW5kbGUpKSB7XG4gICAgc3RhdGUudGFnID0gc3RhdGUudGFnTWFwW3RhZ0hhbmRsZV0gKyB0YWdOYW1lO1xuXG4gIH0gZWxzZSBpZiAodGFnSGFuZGxlID09PSAnIScpIHtcbiAgICBzdGF0ZS50YWcgPSAnIScgKyB0YWdOYW1lO1xuXG4gIH0gZWxzZSBpZiAodGFnSGFuZGxlID09PSAnISEnKSB7XG4gICAgc3RhdGUudGFnID0gJ3RhZzp5YW1sLm9yZywyMDAyOicgKyB0YWdOYW1lO1xuXG4gIH0gZWxzZSB7XG4gICAgdGhyb3dFcnJvcihzdGF0ZSwgJ3VuZGVjbGFyZWQgdGFnIGhhbmRsZSBcIicgKyB0YWdIYW5kbGUgKyAnXCInKTtcbiAgfVxuXG4gIHJldHVybiB0cnVlO1xufVxuXG5mdW5jdGlvbiByZWFkQW5jaG9yUHJvcGVydHkoc3RhdGUpIHtcbiAgdmFyIF9wb3NpdGlvbixcbiAgICAgIGNoO1xuXG4gIGNoID0gc3RhdGUuaW5wdXQuY2hhckNvZGVBdChzdGF0ZS5wb3NpdGlvbik7XG5cbiAgaWYgKGNoICE9PSAweDI2LyogJiAqLykgcmV0dXJuIGZhbHNlO1xuXG4gIGlmIChzdGF0ZS5hbmNob3IgIT09IG51bGwpIHtcbiAgICB0aHJvd0Vycm9yKHN0YXRlLCAnZHVwbGljYXRpb24gb2YgYW4gYW5jaG9yIHByb3BlcnR5Jyk7XG4gIH1cblxuICBjaCA9IHN0YXRlLmlucHV0LmNoYXJDb2RlQXQoKytzdGF0ZS5wb3NpdGlvbik7XG4gIF9wb3NpdGlvbiA9IHN0YXRlLnBvc2l0aW9uO1xuXG4gIHdoaWxlIChjaCAhPT0gMCAmJiAhaXNfV1NfT1JfRU9MKGNoKSAmJiAhaXNfRkxPV19JTkRJQ0FUT1IoY2gpKSB7XG4gICAgY2ggPSBzdGF0ZS5pbnB1dC5jaGFyQ29kZUF0KCsrc3RhdGUucG9zaXRpb24pO1xuICB9XG5cbiAgaWYgKHN0YXRlLnBvc2l0aW9uID09PSBfcG9zaXRpb24pIHtcbiAgICB0aHJvd0Vycm9yKHN0YXRlLCAnbmFtZSBvZiBhbiBhbmNob3Igbm9kZSBtdXN0IGNvbnRhaW4gYXQgbGVhc3Qgb25lIGNoYXJhY3RlcicpO1xuICB9XG5cbiAgc3RhdGUuYW5jaG9yID0gc3RhdGUuaW5wdXQuc2xpY2UoX3Bvc2l0aW9uLCBzdGF0ZS5wb3NpdGlvbik7XG4gIHJldHVybiB0cnVlO1xufVxuXG5mdW5jdGlvbiByZWFkQWxpYXMoc3RhdGUpIHtcbiAgdmFyIF9wb3NpdGlvbiwgYWxpYXMsXG4gICAgICBjaDtcblxuICBjaCA9IHN0YXRlLmlucHV0LmNoYXJDb2RlQXQoc3RhdGUucG9zaXRpb24pO1xuXG4gIGlmIChjaCAhPT0gMHgyQS8qICogKi8pIHJldHVybiBmYWxzZTtcblxuICBjaCA9IHN0YXRlLmlucHV0LmNoYXJDb2RlQXQoKytzdGF0ZS5wb3NpdGlvbik7XG4gIF9wb3NpdGlvbiA9IHN0YXRlLnBvc2l0aW9uO1xuXG4gIHdoaWxlIChjaCAhPT0gMCAmJiAhaXNfV1NfT1JfRU9MKGNoKSAmJiAhaXNfRkxPV19JTkRJQ0FUT1IoY2gpKSB7XG4gICAgY2ggPSBzdGF0ZS5pbnB1dC5jaGFyQ29kZUF0KCsrc3RhdGUucG9zaXRpb24pO1xuICB9XG5cbiAgaWYgKHN0YXRlLnBvc2l0aW9uID09PSBfcG9zaXRpb24pIHtcbiAgICB0aHJvd0Vycm9yKHN0YXRlLCAnbmFtZSBvZiBhbiBhbGlhcyBub2RlIG11c3QgY29udGFpbiBhdCBsZWFzdCBvbmUgY2hhcmFjdGVyJyk7XG4gIH1cblxuICBhbGlhcyA9IHN0YXRlLmlucHV0LnNsaWNlKF9wb3NpdGlvbiwgc3RhdGUucG9zaXRpb24pO1xuXG4gIGlmICghc3RhdGUuYW5jaG9yTWFwLmhhc093blByb3BlcnR5KGFsaWFzKSkge1xuICAgIHRocm93RXJyb3Ioc3RhdGUsICd1bmlkZW50aWZpZWQgYWxpYXMgXCInICsgYWxpYXMgKyAnXCInKTtcbiAgfVxuXG4gIHN0YXRlLnJlc3VsdCA9IHN0YXRlLmFuY2hvck1hcFthbGlhc107XG4gIHNraXBTZXBhcmF0aW9uU3BhY2Uoc3RhdGUsIHRydWUsIC0xKTtcbiAgcmV0dXJuIHRydWU7XG59XG5cbmZ1bmN0aW9uIGNvbXBvc2VOb2RlKHN0YXRlLCBwYXJlbnRJbmRlbnQsIG5vZGVDb250ZXh0LCBhbGxvd1RvU2VlaywgYWxsb3dDb21wYWN0KSB7XG4gIHZhciBhbGxvd0Jsb2NrU3R5bGVzLFxuICAgICAgYWxsb3dCbG9ja1NjYWxhcnMsXG4gICAgICBhbGxvd0Jsb2NrQ29sbGVjdGlvbnMsXG4gICAgICBpbmRlbnRTdGF0dXMgPSAxLCAvLyAxOiB0aGlzPnBhcmVudCwgMDogdGhpcz1wYXJlbnQsIC0xOiB0aGlzPHBhcmVudFxuICAgICAgYXROZXdMaW5lICA9IGZhbHNlLFxuICAgICAgaGFzQ29udGVudCA9IGZhbHNlLFxuICAgICAgdHlwZUluZGV4LFxuICAgICAgdHlwZVF1YW50aXR5LFxuICAgICAgdHlwZSxcbiAgICAgIGZsb3dJbmRlbnQsXG4gICAgICBibG9ja0luZGVudDtcblxuICBpZiAoc3RhdGUubGlzdGVuZXIgIT09IG51bGwpIHtcbiAgICBzdGF0ZS5saXN0ZW5lcignb3BlbicsIHN0YXRlKTtcbiAgfVxuXG4gIHN0YXRlLnRhZyAgICA9IG51bGw7XG4gIHN0YXRlLmFuY2hvciA9IG51bGw7XG4gIHN0YXRlLmtpbmQgICA9IG51bGw7XG4gIHN0YXRlLnJlc3VsdCA9IG51bGw7XG5cbiAgYWxsb3dCbG9ja1N0eWxlcyA9IGFsbG93QmxvY2tTY2FsYXJzID0gYWxsb3dCbG9ja0NvbGxlY3Rpb25zID1cbiAgICBDT05URVhUX0JMT0NLX09VVCA9PT0gbm9kZUNvbnRleHQgfHxcbiAgICBDT05URVhUX0JMT0NLX0lOICA9PT0gbm9kZUNvbnRleHQ7XG5cbiAgaWYgKGFsbG93VG9TZWVrKSB7XG4gICAgaWYgKHNraXBTZXBhcmF0aW9uU3BhY2Uoc3RhdGUsIHRydWUsIC0xKSkge1xuICAgICAgYXROZXdMaW5lID0gdHJ1ZTtcblxuICAgICAgaWYgKHN0YXRlLmxpbmVJbmRlbnQgPiBwYXJlbnRJbmRlbnQpIHtcbiAgICAgICAgaW5kZW50U3RhdHVzID0gMTtcbiAgICAgIH0gZWxzZSBpZiAoc3RhdGUubGluZUluZGVudCA9PT0gcGFyZW50SW5kZW50KSB7XG4gICAgICAgIGluZGVudFN0YXR1cyA9IDA7XG4gICAgICB9IGVsc2UgaWYgKHN0YXRlLmxpbmVJbmRlbnQgPCBwYXJlbnRJbmRlbnQpIHtcbiAgICAgICAgaW5kZW50U3RhdHVzID0gLTE7XG4gICAgICB9XG4gICAgfVxuICB9XG5cbiAgaWYgKGluZGVudFN0YXR1cyA9PT0gMSkge1xuICAgIHdoaWxlIChyZWFkVGFnUHJvcGVydHkoc3RhdGUpIHx8IHJlYWRBbmNob3JQcm9wZXJ0eShzdGF0ZSkpIHtcbiAgICAgIGlmIChza2lwU2VwYXJhdGlvblNwYWNlKHN0YXRlLCB0cnVlLCAtMSkpIHtcbiAgICAgICAgYXROZXdMaW5lID0gdHJ1ZTtcbiAgICAgICAgYWxsb3dCbG9ja0NvbGxlY3Rpb25zID0gYWxsb3dCbG9ja1N0eWxlcztcblxuICAgICAgICBpZiAoc3RhdGUubGluZUluZGVudCA+IHBhcmVudEluZGVudCkge1xuICAgICAgICAgIGluZGVudFN0YXR1cyA9IDE7XG4gICAgICAgIH0gZWxzZSBpZiAoc3RhdGUubGluZUluZGVudCA9PT0gcGFyZW50SW5kZW50KSB7XG4gICAgICAgICAgaW5kZW50U3RhdHVzID0gMDtcbiAgICAgICAgfSBlbHNlIGlmIChzdGF0ZS5saW5lSW5kZW50IDwgcGFyZW50SW5kZW50KSB7XG4gICAgICAgICAgaW5kZW50U3RhdHVzID0gLTE7XG4gICAgICAgIH1cbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIGFsbG93QmxvY2tDb2xsZWN0aW9ucyA9IGZhbHNlO1xuICAgICAgfVxuICAgIH1cbiAgfVxuXG4gIGlmIChhbGxvd0Jsb2NrQ29sbGVjdGlvbnMpIHtcbiAgICBhbGxvd0Jsb2NrQ29sbGVjdGlvbnMgPSBhdE5ld0xpbmUgfHwgYWxsb3dDb21wYWN0O1xuICB9XG5cbiAgaWYgKGluZGVudFN0YXR1cyA9PT0gMSB8fCBDT05URVhUX0JMT0NLX09VVCA9PT0gbm9kZUNvbnRleHQpIHtcbiAgICBpZiAoQ09OVEVYVF9GTE9XX0lOID09PSBub2RlQ29udGV4dCB8fCBDT05URVhUX0ZMT1dfT1VUID09PSBub2RlQ29udGV4dCkge1xuICAgICAgZmxvd0luZGVudCA9IHBhcmVudEluZGVudDtcbiAgICB9IGVsc2Uge1xuICAgICAgZmxvd0luZGVudCA9IHBhcmVudEluZGVudCArIDE7XG4gICAgfVxuXG4gICAgYmxvY2tJbmRlbnQgPSBzdGF0ZS5wb3NpdGlvbiAtIHN0YXRlLmxpbmVTdGFydDtcblxuICAgIGlmIChpbmRlbnRTdGF0dXMgPT09IDEpIHtcbiAgICAgIGlmIChhbGxvd0Jsb2NrQ29sbGVjdGlvbnMgJiZcbiAgICAgICAgICAocmVhZEJsb2NrU2VxdWVuY2Uoc3RhdGUsIGJsb2NrSW5kZW50KSB8fFxuICAgICAgICAgICByZWFkQmxvY2tNYXBwaW5nKHN0YXRlLCBibG9ja0luZGVudCwgZmxvd0luZGVudCkpIHx8XG4gICAgICAgICAgcmVhZEZsb3dDb2xsZWN0aW9uKHN0YXRlLCBmbG93SW5kZW50KSkge1xuICAgICAgICBoYXNDb250ZW50ID0gdHJ1ZTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIGlmICgoYWxsb3dCbG9ja1NjYWxhcnMgJiYgcmVhZEJsb2NrU2NhbGFyKHN0YXRlLCBmbG93SW5kZW50KSkgfHxcbiAgICAgICAgICAgIHJlYWRTaW5nbGVRdW90ZWRTY2FsYXIoc3RhdGUsIGZsb3dJbmRlbnQpIHx8XG4gICAgICAgICAgICByZWFkRG91YmxlUXVvdGVkU2NhbGFyKHN0YXRlLCBmbG93SW5kZW50KSkge1xuICAgICAgICAgIGhhc0NvbnRlbnQgPSB0cnVlO1xuXG4gICAgICAgIH0gZWxzZSBpZiAocmVhZEFsaWFzKHN0YXRlKSkge1xuICAgICAgICAgIGhhc0NvbnRlbnQgPSB0cnVlO1xuXG4gICAgICAgICAgaWYgKHN0YXRlLnRhZyAhPT0gbnVsbCB8fCBzdGF0ZS5hbmNob3IgIT09IG51bGwpIHtcbiAgICAgICAgICAgIHRocm93RXJyb3Ioc3RhdGUsICdhbGlhcyBub2RlIHNob3VsZCBub3QgaGF2ZSBhbnkgcHJvcGVydGllcycpO1xuICAgICAgICAgIH1cblxuICAgICAgICB9IGVsc2UgaWYgKHJlYWRQbGFpblNjYWxhcihzdGF0ZSwgZmxvd0luZGVudCwgQ09OVEVYVF9GTE9XX0lOID09PSBub2RlQ29udGV4dCkpIHtcbiAgICAgICAgICBoYXNDb250ZW50ID0gdHJ1ZTtcblxuICAgICAgICAgIGlmIChzdGF0ZS50YWcgPT09IG51bGwpIHtcbiAgICAgICAgICAgIHN0YXRlLnRhZyA9ICc/JztcbiAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgICAgICBpZiAoc3RhdGUuYW5jaG9yICE9PSBudWxsKSB7XG4gICAgICAgICAgc3RhdGUuYW5jaG9yTWFwW3N0YXRlLmFuY2hvcl0gPSBzdGF0ZS5yZXN1bHQ7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9IGVsc2UgaWYgKGluZGVudFN0YXR1cyA9PT0gMCkge1xuICAgICAgLy8gU3BlY2lhbCBjYXNlOiBibG9jayBzZXF1ZW5jZXMgYXJlIGFsbG93ZWQgdG8gaGF2ZSBzYW1lIGluZGVudGF0aW9uIGxldmVsIGFzIHRoZSBwYXJlbnQuXG4gICAgICAvLyBodHRwOi8vd3d3LnlhbWwub3JnL3NwZWMvMS4yL3NwZWMuaHRtbCNpZDI3OTk3ODRcbiAgICAgIGhhc0NvbnRlbnQgPSBhbGxvd0Jsb2NrQ29sbGVjdGlvbnMgJiYgcmVhZEJsb2NrU2VxdWVuY2Uoc3RhdGUsIGJsb2NrSW5kZW50KTtcbiAgICB9XG4gIH1cblxuICBpZiAoc3RhdGUudGFnICE9PSBudWxsICYmIHN0YXRlLnRhZyAhPT0gJyEnKSB7XG4gICAgaWYgKHN0YXRlLnRhZyA9PT0gJz8nKSB7XG4gICAgICAvLyBJbXBsaWNpdCByZXNvbHZpbmcgaXMgbm90IGFsbG93ZWQgZm9yIG5vbi1zY2FsYXIgdHlwZXMsIGFuZCAnPydcbiAgICAgIC8vIG5vbi1zcGVjaWZpYyB0YWcgaXMgb25seSBhdXRvbWF0aWNhbGx5IGFzc2lnbmVkIHRvIHBsYWluIHNjYWxhcnMuXG4gICAgICAvL1xuICAgICAgLy8gV2Ugb25seSBuZWVkIHRvIGNoZWNrIGtpbmQgY29uZm9ybWl0eSBpbiBjYXNlIHVzZXIgZXhwbGljaXRseSBhc3NpZ25zICc/J1xuICAgICAgLy8gdGFnLCBmb3IgZXhhbXBsZSBsaWtlIHRoaXM6IFwiITw/PiBbMF1cIlxuICAgICAgLy9cbiAgICAgIGlmIChzdGF0ZS5yZXN1bHQgIT09IG51bGwgJiYgc3RhdGUua2luZCAhPT0gJ3NjYWxhcicpIHtcbiAgICAgICAgdGhyb3dFcnJvcihzdGF0ZSwgJ3VuYWNjZXB0YWJsZSBub2RlIGtpbmQgZm9yICE8Pz4gdGFnOyBpdCBzaG91bGQgYmUgXCJzY2FsYXJcIiwgbm90IFwiJyArIHN0YXRlLmtpbmQgKyAnXCInKTtcbiAgICAgIH1cblxuICAgICAgZm9yICh0eXBlSW5kZXggPSAwLCB0eXBlUXVhbnRpdHkgPSBzdGF0ZS5pbXBsaWNpdFR5cGVzLmxlbmd0aDsgdHlwZUluZGV4IDwgdHlwZVF1YW50aXR5OyB0eXBlSW5kZXggKz0gMSkge1xuICAgICAgICB0eXBlID0gc3RhdGUuaW1wbGljaXRUeXBlc1t0eXBlSW5kZXhdO1xuXG4gICAgICAgIGlmICh0eXBlLnJlc29sdmUoc3RhdGUucmVzdWx0KSkgeyAvLyBgc3RhdGUucmVzdWx0YCB1cGRhdGVkIGluIHJlc29sdmVyIGlmIG1hdGNoZWRcbiAgICAgICAgICBzdGF0ZS5yZXN1bHQgPSB0eXBlLmNvbnN0cnVjdChzdGF0ZS5yZXN1bHQpO1xuICAgICAgICAgIHN0YXRlLnRhZyA9IHR5cGUudGFnO1xuICAgICAgICAgIGlmIChzdGF0ZS5hbmNob3IgIT09IG51bGwpIHtcbiAgICAgICAgICAgIHN0YXRlLmFuY2hvck1hcFtzdGF0ZS5hbmNob3JdID0gc3RhdGUucmVzdWx0O1xuICAgICAgICAgIH1cbiAgICAgICAgICBicmVhaztcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH0gZWxzZSBpZiAoX2hhc093blByb3BlcnR5LmNhbGwoc3RhdGUudHlwZU1hcFtzdGF0ZS5raW5kIHx8ICdmYWxsYmFjayddLCBzdGF0ZS50YWcpKSB7XG4gICAgICB0eXBlID0gc3RhdGUudHlwZU1hcFtzdGF0ZS5raW5kIHx8ICdmYWxsYmFjayddW3N0YXRlLnRhZ107XG5cbiAgICAgIGlmIChzdGF0ZS5yZXN1bHQgIT09IG51bGwgJiYgdHlwZS5raW5kICE9PSBzdGF0ZS5raW5kKSB7XG4gICAgICAgIHRocm93RXJyb3Ioc3RhdGUsICd1bmFjY2VwdGFibGUgbm9kZSBraW5kIGZvciAhPCcgKyBzdGF0ZS50YWcgKyAnPiB0YWc7IGl0IHNob3VsZCBiZSBcIicgKyB0eXBlLmtpbmQgKyAnXCIsIG5vdCBcIicgKyBzdGF0ZS5raW5kICsgJ1wiJyk7XG4gICAgICB9XG5cbiAgICAgIGlmICghdHlwZS5yZXNvbHZlKHN0YXRlLnJlc3VsdCkpIHsgLy8gYHN0YXRlLnJlc3VsdGAgdXBkYXRlZCBpbiByZXNvbHZlciBpZiBtYXRjaGVkXG4gICAgICAgIHRocm93RXJyb3Ioc3RhdGUsICdjYW5ub3QgcmVzb2x2ZSBhIG5vZGUgd2l0aCAhPCcgKyBzdGF0ZS50YWcgKyAnPiBleHBsaWNpdCB0YWcnKTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHN0YXRlLnJlc3VsdCA9IHR5cGUuY29uc3RydWN0KHN0YXRlLnJlc3VsdCk7XG4gICAgICAgIGlmIChzdGF0ZS5hbmNob3IgIT09IG51bGwpIHtcbiAgICAgICAgICBzdGF0ZS5hbmNob3JNYXBbc3RhdGUuYW5jaG9yXSA9IHN0YXRlLnJlc3VsdDtcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH0gZWxzZSB7XG4gICAgICB0aHJvd0Vycm9yKHN0YXRlLCAndW5rbm93biB0YWcgITwnICsgc3RhdGUudGFnICsgJz4nKTtcbiAgICB9XG4gIH1cblxuICBpZiAoc3RhdGUubGlzdGVuZXIgIT09IG51bGwpIHtcbiAgICBzdGF0ZS5saXN0ZW5lcignY2xvc2UnLCBzdGF0ZSk7XG4gIH1cbiAgcmV0dXJuIHN0YXRlLnRhZyAhPT0gbnVsbCB8fCAgc3RhdGUuYW5jaG9yICE9PSBudWxsIHx8IGhhc0NvbnRlbnQ7XG59XG5cbmZ1bmN0aW9uIHJlYWREb2N1bWVudChzdGF0ZSkge1xuICB2YXIgZG9jdW1lbnRTdGFydCA9IHN0YXRlLnBvc2l0aW9uLFxuICAgICAgX3Bvc2l0aW9uLFxuICAgICAgZGlyZWN0aXZlTmFtZSxcbiAgICAgIGRpcmVjdGl2ZUFyZ3MsXG4gICAgICBoYXNEaXJlY3RpdmVzID0gZmFsc2UsXG4gICAgICBjaDtcblxuICBzdGF0ZS52ZXJzaW9uID0gbnVsbDtcbiAgc3RhdGUuY2hlY2tMaW5lQnJlYWtzID0gc3RhdGUubGVnYWN5O1xuICBzdGF0ZS50YWdNYXAgPSB7fTtcbiAgc3RhdGUuYW5jaG9yTWFwID0ge307XG5cbiAgd2hpbGUgKChjaCA9IHN0YXRlLmlucHV0LmNoYXJDb2RlQXQoc3RhdGUucG9zaXRpb24pKSAhPT0gMCkge1xuICAgIHNraXBTZXBhcmF0aW9uU3BhY2Uoc3RhdGUsIHRydWUsIC0xKTtcblxuICAgIGNoID0gc3RhdGUuaW5wdXQuY2hhckNvZGVBdChzdGF0ZS5wb3NpdGlvbik7XG5cbiAgICBpZiAoc3RhdGUubGluZUluZGVudCA+IDAgfHwgY2ggIT09IDB4MjUvKiAlICovKSB7XG4gICAgICBicmVhaztcbiAgICB9XG5cbiAgICBoYXNEaXJlY3RpdmVzID0gdHJ1ZTtcbiAgICBjaCA9IHN0YXRlLmlucHV0LmNoYXJDb2RlQXQoKytzdGF0ZS5wb3NpdGlvbik7XG4gICAgX3Bvc2l0aW9uID0gc3RhdGUucG9zaXRpb247XG5cbiAgICB3aGlsZSAoY2ggIT09IDAgJiYgIWlzX1dTX09SX0VPTChjaCkpIHtcbiAgICAgIGNoID0gc3RhdGUuaW5wdXQuY2hhckNvZGVBdCgrK3N0YXRlLnBvc2l0aW9uKTtcbiAgICB9XG5cbiAgICBkaXJlY3RpdmVOYW1lID0gc3RhdGUuaW5wdXQuc2xpY2UoX3Bvc2l0aW9uLCBzdGF0ZS5wb3NpdGlvbik7XG4gICAgZGlyZWN0aXZlQXJncyA9IFtdO1xuXG4gICAgaWYgKGRpcmVjdGl2ZU5hbWUubGVuZ3RoIDwgMSkge1xuICAgICAgdGhyb3dFcnJvcihzdGF0ZSwgJ2RpcmVjdGl2ZSBuYW1lIG11c3Qgbm90IGJlIGxlc3MgdGhhbiBvbmUgY2hhcmFjdGVyIGluIGxlbmd0aCcpO1xuICAgIH1cblxuICAgIHdoaWxlIChjaCAhPT0gMCkge1xuICAgICAgd2hpbGUgKGlzX1dISVRFX1NQQUNFKGNoKSkge1xuICAgICAgICBjaCA9IHN0YXRlLmlucHV0LmNoYXJDb2RlQXQoKytzdGF0ZS5wb3NpdGlvbik7XG4gICAgICB9XG5cbiAgICAgIGlmIChjaCA9PT0gMHgyMy8qICMgKi8pIHtcbiAgICAgICAgZG8geyBjaCA9IHN0YXRlLmlucHV0LmNoYXJDb2RlQXQoKytzdGF0ZS5wb3NpdGlvbik7IH1cbiAgICAgICAgd2hpbGUgKGNoICE9PSAwICYmICFpc19FT0woY2gpKTtcbiAgICAgICAgYnJlYWs7XG4gICAgICB9XG5cbiAgICAgIGlmIChpc19FT0woY2gpKSBicmVhaztcblxuICAgICAgX3Bvc2l0aW9uID0gc3RhdGUucG9zaXRpb247XG5cbiAgICAgIHdoaWxlIChjaCAhPT0gMCAmJiAhaXNfV1NfT1JfRU9MKGNoKSkge1xuICAgICAgICBjaCA9IHN0YXRlLmlucHV0LmNoYXJDb2RlQXQoKytzdGF0ZS5wb3NpdGlvbik7XG4gICAgICB9XG5cbiAgICAgIGRpcmVjdGl2ZUFyZ3MucHVzaChzdGF0ZS5pbnB1dC5zbGljZShfcG9zaXRpb24sIHN0YXRlLnBvc2l0aW9uKSk7XG4gICAgfVxuXG4gICAgaWYgKGNoICE9PSAwKSByZWFkTGluZUJyZWFrKHN0YXRlKTtcblxuICAgIGlmIChfaGFzT3duUHJvcGVydHkuY2FsbChkaXJlY3RpdmVIYW5kbGVycywgZGlyZWN0aXZlTmFtZSkpIHtcbiAgICAgIGRpcmVjdGl2ZUhhbmRsZXJzW2RpcmVjdGl2ZU5hbWVdKHN0YXRlLCBkaXJlY3RpdmVOYW1lLCBkaXJlY3RpdmVBcmdzKTtcbiAgICB9IGVsc2Uge1xuICAgICAgdGhyb3dXYXJuaW5nKHN0YXRlLCAndW5rbm93biBkb2N1bWVudCBkaXJlY3RpdmUgXCInICsgZGlyZWN0aXZlTmFtZSArICdcIicpO1xuICAgIH1cbiAgfVxuXG4gIHNraXBTZXBhcmF0aW9uU3BhY2Uoc3RhdGUsIHRydWUsIC0xKTtcblxuICBpZiAoc3RhdGUubGluZUluZGVudCA9PT0gMCAmJlxuICAgICAgc3RhdGUuaW5wdXQuY2hhckNvZGVBdChzdGF0ZS5wb3NpdGlvbikgICAgID09PSAweDJELyogLSAqLyAmJlxuICAgICAgc3RhdGUuaW5wdXQuY2hhckNvZGVBdChzdGF0ZS5wb3NpdGlvbiArIDEpID09PSAweDJELyogLSAqLyAmJlxuICAgICAgc3RhdGUuaW5wdXQuY2hhckNvZGVBdChzdGF0ZS5wb3NpdGlvbiArIDIpID09PSAweDJELyogLSAqLykge1xuICAgIHN0YXRlLnBvc2l0aW9uICs9IDM7XG4gICAgc2tpcFNlcGFyYXRpb25TcGFjZShzdGF0ZSwgdHJ1ZSwgLTEpO1xuXG4gIH0gZWxzZSBpZiAoaGFzRGlyZWN0aXZlcykge1xuICAgIHRocm93RXJyb3Ioc3RhdGUsICdkaXJlY3RpdmVzIGVuZCBtYXJrIGlzIGV4cGVjdGVkJyk7XG4gIH1cblxuICBjb21wb3NlTm9kZShzdGF0ZSwgc3RhdGUubGluZUluZGVudCAtIDEsIENPTlRFWFRfQkxPQ0tfT1VULCBmYWxzZSwgdHJ1ZSk7XG4gIHNraXBTZXBhcmF0aW9uU3BhY2Uoc3RhdGUsIHRydWUsIC0xKTtcblxuICBpZiAoc3RhdGUuY2hlY2tMaW5lQnJlYWtzICYmXG4gICAgICBQQVRURVJOX05PTl9BU0NJSV9MSU5FX0JSRUFLUy50ZXN0KHN0YXRlLmlucHV0LnNsaWNlKGRvY3VtZW50U3RhcnQsIHN0YXRlLnBvc2l0aW9uKSkpIHtcbiAgICB0aHJvd1dhcm5pbmcoc3RhdGUsICdub24tQVNDSUkgbGluZSBicmVha3MgYXJlIGludGVycHJldGVkIGFzIGNvbnRlbnQnKTtcbiAgfVxuXG4gIHN0YXRlLmRvY3VtZW50cy5wdXNoKHN0YXRlLnJlc3VsdCk7XG5cbiAgaWYgKHN0YXRlLnBvc2l0aW9uID09PSBzdGF0ZS5saW5lU3RhcnQgJiYgdGVzdERvY3VtZW50U2VwYXJhdG9yKHN0YXRlKSkge1xuXG4gICAgaWYgKHN0YXRlLmlucHV0LmNoYXJDb2RlQXQoc3RhdGUucG9zaXRpb24pID09PSAweDJFLyogLiAqLykge1xuICAgICAgc3RhdGUucG9zaXRpb24gKz0gMztcbiAgICAgIHNraXBTZXBhcmF0aW9uU3BhY2Uoc3RhdGUsIHRydWUsIC0xKTtcbiAgICB9XG4gICAgcmV0dXJuO1xuICB9XG5cbiAgaWYgKHN0YXRlLnBvc2l0aW9uIDwgKHN0YXRlLmxlbmd0aCAtIDEpKSB7XG4gICAgdGhyb3dFcnJvcihzdGF0ZSwgJ2VuZCBvZiB0aGUgc3RyZWFtIG9yIGEgZG9jdW1lbnQgc2VwYXJhdG9yIGlzIGV4cGVjdGVkJyk7XG4gIH0gZWxzZSB7XG4gICAgcmV0dXJuO1xuICB9XG59XG5cblxuZnVuY3Rpb24gbG9hZERvY3VtZW50cyhpbnB1dCwgb3B0aW9ucykge1xuICBpbnB1dCA9IFN0cmluZyhpbnB1dCk7XG4gIG9wdGlvbnMgPSBvcHRpb25zIHx8IHt9O1xuXG4gIGlmIChpbnB1dC5sZW5ndGggIT09IDApIHtcblxuICAgIC8vIEFkZCB0YWlsaW5nIGBcXG5gIGlmIG5vdCBleGlzdHNcbiAgICBpZiAoaW5wdXQuY2hhckNvZGVBdChpbnB1dC5sZW5ndGggLSAxKSAhPT0gMHgwQS8qIExGICovICYmXG4gICAgICAgIGlucHV0LmNoYXJDb2RlQXQoaW5wdXQubGVuZ3RoIC0gMSkgIT09IDB4MEQvKiBDUiAqLykge1xuICAgICAgaW5wdXQgKz0gJ1xcbic7XG4gICAgfVxuXG4gICAgLy8gU3RyaXAgQk9NXG4gICAgaWYgKGlucHV0LmNoYXJDb2RlQXQoMCkgPT09IDB4RkVGRikge1xuICAgICAgaW5wdXQgPSBpbnB1dC5zbGljZSgxKTtcbiAgICB9XG4gIH1cblxuICB2YXIgc3RhdGUgPSBuZXcgU3RhdGUoaW5wdXQsIG9wdGlvbnMpO1xuXG4gIHZhciBudWxscG9zID0gaW5wdXQuaW5kZXhPZignXFwwJyk7XG5cbiAgaWYgKG51bGxwb3MgIT09IC0xKSB7XG4gICAgc3RhdGUucG9zaXRpb24gPSBudWxscG9zO1xuICAgIHRocm93RXJyb3Ioc3RhdGUsICdudWxsIGJ5dGUgaXMgbm90IGFsbG93ZWQgaW4gaW5wdXQnKTtcbiAgfVxuXG4gIC8vIFVzZSAwIGFzIHN0cmluZyB0ZXJtaW5hdG9yLiBUaGF0IHNpZ25pZmljYW50bHkgc2ltcGxpZmllcyBib3VuZHMgY2hlY2suXG4gIHN0YXRlLmlucHV0ICs9ICdcXDAnO1xuXG4gIHdoaWxlIChzdGF0ZS5pbnB1dC5jaGFyQ29kZUF0KHN0YXRlLnBvc2l0aW9uKSA9PT0gMHgyMC8qIFNwYWNlICovKSB7XG4gICAgc3RhdGUubGluZUluZGVudCArPSAxO1xuICAgIHN0YXRlLnBvc2l0aW9uICs9IDE7XG4gIH1cblxuICB3aGlsZSAoc3RhdGUucG9zaXRpb24gPCAoc3RhdGUubGVuZ3RoIC0gMSkpIHtcbiAgICByZWFkRG9jdW1lbnQoc3RhdGUpO1xuICB9XG5cbiAgcmV0dXJuIHN0YXRlLmRvY3VtZW50cztcbn1cblxuXG5mdW5jdGlvbiBsb2FkQWxsKGlucHV0LCBpdGVyYXRvciwgb3B0aW9ucykge1xuICBpZiAoaXRlcmF0b3IgIT09IG51bGwgJiYgdHlwZW9mIGl0ZXJhdG9yID09PSAnb2JqZWN0JyAmJiB0eXBlb2Ygb3B0aW9ucyA9PT0gJ3VuZGVmaW5lZCcpIHtcbiAgICBvcHRpb25zID0gaXRlcmF0b3I7XG4gICAgaXRlcmF0b3IgPSBudWxsO1xuICB9XG5cbiAgdmFyIGRvY3VtZW50cyA9IGxvYWREb2N1bWVudHMoaW5wdXQsIG9wdGlvbnMpO1xuXG4gIGlmICh0eXBlb2YgaXRlcmF0b3IgIT09ICdmdW5jdGlvbicpIHtcbiAgICByZXR1cm4gZG9jdW1lbnRzO1xuICB9XG5cbiAgZm9yICh2YXIgaW5kZXggPSAwLCBsZW5ndGggPSBkb2N1bWVudHMubGVuZ3RoOyBpbmRleCA8IGxlbmd0aDsgaW5kZXggKz0gMSkge1xuICAgIGl0ZXJhdG9yKGRvY3VtZW50c1tpbmRleF0pO1xuICB9XG59XG5cblxuZnVuY3Rpb24gbG9hZChpbnB1dCwgb3B0aW9ucykge1xuICB2YXIgZG9jdW1lbnRzID0gbG9hZERvY3VtZW50cyhpbnB1dCwgb3B0aW9ucyk7XG5cbiAgaWYgKGRvY3VtZW50cy5sZW5ndGggPT09IDApIHtcbiAgICAvKmVzbGludC1kaXNhYmxlIG5vLXVuZGVmaW5lZCovXG4gICAgcmV0dXJuIHVuZGVmaW5lZDtcbiAgfSBlbHNlIGlmIChkb2N1bWVudHMubGVuZ3RoID09PSAxKSB7XG4gICAgcmV0dXJuIGRvY3VtZW50c1swXTtcbiAgfVxuICB0aHJvdyBuZXcgWUFNTEV4Y2VwdGlvbignZXhwZWN0ZWQgYSBzaW5nbGUgZG9jdW1lbnQgaW4gdGhlIHN0cmVhbSwgYnV0IGZvdW5kIG1vcmUnKTtcbn1cblxuXG5mdW5jdGlvbiBzYWZlTG9hZEFsbChpbnB1dCwgaXRlcmF0b3IsIG9wdGlvbnMpIHtcbiAgaWYgKHR5cGVvZiBpdGVyYXRvciA9PT0gJ29iamVjdCcgJiYgaXRlcmF0b3IgIT09IG51bGwgJiYgdHlwZW9mIG9wdGlvbnMgPT09ICd1bmRlZmluZWQnKSB7XG4gICAgb3B0aW9ucyA9IGl0ZXJhdG9yO1xuICAgIGl0ZXJhdG9yID0gbnVsbDtcbiAgfVxuXG4gIHJldHVybiBsb2FkQWxsKGlucHV0LCBpdGVyYXRvciwgY29tbW9uLmV4dGVuZCh7IHNjaGVtYTogREVGQVVMVF9TQUZFX1NDSEVNQSB9LCBvcHRpb25zKSk7XG59XG5cblxuZnVuY3Rpb24gc2FmZUxvYWQoaW5wdXQsIG9wdGlvbnMpIHtcbiAgcmV0dXJuIGxvYWQoaW5wdXQsIGNvbW1vbi5leHRlbmQoeyBzY2hlbWE6IERFRkFVTFRfU0FGRV9TQ0hFTUEgfSwgb3B0aW9ucykpO1xufVxuXG5cbm1vZHVsZS5leHBvcnRzLmxvYWRBbGwgICAgID0gbG9hZEFsbDtcbm1vZHVsZS5leHBvcnRzLmxvYWQgICAgICAgID0gbG9hZDtcbm1vZHVsZS5leHBvcnRzLnNhZmVMb2FkQWxsID0gc2FmZUxvYWRBbGw7XG5tb2R1bGUuZXhwb3J0cy5zYWZlTG9hZCAgICA9IHNhZmVMb2FkO1xuIiwiJ3VzZSBzdHJpY3QnO1xuXG4vKmVzbGludC1kaXNhYmxlIG5vLXVzZS1iZWZvcmUtZGVmaW5lKi9cblxudmFyIGNvbW1vbiAgICAgICAgICAgICAgPSByZXF1aXJlKCcuL2NvbW1vbicpO1xudmFyIFlBTUxFeGNlcHRpb24gICAgICAgPSByZXF1aXJlKCcuL2V4Y2VwdGlvbicpO1xudmFyIERFRkFVTFRfRlVMTF9TQ0hFTUEgPSByZXF1aXJlKCcuL3NjaGVtYS9kZWZhdWx0X2Z1bGwnKTtcbnZhciBERUZBVUxUX1NBRkVfU0NIRU1BID0gcmVxdWlyZSgnLi9zY2hlbWEvZGVmYXVsdF9zYWZlJyk7XG5cbnZhciBfdG9TdHJpbmcgICAgICAgPSBPYmplY3QucHJvdG90eXBlLnRvU3RyaW5nO1xudmFyIF9oYXNPd25Qcm9wZXJ0eSA9IE9iamVjdC5wcm90b3R5cGUuaGFzT3duUHJvcGVydHk7XG5cbnZhciBDSEFSX1RBQiAgICAgICAgICAgICAgICAgID0gMHgwOTsgLyogVGFiICovXG52YXIgQ0hBUl9MSU5FX0ZFRUQgICAgICAgICAgICA9IDB4MEE7IC8qIExGICovXG52YXIgQ0hBUl9DQVJSSUFHRV9SRVRVUk4gICAgICA9IDB4MEQ7IC8qIENSICovXG52YXIgQ0hBUl9TUEFDRSAgICAgICAgICAgICAgICA9IDB4MjA7IC8qIFNwYWNlICovXG52YXIgQ0hBUl9FWENMQU1BVElPTiAgICAgICAgICA9IDB4MjE7IC8qICEgKi9cbnZhciBDSEFSX0RPVUJMRV9RVU9URSAgICAgICAgID0gMHgyMjsgLyogXCIgKi9cbnZhciBDSEFSX1NIQVJQICAgICAgICAgICAgICAgID0gMHgyMzsgLyogIyAqL1xudmFyIENIQVJfUEVSQ0VOVCAgICAgICAgICAgICAgPSAweDI1OyAvKiAlICovXG52YXIgQ0hBUl9BTVBFUlNBTkQgICAgICAgICAgICA9IDB4MjY7IC8qICYgKi9cbnZhciBDSEFSX1NJTkdMRV9RVU9URSAgICAgICAgID0gMHgyNzsgLyogJyAqL1xudmFyIENIQVJfQVNURVJJU0sgICAgICAgICAgICAgPSAweDJBOyAvKiAqICovXG52YXIgQ0hBUl9DT01NQSAgICAgICAgICAgICAgICA9IDB4MkM7IC8qICwgKi9cbnZhciBDSEFSX01JTlVTICAgICAgICAgICAgICAgID0gMHgyRDsgLyogLSAqL1xudmFyIENIQVJfQ09MT04gICAgICAgICAgICAgICAgPSAweDNBOyAvKiA6ICovXG52YXIgQ0hBUl9FUVVBTFMgICAgICAgICAgICAgICA9IDB4M0Q7IC8qID0gKi9cbnZhciBDSEFSX0dSRUFURVJfVEhBTiAgICAgICAgID0gMHgzRTsgLyogPiAqL1xudmFyIENIQVJfUVVFU1RJT04gICAgICAgICAgICAgPSAweDNGOyAvKiA/ICovXG52YXIgQ0hBUl9DT01NRVJDSUFMX0FUICAgICAgICA9IDB4NDA7IC8qIEAgKi9cbnZhciBDSEFSX0xFRlRfU1FVQVJFX0JSQUNLRVQgID0gMHg1QjsgLyogWyAqL1xudmFyIENIQVJfUklHSFRfU1FVQVJFX0JSQUNLRVQgPSAweDVEOyAvKiBdICovXG52YXIgQ0hBUl9HUkFWRV9BQ0NFTlQgICAgICAgICA9IDB4NjA7IC8qIGAgKi9cbnZhciBDSEFSX0xFRlRfQ1VSTFlfQlJBQ0tFVCAgID0gMHg3QjsgLyogeyAqL1xudmFyIENIQVJfVkVSVElDQUxfTElORSAgICAgICAgPSAweDdDOyAvKiB8ICovXG52YXIgQ0hBUl9SSUdIVF9DVVJMWV9CUkFDS0VUICA9IDB4N0Q7IC8qIH0gKi9cblxudmFyIEVTQ0FQRV9TRVFVRU5DRVMgPSB7fTtcblxuRVNDQVBFX1NFUVVFTkNFU1sweDAwXSAgID0gJ1xcXFwwJztcbkVTQ0FQRV9TRVFVRU5DRVNbMHgwN10gICA9ICdcXFxcYSc7XG5FU0NBUEVfU0VRVUVOQ0VTWzB4MDhdICAgPSAnXFxcXGInO1xuRVNDQVBFX1NFUVVFTkNFU1sweDA5XSAgID0gJ1xcXFx0JztcbkVTQ0FQRV9TRVFVRU5DRVNbMHgwQV0gICA9ICdcXFxcbic7XG5FU0NBUEVfU0VRVUVOQ0VTWzB4MEJdICAgPSAnXFxcXHYnO1xuRVNDQVBFX1NFUVVFTkNFU1sweDBDXSAgID0gJ1xcXFxmJztcbkVTQ0FQRV9TRVFVRU5DRVNbMHgwRF0gICA9ICdcXFxccic7XG5FU0NBUEVfU0VRVUVOQ0VTWzB4MUJdICAgPSAnXFxcXGUnO1xuRVNDQVBFX1NFUVVFTkNFU1sweDIyXSAgID0gJ1xcXFxcIic7XG5FU0NBUEVfU0VRVUVOQ0VTWzB4NUNdICAgPSAnXFxcXFxcXFwnO1xuRVNDQVBFX1NFUVVFTkNFU1sweDg1XSAgID0gJ1xcXFxOJztcbkVTQ0FQRV9TRVFVRU5DRVNbMHhBMF0gICA9ICdcXFxcXyc7XG5FU0NBUEVfU0VRVUVOQ0VTWzB4MjAyOF0gPSAnXFxcXEwnO1xuRVNDQVBFX1NFUVVFTkNFU1sweDIwMjldID0gJ1xcXFxQJztcblxudmFyIERFUFJFQ0FURURfQk9PTEVBTlNfU1lOVEFYID0gW1xuICAneScsICdZJywgJ3llcycsICdZZXMnLCAnWUVTJywgJ29uJywgJ09uJywgJ09OJyxcbiAgJ24nLCAnTicsICdubycsICdObycsICdOTycsICdvZmYnLCAnT2ZmJywgJ09GRidcbl07XG5cbmZ1bmN0aW9uIGNvbXBpbGVTdHlsZU1hcChzY2hlbWEsIG1hcCkge1xuICB2YXIgcmVzdWx0LCBrZXlzLCBpbmRleCwgbGVuZ3RoLCB0YWcsIHN0eWxlLCB0eXBlO1xuXG4gIGlmIChtYXAgPT09IG51bGwpIHJldHVybiB7fTtcblxuICByZXN1bHQgPSB7fTtcbiAga2V5cyA9IE9iamVjdC5rZXlzKG1hcCk7XG5cbiAgZm9yIChpbmRleCA9IDAsIGxlbmd0aCA9IGtleXMubGVuZ3RoOyBpbmRleCA8IGxlbmd0aDsgaW5kZXggKz0gMSkge1xuICAgIHRhZyA9IGtleXNbaW5kZXhdO1xuICAgIHN0eWxlID0gU3RyaW5nKG1hcFt0YWddKTtcblxuICAgIGlmICh0YWcuc2xpY2UoMCwgMikgPT09ICchIScpIHtcbiAgICAgIHRhZyA9ICd0YWc6eWFtbC5vcmcsMjAwMjonICsgdGFnLnNsaWNlKDIpO1xuICAgIH1cbiAgICB0eXBlID0gc2NoZW1hLmNvbXBpbGVkVHlwZU1hcFsnZmFsbGJhY2snXVt0YWddO1xuXG4gICAgaWYgKHR5cGUgJiYgX2hhc093blByb3BlcnR5LmNhbGwodHlwZS5zdHlsZUFsaWFzZXMsIHN0eWxlKSkge1xuICAgICAgc3R5bGUgPSB0eXBlLnN0eWxlQWxpYXNlc1tzdHlsZV07XG4gICAgfVxuXG4gICAgcmVzdWx0W3RhZ10gPSBzdHlsZTtcbiAgfVxuXG4gIHJldHVybiByZXN1bHQ7XG59XG5cbmZ1bmN0aW9uIGVuY29kZUhleChjaGFyYWN0ZXIpIHtcbiAgdmFyIHN0cmluZywgaGFuZGxlLCBsZW5ndGg7XG5cbiAgc3RyaW5nID0gY2hhcmFjdGVyLnRvU3RyaW5nKDE2KS50b1VwcGVyQ2FzZSgpO1xuXG4gIGlmIChjaGFyYWN0ZXIgPD0gMHhGRikge1xuICAgIGhhbmRsZSA9ICd4JztcbiAgICBsZW5ndGggPSAyO1xuICB9IGVsc2UgaWYgKGNoYXJhY3RlciA8PSAweEZGRkYpIHtcbiAgICBoYW5kbGUgPSAndSc7XG4gICAgbGVuZ3RoID0gNDtcbiAgfSBlbHNlIGlmIChjaGFyYWN0ZXIgPD0gMHhGRkZGRkZGRikge1xuICAgIGhhbmRsZSA9ICdVJztcbiAgICBsZW5ndGggPSA4O1xuICB9IGVsc2Uge1xuICAgIHRocm93IG5ldyBZQU1MRXhjZXB0aW9uKCdjb2RlIHBvaW50IHdpdGhpbiBhIHN0cmluZyBtYXkgbm90IGJlIGdyZWF0ZXIgdGhhbiAweEZGRkZGRkZGJyk7XG4gIH1cblxuICByZXR1cm4gJ1xcXFwnICsgaGFuZGxlICsgY29tbW9uLnJlcGVhdCgnMCcsIGxlbmd0aCAtIHN0cmluZy5sZW5ndGgpICsgc3RyaW5nO1xufVxuXG5mdW5jdGlvbiBTdGF0ZShvcHRpb25zKSB7XG4gIHRoaXMuc2NoZW1hICAgICAgICA9IG9wdGlvbnNbJ3NjaGVtYSddIHx8IERFRkFVTFRfRlVMTF9TQ0hFTUE7XG4gIHRoaXMuaW5kZW50ICAgICAgICA9IE1hdGgubWF4KDEsIChvcHRpb25zWydpbmRlbnQnXSB8fCAyKSk7XG4gIHRoaXMubm9BcnJheUluZGVudCA9IG9wdGlvbnNbJ25vQXJyYXlJbmRlbnQnXSB8fCBmYWxzZTtcbiAgdGhpcy5za2lwSW52YWxpZCAgID0gb3B0aW9uc1snc2tpcEludmFsaWQnXSB8fCBmYWxzZTtcbiAgdGhpcy5mbG93TGV2ZWwgICAgID0gKGNvbW1vbi5pc05vdGhpbmcob3B0aW9uc1snZmxvd0xldmVsJ10pID8gLTEgOiBvcHRpb25zWydmbG93TGV2ZWwnXSk7XG4gIHRoaXMuc3R5bGVNYXAgICAgICA9IGNvbXBpbGVTdHlsZU1hcCh0aGlzLnNjaGVtYSwgb3B0aW9uc1snc3R5bGVzJ10gfHwgbnVsbCk7XG4gIHRoaXMuc29ydEtleXMgICAgICA9IG9wdGlvbnNbJ3NvcnRLZXlzJ10gfHwgZmFsc2U7XG4gIHRoaXMubGluZVdpZHRoICAgICA9IG9wdGlvbnNbJ2xpbmVXaWR0aCddIHx8IDgwO1xuICB0aGlzLm5vUmVmcyAgICAgICAgPSBvcHRpb25zWydub1JlZnMnXSB8fCBmYWxzZTtcbiAgdGhpcy5ub0NvbXBhdE1vZGUgID0gb3B0aW9uc1snbm9Db21wYXRNb2RlJ10gfHwgZmFsc2U7XG4gIHRoaXMuY29uZGVuc2VGbG93ICA9IG9wdGlvbnNbJ2NvbmRlbnNlRmxvdyddIHx8IGZhbHNlO1xuXG4gIHRoaXMuaW1wbGljaXRUeXBlcyA9IHRoaXMuc2NoZW1hLmNvbXBpbGVkSW1wbGljaXQ7XG4gIHRoaXMuZXhwbGljaXRUeXBlcyA9IHRoaXMuc2NoZW1hLmNvbXBpbGVkRXhwbGljaXQ7XG5cbiAgdGhpcy50YWcgPSBudWxsO1xuICB0aGlzLnJlc3VsdCA9ICcnO1xuXG4gIHRoaXMuZHVwbGljYXRlcyA9IFtdO1xuICB0aGlzLnVzZWREdXBsaWNhdGVzID0gbnVsbDtcbn1cblxuLy8gSW5kZW50cyBldmVyeSBsaW5lIGluIGEgc3RyaW5nLiBFbXB0eSBsaW5lcyAoXFxuIG9ubHkpIGFyZSBub3QgaW5kZW50ZWQuXG5mdW5jdGlvbiBpbmRlbnRTdHJpbmcoc3RyaW5nLCBzcGFjZXMpIHtcbiAgdmFyIGluZCA9IGNvbW1vbi5yZXBlYXQoJyAnLCBzcGFjZXMpLFxuICAgICAgcG9zaXRpb24gPSAwLFxuICAgICAgbmV4dCA9IC0xLFxuICAgICAgcmVzdWx0ID0gJycsXG4gICAgICBsaW5lLFxuICAgICAgbGVuZ3RoID0gc3RyaW5nLmxlbmd0aDtcblxuICB3aGlsZSAocG9zaXRpb24gPCBsZW5ndGgpIHtcbiAgICBuZXh0ID0gc3RyaW5nLmluZGV4T2YoJ1xcbicsIHBvc2l0aW9uKTtcbiAgICBpZiAobmV4dCA9PT0gLTEpIHtcbiAgICAgIGxpbmUgPSBzdHJpbmcuc2xpY2UocG9zaXRpb24pO1xuICAgICAgcG9zaXRpb24gPSBsZW5ndGg7XG4gICAgfSBlbHNlIHtcbiAgICAgIGxpbmUgPSBzdHJpbmcuc2xpY2UocG9zaXRpb24sIG5leHQgKyAxKTtcbiAgICAgIHBvc2l0aW9uID0gbmV4dCArIDE7XG4gICAgfVxuXG4gICAgaWYgKGxpbmUubGVuZ3RoICYmIGxpbmUgIT09ICdcXG4nKSByZXN1bHQgKz0gaW5kO1xuXG4gICAgcmVzdWx0ICs9IGxpbmU7XG4gIH1cblxuICByZXR1cm4gcmVzdWx0O1xufVxuXG5mdW5jdGlvbiBnZW5lcmF0ZU5leHRMaW5lKHN0YXRlLCBsZXZlbCkge1xuICByZXR1cm4gJ1xcbicgKyBjb21tb24ucmVwZWF0KCcgJywgc3RhdGUuaW5kZW50ICogbGV2ZWwpO1xufVxuXG5mdW5jdGlvbiB0ZXN0SW1wbGljaXRSZXNvbHZpbmcoc3RhdGUsIHN0cikge1xuICB2YXIgaW5kZXgsIGxlbmd0aCwgdHlwZTtcblxuICBmb3IgKGluZGV4ID0gMCwgbGVuZ3RoID0gc3RhdGUuaW1wbGljaXRUeXBlcy5sZW5ndGg7IGluZGV4IDwgbGVuZ3RoOyBpbmRleCArPSAxKSB7XG4gICAgdHlwZSA9IHN0YXRlLmltcGxpY2l0VHlwZXNbaW5kZXhdO1xuXG4gICAgaWYgKHR5cGUucmVzb2x2ZShzdHIpKSB7XG4gICAgICByZXR1cm4gdHJ1ZTtcbiAgICB9XG4gIH1cblxuICByZXR1cm4gZmFsc2U7XG59XG5cbi8vIFszM10gcy13aGl0ZSA6Oj0gcy1zcGFjZSB8IHMtdGFiXG5mdW5jdGlvbiBpc1doaXRlc3BhY2UoYykge1xuICByZXR1cm4gYyA9PT0gQ0hBUl9TUEFDRSB8fCBjID09PSBDSEFSX1RBQjtcbn1cblxuLy8gUmV0dXJucyB0cnVlIGlmIHRoZSBjaGFyYWN0ZXIgY2FuIGJlIHByaW50ZWQgd2l0aG91dCBlc2NhcGluZy5cbi8vIEZyb20gWUFNTCAxLjI6IFwiYW55IGFsbG93ZWQgY2hhcmFjdGVycyBrbm93biB0byBiZSBub24tcHJpbnRhYmxlXG4vLyBzaG91bGQgYWxzbyBiZSBlc2NhcGVkLiBbSG93ZXZlcixdIFRoaXMgaXNu4oCZdCBtYW5kYXRvcnlcIlxuLy8gRGVyaXZlZCBmcm9tIG5iLWNoYXIgLSBcXHQgLSAjeDg1IC0gI3hBMCAtICN4MjAyOCAtICN4MjAyOS5cbmZ1bmN0aW9uIGlzUHJpbnRhYmxlKGMpIHtcbiAgcmV0dXJuICAoMHgwMDAyMCA8PSBjICYmIGMgPD0gMHgwMDAwN0UpXG4gICAgICB8fCAoKDB4MDAwQTEgPD0gYyAmJiBjIDw9IDB4MDBEN0ZGKSAmJiBjICE9PSAweDIwMjggJiYgYyAhPT0gMHgyMDI5KVxuICAgICAgfHwgKCgweDBFMDAwIDw9IGMgJiYgYyA8PSAweDAwRkZGRCkgJiYgYyAhPT0gMHhGRUZGIC8qIEJPTSAqLylcbiAgICAgIHx8ICAoMHgxMDAwMCA8PSBjICYmIGMgPD0gMHgxMEZGRkYpO1xufVxuXG4vLyBbMzRdIG5zLWNoYXIgOjo9IG5iLWNoYXIgLSBzLXdoaXRlXG4vLyBbMjddIG5iLWNoYXIgOjo9IGMtcHJpbnRhYmxlIC0gYi1jaGFyIC0gYy1ieXRlLW9yZGVyLW1hcmtcbi8vIFsyNl0gYi1jaGFyICA6Oj0gYi1saW5lLWZlZWQgfCBiLWNhcnJpYWdlLXJldHVyblxuLy8gWzI0XSBiLWxpbmUtZmVlZCAgICAgICA6Oj0gICAgICN4QSAgICAvKiBMRiAqL1xuLy8gWzI1XSBiLWNhcnJpYWdlLXJldHVybiA6Oj0gICAgICN4RCAgICAvKiBDUiAqL1xuLy8gWzNdICBjLWJ5dGUtb3JkZXItbWFyayA6Oj0gICAgICN4RkVGRlxuZnVuY3Rpb24gaXNOc0NoYXIoYykge1xuICByZXR1cm4gaXNQcmludGFibGUoYykgJiYgIWlzV2hpdGVzcGFjZShjKVxuICAgIC8vIGJ5dGUtb3JkZXItbWFya1xuICAgICYmIGMgIT09IDB4RkVGRlxuICAgIC8vIGItY2hhclxuICAgICYmIGMgIT09IENIQVJfQ0FSUklBR0VfUkVUVVJOXG4gICAgJiYgYyAhPT0gQ0hBUl9MSU5FX0ZFRUQ7XG59XG5cbi8vIFNpbXBsaWZpZWQgdGVzdCBmb3IgdmFsdWVzIGFsbG93ZWQgYWZ0ZXIgdGhlIGZpcnN0IGNoYXJhY3RlciBpbiBwbGFpbiBzdHlsZS5cbmZ1bmN0aW9uIGlzUGxhaW5TYWZlKGMsIHByZXYpIHtcbiAgLy8gVXNlcyBhIHN1YnNldCBvZiBuYi1jaGFyIC0gYy1mbG93LWluZGljYXRvciAtIFwiOlwiIC0gXCIjXCJcbiAgLy8gd2hlcmUgbmItY2hhciA6Oj0gYy1wcmludGFibGUgLSBiLWNoYXIgLSBjLWJ5dGUtb3JkZXItbWFyay5cbiAgcmV0dXJuIGlzUHJpbnRhYmxlKGMpICYmIGMgIT09IDB4RkVGRlxuICAgIC8vIC0gYy1mbG93LWluZGljYXRvclxuICAgICYmIGMgIT09IENIQVJfQ09NTUFcbiAgICAmJiBjICE9PSBDSEFSX0xFRlRfU1FVQVJFX0JSQUNLRVRcbiAgICAmJiBjICE9PSBDSEFSX1JJR0hUX1NRVUFSRV9CUkFDS0VUXG4gICAgJiYgYyAhPT0gQ0hBUl9MRUZUX0NVUkxZX0JSQUNLRVRcbiAgICAmJiBjICE9PSBDSEFSX1JJR0hUX0NVUkxZX0JSQUNLRVRcbiAgICAvLyAtIFwiOlwiIC0gXCIjXCJcbiAgICAvLyAvKiBBbiBucy1jaGFyIHByZWNlZGluZyAqLyBcIiNcIlxuICAgICYmIGMgIT09IENIQVJfQ09MT05cbiAgICAmJiAoKGMgIT09IENIQVJfU0hBUlApIHx8IChwcmV2ICYmIGlzTnNDaGFyKHByZXYpKSk7XG59XG5cbi8vIFNpbXBsaWZpZWQgdGVzdCBmb3IgdmFsdWVzIGFsbG93ZWQgYXMgdGhlIGZpcnN0IGNoYXJhY3RlciBpbiBwbGFpbiBzdHlsZS5cbmZ1bmN0aW9uIGlzUGxhaW5TYWZlRmlyc3QoYykge1xuICAvLyBVc2VzIGEgc3Vic2V0IG9mIG5zLWNoYXIgLSBjLWluZGljYXRvclxuICAvLyB3aGVyZSBucy1jaGFyID0gbmItY2hhciAtIHMtd2hpdGUuXG4gIHJldHVybiBpc1ByaW50YWJsZShjKSAmJiBjICE9PSAweEZFRkZcbiAgICAmJiAhaXNXaGl0ZXNwYWNlKGMpIC8vIC0gcy13aGl0ZVxuICAgIC8vIC0gKGMtaW5kaWNhdG9yIDo6PVxuICAgIC8vIOKAnC3igJ0gfCDigJw/4oCdIHwg4oCcOuKAnSB8IOKAnCzigJ0gfCDigJxb4oCdIHwg4oCcXeKAnSB8IOKAnHvigJ0gfCDigJx94oCdXG4gICAgJiYgYyAhPT0gQ0hBUl9NSU5VU1xuICAgICYmIGMgIT09IENIQVJfUVVFU1RJT05cbiAgICAmJiBjICE9PSBDSEFSX0NPTE9OXG4gICAgJiYgYyAhPT0gQ0hBUl9DT01NQVxuICAgICYmIGMgIT09IENIQVJfTEVGVF9TUVVBUkVfQlJBQ0tFVFxuICAgICYmIGMgIT09IENIQVJfUklHSFRfU1FVQVJFX0JSQUNLRVRcbiAgICAmJiBjICE9PSBDSEFSX0xFRlRfQ1VSTFlfQlJBQ0tFVFxuICAgICYmIGMgIT09IENIQVJfUklHSFRfQ1VSTFlfQlJBQ0tFVFxuICAgIC8vIHwg4oCcI+KAnSB8IOKAnCbigJ0gfCDigJwq4oCdIHwg4oCcIeKAnSB8IOKAnHzigJ0gfCDigJw94oCdIHwg4oCcPuKAnSB8IOKAnCfigJ0gfCDigJxcIuKAnVxuICAgICYmIGMgIT09IENIQVJfU0hBUlBcbiAgICAmJiBjICE9PSBDSEFSX0FNUEVSU0FORFxuICAgICYmIGMgIT09IENIQVJfQVNURVJJU0tcbiAgICAmJiBjICE9PSBDSEFSX0VYQ0xBTUFUSU9OXG4gICAgJiYgYyAhPT0gQ0hBUl9WRVJUSUNBTF9MSU5FXG4gICAgJiYgYyAhPT0gQ0hBUl9FUVVBTFNcbiAgICAmJiBjICE9PSBDSEFSX0dSRUFURVJfVEhBTlxuICAgICYmIGMgIT09IENIQVJfU0lOR0xFX1FVT1RFXG4gICAgJiYgYyAhPT0gQ0hBUl9ET1VCTEVfUVVPVEVcbiAgICAvLyB8IOKAnCXigJ0gfCDigJxA4oCdIHwg4oCcYOKAnSlcbiAgICAmJiBjICE9PSBDSEFSX1BFUkNFTlRcbiAgICAmJiBjICE9PSBDSEFSX0NPTU1FUkNJQUxfQVRcbiAgICAmJiBjICE9PSBDSEFSX0dSQVZFX0FDQ0VOVDtcbn1cblxuLy8gRGV0ZXJtaW5lcyB3aGV0aGVyIGJsb2NrIGluZGVudGF0aW9uIGluZGljYXRvciBpcyByZXF1aXJlZC5cbmZ1bmN0aW9uIG5lZWRJbmRlbnRJbmRpY2F0b3Ioc3RyaW5nKSB7XG4gIHZhciBsZWFkaW5nU3BhY2VSZSA9IC9eXFxuKiAvO1xuICByZXR1cm4gbGVhZGluZ1NwYWNlUmUudGVzdChzdHJpbmcpO1xufVxuXG52YXIgU1RZTEVfUExBSU4gICA9IDEsXG4gICAgU1RZTEVfU0lOR0xFICA9IDIsXG4gICAgU1RZTEVfTElURVJBTCA9IDMsXG4gICAgU1RZTEVfRk9MREVEICA9IDQsXG4gICAgU1RZTEVfRE9VQkxFICA9IDU7XG5cbi8vIERldGVybWluZXMgd2hpY2ggc2NhbGFyIHN0eWxlcyBhcmUgcG9zc2libGUgYW5kIHJldHVybnMgdGhlIHByZWZlcnJlZCBzdHlsZS5cbi8vIGxpbmVXaWR0aCA9IC0xID0+IG5vIGxpbWl0LlxuLy8gUHJlLWNvbmRpdGlvbnM6IHN0ci5sZW5ndGggPiAwLlxuLy8gUG9zdC1jb25kaXRpb25zOlxuLy8gICAgU1RZTEVfUExBSU4gb3IgU1RZTEVfU0lOR0xFID0+IG5vIFxcbiBhcmUgaW4gdGhlIHN0cmluZy5cbi8vICAgIFNUWUxFX0xJVEVSQUwgPT4gbm8gbGluZXMgYXJlIHN1aXRhYmxlIGZvciBmb2xkaW5nIChvciBsaW5lV2lkdGggaXMgLTEpLlxuLy8gICAgU1RZTEVfRk9MREVEID0+IGEgbGluZSA+IGxpbmVXaWR0aCBhbmQgY2FuIGJlIGZvbGRlZCAoYW5kIGxpbmVXaWR0aCAhPSAtMSkuXG5mdW5jdGlvbiBjaG9vc2VTY2FsYXJTdHlsZShzdHJpbmcsIHNpbmdsZUxpbmVPbmx5LCBpbmRlbnRQZXJMZXZlbCwgbGluZVdpZHRoLCB0ZXN0QW1iaWd1b3VzVHlwZSkge1xuICB2YXIgaTtcbiAgdmFyIGNoYXIsIHByZXZfY2hhcjtcbiAgdmFyIGhhc0xpbmVCcmVhayA9IGZhbHNlO1xuICB2YXIgaGFzRm9sZGFibGVMaW5lID0gZmFsc2U7IC8vIG9ubHkgY2hlY2tlZCBpZiBzaG91bGRUcmFja1dpZHRoXG4gIHZhciBzaG91bGRUcmFja1dpZHRoID0gbGluZVdpZHRoICE9PSAtMTtcbiAgdmFyIHByZXZpb3VzTGluZUJyZWFrID0gLTE7IC8vIGNvdW50IHRoZSBmaXJzdCBsaW5lIGNvcnJlY3RseVxuICB2YXIgcGxhaW4gPSBpc1BsYWluU2FmZUZpcnN0KHN0cmluZy5jaGFyQ29kZUF0KDApKVxuICAgICAgICAgICYmICFpc1doaXRlc3BhY2Uoc3RyaW5nLmNoYXJDb2RlQXQoc3RyaW5nLmxlbmd0aCAtIDEpKTtcblxuICBpZiAoc2luZ2xlTGluZU9ubHkpIHtcbiAgICAvLyBDYXNlOiBubyBibG9jayBzdHlsZXMuXG4gICAgLy8gQ2hlY2sgZm9yIGRpc2FsbG93ZWQgY2hhcmFjdGVycyB0byBydWxlIG91dCBwbGFpbiBhbmQgc2luZ2xlLlxuICAgIGZvciAoaSA9IDA7IGkgPCBzdHJpbmcubGVuZ3RoOyBpKyspIHtcbiAgICAgIGNoYXIgPSBzdHJpbmcuY2hhckNvZGVBdChpKTtcbiAgICAgIGlmICghaXNQcmludGFibGUoY2hhcikpIHtcbiAgICAgICAgcmV0dXJuIFNUWUxFX0RPVUJMRTtcbiAgICAgIH1cbiAgICAgIHByZXZfY2hhciA9IGkgPiAwID8gc3RyaW5nLmNoYXJDb2RlQXQoaSAtIDEpIDogbnVsbDtcbiAgICAgIHBsYWluID0gcGxhaW4gJiYgaXNQbGFpblNhZmUoY2hhciwgcHJldl9jaGFyKTtcbiAgICB9XG4gIH0gZWxzZSB7XG4gICAgLy8gQ2FzZTogYmxvY2sgc3R5bGVzIHBlcm1pdHRlZC5cbiAgICBmb3IgKGkgPSAwOyBpIDwgc3RyaW5nLmxlbmd0aDsgaSsrKSB7XG4gICAgICBjaGFyID0gc3RyaW5nLmNoYXJDb2RlQXQoaSk7XG4gICAgICBpZiAoY2hhciA9PT0gQ0hBUl9MSU5FX0ZFRUQpIHtcbiAgICAgICAgaGFzTGluZUJyZWFrID0gdHJ1ZTtcbiAgICAgICAgLy8gQ2hlY2sgaWYgYW55IGxpbmUgY2FuIGJlIGZvbGRlZC5cbiAgICAgICAgaWYgKHNob3VsZFRyYWNrV2lkdGgpIHtcbiAgICAgICAgICBoYXNGb2xkYWJsZUxpbmUgPSBoYXNGb2xkYWJsZUxpbmUgfHxcbiAgICAgICAgICAgIC8vIEZvbGRhYmxlIGxpbmUgPSB0b28gbG9uZywgYW5kIG5vdCBtb3JlLWluZGVudGVkLlxuICAgICAgICAgICAgKGkgLSBwcmV2aW91c0xpbmVCcmVhayAtIDEgPiBsaW5lV2lkdGggJiZcbiAgICAgICAgICAgICBzdHJpbmdbcHJldmlvdXNMaW5lQnJlYWsgKyAxXSAhPT0gJyAnKTtcbiAgICAgICAgICBwcmV2aW91c0xpbmVCcmVhayA9IGk7XG4gICAgICAgIH1cbiAgICAgIH0gZWxzZSBpZiAoIWlzUHJpbnRhYmxlKGNoYXIpKSB7XG4gICAgICAgIHJldHVybiBTVFlMRV9ET1VCTEU7XG4gICAgICB9XG4gICAgICBwcmV2X2NoYXIgPSBpID4gMCA/IHN0cmluZy5jaGFyQ29kZUF0KGkgLSAxKSA6IG51bGw7XG4gICAgICBwbGFpbiA9IHBsYWluICYmIGlzUGxhaW5TYWZlKGNoYXIsIHByZXZfY2hhcik7XG4gICAgfVxuICAgIC8vIGluIGNhc2UgdGhlIGVuZCBpcyBtaXNzaW5nIGEgXFxuXG4gICAgaGFzRm9sZGFibGVMaW5lID0gaGFzRm9sZGFibGVMaW5lIHx8IChzaG91bGRUcmFja1dpZHRoICYmXG4gICAgICAoaSAtIHByZXZpb3VzTGluZUJyZWFrIC0gMSA+IGxpbmVXaWR0aCAmJlxuICAgICAgIHN0cmluZ1twcmV2aW91c0xpbmVCcmVhayArIDFdICE9PSAnICcpKTtcbiAgfVxuICAvLyBBbHRob3VnaCBldmVyeSBzdHlsZSBjYW4gcmVwcmVzZW50IFxcbiB3aXRob3V0IGVzY2FwaW5nLCBwcmVmZXIgYmxvY2sgc3R5bGVzXG4gIC8vIGZvciBtdWx0aWxpbmUsIHNpbmNlIHRoZXkncmUgbW9yZSByZWFkYWJsZSBhbmQgdGhleSBkb24ndCBhZGQgZW1wdHkgbGluZXMuXG4gIC8vIEFsc28gcHJlZmVyIGZvbGRpbmcgYSBzdXBlci1sb25nIGxpbmUuXG4gIGlmICghaGFzTGluZUJyZWFrICYmICFoYXNGb2xkYWJsZUxpbmUpIHtcbiAgICAvLyBTdHJpbmdzIGludGVycHJldGFibGUgYXMgYW5vdGhlciB0eXBlIGhhdmUgdG8gYmUgcXVvdGVkO1xuICAgIC8vIGUuZy4gdGhlIHN0cmluZyAndHJ1ZScgdnMuIHRoZSBib29sZWFuIHRydWUuXG4gICAgcmV0dXJuIHBsYWluICYmICF0ZXN0QW1iaWd1b3VzVHlwZShzdHJpbmcpXG4gICAgICA/IFNUWUxFX1BMQUlOIDogU1RZTEVfU0lOR0xFO1xuICB9XG4gIC8vIEVkZ2UgY2FzZTogYmxvY2sgaW5kZW50YXRpb24gaW5kaWNhdG9yIGNhbiBvbmx5IGhhdmUgb25lIGRpZ2l0LlxuICBpZiAoaW5kZW50UGVyTGV2ZWwgPiA5ICYmIG5lZWRJbmRlbnRJbmRpY2F0b3Ioc3RyaW5nKSkge1xuICAgIHJldHVybiBTVFlMRV9ET1VCTEU7XG4gIH1cbiAgLy8gQXQgdGhpcyBwb2ludCB3ZSBrbm93IGJsb2NrIHN0eWxlcyBhcmUgdmFsaWQuXG4gIC8vIFByZWZlciBsaXRlcmFsIHN0eWxlIHVubGVzcyB3ZSB3YW50IHRvIGZvbGQuXG4gIHJldHVybiBoYXNGb2xkYWJsZUxpbmUgPyBTVFlMRV9GT0xERUQgOiBTVFlMRV9MSVRFUkFMO1xufVxuXG4vLyBOb3RlOiBsaW5lIGJyZWFraW5nL2ZvbGRpbmcgaXMgaW1wbGVtZW50ZWQgZm9yIG9ubHkgdGhlIGZvbGRlZCBzdHlsZS5cbi8vIE5CLiBXZSBkcm9wIHRoZSBsYXN0IHRyYWlsaW5nIG5ld2xpbmUgKGlmIGFueSkgb2YgYSByZXR1cm5lZCBibG9jayBzY2FsYXJcbi8vICBzaW5jZSB0aGUgZHVtcGVyIGFkZHMgaXRzIG93biBuZXdsaW5lLiBUaGlzIGFsd2F5cyB3b3Jrczpcbi8vICAgIOKAoiBObyBlbmRpbmcgbmV3bGluZSA9PiB1bmFmZmVjdGVkOyBhbHJlYWR5IHVzaW5nIHN0cmlwIFwiLVwiIGNob21waW5nLlxuLy8gICAg4oCiIEVuZGluZyBuZXdsaW5lICAgID0+IHJlbW92ZWQgdGhlbiByZXN0b3JlZC5cbi8vICBJbXBvcnRhbnRseSwgdGhpcyBrZWVwcyB0aGUgXCIrXCIgY2hvbXAgaW5kaWNhdG9yIGZyb20gZ2FpbmluZyBhbiBleHRyYSBsaW5lLlxuZnVuY3Rpb24gd3JpdGVTY2FsYXIoc3RhdGUsIHN0cmluZywgbGV2ZWwsIGlza2V5KSB7XG4gIHN0YXRlLmR1bXAgPSAoZnVuY3Rpb24gKCkge1xuICAgIGlmIChzdHJpbmcubGVuZ3RoID09PSAwKSB7XG4gICAgICByZXR1cm4gXCInJ1wiO1xuICAgIH1cbiAgICBpZiAoIXN0YXRlLm5vQ29tcGF0TW9kZSAmJlxuICAgICAgICBERVBSRUNBVEVEX0JPT0xFQU5TX1NZTlRBWC5pbmRleE9mKHN0cmluZykgIT09IC0xKSB7XG4gICAgICByZXR1cm4gXCInXCIgKyBzdHJpbmcgKyBcIidcIjtcbiAgICB9XG5cbiAgICB2YXIgaW5kZW50ID0gc3RhdGUuaW5kZW50ICogTWF0aC5tYXgoMSwgbGV2ZWwpOyAvLyBubyAwLWluZGVudCBzY2FsYXJzXG4gICAgLy8gQXMgaW5kZW50YXRpb24gZ2V0cyBkZWVwZXIsIGxldCB0aGUgd2lkdGggZGVjcmVhc2UgbW9ub3RvbmljYWxseVxuICAgIC8vIHRvIHRoZSBsb3dlciBib3VuZCBtaW4oc3RhdGUubGluZVdpZHRoLCA0MCkuXG4gICAgLy8gTm90ZSB0aGF0IHRoaXMgaW1wbGllc1xuICAgIC8vICBzdGF0ZS5saW5lV2lkdGgg4omkIDQwICsgc3RhdGUuaW5kZW50OiB3aWR0aCBpcyBmaXhlZCBhdCB0aGUgbG93ZXIgYm91bmQuXG4gICAgLy8gIHN0YXRlLmxpbmVXaWR0aCA+IDQwICsgc3RhdGUuaW5kZW50OiB3aWR0aCBkZWNyZWFzZXMgdW50aWwgdGhlIGxvd2VyIGJvdW5kLlxuICAgIC8vIFRoaXMgYmVoYXZlcyBiZXR0ZXIgdGhhbiBhIGNvbnN0YW50IG1pbmltdW0gd2lkdGggd2hpY2ggZGlzYWxsb3dzIG5hcnJvd2VyIG9wdGlvbnMsXG4gICAgLy8gb3IgYW4gaW5kZW50IHRocmVzaG9sZCB3aGljaCBjYXVzZXMgdGhlIHdpZHRoIHRvIHN1ZGRlbmx5IGluY3JlYXNlLlxuICAgIHZhciBsaW5lV2lkdGggPSBzdGF0ZS5saW5lV2lkdGggPT09IC0xXG4gICAgICA/IC0xIDogTWF0aC5tYXgoTWF0aC5taW4oc3RhdGUubGluZVdpZHRoLCA0MCksIHN0YXRlLmxpbmVXaWR0aCAtIGluZGVudCk7XG5cbiAgICAvLyBXaXRob3V0IGtub3dpbmcgaWYga2V5cyBhcmUgaW1wbGljaXQvZXhwbGljaXQsIGFzc3VtZSBpbXBsaWNpdCBmb3Igc2FmZXR5LlxuICAgIHZhciBzaW5nbGVMaW5lT25seSA9IGlza2V5XG4gICAgICAvLyBObyBibG9jayBzdHlsZXMgaW4gZmxvdyBtb2RlLlxuICAgICAgfHwgKHN0YXRlLmZsb3dMZXZlbCA+IC0xICYmIGxldmVsID49IHN0YXRlLmZsb3dMZXZlbCk7XG4gICAgZnVuY3Rpb24gdGVzdEFtYmlndWl0eShzdHJpbmcpIHtcbiAgICAgIHJldHVybiB0ZXN0SW1wbGljaXRSZXNvbHZpbmcoc3RhdGUsIHN0cmluZyk7XG4gICAgfVxuXG4gICAgc3dpdGNoIChjaG9vc2VTY2FsYXJTdHlsZShzdHJpbmcsIHNpbmdsZUxpbmVPbmx5LCBzdGF0ZS5pbmRlbnQsIGxpbmVXaWR0aCwgdGVzdEFtYmlndWl0eSkpIHtcbiAgICAgIGNhc2UgU1RZTEVfUExBSU46XG4gICAgICAgIHJldHVybiBzdHJpbmc7XG4gICAgICBjYXNlIFNUWUxFX1NJTkdMRTpcbiAgICAgICAgcmV0dXJuIFwiJ1wiICsgc3RyaW5nLnJlcGxhY2UoLycvZywgXCInJ1wiKSArIFwiJ1wiO1xuICAgICAgY2FzZSBTVFlMRV9MSVRFUkFMOlxuICAgICAgICByZXR1cm4gJ3wnICsgYmxvY2tIZWFkZXIoc3RyaW5nLCBzdGF0ZS5pbmRlbnQpXG4gICAgICAgICAgKyBkcm9wRW5kaW5nTmV3bGluZShpbmRlbnRTdHJpbmcoc3RyaW5nLCBpbmRlbnQpKTtcbiAgICAgIGNhc2UgU1RZTEVfRk9MREVEOlxuICAgICAgICByZXR1cm4gJz4nICsgYmxvY2tIZWFkZXIoc3RyaW5nLCBzdGF0ZS5pbmRlbnQpXG4gICAgICAgICAgKyBkcm9wRW5kaW5nTmV3bGluZShpbmRlbnRTdHJpbmcoZm9sZFN0cmluZyhzdHJpbmcsIGxpbmVXaWR0aCksIGluZGVudCkpO1xuICAgICAgY2FzZSBTVFlMRV9ET1VCTEU6XG4gICAgICAgIHJldHVybiAnXCInICsgZXNjYXBlU3RyaW5nKHN0cmluZywgbGluZVdpZHRoKSArICdcIic7XG4gICAgICBkZWZhdWx0OlxuICAgICAgICB0aHJvdyBuZXcgWUFNTEV4Y2VwdGlvbignaW1wb3NzaWJsZSBlcnJvcjogaW52YWxpZCBzY2FsYXIgc3R5bGUnKTtcbiAgICB9XG4gIH0oKSk7XG59XG5cbi8vIFByZS1jb25kaXRpb25zOiBzdHJpbmcgaXMgdmFsaWQgZm9yIGEgYmxvY2sgc2NhbGFyLCAxIDw9IGluZGVudFBlckxldmVsIDw9IDkuXG5mdW5jdGlvbiBibG9ja0hlYWRlcihzdHJpbmcsIGluZGVudFBlckxldmVsKSB7XG4gIHZhciBpbmRlbnRJbmRpY2F0b3IgPSBuZWVkSW5kZW50SW5kaWNhdG9yKHN0cmluZykgPyBTdHJpbmcoaW5kZW50UGVyTGV2ZWwpIDogJyc7XG5cbiAgLy8gbm90ZSB0aGUgc3BlY2lhbCBjYXNlOiB0aGUgc3RyaW5nICdcXG4nIGNvdW50cyBhcyBhIFwidHJhaWxpbmdcIiBlbXB0eSBsaW5lLlxuICB2YXIgY2xpcCA9ICAgICAgICAgIHN0cmluZ1tzdHJpbmcubGVuZ3RoIC0gMV0gPT09ICdcXG4nO1xuICB2YXIga2VlcCA9IGNsaXAgJiYgKHN0cmluZ1tzdHJpbmcubGVuZ3RoIC0gMl0gPT09ICdcXG4nIHx8IHN0cmluZyA9PT0gJ1xcbicpO1xuICB2YXIgY2hvbXAgPSBrZWVwID8gJysnIDogKGNsaXAgPyAnJyA6ICctJyk7XG5cbiAgcmV0dXJuIGluZGVudEluZGljYXRvciArIGNob21wICsgJ1xcbic7XG59XG5cbi8vIChTZWUgdGhlIG5vdGUgZm9yIHdyaXRlU2NhbGFyLilcbmZ1bmN0aW9uIGRyb3BFbmRpbmdOZXdsaW5lKHN0cmluZykge1xuICByZXR1cm4gc3RyaW5nW3N0cmluZy5sZW5ndGggLSAxXSA9PT0gJ1xcbicgPyBzdHJpbmcuc2xpY2UoMCwgLTEpIDogc3RyaW5nO1xufVxuXG4vLyBOb3RlOiBhIGxvbmcgbGluZSB3aXRob3V0IGEgc3VpdGFibGUgYnJlYWsgcG9pbnQgd2lsbCBleGNlZWQgdGhlIHdpZHRoIGxpbWl0LlxuLy8gUHJlLWNvbmRpdGlvbnM6IGV2ZXJ5IGNoYXIgaW4gc3RyIGlzUHJpbnRhYmxlLCBzdHIubGVuZ3RoID4gMCwgd2lkdGggPiAwLlxuZnVuY3Rpb24gZm9sZFN0cmluZyhzdHJpbmcsIHdpZHRoKSB7XG4gIC8vIEluIGZvbGRlZCBzdHlsZSwgJGskIGNvbnNlY3V0aXZlIG5ld2xpbmVzIG91dHB1dCBhcyAkaysxJCBuZXdsaW5lc+KAlFxuICAvLyB1bmxlc3MgdGhleSdyZSBiZWZvcmUgb3IgYWZ0ZXIgYSBtb3JlLWluZGVudGVkIGxpbmUsIG9yIGF0IHRoZSB2ZXJ5XG4gIC8vIGJlZ2lubmluZyBvciBlbmQsIGluIHdoaWNoIGNhc2UgJGskIG1hcHMgdG8gJGskLlxuICAvLyBUaGVyZWZvcmUsIHBhcnNlIGVhY2ggY2h1bmsgYXMgbmV3bGluZShzKSBmb2xsb3dlZCBieSBhIGNvbnRlbnQgbGluZS5cbiAgdmFyIGxpbmVSZSA9IC8oXFxuKykoW15cXG5dKikvZztcblxuICAvLyBmaXJzdCBsaW5lIChwb3NzaWJseSBhbiBlbXB0eSBsaW5lKVxuICB2YXIgcmVzdWx0ID0gKGZ1bmN0aW9uICgpIHtcbiAgICB2YXIgbmV4dExGID0gc3RyaW5nLmluZGV4T2YoJ1xcbicpO1xuICAgIG5leHRMRiA9IG5leHRMRiAhPT0gLTEgPyBuZXh0TEYgOiBzdHJpbmcubGVuZ3RoO1xuICAgIGxpbmVSZS5sYXN0SW5kZXggPSBuZXh0TEY7XG4gICAgcmV0dXJuIGZvbGRMaW5lKHN0cmluZy5zbGljZSgwLCBuZXh0TEYpLCB3aWR0aCk7XG4gIH0oKSk7XG4gIC8vIElmIHdlIGhhdmVuJ3QgcmVhY2hlZCB0aGUgZmlyc3QgY29udGVudCBsaW5lIHlldCwgZG9uJ3QgYWRkIGFuIGV4dHJhIFxcbi5cbiAgdmFyIHByZXZNb3JlSW5kZW50ZWQgPSBzdHJpbmdbMF0gPT09ICdcXG4nIHx8IHN0cmluZ1swXSA9PT0gJyAnO1xuICB2YXIgbW9yZUluZGVudGVkO1xuXG4gIC8vIHJlc3Qgb2YgdGhlIGxpbmVzXG4gIHZhciBtYXRjaDtcbiAgd2hpbGUgKChtYXRjaCA9IGxpbmVSZS5leGVjKHN0cmluZykpKSB7XG4gICAgdmFyIHByZWZpeCA9IG1hdGNoWzFdLCBsaW5lID0gbWF0Y2hbMl07XG4gICAgbW9yZUluZGVudGVkID0gKGxpbmVbMF0gPT09ICcgJyk7XG4gICAgcmVzdWx0ICs9IHByZWZpeFxuICAgICAgKyAoIXByZXZNb3JlSW5kZW50ZWQgJiYgIW1vcmVJbmRlbnRlZCAmJiBsaW5lICE9PSAnJ1xuICAgICAgICA/ICdcXG4nIDogJycpXG4gICAgICArIGZvbGRMaW5lKGxpbmUsIHdpZHRoKTtcbiAgICBwcmV2TW9yZUluZGVudGVkID0gbW9yZUluZGVudGVkO1xuICB9XG5cbiAgcmV0dXJuIHJlc3VsdDtcbn1cblxuLy8gR3JlZWR5IGxpbmUgYnJlYWtpbmcuXG4vLyBQaWNrcyB0aGUgbG9uZ2VzdCBsaW5lIHVuZGVyIHRoZSBsaW1pdCBlYWNoIHRpbWUsXG4vLyBvdGhlcndpc2Ugc2V0dGxlcyBmb3IgdGhlIHNob3J0ZXN0IGxpbmUgb3ZlciB0aGUgbGltaXQuXG4vLyBOQi4gTW9yZS1pbmRlbnRlZCBsaW5lcyAqY2Fubm90KiBiZSBmb2xkZWQsIGFzIHRoYXQgd291bGQgYWRkIGFuIGV4dHJhIFxcbi5cbmZ1bmN0aW9uIGZvbGRMaW5lKGxpbmUsIHdpZHRoKSB7XG4gIGlmIChsaW5lID09PSAnJyB8fCBsaW5lWzBdID09PSAnICcpIHJldHVybiBsaW5lO1xuXG4gIC8vIFNpbmNlIGEgbW9yZS1pbmRlbnRlZCBsaW5lIGFkZHMgYSBcXG4sIGJyZWFrcyBjYW4ndCBiZSBmb2xsb3dlZCBieSBhIHNwYWNlLlxuICB2YXIgYnJlYWtSZSA9IC8gW14gXS9nOyAvLyBub3RlOiB0aGUgbWF0Y2ggaW5kZXggd2lsbCBhbHdheXMgYmUgPD0gbGVuZ3RoLTIuXG4gIHZhciBtYXRjaDtcbiAgLy8gc3RhcnQgaXMgYW4gaW5jbHVzaXZlIGluZGV4LiBlbmQsIGN1cnIsIGFuZCBuZXh0IGFyZSBleGNsdXNpdmUuXG4gIHZhciBzdGFydCA9IDAsIGVuZCwgY3VyciA9IDAsIG5leHQgPSAwO1xuICB2YXIgcmVzdWx0ID0gJyc7XG5cbiAgLy8gSW52YXJpYW50czogMCA8PSBzdGFydCA8PSBsZW5ndGgtMS5cbiAgLy8gICAwIDw9IGN1cnIgPD0gbmV4dCA8PSBtYXgoMCwgbGVuZ3RoLTIpLiBjdXJyIC0gc3RhcnQgPD0gd2lkdGguXG4gIC8vIEluc2lkZSB0aGUgbG9vcDpcbiAgLy8gICBBIG1hdGNoIGltcGxpZXMgbGVuZ3RoID49IDIsIHNvIGN1cnIgYW5kIG5leHQgYXJlIDw9IGxlbmd0aC0yLlxuICB3aGlsZSAoKG1hdGNoID0gYnJlYWtSZS5leGVjKGxpbmUpKSkge1xuICAgIG5leHQgPSBtYXRjaC5pbmRleDtcbiAgICAvLyBtYWludGFpbiBpbnZhcmlhbnQ6IGN1cnIgLSBzdGFydCA8PSB3aWR0aFxuICAgIGlmIChuZXh0IC0gc3RhcnQgPiB3aWR0aCkge1xuICAgICAgZW5kID0gKGN1cnIgPiBzdGFydCkgPyBjdXJyIDogbmV4dDsgLy8gZGVyaXZlIGVuZCA8PSBsZW5ndGgtMlxuICAgICAgcmVzdWx0ICs9ICdcXG4nICsgbGluZS5zbGljZShzdGFydCwgZW5kKTtcbiAgICAgIC8vIHNraXAgdGhlIHNwYWNlIHRoYXQgd2FzIG91dHB1dCBhcyBcXG5cbiAgICAgIHN0YXJ0ID0gZW5kICsgMTsgICAgICAgICAgICAgICAgICAgIC8vIGRlcml2ZSBzdGFydCA8PSBsZW5ndGgtMVxuICAgIH1cbiAgICBjdXJyID0gbmV4dDtcbiAgfVxuXG4gIC8vIEJ5IHRoZSBpbnZhcmlhbnRzLCBzdGFydCA8PSBsZW5ndGgtMSwgc28gdGhlcmUgaXMgc29tZXRoaW5nIGxlZnQgb3Zlci5cbiAgLy8gSXQgaXMgZWl0aGVyIHRoZSB3aG9sZSBzdHJpbmcgb3IgYSBwYXJ0IHN0YXJ0aW5nIGZyb20gbm9uLXdoaXRlc3BhY2UuXG4gIHJlc3VsdCArPSAnXFxuJztcbiAgLy8gSW5zZXJ0IGEgYnJlYWsgaWYgdGhlIHJlbWFpbmRlciBpcyB0b28gbG9uZyBhbmQgdGhlcmUgaXMgYSBicmVhayBhdmFpbGFibGUuXG4gIGlmIChsaW5lLmxlbmd0aCAtIHN0YXJ0ID4gd2lkdGggJiYgY3VyciA+IHN0YXJ0KSB7XG4gICAgcmVzdWx0ICs9IGxpbmUuc2xpY2Uoc3RhcnQsIGN1cnIpICsgJ1xcbicgKyBsaW5lLnNsaWNlKGN1cnIgKyAxKTtcbiAgfSBlbHNlIHtcbiAgICByZXN1bHQgKz0gbGluZS5zbGljZShzdGFydCk7XG4gIH1cblxuICByZXR1cm4gcmVzdWx0LnNsaWNlKDEpOyAvLyBkcm9wIGV4dHJhIFxcbiBqb2luZXJcbn1cblxuLy8gRXNjYXBlcyBhIGRvdWJsZS1xdW90ZWQgc3RyaW5nLlxuZnVuY3Rpb24gZXNjYXBlU3RyaW5nKHN0cmluZykge1xuICB2YXIgcmVzdWx0ID0gJyc7XG4gIHZhciBjaGFyLCBuZXh0Q2hhcjtcbiAgdmFyIGVzY2FwZVNlcTtcblxuICBmb3IgKHZhciBpID0gMDsgaSA8IHN0cmluZy5sZW5ndGg7IGkrKykge1xuICAgIGNoYXIgPSBzdHJpbmcuY2hhckNvZGVBdChpKTtcbiAgICAvLyBDaGVjayBmb3Igc3Vycm9nYXRlIHBhaXJzIChyZWZlcmVuY2UgVW5pY29kZSAzLjAgc2VjdGlvbiBcIjMuNyBTdXJyb2dhdGVzXCIpLlxuICAgIGlmIChjaGFyID49IDB4RDgwMCAmJiBjaGFyIDw9IDB4REJGRi8qIGhpZ2ggc3Vycm9nYXRlICovKSB7XG4gICAgICBuZXh0Q2hhciA9IHN0cmluZy5jaGFyQ29kZUF0KGkgKyAxKTtcbiAgICAgIGlmIChuZXh0Q2hhciA+PSAweERDMDAgJiYgbmV4dENoYXIgPD0gMHhERkZGLyogbG93IHN1cnJvZ2F0ZSAqLykge1xuICAgICAgICAvLyBDb21iaW5lIHRoZSBzdXJyb2dhdGUgcGFpciBhbmQgc3RvcmUgaXQgZXNjYXBlZC5cbiAgICAgICAgcmVzdWx0ICs9IGVuY29kZUhleCgoY2hhciAtIDB4RDgwMCkgKiAweDQwMCArIG5leHRDaGFyIC0gMHhEQzAwICsgMHgxMDAwMCk7XG4gICAgICAgIC8vIEFkdmFuY2UgaW5kZXggb25lIGV4dHJhIHNpbmNlIHdlIGFscmVhZHkgdXNlZCB0aGF0IGNoYXIgaGVyZS5cbiAgICAgICAgaSsrOyBjb250aW51ZTtcbiAgICAgIH1cbiAgICB9XG4gICAgZXNjYXBlU2VxID0gRVNDQVBFX1NFUVVFTkNFU1tjaGFyXTtcbiAgICByZXN1bHQgKz0gIWVzY2FwZVNlcSAmJiBpc1ByaW50YWJsZShjaGFyKVxuICAgICAgPyBzdHJpbmdbaV1cbiAgICAgIDogZXNjYXBlU2VxIHx8IGVuY29kZUhleChjaGFyKTtcbiAgfVxuXG4gIHJldHVybiByZXN1bHQ7XG59XG5cbmZ1bmN0aW9uIHdyaXRlRmxvd1NlcXVlbmNlKHN0YXRlLCBsZXZlbCwgb2JqZWN0KSB7XG4gIHZhciBfcmVzdWx0ID0gJycsXG4gICAgICBfdGFnICAgID0gc3RhdGUudGFnLFxuICAgICAgaW5kZXgsXG4gICAgICBsZW5ndGg7XG5cbiAgZm9yIChpbmRleCA9IDAsIGxlbmd0aCA9IG9iamVjdC5sZW5ndGg7IGluZGV4IDwgbGVuZ3RoOyBpbmRleCArPSAxKSB7XG4gICAgLy8gV3JpdGUgb25seSB2YWxpZCBlbGVtZW50cy5cbiAgICBpZiAod3JpdGVOb2RlKHN0YXRlLCBsZXZlbCwgb2JqZWN0W2luZGV4XSwgZmFsc2UsIGZhbHNlKSkge1xuICAgICAgaWYgKGluZGV4ICE9PSAwKSBfcmVzdWx0ICs9ICcsJyArICghc3RhdGUuY29uZGVuc2VGbG93ID8gJyAnIDogJycpO1xuICAgICAgX3Jlc3VsdCArPSBzdGF0ZS5kdW1wO1xuICAgIH1cbiAgfVxuXG4gIHN0YXRlLnRhZyA9IF90YWc7XG4gIHN0YXRlLmR1bXAgPSAnWycgKyBfcmVzdWx0ICsgJ10nO1xufVxuXG5mdW5jdGlvbiB3cml0ZUJsb2NrU2VxdWVuY2Uoc3RhdGUsIGxldmVsLCBvYmplY3QsIGNvbXBhY3QpIHtcbiAgdmFyIF9yZXN1bHQgPSAnJyxcbiAgICAgIF90YWcgICAgPSBzdGF0ZS50YWcsXG4gICAgICBpbmRleCxcbiAgICAgIGxlbmd0aDtcblxuICBmb3IgKGluZGV4ID0gMCwgbGVuZ3RoID0gb2JqZWN0Lmxlbmd0aDsgaW5kZXggPCBsZW5ndGg7IGluZGV4ICs9IDEpIHtcbiAgICAvLyBXcml0ZSBvbmx5IHZhbGlkIGVsZW1lbnRzLlxuICAgIGlmICh3cml0ZU5vZGUoc3RhdGUsIGxldmVsICsgMSwgb2JqZWN0W2luZGV4XSwgdHJ1ZSwgdHJ1ZSkpIHtcbiAgICAgIGlmICghY29tcGFjdCB8fCBpbmRleCAhPT0gMCkge1xuICAgICAgICBfcmVzdWx0ICs9IGdlbmVyYXRlTmV4dExpbmUoc3RhdGUsIGxldmVsKTtcbiAgICAgIH1cblxuICAgICAgaWYgKHN0YXRlLmR1bXAgJiYgQ0hBUl9MSU5FX0ZFRUQgPT09IHN0YXRlLmR1bXAuY2hhckNvZGVBdCgwKSkge1xuICAgICAgICBfcmVzdWx0ICs9ICctJztcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIF9yZXN1bHQgKz0gJy0gJztcbiAgICAgIH1cblxuICAgICAgX3Jlc3VsdCArPSBzdGF0ZS5kdW1wO1xuICAgIH1cbiAgfVxuXG4gIHN0YXRlLnRhZyA9IF90YWc7XG4gIHN0YXRlLmR1bXAgPSBfcmVzdWx0IHx8ICdbXSc7IC8vIEVtcHR5IHNlcXVlbmNlIGlmIG5vIHZhbGlkIHZhbHVlcy5cbn1cblxuZnVuY3Rpb24gd3JpdGVGbG93TWFwcGluZyhzdGF0ZSwgbGV2ZWwsIG9iamVjdCkge1xuICB2YXIgX3Jlc3VsdCAgICAgICA9ICcnLFxuICAgICAgX3RhZyAgICAgICAgICA9IHN0YXRlLnRhZyxcbiAgICAgIG9iamVjdEtleUxpc3QgPSBPYmplY3Qua2V5cyhvYmplY3QpLFxuICAgICAgaW5kZXgsXG4gICAgICBsZW5ndGgsXG4gICAgICBvYmplY3RLZXksXG4gICAgICBvYmplY3RWYWx1ZSxcbiAgICAgIHBhaXJCdWZmZXI7XG5cbiAgZm9yIChpbmRleCA9IDAsIGxlbmd0aCA9IG9iamVjdEtleUxpc3QubGVuZ3RoOyBpbmRleCA8IGxlbmd0aDsgaW5kZXggKz0gMSkge1xuXG4gICAgcGFpckJ1ZmZlciA9ICcnO1xuICAgIGlmIChpbmRleCAhPT0gMCkgcGFpckJ1ZmZlciArPSAnLCAnO1xuXG4gICAgaWYgKHN0YXRlLmNvbmRlbnNlRmxvdykgcGFpckJ1ZmZlciArPSAnXCInO1xuXG4gICAgb2JqZWN0S2V5ID0gb2JqZWN0S2V5TGlzdFtpbmRleF07XG4gICAgb2JqZWN0VmFsdWUgPSBvYmplY3Rbb2JqZWN0S2V5XTtcblxuICAgIGlmICghd3JpdGVOb2RlKHN0YXRlLCBsZXZlbCwgb2JqZWN0S2V5LCBmYWxzZSwgZmFsc2UpKSB7XG4gICAgICBjb250aW51ZTsgLy8gU2tpcCB0aGlzIHBhaXIgYmVjYXVzZSBvZiBpbnZhbGlkIGtleTtcbiAgICB9XG5cbiAgICBpZiAoc3RhdGUuZHVtcC5sZW5ndGggPiAxMDI0KSBwYWlyQnVmZmVyICs9ICc/ICc7XG5cbiAgICBwYWlyQnVmZmVyICs9IHN0YXRlLmR1bXAgKyAoc3RhdGUuY29uZGVuc2VGbG93ID8gJ1wiJyA6ICcnKSArICc6JyArIChzdGF0ZS5jb25kZW5zZUZsb3cgPyAnJyA6ICcgJyk7XG5cbiAgICBpZiAoIXdyaXRlTm9kZShzdGF0ZSwgbGV2ZWwsIG9iamVjdFZhbHVlLCBmYWxzZSwgZmFsc2UpKSB7XG4gICAgICBjb250aW51ZTsgLy8gU2tpcCB0aGlzIHBhaXIgYmVjYXVzZSBvZiBpbnZhbGlkIHZhbHVlLlxuICAgIH1cblxuICAgIHBhaXJCdWZmZXIgKz0gc3RhdGUuZHVtcDtcblxuICAgIC8vIEJvdGgga2V5IGFuZCB2YWx1ZSBhcmUgdmFsaWQuXG4gICAgX3Jlc3VsdCArPSBwYWlyQnVmZmVyO1xuICB9XG5cbiAgc3RhdGUudGFnID0gX3RhZztcbiAgc3RhdGUuZHVtcCA9ICd7JyArIF9yZXN1bHQgKyAnfSc7XG59XG5cbmZ1bmN0aW9uIHdyaXRlQmxvY2tNYXBwaW5nKHN0YXRlLCBsZXZlbCwgb2JqZWN0LCBjb21wYWN0KSB7XG4gIHZhciBfcmVzdWx0ICAgICAgID0gJycsXG4gICAgICBfdGFnICAgICAgICAgID0gc3RhdGUudGFnLFxuICAgICAgb2JqZWN0S2V5TGlzdCA9IE9iamVjdC5rZXlzKG9iamVjdCksXG4gICAgICBpbmRleCxcbiAgICAgIGxlbmd0aCxcbiAgICAgIG9iamVjdEtleSxcbiAgICAgIG9iamVjdFZhbHVlLFxuICAgICAgZXhwbGljaXRQYWlyLFxuICAgICAgcGFpckJ1ZmZlcjtcblxuICAvLyBBbGxvdyBzb3J0aW5nIGtleXMgc28gdGhhdCB0aGUgb3V0cHV0IGZpbGUgaXMgZGV0ZXJtaW5pc3RpY1xuICBpZiAoc3RhdGUuc29ydEtleXMgPT09IHRydWUpIHtcbiAgICAvLyBEZWZhdWx0IHNvcnRpbmdcbiAgICBvYmplY3RLZXlMaXN0LnNvcnQoKTtcbiAgfSBlbHNlIGlmICh0eXBlb2Ygc3RhdGUuc29ydEtleXMgPT09ICdmdW5jdGlvbicpIHtcbiAgICAvLyBDdXN0b20gc29ydCBmdW5jdGlvblxuICAgIG9iamVjdEtleUxpc3Quc29ydChzdGF0ZS5zb3J0S2V5cyk7XG4gIH0gZWxzZSBpZiAoc3RhdGUuc29ydEtleXMpIHtcbiAgICAvLyBTb21ldGhpbmcgaXMgd3JvbmdcbiAgICB0aHJvdyBuZXcgWUFNTEV4Y2VwdGlvbignc29ydEtleXMgbXVzdCBiZSBhIGJvb2xlYW4gb3IgYSBmdW5jdGlvbicpO1xuICB9XG5cbiAgZm9yIChpbmRleCA9IDAsIGxlbmd0aCA9IG9iamVjdEtleUxpc3QubGVuZ3RoOyBpbmRleCA8IGxlbmd0aDsgaW5kZXggKz0gMSkge1xuICAgIHBhaXJCdWZmZXIgPSAnJztcblxuICAgIGlmICghY29tcGFjdCB8fCBpbmRleCAhPT0gMCkge1xuICAgICAgcGFpckJ1ZmZlciArPSBnZW5lcmF0ZU5leHRMaW5lKHN0YXRlLCBsZXZlbCk7XG4gICAgfVxuXG4gICAgb2JqZWN0S2V5ID0gb2JqZWN0S2V5TGlzdFtpbmRleF07XG4gICAgb2JqZWN0VmFsdWUgPSBvYmplY3Rbb2JqZWN0S2V5XTtcblxuICAgIGlmICghd3JpdGVOb2RlKHN0YXRlLCBsZXZlbCArIDEsIG9iamVjdEtleSwgdHJ1ZSwgdHJ1ZSwgdHJ1ZSkpIHtcbiAgICAgIGNvbnRpbnVlOyAvLyBTa2lwIHRoaXMgcGFpciBiZWNhdXNlIG9mIGludmFsaWQga2V5LlxuICAgIH1cblxuICAgIGV4cGxpY2l0UGFpciA9IChzdGF0ZS50YWcgIT09IG51bGwgJiYgc3RhdGUudGFnICE9PSAnPycpIHx8XG4gICAgICAgICAgICAgICAgICAgKHN0YXRlLmR1bXAgJiYgc3RhdGUuZHVtcC5sZW5ndGggPiAxMDI0KTtcblxuICAgIGlmIChleHBsaWNpdFBhaXIpIHtcbiAgICAgIGlmIChzdGF0ZS5kdW1wICYmIENIQVJfTElORV9GRUVEID09PSBzdGF0ZS5kdW1wLmNoYXJDb2RlQXQoMCkpIHtcbiAgICAgICAgcGFpckJ1ZmZlciArPSAnPyc7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBwYWlyQnVmZmVyICs9ICc/ICc7XG4gICAgICB9XG4gICAgfVxuXG4gICAgcGFpckJ1ZmZlciArPSBzdGF0ZS5kdW1wO1xuXG4gICAgaWYgKGV4cGxpY2l0UGFpcikge1xuICAgICAgcGFpckJ1ZmZlciArPSBnZW5lcmF0ZU5leHRMaW5lKHN0YXRlLCBsZXZlbCk7XG4gICAgfVxuXG4gICAgaWYgKCF3cml0ZU5vZGUoc3RhdGUsIGxldmVsICsgMSwgb2JqZWN0VmFsdWUsIHRydWUsIGV4cGxpY2l0UGFpcikpIHtcbiAgICAgIGNvbnRpbnVlOyAvLyBTa2lwIHRoaXMgcGFpciBiZWNhdXNlIG9mIGludmFsaWQgdmFsdWUuXG4gICAgfVxuXG4gICAgaWYgKHN0YXRlLmR1bXAgJiYgQ0hBUl9MSU5FX0ZFRUQgPT09IHN0YXRlLmR1bXAuY2hhckNvZGVBdCgwKSkge1xuICAgICAgcGFpckJ1ZmZlciArPSAnOic7XG4gICAgfSBlbHNlIHtcbiAgICAgIHBhaXJCdWZmZXIgKz0gJzogJztcbiAgICB9XG5cbiAgICBwYWlyQnVmZmVyICs9IHN0YXRlLmR1bXA7XG5cbiAgICAvLyBCb3RoIGtleSBhbmQgdmFsdWUgYXJlIHZhbGlkLlxuICAgIF9yZXN1bHQgKz0gcGFpckJ1ZmZlcjtcbiAgfVxuXG4gIHN0YXRlLnRhZyA9IF90YWc7XG4gIHN0YXRlLmR1bXAgPSBfcmVzdWx0IHx8ICd7fSc7IC8vIEVtcHR5IG1hcHBpbmcgaWYgbm8gdmFsaWQgcGFpcnMuXG59XG5cbmZ1bmN0aW9uIGRldGVjdFR5cGUoc3RhdGUsIG9iamVjdCwgZXhwbGljaXQpIHtcbiAgdmFyIF9yZXN1bHQsIHR5cGVMaXN0LCBpbmRleCwgbGVuZ3RoLCB0eXBlLCBzdHlsZTtcblxuICB0eXBlTGlzdCA9IGV4cGxpY2l0ID8gc3RhdGUuZXhwbGljaXRUeXBlcyA6IHN0YXRlLmltcGxpY2l0VHlwZXM7XG5cbiAgZm9yIChpbmRleCA9IDAsIGxlbmd0aCA9IHR5cGVMaXN0Lmxlbmd0aDsgaW5kZXggPCBsZW5ndGg7IGluZGV4ICs9IDEpIHtcbiAgICB0eXBlID0gdHlwZUxpc3RbaW5kZXhdO1xuXG4gICAgaWYgKCh0eXBlLmluc3RhbmNlT2YgIHx8IHR5cGUucHJlZGljYXRlKSAmJlxuICAgICAgICAoIXR5cGUuaW5zdGFuY2VPZiB8fCAoKHR5cGVvZiBvYmplY3QgPT09ICdvYmplY3QnKSAmJiAob2JqZWN0IGluc3RhbmNlb2YgdHlwZS5pbnN0YW5jZU9mKSkpICYmXG4gICAgICAgICghdHlwZS5wcmVkaWNhdGUgIHx8IHR5cGUucHJlZGljYXRlKG9iamVjdCkpKSB7XG5cbiAgICAgIHN0YXRlLnRhZyA9IGV4cGxpY2l0ID8gdHlwZS50YWcgOiAnPyc7XG5cbiAgICAgIGlmICh0eXBlLnJlcHJlc2VudCkge1xuICAgICAgICBzdHlsZSA9IHN0YXRlLnN0eWxlTWFwW3R5cGUudGFnXSB8fCB0eXBlLmRlZmF1bHRTdHlsZTtcblxuICAgICAgICBpZiAoX3RvU3RyaW5nLmNhbGwodHlwZS5yZXByZXNlbnQpID09PSAnW29iamVjdCBGdW5jdGlvbl0nKSB7XG4gICAgICAgICAgX3Jlc3VsdCA9IHR5cGUucmVwcmVzZW50KG9iamVjdCwgc3R5bGUpO1xuICAgICAgICB9IGVsc2UgaWYgKF9oYXNPd25Qcm9wZXJ0eS5jYWxsKHR5cGUucmVwcmVzZW50LCBzdHlsZSkpIHtcbiAgICAgICAgICBfcmVzdWx0ID0gdHlwZS5yZXByZXNlbnRbc3R5bGVdKG9iamVjdCwgc3R5bGUpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIHRocm93IG5ldyBZQU1MRXhjZXB0aW9uKCchPCcgKyB0eXBlLnRhZyArICc+IHRhZyByZXNvbHZlciBhY2NlcHRzIG5vdCBcIicgKyBzdHlsZSArICdcIiBzdHlsZScpO1xuICAgICAgICB9XG5cbiAgICAgICAgc3RhdGUuZHVtcCA9IF9yZXN1bHQ7XG4gICAgICB9XG5cbiAgICAgIHJldHVybiB0cnVlO1xuICAgIH1cbiAgfVxuXG4gIHJldHVybiBmYWxzZTtcbn1cblxuLy8gU2VyaWFsaXplcyBgb2JqZWN0YCBhbmQgd3JpdGVzIGl0IHRvIGdsb2JhbCBgcmVzdWx0YC5cbi8vIFJldHVybnMgdHJ1ZSBvbiBzdWNjZXNzLCBvciBmYWxzZSBvbiBpbnZhbGlkIG9iamVjdC5cbi8vXG5mdW5jdGlvbiB3cml0ZU5vZGUoc3RhdGUsIGxldmVsLCBvYmplY3QsIGJsb2NrLCBjb21wYWN0LCBpc2tleSkge1xuICBzdGF0ZS50YWcgPSBudWxsO1xuICBzdGF0ZS5kdW1wID0gb2JqZWN0O1xuXG4gIGlmICghZGV0ZWN0VHlwZShzdGF0ZSwgb2JqZWN0LCBmYWxzZSkpIHtcbiAgICBkZXRlY3RUeXBlKHN0YXRlLCBvYmplY3QsIHRydWUpO1xuICB9XG5cbiAgdmFyIHR5cGUgPSBfdG9TdHJpbmcuY2FsbChzdGF0ZS5kdW1wKTtcblxuICBpZiAoYmxvY2spIHtcbiAgICBibG9jayA9IChzdGF0ZS5mbG93TGV2ZWwgPCAwIHx8IHN0YXRlLmZsb3dMZXZlbCA+IGxldmVsKTtcbiAgfVxuXG4gIHZhciBvYmplY3RPckFycmF5ID0gdHlwZSA9PT0gJ1tvYmplY3QgT2JqZWN0XScgfHwgdHlwZSA9PT0gJ1tvYmplY3QgQXJyYXldJyxcbiAgICAgIGR1cGxpY2F0ZUluZGV4LFxuICAgICAgZHVwbGljYXRlO1xuXG4gIGlmIChvYmplY3RPckFycmF5KSB7XG4gICAgZHVwbGljYXRlSW5kZXggPSBzdGF0ZS5kdXBsaWNhdGVzLmluZGV4T2Yob2JqZWN0KTtcbiAgICBkdXBsaWNhdGUgPSBkdXBsaWNhdGVJbmRleCAhPT0gLTE7XG4gIH1cblxuICBpZiAoKHN0YXRlLnRhZyAhPT0gbnVsbCAmJiBzdGF0ZS50YWcgIT09ICc/JykgfHwgZHVwbGljYXRlIHx8IChzdGF0ZS5pbmRlbnQgIT09IDIgJiYgbGV2ZWwgPiAwKSkge1xuICAgIGNvbXBhY3QgPSBmYWxzZTtcbiAgfVxuXG4gIGlmIChkdXBsaWNhdGUgJiYgc3RhdGUudXNlZER1cGxpY2F0ZXNbZHVwbGljYXRlSW5kZXhdKSB7XG4gICAgc3RhdGUuZHVtcCA9ICcqcmVmXycgKyBkdXBsaWNhdGVJbmRleDtcbiAgfSBlbHNlIHtcbiAgICBpZiAob2JqZWN0T3JBcnJheSAmJiBkdXBsaWNhdGUgJiYgIXN0YXRlLnVzZWREdXBsaWNhdGVzW2R1cGxpY2F0ZUluZGV4XSkge1xuICAgICAgc3RhdGUudXNlZER1cGxpY2F0ZXNbZHVwbGljYXRlSW5kZXhdID0gdHJ1ZTtcbiAgICB9XG4gICAgaWYgKHR5cGUgPT09ICdbb2JqZWN0IE9iamVjdF0nKSB7XG4gICAgICBpZiAoYmxvY2sgJiYgKE9iamVjdC5rZXlzKHN0YXRlLmR1bXApLmxlbmd0aCAhPT0gMCkpIHtcbiAgICAgICAgd3JpdGVCbG9ja01hcHBpbmcoc3RhdGUsIGxldmVsLCBzdGF0ZS5kdW1wLCBjb21wYWN0KTtcbiAgICAgICAgaWYgKGR1cGxpY2F0ZSkge1xuICAgICAgICAgIHN0YXRlLmR1bXAgPSAnJnJlZl8nICsgZHVwbGljYXRlSW5kZXggKyBzdGF0ZS5kdW1wO1xuICAgICAgICB9XG4gICAgICB9IGVsc2Uge1xuICAgICAgICB3cml0ZUZsb3dNYXBwaW5nKHN0YXRlLCBsZXZlbCwgc3RhdGUuZHVtcCk7XG4gICAgICAgIGlmIChkdXBsaWNhdGUpIHtcbiAgICAgICAgICBzdGF0ZS5kdW1wID0gJyZyZWZfJyArIGR1cGxpY2F0ZUluZGV4ICsgJyAnICsgc3RhdGUuZHVtcDtcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH0gZWxzZSBpZiAodHlwZSA9PT0gJ1tvYmplY3QgQXJyYXldJykge1xuICAgICAgdmFyIGFycmF5TGV2ZWwgPSAoc3RhdGUubm9BcnJheUluZGVudCAmJiAobGV2ZWwgPiAwKSkgPyBsZXZlbCAtIDEgOiBsZXZlbDtcbiAgICAgIGlmIChibG9jayAmJiAoc3RhdGUuZHVtcC5sZW5ndGggIT09IDApKSB7XG4gICAgICAgIHdyaXRlQmxvY2tTZXF1ZW5jZShzdGF0ZSwgYXJyYXlMZXZlbCwgc3RhdGUuZHVtcCwgY29tcGFjdCk7XG4gICAgICAgIGlmIChkdXBsaWNhdGUpIHtcbiAgICAgICAgICBzdGF0ZS5kdW1wID0gJyZyZWZfJyArIGR1cGxpY2F0ZUluZGV4ICsgc3RhdGUuZHVtcDtcbiAgICAgICAgfVxuICAgICAgfSBlbHNlIHtcbiAgICAgICAgd3JpdGVGbG93U2VxdWVuY2Uoc3RhdGUsIGFycmF5TGV2ZWwsIHN0YXRlLmR1bXApO1xuICAgICAgICBpZiAoZHVwbGljYXRlKSB7XG4gICAgICAgICAgc3RhdGUuZHVtcCA9ICcmcmVmXycgKyBkdXBsaWNhdGVJbmRleCArICcgJyArIHN0YXRlLmR1bXA7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9IGVsc2UgaWYgKHR5cGUgPT09ICdbb2JqZWN0IFN0cmluZ10nKSB7XG4gICAgICBpZiAoc3RhdGUudGFnICE9PSAnPycpIHtcbiAgICAgICAgd3JpdGVTY2FsYXIoc3RhdGUsIHN0YXRlLmR1bXAsIGxldmVsLCBpc2tleSk7XG4gICAgICB9XG4gICAgfSBlbHNlIHtcbiAgICAgIGlmIChzdGF0ZS5za2lwSW52YWxpZCkgcmV0dXJuIGZhbHNlO1xuICAgICAgdGhyb3cgbmV3IFlBTUxFeGNlcHRpb24oJ3VuYWNjZXB0YWJsZSBraW5kIG9mIGFuIG9iamVjdCB0byBkdW1wICcgKyB0eXBlKTtcbiAgICB9XG5cbiAgICBpZiAoc3RhdGUudGFnICE9PSBudWxsICYmIHN0YXRlLnRhZyAhPT0gJz8nKSB7XG4gICAgICBzdGF0ZS5kdW1wID0gJyE8JyArIHN0YXRlLnRhZyArICc+ICcgKyBzdGF0ZS5kdW1wO1xuICAgIH1cbiAgfVxuXG4gIHJldHVybiB0cnVlO1xufVxuXG5mdW5jdGlvbiBnZXREdXBsaWNhdGVSZWZlcmVuY2VzKG9iamVjdCwgc3RhdGUpIHtcbiAgdmFyIG9iamVjdHMgPSBbXSxcbiAgICAgIGR1cGxpY2F0ZXNJbmRleGVzID0gW10sXG4gICAgICBpbmRleCxcbiAgICAgIGxlbmd0aDtcblxuICBpbnNwZWN0Tm9kZShvYmplY3QsIG9iamVjdHMsIGR1cGxpY2F0ZXNJbmRleGVzKTtcblxuICBmb3IgKGluZGV4ID0gMCwgbGVuZ3RoID0gZHVwbGljYXRlc0luZGV4ZXMubGVuZ3RoOyBpbmRleCA8IGxlbmd0aDsgaW5kZXggKz0gMSkge1xuICAgIHN0YXRlLmR1cGxpY2F0ZXMucHVzaChvYmplY3RzW2R1cGxpY2F0ZXNJbmRleGVzW2luZGV4XV0pO1xuICB9XG4gIHN0YXRlLnVzZWREdXBsaWNhdGVzID0gbmV3IEFycmF5KGxlbmd0aCk7XG59XG5cbmZ1bmN0aW9uIGluc3BlY3ROb2RlKG9iamVjdCwgb2JqZWN0cywgZHVwbGljYXRlc0luZGV4ZXMpIHtcbiAgdmFyIG9iamVjdEtleUxpc3QsXG4gICAgICBpbmRleCxcbiAgICAgIGxlbmd0aDtcblxuICBpZiAob2JqZWN0ICE9PSBudWxsICYmIHR5cGVvZiBvYmplY3QgPT09ICdvYmplY3QnKSB7XG4gICAgaW5kZXggPSBvYmplY3RzLmluZGV4T2Yob2JqZWN0KTtcbiAgICBpZiAoaW5kZXggIT09IC0xKSB7XG4gICAgICBpZiAoZHVwbGljYXRlc0luZGV4ZXMuaW5kZXhPZihpbmRleCkgPT09IC0xKSB7XG4gICAgICAgIGR1cGxpY2F0ZXNJbmRleGVzLnB1c2goaW5kZXgpO1xuICAgICAgfVxuICAgIH0gZWxzZSB7XG4gICAgICBvYmplY3RzLnB1c2gob2JqZWN0KTtcblxuICAgICAgaWYgKEFycmF5LmlzQXJyYXkob2JqZWN0KSkge1xuICAgICAgICBmb3IgKGluZGV4ID0gMCwgbGVuZ3RoID0gb2JqZWN0Lmxlbmd0aDsgaW5kZXggPCBsZW5ndGg7IGluZGV4ICs9IDEpIHtcbiAgICAgICAgICBpbnNwZWN0Tm9kZShvYmplY3RbaW5kZXhdLCBvYmplY3RzLCBkdXBsaWNhdGVzSW5kZXhlcyk7XG4gICAgICAgIH1cbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIG9iamVjdEtleUxpc3QgPSBPYmplY3Qua2V5cyhvYmplY3QpO1xuXG4gICAgICAgIGZvciAoaW5kZXggPSAwLCBsZW5ndGggPSBvYmplY3RLZXlMaXN0Lmxlbmd0aDsgaW5kZXggPCBsZW5ndGg7IGluZGV4ICs9IDEpIHtcbiAgICAgICAgICBpbnNwZWN0Tm9kZShvYmplY3Rbb2JqZWN0S2V5TGlzdFtpbmRleF1dLCBvYmplY3RzLCBkdXBsaWNhdGVzSW5kZXhlcyk7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9XG4gIH1cbn1cblxuZnVuY3Rpb24gZHVtcChpbnB1dCwgb3B0aW9ucykge1xuICBvcHRpb25zID0gb3B0aW9ucyB8fCB7fTtcblxuICB2YXIgc3RhdGUgPSBuZXcgU3RhdGUob3B0aW9ucyk7XG5cbiAgaWYgKCFzdGF0ZS5ub1JlZnMpIGdldER1cGxpY2F0ZVJlZmVyZW5jZXMoaW5wdXQsIHN0YXRlKTtcblxuICBpZiAod3JpdGVOb2RlKHN0YXRlLCAwLCBpbnB1dCwgdHJ1ZSwgdHJ1ZSkpIHJldHVybiBzdGF0ZS5kdW1wICsgJ1xcbic7XG5cbiAgcmV0dXJuICcnO1xufVxuXG5mdW5jdGlvbiBzYWZlRHVtcChpbnB1dCwgb3B0aW9ucykge1xuICByZXR1cm4gZHVtcChpbnB1dCwgY29tbW9uLmV4dGVuZCh7IHNjaGVtYTogREVGQVVMVF9TQUZFX1NDSEVNQSB9LCBvcHRpb25zKSk7XG59XG5cbm1vZHVsZS5leHBvcnRzLmR1bXAgICAgID0gZHVtcDtcbm1vZHVsZS5leHBvcnRzLnNhZmVEdW1wID0gc2FmZUR1bXA7XG4iLCIndXNlIHN0cmljdCc7XG5cblxudmFyIGxvYWRlciA9IHJlcXVpcmUoJy4vanMteWFtbC9sb2FkZXInKTtcbnZhciBkdW1wZXIgPSByZXF1aXJlKCcuL2pzLXlhbWwvZHVtcGVyJyk7XG5cblxuZnVuY3Rpb24gZGVwcmVjYXRlZChuYW1lKSB7XG4gIHJldHVybiBmdW5jdGlvbiAoKSB7XG4gICAgdGhyb3cgbmV3IEVycm9yKCdGdW5jdGlvbiAnICsgbmFtZSArICcgaXMgZGVwcmVjYXRlZCBhbmQgY2Fubm90IGJlIHVzZWQuJyk7XG4gIH07XG59XG5cblxubW9kdWxlLmV4cG9ydHMuVHlwZSAgICAgICAgICAgICAgICA9IHJlcXVpcmUoJy4vanMteWFtbC90eXBlJyk7XG5tb2R1bGUuZXhwb3J0cy5TY2hlbWEgICAgICAgICAgICAgID0gcmVxdWlyZSgnLi9qcy15YW1sL3NjaGVtYScpO1xubW9kdWxlLmV4cG9ydHMuRkFJTFNBRkVfU0NIRU1BICAgICA9IHJlcXVpcmUoJy4vanMteWFtbC9zY2hlbWEvZmFpbHNhZmUnKTtcbm1vZHVsZS5leHBvcnRzLkpTT05fU0NIRU1BICAgICAgICAgPSByZXF1aXJlKCcuL2pzLXlhbWwvc2NoZW1hL2pzb24nKTtcbm1vZHVsZS5leHBvcnRzLkNPUkVfU0NIRU1BICAgICAgICAgPSByZXF1aXJlKCcuL2pzLXlhbWwvc2NoZW1hL2NvcmUnKTtcbm1vZHVsZS5leHBvcnRzLkRFRkFVTFRfU0FGRV9TQ0hFTUEgPSByZXF1aXJlKCcuL2pzLXlhbWwvc2NoZW1hL2RlZmF1bHRfc2FmZScpO1xubW9kdWxlLmV4cG9ydHMuREVGQVVMVF9GVUxMX1NDSEVNQSA9IHJlcXVpcmUoJy4vanMteWFtbC9zY2hlbWEvZGVmYXVsdF9mdWxsJyk7XG5tb2R1bGUuZXhwb3J0cy5sb2FkICAgICAgICAgICAgICAgID0gbG9hZGVyLmxvYWQ7XG5tb2R1bGUuZXhwb3J0cy5sb2FkQWxsICAgICAgICAgICAgID0gbG9hZGVyLmxvYWRBbGw7XG5tb2R1bGUuZXhwb3J0cy5zYWZlTG9hZCAgICAgICAgICAgID0gbG9hZGVyLnNhZmVMb2FkO1xubW9kdWxlLmV4cG9ydHMuc2FmZUxvYWRBbGwgICAgICAgICA9IGxvYWRlci5zYWZlTG9hZEFsbDtcbm1vZHVsZS5leHBvcnRzLmR1bXAgICAgICAgICAgICAgICAgPSBkdW1wZXIuZHVtcDtcbm1vZHVsZS5leHBvcnRzLnNhZmVEdW1wICAgICAgICAgICAgPSBkdW1wZXIuc2FmZUR1bXA7XG5tb2R1bGUuZXhwb3J0cy5ZQU1MRXhjZXB0aW9uICAgICAgID0gcmVxdWlyZSgnLi9qcy15YW1sL2V4Y2VwdGlvbicpO1xuXG4vLyBEZXByZWNhdGVkIHNjaGVtYSBuYW1lcyBmcm9tIEpTLVlBTUwgMi4wLnhcbm1vZHVsZS5leHBvcnRzLk1JTklNQUxfU0NIRU1BID0gcmVxdWlyZSgnLi9qcy15YW1sL3NjaGVtYS9mYWlsc2FmZScpO1xubW9kdWxlLmV4cG9ydHMuU0FGRV9TQ0hFTUEgICAgPSByZXF1aXJlKCcuL2pzLXlhbWwvc2NoZW1hL2RlZmF1bHRfc2FmZScpO1xubW9kdWxlLmV4cG9ydHMuREVGQVVMVF9TQ0hFTUEgPSByZXF1aXJlKCcuL2pzLXlhbWwvc2NoZW1hL2RlZmF1bHRfZnVsbCcpO1xuXG4vLyBEZXByZWNhdGVkIGZ1bmN0aW9ucyBmcm9tIEpTLVlBTUwgMS54Lnhcbm1vZHVsZS5leHBvcnRzLnNjYW4gICAgICAgICAgID0gZGVwcmVjYXRlZCgnc2NhbicpO1xubW9kdWxlLmV4cG9ydHMucGFyc2UgICAgICAgICAgPSBkZXByZWNhdGVkKCdwYXJzZScpO1xubW9kdWxlLmV4cG9ydHMuY29tcG9zZSAgICAgICAgPSBkZXByZWNhdGVkKCdjb21wb3NlJyk7XG5tb2R1bGUuZXhwb3J0cy5hZGRDb25zdHJ1Y3RvciA9IGRlcHJlY2F0ZWQoJ2FkZENvbnN0cnVjdG9yJyk7XG4iLCIndXNlIHN0cmljdCc7XG5cblxudmFyIHlhbWwgPSByZXF1aXJlKCcuL2xpYi9qcy15YW1sLmpzJyk7XG5cblxubW9kdWxlLmV4cG9ydHMgPSB5YW1sO1xuIiwiZXhwb3J0IGNvbnN0IE1BSU5fSU5URVJGQUNFX0NMQVNTID0gXCJibGFjay1hcHBsZVwiO1xuZXhwb3J0IGNvbnN0IERFTElNSVRFUiA9IFwifFwiO1xuXG5leHBvcnQgY29uc3QgVEFTS19MSVNUX0NMQVNTID0gXCJjb250YWlucy10YXNrLWxpc3RcIjtcbmV4cG9ydCBjb25zdCBSRU1JTkRFUlNfQ0xBU1MgPSBcInJlbWluZGVyc1wiO1xuZXhwb3J0IGNvbnN0IFRBU0tfTElTVF9JVEVNX0NMQVNTID0gXCJ0YXNrLWxpc3QtaXRlbVwiO1xuXG4vLyA8YSBocmVmPVwiaHR0cHM6Ly9pY29uc2NvdXQuY29tL2ljb25zL2FwcGxlLXJlbWluZGVyc1wiIHRhcmdldD1cIl9ibGFua1wiPkFwcGxlIFJlbWluZGVycyBJY29uPC9hPiBvbiA8YSBocmVmPVwiaHR0cHM6Ly9pY29uc2NvdXQuY29tXCI+SWNvbnNjb3V0PC9hPlxuZXhwb3J0IGNvbnN0IFJpYmJvbkljb24gPSBgPD94bWwgdmVyc2lvbj1cIjEuMFwiIGVuY29kaW5nPVwiVVRGLThcIj8+PHN2ZyB4bWxucz1cImh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnXCIgeG1sbnM6eGxpbms9XCJodHRwOi8vd3d3LnczLm9yZy8xOTk5L3hsaW5rXCIgdmVyc2lvbj1cIjEuMVwiIGlkPVwiTGF5ZXJfMVwiIHg9XCIwcHhcIiB5PVwiMHB4XCIgdmlld0JveD1cIjAgMCAxMDAgMTAwXCIgeG1sOnNwYWNlPVwicHJlc2VydmVcIj48c3R5bGUgdHlwZT1cInRleHQvY3NzXCI+LnN0MHtmaWxsOiM1MTUxNTE7fSAuc3Qxe2ZpbGw6I0I3QjdCNzt9IC5zdDJ7ZmlsbDojRkY5NTAwO30gLnN0M3tmaWxsOiMxQkFERjg7fSAuc3Q0e2ZpbGw6IzYzREEzODt9PC9zdHlsZT48cGF0aCBjbGFzcz1cInN0MFwiIGQ9XCJNODAuNCA2Ny4zYy0zLjEgMC01LjYgMi41LTUuNiA1LjYgMCAzLjEgMi41IDUuNiA1LjYgNS42IDMuMSAwIDUuNi0yLjUgNS42LTUuNiAwLTMuMS0yLjUtNS42LTUuNi01LjZ6bTAgMTAuNWMtMi43IDAtNC45LTIuMi00LjktNC45czIuMi00LjkgNC45LTQuOSA0LjkgMi4yIDQuOSA0LjktMi4yIDQuOS00LjkgNC45elwiIGZpbGw9XCIjRkZGXCIvPjxwYXRoIGNsYXNzPVwic3QwXCIgZD1cIk04MC40IDI0LjVjLTMuMSAwLTUuNiAyLjUtNS42IDUuNiAwIDMuMSAyLjUgNS42IDUuNiA1LjYgMy4xIDAgNS42LTIuNSA1LjYtNS42IDAtMy4xLTIuNS01LjYtNS42LTUuNnptMCAxMC41Yy0yLjcgMC00LjktMi4yLTQuOS00LjlzMi4yLTQuOSA0LjktNC45IDQuOSAyLjIgNC45IDQuOS0yLjIgNC45LTQuOSA0Ljl6XCIgZmlsbD1cIiNGRkZcIi8+PHBhdGggY2xhc3M9XCJzdDBcIiBkPVwiTTgwLjQgNDUuOWMtMy4xIDAtNS42IDIuNS01LjYgNS42czIuNSA1LjYgNS42IDUuNmMzLjEgMCA1LjYtMi41IDUuNi01LjZzLTIuNS01LjYtNS42LTUuNnptMCAxMC41Yy0yLjcgMC00LjktMi4yLTQuOS00LjlzMi4yLTQuOSA0LjktNC45IDQuOSAyLjIgNC45IDQuOS0yLjIgNC45LTQuOSA0Ljl6XCIgZmlsbD1cIiNGRkZcIi8+PHBhdGggY2xhc3M9XCJzdDBcIiBkPVwiTTkzLjUgMThjLTEuOS01LjMtNi4xLTkuNS0xMS40LTExLjRDNzcuMiA1IDcyLjcgNSA2My42IDVIMzYuNGMtOSAwLTEzLjYgMC0xOC40IDEuNUMxMyA4LjMgOSAxMi4xIDcgMTdoNTkuNXYuOEg2LjZ2LjFDNSAyMi44IDUgMjcuMyA1IDM2LjR2My4xaDYxLjV2LjdINXYyMC4zaDYxLjV2LjdINXYyLjRjMCA5IDAgMTMuNiAxLjUgMTguNC4xLjMuMy43LjQgMWg1OS42di44SDcuM2MyLjEgNC40IDYgNy45IDEwLjYgOS42QzIyLjggOTUgMjcuMyA5NSAzNi40IDk1aDI3LjJjOSAwIDEzLjYgMCAxOC40LTEuNSA1LjMtMS45IDkuNS02LjEgMTEuNC0xMS40Qzk1IDc3LjIgOTUgNzIuNyA5NSA2My42VjM2LjRjMC05IDAtMTMuNi0xLjUtMTguNHpNODAuNCA3OS4zYy0zLjUgMC02LjQtMi45LTYuNC02LjRzMi45LTYuNCA2LjQtNi40IDYuNCAyLjkgNi40IDYuNC0yLjkgNi40LTYuNCA2LjR6bTAtMjEuNGMtMy41IDAtNi40LTIuOS02LjQtNi40czIuOS02LjQgNi40LTYuNCA2LjQgMi45IDYuNCA2LjQtMi45IDYuNC02LjQgNi40em0wLTIxLjRjLTMuNSAwLTYuNC0yLjktNi40LTYuNHMyLjktNi40IDYuNC02LjQgNi40IDIuOSA2LjQgNi40LTIuOSA2LjQtNi40IDYuNHpcIiBmaWxsPVwiI0ZGRlwiLz48cGF0aCBjbGFzcz1cInN0MVwiIGQ9XCJNNjYuNSA4My44VjgzSDYuOWMuMS4zLjIuNS4zLjhoNTkuM3pcIiBmaWxsPVwiI0I3QjdCN1wiLz48cGF0aCBjbGFzcz1cInN0MVwiIGZpbGw9XCIjQjdCN0I3XCIgZD1cIk02Ni41IDYxLjJ2LS43SDV2LjdoNjEuMXpcIi8+PHBhdGggY2xhc3M9XCJzdDFcIiBmaWxsPVwiI0I3QjdCN1wiIGQ9XCJNNjYuNSA0MC4ydi0uN0g1di43aDYxLjF6XCIvPjxwYXRoIGNsYXNzPVwic3QxXCIgZD1cIk02Ni41IDE3LjhWMTdIN2MtLjEuMy0uMi41LS4zLjhoNTkuOHpcIiBmaWxsPVwiI0I3QjdCN1wiLz48ZWxsaXBzZSB0cmFuc2Zvcm09XCJtYXRyaXgoMC43MDcxIC0wLjcwNzEgMC43MDcxIDAuNzA3MSAyLjI2NDcgNjUuNjY3NSlcIiBjbGFzcz1cInN0MlwiIGN4PVwiODAuNFwiIGN5PVwiMzAuMVwiIHJ4PVwiNC45XCIgcnk9XCI0LjlcIiBmaWxsPVwiI0ZGOTUwMFwiLz48cGF0aCBjbGFzcz1cInN0MlwiIGQ9XCJNODAuNCAyMy43Yy0zLjUgMC02LjQgMi45LTYuNCA2LjRzMi45IDYuNCA2LjQgNi40IDYuNC0yLjkgNi40LTYuNC0yLjktNi40LTYuNC02LjR6bTAgMTJjLTMuMSAwLTUuNi0yLjUtNS42LTUuNiAwLTMuMSAyLjUtNS42IDUuNi01LjYgMy4xIDAgNS42IDIuNSA1LjYgNS42IDAgMy4xLTIuNSA1LjYtNS42IDUuNnpcIiBmaWxsPVwiI0ZGOTUwMFwiLz48ZWxsaXBzZSB0cmFuc2Zvcm09XCJtYXRyaXgoMC4zODI3IC0wLjkyMzkgMC45MjM5IDAuMzgyNyAyLjA1MjUgMTA2LjA3MTgpXCIgY2xhc3M9XCJzdDNcIiBjeD1cIjgwLjRcIiBjeT1cIjUxLjVcIiByeD1cIjQuOVwiIHJ5PVwiNC45XCIgZmlsbD1cIiMxQkFERjhcIi8+PHBhdGggY2xhc3M9XCJzdDNcIiBkPVwiTTgwLjQgNDUuMWMtMy41IDAtNi40IDIuOS02LjQgNi40czIuOSA2LjQgNi40IDYuNCA2LjQtMi45IDYuNC02LjQtMi45LTYuNC02LjQtNi40em0wIDEyYy0zLjEgMC01LjYtMi41LTUuNi01LjZzMi41LTUuNiA1LjYtNS42YzMuMSAwIDUuNiAyLjUgNS42IDUuNnMtMi41IDUuNi01LjYgNS42elwiIGZpbGw9XCIjMUJBREY4XCIvPjxwYXRoIGNsYXNzPVwic3Q0XCIgZD1cIk04MC40IDY2LjVjLTMuNSAwLTYuNCAyLjktNi40IDYuNHMyLjkgNi40IDYuNCA2LjQgNi40LTIuOSA2LjQtNi40LTIuOS02LjQtNi40LTYuNHptMCAxMmMtMy4xIDAtNS42LTIuNS01LjYtNS42IDAtMy4xIDIuNS01LjYgNS42LTUuNiAzLjEgMCA1LjYgMi41IDUuNiA1LjYgMCAzLjEtMi41IDUuNi01LjYgNS42elwiIGZpbGw9XCIjNjNEQTM4XCIvPjxlbGxpcHNlIHRyYW5zZm9ybT1cIm1hdHJpeCgwLjk3MzIgLTAuMjI5OCAwLjIyOTggMC45NzMyIC0xNC41OTgxIDIwLjQyMjIpXCIgY2xhc3M9XCJzdDRcIiBjeD1cIjgwLjRcIiBjeT1cIjcyLjlcIiByeD1cIjQuOVwiIHJ5PVwiNC45XCIgZmlsbD1cIiM2M0RBMzhcIi8+PG1ldGFkYXRhPjxyZGY6UkRGIHhtbG5zOnJkZj1cImh0dHA6Ly93d3cudzMub3JnLzE5OTkvMDIvMjItcmRmLXN5bnRheC1ucyNcIiB4bWxuczpyZGZzPVwiaHR0cDovL3d3dy53My5vcmcvMjAwMC8wMS9yZGYtc2NoZW1hI1wiIHhtbG5zOmRjPVwiaHR0cDovL3B1cmwub3JnL2RjL2VsZW1lbnRzLzEuMS9cIj48cmRmOkRlc2NyaXB0aW9uIGFib3V0PVwiaHR0cHM6Ly9pY29uc2NvdXQuY29tL2xlZ2FsI2xpY2Vuc2VzXCIgZGM6dGl0bGU9XCJhcHBsZSxyZW1pbmRlcnNcIiBkYzpkZXNjcmlwdGlvbj1cImFwcGxlLHJlbWluZGVyc1wiIGRjOnB1Ymxpc2hlcj1cIkljb25zY291dFwiIGRjOmRhdGU9XCIyMDE3LTEwLTI3XCIgZGM6Zm9ybWF0PVwiaW1hZ2Uvc3ZnK3htbFwiIGRjOmxhbmd1YWdlPVwiZW5cIj48ZGM6Y3JlYXRvcj48cmRmOkJhZz48cmRmOmxpPlZpY29ucyBEZXNpZ248L3JkZjpsaT48L3JkZjpCYWc+PC9kYzpjcmVhdG9yPjwvcmRmOkRlc2NyaXB0aW9uPjwvcmRmOlJERj48L21ldGFkYXRhPjwvc3ZnPmA7IiwiZXhwb3J0IGZ1bmN0aW9uIG1hcFJlcGxhY2VyKGtleTogYW55LCB2YWx1ZTogYW55KSB7XG5cdGlmICh2YWx1ZSBpbnN0YW5jZW9mIE1hcCkge1xuXHRcdHJldHVybiBBcnJheS5mcm9tKHZhbHVlLmVudHJpZXMoKSlcblx0fVxuXHRyZXR1cm4gdmFsdWVcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGxvZ2dlcihzb3VyY2U6T2JqZWN0LCBtc2c6YW55LCBkYXRhPzphbnkpIHtcblx0aWYoZGF0YSlcblx0XHRjb25zb2xlLmxvZyh7XG5cdFx0XHRzb3VyY2UsXG5cdFx0XHRtc2csXG5cdFx0XHRkYXRhXG5cdFx0fSlcblx0ZWxzZVxuICAgIFx0Y29uc29sZS5sb2coe3NvdXJjZSwgbXNnfSk7XG59IiwiaW1wb3J0IHsgUGx1Z2luIH0gZnJvbSBcIm9ic2lkaWFuXCI7XG5cbmltcG9ydCB7IENhY2hlRGF0YSB9IGZyb20gXCIuL2ludGVyZmFjZXNcIjtcbmltcG9ydCB7IGxvZ2dlciB9IGZyb20gXCIuL3Rvb2xzXCI7XG5cbmV4cG9ydCBjbGFzcyBTdGF0dXNCYXIge1xuICAgIHN0YXR1c0JhcjogSFRNTEVsZW1lbnQ7XG4gICAgbG9hZGVycyA9IG5ldyBNYXA8c3RyaW5nLCBib29sZWFuPigpO1xuXG4gICAgY29uc3RydWN0b3Ioc3RhdHVzQmFyOiBIVE1MRWxlbWVudCkge1xuICAgICAgICB0aGlzLnN0YXR1c0JhciA9IHN0YXR1c0JhcjtcbiAgICB9XG5cbiAgICBtZXNzYWdlKG1zZzogc3RyaW5nLCBkaXNhcGVhckluPzogbnVtYmVyKSB7XG4gICAgICAgIGxvZ2dlcih0aGlzLCBtc2cpO1xuICAgICAgICBpZiAoZGlzYXBlYXJJbikge1xuICAgICAgICAgICAgdGhpcy5zdGF0dXNCYXIuc2V0VGV4dChtc2cpXG4gICAgICAgICAgICBzZXRUaW1lb3V0KCgpID0+IHtcbiAgICAgICAgICAgICAgICB0aGlzLnN0YXR1c0Jhci5zZXRUZXh0KFwiUmVhZHkuXCIpXG4gICAgICAgICAgICB9LCBkaXNhcGVhckluKTtcbiAgICAgICAgfVxuICAgICAgICBlbHNlXG4gICAgICAgICAgICB0aGlzLnN0YXR1c0Jhci5zZXRUZXh0KG1zZylcbiAgICB9XG5cbiAgICBsb2FkaW5nKG5vZGU6IHN0cmluZywgaXNMb2FkaW5nOiBib29sZWFuKSB7XG4gICAgICAgIHRoaXMubG9hZGVycy5zZXQobm9kZSwgaXNMb2FkaW5nKTtcbiAgICB9XG59XG5cbmV4cG9ydCBjbGFzcyBDYWNoZSB7XG4gICAgcGx1Z2luOiBQbHVnaW47XG4gICAgZGF0YTogQ2FjaGVEYXRhO1xuICAgIHByaXZhdGUgcmVhZHk6IGJvb2xlYW47XG5cbiAgICBjb25zdHJ1Y3RvcihwbHVnaW46IFBsdWdpbikge1xuICAgICAgICB0aGlzLnBsdWdpbiA9IHBsdWdpbjtcbiAgICAgICAgdGhpcy5yZWFkeSA9IGZhbHNlO1xuICAgIH1cblxuICAgIGlzUmVhZHkoKSB7XG4gICAgICAgIHJldHVybiByZWFkeTtcbiAgICB9XG5cbiAgICBsb2FkKCkge1xuICAgICAgICByZXR1cm4gbmV3IFByb21pc2U8Q2FjaGVEYXRhPigocmVzb2x2ZSwgcmVqZWN0KSA9PiB7XG4gICAgICAgICAgICB0aGlzLnBsdWdpbi5sb2FkRGF0YSgpLnRoZW4oZGF0YSA9PiB7XG4gICAgICAgICAgICAgICAgaWYobnVsbCA9PSBkYXRhKSB7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMuZGF0YSA9IHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHNldHRpbmdzOiB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgY2VudHJhbEZpbGVQYXRoOiBcIlJlbWluZGVycy5hcHAubWRcIlxuICAgICAgICAgICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgICAgICAgfTtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5yZWFkeSA9IHRydWU7XG4gICAgICAgICAgICAgICAgICAgIHJlc29sdmUodGhpcy5kYXRhKTtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5zYXZlKCk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICB0aGlzLmRhdGEgPSBkYXRhO1xuICAgICAgICAgICAgICAgICAgICB0aGlzLnJlYWR5ID0gdHJ1ZTtcbiAgICAgICAgICAgICAgICAgICAgcmVzb2x2ZShkYXRhKVxuICAgICAgICAgICAgICAgIH07XG4gICAgICAgICAgICB9KVxuXG4gICAgICAgIH0pXG4gICAgfVxuXG4gICAgdXBkYXRlKGtleTogc3RyaW5nLCB2YWx1ZTogYW55KSB7IH1cblxuICAgIHNhdmUoKSB7XG4gICAgICAgIHJldHVybiB0aGlzLnBsdWdpbi5zYXZlRGF0YSh0aGlzLmRhdGEpO1xuICAgIH1cbn0iLCJmdW5jdGlvbiBub29wKCkgeyB9XG5jb25zdCBpZGVudGl0eSA9IHggPT4geDtcbmZ1bmN0aW9uIGFzc2lnbih0YXIsIHNyYykge1xuICAgIC8vIEB0cy1pZ25vcmVcbiAgICBmb3IgKGNvbnN0IGsgaW4gc3JjKVxuICAgICAgICB0YXJba10gPSBzcmNba107XG4gICAgcmV0dXJuIHRhcjtcbn1cbmZ1bmN0aW9uIGlzX3Byb21pc2UodmFsdWUpIHtcbiAgICByZXR1cm4gdmFsdWUgJiYgdHlwZW9mIHZhbHVlID09PSAnb2JqZWN0JyAmJiB0eXBlb2YgdmFsdWUudGhlbiA9PT0gJ2Z1bmN0aW9uJztcbn1cbmZ1bmN0aW9uIGFkZF9sb2NhdGlvbihlbGVtZW50LCBmaWxlLCBsaW5lLCBjb2x1bW4sIGNoYXIpIHtcbiAgICBlbGVtZW50Ll9fc3ZlbHRlX21ldGEgPSB7XG4gICAgICAgIGxvYzogeyBmaWxlLCBsaW5lLCBjb2x1bW4sIGNoYXIgfVxuICAgIH07XG59XG5mdW5jdGlvbiBydW4oZm4pIHtcbiAgICByZXR1cm4gZm4oKTtcbn1cbmZ1bmN0aW9uIGJsYW5rX29iamVjdCgpIHtcbiAgICByZXR1cm4gT2JqZWN0LmNyZWF0ZShudWxsKTtcbn1cbmZ1bmN0aW9uIHJ1bl9hbGwoZm5zKSB7XG4gICAgZm5zLmZvckVhY2gocnVuKTtcbn1cbmZ1bmN0aW9uIGlzX2Z1bmN0aW9uKHRoaW5nKSB7XG4gICAgcmV0dXJuIHR5cGVvZiB0aGluZyA9PT0gJ2Z1bmN0aW9uJztcbn1cbmZ1bmN0aW9uIHNhZmVfbm90X2VxdWFsKGEsIGIpIHtcbiAgICByZXR1cm4gYSAhPSBhID8gYiA9PSBiIDogYSAhPT0gYiB8fCAoKGEgJiYgdHlwZW9mIGEgPT09ICdvYmplY3QnKSB8fCB0eXBlb2YgYSA9PT0gJ2Z1bmN0aW9uJyk7XG59XG5mdW5jdGlvbiBub3RfZXF1YWwoYSwgYikge1xuICAgIHJldHVybiBhICE9IGEgPyBiID09IGIgOiBhICE9PSBiO1xufVxuZnVuY3Rpb24gaXNfZW1wdHkob2JqKSB7XG4gICAgcmV0dXJuIE9iamVjdC5rZXlzKG9iaikubGVuZ3RoID09PSAwO1xufVxuZnVuY3Rpb24gdmFsaWRhdGVfc3RvcmUoc3RvcmUsIG5hbWUpIHtcbiAgICBpZiAoc3RvcmUgIT0gbnVsbCAmJiB0eXBlb2Ygc3RvcmUuc3Vic2NyaWJlICE9PSAnZnVuY3Rpb24nKSB7XG4gICAgICAgIHRocm93IG5ldyBFcnJvcihgJyR7bmFtZX0nIGlzIG5vdCBhIHN0b3JlIHdpdGggYSAnc3Vic2NyaWJlJyBtZXRob2RgKTtcbiAgICB9XG59XG5mdW5jdGlvbiBzdWJzY3JpYmUoc3RvcmUsIC4uLmNhbGxiYWNrcykge1xuICAgIGlmIChzdG9yZSA9PSBudWxsKSB7XG4gICAgICAgIHJldHVybiBub29wO1xuICAgIH1cbiAgICBjb25zdCB1bnN1YiA9IHN0b3JlLnN1YnNjcmliZSguLi5jYWxsYmFja3MpO1xuICAgIHJldHVybiB1bnN1Yi51bnN1YnNjcmliZSA/ICgpID0+IHVuc3ViLnVuc3Vic2NyaWJlKCkgOiB1bnN1Yjtcbn1cbmZ1bmN0aW9uIGdldF9zdG9yZV92YWx1ZShzdG9yZSkge1xuICAgIGxldCB2YWx1ZTtcbiAgICBzdWJzY3JpYmUoc3RvcmUsIF8gPT4gdmFsdWUgPSBfKSgpO1xuICAgIHJldHVybiB2YWx1ZTtcbn1cbmZ1bmN0aW9uIGNvbXBvbmVudF9zdWJzY3JpYmUoY29tcG9uZW50LCBzdG9yZSwgY2FsbGJhY2spIHtcbiAgICBjb21wb25lbnQuJCQub25fZGVzdHJveS5wdXNoKHN1YnNjcmliZShzdG9yZSwgY2FsbGJhY2spKTtcbn1cbmZ1bmN0aW9uIGNyZWF0ZV9zbG90KGRlZmluaXRpb24sIGN0eCwgJCRzY29wZSwgZm4pIHtcbiAgICBpZiAoZGVmaW5pdGlvbikge1xuICAgICAgICBjb25zdCBzbG90X2N0eCA9IGdldF9zbG90X2NvbnRleHQoZGVmaW5pdGlvbiwgY3R4LCAkJHNjb3BlLCBmbik7XG4gICAgICAgIHJldHVybiBkZWZpbml0aW9uWzBdKHNsb3RfY3R4KTtcbiAgICB9XG59XG5mdW5jdGlvbiBnZXRfc2xvdF9jb250ZXh0KGRlZmluaXRpb24sIGN0eCwgJCRzY29wZSwgZm4pIHtcbiAgICByZXR1cm4gZGVmaW5pdGlvblsxXSAmJiBmblxuICAgICAgICA/IGFzc2lnbigkJHNjb3BlLmN0eC5zbGljZSgpLCBkZWZpbml0aW9uWzFdKGZuKGN0eCkpKVxuICAgICAgICA6ICQkc2NvcGUuY3R4O1xufVxuZnVuY3Rpb24gZ2V0X3Nsb3RfY2hhbmdlcyhkZWZpbml0aW9uLCAkJHNjb3BlLCBkaXJ0eSwgZm4pIHtcbiAgICBpZiAoZGVmaW5pdGlvblsyXSAmJiBmbikge1xuICAgICAgICBjb25zdCBsZXRzID0gZGVmaW5pdGlvblsyXShmbihkaXJ0eSkpO1xuICAgICAgICBpZiAoJCRzY29wZS5kaXJ0eSA9PT0gdW5kZWZpbmVkKSB7XG4gICAgICAgICAgICByZXR1cm4gbGV0cztcbiAgICAgICAgfVxuICAgICAgICBpZiAodHlwZW9mIGxldHMgPT09ICdvYmplY3QnKSB7XG4gICAgICAgICAgICBjb25zdCBtZXJnZWQgPSBbXTtcbiAgICAgICAgICAgIGNvbnN0IGxlbiA9IE1hdGgubWF4KCQkc2NvcGUuZGlydHkubGVuZ3RoLCBsZXRzLmxlbmd0aCk7XG4gICAgICAgICAgICBmb3IgKGxldCBpID0gMDsgaSA8IGxlbjsgaSArPSAxKSB7XG4gICAgICAgICAgICAgICAgbWVyZ2VkW2ldID0gJCRzY29wZS5kaXJ0eVtpXSB8IGxldHNbaV07XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICByZXR1cm4gbWVyZ2VkO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiAkJHNjb3BlLmRpcnR5IHwgbGV0cztcbiAgICB9XG4gICAgcmV0dXJuICQkc2NvcGUuZGlydHk7XG59XG5mdW5jdGlvbiB1cGRhdGVfc2xvdChzbG90LCBzbG90X2RlZmluaXRpb24sIGN0eCwgJCRzY29wZSwgZGlydHksIGdldF9zbG90X2NoYW5nZXNfZm4sIGdldF9zbG90X2NvbnRleHRfZm4pIHtcbiAgICBjb25zdCBzbG90X2NoYW5nZXMgPSBnZXRfc2xvdF9jaGFuZ2VzKHNsb3RfZGVmaW5pdGlvbiwgJCRzY29wZSwgZGlydHksIGdldF9zbG90X2NoYW5nZXNfZm4pO1xuICAgIGlmIChzbG90X2NoYW5nZXMpIHtcbiAgICAgICAgY29uc3Qgc2xvdF9jb250ZXh0ID0gZ2V0X3Nsb3RfY29udGV4dChzbG90X2RlZmluaXRpb24sIGN0eCwgJCRzY29wZSwgZ2V0X3Nsb3RfY29udGV4dF9mbik7XG4gICAgICAgIHNsb3QucChzbG90X2NvbnRleHQsIHNsb3RfY2hhbmdlcyk7XG4gICAgfVxufVxuZnVuY3Rpb24gZXhjbHVkZV9pbnRlcm5hbF9wcm9wcyhwcm9wcykge1xuICAgIGNvbnN0IHJlc3VsdCA9IHt9O1xuICAgIGZvciAoY29uc3QgayBpbiBwcm9wcylcbiAgICAgICAgaWYgKGtbMF0gIT09ICckJylcbiAgICAgICAgICAgIHJlc3VsdFtrXSA9IHByb3BzW2tdO1xuICAgIHJldHVybiByZXN1bHQ7XG59XG5mdW5jdGlvbiBjb21wdXRlX3Jlc3RfcHJvcHMocHJvcHMsIGtleXMpIHtcbiAgICBjb25zdCByZXN0ID0ge307XG4gICAga2V5cyA9IG5ldyBTZXQoa2V5cyk7XG4gICAgZm9yIChjb25zdCBrIGluIHByb3BzKVxuICAgICAgICBpZiAoIWtleXMuaGFzKGspICYmIGtbMF0gIT09ICckJylcbiAgICAgICAgICAgIHJlc3Rba10gPSBwcm9wc1trXTtcbiAgICByZXR1cm4gcmVzdDtcbn1cbmZ1bmN0aW9uIGNvbXB1dGVfc2xvdHMoc2xvdHMpIHtcbiAgICBjb25zdCByZXN1bHQgPSB7fTtcbiAgICBmb3IgKGNvbnN0IGtleSBpbiBzbG90cykge1xuICAgICAgICByZXN1bHRba2V5XSA9IHRydWU7XG4gICAgfVxuICAgIHJldHVybiByZXN1bHQ7XG59XG5mdW5jdGlvbiBvbmNlKGZuKSB7XG4gICAgbGV0IHJhbiA9IGZhbHNlO1xuICAgIHJldHVybiBmdW5jdGlvbiAoLi4uYXJncykge1xuICAgICAgICBpZiAocmFuKVxuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICByYW4gPSB0cnVlO1xuICAgICAgICBmbi5jYWxsKHRoaXMsIC4uLmFyZ3MpO1xuICAgIH07XG59XG5mdW5jdGlvbiBudWxsX3RvX2VtcHR5KHZhbHVlKSB7XG4gICAgcmV0dXJuIHZhbHVlID09IG51bGwgPyAnJyA6IHZhbHVlO1xufVxuZnVuY3Rpb24gc2V0X3N0b3JlX3ZhbHVlKHN0b3JlLCByZXQsIHZhbHVlID0gcmV0KSB7XG4gICAgc3RvcmUuc2V0KHZhbHVlKTtcbiAgICByZXR1cm4gcmV0O1xufVxuY29uc3QgaGFzX3Byb3AgPSAob2JqLCBwcm9wKSA9PiBPYmplY3QucHJvdG90eXBlLmhhc093blByb3BlcnR5LmNhbGwob2JqLCBwcm9wKTtcbmZ1bmN0aW9uIGFjdGlvbl9kZXN0cm95ZXIoYWN0aW9uX3Jlc3VsdCkge1xuICAgIHJldHVybiBhY3Rpb25fcmVzdWx0ICYmIGlzX2Z1bmN0aW9uKGFjdGlvbl9yZXN1bHQuZGVzdHJveSkgPyBhY3Rpb25fcmVzdWx0LmRlc3Ryb3kgOiBub29wO1xufVxuXG5jb25zdCBpc19jbGllbnQgPSB0eXBlb2Ygd2luZG93ICE9PSAndW5kZWZpbmVkJztcbmxldCBub3cgPSBpc19jbGllbnRcbiAgICA/ICgpID0+IHdpbmRvdy5wZXJmb3JtYW5jZS5ub3coKVxuICAgIDogKCkgPT4gRGF0ZS5ub3coKTtcbmxldCByYWYgPSBpc19jbGllbnQgPyBjYiA9PiByZXF1ZXN0QW5pbWF0aW9uRnJhbWUoY2IpIDogbm9vcDtcbi8vIHVzZWQgaW50ZXJuYWxseSBmb3IgdGVzdGluZ1xuZnVuY3Rpb24gc2V0X25vdyhmbikge1xuICAgIG5vdyA9IGZuO1xufVxuZnVuY3Rpb24gc2V0X3JhZihmbikge1xuICAgIHJhZiA9IGZuO1xufVxuXG5jb25zdCB0YXNrcyA9IG5ldyBTZXQoKTtcbmZ1bmN0aW9uIHJ1bl90YXNrcyhub3cpIHtcbiAgICB0YXNrcy5mb3JFYWNoKHRhc2sgPT4ge1xuICAgICAgICBpZiAoIXRhc2suYyhub3cpKSB7XG4gICAgICAgICAgICB0YXNrcy5kZWxldGUodGFzayk7XG4gICAgICAgICAgICB0YXNrLmYoKTtcbiAgICAgICAgfVxuICAgIH0pO1xuICAgIGlmICh0YXNrcy5zaXplICE9PSAwKVxuICAgICAgICByYWYocnVuX3Rhc2tzKTtcbn1cbi8qKlxuICogRm9yIHRlc3RpbmcgcHVycG9zZXMgb25seSFcbiAqL1xuZnVuY3Rpb24gY2xlYXJfbG9vcHMoKSB7XG4gICAgdGFza3MuY2xlYXIoKTtcbn1cbi8qKlxuICogQ3JlYXRlcyBhIG5ldyB0YXNrIHRoYXQgcnVucyBvbiBlYWNoIHJhZiBmcmFtZVxuICogdW50aWwgaXQgcmV0dXJucyBhIGZhbHN5IHZhbHVlIG9yIGlzIGFib3J0ZWRcbiAqL1xuZnVuY3Rpb24gbG9vcChjYWxsYmFjaykge1xuICAgIGxldCB0YXNrO1xuICAgIGlmICh0YXNrcy5zaXplID09PSAwKVxuICAgICAgICByYWYocnVuX3Rhc2tzKTtcbiAgICByZXR1cm4ge1xuICAgICAgICBwcm9taXNlOiBuZXcgUHJvbWlzZShmdWxmaWxsID0+IHtcbiAgICAgICAgICAgIHRhc2tzLmFkZCh0YXNrID0geyBjOiBjYWxsYmFjaywgZjogZnVsZmlsbCB9KTtcbiAgICAgICAgfSksXG4gICAgICAgIGFib3J0KCkge1xuICAgICAgICAgICAgdGFza3MuZGVsZXRlKHRhc2spO1xuICAgICAgICB9XG4gICAgfTtcbn1cblxuZnVuY3Rpb24gYXBwZW5kKHRhcmdldCwgbm9kZSkge1xuICAgIHRhcmdldC5hcHBlbmRDaGlsZChub2RlKTtcbn1cbmZ1bmN0aW9uIGluc2VydCh0YXJnZXQsIG5vZGUsIGFuY2hvcikge1xuICAgIHRhcmdldC5pbnNlcnRCZWZvcmUobm9kZSwgYW5jaG9yIHx8IG51bGwpO1xufVxuZnVuY3Rpb24gZGV0YWNoKG5vZGUpIHtcbiAgICBub2RlLnBhcmVudE5vZGUucmVtb3ZlQ2hpbGQobm9kZSk7XG59XG5mdW5jdGlvbiBkZXN0cm95X2VhY2goaXRlcmF0aW9ucywgZGV0YWNoaW5nKSB7XG4gICAgZm9yIChsZXQgaSA9IDA7IGkgPCBpdGVyYXRpb25zLmxlbmd0aDsgaSArPSAxKSB7XG4gICAgICAgIGlmIChpdGVyYXRpb25zW2ldKVxuICAgICAgICAgICAgaXRlcmF0aW9uc1tpXS5kKGRldGFjaGluZyk7XG4gICAgfVxufVxuZnVuY3Rpb24gZWxlbWVudChuYW1lKSB7XG4gICAgcmV0dXJuIGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQobmFtZSk7XG59XG5mdW5jdGlvbiBlbGVtZW50X2lzKG5hbWUsIGlzKSB7XG4gICAgcmV0dXJuIGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQobmFtZSwgeyBpcyB9KTtcbn1cbmZ1bmN0aW9uIG9iamVjdF93aXRob3V0X3Byb3BlcnRpZXMob2JqLCBleGNsdWRlKSB7XG4gICAgY29uc3QgdGFyZ2V0ID0ge307XG4gICAgZm9yIChjb25zdCBrIGluIG9iaikge1xuICAgICAgICBpZiAoaGFzX3Byb3Aob2JqLCBrKVxuICAgICAgICAgICAgLy8gQHRzLWlnbm9yZVxuICAgICAgICAgICAgJiYgZXhjbHVkZS5pbmRleE9mKGspID09PSAtMSkge1xuICAgICAgICAgICAgLy8gQHRzLWlnbm9yZVxuICAgICAgICAgICAgdGFyZ2V0W2tdID0gb2JqW2tdO1xuICAgICAgICB9XG4gICAgfVxuICAgIHJldHVybiB0YXJnZXQ7XG59XG5mdW5jdGlvbiBzdmdfZWxlbWVudChuYW1lKSB7XG4gICAgcmV0dXJuIGRvY3VtZW50LmNyZWF0ZUVsZW1lbnROUygnaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmcnLCBuYW1lKTtcbn1cbmZ1bmN0aW9uIHRleHQoZGF0YSkge1xuICAgIHJldHVybiBkb2N1bWVudC5jcmVhdGVUZXh0Tm9kZShkYXRhKTtcbn1cbmZ1bmN0aW9uIHNwYWNlKCkge1xuICAgIHJldHVybiB0ZXh0KCcgJyk7XG59XG5mdW5jdGlvbiBlbXB0eSgpIHtcbiAgICByZXR1cm4gdGV4dCgnJyk7XG59XG5mdW5jdGlvbiBsaXN0ZW4obm9kZSwgZXZlbnQsIGhhbmRsZXIsIG9wdGlvbnMpIHtcbiAgICBub2RlLmFkZEV2ZW50TGlzdGVuZXIoZXZlbnQsIGhhbmRsZXIsIG9wdGlvbnMpO1xuICAgIHJldHVybiAoKSA9PiBub2RlLnJlbW92ZUV2ZW50TGlzdGVuZXIoZXZlbnQsIGhhbmRsZXIsIG9wdGlvbnMpO1xufVxuZnVuY3Rpb24gcHJldmVudF9kZWZhdWx0KGZuKSB7XG4gICAgcmV0dXJuIGZ1bmN0aW9uIChldmVudCkge1xuICAgICAgICBldmVudC5wcmV2ZW50RGVmYXVsdCgpO1xuICAgICAgICAvLyBAdHMtaWdub3JlXG4gICAgICAgIHJldHVybiBmbi5jYWxsKHRoaXMsIGV2ZW50KTtcbiAgICB9O1xufVxuZnVuY3Rpb24gc3RvcF9wcm9wYWdhdGlvbihmbikge1xuICAgIHJldHVybiBmdW5jdGlvbiAoZXZlbnQpIHtcbiAgICAgICAgZXZlbnQuc3RvcFByb3BhZ2F0aW9uKCk7XG4gICAgICAgIC8vIEB0cy1pZ25vcmVcbiAgICAgICAgcmV0dXJuIGZuLmNhbGwodGhpcywgZXZlbnQpO1xuICAgIH07XG59XG5mdW5jdGlvbiBzZWxmKGZuKSB7XG4gICAgcmV0dXJuIGZ1bmN0aW9uIChldmVudCkge1xuICAgICAgICAvLyBAdHMtaWdub3JlXG4gICAgICAgIGlmIChldmVudC50YXJnZXQgPT09IHRoaXMpXG4gICAgICAgICAgICBmbi5jYWxsKHRoaXMsIGV2ZW50KTtcbiAgICB9O1xufVxuZnVuY3Rpb24gYXR0cihub2RlLCBhdHRyaWJ1dGUsIHZhbHVlKSB7XG4gICAgaWYgKHZhbHVlID09IG51bGwpXG4gICAgICAgIG5vZGUucmVtb3ZlQXR0cmlidXRlKGF0dHJpYnV0ZSk7XG4gICAgZWxzZSBpZiAobm9kZS5nZXRBdHRyaWJ1dGUoYXR0cmlidXRlKSAhPT0gdmFsdWUpXG4gICAgICAgIG5vZGUuc2V0QXR0cmlidXRlKGF0dHJpYnV0ZSwgdmFsdWUpO1xufVxuZnVuY3Rpb24gc2V0X2F0dHJpYnV0ZXMobm9kZSwgYXR0cmlidXRlcykge1xuICAgIC8vIEB0cy1pZ25vcmVcbiAgICBjb25zdCBkZXNjcmlwdG9ycyA9IE9iamVjdC5nZXRPd25Qcm9wZXJ0eURlc2NyaXB0b3JzKG5vZGUuX19wcm90b19fKTtcbiAgICBmb3IgKGNvbnN0IGtleSBpbiBhdHRyaWJ1dGVzKSB7XG4gICAgICAgIGlmIChhdHRyaWJ1dGVzW2tleV0gPT0gbnVsbCkge1xuICAgICAgICAgICAgbm9kZS5yZW1vdmVBdHRyaWJ1dGUoa2V5KTtcbiAgICAgICAgfVxuICAgICAgICBlbHNlIGlmIChrZXkgPT09ICdzdHlsZScpIHtcbiAgICAgICAgICAgIG5vZGUuc3R5bGUuY3NzVGV4dCA9IGF0dHJpYnV0ZXNba2V5XTtcbiAgICAgICAgfVxuICAgICAgICBlbHNlIGlmIChrZXkgPT09ICdfX3ZhbHVlJykge1xuICAgICAgICAgICAgbm9kZS52YWx1ZSA9IG5vZGVba2V5XSA9IGF0dHJpYnV0ZXNba2V5XTtcbiAgICAgICAgfVxuICAgICAgICBlbHNlIGlmIChkZXNjcmlwdG9yc1trZXldICYmIGRlc2NyaXB0b3JzW2tleV0uc2V0KSB7XG4gICAgICAgICAgICBub2RlW2tleV0gPSBhdHRyaWJ1dGVzW2tleV07XG4gICAgICAgIH1cbiAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICBhdHRyKG5vZGUsIGtleSwgYXR0cmlidXRlc1trZXldKTtcbiAgICAgICAgfVxuICAgIH1cbn1cbmZ1bmN0aW9uIHNldF9zdmdfYXR0cmlidXRlcyhub2RlLCBhdHRyaWJ1dGVzKSB7XG4gICAgZm9yIChjb25zdCBrZXkgaW4gYXR0cmlidXRlcykge1xuICAgICAgICBhdHRyKG5vZGUsIGtleSwgYXR0cmlidXRlc1trZXldKTtcbiAgICB9XG59XG5mdW5jdGlvbiBzZXRfY3VzdG9tX2VsZW1lbnRfZGF0YShub2RlLCBwcm9wLCB2YWx1ZSkge1xuICAgIGlmIChwcm9wIGluIG5vZGUpIHtcbiAgICAgICAgbm9kZVtwcm9wXSA9IHZhbHVlO1xuICAgIH1cbiAgICBlbHNlIHtcbiAgICAgICAgYXR0cihub2RlLCBwcm9wLCB2YWx1ZSk7XG4gICAgfVxufVxuZnVuY3Rpb24geGxpbmtfYXR0cihub2RlLCBhdHRyaWJ1dGUsIHZhbHVlKSB7XG4gICAgbm9kZS5zZXRBdHRyaWJ1dGVOUygnaHR0cDovL3d3dy53My5vcmcvMTk5OS94bGluaycsIGF0dHJpYnV0ZSwgdmFsdWUpO1xufVxuZnVuY3Rpb24gZ2V0X2JpbmRpbmdfZ3JvdXBfdmFsdWUoZ3JvdXAsIF9fdmFsdWUsIGNoZWNrZWQpIHtcbiAgICBjb25zdCB2YWx1ZSA9IG5ldyBTZXQoKTtcbiAgICBmb3IgKGxldCBpID0gMDsgaSA8IGdyb3VwLmxlbmd0aDsgaSArPSAxKSB7XG4gICAgICAgIGlmIChncm91cFtpXS5jaGVja2VkKVxuICAgICAgICAgICAgdmFsdWUuYWRkKGdyb3VwW2ldLl9fdmFsdWUpO1xuICAgIH1cbiAgICBpZiAoIWNoZWNrZWQpIHtcbiAgICAgICAgdmFsdWUuZGVsZXRlKF9fdmFsdWUpO1xuICAgIH1cbiAgICByZXR1cm4gQXJyYXkuZnJvbSh2YWx1ZSk7XG59XG5mdW5jdGlvbiB0b19udW1iZXIodmFsdWUpIHtcbiAgICByZXR1cm4gdmFsdWUgPT09ICcnID8gbnVsbCA6ICt2YWx1ZTtcbn1cbmZ1bmN0aW9uIHRpbWVfcmFuZ2VzX3RvX2FycmF5KHJhbmdlcykge1xuICAgIGNvbnN0IGFycmF5ID0gW107XG4gICAgZm9yIChsZXQgaSA9IDA7IGkgPCByYW5nZXMubGVuZ3RoOyBpICs9IDEpIHtcbiAgICAgICAgYXJyYXkucHVzaCh7IHN0YXJ0OiByYW5nZXMuc3RhcnQoaSksIGVuZDogcmFuZ2VzLmVuZChpKSB9KTtcbiAgICB9XG4gICAgcmV0dXJuIGFycmF5O1xufVxuZnVuY3Rpb24gY2hpbGRyZW4oZWxlbWVudCkge1xuICAgIHJldHVybiBBcnJheS5mcm9tKGVsZW1lbnQuY2hpbGROb2Rlcyk7XG59XG5mdW5jdGlvbiBjbGFpbV9lbGVtZW50KG5vZGVzLCBuYW1lLCBhdHRyaWJ1dGVzLCBzdmcpIHtcbiAgICBmb3IgKGxldCBpID0gMDsgaSA8IG5vZGVzLmxlbmd0aDsgaSArPSAxKSB7XG4gICAgICAgIGNvbnN0IG5vZGUgPSBub2Rlc1tpXTtcbiAgICAgICAgaWYgKG5vZGUubm9kZU5hbWUgPT09IG5hbWUpIHtcbiAgICAgICAgICAgIGxldCBqID0gMDtcbiAgICAgICAgICAgIGNvbnN0IHJlbW92ZSA9IFtdO1xuICAgICAgICAgICAgd2hpbGUgKGogPCBub2RlLmF0dHJpYnV0ZXMubGVuZ3RoKSB7XG4gICAgICAgICAgICAgICAgY29uc3QgYXR0cmlidXRlID0gbm9kZS5hdHRyaWJ1dGVzW2orK107XG4gICAgICAgICAgICAgICAgaWYgKCFhdHRyaWJ1dGVzW2F0dHJpYnV0ZS5uYW1lXSkge1xuICAgICAgICAgICAgICAgICAgICByZW1vdmUucHVzaChhdHRyaWJ1dGUubmFtZSk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICAgICAgZm9yIChsZXQgayA9IDA7IGsgPCByZW1vdmUubGVuZ3RoOyBrKyspIHtcbiAgICAgICAgICAgICAgICBub2RlLnJlbW92ZUF0dHJpYnV0ZShyZW1vdmVba10pO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgcmV0dXJuIG5vZGVzLnNwbGljZShpLCAxKVswXTtcbiAgICAgICAgfVxuICAgIH1cbiAgICByZXR1cm4gc3ZnID8gc3ZnX2VsZW1lbnQobmFtZSkgOiBlbGVtZW50KG5hbWUpO1xufVxuZnVuY3Rpb24gY2xhaW1fdGV4dChub2RlcywgZGF0YSkge1xuICAgIGZvciAobGV0IGkgPSAwOyBpIDwgbm9kZXMubGVuZ3RoOyBpICs9IDEpIHtcbiAgICAgICAgY29uc3Qgbm9kZSA9IG5vZGVzW2ldO1xuICAgICAgICBpZiAobm9kZS5ub2RlVHlwZSA9PT0gMykge1xuICAgICAgICAgICAgbm9kZS5kYXRhID0gJycgKyBkYXRhO1xuICAgICAgICAgICAgcmV0dXJuIG5vZGVzLnNwbGljZShpLCAxKVswXTtcbiAgICAgICAgfVxuICAgIH1cbiAgICByZXR1cm4gdGV4dChkYXRhKTtcbn1cbmZ1bmN0aW9uIGNsYWltX3NwYWNlKG5vZGVzKSB7XG4gICAgcmV0dXJuIGNsYWltX3RleHQobm9kZXMsICcgJyk7XG59XG5mdW5jdGlvbiBzZXRfZGF0YSh0ZXh0LCBkYXRhKSB7XG4gICAgZGF0YSA9ICcnICsgZGF0YTtcbiAgICBpZiAodGV4dC53aG9sZVRleHQgIT09IGRhdGEpXG4gICAgICAgIHRleHQuZGF0YSA9IGRhdGE7XG59XG5mdW5jdGlvbiBzZXRfaW5wdXRfdmFsdWUoaW5wdXQsIHZhbHVlKSB7XG4gICAgaW5wdXQudmFsdWUgPSB2YWx1ZSA9PSBudWxsID8gJycgOiB2YWx1ZTtcbn1cbmZ1bmN0aW9uIHNldF9pbnB1dF90eXBlKGlucHV0LCB0eXBlKSB7XG4gICAgdHJ5IHtcbiAgICAgICAgaW5wdXQudHlwZSA9IHR5cGU7XG4gICAgfVxuICAgIGNhdGNoIChlKSB7XG4gICAgICAgIC8vIGRvIG5vdGhpbmdcbiAgICB9XG59XG5mdW5jdGlvbiBzZXRfc3R5bGUobm9kZSwga2V5LCB2YWx1ZSwgaW1wb3J0YW50KSB7XG4gICAgbm9kZS5zdHlsZS5zZXRQcm9wZXJ0eShrZXksIHZhbHVlLCBpbXBvcnRhbnQgPyAnaW1wb3J0YW50JyA6ICcnKTtcbn1cbmZ1bmN0aW9uIHNlbGVjdF9vcHRpb24oc2VsZWN0LCB2YWx1ZSkge1xuICAgIGZvciAobGV0IGkgPSAwOyBpIDwgc2VsZWN0Lm9wdGlvbnMubGVuZ3RoOyBpICs9IDEpIHtcbiAgICAgICAgY29uc3Qgb3B0aW9uID0gc2VsZWN0Lm9wdGlvbnNbaV07XG4gICAgICAgIGlmIChvcHRpb24uX192YWx1ZSA9PT0gdmFsdWUpIHtcbiAgICAgICAgICAgIG9wdGlvbi5zZWxlY3RlZCA9IHRydWU7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cbiAgICB9XG59XG5mdW5jdGlvbiBzZWxlY3Rfb3B0aW9ucyhzZWxlY3QsIHZhbHVlKSB7XG4gICAgZm9yIChsZXQgaSA9IDA7IGkgPCBzZWxlY3Qub3B0aW9ucy5sZW5ndGg7IGkgKz0gMSkge1xuICAgICAgICBjb25zdCBvcHRpb24gPSBzZWxlY3Qub3B0aW9uc1tpXTtcbiAgICAgICAgb3B0aW9uLnNlbGVjdGVkID0gfnZhbHVlLmluZGV4T2Yob3B0aW9uLl9fdmFsdWUpO1xuICAgIH1cbn1cbmZ1bmN0aW9uIHNlbGVjdF92YWx1ZShzZWxlY3QpIHtcbiAgICBjb25zdCBzZWxlY3RlZF9vcHRpb24gPSBzZWxlY3QucXVlcnlTZWxlY3RvcignOmNoZWNrZWQnKSB8fCBzZWxlY3Qub3B0aW9uc1swXTtcbiAgICByZXR1cm4gc2VsZWN0ZWRfb3B0aW9uICYmIHNlbGVjdGVkX29wdGlvbi5fX3ZhbHVlO1xufVxuZnVuY3Rpb24gc2VsZWN0X211bHRpcGxlX3ZhbHVlKHNlbGVjdCkge1xuICAgIHJldHVybiBbXS5tYXAuY2FsbChzZWxlY3QucXVlcnlTZWxlY3RvckFsbCgnOmNoZWNrZWQnKSwgb3B0aW9uID0+IG9wdGlvbi5fX3ZhbHVlKTtcbn1cbi8vIHVuZm9ydHVuYXRlbHkgdGhpcyBjYW4ndCBiZSBhIGNvbnN0YW50IGFzIHRoYXQgd291bGRuJ3QgYmUgdHJlZS1zaGFrZWFibGVcbi8vIHNvIHdlIGNhY2hlIHRoZSByZXN1bHQgaW5zdGVhZFxubGV0IGNyb3Nzb3JpZ2luO1xuZnVuY3Rpb24gaXNfY3Jvc3NvcmlnaW4oKSB7XG4gICAgaWYgKGNyb3Nzb3JpZ2luID09PSB1bmRlZmluZWQpIHtcbiAgICAgICAgY3Jvc3NvcmlnaW4gPSBmYWxzZTtcbiAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgIGlmICh0eXBlb2Ygd2luZG93ICE9PSAndW5kZWZpbmVkJyAmJiB3aW5kb3cucGFyZW50KSB7XG4gICAgICAgICAgICAgICAgdm9pZCB3aW5kb3cucGFyZW50LmRvY3VtZW50O1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIGNhdGNoIChlcnJvcikge1xuICAgICAgICAgICAgY3Jvc3NvcmlnaW4gPSB0cnVlO1xuICAgICAgICB9XG4gICAgfVxuICAgIHJldHVybiBjcm9zc29yaWdpbjtcbn1cbmZ1bmN0aW9uIGFkZF9yZXNpemVfbGlzdGVuZXIobm9kZSwgZm4pIHtcbiAgICBjb25zdCBjb21wdXRlZF9zdHlsZSA9IGdldENvbXB1dGVkU3R5bGUobm9kZSk7XG4gICAgY29uc3Qgel9pbmRleCA9IChwYXJzZUludChjb21wdXRlZF9zdHlsZS56SW5kZXgpIHx8IDApIC0gMTtcbiAgICBpZiAoY29tcHV0ZWRfc3R5bGUucG9zaXRpb24gPT09ICdzdGF0aWMnKSB7XG4gICAgICAgIG5vZGUuc3R5bGUucG9zaXRpb24gPSAncmVsYXRpdmUnO1xuICAgIH1cbiAgICBjb25zdCBpZnJhbWUgPSBlbGVtZW50KCdpZnJhbWUnKTtcbiAgICBpZnJhbWUuc2V0QXR0cmlidXRlKCdzdHlsZScsICdkaXNwbGF5OiBibG9jazsgcG9zaXRpb246IGFic29sdXRlOyB0b3A6IDA7IGxlZnQ6IDA7IHdpZHRoOiAxMDAlOyBoZWlnaHQ6IDEwMCU7ICcgK1xuICAgICAgICBgb3ZlcmZsb3c6IGhpZGRlbjsgYm9yZGVyOiAwOyBvcGFjaXR5OiAwOyBwb2ludGVyLWV2ZW50czogbm9uZTsgei1pbmRleDogJHt6X2luZGV4fTtgKTtcbiAgICBpZnJhbWUuc2V0QXR0cmlidXRlKCdhcmlhLWhpZGRlbicsICd0cnVlJyk7XG4gICAgaWZyYW1lLnRhYkluZGV4ID0gLTE7XG4gICAgY29uc3QgY3Jvc3NvcmlnaW4gPSBpc19jcm9zc29yaWdpbigpO1xuICAgIGxldCB1bnN1YnNjcmliZTtcbiAgICBpZiAoY3Jvc3NvcmlnaW4pIHtcbiAgICAgICAgaWZyYW1lLnNyYyA9IFwiZGF0YTp0ZXh0L2h0bWwsPHNjcmlwdD5vbnJlc2l6ZT1mdW5jdGlvbigpe3BhcmVudC5wb3N0TWVzc2FnZSgwLCcqJyl9PC9zY3JpcHQ+XCI7XG4gICAgICAgIHVuc3Vic2NyaWJlID0gbGlzdGVuKHdpbmRvdywgJ21lc3NhZ2UnLCAoZXZlbnQpID0+IHtcbiAgICAgICAgICAgIGlmIChldmVudC5zb3VyY2UgPT09IGlmcmFtZS5jb250ZW50V2luZG93KVxuICAgICAgICAgICAgICAgIGZuKCk7XG4gICAgICAgIH0pO1xuICAgIH1cbiAgICBlbHNlIHtcbiAgICAgICAgaWZyYW1lLnNyYyA9ICdhYm91dDpibGFuayc7XG4gICAgICAgIGlmcmFtZS5vbmxvYWQgPSAoKSA9PiB7XG4gICAgICAgICAgICB1bnN1YnNjcmliZSA9IGxpc3RlbihpZnJhbWUuY29udGVudFdpbmRvdywgJ3Jlc2l6ZScsIGZuKTtcbiAgICAgICAgfTtcbiAgICB9XG4gICAgYXBwZW5kKG5vZGUsIGlmcmFtZSk7XG4gICAgcmV0dXJuICgpID0+IHtcbiAgICAgICAgaWYgKGNyb3Nzb3JpZ2luKSB7XG4gICAgICAgICAgICB1bnN1YnNjcmliZSgpO1xuICAgICAgICB9XG4gICAgICAgIGVsc2UgaWYgKHVuc3Vic2NyaWJlICYmIGlmcmFtZS5jb250ZW50V2luZG93KSB7XG4gICAgICAgICAgICB1bnN1YnNjcmliZSgpO1xuICAgICAgICB9XG4gICAgICAgIGRldGFjaChpZnJhbWUpO1xuICAgIH07XG59XG5mdW5jdGlvbiB0b2dnbGVfY2xhc3MoZWxlbWVudCwgbmFtZSwgdG9nZ2xlKSB7XG4gICAgZWxlbWVudC5jbGFzc0xpc3RbdG9nZ2xlID8gJ2FkZCcgOiAncmVtb3ZlJ10obmFtZSk7XG59XG5mdW5jdGlvbiBjdXN0b21fZXZlbnQodHlwZSwgZGV0YWlsKSB7XG4gICAgY29uc3QgZSA9IGRvY3VtZW50LmNyZWF0ZUV2ZW50KCdDdXN0b21FdmVudCcpO1xuICAgIGUuaW5pdEN1c3RvbUV2ZW50KHR5cGUsIGZhbHNlLCBmYWxzZSwgZGV0YWlsKTtcbiAgICByZXR1cm4gZTtcbn1cbmZ1bmN0aW9uIHF1ZXJ5X3NlbGVjdG9yX2FsbChzZWxlY3RvciwgcGFyZW50ID0gZG9jdW1lbnQuYm9keSkge1xuICAgIHJldHVybiBBcnJheS5mcm9tKHBhcmVudC5xdWVyeVNlbGVjdG9yQWxsKHNlbGVjdG9yKSk7XG59XG5jbGFzcyBIdG1sVGFnIHtcbiAgICBjb25zdHJ1Y3RvcihhbmNob3IgPSBudWxsKSB7XG4gICAgICAgIHRoaXMuYSA9IGFuY2hvcjtcbiAgICAgICAgdGhpcy5lID0gdGhpcy5uID0gbnVsbDtcbiAgICB9XG4gICAgbShodG1sLCB0YXJnZXQsIGFuY2hvciA9IG51bGwpIHtcbiAgICAgICAgaWYgKCF0aGlzLmUpIHtcbiAgICAgICAgICAgIHRoaXMuZSA9IGVsZW1lbnQodGFyZ2V0Lm5vZGVOYW1lKTtcbiAgICAgICAgICAgIHRoaXMudCA9IHRhcmdldDtcbiAgICAgICAgICAgIHRoaXMuaChodG1sKTtcbiAgICAgICAgfVxuICAgICAgICB0aGlzLmkoYW5jaG9yKTtcbiAgICB9XG4gICAgaChodG1sKSB7XG4gICAgICAgIHRoaXMuZS5pbm5lckhUTUwgPSBodG1sO1xuICAgICAgICB0aGlzLm4gPSBBcnJheS5mcm9tKHRoaXMuZS5jaGlsZE5vZGVzKTtcbiAgICB9XG4gICAgaShhbmNob3IpIHtcbiAgICAgICAgZm9yIChsZXQgaSA9IDA7IGkgPCB0aGlzLm4ubGVuZ3RoOyBpICs9IDEpIHtcbiAgICAgICAgICAgIGluc2VydCh0aGlzLnQsIHRoaXMubltpXSwgYW5jaG9yKTtcbiAgICAgICAgfVxuICAgIH1cbiAgICBwKGh0bWwpIHtcbiAgICAgICAgdGhpcy5kKCk7XG4gICAgICAgIHRoaXMuaChodG1sKTtcbiAgICAgICAgdGhpcy5pKHRoaXMuYSk7XG4gICAgfVxuICAgIGQoKSB7XG4gICAgICAgIHRoaXMubi5mb3JFYWNoKGRldGFjaCk7XG4gICAgfVxufVxuZnVuY3Rpb24gYXR0cmlidXRlX3RvX29iamVjdChhdHRyaWJ1dGVzKSB7XG4gICAgY29uc3QgcmVzdWx0ID0ge307XG4gICAgZm9yIChjb25zdCBhdHRyaWJ1dGUgb2YgYXR0cmlidXRlcykge1xuICAgICAgICByZXN1bHRbYXR0cmlidXRlLm5hbWVdID0gYXR0cmlidXRlLnZhbHVlO1xuICAgIH1cbiAgICByZXR1cm4gcmVzdWx0O1xufVxuZnVuY3Rpb24gZ2V0X2N1c3RvbV9lbGVtZW50c19zbG90cyhlbGVtZW50KSB7XG4gICAgY29uc3QgcmVzdWx0ID0ge307XG4gICAgZWxlbWVudC5jaGlsZE5vZGVzLmZvckVhY2goKG5vZGUpID0+IHtcbiAgICAgICAgcmVzdWx0W25vZGUuc2xvdCB8fCAnZGVmYXVsdCddID0gdHJ1ZTtcbiAgICB9KTtcbiAgICByZXR1cm4gcmVzdWx0O1xufVxuXG5jb25zdCBhY3RpdmVfZG9jcyA9IG5ldyBTZXQoKTtcbmxldCBhY3RpdmUgPSAwO1xuLy8gaHR0cHM6Ly9naXRodWIuY29tL2Rhcmtza3lhcHAvc3RyaW5nLWhhc2gvYmxvYi9tYXN0ZXIvaW5kZXguanNcbmZ1bmN0aW9uIGhhc2goc3RyKSB7XG4gICAgbGV0IGhhc2ggPSA1MzgxO1xuICAgIGxldCBpID0gc3RyLmxlbmd0aDtcbiAgICB3aGlsZSAoaS0tKVxuICAgICAgICBoYXNoID0gKChoYXNoIDw8IDUpIC0gaGFzaCkgXiBzdHIuY2hhckNvZGVBdChpKTtcbiAgICByZXR1cm4gaGFzaCA+Pj4gMDtcbn1cbmZ1bmN0aW9uIGNyZWF0ZV9ydWxlKG5vZGUsIGEsIGIsIGR1cmF0aW9uLCBkZWxheSwgZWFzZSwgZm4sIHVpZCA9IDApIHtcbiAgICBjb25zdCBzdGVwID0gMTYuNjY2IC8gZHVyYXRpb247XG4gICAgbGV0IGtleWZyYW1lcyA9ICd7XFxuJztcbiAgICBmb3IgKGxldCBwID0gMDsgcCA8PSAxOyBwICs9IHN0ZXApIHtcbiAgICAgICAgY29uc3QgdCA9IGEgKyAoYiAtIGEpICogZWFzZShwKTtcbiAgICAgICAga2V5ZnJhbWVzICs9IHAgKiAxMDAgKyBgJXske2ZuKHQsIDEgLSB0KX19XFxuYDtcbiAgICB9XG4gICAgY29uc3QgcnVsZSA9IGtleWZyYW1lcyArIGAxMDAlIHske2ZuKGIsIDEgLSBiKX19XFxufWA7XG4gICAgY29uc3QgbmFtZSA9IGBfX3N2ZWx0ZV8ke2hhc2gocnVsZSl9XyR7dWlkfWA7XG4gICAgY29uc3QgZG9jID0gbm9kZS5vd25lckRvY3VtZW50O1xuICAgIGFjdGl2ZV9kb2NzLmFkZChkb2MpO1xuICAgIGNvbnN0IHN0eWxlc2hlZXQgPSBkb2MuX19zdmVsdGVfc3R5bGVzaGVldCB8fCAoZG9jLl9fc3ZlbHRlX3N0eWxlc2hlZXQgPSBkb2MuaGVhZC5hcHBlbmRDaGlsZChlbGVtZW50KCdzdHlsZScpKS5zaGVldCk7XG4gICAgY29uc3QgY3VycmVudF9ydWxlcyA9IGRvYy5fX3N2ZWx0ZV9ydWxlcyB8fCAoZG9jLl9fc3ZlbHRlX3J1bGVzID0ge30pO1xuICAgIGlmICghY3VycmVudF9ydWxlc1tuYW1lXSkge1xuICAgICAgICBjdXJyZW50X3J1bGVzW25hbWVdID0gdHJ1ZTtcbiAgICAgICAgc3R5bGVzaGVldC5pbnNlcnRSdWxlKGBAa2V5ZnJhbWVzICR7bmFtZX0gJHtydWxlfWAsIHN0eWxlc2hlZXQuY3NzUnVsZXMubGVuZ3RoKTtcbiAgICB9XG4gICAgY29uc3QgYW5pbWF0aW9uID0gbm9kZS5zdHlsZS5hbmltYXRpb24gfHwgJyc7XG4gICAgbm9kZS5zdHlsZS5hbmltYXRpb24gPSBgJHthbmltYXRpb24gPyBgJHthbmltYXRpb259LCBgIDogJyd9JHtuYW1lfSAke2R1cmF0aW9ufW1zIGxpbmVhciAke2RlbGF5fW1zIDEgYm90aGA7XG4gICAgYWN0aXZlICs9IDE7XG4gICAgcmV0dXJuIG5hbWU7XG59XG5mdW5jdGlvbiBkZWxldGVfcnVsZShub2RlLCBuYW1lKSB7XG4gICAgY29uc3QgcHJldmlvdXMgPSAobm9kZS5zdHlsZS5hbmltYXRpb24gfHwgJycpLnNwbGl0KCcsICcpO1xuICAgIGNvbnN0IG5leHQgPSBwcmV2aW91cy5maWx0ZXIobmFtZVxuICAgICAgICA/IGFuaW0gPT4gYW5pbS5pbmRleE9mKG5hbWUpIDwgMCAvLyByZW1vdmUgc3BlY2lmaWMgYW5pbWF0aW9uXG4gICAgICAgIDogYW5pbSA9PiBhbmltLmluZGV4T2YoJ19fc3ZlbHRlJykgPT09IC0xIC8vIHJlbW92ZSBhbGwgU3ZlbHRlIGFuaW1hdGlvbnNcbiAgICApO1xuICAgIGNvbnN0IGRlbGV0ZWQgPSBwcmV2aW91cy5sZW5ndGggLSBuZXh0Lmxlbmd0aDtcbiAgICBpZiAoZGVsZXRlZCkge1xuICAgICAgICBub2RlLnN0eWxlLmFuaW1hdGlvbiA9IG5leHQuam9pbignLCAnKTtcbiAgICAgICAgYWN0aXZlIC09IGRlbGV0ZWQ7XG4gICAgICAgIGlmICghYWN0aXZlKVxuICAgICAgICAgICAgY2xlYXJfcnVsZXMoKTtcbiAgICB9XG59XG5mdW5jdGlvbiBjbGVhcl9ydWxlcygpIHtcbiAgICByYWYoKCkgPT4ge1xuICAgICAgICBpZiAoYWN0aXZlKVxuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICBhY3RpdmVfZG9jcy5mb3JFYWNoKGRvYyA9PiB7XG4gICAgICAgICAgICBjb25zdCBzdHlsZXNoZWV0ID0gZG9jLl9fc3ZlbHRlX3N0eWxlc2hlZXQ7XG4gICAgICAgICAgICBsZXQgaSA9IHN0eWxlc2hlZXQuY3NzUnVsZXMubGVuZ3RoO1xuICAgICAgICAgICAgd2hpbGUgKGktLSlcbiAgICAgICAgICAgICAgICBzdHlsZXNoZWV0LmRlbGV0ZVJ1bGUoaSk7XG4gICAgICAgICAgICBkb2MuX19zdmVsdGVfcnVsZXMgPSB7fTtcbiAgICAgICAgfSk7XG4gICAgICAgIGFjdGl2ZV9kb2NzLmNsZWFyKCk7XG4gICAgfSk7XG59XG5cbmZ1bmN0aW9uIGNyZWF0ZV9hbmltYXRpb24obm9kZSwgZnJvbSwgZm4sIHBhcmFtcykge1xuICAgIGlmICghZnJvbSlcbiAgICAgICAgcmV0dXJuIG5vb3A7XG4gICAgY29uc3QgdG8gPSBub2RlLmdldEJvdW5kaW5nQ2xpZW50UmVjdCgpO1xuICAgIGlmIChmcm9tLmxlZnQgPT09IHRvLmxlZnQgJiYgZnJvbS5yaWdodCA9PT0gdG8ucmlnaHQgJiYgZnJvbS50b3AgPT09IHRvLnRvcCAmJiBmcm9tLmJvdHRvbSA9PT0gdG8uYm90dG9tKVxuICAgICAgICByZXR1cm4gbm9vcDtcbiAgICBjb25zdCB7IGRlbGF5ID0gMCwgZHVyYXRpb24gPSAzMDAsIGVhc2luZyA9IGlkZW50aXR5LCBcbiAgICAvLyBAdHMtaWdub3JlIHRvZG86IHNob3VsZCB0aGlzIGJlIHNlcGFyYXRlZCBmcm9tIGRlc3RydWN0dXJpbmc/IE9yIHN0YXJ0L2VuZCBhZGRlZCB0byBwdWJsaWMgYXBpIGFuZCBkb2N1bWVudGF0aW9uP1xuICAgIHN0YXJ0OiBzdGFydF90aW1lID0gbm93KCkgKyBkZWxheSwgXG4gICAgLy8gQHRzLWlnbm9yZSB0b2RvOlxuICAgIGVuZCA9IHN0YXJ0X3RpbWUgKyBkdXJhdGlvbiwgdGljayA9IG5vb3AsIGNzcyB9ID0gZm4obm9kZSwgeyBmcm9tLCB0byB9LCBwYXJhbXMpO1xuICAgIGxldCBydW5uaW5nID0gdHJ1ZTtcbiAgICBsZXQgc3RhcnRlZCA9IGZhbHNlO1xuICAgIGxldCBuYW1lO1xuICAgIGZ1bmN0aW9uIHN0YXJ0KCkge1xuICAgICAgICBpZiAoY3NzKSB7XG4gICAgICAgICAgICBuYW1lID0gY3JlYXRlX3J1bGUobm9kZSwgMCwgMSwgZHVyYXRpb24sIGRlbGF5LCBlYXNpbmcsIGNzcyk7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKCFkZWxheSkge1xuICAgICAgICAgICAgc3RhcnRlZCA9IHRydWU7XG4gICAgICAgIH1cbiAgICB9XG4gICAgZnVuY3Rpb24gc3RvcCgpIHtcbiAgICAgICAgaWYgKGNzcylcbiAgICAgICAgICAgIGRlbGV0ZV9ydWxlKG5vZGUsIG5hbWUpO1xuICAgICAgICBydW5uaW5nID0gZmFsc2U7XG4gICAgfVxuICAgIGxvb3Aobm93ID0+IHtcbiAgICAgICAgaWYgKCFzdGFydGVkICYmIG5vdyA+PSBzdGFydF90aW1lKSB7XG4gICAgICAgICAgICBzdGFydGVkID0gdHJ1ZTtcbiAgICAgICAgfVxuICAgICAgICBpZiAoc3RhcnRlZCAmJiBub3cgPj0gZW5kKSB7XG4gICAgICAgICAgICB0aWNrKDEsIDApO1xuICAgICAgICAgICAgc3RvcCgpO1xuICAgICAgICB9XG4gICAgICAgIGlmICghcnVubmluZykge1xuICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgICB9XG4gICAgICAgIGlmIChzdGFydGVkKSB7XG4gICAgICAgICAgICBjb25zdCBwID0gbm93IC0gc3RhcnRfdGltZTtcbiAgICAgICAgICAgIGNvbnN0IHQgPSAwICsgMSAqIGVhc2luZyhwIC8gZHVyYXRpb24pO1xuICAgICAgICAgICAgdGljayh0LCAxIC0gdCk7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgfSk7XG4gICAgc3RhcnQoKTtcbiAgICB0aWNrKDAsIDEpO1xuICAgIHJldHVybiBzdG9wO1xufVxuZnVuY3Rpb24gZml4X3Bvc2l0aW9uKG5vZGUpIHtcbiAgICBjb25zdCBzdHlsZSA9IGdldENvbXB1dGVkU3R5bGUobm9kZSk7XG4gICAgaWYgKHN0eWxlLnBvc2l0aW9uICE9PSAnYWJzb2x1dGUnICYmIHN0eWxlLnBvc2l0aW9uICE9PSAnZml4ZWQnKSB7XG4gICAgICAgIGNvbnN0IHsgd2lkdGgsIGhlaWdodCB9ID0gc3R5bGU7XG4gICAgICAgIGNvbnN0IGEgPSBub2RlLmdldEJvdW5kaW5nQ2xpZW50UmVjdCgpO1xuICAgICAgICBub2RlLnN0eWxlLnBvc2l0aW9uID0gJ2Fic29sdXRlJztcbiAgICAgICAgbm9kZS5zdHlsZS53aWR0aCA9IHdpZHRoO1xuICAgICAgICBub2RlLnN0eWxlLmhlaWdodCA9IGhlaWdodDtcbiAgICAgICAgYWRkX3RyYW5zZm9ybShub2RlLCBhKTtcbiAgICB9XG59XG5mdW5jdGlvbiBhZGRfdHJhbnNmb3JtKG5vZGUsIGEpIHtcbiAgICBjb25zdCBiID0gbm9kZS5nZXRCb3VuZGluZ0NsaWVudFJlY3QoKTtcbiAgICBpZiAoYS5sZWZ0ICE9PSBiLmxlZnQgfHwgYS50b3AgIT09IGIudG9wKSB7XG4gICAgICAgIGNvbnN0IHN0eWxlID0gZ2V0Q29tcHV0ZWRTdHlsZShub2RlKTtcbiAgICAgICAgY29uc3QgdHJhbnNmb3JtID0gc3R5bGUudHJhbnNmb3JtID09PSAnbm9uZScgPyAnJyA6IHN0eWxlLnRyYW5zZm9ybTtcbiAgICAgICAgbm9kZS5zdHlsZS50cmFuc2Zvcm0gPSBgJHt0cmFuc2Zvcm19IHRyYW5zbGF0ZSgke2EubGVmdCAtIGIubGVmdH1weCwgJHthLnRvcCAtIGIudG9wfXB4KWA7XG4gICAgfVxufVxuXG5sZXQgY3VycmVudF9jb21wb25lbnQ7XG5mdW5jdGlvbiBzZXRfY3VycmVudF9jb21wb25lbnQoY29tcG9uZW50KSB7XG4gICAgY3VycmVudF9jb21wb25lbnQgPSBjb21wb25lbnQ7XG59XG5mdW5jdGlvbiBnZXRfY3VycmVudF9jb21wb25lbnQoKSB7XG4gICAgaWYgKCFjdXJyZW50X2NvbXBvbmVudClcbiAgICAgICAgdGhyb3cgbmV3IEVycm9yKCdGdW5jdGlvbiBjYWxsZWQgb3V0c2lkZSBjb21wb25lbnQgaW5pdGlhbGl6YXRpb24nKTtcbiAgICByZXR1cm4gY3VycmVudF9jb21wb25lbnQ7XG59XG5mdW5jdGlvbiBiZWZvcmVVcGRhdGUoZm4pIHtcbiAgICBnZXRfY3VycmVudF9jb21wb25lbnQoKS4kJC5iZWZvcmVfdXBkYXRlLnB1c2goZm4pO1xufVxuZnVuY3Rpb24gb25Nb3VudChmbikge1xuICAgIGdldF9jdXJyZW50X2NvbXBvbmVudCgpLiQkLm9uX21vdW50LnB1c2goZm4pO1xufVxuZnVuY3Rpb24gYWZ0ZXJVcGRhdGUoZm4pIHtcbiAgICBnZXRfY3VycmVudF9jb21wb25lbnQoKS4kJC5hZnRlcl91cGRhdGUucHVzaChmbik7XG59XG5mdW5jdGlvbiBvbkRlc3Ryb3koZm4pIHtcbiAgICBnZXRfY3VycmVudF9jb21wb25lbnQoKS4kJC5vbl9kZXN0cm95LnB1c2goZm4pO1xufVxuZnVuY3Rpb24gY3JlYXRlRXZlbnREaXNwYXRjaGVyKCkge1xuICAgIGNvbnN0IGNvbXBvbmVudCA9IGdldF9jdXJyZW50X2NvbXBvbmVudCgpO1xuICAgIHJldHVybiAodHlwZSwgZGV0YWlsKSA9PiB7XG4gICAgICAgIGNvbnN0IGNhbGxiYWNrcyA9IGNvbXBvbmVudC4kJC5jYWxsYmFja3NbdHlwZV07XG4gICAgICAgIGlmIChjYWxsYmFja3MpIHtcbiAgICAgICAgICAgIC8vIFRPRE8gYXJlIHRoZXJlIHNpdHVhdGlvbnMgd2hlcmUgZXZlbnRzIGNvdWxkIGJlIGRpc3BhdGNoZWRcbiAgICAgICAgICAgIC8vIGluIGEgc2VydmVyIChub24tRE9NKSBlbnZpcm9ubWVudD9cbiAgICAgICAgICAgIGNvbnN0IGV2ZW50ID0gY3VzdG9tX2V2ZW50KHR5cGUsIGRldGFpbCk7XG4gICAgICAgICAgICBjYWxsYmFja3Muc2xpY2UoKS5mb3JFYWNoKGZuID0+IHtcbiAgICAgICAgICAgICAgICBmbi5jYWxsKGNvbXBvbmVudCwgZXZlbnQpO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgIH1cbiAgICB9O1xufVxuZnVuY3Rpb24gc2V0Q29udGV4dChrZXksIGNvbnRleHQpIHtcbiAgICBnZXRfY3VycmVudF9jb21wb25lbnQoKS4kJC5jb250ZXh0LnNldChrZXksIGNvbnRleHQpO1xufVxuZnVuY3Rpb24gZ2V0Q29udGV4dChrZXkpIHtcbiAgICByZXR1cm4gZ2V0X2N1cnJlbnRfY29tcG9uZW50KCkuJCQuY29udGV4dC5nZXQoa2V5KTtcbn1cbi8vIFRPRE8gZmlndXJlIG91dCBpZiB3ZSBzdGlsbCB3YW50IHRvIHN1cHBvcnRcbi8vIHNob3J0aGFuZCBldmVudHMsIG9yIGlmIHdlIHdhbnQgdG8gaW1wbGVtZW50XG4vLyBhIHJlYWwgYnViYmxpbmcgbWVjaGFuaXNtXG5mdW5jdGlvbiBidWJibGUoY29tcG9uZW50LCBldmVudCkge1xuICAgIGNvbnN0IGNhbGxiYWNrcyA9IGNvbXBvbmVudC4kJC5jYWxsYmFja3NbZXZlbnQudHlwZV07XG4gICAgaWYgKGNhbGxiYWNrcykge1xuICAgICAgICBjYWxsYmFja3Muc2xpY2UoKS5mb3JFYWNoKGZuID0+IGZuKGV2ZW50KSk7XG4gICAgfVxufVxuXG5jb25zdCBkaXJ0eV9jb21wb25lbnRzID0gW107XG5jb25zdCBpbnRyb3MgPSB7IGVuYWJsZWQ6IGZhbHNlIH07XG5jb25zdCBiaW5kaW5nX2NhbGxiYWNrcyA9IFtdO1xuY29uc3QgcmVuZGVyX2NhbGxiYWNrcyA9IFtdO1xuY29uc3QgZmx1c2hfY2FsbGJhY2tzID0gW107XG5jb25zdCByZXNvbHZlZF9wcm9taXNlID0gUHJvbWlzZS5yZXNvbHZlKCk7XG5sZXQgdXBkYXRlX3NjaGVkdWxlZCA9IGZhbHNlO1xuZnVuY3Rpb24gc2NoZWR1bGVfdXBkYXRlKCkge1xuICAgIGlmICghdXBkYXRlX3NjaGVkdWxlZCkge1xuICAgICAgICB1cGRhdGVfc2NoZWR1bGVkID0gdHJ1ZTtcbiAgICAgICAgcmVzb2x2ZWRfcHJvbWlzZS50aGVuKGZsdXNoKTtcbiAgICB9XG59XG5mdW5jdGlvbiB0aWNrKCkge1xuICAgIHNjaGVkdWxlX3VwZGF0ZSgpO1xuICAgIHJldHVybiByZXNvbHZlZF9wcm9taXNlO1xufVxuZnVuY3Rpb24gYWRkX3JlbmRlcl9jYWxsYmFjayhmbikge1xuICAgIHJlbmRlcl9jYWxsYmFja3MucHVzaChmbik7XG59XG5mdW5jdGlvbiBhZGRfZmx1c2hfY2FsbGJhY2soZm4pIHtcbiAgICBmbHVzaF9jYWxsYmFja3MucHVzaChmbik7XG59XG5sZXQgZmx1c2hpbmcgPSBmYWxzZTtcbmNvbnN0IHNlZW5fY2FsbGJhY2tzID0gbmV3IFNldCgpO1xuZnVuY3Rpb24gZmx1c2goKSB7XG4gICAgaWYgKGZsdXNoaW5nKVxuICAgICAgICByZXR1cm47XG4gICAgZmx1c2hpbmcgPSB0cnVlO1xuICAgIGRvIHtcbiAgICAgICAgLy8gZmlyc3QsIGNhbGwgYmVmb3JlVXBkYXRlIGZ1bmN0aW9uc1xuICAgICAgICAvLyBhbmQgdXBkYXRlIGNvbXBvbmVudHNcbiAgICAgICAgZm9yIChsZXQgaSA9IDA7IGkgPCBkaXJ0eV9jb21wb25lbnRzLmxlbmd0aDsgaSArPSAxKSB7XG4gICAgICAgICAgICBjb25zdCBjb21wb25lbnQgPSBkaXJ0eV9jb21wb25lbnRzW2ldO1xuICAgICAgICAgICAgc2V0X2N1cnJlbnRfY29tcG9uZW50KGNvbXBvbmVudCk7XG4gICAgICAgICAgICB1cGRhdGUoY29tcG9uZW50LiQkKTtcbiAgICAgICAgfVxuICAgICAgICBzZXRfY3VycmVudF9jb21wb25lbnQobnVsbCk7XG4gICAgICAgIGRpcnR5X2NvbXBvbmVudHMubGVuZ3RoID0gMDtcbiAgICAgICAgd2hpbGUgKGJpbmRpbmdfY2FsbGJhY2tzLmxlbmd0aClcbiAgICAgICAgICAgIGJpbmRpbmdfY2FsbGJhY2tzLnBvcCgpKCk7XG4gICAgICAgIC8vIHRoZW4sIG9uY2UgY29tcG9uZW50cyBhcmUgdXBkYXRlZCwgY2FsbFxuICAgICAgICAvLyBhZnRlclVwZGF0ZSBmdW5jdGlvbnMuIFRoaXMgbWF5IGNhdXNlXG4gICAgICAgIC8vIHN1YnNlcXVlbnQgdXBkYXRlcy4uLlxuICAgICAgICBmb3IgKGxldCBpID0gMDsgaSA8IHJlbmRlcl9jYWxsYmFja3MubGVuZ3RoOyBpICs9IDEpIHtcbiAgICAgICAgICAgIGNvbnN0IGNhbGxiYWNrID0gcmVuZGVyX2NhbGxiYWNrc1tpXTtcbiAgICAgICAgICAgIGlmICghc2Vlbl9jYWxsYmFja3MuaGFzKGNhbGxiYWNrKSkge1xuICAgICAgICAgICAgICAgIC8vIC4uLnNvIGd1YXJkIGFnYWluc3QgaW5maW5pdGUgbG9vcHNcbiAgICAgICAgICAgICAgICBzZWVuX2NhbGxiYWNrcy5hZGQoY2FsbGJhY2spO1xuICAgICAgICAgICAgICAgIGNhbGxiYWNrKCk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgcmVuZGVyX2NhbGxiYWNrcy5sZW5ndGggPSAwO1xuICAgIH0gd2hpbGUgKGRpcnR5X2NvbXBvbmVudHMubGVuZ3RoKTtcbiAgICB3aGlsZSAoZmx1c2hfY2FsbGJhY2tzLmxlbmd0aCkge1xuICAgICAgICBmbHVzaF9jYWxsYmFja3MucG9wKCkoKTtcbiAgICB9XG4gICAgdXBkYXRlX3NjaGVkdWxlZCA9IGZhbHNlO1xuICAgIGZsdXNoaW5nID0gZmFsc2U7XG4gICAgc2Vlbl9jYWxsYmFja3MuY2xlYXIoKTtcbn1cbmZ1bmN0aW9uIHVwZGF0ZSgkJCkge1xuICAgIGlmICgkJC5mcmFnbWVudCAhPT0gbnVsbCkge1xuICAgICAgICAkJC51cGRhdGUoKTtcbiAgICAgICAgcnVuX2FsbCgkJC5iZWZvcmVfdXBkYXRlKTtcbiAgICAgICAgY29uc3QgZGlydHkgPSAkJC5kaXJ0eTtcbiAgICAgICAgJCQuZGlydHkgPSBbLTFdO1xuICAgICAgICAkJC5mcmFnbWVudCAmJiAkJC5mcmFnbWVudC5wKCQkLmN0eCwgZGlydHkpO1xuICAgICAgICAkJC5hZnRlcl91cGRhdGUuZm9yRWFjaChhZGRfcmVuZGVyX2NhbGxiYWNrKTtcbiAgICB9XG59XG5cbmxldCBwcm9taXNlO1xuZnVuY3Rpb24gd2FpdCgpIHtcbiAgICBpZiAoIXByb21pc2UpIHtcbiAgICAgICAgcHJvbWlzZSA9IFByb21pc2UucmVzb2x2ZSgpO1xuICAgICAgICBwcm9taXNlLnRoZW4oKCkgPT4ge1xuICAgICAgICAgICAgcHJvbWlzZSA9IG51bGw7XG4gICAgICAgIH0pO1xuICAgIH1cbiAgICByZXR1cm4gcHJvbWlzZTtcbn1cbmZ1bmN0aW9uIGRpc3BhdGNoKG5vZGUsIGRpcmVjdGlvbiwga2luZCkge1xuICAgIG5vZGUuZGlzcGF0Y2hFdmVudChjdXN0b21fZXZlbnQoYCR7ZGlyZWN0aW9uID8gJ2ludHJvJyA6ICdvdXRybyd9JHtraW5kfWApKTtcbn1cbmNvbnN0IG91dHJvaW5nID0gbmV3IFNldCgpO1xubGV0IG91dHJvcztcbmZ1bmN0aW9uIGdyb3VwX291dHJvcygpIHtcbiAgICBvdXRyb3MgPSB7XG4gICAgICAgIHI6IDAsXG4gICAgICAgIGM6IFtdLFxuICAgICAgICBwOiBvdXRyb3MgLy8gcGFyZW50IGdyb3VwXG4gICAgfTtcbn1cbmZ1bmN0aW9uIGNoZWNrX291dHJvcygpIHtcbiAgICBpZiAoIW91dHJvcy5yKSB7XG4gICAgICAgIHJ1bl9hbGwob3V0cm9zLmMpO1xuICAgIH1cbiAgICBvdXRyb3MgPSBvdXRyb3MucDtcbn1cbmZ1bmN0aW9uIHRyYW5zaXRpb25faW4oYmxvY2ssIGxvY2FsKSB7XG4gICAgaWYgKGJsb2NrICYmIGJsb2NrLmkpIHtcbiAgICAgICAgb3V0cm9pbmcuZGVsZXRlKGJsb2NrKTtcbiAgICAgICAgYmxvY2suaShsb2NhbCk7XG4gICAgfVxufVxuZnVuY3Rpb24gdHJhbnNpdGlvbl9vdXQoYmxvY2ssIGxvY2FsLCBkZXRhY2gsIGNhbGxiYWNrKSB7XG4gICAgaWYgKGJsb2NrICYmIGJsb2NrLm8pIHtcbiAgICAgICAgaWYgKG91dHJvaW5nLmhhcyhibG9jaykpXG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIG91dHJvaW5nLmFkZChibG9jayk7XG4gICAgICAgIG91dHJvcy5jLnB1c2goKCkgPT4ge1xuICAgICAgICAgICAgb3V0cm9pbmcuZGVsZXRlKGJsb2NrKTtcbiAgICAgICAgICAgIGlmIChjYWxsYmFjaykge1xuICAgICAgICAgICAgICAgIGlmIChkZXRhY2gpXG4gICAgICAgICAgICAgICAgICAgIGJsb2NrLmQoMSk7XG4gICAgICAgICAgICAgICAgY2FsbGJhY2soKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSk7XG4gICAgICAgIGJsb2NrLm8obG9jYWwpO1xuICAgIH1cbn1cbmNvbnN0IG51bGxfdHJhbnNpdGlvbiA9IHsgZHVyYXRpb246IDAgfTtcbmZ1bmN0aW9uIGNyZWF0ZV9pbl90cmFuc2l0aW9uKG5vZGUsIGZuLCBwYXJhbXMpIHtcbiAgICBsZXQgY29uZmlnID0gZm4obm9kZSwgcGFyYW1zKTtcbiAgICBsZXQgcnVubmluZyA9IGZhbHNlO1xuICAgIGxldCBhbmltYXRpb25fbmFtZTtcbiAgICBsZXQgdGFzaztcbiAgICBsZXQgdWlkID0gMDtcbiAgICBmdW5jdGlvbiBjbGVhbnVwKCkge1xuICAgICAgICBpZiAoYW5pbWF0aW9uX25hbWUpXG4gICAgICAgICAgICBkZWxldGVfcnVsZShub2RlLCBhbmltYXRpb25fbmFtZSk7XG4gICAgfVxuICAgIGZ1bmN0aW9uIGdvKCkge1xuICAgICAgICBjb25zdCB7IGRlbGF5ID0gMCwgZHVyYXRpb24gPSAzMDAsIGVhc2luZyA9IGlkZW50aXR5LCB0aWNrID0gbm9vcCwgY3NzIH0gPSBjb25maWcgfHwgbnVsbF90cmFuc2l0aW9uO1xuICAgICAgICBpZiAoY3NzKVxuICAgICAgICAgICAgYW5pbWF0aW9uX25hbWUgPSBjcmVhdGVfcnVsZShub2RlLCAwLCAxLCBkdXJhdGlvbiwgZGVsYXksIGVhc2luZywgY3NzLCB1aWQrKyk7XG4gICAgICAgIHRpY2soMCwgMSk7XG4gICAgICAgIGNvbnN0IHN0YXJ0X3RpbWUgPSBub3coKSArIGRlbGF5O1xuICAgICAgICBjb25zdCBlbmRfdGltZSA9IHN0YXJ0X3RpbWUgKyBkdXJhdGlvbjtcbiAgICAgICAgaWYgKHRhc2spXG4gICAgICAgICAgICB0YXNrLmFib3J0KCk7XG4gICAgICAgIHJ1bm5pbmcgPSB0cnVlO1xuICAgICAgICBhZGRfcmVuZGVyX2NhbGxiYWNrKCgpID0+IGRpc3BhdGNoKG5vZGUsIHRydWUsICdzdGFydCcpKTtcbiAgICAgICAgdGFzayA9IGxvb3Aobm93ID0+IHtcbiAgICAgICAgICAgIGlmIChydW5uaW5nKSB7XG4gICAgICAgICAgICAgICAgaWYgKG5vdyA+PSBlbmRfdGltZSkge1xuICAgICAgICAgICAgICAgICAgICB0aWNrKDEsIDApO1xuICAgICAgICAgICAgICAgICAgICBkaXNwYXRjaChub2RlLCB0cnVlLCAnZW5kJyk7XG4gICAgICAgICAgICAgICAgICAgIGNsZWFudXAoKTtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHJ1bm5pbmcgPSBmYWxzZTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgaWYgKG5vdyA+PSBzdGFydF90aW1lKSB7XG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IHQgPSBlYXNpbmcoKG5vdyAtIHN0YXJ0X3RpbWUpIC8gZHVyYXRpb24pO1xuICAgICAgICAgICAgICAgICAgICB0aWNrKHQsIDEgLSB0KTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICByZXR1cm4gcnVubmluZztcbiAgICAgICAgfSk7XG4gICAgfVxuICAgIGxldCBzdGFydGVkID0gZmFsc2U7XG4gICAgcmV0dXJuIHtcbiAgICAgICAgc3RhcnQoKSB7XG4gICAgICAgICAgICBpZiAoc3RhcnRlZClcbiAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICBkZWxldGVfcnVsZShub2RlKTtcbiAgICAgICAgICAgIGlmIChpc19mdW5jdGlvbihjb25maWcpKSB7XG4gICAgICAgICAgICAgICAgY29uZmlnID0gY29uZmlnKCk7XG4gICAgICAgICAgICAgICAgd2FpdCgpLnRoZW4oZ28pO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgICAgZ28oKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSxcbiAgICAgICAgaW52YWxpZGF0ZSgpIHtcbiAgICAgICAgICAgIHN0YXJ0ZWQgPSBmYWxzZTtcbiAgICAgICAgfSxcbiAgICAgICAgZW5kKCkge1xuICAgICAgICAgICAgaWYgKHJ1bm5pbmcpIHtcbiAgICAgICAgICAgICAgICBjbGVhbnVwKCk7XG4gICAgICAgICAgICAgICAgcnVubmluZyA9IGZhbHNlO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgfTtcbn1cbmZ1bmN0aW9uIGNyZWF0ZV9vdXRfdHJhbnNpdGlvbihub2RlLCBmbiwgcGFyYW1zKSB7XG4gICAgbGV0IGNvbmZpZyA9IGZuKG5vZGUsIHBhcmFtcyk7XG4gICAgbGV0IHJ1bm5pbmcgPSB0cnVlO1xuICAgIGxldCBhbmltYXRpb25fbmFtZTtcbiAgICBjb25zdCBncm91cCA9IG91dHJvcztcbiAgICBncm91cC5yICs9IDE7XG4gICAgZnVuY3Rpb24gZ28oKSB7XG4gICAgICAgIGNvbnN0IHsgZGVsYXkgPSAwLCBkdXJhdGlvbiA9IDMwMCwgZWFzaW5nID0gaWRlbnRpdHksIHRpY2sgPSBub29wLCBjc3MgfSA9IGNvbmZpZyB8fCBudWxsX3RyYW5zaXRpb247XG4gICAgICAgIGlmIChjc3MpXG4gICAgICAgICAgICBhbmltYXRpb25fbmFtZSA9IGNyZWF0ZV9ydWxlKG5vZGUsIDEsIDAsIGR1cmF0aW9uLCBkZWxheSwgZWFzaW5nLCBjc3MpO1xuICAgICAgICBjb25zdCBzdGFydF90aW1lID0gbm93KCkgKyBkZWxheTtcbiAgICAgICAgY29uc3QgZW5kX3RpbWUgPSBzdGFydF90aW1lICsgZHVyYXRpb247XG4gICAgICAgIGFkZF9yZW5kZXJfY2FsbGJhY2soKCkgPT4gZGlzcGF0Y2gobm9kZSwgZmFsc2UsICdzdGFydCcpKTtcbiAgICAgICAgbG9vcChub3cgPT4ge1xuICAgICAgICAgICAgaWYgKHJ1bm5pbmcpIHtcbiAgICAgICAgICAgICAgICBpZiAobm93ID49IGVuZF90aW1lKSB7XG4gICAgICAgICAgICAgICAgICAgIHRpY2soMCwgMSk7XG4gICAgICAgICAgICAgICAgICAgIGRpc3BhdGNoKG5vZGUsIGZhbHNlLCAnZW5kJyk7XG4gICAgICAgICAgICAgICAgICAgIGlmICghLS1ncm91cC5yKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAvLyB0aGlzIHdpbGwgcmVzdWx0IGluIGBlbmQoKWAgYmVpbmcgY2FsbGVkLFxuICAgICAgICAgICAgICAgICAgICAgICAgLy8gc28gd2UgZG9uJ3QgbmVlZCB0byBjbGVhbiB1cCBoZXJlXG4gICAgICAgICAgICAgICAgICAgICAgICBydW5fYWxsKGdyb3VwLmMpO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgaWYgKG5vdyA+PSBzdGFydF90aW1lKSB7XG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IHQgPSBlYXNpbmcoKG5vdyAtIHN0YXJ0X3RpbWUpIC8gZHVyYXRpb24pO1xuICAgICAgICAgICAgICAgICAgICB0aWNrKDEgLSB0LCB0KTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICByZXR1cm4gcnVubmluZztcbiAgICAgICAgfSk7XG4gICAgfVxuICAgIGlmIChpc19mdW5jdGlvbihjb25maWcpKSB7XG4gICAgICAgIHdhaXQoKS50aGVuKCgpID0+IHtcbiAgICAgICAgICAgIC8vIEB0cy1pZ25vcmVcbiAgICAgICAgICAgIGNvbmZpZyA9IGNvbmZpZygpO1xuICAgICAgICAgICAgZ28oKTtcbiAgICAgICAgfSk7XG4gICAgfVxuICAgIGVsc2Uge1xuICAgICAgICBnbygpO1xuICAgIH1cbiAgICByZXR1cm4ge1xuICAgICAgICBlbmQocmVzZXQpIHtcbiAgICAgICAgICAgIGlmIChyZXNldCAmJiBjb25maWcudGljaykge1xuICAgICAgICAgICAgICAgIGNvbmZpZy50aWNrKDEsIDApO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgaWYgKHJ1bm5pbmcpIHtcbiAgICAgICAgICAgICAgICBpZiAoYW5pbWF0aW9uX25hbWUpXG4gICAgICAgICAgICAgICAgICAgIGRlbGV0ZV9ydWxlKG5vZGUsIGFuaW1hdGlvbl9uYW1lKTtcbiAgICAgICAgICAgICAgICBydW5uaW5nID0gZmFsc2U7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICB9O1xufVxuZnVuY3Rpb24gY3JlYXRlX2JpZGlyZWN0aW9uYWxfdHJhbnNpdGlvbihub2RlLCBmbiwgcGFyYW1zLCBpbnRybykge1xuICAgIGxldCBjb25maWcgPSBmbihub2RlLCBwYXJhbXMpO1xuICAgIGxldCB0ID0gaW50cm8gPyAwIDogMTtcbiAgICBsZXQgcnVubmluZ19wcm9ncmFtID0gbnVsbDtcbiAgICBsZXQgcGVuZGluZ19wcm9ncmFtID0gbnVsbDtcbiAgICBsZXQgYW5pbWF0aW9uX25hbWUgPSBudWxsO1xuICAgIGZ1bmN0aW9uIGNsZWFyX2FuaW1hdGlvbigpIHtcbiAgICAgICAgaWYgKGFuaW1hdGlvbl9uYW1lKVxuICAgICAgICAgICAgZGVsZXRlX3J1bGUobm9kZSwgYW5pbWF0aW9uX25hbWUpO1xuICAgIH1cbiAgICBmdW5jdGlvbiBpbml0KHByb2dyYW0sIGR1cmF0aW9uKSB7XG4gICAgICAgIGNvbnN0IGQgPSBwcm9ncmFtLmIgLSB0O1xuICAgICAgICBkdXJhdGlvbiAqPSBNYXRoLmFicyhkKTtcbiAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgIGE6IHQsXG4gICAgICAgICAgICBiOiBwcm9ncmFtLmIsXG4gICAgICAgICAgICBkLFxuICAgICAgICAgICAgZHVyYXRpb24sXG4gICAgICAgICAgICBzdGFydDogcHJvZ3JhbS5zdGFydCxcbiAgICAgICAgICAgIGVuZDogcHJvZ3JhbS5zdGFydCArIGR1cmF0aW9uLFxuICAgICAgICAgICAgZ3JvdXA6IHByb2dyYW0uZ3JvdXBcbiAgICAgICAgfTtcbiAgICB9XG4gICAgZnVuY3Rpb24gZ28oYikge1xuICAgICAgICBjb25zdCB7IGRlbGF5ID0gMCwgZHVyYXRpb24gPSAzMDAsIGVhc2luZyA9IGlkZW50aXR5LCB0aWNrID0gbm9vcCwgY3NzIH0gPSBjb25maWcgfHwgbnVsbF90cmFuc2l0aW9uO1xuICAgICAgICBjb25zdCBwcm9ncmFtID0ge1xuICAgICAgICAgICAgc3RhcnQ6IG5vdygpICsgZGVsYXksXG4gICAgICAgICAgICBiXG4gICAgICAgIH07XG4gICAgICAgIGlmICghYikge1xuICAgICAgICAgICAgLy8gQHRzLWlnbm9yZSB0b2RvOiBpbXByb3ZlIHR5cGluZ3NcbiAgICAgICAgICAgIHByb2dyYW0uZ3JvdXAgPSBvdXRyb3M7XG4gICAgICAgICAgICBvdXRyb3MuciArPSAxO1xuICAgICAgICB9XG4gICAgICAgIGlmIChydW5uaW5nX3Byb2dyYW0gfHwgcGVuZGluZ19wcm9ncmFtKSB7XG4gICAgICAgICAgICBwZW5kaW5nX3Byb2dyYW0gPSBwcm9ncmFtO1xuICAgICAgICB9XG4gICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgLy8gaWYgdGhpcyBpcyBhbiBpbnRybywgYW5kIHRoZXJlJ3MgYSBkZWxheSwgd2UgbmVlZCB0byBkb1xuICAgICAgICAgICAgLy8gYW4gaW5pdGlhbCB0aWNrIGFuZC9vciBhcHBseSBDU1MgYW5pbWF0aW9uIGltbWVkaWF0ZWx5XG4gICAgICAgICAgICBpZiAoY3NzKSB7XG4gICAgICAgICAgICAgICAgY2xlYXJfYW5pbWF0aW9uKCk7XG4gICAgICAgICAgICAgICAgYW5pbWF0aW9uX25hbWUgPSBjcmVhdGVfcnVsZShub2RlLCB0LCBiLCBkdXJhdGlvbiwgZGVsYXksIGVhc2luZywgY3NzKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGlmIChiKVxuICAgICAgICAgICAgICAgIHRpY2soMCwgMSk7XG4gICAgICAgICAgICBydW5uaW5nX3Byb2dyYW0gPSBpbml0KHByb2dyYW0sIGR1cmF0aW9uKTtcbiAgICAgICAgICAgIGFkZF9yZW5kZXJfY2FsbGJhY2soKCkgPT4gZGlzcGF0Y2gobm9kZSwgYiwgJ3N0YXJ0JykpO1xuICAgICAgICAgICAgbG9vcChub3cgPT4ge1xuICAgICAgICAgICAgICAgIGlmIChwZW5kaW5nX3Byb2dyYW0gJiYgbm93ID4gcGVuZGluZ19wcm9ncmFtLnN0YXJ0KSB7XG4gICAgICAgICAgICAgICAgICAgIHJ1bm5pbmdfcHJvZ3JhbSA9IGluaXQocGVuZGluZ19wcm9ncmFtLCBkdXJhdGlvbik7XG4gICAgICAgICAgICAgICAgICAgIHBlbmRpbmdfcHJvZ3JhbSA9IG51bGw7XG4gICAgICAgICAgICAgICAgICAgIGRpc3BhdGNoKG5vZGUsIHJ1bm5pbmdfcHJvZ3JhbS5iLCAnc3RhcnQnKTtcbiAgICAgICAgICAgICAgICAgICAgaWYgKGNzcykge1xuICAgICAgICAgICAgICAgICAgICAgICAgY2xlYXJfYW5pbWF0aW9uKCk7XG4gICAgICAgICAgICAgICAgICAgICAgICBhbmltYXRpb25fbmFtZSA9IGNyZWF0ZV9ydWxlKG5vZGUsIHQsIHJ1bm5pbmdfcHJvZ3JhbS5iLCBydW5uaW5nX3Byb2dyYW0uZHVyYXRpb24sIDAsIGVhc2luZywgY29uZmlnLmNzcyk7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgaWYgKHJ1bm5pbmdfcHJvZ3JhbSkge1xuICAgICAgICAgICAgICAgICAgICBpZiAobm93ID49IHJ1bm5pbmdfcHJvZ3JhbS5lbmQpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHRpY2sodCA9IHJ1bm5pbmdfcHJvZ3JhbS5iLCAxIC0gdCk7XG4gICAgICAgICAgICAgICAgICAgICAgICBkaXNwYXRjaChub2RlLCBydW5uaW5nX3Byb2dyYW0uYiwgJ2VuZCcpO1xuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKCFwZW5kaW5nX3Byb2dyYW0pIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyB3ZSdyZSBkb25lXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKHJ1bm5pbmdfcHJvZ3JhbS5iKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIGludHJvIOKAlCB3ZSBjYW4gdGlkeSB1cCBpbW1lZGlhdGVseVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBjbGVhcl9hbmltYXRpb24oKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIG91dHJvIOKAlCBuZWVkcyB0byBiZSBjb29yZGluYXRlZFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAoIS0tcnVubmluZ19wcm9ncmFtLmdyb3VwLnIpXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBydW5fYWxsKHJ1bm5pbmdfcHJvZ3JhbS5ncm91cC5jKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICBydW5uaW5nX3Byb2dyYW0gPSBudWxsO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIGVsc2UgaWYgKG5vdyA+PSBydW5uaW5nX3Byb2dyYW0uc3RhcnQpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGNvbnN0IHAgPSBub3cgLSBydW5uaW5nX3Byb2dyYW0uc3RhcnQ7XG4gICAgICAgICAgICAgICAgICAgICAgICB0ID0gcnVubmluZ19wcm9ncmFtLmEgKyBydW5uaW5nX3Byb2dyYW0uZCAqIGVhc2luZyhwIC8gcnVubmluZ19wcm9ncmFtLmR1cmF0aW9uKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIHRpY2sodCwgMSAtIHQpO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIHJldHVybiAhIShydW5uaW5nX3Byb2dyYW0gfHwgcGVuZGluZ19wcm9ncmFtKTtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9XG4gICAgfVxuICAgIHJldHVybiB7XG4gICAgICAgIHJ1bihiKSB7XG4gICAgICAgICAgICBpZiAoaXNfZnVuY3Rpb24oY29uZmlnKSkge1xuICAgICAgICAgICAgICAgIHdhaXQoKS50aGVuKCgpID0+IHtcbiAgICAgICAgICAgICAgICAgICAgLy8gQHRzLWlnbm9yZVxuICAgICAgICAgICAgICAgICAgICBjb25maWcgPSBjb25maWcoKTtcbiAgICAgICAgICAgICAgICAgICAgZ28oYik7XG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgICBnbyhiKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSxcbiAgICAgICAgZW5kKCkge1xuICAgICAgICAgICAgY2xlYXJfYW5pbWF0aW9uKCk7XG4gICAgICAgICAgICBydW5uaW5nX3Byb2dyYW0gPSBwZW5kaW5nX3Byb2dyYW0gPSBudWxsO1xuICAgICAgICB9XG4gICAgfTtcbn1cblxuZnVuY3Rpb24gaGFuZGxlX3Byb21pc2UocHJvbWlzZSwgaW5mbykge1xuICAgIGNvbnN0IHRva2VuID0gaW5mby50b2tlbiA9IHt9O1xuICAgIGZ1bmN0aW9uIHVwZGF0ZSh0eXBlLCBpbmRleCwga2V5LCB2YWx1ZSkge1xuICAgICAgICBpZiAoaW5mby50b2tlbiAhPT0gdG9rZW4pXG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIGluZm8ucmVzb2x2ZWQgPSB2YWx1ZTtcbiAgICAgICAgbGV0IGNoaWxkX2N0eCA9IGluZm8uY3R4O1xuICAgICAgICBpZiAoa2V5ICE9PSB1bmRlZmluZWQpIHtcbiAgICAgICAgICAgIGNoaWxkX2N0eCA9IGNoaWxkX2N0eC5zbGljZSgpO1xuICAgICAgICAgICAgY2hpbGRfY3R4W2tleV0gPSB2YWx1ZTtcbiAgICAgICAgfVxuICAgICAgICBjb25zdCBibG9jayA9IHR5cGUgJiYgKGluZm8uY3VycmVudCA9IHR5cGUpKGNoaWxkX2N0eCk7XG4gICAgICAgIGxldCBuZWVkc19mbHVzaCA9IGZhbHNlO1xuICAgICAgICBpZiAoaW5mby5ibG9jaykge1xuICAgICAgICAgICAgaWYgKGluZm8uYmxvY2tzKSB7XG4gICAgICAgICAgICAgICAgaW5mby5ibG9ja3MuZm9yRWFjaCgoYmxvY2ssIGkpID0+IHtcbiAgICAgICAgICAgICAgICAgICAgaWYgKGkgIT09IGluZGV4ICYmIGJsb2NrKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBncm91cF9vdXRyb3MoKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIHRyYW5zaXRpb25fb3V0KGJsb2NrLCAxLCAxLCAoKSA9PiB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgaW5mby5ibG9ja3NbaV0gPSBudWxsO1xuICAgICAgICAgICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgICAgICAgICBjaGVja19vdXRyb3MoKTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgICAgaW5mby5ibG9jay5kKDEpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgYmxvY2suYygpO1xuICAgICAgICAgICAgdHJhbnNpdGlvbl9pbihibG9jaywgMSk7XG4gICAgICAgICAgICBibG9jay5tKGluZm8ubW91bnQoKSwgaW5mby5hbmNob3IpO1xuICAgICAgICAgICAgbmVlZHNfZmx1c2ggPSB0cnVlO1xuICAgICAgICB9XG4gICAgICAgIGluZm8uYmxvY2sgPSBibG9jaztcbiAgICAgICAgaWYgKGluZm8uYmxvY2tzKVxuICAgICAgICAgICAgaW5mby5ibG9ja3NbaW5kZXhdID0gYmxvY2s7XG4gICAgICAgIGlmIChuZWVkc19mbHVzaCkge1xuICAgICAgICAgICAgZmx1c2goKTtcbiAgICAgICAgfVxuICAgIH1cbiAgICBpZiAoaXNfcHJvbWlzZShwcm9taXNlKSkge1xuICAgICAgICBjb25zdCBjdXJyZW50X2NvbXBvbmVudCA9IGdldF9jdXJyZW50X2NvbXBvbmVudCgpO1xuICAgICAgICBwcm9taXNlLnRoZW4odmFsdWUgPT4ge1xuICAgICAgICAgICAgc2V0X2N1cnJlbnRfY29tcG9uZW50KGN1cnJlbnRfY29tcG9uZW50KTtcbiAgICAgICAgICAgIHVwZGF0ZShpbmZvLnRoZW4sIDEsIGluZm8udmFsdWUsIHZhbHVlKTtcbiAgICAgICAgICAgIHNldF9jdXJyZW50X2NvbXBvbmVudChudWxsKTtcbiAgICAgICAgfSwgZXJyb3IgPT4ge1xuICAgICAgICAgICAgc2V0X2N1cnJlbnRfY29tcG9uZW50KGN1cnJlbnRfY29tcG9uZW50KTtcbiAgICAgICAgICAgIHVwZGF0ZShpbmZvLmNhdGNoLCAyLCBpbmZvLmVycm9yLCBlcnJvcik7XG4gICAgICAgICAgICBzZXRfY3VycmVudF9jb21wb25lbnQobnVsbCk7XG4gICAgICAgICAgICBpZiAoIWluZm8uaGFzQ2F0Y2gpIHtcbiAgICAgICAgICAgICAgICB0aHJvdyBlcnJvcjtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSk7XG4gICAgICAgIC8vIGlmIHdlIHByZXZpb3VzbHkgaGFkIGEgdGhlbi9jYXRjaCBibG9jaywgZGVzdHJveSBpdFxuICAgICAgICBpZiAoaW5mby5jdXJyZW50ICE9PSBpbmZvLnBlbmRpbmcpIHtcbiAgICAgICAgICAgIHVwZGF0ZShpbmZvLnBlbmRpbmcsIDApO1xuICAgICAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgICAgIH1cbiAgICB9XG4gICAgZWxzZSB7XG4gICAgICAgIGlmIChpbmZvLmN1cnJlbnQgIT09IGluZm8udGhlbikge1xuICAgICAgICAgICAgdXBkYXRlKGluZm8udGhlbiwgMSwgaW5mby52YWx1ZSwgcHJvbWlzZSk7XG4gICAgICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICAgICAgfVxuICAgICAgICBpbmZvLnJlc29sdmVkID0gcHJvbWlzZTtcbiAgICB9XG59XG5cbmNvbnN0IGdsb2JhbHMgPSAodHlwZW9mIHdpbmRvdyAhPT0gJ3VuZGVmaW5lZCdcbiAgICA/IHdpbmRvd1xuICAgIDogdHlwZW9mIGdsb2JhbFRoaXMgIT09ICd1bmRlZmluZWQnXG4gICAgICAgID8gZ2xvYmFsVGhpc1xuICAgICAgICA6IGdsb2JhbCk7XG5cbmZ1bmN0aW9uIGRlc3Ryb3lfYmxvY2soYmxvY2ssIGxvb2t1cCkge1xuICAgIGJsb2NrLmQoMSk7XG4gICAgbG9va3VwLmRlbGV0ZShibG9jay5rZXkpO1xufVxuZnVuY3Rpb24gb3V0cm9fYW5kX2Rlc3Ryb3lfYmxvY2soYmxvY2ssIGxvb2t1cCkge1xuICAgIHRyYW5zaXRpb25fb3V0KGJsb2NrLCAxLCAxLCAoKSA9PiB7XG4gICAgICAgIGxvb2t1cC5kZWxldGUoYmxvY2sua2V5KTtcbiAgICB9KTtcbn1cbmZ1bmN0aW9uIGZpeF9hbmRfZGVzdHJveV9ibG9jayhibG9jaywgbG9va3VwKSB7XG4gICAgYmxvY2suZigpO1xuICAgIGRlc3Ryb3lfYmxvY2soYmxvY2ssIGxvb2t1cCk7XG59XG5mdW5jdGlvbiBmaXhfYW5kX291dHJvX2FuZF9kZXN0cm95X2Jsb2NrKGJsb2NrLCBsb29rdXApIHtcbiAgICBibG9jay5mKCk7XG4gICAgb3V0cm9fYW5kX2Rlc3Ryb3lfYmxvY2soYmxvY2ssIGxvb2t1cCk7XG59XG5mdW5jdGlvbiB1cGRhdGVfa2V5ZWRfZWFjaChvbGRfYmxvY2tzLCBkaXJ0eSwgZ2V0X2tleSwgZHluYW1pYywgY3R4LCBsaXN0LCBsb29rdXAsIG5vZGUsIGRlc3Ryb3ksIGNyZWF0ZV9lYWNoX2Jsb2NrLCBuZXh0LCBnZXRfY29udGV4dCkge1xuICAgIGxldCBvID0gb2xkX2Jsb2Nrcy5sZW5ndGg7XG4gICAgbGV0IG4gPSBsaXN0Lmxlbmd0aDtcbiAgICBsZXQgaSA9IG87XG4gICAgY29uc3Qgb2xkX2luZGV4ZXMgPSB7fTtcbiAgICB3aGlsZSAoaS0tKVxuICAgICAgICBvbGRfaW5kZXhlc1tvbGRfYmxvY2tzW2ldLmtleV0gPSBpO1xuICAgIGNvbnN0IG5ld19ibG9ja3MgPSBbXTtcbiAgICBjb25zdCBuZXdfbG9va3VwID0gbmV3IE1hcCgpO1xuICAgIGNvbnN0IGRlbHRhcyA9IG5ldyBNYXAoKTtcbiAgICBpID0gbjtcbiAgICB3aGlsZSAoaS0tKSB7XG4gICAgICAgIGNvbnN0IGNoaWxkX2N0eCA9IGdldF9jb250ZXh0KGN0eCwgbGlzdCwgaSk7XG4gICAgICAgIGNvbnN0IGtleSA9IGdldF9rZXkoY2hpbGRfY3R4KTtcbiAgICAgICAgbGV0IGJsb2NrID0gbG9va3VwLmdldChrZXkpO1xuICAgICAgICBpZiAoIWJsb2NrKSB7XG4gICAgICAgICAgICBibG9jayA9IGNyZWF0ZV9lYWNoX2Jsb2NrKGtleSwgY2hpbGRfY3R4KTtcbiAgICAgICAgICAgIGJsb2NrLmMoKTtcbiAgICAgICAgfVxuICAgICAgICBlbHNlIGlmIChkeW5hbWljKSB7XG4gICAgICAgICAgICBibG9jay5wKGNoaWxkX2N0eCwgZGlydHkpO1xuICAgICAgICB9XG4gICAgICAgIG5ld19sb29rdXAuc2V0KGtleSwgbmV3X2Jsb2Nrc1tpXSA9IGJsb2NrKTtcbiAgICAgICAgaWYgKGtleSBpbiBvbGRfaW5kZXhlcylcbiAgICAgICAgICAgIGRlbHRhcy5zZXQoa2V5LCBNYXRoLmFicyhpIC0gb2xkX2luZGV4ZXNba2V5XSkpO1xuICAgIH1cbiAgICBjb25zdCB3aWxsX21vdmUgPSBuZXcgU2V0KCk7XG4gICAgY29uc3QgZGlkX21vdmUgPSBuZXcgU2V0KCk7XG4gICAgZnVuY3Rpb24gaW5zZXJ0KGJsb2NrKSB7XG4gICAgICAgIHRyYW5zaXRpb25faW4oYmxvY2ssIDEpO1xuICAgICAgICBibG9jay5tKG5vZGUsIG5leHQpO1xuICAgICAgICBsb29rdXAuc2V0KGJsb2NrLmtleSwgYmxvY2spO1xuICAgICAgICBuZXh0ID0gYmxvY2suZmlyc3Q7XG4gICAgICAgIG4tLTtcbiAgICB9XG4gICAgd2hpbGUgKG8gJiYgbikge1xuICAgICAgICBjb25zdCBuZXdfYmxvY2sgPSBuZXdfYmxvY2tzW24gLSAxXTtcbiAgICAgICAgY29uc3Qgb2xkX2Jsb2NrID0gb2xkX2Jsb2Nrc1tvIC0gMV07XG4gICAgICAgIGNvbnN0IG5ld19rZXkgPSBuZXdfYmxvY2sua2V5O1xuICAgICAgICBjb25zdCBvbGRfa2V5ID0gb2xkX2Jsb2NrLmtleTtcbiAgICAgICAgaWYgKG5ld19ibG9jayA9PT0gb2xkX2Jsb2NrKSB7XG4gICAgICAgICAgICAvLyBkbyBub3RoaW5nXG4gICAgICAgICAgICBuZXh0ID0gbmV3X2Jsb2NrLmZpcnN0O1xuICAgICAgICAgICAgby0tO1xuICAgICAgICAgICAgbi0tO1xuICAgICAgICB9XG4gICAgICAgIGVsc2UgaWYgKCFuZXdfbG9va3VwLmhhcyhvbGRfa2V5KSkge1xuICAgICAgICAgICAgLy8gcmVtb3ZlIG9sZCBibG9ja1xuICAgICAgICAgICAgZGVzdHJveShvbGRfYmxvY2ssIGxvb2t1cCk7XG4gICAgICAgICAgICBvLS07XG4gICAgICAgIH1cbiAgICAgICAgZWxzZSBpZiAoIWxvb2t1cC5oYXMobmV3X2tleSkgfHwgd2lsbF9tb3ZlLmhhcyhuZXdfa2V5KSkge1xuICAgICAgICAgICAgaW5zZXJ0KG5ld19ibG9jayk7XG4gICAgICAgIH1cbiAgICAgICAgZWxzZSBpZiAoZGlkX21vdmUuaGFzKG9sZF9rZXkpKSB7XG4gICAgICAgICAgICBvLS07XG4gICAgICAgIH1cbiAgICAgICAgZWxzZSBpZiAoZGVsdGFzLmdldChuZXdfa2V5KSA+IGRlbHRhcy5nZXQob2xkX2tleSkpIHtcbiAgICAgICAgICAgIGRpZF9tb3ZlLmFkZChuZXdfa2V5KTtcbiAgICAgICAgICAgIGluc2VydChuZXdfYmxvY2spO1xuICAgICAgICB9XG4gICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgd2lsbF9tb3ZlLmFkZChvbGRfa2V5KTtcbiAgICAgICAgICAgIG8tLTtcbiAgICAgICAgfVxuICAgIH1cbiAgICB3aGlsZSAoby0tKSB7XG4gICAgICAgIGNvbnN0IG9sZF9ibG9jayA9IG9sZF9ibG9ja3Nbb107XG4gICAgICAgIGlmICghbmV3X2xvb2t1cC5oYXMob2xkX2Jsb2NrLmtleSkpXG4gICAgICAgICAgICBkZXN0cm95KG9sZF9ibG9jaywgbG9va3VwKTtcbiAgICB9XG4gICAgd2hpbGUgKG4pXG4gICAgICAgIGluc2VydChuZXdfYmxvY2tzW24gLSAxXSk7XG4gICAgcmV0dXJuIG5ld19ibG9ja3M7XG59XG5mdW5jdGlvbiB2YWxpZGF0ZV9lYWNoX2tleXMoY3R4LCBsaXN0LCBnZXRfY29udGV4dCwgZ2V0X2tleSkge1xuICAgIGNvbnN0IGtleXMgPSBuZXcgU2V0KCk7XG4gICAgZm9yIChsZXQgaSA9IDA7IGkgPCBsaXN0Lmxlbmd0aDsgaSsrKSB7XG4gICAgICAgIGNvbnN0IGtleSA9IGdldF9rZXkoZ2V0X2NvbnRleHQoY3R4LCBsaXN0LCBpKSk7XG4gICAgICAgIGlmIChrZXlzLmhhcyhrZXkpKSB7XG4gICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoJ0Nhbm5vdCBoYXZlIGR1cGxpY2F0ZSBrZXlzIGluIGEga2V5ZWQgZWFjaCcpO1xuICAgICAgICB9XG4gICAgICAgIGtleXMuYWRkKGtleSk7XG4gICAgfVxufVxuXG5mdW5jdGlvbiBnZXRfc3ByZWFkX3VwZGF0ZShsZXZlbHMsIHVwZGF0ZXMpIHtcbiAgICBjb25zdCB1cGRhdGUgPSB7fTtcbiAgICBjb25zdCB0b19udWxsX291dCA9IHt9O1xuICAgIGNvbnN0IGFjY291bnRlZF9mb3IgPSB7ICQkc2NvcGU6IDEgfTtcbiAgICBsZXQgaSA9IGxldmVscy5sZW5ndGg7XG4gICAgd2hpbGUgKGktLSkge1xuICAgICAgICBjb25zdCBvID0gbGV2ZWxzW2ldO1xuICAgICAgICBjb25zdCBuID0gdXBkYXRlc1tpXTtcbiAgICAgICAgaWYgKG4pIHtcbiAgICAgICAgICAgIGZvciAoY29uc3Qga2V5IGluIG8pIHtcbiAgICAgICAgICAgICAgICBpZiAoIShrZXkgaW4gbikpXG4gICAgICAgICAgICAgICAgICAgIHRvX251bGxfb3V0W2tleV0gPSAxO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgZm9yIChjb25zdCBrZXkgaW4gbikge1xuICAgICAgICAgICAgICAgIGlmICghYWNjb3VudGVkX2ZvcltrZXldKSB7XG4gICAgICAgICAgICAgICAgICAgIHVwZGF0ZVtrZXldID0gbltrZXldO1xuICAgICAgICAgICAgICAgICAgICBhY2NvdW50ZWRfZm9yW2tleV0gPSAxO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGxldmVsc1tpXSA9IG47XG4gICAgICAgIH1cbiAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICBmb3IgKGNvbnN0IGtleSBpbiBvKSB7XG4gICAgICAgICAgICAgICAgYWNjb3VudGVkX2ZvcltrZXldID0gMTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgIH1cbiAgICBmb3IgKGNvbnN0IGtleSBpbiB0b19udWxsX291dCkge1xuICAgICAgICBpZiAoIShrZXkgaW4gdXBkYXRlKSlcbiAgICAgICAgICAgIHVwZGF0ZVtrZXldID0gdW5kZWZpbmVkO1xuICAgIH1cbiAgICByZXR1cm4gdXBkYXRlO1xufVxuZnVuY3Rpb24gZ2V0X3NwcmVhZF9vYmplY3Qoc3ByZWFkX3Byb3BzKSB7XG4gICAgcmV0dXJuIHR5cGVvZiBzcHJlYWRfcHJvcHMgPT09ICdvYmplY3QnICYmIHNwcmVhZF9wcm9wcyAhPT0gbnVsbCA/IHNwcmVhZF9wcm9wcyA6IHt9O1xufVxuXG4vLyBzb3VyY2U6IGh0dHBzOi8vaHRtbC5zcGVjLndoYXR3Zy5vcmcvbXVsdGlwYWdlL2luZGljZXMuaHRtbFxuY29uc3QgYm9vbGVhbl9hdHRyaWJ1dGVzID0gbmV3IFNldChbXG4gICAgJ2FsbG93ZnVsbHNjcmVlbicsXG4gICAgJ2FsbG93cGF5bWVudHJlcXVlc3QnLFxuICAgICdhc3luYycsXG4gICAgJ2F1dG9mb2N1cycsXG4gICAgJ2F1dG9wbGF5JyxcbiAgICAnY2hlY2tlZCcsXG4gICAgJ2NvbnRyb2xzJyxcbiAgICAnZGVmYXVsdCcsXG4gICAgJ2RlZmVyJyxcbiAgICAnZGlzYWJsZWQnLFxuICAgICdmb3Jtbm92YWxpZGF0ZScsXG4gICAgJ2hpZGRlbicsXG4gICAgJ2lzbWFwJyxcbiAgICAnbG9vcCcsXG4gICAgJ211bHRpcGxlJyxcbiAgICAnbXV0ZWQnLFxuICAgICdub21vZHVsZScsXG4gICAgJ25vdmFsaWRhdGUnLFxuICAgICdvcGVuJyxcbiAgICAncGxheXNpbmxpbmUnLFxuICAgICdyZWFkb25seScsXG4gICAgJ3JlcXVpcmVkJyxcbiAgICAncmV2ZXJzZWQnLFxuICAgICdzZWxlY3RlZCdcbl0pO1xuXG5jb25zdCBpbnZhbGlkX2F0dHJpYnV0ZV9uYW1lX2NoYXJhY3RlciA9IC9bXFxzJ1wiPi89XFx1e0ZERDB9LVxcdXtGREVGfVxcdXtGRkZFfVxcdXtGRkZGfVxcdXsxRkZGRX1cXHV7MUZGRkZ9XFx1ezJGRkZFfVxcdXsyRkZGRn1cXHV7M0ZGRkV9XFx1ezNGRkZGfVxcdXs0RkZGRX1cXHV7NEZGRkZ9XFx1ezVGRkZFfVxcdXs1RkZGRn1cXHV7NkZGRkV9XFx1ezZGRkZGfVxcdXs3RkZGRX1cXHV7N0ZGRkZ9XFx1ezhGRkZFfVxcdXs4RkZGRn1cXHV7OUZGRkV9XFx1ezlGRkZGfVxcdXtBRkZGRX1cXHV7QUZGRkZ9XFx1e0JGRkZFfVxcdXtCRkZGRn1cXHV7Q0ZGRkV9XFx1e0NGRkZGfVxcdXtERkZGRX1cXHV7REZGRkZ9XFx1e0VGRkZFfVxcdXtFRkZGRn1cXHV7RkZGRkV9XFx1e0ZGRkZGfVxcdXsxMEZGRkV9XFx1ezEwRkZGRn1dL3U7XG4vLyBodHRwczovL2h0bWwuc3BlYy53aGF0d2cub3JnL211bHRpcGFnZS9zeW50YXguaHRtbCNhdHRyaWJ1dGVzLTJcbi8vIGh0dHBzOi8vaW5mcmEuc3BlYy53aGF0d2cub3JnLyNub25jaGFyYWN0ZXJcbmZ1bmN0aW9uIHNwcmVhZChhcmdzLCBjbGFzc2VzX3RvX2FkZCkge1xuICAgIGNvbnN0IGF0dHJpYnV0ZXMgPSBPYmplY3QuYXNzaWduKHt9LCAuLi5hcmdzKTtcbiAgICBpZiAoY2xhc3Nlc190b19hZGQpIHtcbiAgICAgICAgaWYgKGF0dHJpYnV0ZXMuY2xhc3MgPT0gbnVsbCkge1xuICAgICAgICAgICAgYXR0cmlidXRlcy5jbGFzcyA9IGNsYXNzZXNfdG9fYWRkO1xuICAgICAgICB9XG4gICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgYXR0cmlidXRlcy5jbGFzcyArPSAnICcgKyBjbGFzc2VzX3RvX2FkZDtcbiAgICAgICAgfVxuICAgIH1cbiAgICBsZXQgc3RyID0gJyc7XG4gICAgT2JqZWN0LmtleXMoYXR0cmlidXRlcykuZm9yRWFjaChuYW1lID0+IHtcbiAgICAgICAgaWYgKGludmFsaWRfYXR0cmlidXRlX25hbWVfY2hhcmFjdGVyLnRlc3QobmFtZSkpXG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIGNvbnN0IHZhbHVlID0gYXR0cmlidXRlc1tuYW1lXTtcbiAgICAgICAgaWYgKHZhbHVlID09PSB0cnVlKVxuICAgICAgICAgICAgc3RyICs9ICcgJyArIG5hbWU7XG4gICAgICAgIGVsc2UgaWYgKGJvb2xlYW5fYXR0cmlidXRlcy5oYXMobmFtZS50b0xvd2VyQ2FzZSgpKSkge1xuICAgICAgICAgICAgaWYgKHZhbHVlKVxuICAgICAgICAgICAgICAgIHN0ciArPSAnICcgKyBuYW1lO1xuICAgICAgICB9XG4gICAgICAgIGVsc2UgaWYgKHZhbHVlICE9IG51bGwpIHtcbiAgICAgICAgICAgIHN0ciArPSBgICR7bmFtZX09XCIke1N0cmluZyh2YWx1ZSkucmVwbGFjZSgvXCIvZywgJyYjMzQ7JykucmVwbGFjZSgvJy9nLCAnJiMzOTsnKX1cImA7XG4gICAgICAgIH1cbiAgICB9KTtcbiAgICByZXR1cm4gc3RyO1xufVxuY29uc3QgZXNjYXBlZCA9IHtcbiAgICAnXCInOiAnJnF1b3Q7JyxcbiAgICBcIidcIjogJyYjMzk7JyxcbiAgICAnJic6ICcmYW1wOycsXG4gICAgJzwnOiAnJmx0OycsXG4gICAgJz4nOiAnJmd0Oydcbn07XG5mdW5jdGlvbiBlc2NhcGUoaHRtbCkge1xuICAgIHJldHVybiBTdHJpbmcoaHRtbCkucmVwbGFjZSgvW1wiJyY8Pl0vZywgbWF0Y2ggPT4gZXNjYXBlZFttYXRjaF0pO1xufVxuZnVuY3Rpb24gZWFjaChpdGVtcywgZm4pIHtcbiAgICBsZXQgc3RyID0gJyc7XG4gICAgZm9yIChsZXQgaSA9IDA7IGkgPCBpdGVtcy5sZW5ndGg7IGkgKz0gMSkge1xuICAgICAgICBzdHIgKz0gZm4oaXRlbXNbaV0sIGkpO1xuICAgIH1cbiAgICByZXR1cm4gc3RyO1xufVxuY29uc3QgbWlzc2luZ19jb21wb25lbnQgPSB7XG4gICAgJCRyZW5kZXI6ICgpID0+ICcnXG59O1xuZnVuY3Rpb24gdmFsaWRhdGVfY29tcG9uZW50KGNvbXBvbmVudCwgbmFtZSkge1xuICAgIGlmICghY29tcG9uZW50IHx8ICFjb21wb25lbnQuJCRyZW5kZXIpIHtcbiAgICAgICAgaWYgKG5hbWUgPT09ICdzdmVsdGU6Y29tcG9uZW50JylcbiAgICAgICAgICAgIG5hbWUgKz0gJyB0aGlzPXsuLi59JztcbiAgICAgICAgdGhyb3cgbmV3IEVycm9yKGA8JHtuYW1lfT4gaXMgbm90IGEgdmFsaWQgU1NSIGNvbXBvbmVudC4gWW91IG1heSBuZWVkIHRvIHJldmlldyB5b3VyIGJ1aWxkIGNvbmZpZyB0byBlbnN1cmUgdGhhdCBkZXBlbmRlbmNpZXMgYXJlIGNvbXBpbGVkLCByYXRoZXIgdGhhbiBpbXBvcnRlZCBhcyBwcmUtY29tcGlsZWQgbW9kdWxlc2ApO1xuICAgIH1cbiAgICByZXR1cm4gY29tcG9uZW50O1xufVxuZnVuY3Rpb24gZGVidWcoZmlsZSwgbGluZSwgY29sdW1uLCB2YWx1ZXMpIHtcbiAgICBjb25zb2xlLmxvZyhge0BkZWJ1Z30gJHtmaWxlID8gZmlsZSArICcgJyA6ICcnfSgke2xpbmV9OiR7Y29sdW1ufSlgKTsgLy8gZXNsaW50LWRpc2FibGUtbGluZSBuby1jb25zb2xlXG4gICAgY29uc29sZS5sb2codmFsdWVzKTsgLy8gZXNsaW50LWRpc2FibGUtbGluZSBuby1jb25zb2xlXG4gICAgcmV0dXJuICcnO1xufVxubGV0IG9uX2Rlc3Ryb3k7XG5mdW5jdGlvbiBjcmVhdGVfc3NyX2NvbXBvbmVudChmbikge1xuICAgIGZ1bmN0aW9uICQkcmVuZGVyKHJlc3VsdCwgcHJvcHMsIGJpbmRpbmdzLCBzbG90cykge1xuICAgICAgICBjb25zdCBwYXJlbnRfY29tcG9uZW50ID0gY3VycmVudF9jb21wb25lbnQ7XG4gICAgICAgIGNvbnN0ICQkID0ge1xuICAgICAgICAgICAgb25fZGVzdHJveSxcbiAgICAgICAgICAgIGNvbnRleHQ6IG5ldyBNYXAocGFyZW50X2NvbXBvbmVudCA/IHBhcmVudF9jb21wb25lbnQuJCQuY29udGV4dCA6IFtdKSxcbiAgICAgICAgICAgIC8vIHRoZXNlIHdpbGwgYmUgaW1tZWRpYXRlbHkgZGlzY2FyZGVkXG4gICAgICAgICAgICBvbl9tb3VudDogW10sXG4gICAgICAgICAgICBiZWZvcmVfdXBkYXRlOiBbXSxcbiAgICAgICAgICAgIGFmdGVyX3VwZGF0ZTogW10sXG4gICAgICAgICAgICBjYWxsYmFja3M6IGJsYW5rX29iamVjdCgpXG4gICAgICAgIH07XG4gICAgICAgIHNldF9jdXJyZW50X2NvbXBvbmVudCh7ICQkIH0pO1xuICAgICAgICBjb25zdCBodG1sID0gZm4ocmVzdWx0LCBwcm9wcywgYmluZGluZ3MsIHNsb3RzKTtcbiAgICAgICAgc2V0X2N1cnJlbnRfY29tcG9uZW50KHBhcmVudF9jb21wb25lbnQpO1xuICAgICAgICByZXR1cm4gaHRtbDtcbiAgICB9XG4gICAgcmV0dXJuIHtcbiAgICAgICAgcmVuZGVyOiAocHJvcHMgPSB7fSwgb3B0aW9ucyA9IHt9KSA9PiB7XG4gICAgICAgICAgICBvbl9kZXN0cm95ID0gW107XG4gICAgICAgICAgICBjb25zdCByZXN1bHQgPSB7IHRpdGxlOiAnJywgaGVhZDogJycsIGNzczogbmV3IFNldCgpIH07XG4gICAgICAgICAgICBjb25zdCBodG1sID0gJCRyZW5kZXIocmVzdWx0LCBwcm9wcywge30sIG9wdGlvbnMpO1xuICAgICAgICAgICAgcnVuX2FsbChvbl9kZXN0cm95KTtcbiAgICAgICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICAgICAgaHRtbCxcbiAgICAgICAgICAgICAgICBjc3M6IHtcbiAgICAgICAgICAgICAgICAgICAgY29kZTogQXJyYXkuZnJvbShyZXN1bHQuY3NzKS5tYXAoY3NzID0+IGNzcy5jb2RlKS5qb2luKCdcXG4nKSxcbiAgICAgICAgICAgICAgICAgICAgbWFwOiBudWxsIC8vIFRPRE9cbiAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICAgIGhlYWQ6IHJlc3VsdC50aXRsZSArIHJlc3VsdC5oZWFkXG4gICAgICAgICAgICB9O1xuICAgICAgICB9LFxuICAgICAgICAkJHJlbmRlclxuICAgIH07XG59XG5mdW5jdGlvbiBhZGRfYXR0cmlidXRlKG5hbWUsIHZhbHVlLCBib29sZWFuKSB7XG4gICAgaWYgKHZhbHVlID09IG51bGwgfHwgKGJvb2xlYW4gJiYgIXZhbHVlKSlcbiAgICAgICAgcmV0dXJuICcnO1xuICAgIHJldHVybiBgICR7bmFtZX0ke3ZhbHVlID09PSB0cnVlID8gJycgOiBgPSR7dHlwZW9mIHZhbHVlID09PSAnc3RyaW5nJyA/IEpTT04uc3RyaW5naWZ5KGVzY2FwZSh2YWx1ZSkpIDogYFwiJHt2YWx1ZX1cImB9YH1gO1xufVxuZnVuY3Rpb24gYWRkX2NsYXNzZXMoY2xhc3Nlcykge1xuICAgIHJldHVybiBjbGFzc2VzID8gYCBjbGFzcz1cIiR7Y2xhc3Nlc31cImAgOiAnJztcbn1cblxuZnVuY3Rpb24gYmluZChjb21wb25lbnQsIG5hbWUsIGNhbGxiYWNrKSB7XG4gICAgY29uc3QgaW5kZXggPSBjb21wb25lbnQuJCQucHJvcHNbbmFtZV07XG4gICAgaWYgKGluZGV4ICE9PSB1bmRlZmluZWQpIHtcbiAgICAgICAgY29tcG9uZW50LiQkLmJvdW5kW2luZGV4XSA9IGNhbGxiYWNrO1xuICAgICAgICBjYWxsYmFjayhjb21wb25lbnQuJCQuY3R4W2luZGV4XSk7XG4gICAgfVxufVxuZnVuY3Rpb24gY3JlYXRlX2NvbXBvbmVudChibG9jaykge1xuICAgIGJsb2NrICYmIGJsb2NrLmMoKTtcbn1cbmZ1bmN0aW9uIGNsYWltX2NvbXBvbmVudChibG9jaywgcGFyZW50X25vZGVzKSB7XG4gICAgYmxvY2sgJiYgYmxvY2subChwYXJlbnRfbm9kZXMpO1xufVxuZnVuY3Rpb24gbW91bnRfY29tcG9uZW50KGNvbXBvbmVudCwgdGFyZ2V0LCBhbmNob3IpIHtcbiAgICBjb25zdCB7IGZyYWdtZW50LCBvbl9tb3VudCwgb25fZGVzdHJveSwgYWZ0ZXJfdXBkYXRlIH0gPSBjb21wb25lbnQuJCQ7XG4gICAgZnJhZ21lbnQgJiYgZnJhZ21lbnQubSh0YXJnZXQsIGFuY2hvcik7XG4gICAgLy8gb25Nb3VudCBoYXBwZW5zIGJlZm9yZSB0aGUgaW5pdGlhbCBhZnRlclVwZGF0ZVxuICAgIGFkZF9yZW5kZXJfY2FsbGJhY2soKCkgPT4ge1xuICAgICAgICBjb25zdCBuZXdfb25fZGVzdHJveSA9IG9uX21vdW50Lm1hcChydW4pLmZpbHRlcihpc19mdW5jdGlvbik7XG4gICAgICAgIGlmIChvbl9kZXN0cm95KSB7XG4gICAgICAgICAgICBvbl9kZXN0cm95LnB1c2goLi4ubmV3X29uX2Rlc3Ryb3kpO1xuICAgICAgICB9XG4gICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgLy8gRWRnZSBjYXNlIC0gY29tcG9uZW50IHdhcyBkZXN0cm95ZWQgaW1tZWRpYXRlbHksXG4gICAgICAgICAgICAvLyBtb3N0IGxpa2VseSBhcyBhIHJlc3VsdCBvZiBhIGJpbmRpbmcgaW5pdGlhbGlzaW5nXG4gICAgICAgICAgICBydW5fYWxsKG5ld19vbl9kZXN0cm95KTtcbiAgICAgICAgfVxuICAgICAgICBjb21wb25lbnQuJCQub25fbW91bnQgPSBbXTtcbiAgICB9KTtcbiAgICBhZnRlcl91cGRhdGUuZm9yRWFjaChhZGRfcmVuZGVyX2NhbGxiYWNrKTtcbn1cbmZ1bmN0aW9uIGRlc3Ryb3lfY29tcG9uZW50KGNvbXBvbmVudCwgZGV0YWNoaW5nKSB7XG4gICAgY29uc3QgJCQgPSBjb21wb25lbnQuJCQ7XG4gICAgaWYgKCQkLmZyYWdtZW50ICE9PSBudWxsKSB7XG4gICAgICAgIHJ1bl9hbGwoJCQub25fZGVzdHJveSk7XG4gICAgICAgICQkLmZyYWdtZW50ICYmICQkLmZyYWdtZW50LmQoZGV0YWNoaW5nKTtcbiAgICAgICAgLy8gVE9ETyBudWxsIG91dCBvdGhlciByZWZzLCBpbmNsdWRpbmcgY29tcG9uZW50LiQkIChidXQgbmVlZCB0b1xuICAgICAgICAvLyBwcmVzZXJ2ZSBmaW5hbCBzdGF0ZT8pXG4gICAgICAgICQkLm9uX2Rlc3Ryb3kgPSAkJC5mcmFnbWVudCA9IG51bGw7XG4gICAgICAgICQkLmN0eCA9IFtdO1xuICAgIH1cbn1cbmZ1bmN0aW9uIG1ha2VfZGlydHkoY29tcG9uZW50LCBpKSB7XG4gICAgaWYgKGNvbXBvbmVudC4kJC5kaXJ0eVswXSA9PT0gLTEpIHtcbiAgICAgICAgZGlydHlfY29tcG9uZW50cy5wdXNoKGNvbXBvbmVudCk7XG4gICAgICAgIHNjaGVkdWxlX3VwZGF0ZSgpO1xuICAgICAgICBjb21wb25lbnQuJCQuZGlydHkuZmlsbCgwKTtcbiAgICB9XG4gICAgY29tcG9uZW50LiQkLmRpcnR5WyhpIC8gMzEpIHwgMF0gfD0gKDEgPDwgKGkgJSAzMSkpO1xufVxuZnVuY3Rpb24gaW5pdChjb21wb25lbnQsIG9wdGlvbnMsIGluc3RhbmNlLCBjcmVhdGVfZnJhZ21lbnQsIG5vdF9lcXVhbCwgcHJvcHMsIGRpcnR5ID0gWy0xXSkge1xuICAgIGNvbnN0IHBhcmVudF9jb21wb25lbnQgPSBjdXJyZW50X2NvbXBvbmVudDtcbiAgICBzZXRfY3VycmVudF9jb21wb25lbnQoY29tcG9uZW50KTtcbiAgICBjb25zdCBwcm9wX3ZhbHVlcyA9IG9wdGlvbnMucHJvcHMgfHwge307XG4gICAgY29uc3QgJCQgPSBjb21wb25lbnQuJCQgPSB7XG4gICAgICAgIGZyYWdtZW50OiBudWxsLFxuICAgICAgICBjdHg6IG51bGwsXG4gICAgICAgIC8vIHN0YXRlXG4gICAgICAgIHByb3BzLFxuICAgICAgICB1cGRhdGU6IG5vb3AsXG4gICAgICAgIG5vdF9lcXVhbCxcbiAgICAgICAgYm91bmQ6IGJsYW5rX29iamVjdCgpLFxuICAgICAgICAvLyBsaWZlY3ljbGVcbiAgICAgICAgb25fbW91bnQ6IFtdLFxuICAgICAgICBvbl9kZXN0cm95OiBbXSxcbiAgICAgICAgYmVmb3JlX3VwZGF0ZTogW10sXG4gICAgICAgIGFmdGVyX3VwZGF0ZTogW10sXG4gICAgICAgIGNvbnRleHQ6IG5ldyBNYXAocGFyZW50X2NvbXBvbmVudCA/IHBhcmVudF9jb21wb25lbnQuJCQuY29udGV4dCA6IFtdKSxcbiAgICAgICAgLy8gZXZlcnl0aGluZyBlbHNlXG4gICAgICAgIGNhbGxiYWNrczogYmxhbmtfb2JqZWN0KCksXG4gICAgICAgIGRpcnR5LFxuICAgICAgICBza2lwX2JvdW5kOiBmYWxzZVxuICAgIH07XG4gICAgbGV0IHJlYWR5ID0gZmFsc2U7XG4gICAgJCQuY3R4ID0gaW5zdGFuY2VcbiAgICAgICAgPyBpbnN0YW5jZShjb21wb25lbnQsIHByb3BfdmFsdWVzLCAoaSwgcmV0LCAuLi5yZXN0KSA9PiB7XG4gICAgICAgICAgICBjb25zdCB2YWx1ZSA9IHJlc3QubGVuZ3RoID8gcmVzdFswXSA6IHJldDtcbiAgICAgICAgICAgIGlmICgkJC5jdHggJiYgbm90X2VxdWFsKCQkLmN0eFtpXSwgJCQuY3R4W2ldID0gdmFsdWUpKSB7XG4gICAgICAgICAgICAgICAgaWYgKCEkJC5za2lwX2JvdW5kICYmICQkLmJvdW5kW2ldKVxuICAgICAgICAgICAgICAgICAgICAkJC5ib3VuZFtpXSh2YWx1ZSk7XG4gICAgICAgICAgICAgICAgaWYgKHJlYWR5KVxuICAgICAgICAgICAgICAgICAgICBtYWtlX2RpcnR5KGNvbXBvbmVudCwgaSk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICByZXR1cm4gcmV0O1xuICAgICAgICB9KVxuICAgICAgICA6IFtdO1xuICAgICQkLnVwZGF0ZSgpO1xuICAgIHJlYWR5ID0gdHJ1ZTtcbiAgICBydW5fYWxsKCQkLmJlZm9yZV91cGRhdGUpO1xuICAgIC8vIGBmYWxzZWAgYXMgYSBzcGVjaWFsIGNhc2Ugb2Ygbm8gRE9NIGNvbXBvbmVudFxuICAgICQkLmZyYWdtZW50ID0gY3JlYXRlX2ZyYWdtZW50ID8gY3JlYXRlX2ZyYWdtZW50KCQkLmN0eCkgOiBmYWxzZTtcbiAgICBpZiAob3B0aW9ucy50YXJnZXQpIHtcbiAgICAgICAgaWYgKG9wdGlvbnMuaHlkcmF0ZSkge1xuICAgICAgICAgICAgY29uc3Qgbm9kZXMgPSBjaGlsZHJlbihvcHRpb25zLnRhcmdldCk7XG4gICAgICAgICAgICAvLyBlc2xpbnQtZGlzYWJsZS1uZXh0LWxpbmUgQHR5cGVzY3JpcHQtZXNsaW50L25vLW5vbi1udWxsLWFzc2VydGlvblxuICAgICAgICAgICAgJCQuZnJhZ21lbnQgJiYgJCQuZnJhZ21lbnQubChub2Rlcyk7XG4gICAgICAgICAgICBub2Rlcy5mb3JFYWNoKGRldGFjaCk7XG4gICAgICAgIH1cbiAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAvLyBlc2xpbnQtZGlzYWJsZS1uZXh0LWxpbmUgQHR5cGVzY3JpcHQtZXNsaW50L25vLW5vbi1udWxsLWFzc2VydGlvblxuICAgICAgICAgICAgJCQuZnJhZ21lbnQgJiYgJCQuZnJhZ21lbnQuYygpO1xuICAgICAgICB9XG4gICAgICAgIGlmIChvcHRpb25zLmludHJvKVxuICAgICAgICAgICAgdHJhbnNpdGlvbl9pbihjb21wb25lbnQuJCQuZnJhZ21lbnQpO1xuICAgICAgICBtb3VudF9jb21wb25lbnQoY29tcG9uZW50LCBvcHRpb25zLnRhcmdldCwgb3B0aW9ucy5hbmNob3IpO1xuICAgICAgICBmbHVzaCgpO1xuICAgIH1cbiAgICBzZXRfY3VycmVudF9jb21wb25lbnQocGFyZW50X2NvbXBvbmVudCk7XG59XG5sZXQgU3ZlbHRlRWxlbWVudDtcbmlmICh0eXBlb2YgSFRNTEVsZW1lbnQgPT09ICdmdW5jdGlvbicpIHtcbiAgICBTdmVsdGVFbGVtZW50ID0gY2xhc3MgZXh0ZW5kcyBIVE1MRWxlbWVudCB7XG4gICAgICAgIGNvbnN0cnVjdG9yKCkge1xuICAgICAgICAgICAgc3VwZXIoKTtcbiAgICAgICAgICAgIHRoaXMuYXR0YWNoU2hhZG93KHsgbW9kZTogJ29wZW4nIH0pO1xuICAgICAgICB9XG4gICAgICAgIGNvbm5lY3RlZENhbGxiYWNrKCkge1xuICAgICAgICAgICAgLy8gQHRzLWlnbm9yZSB0b2RvOiBpbXByb3ZlIHR5cGluZ3NcbiAgICAgICAgICAgIGZvciAoY29uc3Qga2V5IGluIHRoaXMuJCQuc2xvdHRlZCkge1xuICAgICAgICAgICAgICAgIC8vIEB0cy1pZ25vcmUgdG9kbzogaW1wcm92ZSB0eXBpbmdzXG4gICAgICAgICAgICAgICAgdGhpcy5hcHBlbmRDaGlsZCh0aGlzLiQkLnNsb3R0ZWRba2V5XSk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgYXR0cmlidXRlQ2hhbmdlZENhbGxiYWNrKGF0dHIsIF9vbGRWYWx1ZSwgbmV3VmFsdWUpIHtcbiAgICAgICAgICAgIHRoaXNbYXR0cl0gPSBuZXdWYWx1ZTtcbiAgICAgICAgfVxuICAgICAgICAkZGVzdHJveSgpIHtcbiAgICAgICAgICAgIGRlc3Ryb3lfY29tcG9uZW50KHRoaXMsIDEpO1xuICAgICAgICAgICAgdGhpcy4kZGVzdHJveSA9IG5vb3A7XG4gICAgICAgIH1cbiAgICAgICAgJG9uKHR5cGUsIGNhbGxiYWNrKSB7XG4gICAgICAgICAgICAvLyBUT0RPIHNob3VsZCB0aGlzIGRlbGVnYXRlIHRvIGFkZEV2ZW50TGlzdGVuZXI/XG4gICAgICAgICAgICBjb25zdCBjYWxsYmFja3MgPSAodGhpcy4kJC5jYWxsYmFja3NbdHlwZV0gfHwgKHRoaXMuJCQuY2FsbGJhY2tzW3R5cGVdID0gW10pKTtcbiAgICAgICAgICAgIGNhbGxiYWNrcy5wdXNoKGNhbGxiYWNrKTtcbiAgICAgICAgICAgIHJldHVybiAoKSA9PiB7XG4gICAgICAgICAgICAgICAgY29uc3QgaW5kZXggPSBjYWxsYmFja3MuaW5kZXhPZihjYWxsYmFjayk7XG4gICAgICAgICAgICAgICAgaWYgKGluZGV4ICE9PSAtMSlcbiAgICAgICAgICAgICAgICAgICAgY2FsbGJhY2tzLnNwbGljZShpbmRleCwgMSk7XG4gICAgICAgICAgICB9O1xuICAgICAgICB9XG4gICAgICAgICRzZXQoJCRwcm9wcykge1xuICAgICAgICAgICAgaWYgKHRoaXMuJCRzZXQgJiYgIWlzX2VtcHR5KCQkcHJvcHMpKSB7XG4gICAgICAgICAgICAgICAgdGhpcy4kJC5za2lwX2JvdW5kID0gdHJ1ZTtcbiAgICAgICAgICAgICAgICB0aGlzLiQkc2V0KCQkcHJvcHMpO1xuICAgICAgICAgICAgICAgIHRoaXMuJCQuc2tpcF9ib3VuZCA9IGZhbHNlO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgfTtcbn1cbmNsYXNzIFN2ZWx0ZUNvbXBvbmVudCB7XG4gICAgJGRlc3Ryb3koKSB7XG4gICAgICAgIGRlc3Ryb3lfY29tcG9uZW50KHRoaXMsIDEpO1xuICAgICAgICB0aGlzLiRkZXN0cm95ID0gbm9vcDtcbiAgICB9XG4gICAgJG9uKHR5cGUsIGNhbGxiYWNrKSB7XG4gICAgICAgIGNvbnN0IGNhbGxiYWNrcyA9ICh0aGlzLiQkLmNhbGxiYWNrc1t0eXBlXSB8fCAodGhpcy4kJC5jYWxsYmFja3NbdHlwZV0gPSBbXSkpO1xuICAgICAgICBjYWxsYmFja3MucHVzaChjYWxsYmFjayk7XG4gICAgICAgIHJldHVybiAoKSA9PiB7XG4gICAgICAgICAgICBjb25zdCBpbmRleCA9IGNhbGxiYWNrcy5pbmRleE9mKGNhbGxiYWNrKTtcbiAgICAgICAgICAgIGlmIChpbmRleCAhPT0gLTEpXG4gICAgICAgICAgICAgICAgY2FsbGJhY2tzLnNwbGljZShpbmRleCwgMSk7XG4gICAgICAgIH07XG4gICAgfVxuICAgICRzZXQoJCRwcm9wcykge1xuICAgICAgICBpZiAodGhpcy4kJHNldCAmJiAhaXNfZW1wdHkoJCRwcm9wcykpIHtcbiAgICAgICAgICAgIHRoaXMuJCQuc2tpcF9ib3VuZCA9IHRydWU7XG4gICAgICAgICAgICB0aGlzLiQkc2V0KCQkcHJvcHMpO1xuICAgICAgICAgICAgdGhpcy4kJC5za2lwX2JvdW5kID0gZmFsc2U7XG4gICAgICAgIH1cbiAgICB9XG59XG5cbmZ1bmN0aW9uIGRpc3BhdGNoX2Rldih0eXBlLCBkZXRhaWwpIHtcbiAgICBkb2N1bWVudC5kaXNwYXRjaEV2ZW50KGN1c3RvbV9ldmVudCh0eXBlLCBPYmplY3QuYXNzaWduKHsgdmVyc2lvbjogJzMuMjkuNycgfSwgZGV0YWlsKSkpO1xufVxuZnVuY3Rpb24gYXBwZW5kX2Rldih0YXJnZXQsIG5vZGUpIHtcbiAgICBkaXNwYXRjaF9kZXYoJ1N2ZWx0ZURPTUluc2VydCcsIHsgdGFyZ2V0LCBub2RlIH0pO1xuICAgIGFwcGVuZCh0YXJnZXQsIG5vZGUpO1xufVxuZnVuY3Rpb24gaW5zZXJ0X2Rldih0YXJnZXQsIG5vZGUsIGFuY2hvcikge1xuICAgIGRpc3BhdGNoX2RldignU3ZlbHRlRE9NSW5zZXJ0JywgeyB0YXJnZXQsIG5vZGUsIGFuY2hvciB9KTtcbiAgICBpbnNlcnQodGFyZ2V0LCBub2RlLCBhbmNob3IpO1xufVxuZnVuY3Rpb24gZGV0YWNoX2Rldihub2RlKSB7XG4gICAgZGlzcGF0Y2hfZGV2KCdTdmVsdGVET01SZW1vdmUnLCB7IG5vZGUgfSk7XG4gICAgZGV0YWNoKG5vZGUpO1xufVxuZnVuY3Rpb24gZGV0YWNoX2JldHdlZW5fZGV2KGJlZm9yZSwgYWZ0ZXIpIHtcbiAgICB3aGlsZSAoYmVmb3JlLm5leHRTaWJsaW5nICYmIGJlZm9yZS5uZXh0U2libGluZyAhPT0gYWZ0ZXIpIHtcbiAgICAgICAgZGV0YWNoX2RldihiZWZvcmUubmV4dFNpYmxpbmcpO1xuICAgIH1cbn1cbmZ1bmN0aW9uIGRldGFjaF9iZWZvcmVfZGV2KGFmdGVyKSB7XG4gICAgd2hpbGUgKGFmdGVyLnByZXZpb3VzU2libGluZykge1xuICAgICAgICBkZXRhY2hfZGV2KGFmdGVyLnByZXZpb3VzU2libGluZyk7XG4gICAgfVxufVxuZnVuY3Rpb24gZGV0YWNoX2FmdGVyX2RldihiZWZvcmUpIHtcbiAgICB3aGlsZSAoYmVmb3JlLm5leHRTaWJsaW5nKSB7XG4gICAgICAgIGRldGFjaF9kZXYoYmVmb3JlLm5leHRTaWJsaW5nKTtcbiAgICB9XG59XG5mdW5jdGlvbiBsaXN0ZW5fZGV2KG5vZGUsIGV2ZW50LCBoYW5kbGVyLCBvcHRpb25zLCBoYXNfcHJldmVudF9kZWZhdWx0LCBoYXNfc3RvcF9wcm9wYWdhdGlvbikge1xuICAgIGNvbnN0IG1vZGlmaWVycyA9IG9wdGlvbnMgPT09IHRydWUgPyBbJ2NhcHR1cmUnXSA6IG9wdGlvbnMgPyBBcnJheS5mcm9tKE9iamVjdC5rZXlzKG9wdGlvbnMpKSA6IFtdO1xuICAgIGlmIChoYXNfcHJldmVudF9kZWZhdWx0KVxuICAgICAgICBtb2RpZmllcnMucHVzaCgncHJldmVudERlZmF1bHQnKTtcbiAgICBpZiAoaGFzX3N0b3BfcHJvcGFnYXRpb24pXG4gICAgICAgIG1vZGlmaWVycy5wdXNoKCdzdG9wUHJvcGFnYXRpb24nKTtcbiAgICBkaXNwYXRjaF9kZXYoJ1N2ZWx0ZURPTUFkZEV2ZW50TGlzdGVuZXInLCB7IG5vZGUsIGV2ZW50LCBoYW5kbGVyLCBtb2RpZmllcnMgfSk7XG4gICAgY29uc3QgZGlzcG9zZSA9IGxpc3Rlbihub2RlLCBldmVudCwgaGFuZGxlciwgb3B0aW9ucyk7XG4gICAgcmV0dXJuICgpID0+IHtcbiAgICAgICAgZGlzcGF0Y2hfZGV2KCdTdmVsdGVET01SZW1vdmVFdmVudExpc3RlbmVyJywgeyBub2RlLCBldmVudCwgaGFuZGxlciwgbW9kaWZpZXJzIH0pO1xuICAgICAgICBkaXNwb3NlKCk7XG4gICAgfTtcbn1cbmZ1bmN0aW9uIGF0dHJfZGV2KG5vZGUsIGF0dHJpYnV0ZSwgdmFsdWUpIHtcbiAgICBhdHRyKG5vZGUsIGF0dHJpYnV0ZSwgdmFsdWUpO1xuICAgIGlmICh2YWx1ZSA9PSBudWxsKVxuICAgICAgICBkaXNwYXRjaF9kZXYoJ1N2ZWx0ZURPTVJlbW92ZUF0dHJpYnV0ZScsIHsgbm9kZSwgYXR0cmlidXRlIH0pO1xuICAgIGVsc2VcbiAgICAgICAgZGlzcGF0Y2hfZGV2KCdTdmVsdGVET01TZXRBdHRyaWJ1dGUnLCB7IG5vZGUsIGF0dHJpYnV0ZSwgdmFsdWUgfSk7XG59XG5mdW5jdGlvbiBwcm9wX2Rldihub2RlLCBwcm9wZXJ0eSwgdmFsdWUpIHtcbiAgICBub2RlW3Byb3BlcnR5XSA9IHZhbHVlO1xuICAgIGRpc3BhdGNoX2RldignU3ZlbHRlRE9NU2V0UHJvcGVydHknLCB7IG5vZGUsIHByb3BlcnR5LCB2YWx1ZSB9KTtcbn1cbmZ1bmN0aW9uIGRhdGFzZXRfZGV2KG5vZGUsIHByb3BlcnR5LCB2YWx1ZSkge1xuICAgIG5vZGUuZGF0YXNldFtwcm9wZXJ0eV0gPSB2YWx1ZTtcbiAgICBkaXNwYXRjaF9kZXYoJ1N2ZWx0ZURPTVNldERhdGFzZXQnLCB7IG5vZGUsIHByb3BlcnR5LCB2YWx1ZSB9KTtcbn1cbmZ1bmN0aW9uIHNldF9kYXRhX2Rldih0ZXh0LCBkYXRhKSB7XG4gICAgZGF0YSA9ICcnICsgZGF0YTtcbiAgICBpZiAodGV4dC53aG9sZVRleHQgPT09IGRhdGEpXG4gICAgICAgIHJldHVybjtcbiAgICBkaXNwYXRjaF9kZXYoJ1N2ZWx0ZURPTVNldERhdGEnLCB7IG5vZGU6IHRleHQsIGRhdGEgfSk7XG4gICAgdGV4dC5kYXRhID0gZGF0YTtcbn1cbmZ1bmN0aW9uIHZhbGlkYXRlX2VhY2hfYXJndW1lbnQoYXJnKSB7XG4gICAgaWYgKHR5cGVvZiBhcmcgIT09ICdzdHJpbmcnICYmICEoYXJnICYmIHR5cGVvZiBhcmcgPT09ICdvYmplY3QnICYmICdsZW5ndGgnIGluIGFyZykpIHtcbiAgICAgICAgbGV0IG1zZyA9ICd7I2VhY2h9IG9ubHkgaXRlcmF0ZXMgb3ZlciBhcnJheS1saWtlIG9iamVjdHMuJztcbiAgICAgICAgaWYgKHR5cGVvZiBTeW1ib2wgPT09ICdmdW5jdGlvbicgJiYgYXJnICYmIFN5bWJvbC5pdGVyYXRvciBpbiBhcmcpIHtcbiAgICAgICAgICAgIG1zZyArPSAnIFlvdSBjYW4gdXNlIGEgc3ByZWFkIHRvIGNvbnZlcnQgdGhpcyBpdGVyYWJsZSBpbnRvIGFuIGFycmF5Lic7XG4gICAgICAgIH1cbiAgICAgICAgdGhyb3cgbmV3IEVycm9yKG1zZyk7XG4gICAgfVxufVxuZnVuY3Rpb24gdmFsaWRhdGVfc2xvdHMobmFtZSwgc2xvdCwga2V5cykge1xuICAgIGZvciAoY29uc3Qgc2xvdF9rZXkgb2YgT2JqZWN0LmtleXMoc2xvdCkpIHtcbiAgICAgICAgaWYgKCF+a2V5cy5pbmRleE9mKHNsb3Rfa2V5KSkge1xuICAgICAgICAgICAgY29uc29sZS53YXJuKGA8JHtuYW1lfT4gcmVjZWl2ZWQgYW4gdW5leHBlY3RlZCBzbG90IFwiJHtzbG90X2tleX1cIi5gKTtcbiAgICAgICAgfVxuICAgIH1cbn1cbmNsYXNzIFN2ZWx0ZUNvbXBvbmVudERldiBleHRlbmRzIFN2ZWx0ZUNvbXBvbmVudCB7XG4gICAgY29uc3RydWN0b3Iob3B0aW9ucykge1xuICAgICAgICBpZiAoIW9wdGlvbnMgfHwgKCFvcHRpb25zLnRhcmdldCAmJiAhb3B0aW9ucy4kJGlubGluZSkpIHtcbiAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcihcIid0YXJnZXQnIGlzIGEgcmVxdWlyZWQgb3B0aW9uXCIpO1xuICAgICAgICB9XG4gICAgICAgIHN1cGVyKCk7XG4gICAgfVxuICAgICRkZXN0cm95KCkge1xuICAgICAgICBzdXBlci4kZGVzdHJveSgpO1xuICAgICAgICB0aGlzLiRkZXN0cm95ID0gKCkgPT4ge1xuICAgICAgICAgICAgY29uc29sZS53YXJuKCdDb21wb25lbnQgd2FzIGFscmVhZHkgZGVzdHJveWVkJyk7IC8vIGVzbGludC1kaXNhYmxlLWxpbmUgbm8tY29uc29sZVxuICAgICAgICB9O1xuICAgIH1cbiAgICAkY2FwdHVyZV9zdGF0ZSgpIHsgfVxuICAgICRpbmplY3Rfc3RhdGUoKSB7IH1cbn1cbmZ1bmN0aW9uIGxvb3BfZ3VhcmQodGltZW91dCkge1xuICAgIGNvbnN0IHN0YXJ0ID0gRGF0ZS5ub3coKTtcbiAgICByZXR1cm4gKCkgPT4ge1xuICAgICAgICBpZiAoRGF0ZS5ub3coKSAtIHN0YXJ0ID4gdGltZW91dCkge1xuICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKCdJbmZpbml0ZSBsb29wIGRldGVjdGVkJyk7XG4gICAgICAgIH1cbiAgICB9O1xufVxuXG5leHBvcnQgeyBIdG1sVGFnLCBTdmVsdGVDb21wb25lbnQsIFN2ZWx0ZUNvbXBvbmVudERldiwgU3ZlbHRlRWxlbWVudCwgYWN0aW9uX2Rlc3Ryb3llciwgYWRkX2F0dHJpYnV0ZSwgYWRkX2NsYXNzZXMsIGFkZF9mbHVzaF9jYWxsYmFjaywgYWRkX2xvY2F0aW9uLCBhZGRfcmVuZGVyX2NhbGxiYWNrLCBhZGRfcmVzaXplX2xpc3RlbmVyLCBhZGRfdHJhbnNmb3JtLCBhZnRlclVwZGF0ZSwgYXBwZW5kLCBhcHBlbmRfZGV2LCBhc3NpZ24sIGF0dHIsIGF0dHJfZGV2LCBhdHRyaWJ1dGVfdG9fb2JqZWN0LCBiZWZvcmVVcGRhdGUsIGJpbmQsIGJpbmRpbmdfY2FsbGJhY2tzLCBibGFua19vYmplY3QsIGJ1YmJsZSwgY2hlY2tfb3V0cm9zLCBjaGlsZHJlbiwgY2xhaW1fY29tcG9uZW50LCBjbGFpbV9lbGVtZW50LCBjbGFpbV9zcGFjZSwgY2xhaW1fdGV4dCwgY2xlYXJfbG9vcHMsIGNvbXBvbmVudF9zdWJzY3JpYmUsIGNvbXB1dGVfcmVzdF9wcm9wcywgY29tcHV0ZV9zbG90cywgY3JlYXRlRXZlbnREaXNwYXRjaGVyLCBjcmVhdGVfYW5pbWF0aW9uLCBjcmVhdGVfYmlkaXJlY3Rpb25hbF90cmFuc2l0aW9uLCBjcmVhdGVfY29tcG9uZW50LCBjcmVhdGVfaW5fdHJhbnNpdGlvbiwgY3JlYXRlX291dF90cmFuc2l0aW9uLCBjcmVhdGVfc2xvdCwgY3JlYXRlX3Nzcl9jb21wb25lbnQsIGN1cnJlbnRfY29tcG9uZW50LCBjdXN0b21fZXZlbnQsIGRhdGFzZXRfZGV2LCBkZWJ1ZywgZGVzdHJveV9ibG9jaywgZGVzdHJveV9jb21wb25lbnQsIGRlc3Ryb3lfZWFjaCwgZGV0YWNoLCBkZXRhY2hfYWZ0ZXJfZGV2LCBkZXRhY2hfYmVmb3JlX2RldiwgZGV0YWNoX2JldHdlZW5fZGV2LCBkZXRhY2hfZGV2LCBkaXJ0eV9jb21wb25lbnRzLCBkaXNwYXRjaF9kZXYsIGVhY2gsIGVsZW1lbnQsIGVsZW1lbnRfaXMsIGVtcHR5LCBlc2NhcGUsIGVzY2FwZWQsIGV4Y2x1ZGVfaW50ZXJuYWxfcHJvcHMsIGZpeF9hbmRfZGVzdHJveV9ibG9jaywgZml4X2FuZF9vdXRyb19hbmRfZGVzdHJveV9ibG9jaywgZml4X3Bvc2l0aW9uLCBmbHVzaCwgZ2V0Q29udGV4dCwgZ2V0X2JpbmRpbmdfZ3JvdXBfdmFsdWUsIGdldF9jdXJyZW50X2NvbXBvbmVudCwgZ2V0X2N1c3RvbV9lbGVtZW50c19zbG90cywgZ2V0X3Nsb3RfY2hhbmdlcywgZ2V0X3Nsb3RfY29udGV4dCwgZ2V0X3NwcmVhZF9vYmplY3QsIGdldF9zcHJlYWRfdXBkYXRlLCBnZXRfc3RvcmVfdmFsdWUsIGdsb2JhbHMsIGdyb3VwX291dHJvcywgaGFuZGxlX3Byb21pc2UsIGhhc19wcm9wLCBpZGVudGl0eSwgaW5pdCwgaW5zZXJ0LCBpbnNlcnRfZGV2LCBpbnRyb3MsIGludmFsaWRfYXR0cmlidXRlX25hbWVfY2hhcmFjdGVyLCBpc19jbGllbnQsIGlzX2Nyb3Nzb3JpZ2luLCBpc19lbXB0eSwgaXNfZnVuY3Rpb24sIGlzX3Byb21pc2UsIGxpc3RlbiwgbGlzdGVuX2RldiwgbG9vcCwgbG9vcF9ndWFyZCwgbWlzc2luZ19jb21wb25lbnQsIG1vdW50X2NvbXBvbmVudCwgbm9vcCwgbm90X2VxdWFsLCBub3csIG51bGxfdG9fZW1wdHksIG9iamVjdF93aXRob3V0X3Byb3BlcnRpZXMsIG9uRGVzdHJveSwgb25Nb3VudCwgb25jZSwgb3V0cm9fYW5kX2Rlc3Ryb3lfYmxvY2ssIHByZXZlbnRfZGVmYXVsdCwgcHJvcF9kZXYsIHF1ZXJ5X3NlbGVjdG9yX2FsbCwgcmFmLCBydW4sIHJ1bl9hbGwsIHNhZmVfbm90X2VxdWFsLCBzY2hlZHVsZV91cGRhdGUsIHNlbGVjdF9tdWx0aXBsZV92YWx1ZSwgc2VsZWN0X29wdGlvbiwgc2VsZWN0X29wdGlvbnMsIHNlbGVjdF92YWx1ZSwgc2VsZiwgc2V0Q29udGV4dCwgc2V0X2F0dHJpYnV0ZXMsIHNldF9jdXJyZW50X2NvbXBvbmVudCwgc2V0X2N1c3RvbV9lbGVtZW50X2RhdGEsIHNldF9kYXRhLCBzZXRfZGF0YV9kZXYsIHNldF9pbnB1dF90eXBlLCBzZXRfaW5wdXRfdmFsdWUsIHNldF9ub3csIHNldF9yYWYsIHNldF9zdG9yZV92YWx1ZSwgc2V0X3N0eWxlLCBzZXRfc3ZnX2F0dHJpYnV0ZXMsIHNwYWNlLCBzcHJlYWQsIHN0b3BfcHJvcGFnYXRpb24sIHN1YnNjcmliZSwgc3ZnX2VsZW1lbnQsIHRleHQsIHRpY2ssIHRpbWVfcmFuZ2VzX3RvX2FycmF5LCB0b19udW1iZXIsIHRvZ2dsZV9jbGFzcywgdHJhbnNpdGlvbl9pbiwgdHJhbnNpdGlvbl9vdXQsIHVwZGF0ZV9rZXllZF9lYWNoLCB1cGRhdGVfc2xvdCwgdmFsaWRhdGVfY29tcG9uZW50LCB2YWxpZGF0ZV9lYWNoX2FyZ3VtZW50LCB2YWxpZGF0ZV9lYWNoX2tleXMsIHZhbGlkYXRlX3Nsb3RzLCB2YWxpZGF0ZV9zdG9yZSwgeGxpbmtfYXR0ciB9O1xuIiwibW9kdWxlLmV4cG9ydHMgPSBCdWZmZXJzO1xuXG5mdW5jdGlvbiBCdWZmZXJzIChidWZzKSB7XG4gICAgaWYgKCEodGhpcyBpbnN0YW5jZW9mIEJ1ZmZlcnMpKSByZXR1cm4gbmV3IEJ1ZmZlcnMoYnVmcyk7XG4gICAgdGhpcy5idWZmZXJzID0gYnVmcyB8fCBbXTtcbiAgICB0aGlzLmxlbmd0aCA9IHRoaXMuYnVmZmVycy5yZWR1Y2UoZnVuY3Rpb24gKHNpemUsIGJ1Zikge1xuICAgICAgICByZXR1cm4gc2l6ZSArIGJ1Zi5sZW5ndGhcbiAgICB9LCAwKTtcbn1cblxuQnVmZmVycy5wcm90b3R5cGUucHVzaCA9IGZ1bmN0aW9uICgpIHtcbiAgICBmb3IgKHZhciBpID0gMDsgaSA8IGFyZ3VtZW50cy5sZW5ndGg7IGkrKykge1xuICAgICAgICBpZiAoIUJ1ZmZlci5pc0J1ZmZlcihhcmd1bWVudHNbaV0pKSB7XG4gICAgICAgICAgICB0aHJvdyBuZXcgVHlwZUVycm9yKCdUcmllZCB0byBwdXNoIGEgbm9uLWJ1ZmZlcicpO1xuICAgICAgICB9XG4gICAgfVxuICAgIFxuICAgIGZvciAodmFyIGkgPSAwOyBpIDwgYXJndW1lbnRzLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgIHZhciBidWYgPSBhcmd1bWVudHNbaV07XG4gICAgICAgIHRoaXMuYnVmZmVycy5wdXNoKGJ1Zik7XG4gICAgICAgIHRoaXMubGVuZ3RoICs9IGJ1Zi5sZW5ndGg7XG4gICAgfVxuICAgIHJldHVybiB0aGlzLmxlbmd0aDtcbn07XG5cbkJ1ZmZlcnMucHJvdG90eXBlLnVuc2hpZnQgPSBmdW5jdGlvbiAoKSB7XG4gICAgZm9yICh2YXIgaSA9IDA7IGkgPCBhcmd1bWVudHMubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgaWYgKCFCdWZmZXIuaXNCdWZmZXIoYXJndW1lbnRzW2ldKSkge1xuICAgICAgICAgICAgdGhyb3cgbmV3IFR5cGVFcnJvcignVHJpZWQgdG8gdW5zaGlmdCBhIG5vbi1idWZmZXInKTtcbiAgICAgICAgfVxuICAgIH1cbiAgICBcbiAgICBmb3IgKHZhciBpID0gMDsgaSA8IGFyZ3VtZW50cy5sZW5ndGg7IGkrKykge1xuICAgICAgICB2YXIgYnVmID0gYXJndW1lbnRzW2ldO1xuICAgICAgICB0aGlzLmJ1ZmZlcnMudW5zaGlmdChidWYpO1xuICAgICAgICB0aGlzLmxlbmd0aCArPSBidWYubGVuZ3RoO1xuICAgIH1cbiAgICByZXR1cm4gdGhpcy5sZW5ndGg7XG59O1xuXG5CdWZmZXJzLnByb3RvdHlwZS5jb3B5ID0gZnVuY3Rpb24gKGRzdCwgZFN0YXJ0LCBzdGFydCwgZW5kKSB7XG4gICAgcmV0dXJuIHRoaXMuc2xpY2Uoc3RhcnQsIGVuZCkuY29weShkc3QsIGRTdGFydCwgMCwgZW5kIC0gc3RhcnQpO1xufTtcblxuQnVmZmVycy5wcm90b3R5cGUuc3BsaWNlID0gZnVuY3Rpb24gKGksIGhvd01hbnkpIHtcbiAgICB2YXIgYnVmZmVycyA9IHRoaXMuYnVmZmVycztcbiAgICB2YXIgaW5kZXggPSBpID49IDAgPyBpIDogdGhpcy5sZW5ndGggLSBpO1xuICAgIHZhciByZXBzID0gW10uc2xpY2UuY2FsbChhcmd1bWVudHMsIDIpO1xuICAgIFxuICAgIGlmIChob3dNYW55ID09PSB1bmRlZmluZWQpIHtcbiAgICAgICAgaG93TWFueSA9IHRoaXMubGVuZ3RoIC0gaW5kZXg7XG4gICAgfVxuICAgIGVsc2UgaWYgKGhvd01hbnkgPiB0aGlzLmxlbmd0aCAtIGluZGV4KSB7XG4gICAgICAgIGhvd01hbnkgPSB0aGlzLmxlbmd0aCAtIGluZGV4O1xuICAgIH1cbiAgICBcbiAgICBmb3IgKHZhciBpID0gMDsgaSA8IHJlcHMubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgdGhpcy5sZW5ndGggKz0gcmVwc1tpXS5sZW5ndGg7XG4gICAgfVxuICAgIFxuICAgIHZhciByZW1vdmVkID0gbmV3IEJ1ZmZlcnMoKTtcbiAgICB2YXIgYnl0ZXMgPSAwO1xuICAgIFxuICAgIHZhciBzdGFydEJ5dGVzID0gMDtcbiAgICBmb3IgKFxuICAgICAgICB2YXIgaWkgPSAwO1xuICAgICAgICBpaSA8IGJ1ZmZlcnMubGVuZ3RoICYmIHN0YXJ0Qnl0ZXMgKyBidWZmZXJzW2lpXS5sZW5ndGggPCBpbmRleDtcbiAgICAgICAgaWkgKytcbiAgICApIHsgc3RhcnRCeXRlcyArPSBidWZmZXJzW2lpXS5sZW5ndGggfVxuICAgIFxuICAgIGlmIChpbmRleCAtIHN0YXJ0Qnl0ZXMgPiAwKSB7XG4gICAgICAgIHZhciBzdGFydCA9IGluZGV4IC0gc3RhcnRCeXRlcztcbiAgICAgICAgXG4gICAgICAgIGlmIChzdGFydCArIGhvd01hbnkgPCBidWZmZXJzW2lpXS5sZW5ndGgpIHtcbiAgICAgICAgICAgIHJlbW92ZWQucHVzaChidWZmZXJzW2lpXS5zbGljZShzdGFydCwgc3RhcnQgKyBob3dNYW55KSk7XG4gICAgICAgICAgICBcbiAgICAgICAgICAgIHZhciBvcmlnID0gYnVmZmVyc1tpaV07XG4gICAgICAgICAgICAvL3ZhciBidWYgPSBuZXcgQnVmZmVyKG9yaWcubGVuZ3RoIC0gaG93TWFueSk7XG4gICAgICAgICAgICB2YXIgYnVmMCA9IG5ldyBCdWZmZXIoc3RhcnQpO1xuICAgICAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCBzdGFydDsgaSsrKSB7XG4gICAgICAgICAgICAgICAgYnVmMFtpXSA9IG9yaWdbaV07XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBcbiAgICAgICAgICAgIHZhciBidWYxID0gbmV3IEJ1ZmZlcihvcmlnLmxlbmd0aCAtIHN0YXJ0IC0gaG93TWFueSk7XG4gICAgICAgICAgICBmb3IgKHZhciBpID0gc3RhcnQgKyBob3dNYW55OyBpIDwgb3JpZy5sZW5ndGg7IGkrKykge1xuICAgICAgICAgICAgICAgIGJ1ZjFbIGkgLSBob3dNYW55IC0gc3RhcnQgXSA9IG9yaWdbaV1cbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIFxuICAgICAgICAgICAgaWYgKHJlcHMubGVuZ3RoID4gMCkge1xuICAgICAgICAgICAgICAgIHZhciByZXBzXyA9IHJlcHMuc2xpY2UoKTtcbiAgICAgICAgICAgICAgICByZXBzXy51bnNoaWZ0KGJ1ZjApO1xuICAgICAgICAgICAgICAgIHJlcHNfLnB1c2goYnVmMSk7XG4gICAgICAgICAgICAgICAgYnVmZmVycy5zcGxpY2UuYXBwbHkoYnVmZmVycywgWyBpaSwgMSBdLmNvbmNhdChyZXBzXykpO1xuICAgICAgICAgICAgICAgIGlpICs9IHJlcHNfLmxlbmd0aDtcbiAgICAgICAgICAgICAgICByZXBzID0gW107XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgICBidWZmZXJzLnNwbGljZShpaSwgMSwgYnVmMCwgYnVmMSk7XG4gICAgICAgICAgICAgICAgLy9idWZmZXJzW2lpXSA9IGJ1ZjtcbiAgICAgICAgICAgICAgICBpaSArPSAyO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgcmVtb3ZlZC5wdXNoKGJ1ZmZlcnNbaWldLnNsaWNlKHN0YXJ0KSk7XG4gICAgICAgICAgICBidWZmZXJzW2lpXSA9IGJ1ZmZlcnNbaWldLnNsaWNlKDAsIHN0YXJ0KTtcbiAgICAgICAgICAgIGlpICsrO1xuICAgICAgICB9XG4gICAgfVxuICAgIFxuICAgIGlmIChyZXBzLmxlbmd0aCA+IDApIHtcbiAgICAgICAgYnVmZmVycy5zcGxpY2UuYXBwbHkoYnVmZmVycywgWyBpaSwgMCBdLmNvbmNhdChyZXBzKSk7XG4gICAgICAgIGlpICs9IHJlcHMubGVuZ3RoO1xuICAgIH1cbiAgICBcbiAgICB3aGlsZSAocmVtb3ZlZC5sZW5ndGggPCBob3dNYW55KSB7XG4gICAgICAgIHZhciBidWYgPSBidWZmZXJzW2lpXTtcbiAgICAgICAgdmFyIGxlbiA9IGJ1Zi5sZW5ndGg7XG4gICAgICAgIHZhciB0YWtlID0gTWF0aC5taW4obGVuLCBob3dNYW55IC0gcmVtb3ZlZC5sZW5ndGgpO1xuICAgICAgICBcbiAgICAgICAgaWYgKHRha2UgPT09IGxlbikge1xuICAgICAgICAgICAgcmVtb3ZlZC5wdXNoKGJ1Zik7XG4gICAgICAgICAgICBidWZmZXJzLnNwbGljZShpaSwgMSk7XG4gICAgICAgIH1cbiAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICByZW1vdmVkLnB1c2goYnVmLnNsaWNlKDAsIHRha2UpKTtcbiAgICAgICAgICAgIGJ1ZmZlcnNbaWldID0gYnVmZmVyc1tpaV0uc2xpY2UodGFrZSk7XG4gICAgICAgIH1cbiAgICB9XG4gICAgXG4gICAgdGhpcy5sZW5ndGggLT0gcmVtb3ZlZC5sZW5ndGg7XG4gICAgXG4gICAgcmV0dXJuIHJlbW92ZWQ7XG59O1xuIFxuQnVmZmVycy5wcm90b3R5cGUuc2xpY2UgPSBmdW5jdGlvbiAoaSwgaikge1xuICAgIHZhciBidWZmZXJzID0gdGhpcy5idWZmZXJzO1xuICAgIGlmIChqID09PSB1bmRlZmluZWQpIGogPSB0aGlzLmxlbmd0aDtcbiAgICBpZiAoaSA9PT0gdW5kZWZpbmVkKSBpID0gMDtcbiAgICBcbiAgICBpZiAoaiA+IHRoaXMubGVuZ3RoKSBqID0gdGhpcy5sZW5ndGg7XG4gICAgXG4gICAgdmFyIHN0YXJ0Qnl0ZXMgPSAwO1xuICAgIGZvciAoXG4gICAgICAgIHZhciBzaSA9IDA7XG4gICAgICAgIHNpIDwgYnVmZmVycy5sZW5ndGggJiYgc3RhcnRCeXRlcyArIGJ1ZmZlcnNbc2ldLmxlbmd0aCA8PSBpO1xuICAgICAgICBzaSArK1xuICAgICkgeyBzdGFydEJ5dGVzICs9IGJ1ZmZlcnNbc2ldLmxlbmd0aCB9XG4gICAgXG4gICAgdmFyIHRhcmdldCA9IG5ldyBCdWZmZXIoaiAtIGkpO1xuICAgIFxuICAgIHZhciB0aSA9IDA7XG4gICAgZm9yICh2YXIgaWkgPSBzaTsgdGkgPCBqIC0gaSAmJiBpaSA8IGJ1ZmZlcnMubGVuZ3RoOyBpaSsrKSB7XG4gICAgICAgIHZhciBsZW4gPSBidWZmZXJzW2lpXS5sZW5ndGg7XG4gICAgICAgIFxuICAgICAgICB2YXIgc3RhcnQgPSB0aSA9PT0gMCA/IGkgLSBzdGFydEJ5dGVzIDogMDtcbiAgICAgICAgdmFyIGVuZCA9IHRpICsgbGVuID49IGogLSBpXG4gICAgICAgICAgICA/IE1hdGgubWluKHN0YXJ0ICsgKGogLSBpKSAtIHRpLCBsZW4pXG4gICAgICAgICAgICA6IGxlblxuICAgICAgICA7XG4gICAgICAgIFxuICAgICAgICBidWZmZXJzW2lpXS5jb3B5KHRhcmdldCwgdGksIHN0YXJ0LCBlbmQpO1xuICAgICAgICB0aSArPSBlbmQgLSBzdGFydDtcbiAgICB9XG4gICAgXG4gICAgcmV0dXJuIHRhcmdldDtcbn07XG5cbkJ1ZmZlcnMucHJvdG90eXBlLnBvcyA9IGZ1bmN0aW9uIChpKSB7XG4gICAgaWYgKGkgPCAwIHx8IGkgPj0gdGhpcy5sZW5ndGgpIHRocm93IG5ldyBFcnJvcignb29iJyk7XG4gICAgdmFyIGwgPSBpLCBiaSA9IDAsIGJ1ID0gbnVsbDtcbiAgICBmb3IgKDs7KSB7XG4gICAgICAgIGJ1ID0gdGhpcy5idWZmZXJzW2JpXTtcbiAgICAgICAgaWYgKGwgPCBidS5sZW5ndGgpIHtcbiAgICAgICAgICAgIHJldHVybiB7YnVmOiBiaSwgb2Zmc2V0OiBsfTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIGwgLT0gYnUubGVuZ3RoO1xuICAgICAgICB9XG4gICAgICAgIGJpKys7XG4gICAgfVxufTtcblxuQnVmZmVycy5wcm90b3R5cGUuZ2V0ID0gZnVuY3Rpb24gZ2V0IChpKSB7XG4gICAgdmFyIHBvcyA9IHRoaXMucG9zKGkpO1xuXG4gICAgcmV0dXJuIHRoaXMuYnVmZmVyc1twb3MuYnVmXS5nZXQocG9zLm9mZnNldCk7XG59O1xuXG5CdWZmZXJzLnByb3RvdHlwZS5zZXQgPSBmdW5jdGlvbiBzZXQgKGksIGIpIHtcbiAgICB2YXIgcG9zID0gdGhpcy5wb3MoaSk7XG5cbiAgICByZXR1cm4gdGhpcy5idWZmZXJzW3Bvcy5idWZdLnNldChwb3Mub2Zmc2V0LCBiKTtcbn07XG5cbkJ1ZmZlcnMucHJvdG90eXBlLmluZGV4T2YgPSBmdW5jdGlvbiAobmVlZGxlLCBvZmZzZXQpIHtcbiAgICBpZiAoXCJzdHJpbmdcIiA9PT0gdHlwZW9mIG5lZWRsZSkge1xuICAgICAgICBuZWVkbGUgPSBuZXcgQnVmZmVyKG5lZWRsZSk7XG4gICAgfSBlbHNlIGlmIChuZWVkbGUgaW5zdGFuY2VvZiBCdWZmZXIpIHtcbiAgICAgICAgLy8gYWxyZWFkeSBhIGJ1ZmZlclxuICAgIH0gZWxzZSB7XG4gICAgICAgIHRocm93IG5ldyBFcnJvcignSW52YWxpZCB0eXBlIGZvciBhIHNlYXJjaCBzdHJpbmcnKTtcbiAgICB9XG5cbiAgICBpZiAoIW5lZWRsZS5sZW5ndGgpIHtcbiAgICAgICAgcmV0dXJuIDA7XG4gICAgfVxuXG4gICAgaWYgKCF0aGlzLmxlbmd0aCkge1xuICAgICAgICByZXR1cm4gLTE7XG4gICAgfVxuXG4gICAgdmFyIGkgPSAwLCBqID0gMCwgbWF0Y2ggPSAwLCBtc3RhcnQsIHBvcyA9IDA7XG5cbiAgICAvLyBzdGFydCBzZWFyY2ggZnJvbSBhIHBhcnRpY3VsYXIgcG9pbnQgaW4gdGhlIHZpcnR1YWwgYnVmZmVyXG4gICAgaWYgKG9mZnNldCkge1xuICAgICAgICB2YXIgcCA9IHRoaXMucG9zKG9mZnNldCk7XG4gICAgICAgIGkgPSBwLmJ1ZjtcbiAgICAgICAgaiA9IHAub2Zmc2V0O1xuICAgICAgICBwb3MgPSBvZmZzZXQ7XG4gICAgfVxuXG4gICAgLy8gZm9yIGVhY2ggY2hhcmFjdGVyIGluIHZpcnR1YWwgYnVmZmVyXG4gICAgZm9yICg7Oykge1xuICAgICAgICB3aGlsZSAoaiA+PSB0aGlzLmJ1ZmZlcnNbaV0ubGVuZ3RoKSB7XG4gICAgICAgICAgICBqID0gMDtcbiAgICAgICAgICAgIGkrKztcblxuICAgICAgICAgICAgaWYgKGkgPj0gdGhpcy5idWZmZXJzLmxlbmd0aCkge1xuICAgICAgICAgICAgICAgIC8vIHNlYXJjaCBzdHJpbmcgbm90IGZvdW5kXG4gICAgICAgICAgICAgICAgcmV0dXJuIC0xO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG5cbiAgICAgICAgdmFyIGNoYXIgPSB0aGlzLmJ1ZmZlcnNbaV1bal07XG5cbiAgICAgICAgaWYgKGNoYXIgPT0gbmVlZGxlW21hdGNoXSkge1xuICAgICAgICAgICAgLy8ga2VlcCB0cmFjayB3aGVyZSBtYXRjaCBzdGFydGVkXG4gICAgICAgICAgICBpZiAobWF0Y2ggPT0gMCkge1xuICAgICAgICAgICAgICAgIG1zdGFydCA9IHtcbiAgICAgICAgICAgICAgICAgICAgaTogaSxcbiAgICAgICAgICAgICAgICAgICAgajogaixcbiAgICAgICAgICAgICAgICAgICAgcG9zOiBwb3NcbiAgICAgICAgICAgICAgICB9O1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgbWF0Y2grKztcbiAgICAgICAgICAgIGlmIChtYXRjaCA9PSBuZWVkbGUubGVuZ3RoKSB7XG4gICAgICAgICAgICAgICAgLy8gZnVsbCBtYXRjaFxuICAgICAgICAgICAgICAgIHJldHVybiBtc3RhcnQucG9zO1xuICAgICAgICAgICAgfVxuICAgICAgICB9IGVsc2UgaWYgKG1hdGNoICE9IDApIHtcbiAgICAgICAgICAgIC8vIGEgcGFydGlhbCBtYXRjaCBlbmRlZCwgZ28gYmFjayB0byBtYXRjaCBzdGFydGluZyBwb3NpdGlvblxuICAgICAgICAgICAgLy8gdGhpcyB3aWxsIGNvbnRpbnVlIHRoZSBzZWFyY2ggYXQgdGhlIG5leHQgY2hhcmFjdGVyXG4gICAgICAgICAgICBpID0gbXN0YXJ0Lmk7XG4gICAgICAgICAgICBqID0gbXN0YXJ0Lmo7XG4gICAgICAgICAgICBwb3MgPSBtc3RhcnQucG9zO1xuICAgICAgICAgICAgbWF0Y2ggPSAwO1xuICAgICAgICB9XG5cbiAgICAgICAgaisrO1xuICAgICAgICBwb3MrKztcbiAgICB9XG59O1xuXG5CdWZmZXJzLnByb3RvdHlwZS50b0J1ZmZlciA9IGZ1bmN0aW9uKCkge1xuICAgIHJldHVybiB0aGlzLnNsaWNlKCk7XG59XG5cbkJ1ZmZlcnMucHJvdG90eXBlLnRvU3RyaW5nID0gZnVuY3Rpb24oZW5jb2RpbmcsIHN0YXJ0LCBlbmQpIHtcbiAgICByZXR1cm4gdGhpcy5zbGljZShzdGFydCwgZW5kKS50b1N0cmluZyhlbmNvZGluZyk7XG59XG4iLCIvKlxuICogR2VuZXJhdGVkIGJ5IFBFRy5qcyAwLjEwLjAuXG4gKlxuICogaHR0cDovL3BlZ2pzLm9yZy9cbiAqL1xuXG5cInVzZSBzdHJpY3RcIjtcblxuZnVuY3Rpb24gcGVnJHN1YmNsYXNzKGNoaWxkLCBwYXJlbnQpIHtcbiAgZnVuY3Rpb24gY3RvcigpIHsgdGhpcy5jb25zdHJ1Y3RvciA9IGNoaWxkOyB9XG4gIGN0b3IucHJvdG90eXBlID0gcGFyZW50LnByb3RvdHlwZTtcbiAgY2hpbGQucHJvdG90eXBlID0gbmV3IGN0b3IoKTtcbn1cblxuZnVuY3Rpb24gcGVnJFN5bnRheEVycm9yKG1lc3NhZ2UsIGV4cGVjdGVkLCBmb3VuZCwgbG9jYXRpb24pIHtcbiAgdGhpcy5tZXNzYWdlICA9IG1lc3NhZ2U7XG4gIHRoaXMuZXhwZWN0ZWQgPSBleHBlY3RlZDtcbiAgdGhpcy5mb3VuZCAgICA9IGZvdW5kO1xuICB0aGlzLmxvY2F0aW9uID0gbG9jYXRpb247XG4gIHRoaXMubmFtZSAgICAgPSBcIlN5bnRheEVycm9yXCI7XG5cbiAgaWYgKHR5cGVvZiBFcnJvci5jYXB0dXJlU3RhY2tUcmFjZSA9PT0gXCJmdW5jdGlvblwiKSB7XG4gICAgRXJyb3IuY2FwdHVyZVN0YWNrVHJhY2UodGhpcywgcGVnJFN5bnRheEVycm9yKTtcbiAgfVxufVxuXG5wZWckc3ViY2xhc3MocGVnJFN5bnRheEVycm9yLCBFcnJvcik7XG5cbnBlZyRTeW50YXhFcnJvci5idWlsZE1lc3NhZ2UgPSBmdW5jdGlvbihleHBlY3RlZCwgZm91bmQpIHtcbiAgdmFyIERFU0NSSUJFX0VYUEVDVEFUSU9OX0ZOUyA9IHtcbiAgICAgICAgbGl0ZXJhbDogZnVuY3Rpb24oZXhwZWN0YXRpb24pIHtcbiAgICAgICAgICByZXR1cm4gXCJcXFwiXCIgKyBsaXRlcmFsRXNjYXBlKGV4cGVjdGF0aW9uLnRleHQpICsgXCJcXFwiXCI7XG4gICAgICAgIH0sXG5cbiAgICAgICAgXCJjbGFzc1wiOiBmdW5jdGlvbihleHBlY3RhdGlvbikge1xuICAgICAgICAgIHZhciBlc2NhcGVkUGFydHMgPSBcIlwiLFxuICAgICAgICAgICAgICBpO1xuXG4gICAgICAgICAgZm9yIChpID0gMDsgaSA8IGV4cGVjdGF0aW9uLnBhcnRzLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgICBlc2NhcGVkUGFydHMgKz0gZXhwZWN0YXRpb24ucGFydHNbaV0gaW5zdGFuY2VvZiBBcnJheVxuICAgICAgICAgICAgICA/IGNsYXNzRXNjYXBlKGV4cGVjdGF0aW9uLnBhcnRzW2ldWzBdKSArIFwiLVwiICsgY2xhc3NFc2NhcGUoZXhwZWN0YXRpb24ucGFydHNbaV1bMV0pXG4gICAgICAgICAgICAgIDogY2xhc3NFc2NhcGUoZXhwZWN0YXRpb24ucGFydHNbaV0pO1xuICAgICAgICAgIH1cblxuICAgICAgICAgIHJldHVybiBcIltcIiArIChleHBlY3RhdGlvbi5pbnZlcnRlZCA/IFwiXlwiIDogXCJcIikgKyBlc2NhcGVkUGFydHMgKyBcIl1cIjtcbiAgICAgICAgfSxcblxuICAgICAgICBhbnk6IGZ1bmN0aW9uKGV4cGVjdGF0aW9uKSB7XG4gICAgICAgICAgcmV0dXJuIFwiYW55IGNoYXJhY3RlclwiO1xuICAgICAgICB9LFxuXG4gICAgICAgIGVuZDogZnVuY3Rpb24oZXhwZWN0YXRpb24pIHtcbiAgICAgICAgICByZXR1cm4gXCJlbmQgb2YgaW5wdXRcIjtcbiAgICAgICAgfSxcblxuICAgICAgICBvdGhlcjogZnVuY3Rpb24oZXhwZWN0YXRpb24pIHtcbiAgICAgICAgICByZXR1cm4gZXhwZWN0YXRpb24uZGVzY3JpcHRpb247XG4gICAgICAgIH1cbiAgICAgIH07XG5cbiAgZnVuY3Rpb24gaGV4KGNoKSB7XG4gICAgcmV0dXJuIGNoLmNoYXJDb2RlQXQoMCkudG9TdHJpbmcoMTYpLnRvVXBwZXJDYXNlKCk7XG4gIH1cblxuICBmdW5jdGlvbiBsaXRlcmFsRXNjYXBlKHMpIHtcbiAgICByZXR1cm4gc1xuICAgICAgLnJlcGxhY2UoL1xcXFwvZywgJ1xcXFxcXFxcJylcbiAgICAgIC5yZXBsYWNlKC9cIi9nLCAgJ1xcXFxcIicpXG4gICAgICAucmVwbGFjZSgvXFwwL2csICdcXFxcMCcpXG4gICAgICAucmVwbGFjZSgvXFx0L2csICdcXFxcdCcpXG4gICAgICAucmVwbGFjZSgvXFxuL2csICdcXFxcbicpXG4gICAgICAucmVwbGFjZSgvXFxyL2csICdcXFxccicpXG4gICAgICAucmVwbGFjZSgvW1xceDAwLVxceDBGXS9nLCAgICAgICAgICBmdW5jdGlvbihjaCkgeyByZXR1cm4gJ1xcXFx4MCcgKyBoZXgoY2gpOyB9KVxuICAgICAgLnJlcGxhY2UoL1tcXHgxMC1cXHgxRlxceDdGLVxceDlGXS9nLCBmdW5jdGlvbihjaCkgeyByZXR1cm4gJ1xcXFx4JyAgKyBoZXgoY2gpOyB9KTtcbiAgfVxuXG4gIGZ1bmN0aW9uIGNsYXNzRXNjYXBlKHMpIHtcbiAgICByZXR1cm4gc1xuICAgICAgLnJlcGxhY2UoL1xcXFwvZywgJ1xcXFxcXFxcJylcbiAgICAgIC5yZXBsYWNlKC9cXF0vZywgJ1xcXFxdJylcbiAgICAgIC5yZXBsYWNlKC9cXF4vZywgJ1xcXFxeJylcbiAgICAgIC5yZXBsYWNlKC8tL2csICAnXFxcXC0nKVxuICAgICAgLnJlcGxhY2UoL1xcMC9nLCAnXFxcXDAnKVxuICAgICAgLnJlcGxhY2UoL1xcdC9nLCAnXFxcXHQnKVxuICAgICAgLnJlcGxhY2UoL1xcbi9nLCAnXFxcXG4nKVxuICAgICAgLnJlcGxhY2UoL1xcci9nLCAnXFxcXHInKVxuICAgICAgLnJlcGxhY2UoL1tcXHgwMC1cXHgwRl0vZywgICAgICAgICAgZnVuY3Rpb24oY2gpIHsgcmV0dXJuICdcXFxceDAnICsgaGV4KGNoKTsgfSlcbiAgICAgIC5yZXBsYWNlKC9bXFx4MTAtXFx4MUZcXHg3Ri1cXHg5Rl0vZywgZnVuY3Rpb24oY2gpIHsgcmV0dXJuICdcXFxceCcgICsgaGV4KGNoKTsgfSk7XG4gIH1cblxuICBmdW5jdGlvbiBkZXNjcmliZUV4cGVjdGF0aW9uKGV4cGVjdGF0aW9uKSB7XG4gICAgcmV0dXJuIERFU0NSSUJFX0VYUEVDVEFUSU9OX0ZOU1tleHBlY3RhdGlvbi50eXBlXShleHBlY3RhdGlvbik7XG4gIH1cblxuICBmdW5jdGlvbiBkZXNjcmliZUV4cGVjdGVkKGV4cGVjdGVkKSB7XG4gICAgdmFyIGRlc2NyaXB0aW9ucyA9IG5ldyBBcnJheShleHBlY3RlZC5sZW5ndGgpLFxuICAgICAgICBpLCBqO1xuXG4gICAgZm9yIChpID0gMDsgaSA8IGV4cGVjdGVkLmxlbmd0aDsgaSsrKSB7XG4gICAgICBkZXNjcmlwdGlvbnNbaV0gPSBkZXNjcmliZUV4cGVjdGF0aW9uKGV4cGVjdGVkW2ldKTtcbiAgICB9XG5cbiAgICBkZXNjcmlwdGlvbnMuc29ydCgpO1xuXG4gICAgaWYgKGRlc2NyaXB0aW9ucy5sZW5ndGggPiAwKSB7XG4gICAgICBmb3IgKGkgPSAxLCBqID0gMTsgaSA8IGRlc2NyaXB0aW9ucy5sZW5ndGg7IGkrKykge1xuICAgICAgICBpZiAoZGVzY3JpcHRpb25zW2kgLSAxXSAhPT0gZGVzY3JpcHRpb25zW2ldKSB7XG4gICAgICAgICAgZGVzY3JpcHRpb25zW2pdID0gZGVzY3JpcHRpb25zW2ldO1xuICAgICAgICAgIGorKztcbiAgICAgICAgfVxuICAgICAgfVxuICAgICAgZGVzY3JpcHRpb25zLmxlbmd0aCA9IGo7XG4gICAgfVxuXG4gICAgc3dpdGNoIChkZXNjcmlwdGlvbnMubGVuZ3RoKSB7XG4gICAgICBjYXNlIDE6XG4gICAgICAgIHJldHVybiBkZXNjcmlwdGlvbnNbMF07XG5cbiAgICAgIGNhc2UgMjpcbiAgICAgICAgcmV0dXJuIGRlc2NyaXB0aW9uc1swXSArIFwiIG9yIFwiICsgZGVzY3JpcHRpb25zWzFdO1xuXG4gICAgICBkZWZhdWx0OlxuICAgICAgICByZXR1cm4gZGVzY3JpcHRpb25zLnNsaWNlKDAsIC0xKS5qb2luKFwiLCBcIilcbiAgICAgICAgICArIFwiLCBvciBcIlxuICAgICAgICAgICsgZGVzY3JpcHRpb25zW2Rlc2NyaXB0aW9ucy5sZW5ndGggLSAxXTtcbiAgICB9XG4gIH1cblxuICBmdW5jdGlvbiBkZXNjcmliZUZvdW5kKGZvdW5kKSB7XG4gICAgcmV0dXJuIGZvdW5kID8gXCJcXFwiXCIgKyBsaXRlcmFsRXNjYXBlKGZvdW5kKSArIFwiXFxcIlwiIDogXCJlbmQgb2YgaW5wdXRcIjtcbiAgfVxuXG4gIHJldHVybiBcIkV4cGVjdGVkIFwiICsgZGVzY3JpYmVFeHBlY3RlZChleHBlY3RlZCkgKyBcIiBidXQgXCIgKyBkZXNjcmliZUZvdW5kKGZvdW5kKSArIFwiIGZvdW5kLlwiO1xufTtcblxuZnVuY3Rpb24gcGVnJHBhcnNlKGlucHV0LCBvcHRpb25zKSB7XG4gIG9wdGlvbnMgPSBvcHRpb25zICE9PSB2b2lkIDAgPyBvcHRpb25zIDoge307XG5cbiAgdmFyIHBlZyRGQUlMRUQgPSB7fSxcblxuICAgICAgcGVnJHN0YXJ0UnVsZUZ1bmN0aW9ucyA9IHsgb3Nhc2NyaXB0OiBwZWckcGFyc2Vvc2FzY3JpcHQgfSxcbiAgICAgIHBlZyRzdGFydFJ1bGVGdW5jdGlvbiAgPSBwZWckcGFyc2Vvc2FzY3JpcHQsXG5cbiAgICAgIHBlZyRjMCA9IGZ1bmN0aW9uKHZhbHVlKSB7IHJldHVybiB2YWx1ZTsgfSxcbiAgICAgIHBlZyRjMSA9IFwie1wiLFxuICAgICAgcGVnJGMyID0gcGVnJGxpdGVyYWxFeHBlY3RhdGlvbihcIntcIiwgZmFsc2UpLFxuICAgICAgcGVnJGMzID0gXCJ9XCIsXG4gICAgICBwZWckYzQgPSBwZWckbGl0ZXJhbEV4cGVjdGF0aW9uKFwifVwiLCBmYWxzZSksXG4gICAgICBwZWckYzUgPSBcIjpcIixcbiAgICAgIHBlZyRjNiA9IHBlZyRsaXRlcmFsRXhwZWN0YXRpb24oXCI6XCIsIGZhbHNlKSxcbiAgICAgIHBlZyRjNyA9IFwiLFwiLFxuICAgICAgcGVnJGM4ID0gcGVnJGxpdGVyYWxFeHBlY3RhdGlvbihcIixcIiwgZmFsc2UpLFxuICAgICAgcGVnJGM5ID0gcGVnJG90aGVyRXhwZWN0YXRpb24oXCJ3aGl0ZXNwYWNlXCIpLFxuICAgICAgcGVnJGMxMCA9IC9eWyBcXHRcXG5cXHJdLyxcbiAgICAgIHBlZyRjMTEgPSBwZWckY2xhc3NFeHBlY3RhdGlvbihbXCIgXCIsIFwiXFx0XCIsIFwiXFxuXCIsIFwiXFxyXCJdLCBmYWxzZSwgZmFsc2UpLFxuICAgICAgcGVnJGMxMiA9IFwiZmFsc2VcIixcbiAgICAgIHBlZyRjMTMgPSBwZWckbGl0ZXJhbEV4cGVjdGF0aW9uKFwiZmFsc2VcIiwgZmFsc2UpLFxuICAgICAgcGVnJGMxNCA9IGZ1bmN0aW9uKCkgeyByZXR1cm4gZmFsc2U7IH0sXG4gICAgICBwZWckYzE1ID0gXCJ0cnVlXCIsXG4gICAgICBwZWckYzE2ID0gcGVnJGxpdGVyYWxFeHBlY3RhdGlvbihcInRydWVcIiwgZmFsc2UpLFxuICAgICAgcGVnJGMxNyA9IGZ1bmN0aW9uKCkgeyByZXR1cm4gdHJ1ZTsgIH0sXG4gICAgICBwZWckYzE4ID0gcGVnJGFueUV4cGVjdGF0aW9uKCksXG4gICAgICBwZWckYzE5ID0gZnVuY3Rpb24oY2hhcnMpIHsgcmV0dXJuIChjaGFycy5sZW5ndGggPiAwKSA/IGNoYXJzLmpvaW4oJycpIDogbnVsbDsgfSxcbiAgICAgIHBlZyRjMjAgPSBmdW5jdGlvbihmaXJzdCwgbSkgeyByZXR1cm4gbTsgfSxcbiAgICAgIHBlZyRjMjEgPSBmdW5jdGlvbihmaXJzdCwgcmVzdCkge1xuICAgICAgICAgICAgICB2YXIgcmVzdWx0ID0ge30sIGk7XG5cbiAgICAgICAgICAgICAgcmVzdWx0W2ZpcnN0Lm5hbWVdID0gZmlyc3QudmFsdWU7XG5cbiAgICAgICAgICAgICAgZm9yIChpID0gMDsgaSA8IHJlc3QubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICAgICAgICByZXN1bHRbcmVzdFtpXS5uYW1lXSA9IHJlc3RbaV0udmFsdWU7XG4gICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICByZXR1cm4gcmVzdWx0O1xuICAgICAgICAgICAgfSxcbiAgICAgIHBlZyRjMjIgPSBmdW5jdGlvbihtZW1iZXJzKSB7IHJldHVybiBtZW1iZXJzICE9PSBudWxsID8gbWVtYmVyczoge307IH0sXG4gICAgICBwZWckYzIzID0gZnVuY3Rpb24obmFtZSwgdmFsdWUpIHtcbiAgICAgICAgICAgIHJldHVybiB7IG5hbWU6IG5hbWUsIHZhbHVlOiB2YWx1ZSB9O1xuICAgICAgICAgIH0sXG4gICAgICBwZWckYzI0ID0gL15bIGEtejAtOVxcLV0vaSxcbiAgICAgIHBlZyRjMjUgPSBwZWckY2xhc3NFeHBlY3RhdGlvbihbXCIgXCIsIFtcImFcIiwgXCJ6XCJdLCBbXCIwXCIsIFwiOVwiXSwgXCItXCJdLCBmYWxzZSwgdHJ1ZSksXG4gICAgICBwZWckYzI2ID0gZnVuY3Rpb24oY2hhcnMpIHsgcmV0dXJuIGNoYXJzLmpvaW4oXCJcIikudHJpbSgpOyB9LFxuICAgICAgcGVnJGMyNyA9IGZ1bmN0aW9uKGZpcnN0LCB2KSB7IHJldHVybiB2OyB9LFxuICAgICAgcGVnJGMyOCA9IGZ1bmN0aW9uKGZpcnN0LCByZXN0KSB7IHJldHVybiBbZmlyc3RdLmNvbmNhdChyZXN0KTsgfSxcbiAgICAgIHBlZyRjMjkgPSBmdW5jdGlvbih2YWx1ZXMpIHsgcmV0dXJuIHZhbHVlcyAhPT0gbnVsbCA/IHZhbHVlcyA6IFtdOyB9LFxuICAgICAgcGVnJGMzMCA9IHBlZyRvdGhlckV4cGVjdGF0aW9uKFwibnVtYmVyXCIpLFxuICAgICAgcGVnJGMzMSA9IGZ1bmN0aW9uKCkgeyByZXR1cm4gcGFyc2VGbG9hdCh0ZXh0KCkpOyB9LFxuICAgICAgcGVnJGMzMiA9IFwiLlwiLFxuICAgICAgcGVnJGMzMyA9IHBlZyRsaXRlcmFsRXhwZWN0YXRpb24oXCIuXCIsIGZhbHNlKSxcbiAgICAgIHBlZyRjMzQgPSAvXlsxLTldLyxcbiAgICAgIHBlZyRjMzUgPSBwZWckY2xhc3NFeHBlY3RhdGlvbihbW1wiMVwiLCBcIjlcIl1dLCBmYWxzZSwgZmFsc2UpLFxuICAgICAgcGVnJGMzNiA9IC9eW2VFXS8sXG4gICAgICBwZWckYzM3ID0gcGVnJGNsYXNzRXhwZWN0YXRpb24oW1wiZVwiLCBcIkVcIl0sIGZhbHNlLCBmYWxzZSksXG4gICAgICBwZWckYzM4ID0gXCItXCIsXG4gICAgICBwZWckYzM5ID0gcGVnJGxpdGVyYWxFeHBlY3RhdGlvbihcIi1cIiwgZmFsc2UpLFxuICAgICAgcGVnJGM0MCA9IFwiK1wiLFxuICAgICAgcGVnJGM0MSA9IHBlZyRsaXRlcmFsRXhwZWN0YXRpb24oXCIrXCIsIGZhbHNlKSxcbiAgICAgIHBlZyRjNDIgPSBcIjBcIixcbiAgICAgIHBlZyRjNDMgPSBwZWckbGl0ZXJhbEV4cGVjdGF0aW9uKFwiMFwiLCBmYWxzZSksXG4gICAgICBwZWckYzQ0ID0gcGVnJG90aGVyRXhwZWN0YXRpb24oXCJzdHJpbmdcIiksXG4gICAgICBwZWckYzQ1ID0gZnVuY3Rpb24oY2hhcnMpIHsgcmV0dXJuIGNoYXJzLmpvaW4oXCJcIik7IH0sXG4gICAgICBwZWckYzQ2ID0gXCJcXG5cIixcbiAgICAgIHBlZyRjNDcgPSBwZWckbGl0ZXJhbEV4cGVjdGF0aW9uKFwiXFxuXCIsIGZhbHNlKSxcbiAgICAgIHBlZyRjNDggPSBcIlxcdFwiLFxuICAgICAgcGVnJGM0OSA9IHBlZyRsaXRlcmFsRXhwZWN0YXRpb24oXCJcXHRcIiwgZmFsc2UpLFxuICAgICAgcGVnJGM1MCA9IFwiXFxcIlwiLFxuICAgICAgcGVnJGM1MSA9IHBlZyRsaXRlcmFsRXhwZWN0YXRpb24oXCJcXFwiXCIsIGZhbHNlKSxcbiAgICAgIHBlZyRjNTIgPSBcIlxcXFxcIixcbiAgICAgIHBlZyRjNTMgPSBwZWckbGl0ZXJhbEV4cGVjdGF0aW9uKFwiXFxcXFwiLCBmYWxzZSksXG4gICAgICBwZWckYzU0ID0gXCIvXCIsXG4gICAgICBwZWckYzU1ID0gcGVnJGxpdGVyYWxFeHBlY3RhdGlvbihcIi9cIiwgZmFsc2UpLFxuICAgICAgcGVnJGM1NiA9IFwiYlwiLFxuICAgICAgcGVnJGM1NyA9IHBlZyRsaXRlcmFsRXhwZWN0YXRpb24oXCJiXCIsIGZhbHNlKSxcbiAgICAgIHBlZyRjNTggPSBmdW5jdGlvbigpIHsgcmV0dXJuIFwiXFxiXCI7IH0sXG4gICAgICBwZWckYzU5ID0gXCJmXCIsXG4gICAgICBwZWckYzYwID0gcGVnJGxpdGVyYWxFeHBlY3RhdGlvbihcImZcIiwgZmFsc2UpLFxuICAgICAgcGVnJGM2MSA9IGZ1bmN0aW9uKCkgeyByZXR1cm4gXCJcXGZcIjsgfSxcbiAgICAgIHBlZyRjNjIgPSBcIm5cIixcbiAgICAgIHBlZyRjNjMgPSBwZWckbGl0ZXJhbEV4cGVjdGF0aW9uKFwiblwiLCBmYWxzZSksXG4gICAgICBwZWckYzY0ID0gZnVuY3Rpb24oKSB7IHJldHVybiBcIlxcblwiOyB9LFxuICAgICAgcGVnJGM2NSA9IFwiclwiLFxuICAgICAgcGVnJGM2NiA9IHBlZyRsaXRlcmFsRXhwZWN0YXRpb24oXCJyXCIsIGZhbHNlKSxcbiAgICAgIHBlZyRjNjcgPSBmdW5jdGlvbigpIHsgcmV0dXJuIFwiXFxyXCI7IH0sXG4gICAgICBwZWckYzY4ID0gXCJ0XCIsXG4gICAgICBwZWckYzY5ID0gcGVnJGxpdGVyYWxFeHBlY3RhdGlvbihcInRcIiwgZmFsc2UpLFxuICAgICAgcGVnJGM3MCA9IGZ1bmN0aW9uKCkgeyByZXR1cm4gXCJcXHRcIjsgfSxcbiAgICAgIHBlZyRjNzEgPSBcInVcIixcbiAgICAgIHBlZyRjNzIgPSBwZWckbGl0ZXJhbEV4cGVjdGF0aW9uKFwidVwiLCBmYWxzZSksXG4gICAgICBwZWckYzczID0gZnVuY3Rpb24oZGlnaXRzKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIFN0cmluZy5mcm9tQ2hhckNvZGUocGFyc2VJbnQoZGlnaXRzLCAxNikpO1xuICAgICAgICAgICAgICB9LFxuICAgICAgcGVnJGM3NCA9IGZ1bmN0aW9uKHNlcXVlbmNlKSB7IHJldHVybiBzZXF1ZW5jZTsgfSxcbiAgICAgIHBlZyRjNzUgPSAvXlteXFwwLVxceDFGXCJcXFxcXS8sXG4gICAgICBwZWckYzc2ID0gcGVnJGNsYXNzRXhwZWN0YXRpb24oW1tcIlxcMFwiLCBcIlxceDFGXCJdLCBcIlxcXCJcIiwgXCJcXFxcXCJdLCB0cnVlLCBmYWxzZSksXG4gICAgICBwZWckYzc3ID0gcGVnJG90aGVyRXhwZWN0YXRpb24oXCJ1bnF1b3RlZCBzdHJpbmdcIiksXG4gICAgICBwZWckYzc4ID0gZnVuY3Rpb24oZmlyc3RfY2hhciwgY2hhcnMpIHsgcmV0dXJuIGZpcnN0X2NoYXIrY2hhcnMuam9pbihcIlwiKTsgfSxcbiAgICAgIHBlZyRjNzkgPSAvXlthLXogXS8sXG4gICAgICBwZWckYzgwID0gcGVnJGNsYXNzRXhwZWN0YXRpb24oW1tcImFcIiwgXCJ6XCJdLCBcIiBcIl0sIGZhbHNlLCBmYWxzZSksXG4gICAgICBwZWckYzgxID0gL15bXix9XS8sXG4gICAgICBwZWckYzgyID0gcGVnJGNsYXNzRXhwZWN0YXRpb24oW1wiLFwiLCBcIn1cIl0sIHRydWUsIGZhbHNlKSxcbiAgICAgIHBlZyRjODMgPSBwZWckb3RoZXJFeHBlY3RhdGlvbihcImRhdGVcIiksXG4gICAgICBwZWckYzg0ID0gXCJkYXRlXCIsXG4gICAgICBwZWckYzg1ID0gcGVnJGxpdGVyYWxFeHBlY3RhdGlvbihcImRhdGVcIiwgZmFsc2UpLFxuICAgICAgcGVnJGM4NiA9IGZ1bmN0aW9uKGRhdGUpIHtcbiAgICAgICAgdmFyIGRhdGVPYmplY3QgPSBuZXcgRGF0ZShkYXRlKTtcbiAgICAgICAgcmV0dXJuICFpc05hTihkYXRlT2JqZWN0LmdldFRpbWUoKSkgPyBkYXRlT2JqZWN0IDogZGF0ZTtcbiAgICAgICB9LFxuICAgICAgcGVnJGM4NyA9IC9eWzAtOV0vLFxuICAgICAgcGVnJGM4OCA9IHBlZyRjbGFzc0V4cGVjdGF0aW9uKFtbXCIwXCIsIFwiOVwiXV0sIGZhbHNlLCBmYWxzZSksXG4gICAgICBwZWckYzg5ID0gL15bMC05YS1mXS9pLFxuICAgICAgcGVnJGM5MCA9IHBlZyRjbGFzc0V4cGVjdGF0aW9uKFtbXCIwXCIsIFwiOVwiXSwgW1wiYVwiLCBcImZcIl1dLCBmYWxzZSwgdHJ1ZSksXG5cbiAgICAgIHBlZyRjdXJyUG9zICAgICAgICAgID0gMCxcbiAgICAgIHBlZyRzYXZlZFBvcyAgICAgICAgID0gMCxcbiAgICAgIHBlZyRwb3NEZXRhaWxzQ2FjaGUgID0gW3sgbGluZTogMSwgY29sdW1uOiAxIH1dLFxuICAgICAgcGVnJG1heEZhaWxQb3MgICAgICAgPSAwLFxuICAgICAgcGVnJG1heEZhaWxFeHBlY3RlZCAgPSBbXSxcbiAgICAgIHBlZyRzaWxlbnRGYWlscyAgICAgID0gMCxcblxuICAgICAgcGVnJHJlc3VsdDtcblxuICBpZiAoXCJzdGFydFJ1bGVcIiBpbiBvcHRpb25zKSB7XG4gICAgaWYgKCEob3B0aW9ucy5zdGFydFJ1bGUgaW4gcGVnJHN0YXJ0UnVsZUZ1bmN0aW9ucykpIHtcbiAgICAgIHRocm93IG5ldyBFcnJvcihcIkNhbid0IHN0YXJ0IHBhcnNpbmcgZnJvbSBydWxlIFxcXCJcIiArIG9wdGlvbnMuc3RhcnRSdWxlICsgXCJcXFwiLlwiKTtcbiAgICB9XG5cbiAgICBwZWckc3RhcnRSdWxlRnVuY3Rpb24gPSBwZWckc3RhcnRSdWxlRnVuY3Rpb25zW29wdGlvbnMuc3RhcnRSdWxlXTtcbiAgfVxuXG4gIGZ1bmN0aW9uIHRleHQoKSB7XG4gICAgcmV0dXJuIGlucHV0LnN1YnN0cmluZyhwZWckc2F2ZWRQb3MsIHBlZyRjdXJyUG9zKTtcbiAgfVxuXG4gIGZ1bmN0aW9uIGxvY2F0aW9uKCkge1xuICAgIHJldHVybiBwZWckY29tcHV0ZUxvY2F0aW9uKHBlZyRzYXZlZFBvcywgcGVnJGN1cnJQb3MpO1xuICB9XG5cbiAgZnVuY3Rpb24gZXhwZWN0ZWQoZGVzY3JpcHRpb24sIGxvY2F0aW9uKSB7XG4gICAgbG9jYXRpb24gPSBsb2NhdGlvbiAhPT0gdm9pZCAwID8gbG9jYXRpb24gOiBwZWckY29tcHV0ZUxvY2F0aW9uKHBlZyRzYXZlZFBvcywgcGVnJGN1cnJQb3MpXG5cbiAgICB0aHJvdyBwZWckYnVpbGRTdHJ1Y3R1cmVkRXJyb3IoXG4gICAgICBbcGVnJG90aGVyRXhwZWN0YXRpb24oZGVzY3JpcHRpb24pXSxcbiAgICAgIGlucHV0LnN1YnN0cmluZyhwZWckc2F2ZWRQb3MsIHBlZyRjdXJyUG9zKSxcbiAgICAgIGxvY2F0aW9uXG4gICAgKTtcbiAgfVxuXG4gIGZ1bmN0aW9uIGVycm9yKG1lc3NhZ2UsIGxvY2F0aW9uKSB7XG4gICAgbG9jYXRpb24gPSBsb2NhdGlvbiAhPT0gdm9pZCAwID8gbG9jYXRpb24gOiBwZWckY29tcHV0ZUxvY2F0aW9uKHBlZyRzYXZlZFBvcywgcGVnJGN1cnJQb3MpXG5cbiAgICB0aHJvdyBwZWckYnVpbGRTaW1wbGVFcnJvcihtZXNzYWdlLCBsb2NhdGlvbik7XG4gIH1cblxuICBmdW5jdGlvbiBwZWckbGl0ZXJhbEV4cGVjdGF0aW9uKHRleHQsIGlnbm9yZUNhc2UpIHtcbiAgICByZXR1cm4geyB0eXBlOiBcImxpdGVyYWxcIiwgdGV4dDogdGV4dCwgaWdub3JlQ2FzZTogaWdub3JlQ2FzZSB9O1xuICB9XG5cbiAgZnVuY3Rpb24gcGVnJGNsYXNzRXhwZWN0YXRpb24ocGFydHMsIGludmVydGVkLCBpZ25vcmVDYXNlKSB7XG4gICAgcmV0dXJuIHsgdHlwZTogXCJjbGFzc1wiLCBwYXJ0czogcGFydHMsIGludmVydGVkOiBpbnZlcnRlZCwgaWdub3JlQ2FzZTogaWdub3JlQ2FzZSB9O1xuICB9XG5cbiAgZnVuY3Rpb24gcGVnJGFueUV4cGVjdGF0aW9uKCkge1xuICAgIHJldHVybiB7IHR5cGU6IFwiYW55XCIgfTtcbiAgfVxuXG4gIGZ1bmN0aW9uIHBlZyRlbmRFeHBlY3RhdGlvbigpIHtcbiAgICByZXR1cm4geyB0eXBlOiBcImVuZFwiIH07XG4gIH1cblxuICBmdW5jdGlvbiBwZWckb3RoZXJFeHBlY3RhdGlvbihkZXNjcmlwdGlvbikge1xuICAgIHJldHVybiB7IHR5cGU6IFwib3RoZXJcIiwgZGVzY3JpcHRpb246IGRlc2NyaXB0aW9uIH07XG4gIH1cblxuICBmdW5jdGlvbiBwZWckY29tcHV0ZVBvc0RldGFpbHMocG9zKSB7XG4gICAgdmFyIGRldGFpbHMgPSBwZWckcG9zRGV0YWlsc0NhY2hlW3Bvc10sIHA7XG5cbiAgICBpZiAoZGV0YWlscykge1xuICAgICAgcmV0dXJuIGRldGFpbHM7XG4gICAgfSBlbHNlIHtcbiAgICAgIHAgPSBwb3MgLSAxO1xuICAgICAgd2hpbGUgKCFwZWckcG9zRGV0YWlsc0NhY2hlW3BdKSB7XG4gICAgICAgIHAtLTtcbiAgICAgIH1cblxuICAgICAgZGV0YWlscyA9IHBlZyRwb3NEZXRhaWxzQ2FjaGVbcF07XG4gICAgICBkZXRhaWxzID0ge1xuICAgICAgICBsaW5lOiAgIGRldGFpbHMubGluZSxcbiAgICAgICAgY29sdW1uOiBkZXRhaWxzLmNvbHVtblxuICAgICAgfTtcblxuICAgICAgd2hpbGUgKHAgPCBwb3MpIHtcbiAgICAgICAgaWYgKGlucHV0LmNoYXJDb2RlQXQocCkgPT09IDEwKSB7XG4gICAgICAgICAgZGV0YWlscy5saW5lKys7XG4gICAgICAgICAgZGV0YWlscy5jb2x1bW4gPSAxO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIGRldGFpbHMuY29sdW1uKys7XG4gICAgICAgIH1cblxuICAgICAgICBwKys7XG4gICAgICB9XG5cbiAgICAgIHBlZyRwb3NEZXRhaWxzQ2FjaGVbcG9zXSA9IGRldGFpbHM7XG4gICAgICByZXR1cm4gZGV0YWlscztcbiAgICB9XG4gIH1cblxuICBmdW5jdGlvbiBwZWckY29tcHV0ZUxvY2F0aW9uKHN0YXJ0UG9zLCBlbmRQb3MpIHtcbiAgICB2YXIgc3RhcnRQb3NEZXRhaWxzID0gcGVnJGNvbXB1dGVQb3NEZXRhaWxzKHN0YXJ0UG9zKSxcbiAgICAgICAgZW5kUG9zRGV0YWlscyAgID0gcGVnJGNvbXB1dGVQb3NEZXRhaWxzKGVuZFBvcyk7XG5cbiAgICByZXR1cm4ge1xuICAgICAgc3RhcnQ6IHtcbiAgICAgICAgb2Zmc2V0OiBzdGFydFBvcyxcbiAgICAgICAgbGluZTogICBzdGFydFBvc0RldGFpbHMubGluZSxcbiAgICAgICAgY29sdW1uOiBzdGFydFBvc0RldGFpbHMuY29sdW1uXG4gICAgICB9LFxuICAgICAgZW5kOiB7XG4gICAgICAgIG9mZnNldDogZW5kUG9zLFxuICAgICAgICBsaW5lOiAgIGVuZFBvc0RldGFpbHMubGluZSxcbiAgICAgICAgY29sdW1uOiBlbmRQb3NEZXRhaWxzLmNvbHVtblxuICAgICAgfVxuICAgIH07XG4gIH1cblxuICBmdW5jdGlvbiBwZWckZmFpbChleHBlY3RlZCkge1xuICAgIGlmIChwZWckY3VyclBvcyA8IHBlZyRtYXhGYWlsUG9zKSB7IHJldHVybjsgfVxuXG4gICAgaWYgKHBlZyRjdXJyUG9zID4gcGVnJG1heEZhaWxQb3MpIHtcbiAgICAgIHBlZyRtYXhGYWlsUG9zID0gcGVnJGN1cnJQb3M7XG4gICAgICBwZWckbWF4RmFpbEV4cGVjdGVkID0gW107XG4gICAgfVxuXG4gICAgcGVnJG1heEZhaWxFeHBlY3RlZC5wdXNoKGV4cGVjdGVkKTtcbiAgfVxuXG4gIGZ1bmN0aW9uIHBlZyRidWlsZFNpbXBsZUVycm9yKG1lc3NhZ2UsIGxvY2F0aW9uKSB7XG4gICAgcmV0dXJuIG5ldyBwZWckU3ludGF4RXJyb3IobWVzc2FnZSwgbnVsbCwgbnVsbCwgbG9jYXRpb24pO1xuICB9XG5cbiAgZnVuY3Rpb24gcGVnJGJ1aWxkU3RydWN0dXJlZEVycm9yKGV4cGVjdGVkLCBmb3VuZCwgbG9jYXRpb24pIHtcbiAgICByZXR1cm4gbmV3IHBlZyRTeW50YXhFcnJvcihcbiAgICAgIHBlZyRTeW50YXhFcnJvci5idWlsZE1lc3NhZ2UoZXhwZWN0ZWQsIGZvdW5kKSxcbiAgICAgIGV4cGVjdGVkLFxuICAgICAgZm91bmQsXG4gICAgICBsb2NhdGlvblxuICAgICk7XG4gIH1cblxuICBmdW5jdGlvbiBwZWckcGFyc2Vvc2FzY3JpcHQoKSB7XG4gICAgdmFyIHMwLCBzMSwgczIsIHMzO1xuXG4gICAgczAgPSBwZWckY3VyclBvcztcbiAgICBzMSA9IHBlZyRwYXJzZXdzKCk7XG4gICAgaWYgKHMxICE9PSBwZWckRkFJTEVEKSB7XG4gICAgICBzMiA9IHBlZyRwYXJzZXZhbHVlKCk7XG4gICAgICBpZiAoczIgIT09IHBlZyRGQUlMRUQpIHtcbiAgICAgICAgczMgPSBwZWckcGFyc2V3cygpO1xuICAgICAgICBpZiAoczMgIT09IHBlZyRGQUlMRUQpIHtcbiAgICAgICAgICBwZWckc2F2ZWRQb3MgPSBzMDtcbiAgICAgICAgICBzMSA9IHBlZyRjMChzMik7XG4gICAgICAgICAgczAgPSBzMTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICBwZWckY3VyclBvcyA9IHMwO1xuICAgICAgICAgIHMwID0gcGVnJEZBSUxFRDtcbiAgICAgICAgfVxuICAgICAgfSBlbHNlIHtcbiAgICAgICAgcGVnJGN1cnJQb3MgPSBzMDtcbiAgICAgICAgczAgPSBwZWckRkFJTEVEO1xuICAgICAgfVxuICAgIH0gZWxzZSB7XG4gICAgICBwZWckY3VyclBvcyA9IHMwO1xuICAgICAgczAgPSBwZWckRkFJTEVEO1xuICAgIH1cblxuICAgIHJldHVybiBzMDtcbiAgfVxuXG4gIGZ1bmN0aW9uIHBlZyRwYXJzZWJlZ2luX29iamVjdCgpIHtcbiAgICB2YXIgczAsIHMxLCBzMiwgczM7XG5cbiAgICBzMCA9IHBlZyRjdXJyUG9zO1xuICAgIHMxID0gcGVnJHBhcnNld3MoKTtcbiAgICBpZiAoczEgIT09IHBlZyRGQUlMRUQpIHtcbiAgICAgIGlmIChpbnB1dC5jaGFyQ29kZUF0KHBlZyRjdXJyUG9zKSA9PT0gMTIzKSB7XG4gICAgICAgIHMyID0gcGVnJGMxO1xuICAgICAgICBwZWckY3VyclBvcysrO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgczIgPSBwZWckRkFJTEVEO1xuICAgICAgICBpZiAocGVnJHNpbGVudEZhaWxzID09PSAwKSB7IHBlZyRmYWlsKHBlZyRjMik7IH1cbiAgICAgIH1cbiAgICAgIGlmIChzMiAhPT0gcGVnJEZBSUxFRCkge1xuICAgICAgICBzMyA9IHBlZyRwYXJzZXdzKCk7XG4gICAgICAgIGlmIChzMyAhPT0gcGVnJEZBSUxFRCkge1xuICAgICAgICAgIHMxID0gW3MxLCBzMiwgczNdO1xuICAgICAgICAgIHMwID0gczE7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgcGVnJGN1cnJQb3MgPSBzMDtcbiAgICAgICAgICBzMCA9IHBlZyRGQUlMRUQ7XG4gICAgICAgIH1cbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHBlZyRjdXJyUG9zID0gczA7XG4gICAgICAgIHMwID0gcGVnJEZBSUxFRDtcbiAgICAgIH1cbiAgICB9IGVsc2Uge1xuICAgICAgcGVnJGN1cnJQb3MgPSBzMDtcbiAgICAgIHMwID0gcGVnJEZBSUxFRDtcbiAgICB9XG5cbiAgICByZXR1cm4gczA7XG4gIH1cblxuICBmdW5jdGlvbiBwZWckcGFyc2VlbmRfb2JqZWN0KCkge1xuICAgIHZhciBzMCwgczEsIHMyLCBzMztcblxuICAgIHMwID0gcGVnJGN1cnJQb3M7XG4gICAgczEgPSBwZWckcGFyc2V3cygpO1xuICAgIGlmIChzMSAhPT0gcGVnJEZBSUxFRCkge1xuICAgICAgaWYgKGlucHV0LmNoYXJDb2RlQXQocGVnJGN1cnJQb3MpID09PSAxMjUpIHtcbiAgICAgICAgczIgPSBwZWckYzM7XG4gICAgICAgIHBlZyRjdXJyUG9zKys7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBzMiA9IHBlZyRGQUlMRUQ7XG4gICAgICAgIGlmIChwZWckc2lsZW50RmFpbHMgPT09IDApIHsgcGVnJGZhaWwocGVnJGM0KTsgfVxuICAgICAgfVxuICAgICAgaWYgKHMyICE9PSBwZWckRkFJTEVEKSB7XG4gICAgICAgIHMzID0gcGVnJHBhcnNld3MoKTtcbiAgICAgICAgaWYgKHMzICE9PSBwZWckRkFJTEVEKSB7XG4gICAgICAgICAgczEgPSBbczEsIHMyLCBzM107XG4gICAgICAgICAgczAgPSBzMTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICBwZWckY3VyclBvcyA9IHMwO1xuICAgICAgICAgIHMwID0gcGVnJEZBSUxFRDtcbiAgICAgICAgfVxuICAgICAgfSBlbHNlIHtcbiAgICAgICAgcGVnJGN1cnJQb3MgPSBzMDtcbiAgICAgICAgczAgPSBwZWckRkFJTEVEO1xuICAgICAgfVxuICAgIH0gZWxzZSB7XG4gICAgICBwZWckY3VyclBvcyA9IHMwO1xuICAgICAgczAgPSBwZWckRkFJTEVEO1xuICAgIH1cblxuICAgIHJldHVybiBzMDtcbiAgfVxuXG4gIGZ1bmN0aW9uIHBlZyRwYXJzZW5hbWVfc2VwYXJhdG9yKCkge1xuICAgIHZhciBzMCwgczEsIHMyLCBzMztcblxuICAgIHMwID0gcGVnJGN1cnJQb3M7XG4gICAgczEgPSBwZWckcGFyc2V3cygpO1xuICAgIGlmIChzMSAhPT0gcGVnJEZBSUxFRCkge1xuICAgICAgaWYgKGlucHV0LmNoYXJDb2RlQXQocGVnJGN1cnJQb3MpID09PSA1OCkge1xuICAgICAgICBzMiA9IHBlZyRjNTtcbiAgICAgICAgcGVnJGN1cnJQb3MrKztcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHMyID0gcGVnJEZBSUxFRDtcbiAgICAgICAgaWYgKHBlZyRzaWxlbnRGYWlscyA9PT0gMCkgeyBwZWckZmFpbChwZWckYzYpOyB9XG4gICAgICB9XG4gICAgICBpZiAoczIgIT09IHBlZyRGQUlMRUQpIHtcbiAgICAgICAgczMgPSBwZWckcGFyc2V3cygpO1xuICAgICAgICBpZiAoczMgIT09IHBlZyRGQUlMRUQpIHtcbiAgICAgICAgICBzMSA9IFtzMSwgczIsIHMzXTtcbiAgICAgICAgICBzMCA9IHMxO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIHBlZyRjdXJyUG9zID0gczA7XG4gICAgICAgICAgczAgPSBwZWckRkFJTEVEO1xuICAgICAgICB9XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBwZWckY3VyclBvcyA9IHMwO1xuICAgICAgICBzMCA9IHBlZyRGQUlMRUQ7XG4gICAgICB9XG4gICAgfSBlbHNlIHtcbiAgICAgIHBlZyRjdXJyUG9zID0gczA7XG4gICAgICBzMCA9IHBlZyRGQUlMRUQ7XG4gICAgfVxuXG4gICAgcmV0dXJuIHMwO1xuICB9XG5cbiAgZnVuY3Rpb24gcGVnJHBhcnNldmFsdWVfc2VwYXJhdG9yKCkge1xuICAgIHZhciBzMCwgczEsIHMyLCBzMztcblxuICAgIHMwID0gcGVnJGN1cnJQb3M7XG4gICAgczEgPSBwZWckcGFyc2V3cygpO1xuICAgIGlmIChzMSAhPT0gcGVnJEZBSUxFRCkge1xuICAgICAgaWYgKGlucHV0LmNoYXJDb2RlQXQocGVnJGN1cnJQb3MpID09PSA0NCkge1xuICAgICAgICBzMiA9IHBlZyRjNztcbiAgICAgICAgcGVnJGN1cnJQb3MrKztcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHMyID0gcGVnJEZBSUxFRDtcbiAgICAgICAgaWYgKHBlZyRzaWxlbnRGYWlscyA9PT0gMCkgeyBwZWckZmFpbChwZWckYzgpOyB9XG4gICAgICB9XG4gICAgICBpZiAoczIgIT09IHBlZyRGQUlMRUQpIHtcbiAgICAgICAgczMgPSBwZWckcGFyc2V3cygpO1xuICAgICAgICBpZiAoczMgIT09IHBlZyRGQUlMRUQpIHtcbiAgICAgICAgICBzMSA9IFtzMSwgczIsIHMzXTtcbiAgICAgICAgICBzMCA9IHMxO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIHBlZyRjdXJyUG9zID0gczA7XG4gICAgICAgICAgczAgPSBwZWckRkFJTEVEO1xuICAgICAgICB9XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBwZWckY3VyclBvcyA9IHMwO1xuICAgICAgICBzMCA9IHBlZyRGQUlMRUQ7XG4gICAgICB9XG4gICAgfSBlbHNlIHtcbiAgICAgIHBlZyRjdXJyUG9zID0gczA7XG4gICAgICBzMCA9IHBlZyRGQUlMRUQ7XG4gICAgfVxuXG4gICAgcmV0dXJuIHMwO1xuICB9XG5cbiAgZnVuY3Rpb24gcGVnJHBhcnNld3MoKSB7XG4gICAgdmFyIHMwLCBzMTtcblxuICAgIHBlZyRzaWxlbnRGYWlscysrO1xuICAgIHMwID0gW107XG4gICAgaWYgKHBlZyRjMTAudGVzdChpbnB1dC5jaGFyQXQocGVnJGN1cnJQb3MpKSkge1xuICAgICAgczEgPSBpbnB1dC5jaGFyQXQocGVnJGN1cnJQb3MpO1xuICAgICAgcGVnJGN1cnJQb3MrKztcbiAgICB9IGVsc2Uge1xuICAgICAgczEgPSBwZWckRkFJTEVEO1xuICAgICAgaWYgKHBlZyRzaWxlbnRGYWlscyA9PT0gMCkgeyBwZWckZmFpbChwZWckYzExKTsgfVxuICAgIH1cbiAgICB3aGlsZSAoczEgIT09IHBlZyRGQUlMRUQpIHtcbiAgICAgIHMwLnB1c2goczEpO1xuICAgICAgaWYgKHBlZyRjMTAudGVzdChpbnB1dC5jaGFyQXQocGVnJGN1cnJQb3MpKSkge1xuICAgICAgICBzMSA9IGlucHV0LmNoYXJBdChwZWckY3VyclBvcyk7XG4gICAgICAgIHBlZyRjdXJyUG9zKys7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBzMSA9IHBlZyRGQUlMRUQ7XG4gICAgICAgIGlmIChwZWckc2lsZW50RmFpbHMgPT09IDApIHsgcGVnJGZhaWwocGVnJGMxMSk7IH1cbiAgICAgIH1cbiAgICB9XG4gICAgcGVnJHNpbGVudEZhaWxzLS07XG4gICAgaWYgKHMwID09PSBwZWckRkFJTEVEKSB7XG4gICAgICBzMSA9IHBlZyRGQUlMRUQ7XG4gICAgICBpZiAocGVnJHNpbGVudEZhaWxzID09PSAwKSB7IHBlZyRmYWlsKHBlZyRjOSk7IH1cbiAgICB9XG5cbiAgICByZXR1cm4gczA7XG4gIH1cblxuICBmdW5jdGlvbiBwZWckcGFyc2V2YWx1ZSgpIHtcbiAgICB2YXIgczA7XG5cbiAgICBzMCA9IHBlZyRwYXJzZWZhbHNlKCk7XG4gICAgaWYgKHMwID09PSBwZWckRkFJTEVEKSB7XG4gICAgICBzMCA9IHBlZyRwYXJzZXRydWUoKTtcbiAgICAgIGlmIChzMCA9PT0gcGVnJEZBSUxFRCkge1xuICAgICAgICBzMCA9IHBlZyRwYXJzZW9iamVjdCgpO1xuICAgICAgICBpZiAoczAgPT09IHBlZyRGQUlMRUQpIHtcbiAgICAgICAgICBzMCA9IHBlZyRwYXJzZWFycmF5KCk7XG4gICAgICAgICAgaWYgKHMwID09PSBwZWckRkFJTEVEKSB7XG4gICAgICAgICAgICBzMCA9IHBlZyRwYXJzZW51bWJlcigpO1xuICAgICAgICAgICAgaWYgKHMwID09PSBwZWckRkFJTEVEKSB7XG4gICAgICAgICAgICAgIHMwID0gcGVnJHBhcnNlc3RyaW5nKCk7XG4gICAgICAgICAgICAgIGlmIChzMCA9PT0gcGVnJEZBSUxFRCkge1xuICAgICAgICAgICAgICAgIHMwID0gcGVnJHBhcnNlZGF0ZSgpO1xuICAgICAgICAgICAgICAgIGlmIChzMCA9PT0gcGVnJEZBSUxFRCkge1xuICAgICAgICAgICAgICAgICAgczAgPSBwZWckcGFyc2V1bnF1b3RlZF9zdHJpbmcoKTtcbiAgICAgICAgICAgICAgICAgIGlmIChzMCA9PT0gcGVnJEZBSUxFRCkge1xuICAgICAgICAgICAgICAgICAgICBzMCA9IHBlZyRwYXJzZXJhdygpO1xuICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgfVxuICAgIH1cblxuICAgIHJldHVybiBzMDtcbiAgfVxuXG4gIGZ1bmN0aW9uIHBlZyRwYXJzZWZhbHNlKCkge1xuICAgIHZhciBzMCwgczE7XG5cbiAgICBzMCA9IHBlZyRjdXJyUG9zO1xuICAgIGlmIChpbnB1dC5zdWJzdHIocGVnJGN1cnJQb3MsIDUpID09PSBwZWckYzEyKSB7XG4gICAgICBzMSA9IHBlZyRjMTI7XG4gICAgICBwZWckY3VyclBvcyArPSA1O1xuICAgIH0gZWxzZSB7XG4gICAgICBzMSA9IHBlZyRGQUlMRUQ7XG4gICAgICBpZiAocGVnJHNpbGVudEZhaWxzID09PSAwKSB7IHBlZyRmYWlsKHBlZyRjMTMpOyB9XG4gICAgfVxuICAgIGlmIChzMSAhPT0gcGVnJEZBSUxFRCkge1xuICAgICAgcGVnJHNhdmVkUG9zID0gczA7XG4gICAgICBzMSA9IHBlZyRjMTQoKTtcbiAgICB9XG4gICAgczAgPSBzMTtcblxuICAgIHJldHVybiBzMDtcbiAgfVxuXG4gIGZ1bmN0aW9uIHBlZyRwYXJzZXRydWUoKSB7XG4gICAgdmFyIHMwLCBzMTtcblxuICAgIHMwID0gcGVnJGN1cnJQb3M7XG4gICAgaWYgKGlucHV0LnN1YnN0cihwZWckY3VyclBvcywgNCkgPT09IHBlZyRjMTUpIHtcbiAgICAgIHMxID0gcGVnJGMxNTtcbiAgICAgIHBlZyRjdXJyUG9zICs9IDQ7XG4gICAgfSBlbHNlIHtcbiAgICAgIHMxID0gcGVnJEZBSUxFRDtcbiAgICAgIGlmIChwZWckc2lsZW50RmFpbHMgPT09IDApIHsgcGVnJGZhaWwocGVnJGMxNik7IH1cbiAgICB9XG4gICAgaWYgKHMxICE9PSBwZWckRkFJTEVEKSB7XG4gICAgICBwZWckc2F2ZWRQb3MgPSBzMDtcbiAgICAgIHMxID0gcGVnJGMxNygpO1xuICAgIH1cbiAgICBzMCA9IHMxO1xuXG4gICAgcmV0dXJuIHMwO1xuICB9XG5cbiAgZnVuY3Rpb24gcGVnJHBhcnNlcmF3KCkge1xuICAgIHZhciBzMCwgczEsIHMyLCBzMztcblxuICAgIHMwID0gcGVnJGN1cnJQb3M7XG4gICAgczEgPSBwZWckcGFyc2V3cygpO1xuICAgIGlmIChzMSAhPT0gcGVnJEZBSUxFRCkge1xuICAgICAgczIgPSBbXTtcbiAgICAgIGlmIChpbnB1dC5sZW5ndGggPiBwZWckY3VyclBvcykge1xuICAgICAgICBzMyA9IGlucHV0LmNoYXJBdChwZWckY3VyclBvcyk7XG4gICAgICAgIHBlZyRjdXJyUG9zKys7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBzMyA9IHBlZyRGQUlMRUQ7XG4gICAgICAgIGlmIChwZWckc2lsZW50RmFpbHMgPT09IDApIHsgcGVnJGZhaWwocGVnJGMxOCk7IH1cbiAgICAgIH1cbiAgICAgIHdoaWxlIChzMyAhPT0gcGVnJEZBSUxFRCkge1xuICAgICAgICBzMi5wdXNoKHMzKTtcbiAgICAgICAgaWYgKGlucHV0Lmxlbmd0aCA+IHBlZyRjdXJyUG9zKSB7XG4gICAgICAgICAgczMgPSBpbnB1dC5jaGFyQXQocGVnJGN1cnJQb3MpO1xuICAgICAgICAgIHBlZyRjdXJyUG9zKys7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgczMgPSBwZWckRkFJTEVEO1xuICAgICAgICAgIGlmIChwZWckc2lsZW50RmFpbHMgPT09IDApIHsgcGVnJGZhaWwocGVnJGMxOCk7IH1cbiAgICAgICAgfVxuICAgICAgfVxuICAgICAgaWYgKHMyICE9PSBwZWckRkFJTEVEKSB7XG4gICAgICAgIHMzID0gcGVnJHBhcnNld3MoKTtcbiAgICAgICAgaWYgKHMzICE9PSBwZWckRkFJTEVEKSB7XG4gICAgICAgICAgcGVnJHNhdmVkUG9zID0gczA7XG4gICAgICAgICAgczEgPSBwZWckYzE5KHMyKTtcbiAgICAgICAgICBzMCA9IHMxO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIHBlZyRjdXJyUG9zID0gczA7XG4gICAgICAgICAgczAgPSBwZWckRkFJTEVEO1xuICAgICAgICB9XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBwZWckY3VyclBvcyA9IHMwO1xuICAgICAgICBzMCA9IHBlZyRGQUlMRUQ7XG4gICAgICB9XG4gICAgfSBlbHNlIHtcbiAgICAgIHBlZyRjdXJyUG9zID0gczA7XG4gICAgICBzMCA9IHBlZyRGQUlMRUQ7XG4gICAgfVxuXG4gICAgcmV0dXJuIHMwO1xuICB9XG5cbiAgZnVuY3Rpb24gcGVnJHBhcnNlb2JqZWN0KCkge1xuICAgIHZhciBzMCwgczEsIHMyLCBzMywgczQsIHM1LCBzNiwgczc7XG5cbiAgICBzMCA9IHBlZyRjdXJyUG9zO1xuICAgIHMxID0gcGVnJHBhcnNlYmVnaW5fb2JqZWN0KCk7XG4gICAgaWYgKHMxICE9PSBwZWckRkFJTEVEKSB7XG4gICAgICBzMiA9IHBlZyRjdXJyUG9zO1xuICAgICAgczMgPSBwZWckcGFyc2VtZW1iZXIoKTtcbiAgICAgIGlmIChzMyAhPT0gcGVnJEZBSUxFRCkge1xuICAgICAgICBzNCA9IFtdO1xuICAgICAgICBzNSA9IHBlZyRjdXJyUG9zO1xuICAgICAgICBzNiA9IHBlZyRwYXJzZXZhbHVlX3NlcGFyYXRvcigpO1xuICAgICAgICBpZiAoczYgIT09IHBlZyRGQUlMRUQpIHtcbiAgICAgICAgICBzNyA9IHBlZyRwYXJzZW1lbWJlcigpO1xuICAgICAgICAgIGlmIChzNyAhPT0gcGVnJEZBSUxFRCkge1xuICAgICAgICAgICAgcGVnJHNhdmVkUG9zID0gczU7XG4gICAgICAgICAgICBzNiA9IHBlZyRjMjAoczMsIHM3KTtcbiAgICAgICAgICAgIHM1ID0gczY7XG4gICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHBlZyRjdXJyUG9zID0gczU7XG4gICAgICAgICAgICBzNSA9IHBlZyRGQUlMRUQ7XG4gICAgICAgICAgfVxuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIHBlZyRjdXJyUG9zID0gczU7XG4gICAgICAgICAgczUgPSBwZWckRkFJTEVEO1xuICAgICAgICB9XG4gICAgICAgIHdoaWxlIChzNSAhPT0gcGVnJEZBSUxFRCkge1xuICAgICAgICAgIHM0LnB1c2goczUpO1xuICAgICAgICAgIHM1ID0gcGVnJGN1cnJQb3M7XG4gICAgICAgICAgczYgPSBwZWckcGFyc2V2YWx1ZV9zZXBhcmF0b3IoKTtcbiAgICAgICAgICBpZiAoczYgIT09IHBlZyRGQUlMRUQpIHtcbiAgICAgICAgICAgIHM3ID0gcGVnJHBhcnNlbWVtYmVyKCk7XG4gICAgICAgICAgICBpZiAoczcgIT09IHBlZyRGQUlMRUQpIHtcbiAgICAgICAgICAgICAgcGVnJHNhdmVkUG9zID0gczU7XG4gICAgICAgICAgICAgIHM2ID0gcGVnJGMyMChzMywgczcpO1xuICAgICAgICAgICAgICBzNSA9IHM2O1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgcGVnJGN1cnJQb3MgPSBzNTtcbiAgICAgICAgICAgICAgczUgPSBwZWckRkFJTEVEO1xuICAgICAgICAgICAgfVxuICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBwZWckY3VyclBvcyA9IHM1O1xuICAgICAgICAgICAgczUgPSBwZWckRkFJTEVEO1xuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICBpZiAoczQgIT09IHBlZyRGQUlMRUQpIHtcbiAgICAgICAgICBwZWckc2F2ZWRQb3MgPSBzMjtcbiAgICAgICAgICBzMyA9IHBlZyRjMjEoczMsIHM0KTtcbiAgICAgICAgICBzMiA9IHMzO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIHBlZyRjdXJyUG9zID0gczI7XG4gICAgICAgICAgczIgPSBwZWckRkFJTEVEO1xuICAgICAgICB9XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBwZWckY3VyclBvcyA9IHMyO1xuICAgICAgICBzMiA9IHBlZyRGQUlMRUQ7XG4gICAgICB9XG4gICAgICBpZiAoczIgPT09IHBlZyRGQUlMRUQpIHtcbiAgICAgICAgczIgPSBudWxsO1xuICAgICAgfVxuICAgICAgaWYgKHMyICE9PSBwZWckRkFJTEVEKSB7XG4gICAgICAgIHMzID0gcGVnJHBhcnNlZW5kX29iamVjdCgpO1xuICAgICAgICBpZiAoczMgIT09IHBlZyRGQUlMRUQpIHtcbiAgICAgICAgICBwZWckc2F2ZWRQb3MgPSBzMDtcbiAgICAgICAgICBzMSA9IHBlZyRjMjIoczIpO1xuICAgICAgICAgIHMwID0gczE7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgcGVnJGN1cnJQb3MgPSBzMDtcbiAgICAgICAgICBzMCA9IHBlZyRGQUlMRUQ7XG4gICAgICAgIH1cbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHBlZyRjdXJyUG9zID0gczA7XG4gICAgICAgIHMwID0gcGVnJEZBSUxFRDtcbiAgICAgIH1cbiAgICB9IGVsc2Uge1xuICAgICAgcGVnJGN1cnJQb3MgPSBzMDtcbiAgICAgIHMwID0gcGVnJEZBSUxFRDtcbiAgICB9XG5cbiAgICByZXR1cm4gczA7XG4gIH1cblxuICBmdW5jdGlvbiBwZWckcGFyc2VtZW1iZXIoKSB7XG4gICAgdmFyIHMwLCBzMSwgczIsIHMzO1xuXG4gICAgczAgPSBwZWckY3VyclBvcztcbiAgICBzMSA9IHBlZyRwYXJzZWtleSgpO1xuICAgIGlmIChzMSAhPT0gcGVnJEZBSUxFRCkge1xuICAgICAgczIgPSBwZWckcGFyc2VuYW1lX3NlcGFyYXRvcigpO1xuICAgICAgaWYgKHMyICE9PSBwZWckRkFJTEVEKSB7XG4gICAgICAgIHMzID0gcGVnJHBhcnNldmFsdWUoKTtcbiAgICAgICAgaWYgKHMzICE9PSBwZWckRkFJTEVEKSB7XG4gICAgICAgICAgcGVnJHNhdmVkUG9zID0gczA7XG4gICAgICAgICAgczEgPSBwZWckYzIzKHMxLCBzMyk7XG4gICAgICAgICAgczAgPSBzMTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICBwZWckY3VyclBvcyA9IHMwO1xuICAgICAgICAgIHMwID0gcGVnJEZBSUxFRDtcbiAgICAgICAgfVxuICAgICAgfSBlbHNlIHtcbiAgICAgICAgcGVnJGN1cnJQb3MgPSBzMDtcbiAgICAgICAgczAgPSBwZWckRkFJTEVEO1xuICAgICAgfVxuICAgIH0gZWxzZSB7XG4gICAgICBwZWckY3VyclBvcyA9IHMwO1xuICAgICAgczAgPSBwZWckRkFJTEVEO1xuICAgIH1cblxuICAgIHJldHVybiBzMDtcbiAgfVxuXG4gIGZ1bmN0aW9uIHBlZyRwYXJzZWtleSgpIHtcbiAgICB2YXIgczAsIHMxLCBzMjtcblxuICAgIHMwID0gcGVnJGN1cnJQb3M7XG4gICAgczEgPSBbXTtcbiAgICBpZiAocGVnJGMyNC50ZXN0KGlucHV0LmNoYXJBdChwZWckY3VyclBvcykpKSB7XG4gICAgICBzMiA9IGlucHV0LmNoYXJBdChwZWckY3VyclBvcyk7XG4gICAgICBwZWckY3VyclBvcysrO1xuICAgIH0gZWxzZSB7XG4gICAgICBzMiA9IHBlZyRGQUlMRUQ7XG4gICAgICBpZiAocGVnJHNpbGVudEZhaWxzID09PSAwKSB7IHBlZyRmYWlsKHBlZyRjMjUpOyB9XG4gICAgfVxuICAgIGlmIChzMiAhPT0gcGVnJEZBSUxFRCkge1xuICAgICAgd2hpbGUgKHMyICE9PSBwZWckRkFJTEVEKSB7XG4gICAgICAgIHMxLnB1c2goczIpO1xuICAgICAgICBpZiAocGVnJGMyNC50ZXN0KGlucHV0LmNoYXJBdChwZWckY3VyclBvcykpKSB7XG4gICAgICAgICAgczIgPSBpbnB1dC5jaGFyQXQocGVnJGN1cnJQb3MpO1xuICAgICAgICAgIHBlZyRjdXJyUG9zKys7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgczIgPSBwZWckRkFJTEVEO1xuICAgICAgICAgIGlmIChwZWckc2lsZW50RmFpbHMgPT09IDApIHsgcGVnJGZhaWwocGVnJGMyNSk7IH1cbiAgICAgICAgfVxuICAgICAgfVxuICAgIH0gZWxzZSB7XG4gICAgICBzMSA9IHBlZyRGQUlMRUQ7XG4gICAgfVxuICAgIGlmIChzMSAhPT0gcGVnJEZBSUxFRCkge1xuICAgICAgcGVnJHNhdmVkUG9zID0gczA7XG4gICAgICBzMSA9IHBlZyRjMjYoczEpO1xuICAgIH1cbiAgICBzMCA9IHMxO1xuXG4gICAgcmV0dXJuIHMwO1xuICB9XG5cbiAgZnVuY3Rpb24gcGVnJHBhcnNlYXJyYXkoKSB7XG4gICAgdmFyIHMwLCBzMSwgczIsIHMzLCBzNCwgczUsIHM2LCBzNztcblxuICAgIHMwID0gcGVnJGN1cnJQb3M7XG4gICAgczEgPSBwZWckcGFyc2ViZWdpbl9vYmplY3QoKTtcbiAgICBpZiAoczEgIT09IHBlZyRGQUlMRUQpIHtcbiAgICAgIHMyID0gcGVnJGN1cnJQb3M7XG4gICAgICBzMyA9IHBlZyRwYXJzZXZhbHVlKCk7XG4gICAgICBpZiAoczMgIT09IHBlZyRGQUlMRUQpIHtcbiAgICAgICAgczQgPSBbXTtcbiAgICAgICAgczUgPSBwZWckY3VyclBvcztcbiAgICAgICAgczYgPSBwZWckcGFyc2V2YWx1ZV9zZXBhcmF0b3IoKTtcbiAgICAgICAgaWYgKHM2ICE9PSBwZWckRkFJTEVEKSB7XG4gICAgICAgICAgczcgPSBwZWckcGFyc2V2YWx1ZSgpO1xuICAgICAgICAgIGlmIChzNyAhPT0gcGVnJEZBSUxFRCkge1xuICAgICAgICAgICAgcGVnJHNhdmVkUG9zID0gczU7XG4gICAgICAgICAgICBzNiA9IHBlZyRjMjcoczMsIHM3KTtcbiAgICAgICAgICAgIHM1ID0gczY7XG4gICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHBlZyRjdXJyUG9zID0gczU7XG4gICAgICAgICAgICBzNSA9IHBlZyRGQUlMRUQ7XG4gICAgICAgICAgfVxuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIHBlZyRjdXJyUG9zID0gczU7XG4gICAgICAgICAgczUgPSBwZWckRkFJTEVEO1xuICAgICAgICB9XG4gICAgICAgIHdoaWxlIChzNSAhPT0gcGVnJEZBSUxFRCkge1xuICAgICAgICAgIHM0LnB1c2goczUpO1xuICAgICAgICAgIHM1ID0gcGVnJGN1cnJQb3M7XG4gICAgICAgICAgczYgPSBwZWckcGFyc2V2YWx1ZV9zZXBhcmF0b3IoKTtcbiAgICAgICAgICBpZiAoczYgIT09IHBlZyRGQUlMRUQpIHtcbiAgICAgICAgICAgIHM3ID0gcGVnJHBhcnNldmFsdWUoKTtcbiAgICAgICAgICAgIGlmIChzNyAhPT0gcGVnJEZBSUxFRCkge1xuICAgICAgICAgICAgICBwZWckc2F2ZWRQb3MgPSBzNTtcbiAgICAgICAgICAgICAgczYgPSBwZWckYzI3KHMzLCBzNyk7XG4gICAgICAgICAgICAgIHM1ID0gczY7XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICBwZWckY3VyclBvcyA9IHM1O1xuICAgICAgICAgICAgICBzNSA9IHBlZyRGQUlMRUQ7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHBlZyRjdXJyUG9zID0gczU7XG4gICAgICAgICAgICBzNSA9IHBlZyRGQUlMRUQ7XG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIGlmIChzNCAhPT0gcGVnJEZBSUxFRCkge1xuICAgICAgICAgIHBlZyRzYXZlZFBvcyA9IHMyO1xuICAgICAgICAgIHMzID0gcGVnJGMyOChzMywgczQpO1xuICAgICAgICAgIHMyID0gczM7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgcGVnJGN1cnJQb3MgPSBzMjtcbiAgICAgICAgICBzMiA9IHBlZyRGQUlMRUQ7XG4gICAgICAgIH1cbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHBlZyRjdXJyUG9zID0gczI7XG4gICAgICAgIHMyID0gcGVnJEZBSUxFRDtcbiAgICAgIH1cbiAgICAgIGlmIChzMiA9PT0gcGVnJEZBSUxFRCkge1xuICAgICAgICBzMiA9IG51bGw7XG4gICAgICB9XG4gICAgICBpZiAoczIgIT09IHBlZyRGQUlMRUQpIHtcbiAgICAgICAgczMgPSBwZWckcGFyc2VlbmRfb2JqZWN0KCk7XG4gICAgICAgIGlmIChzMyAhPT0gcGVnJEZBSUxFRCkge1xuICAgICAgICAgIHBlZyRzYXZlZFBvcyA9IHMwO1xuICAgICAgICAgIHMxID0gcGVnJGMyOShzMik7XG4gICAgICAgICAgczAgPSBzMTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICBwZWckY3VyclBvcyA9IHMwO1xuICAgICAgICAgIHMwID0gcGVnJEZBSUxFRDtcbiAgICAgICAgfVxuICAgICAgfSBlbHNlIHtcbiAgICAgICAgcGVnJGN1cnJQb3MgPSBzMDtcbiAgICAgICAgczAgPSBwZWckRkFJTEVEO1xuICAgICAgfVxuICAgIH0gZWxzZSB7XG4gICAgICBwZWckY3VyclBvcyA9IHMwO1xuICAgICAgczAgPSBwZWckRkFJTEVEO1xuICAgIH1cblxuICAgIHJldHVybiBzMDtcbiAgfVxuXG4gIGZ1bmN0aW9uIHBlZyRwYXJzZW51bWJlcigpIHtcbiAgICB2YXIgczAsIHMxLCBzMiwgczMsIHM0O1xuXG4gICAgcGVnJHNpbGVudEZhaWxzKys7XG4gICAgczAgPSBwZWckY3VyclBvcztcbiAgICBzMSA9IHBlZyRwYXJzZW1pbnVzKCk7XG4gICAgaWYgKHMxID09PSBwZWckRkFJTEVEKSB7XG4gICAgICBzMSA9IG51bGw7XG4gICAgfVxuICAgIGlmIChzMSAhPT0gcGVnJEZBSUxFRCkge1xuICAgICAgczIgPSBwZWckcGFyc2VpbnQoKTtcbiAgICAgIGlmIChzMiAhPT0gcGVnJEZBSUxFRCkge1xuICAgICAgICBzMyA9IHBlZyRwYXJzZWZyYWMoKTtcbiAgICAgICAgaWYgKHMzID09PSBwZWckRkFJTEVEKSB7XG4gICAgICAgICAgczMgPSBudWxsO1xuICAgICAgICB9XG4gICAgICAgIGlmIChzMyAhPT0gcGVnJEZBSUxFRCkge1xuICAgICAgICAgIHM0ID0gcGVnJHBhcnNlZXhwKCk7XG4gICAgICAgICAgaWYgKHM0ID09PSBwZWckRkFJTEVEKSB7XG4gICAgICAgICAgICBzNCA9IG51bGw7XG4gICAgICAgICAgfVxuICAgICAgICAgIGlmIChzNCAhPT0gcGVnJEZBSUxFRCkge1xuICAgICAgICAgICAgcGVnJHNhdmVkUG9zID0gczA7XG4gICAgICAgICAgICBzMSA9IHBlZyRjMzEoKTtcbiAgICAgICAgICAgIHMwID0gczE7XG4gICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHBlZyRjdXJyUG9zID0gczA7XG4gICAgICAgICAgICBzMCA9IHBlZyRGQUlMRUQ7XG4gICAgICAgICAgfVxuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIHBlZyRjdXJyUG9zID0gczA7XG4gICAgICAgICAgczAgPSBwZWckRkFJTEVEO1xuICAgICAgICB9XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBwZWckY3VyclBvcyA9IHMwO1xuICAgICAgICBzMCA9IHBlZyRGQUlMRUQ7XG4gICAgICB9XG4gICAgfSBlbHNlIHtcbiAgICAgIHBlZyRjdXJyUG9zID0gczA7XG4gICAgICBzMCA9IHBlZyRGQUlMRUQ7XG4gICAgfVxuICAgIHBlZyRzaWxlbnRGYWlscy0tO1xuICAgIGlmIChzMCA9PT0gcGVnJEZBSUxFRCkge1xuICAgICAgczEgPSBwZWckRkFJTEVEO1xuICAgICAgaWYgKHBlZyRzaWxlbnRGYWlscyA9PT0gMCkgeyBwZWckZmFpbChwZWckYzMwKTsgfVxuICAgIH1cblxuICAgIHJldHVybiBzMDtcbiAgfVxuXG4gIGZ1bmN0aW9uIHBlZyRwYXJzZWRlY2ltYWxfcG9pbnQoKSB7XG4gICAgdmFyIHMwO1xuXG4gICAgaWYgKGlucHV0LmNoYXJDb2RlQXQocGVnJGN1cnJQb3MpID09PSA0Nikge1xuICAgICAgczAgPSBwZWckYzMyO1xuICAgICAgcGVnJGN1cnJQb3MrKztcbiAgICB9IGVsc2Uge1xuICAgICAgczAgPSBwZWckRkFJTEVEO1xuICAgICAgaWYgKHBlZyRzaWxlbnRGYWlscyA9PT0gMCkgeyBwZWckZmFpbChwZWckYzMzKTsgfVxuICAgIH1cblxuICAgIHJldHVybiBzMDtcbiAgfVxuXG4gIGZ1bmN0aW9uIHBlZyRwYXJzZWRpZ2l0MV85KCkge1xuICAgIHZhciBzMDtcblxuICAgIGlmIChwZWckYzM0LnRlc3QoaW5wdXQuY2hhckF0KHBlZyRjdXJyUG9zKSkpIHtcbiAgICAgIHMwID0gaW5wdXQuY2hhckF0KHBlZyRjdXJyUG9zKTtcbiAgICAgIHBlZyRjdXJyUG9zKys7XG4gICAgfSBlbHNlIHtcbiAgICAgIHMwID0gcGVnJEZBSUxFRDtcbiAgICAgIGlmIChwZWckc2lsZW50RmFpbHMgPT09IDApIHsgcGVnJGZhaWwocGVnJGMzNSk7IH1cbiAgICB9XG5cbiAgICByZXR1cm4gczA7XG4gIH1cblxuICBmdW5jdGlvbiBwZWckcGFyc2VlKCkge1xuICAgIHZhciBzMDtcblxuICAgIGlmIChwZWckYzM2LnRlc3QoaW5wdXQuY2hhckF0KHBlZyRjdXJyUG9zKSkpIHtcbiAgICAgIHMwID0gaW5wdXQuY2hhckF0KHBlZyRjdXJyUG9zKTtcbiAgICAgIHBlZyRjdXJyUG9zKys7XG4gICAgfSBlbHNlIHtcbiAgICAgIHMwID0gcGVnJEZBSUxFRDtcbiAgICAgIGlmIChwZWckc2lsZW50RmFpbHMgPT09IDApIHsgcGVnJGZhaWwocGVnJGMzNyk7IH1cbiAgICB9XG5cbiAgICByZXR1cm4gczA7XG4gIH1cblxuICBmdW5jdGlvbiBwZWckcGFyc2VleHAoKSB7XG4gICAgdmFyIHMwLCBzMSwgczIsIHMzLCBzNDtcblxuICAgIHMwID0gcGVnJGN1cnJQb3M7XG4gICAgczEgPSBwZWckcGFyc2VlKCk7XG4gICAgaWYgKHMxICE9PSBwZWckRkFJTEVEKSB7XG4gICAgICBzMiA9IHBlZyRwYXJzZW1pbnVzKCk7XG4gICAgICBpZiAoczIgPT09IHBlZyRGQUlMRUQpIHtcbiAgICAgICAgczIgPSBwZWckcGFyc2VwbHVzKCk7XG4gICAgICB9XG4gICAgICBpZiAoczIgPT09IHBlZyRGQUlMRUQpIHtcbiAgICAgICAgczIgPSBudWxsO1xuICAgICAgfVxuICAgICAgaWYgKHMyICE9PSBwZWckRkFJTEVEKSB7XG4gICAgICAgIHMzID0gW107XG4gICAgICAgIHM0ID0gcGVnJHBhcnNlRElHSVQoKTtcbiAgICAgICAgaWYgKHM0ICE9PSBwZWckRkFJTEVEKSB7XG4gICAgICAgICAgd2hpbGUgKHM0ICE9PSBwZWckRkFJTEVEKSB7XG4gICAgICAgICAgICBzMy5wdXNoKHM0KTtcbiAgICAgICAgICAgIHM0ID0gcGVnJHBhcnNlRElHSVQoKTtcbiAgICAgICAgICB9XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgczMgPSBwZWckRkFJTEVEO1xuICAgICAgICB9XG4gICAgICAgIGlmIChzMyAhPT0gcGVnJEZBSUxFRCkge1xuICAgICAgICAgIHMxID0gW3MxLCBzMiwgczNdO1xuICAgICAgICAgIHMwID0gczE7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgcGVnJGN1cnJQb3MgPSBzMDtcbiAgICAgICAgICBzMCA9IHBlZyRGQUlMRUQ7XG4gICAgICAgIH1cbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHBlZyRjdXJyUG9zID0gczA7XG4gICAgICAgIHMwID0gcGVnJEZBSUxFRDtcbiAgICAgIH1cbiAgICB9IGVsc2Uge1xuICAgICAgcGVnJGN1cnJQb3MgPSBzMDtcbiAgICAgIHMwID0gcGVnJEZBSUxFRDtcbiAgICB9XG5cbiAgICByZXR1cm4gczA7XG4gIH1cblxuICBmdW5jdGlvbiBwZWckcGFyc2VmcmFjKCkge1xuICAgIHZhciBzMCwgczEsIHMyLCBzMztcblxuICAgIHMwID0gcGVnJGN1cnJQb3M7XG4gICAgczEgPSBwZWckcGFyc2VkZWNpbWFsX3BvaW50KCk7XG4gICAgaWYgKHMxICE9PSBwZWckRkFJTEVEKSB7XG4gICAgICBzMiA9IFtdO1xuICAgICAgczMgPSBwZWckcGFyc2VESUdJVCgpO1xuICAgICAgaWYgKHMzICE9PSBwZWckRkFJTEVEKSB7XG4gICAgICAgIHdoaWxlIChzMyAhPT0gcGVnJEZBSUxFRCkge1xuICAgICAgICAgIHMyLnB1c2goczMpO1xuICAgICAgICAgIHMzID0gcGVnJHBhcnNlRElHSVQoKTtcbiAgICAgICAgfVxuICAgICAgfSBlbHNlIHtcbiAgICAgICAgczIgPSBwZWckRkFJTEVEO1xuICAgICAgfVxuICAgICAgaWYgKHMyICE9PSBwZWckRkFJTEVEKSB7XG4gICAgICAgIHMxID0gW3MxLCBzMl07XG4gICAgICAgIHMwID0gczE7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBwZWckY3VyclBvcyA9IHMwO1xuICAgICAgICBzMCA9IHBlZyRGQUlMRUQ7XG4gICAgICB9XG4gICAgfSBlbHNlIHtcbiAgICAgIHBlZyRjdXJyUG9zID0gczA7XG4gICAgICBzMCA9IHBlZyRGQUlMRUQ7XG4gICAgfVxuXG4gICAgcmV0dXJuIHMwO1xuICB9XG5cbiAgZnVuY3Rpb24gcGVnJHBhcnNlaW50KCkge1xuICAgIHZhciBzMCwgczEsIHMyLCBzMztcblxuICAgIHMwID0gcGVnJHBhcnNlemVybygpO1xuICAgIGlmIChzMCA9PT0gcGVnJEZBSUxFRCkge1xuICAgICAgczAgPSBwZWckY3VyclBvcztcbiAgICAgIHMxID0gcGVnJHBhcnNlZGlnaXQxXzkoKTtcbiAgICAgIGlmIChzMSAhPT0gcGVnJEZBSUxFRCkge1xuICAgICAgICBzMiA9IFtdO1xuICAgICAgICBzMyA9IHBlZyRwYXJzZURJR0lUKCk7XG4gICAgICAgIHdoaWxlIChzMyAhPT0gcGVnJEZBSUxFRCkge1xuICAgICAgICAgIHMyLnB1c2goczMpO1xuICAgICAgICAgIHMzID0gcGVnJHBhcnNlRElHSVQoKTtcbiAgICAgICAgfVxuICAgICAgICBpZiAoczIgIT09IHBlZyRGQUlMRUQpIHtcbiAgICAgICAgICBzMSA9IFtzMSwgczJdO1xuICAgICAgICAgIHMwID0gczE7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgcGVnJGN1cnJQb3MgPSBzMDtcbiAgICAgICAgICBzMCA9IHBlZyRGQUlMRUQ7XG4gICAgICAgIH1cbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHBlZyRjdXJyUG9zID0gczA7XG4gICAgICAgIHMwID0gcGVnJEZBSUxFRDtcbiAgICAgIH1cbiAgICB9XG5cbiAgICByZXR1cm4gczA7XG4gIH1cblxuICBmdW5jdGlvbiBwZWckcGFyc2VtaW51cygpIHtcbiAgICB2YXIgczA7XG5cbiAgICBpZiAoaW5wdXQuY2hhckNvZGVBdChwZWckY3VyclBvcykgPT09IDQ1KSB7XG4gICAgICBzMCA9IHBlZyRjMzg7XG4gICAgICBwZWckY3VyclBvcysrO1xuICAgIH0gZWxzZSB7XG4gICAgICBzMCA9IHBlZyRGQUlMRUQ7XG4gICAgICBpZiAocGVnJHNpbGVudEZhaWxzID09PSAwKSB7IHBlZyRmYWlsKHBlZyRjMzkpOyB9XG4gICAgfVxuXG4gICAgcmV0dXJuIHMwO1xuICB9XG5cbiAgZnVuY3Rpb24gcGVnJHBhcnNlcGx1cygpIHtcbiAgICB2YXIgczA7XG5cbiAgICBpZiAoaW5wdXQuY2hhckNvZGVBdChwZWckY3VyclBvcykgPT09IDQzKSB7XG4gICAgICBzMCA9IHBlZyRjNDA7XG4gICAgICBwZWckY3VyclBvcysrO1xuICAgIH0gZWxzZSB7XG4gICAgICBzMCA9IHBlZyRGQUlMRUQ7XG4gICAgICBpZiAocGVnJHNpbGVudEZhaWxzID09PSAwKSB7IHBlZyRmYWlsKHBlZyRjNDEpOyB9XG4gICAgfVxuXG4gICAgcmV0dXJuIHMwO1xuICB9XG5cbiAgZnVuY3Rpb24gcGVnJHBhcnNlemVybygpIHtcbiAgICB2YXIgczA7XG5cbiAgICBpZiAoaW5wdXQuY2hhckNvZGVBdChwZWckY3VyclBvcykgPT09IDQ4KSB7XG4gICAgICBzMCA9IHBlZyRjNDI7XG4gICAgICBwZWckY3VyclBvcysrO1xuICAgIH0gZWxzZSB7XG4gICAgICBzMCA9IHBlZyRGQUlMRUQ7XG4gICAgICBpZiAocGVnJHNpbGVudEZhaWxzID09PSAwKSB7IHBlZyRmYWlsKHBlZyRjNDMpOyB9XG4gICAgfVxuXG4gICAgcmV0dXJuIHMwO1xuICB9XG5cbiAgZnVuY3Rpb24gcGVnJHBhcnNlc3RyaW5nKCkge1xuICAgIHZhciBzMCwgczEsIHMyLCBzMztcblxuICAgIHBlZyRzaWxlbnRGYWlscysrO1xuICAgIHMwID0gcGVnJGN1cnJQb3M7XG4gICAgczEgPSBwZWckcGFyc2VxdW90YXRpb25fbWFyaygpO1xuICAgIGlmIChzMSAhPT0gcGVnJEZBSUxFRCkge1xuICAgICAgczIgPSBbXTtcbiAgICAgIHMzID0gcGVnJHBhcnNlY2hhcigpO1xuICAgICAgd2hpbGUgKHMzICE9PSBwZWckRkFJTEVEKSB7XG4gICAgICAgIHMyLnB1c2goczMpO1xuICAgICAgICBzMyA9IHBlZyRwYXJzZWNoYXIoKTtcbiAgICAgIH1cbiAgICAgIGlmIChzMiAhPT0gcGVnJEZBSUxFRCkge1xuICAgICAgICBzMyA9IHBlZyRwYXJzZXF1b3RhdGlvbl9tYXJrKCk7XG4gICAgICAgIGlmIChzMyAhPT0gcGVnJEZBSUxFRCkge1xuICAgICAgICAgIHBlZyRzYXZlZFBvcyA9IHMwO1xuICAgICAgICAgIHMxID0gcGVnJGM0NShzMik7XG4gICAgICAgICAgczAgPSBzMTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICBwZWckY3VyclBvcyA9IHMwO1xuICAgICAgICAgIHMwID0gcGVnJEZBSUxFRDtcbiAgICAgICAgfVxuICAgICAgfSBlbHNlIHtcbiAgICAgICAgcGVnJGN1cnJQb3MgPSBzMDtcbiAgICAgICAgczAgPSBwZWckRkFJTEVEO1xuICAgICAgfVxuICAgIH0gZWxzZSB7XG4gICAgICBwZWckY3VyclBvcyA9IHMwO1xuICAgICAgczAgPSBwZWckRkFJTEVEO1xuICAgIH1cbiAgICBwZWckc2lsZW50RmFpbHMtLTtcbiAgICBpZiAoczAgPT09IHBlZyRGQUlMRUQpIHtcbiAgICAgIHMxID0gcGVnJEZBSUxFRDtcbiAgICAgIGlmIChwZWckc2lsZW50RmFpbHMgPT09IDApIHsgcGVnJGZhaWwocGVnJGM0NCk7IH1cbiAgICB9XG5cbiAgICByZXR1cm4gczA7XG4gIH1cblxuICBmdW5jdGlvbiBwZWckcGFyc2VjaGFyKCkge1xuICAgIHZhciBzMCwgczEsIHMyLCBzMywgczQsIHM1LCBzNiwgczcsIHM4LCBzOTtcblxuICAgIHMwID0gcGVnJHBhcnNldW5lc2NhcGVkKCk7XG4gICAgaWYgKHMwID09PSBwZWckRkFJTEVEKSB7XG4gICAgICBpZiAoaW5wdXQuY2hhckNvZGVBdChwZWckY3VyclBvcykgPT09IDEwKSB7XG4gICAgICAgIHMwID0gcGVnJGM0NjtcbiAgICAgICAgcGVnJGN1cnJQb3MrKztcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHMwID0gcGVnJEZBSUxFRDtcbiAgICAgICAgaWYgKHBlZyRzaWxlbnRGYWlscyA9PT0gMCkgeyBwZWckZmFpbChwZWckYzQ3KTsgfVxuICAgICAgfVxuICAgICAgaWYgKHMwID09PSBwZWckRkFJTEVEKSB7XG4gICAgICAgIGlmIChpbnB1dC5jaGFyQ29kZUF0KHBlZyRjdXJyUG9zKSA9PT0gOSkge1xuICAgICAgICAgIHMwID0gcGVnJGM0ODtcbiAgICAgICAgICBwZWckY3VyclBvcysrO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIHMwID0gcGVnJEZBSUxFRDtcbiAgICAgICAgICBpZiAocGVnJHNpbGVudEZhaWxzID09PSAwKSB7IHBlZyRmYWlsKHBlZyRjNDkpOyB9XG4gICAgICAgIH1cbiAgICAgICAgaWYgKHMwID09PSBwZWckRkFJTEVEKSB7XG4gICAgICAgICAgczAgPSBwZWckY3VyclBvcztcbiAgICAgICAgICBzMSA9IHBlZyRwYXJzZWVzY2FwZSgpO1xuICAgICAgICAgIGlmIChzMSAhPT0gcGVnJEZBSUxFRCkge1xuICAgICAgICAgICAgaWYgKGlucHV0LmNoYXJDb2RlQXQocGVnJGN1cnJQb3MpID09PSAzNCkge1xuICAgICAgICAgICAgICBzMiA9IHBlZyRjNTA7XG4gICAgICAgICAgICAgIHBlZyRjdXJyUG9zKys7XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICBzMiA9IHBlZyRGQUlMRUQ7XG4gICAgICAgICAgICAgIGlmIChwZWckc2lsZW50RmFpbHMgPT09IDApIHsgcGVnJGZhaWwocGVnJGM1MSk7IH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGlmIChzMiA9PT0gcGVnJEZBSUxFRCkge1xuICAgICAgICAgICAgICBpZiAoaW5wdXQuY2hhckNvZGVBdChwZWckY3VyclBvcykgPT09IDkyKSB7XG4gICAgICAgICAgICAgICAgczIgPSBwZWckYzUyO1xuICAgICAgICAgICAgICAgIHBlZyRjdXJyUG9zKys7XG4gICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgczIgPSBwZWckRkFJTEVEO1xuICAgICAgICAgICAgICAgIGlmIChwZWckc2lsZW50RmFpbHMgPT09IDApIHsgcGVnJGZhaWwocGVnJGM1Myk7IH1cbiAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICBpZiAoczIgPT09IHBlZyRGQUlMRUQpIHtcbiAgICAgICAgICAgICAgICBpZiAoaW5wdXQuY2hhckNvZGVBdChwZWckY3VyclBvcykgPT09IDQ3KSB7XG4gICAgICAgICAgICAgICAgICBzMiA9IHBlZyRjNTQ7XG4gICAgICAgICAgICAgICAgICBwZWckY3VyclBvcysrO1xuICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICBzMiA9IHBlZyRGQUlMRUQ7XG4gICAgICAgICAgICAgICAgICBpZiAocGVnJHNpbGVudEZhaWxzID09PSAwKSB7IHBlZyRmYWlsKHBlZyRjNTUpOyB9XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGlmIChzMiA9PT0gcGVnJEZBSUxFRCkge1xuICAgICAgICAgICAgICAgICAgczIgPSBwZWckY3VyclBvcztcbiAgICAgICAgICAgICAgICAgIGlmIChpbnB1dC5jaGFyQ29kZUF0KHBlZyRjdXJyUG9zKSA9PT0gOTgpIHtcbiAgICAgICAgICAgICAgICAgICAgczMgPSBwZWckYzU2O1xuICAgICAgICAgICAgICAgICAgICBwZWckY3VyclBvcysrO1xuICAgICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgczMgPSBwZWckRkFJTEVEO1xuICAgICAgICAgICAgICAgICAgICBpZiAocGVnJHNpbGVudEZhaWxzID09PSAwKSB7IHBlZyRmYWlsKHBlZyRjNTcpOyB9XG4gICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICBpZiAoczMgIT09IHBlZyRGQUlMRUQpIHtcbiAgICAgICAgICAgICAgICAgICAgcGVnJHNhdmVkUG9zID0gczI7XG4gICAgICAgICAgICAgICAgICAgIHMzID0gcGVnJGM1OCgpO1xuICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgczIgPSBzMztcbiAgICAgICAgICAgICAgICAgIGlmIChzMiA9PT0gcGVnJEZBSUxFRCkge1xuICAgICAgICAgICAgICAgICAgICBzMiA9IHBlZyRjdXJyUG9zO1xuICAgICAgICAgICAgICAgICAgICBpZiAoaW5wdXQuY2hhckNvZGVBdChwZWckY3VyclBvcykgPT09IDEwMikge1xuICAgICAgICAgICAgICAgICAgICAgIHMzID0gcGVnJGM1OTtcbiAgICAgICAgICAgICAgICAgICAgICBwZWckY3VyclBvcysrO1xuICAgICAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICAgIHMzID0gcGVnJEZBSUxFRDtcbiAgICAgICAgICAgICAgICAgICAgICBpZiAocGVnJHNpbGVudEZhaWxzID09PSAwKSB7IHBlZyRmYWlsKHBlZyRjNjApOyB9XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgaWYgKHMzICE9PSBwZWckRkFJTEVEKSB7XG4gICAgICAgICAgICAgICAgICAgICAgcGVnJHNhdmVkUG9zID0gczI7XG4gICAgICAgICAgICAgICAgICAgICAgczMgPSBwZWckYzYxKCk7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgczIgPSBzMztcbiAgICAgICAgICAgICAgICAgICAgaWYgKHMyID09PSBwZWckRkFJTEVEKSB7XG4gICAgICAgICAgICAgICAgICAgICAgczIgPSBwZWckY3VyclBvcztcbiAgICAgICAgICAgICAgICAgICAgICBpZiAoaW5wdXQuY2hhckNvZGVBdChwZWckY3VyclBvcykgPT09IDExMCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgczMgPSBwZWckYzYyO1xuICAgICAgICAgICAgICAgICAgICAgICAgcGVnJGN1cnJQb3MrKztcbiAgICAgICAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICAgICAgczMgPSBwZWckRkFJTEVEO1xuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKHBlZyRzaWxlbnRGYWlscyA9PT0gMCkgeyBwZWckZmFpbChwZWckYzYzKTsgfVxuICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICBpZiAoczMgIT09IHBlZyRGQUlMRUQpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHBlZyRzYXZlZFBvcyA9IHMyO1xuICAgICAgICAgICAgICAgICAgICAgICAgczMgPSBwZWckYzY0KCk7XG4gICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgIHMyID0gczM7XG4gICAgICAgICAgICAgICAgICAgICAgaWYgKHMyID09PSBwZWckRkFJTEVEKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBzMiA9IHBlZyRjdXJyUG9zO1xuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKGlucHV0LmNoYXJDb2RlQXQocGVnJGN1cnJQb3MpID09PSAxMTQpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgczMgPSBwZWckYzY1O1xuICAgICAgICAgICAgICAgICAgICAgICAgICBwZWckY3VyclBvcysrO1xuICAgICAgICAgICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgczMgPSBwZWckRkFJTEVEO1xuICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAocGVnJHNpbGVudEZhaWxzID09PSAwKSB7IHBlZyRmYWlsKHBlZyRjNjYpOyB9XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAoczMgIT09IHBlZyRGQUlMRUQpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgcGVnJHNhdmVkUG9zID0gczI7XG4gICAgICAgICAgICAgICAgICAgICAgICAgIHMzID0gcGVnJGM2NygpO1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgczIgPSBzMztcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmIChzMiA9PT0gcGVnJEZBSUxFRCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICBzMiA9IHBlZyRjdXJyUG9zO1xuICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAoaW5wdXQuY2hhckNvZGVBdChwZWckY3VyclBvcykgPT09IDExNikge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHMzID0gcGVnJGM2ODtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBwZWckY3VyclBvcysrO1xuICAgICAgICAgICAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHMzID0gcGVnJEZBSUxFRDtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAocGVnJHNpbGVudEZhaWxzID09PSAwKSB7IHBlZyRmYWlsKHBlZyRjNjkpOyB9XG4gICAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKHMzICE9PSBwZWckRkFJTEVEKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgcGVnJHNhdmVkUG9zID0gczI7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgczMgPSBwZWckYzcwKCk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgczIgPSBzMztcbiAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKHMyID09PSBwZWckRkFJTEVEKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgczIgPSBwZWckY3VyclBvcztcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAoaW5wdXQuY2hhckNvZGVBdChwZWckY3VyclBvcykgPT09IDExNykge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgczMgPSBwZWckYzcxO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgcGVnJGN1cnJQb3MrKztcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgczMgPSBwZWckRkFJTEVEO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKHBlZyRzaWxlbnRGYWlscyA9PT0gMCkgeyBwZWckZmFpbChwZWckYzcyKTsgfVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAoczMgIT09IHBlZyRGQUlMRUQpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHM0ID0gcGVnJGN1cnJQb3M7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICBzNSA9IHBlZyRjdXJyUG9zO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgczYgPSBwZWckcGFyc2VIRVhESUcoKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmIChzNiAhPT0gcGVnJEZBSUxFRCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBzNyA9IHBlZyRwYXJzZUhFWERJRygpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAoczcgIT09IHBlZyRGQUlMRUQpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBzOCA9IHBlZyRwYXJzZUhFWERJRygpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmIChzOCAhPT0gcGVnJEZBSUxFRCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgczkgPSBwZWckcGFyc2VIRVhESUcoKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmIChzOSAhPT0gcGVnJEZBSUxFRCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBzNiA9IFtzNiwgczcsIHM4LCBzOV07XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHM1ID0gczY7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBwZWckY3VyclBvcyA9IHM1O1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBzNSA9IHBlZyRGQUlMRUQ7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHBlZyRjdXJyUG9zID0gczU7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBzNSA9IHBlZyRGQUlMRUQ7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHBlZyRjdXJyUG9zID0gczU7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgczUgPSBwZWckRkFJTEVEO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBwZWckY3VyclBvcyA9IHM1O1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBzNSA9IHBlZyRGQUlMRUQ7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAoczUgIT09IHBlZyRGQUlMRUQpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgczQgPSBpbnB1dC5zdWJzdHJpbmcoczQsIHBlZyRjdXJyUG9zKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHM0ID0gczU7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAoczQgIT09IHBlZyRGQUlMRUQpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgcGVnJHNhdmVkUG9zID0gczI7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHMzID0gcGVnJGM3MyhzNCk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHMyID0gczM7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBwZWckY3VyclBvcyA9IHMyO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBzMiA9IHBlZyRGQUlMRUQ7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHBlZyRjdXJyUG9zID0gczI7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICBzMiA9IHBlZyRGQUlMRUQ7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBpZiAoczIgIT09IHBlZyRGQUlMRUQpIHtcbiAgICAgICAgICAgICAgcGVnJHNhdmVkUG9zID0gczA7XG4gICAgICAgICAgICAgIHMxID0gcGVnJGM3NChzMik7XG4gICAgICAgICAgICAgIHMwID0gczE7XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICBwZWckY3VyclBvcyA9IHMwO1xuICAgICAgICAgICAgICBzMCA9IHBlZyRGQUlMRUQ7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHBlZyRjdXJyUG9zID0gczA7XG4gICAgICAgICAgICBzMCA9IHBlZyRGQUlMRUQ7XG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICB9XG4gICAgfVxuXG4gICAgcmV0dXJuIHMwO1xuICB9XG5cbiAgZnVuY3Rpb24gcGVnJHBhcnNlZXNjYXBlKCkge1xuICAgIHZhciBzMDtcblxuICAgIGlmIChpbnB1dC5jaGFyQ29kZUF0KHBlZyRjdXJyUG9zKSA9PT0gOTIpIHtcbiAgICAgIHMwID0gcGVnJGM1MjtcbiAgICAgIHBlZyRjdXJyUG9zKys7XG4gICAgfSBlbHNlIHtcbiAgICAgIHMwID0gcGVnJEZBSUxFRDtcbiAgICAgIGlmIChwZWckc2lsZW50RmFpbHMgPT09IDApIHsgcGVnJGZhaWwocGVnJGM1Myk7IH1cbiAgICB9XG5cbiAgICByZXR1cm4gczA7XG4gIH1cblxuICBmdW5jdGlvbiBwZWckcGFyc2VxdW90YXRpb25fbWFyaygpIHtcbiAgICB2YXIgczA7XG5cbiAgICBpZiAoaW5wdXQuY2hhckNvZGVBdChwZWckY3VyclBvcykgPT09IDM0KSB7XG4gICAgICBzMCA9IHBlZyRjNTA7XG4gICAgICBwZWckY3VyclBvcysrO1xuICAgIH0gZWxzZSB7XG4gICAgICBzMCA9IHBlZyRGQUlMRUQ7XG4gICAgICBpZiAocGVnJHNpbGVudEZhaWxzID09PSAwKSB7IHBlZyRmYWlsKHBlZyRjNTEpOyB9XG4gICAgfVxuXG4gICAgcmV0dXJuIHMwO1xuICB9XG5cbiAgZnVuY3Rpb24gcGVnJHBhcnNldW5lc2NhcGVkKCkge1xuICAgIHZhciBzMDtcblxuICAgIGlmIChwZWckYzc1LnRlc3QoaW5wdXQuY2hhckF0KHBlZyRjdXJyUG9zKSkpIHtcbiAgICAgIHMwID0gaW5wdXQuY2hhckF0KHBlZyRjdXJyUG9zKTtcbiAgICAgIHBlZyRjdXJyUG9zKys7XG4gICAgfSBlbHNlIHtcbiAgICAgIHMwID0gcGVnJEZBSUxFRDtcbiAgICAgIGlmIChwZWckc2lsZW50RmFpbHMgPT09IDApIHsgcGVnJGZhaWwocGVnJGM3Nik7IH1cbiAgICB9XG5cbiAgICByZXR1cm4gczA7XG4gIH1cblxuICBmdW5jdGlvbiBwZWckcGFyc2V1bnF1b3RlZF9zdHJpbmcoKSB7XG4gICAgdmFyIHMwLCBzMSwgczIsIHMzO1xuXG4gICAgcGVnJHNpbGVudEZhaWxzKys7XG4gICAgczAgPSBwZWckY3VyclBvcztcbiAgICBzMSA9IHBlZyRwYXJzZWZpcnN0X3VucXVvdGVkX2NoYXIoKTtcbiAgICBpZiAoczEgIT09IHBlZyRGQUlMRUQpIHtcbiAgICAgIHMyID0gW107XG4gICAgICBzMyA9IHBlZyRwYXJzZXVucXVvdGVkX2NoYXIoKTtcbiAgICAgIHdoaWxlIChzMyAhPT0gcGVnJEZBSUxFRCkge1xuICAgICAgICBzMi5wdXNoKHMzKTtcbiAgICAgICAgczMgPSBwZWckcGFyc2V1bnF1b3RlZF9jaGFyKCk7XG4gICAgICB9XG4gICAgICBpZiAoczIgIT09IHBlZyRGQUlMRUQpIHtcbiAgICAgICAgcGVnJHNhdmVkUG9zID0gczA7XG4gICAgICAgIHMxID0gcGVnJGM3OChzMSwgczIpO1xuICAgICAgICBzMCA9IHMxO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgcGVnJGN1cnJQb3MgPSBzMDtcbiAgICAgICAgczAgPSBwZWckRkFJTEVEO1xuICAgICAgfVxuICAgIH0gZWxzZSB7XG4gICAgICBwZWckY3VyclBvcyA9IHMwO1xuICAgICAgczAgPSBwZWckRkFJTEVEO1xuICAgIH1cbiAgICBwZWckc2lsZW50RmFpbHMtLTtcbiAgICBpZiAoczAgPT09IHBlZyRGQUlMRUQpIHtcbiAgICAgIHMxID0gcGVnJEZBSUxFRDtcbiAgICAgIGlmIChwZWckc2lsZW50RmFpbHMgPT09IDApIHsgcGVnJGZhaWwocGVnJGM3Nyk7IH1cbiAgICB9XG5cbiAgICByZXR1cm4gczA7XG4gIH1cblxuICBmdW5jdGlvbiBwZWckcGFyc2VmaXJzdF91bnF1b3RlZF9jaGFyKCkge1xuICAgIHZhciBzMDtcblxuICAgIGlmIChwZWckYzc5LnRlc3QoaW5wdXQuY2hhckF0KHBlZyRjdXJyUG9zKSkpIHtcbiAgICAgIHMwID0gaW5wdXQuY2hhckF0KHBlZyRjdXJyUG9zKTtcbiAgICAgIHBlZyRjdXJyUG9zKys7XG4gICAgfSBlbHNlIHtcbiAgICAgIHMwID0gcGVnJEZBSUxFRDtcbiAgICAgIGlmIChwZWckc2lsZW50RmFpbHMgPT09IDApIHsgcGVnJGZhaWwocGVnJGM4MCk7IH1cbiAgICB9XG5cbiAgICByZXR1cm4gczA7XG4gIH1cblxuICBmdW5jdGlvbiBwZWckcGFyc2V1bnF1b3RlZF9jaGFyKCkge1xuICAgIHZhciBzMDtcblxuICAgIGlmIChwZWckYzgxLnRlc3QoaW5wdXQuY2hhckF0KHBlZyRjdXJyUG9zKSkpIHtcbiAgICAgIHMwID0gaW5wdXQuY2hhckF0KHBlZyRjdXJyUG9zKTtcbiAgICAgIHBlZyRjdXJyUG9zKys7XG4gICAgfSBlbHNlIHtcbiAgICAgIHMwID0gcGVnJEZBSUxFRDtcbiAgICAgIGlmIChwZWckc2lsZW50RmFpbHMgPT09IDApIHsgcGVnJGZhaWwocGVnJGM4Mik7IH1cbiAgICB9XG5cbiAgICByZXR1cm4gczA7XG4gIH1cblxuICBmdW5jdGlvbiBwZWckcGFyc2VkYXRlKCkge1xuICAgIHZhciBzMCwgczEsIHMyLCBzMztcblxuICAgIHBlZyRzaWxlbnRGYWlscysrO1xuICAgIHMwID0gcGVnJGN1cnJQb3M7XG4gICAgaWYgKGlucHV0LnN1YnN0cihwZWckY3VyclBvcywgNCkgPT09IHBlZyRjODQpIHtcbiAgICAgIHMxID0gcGVnJGM4NDtcbiAgICAgIHBlZyRjdXJyUG9zICs9IDQ7XG4gICAgfSBlbHNlIHtcbiAgICAgIHMxID0gcGVnJEZBSUxFRDtcbiAgICAgIGlmIChwZWckc2lsZW50RmFpbHMgPT09IDApIHsgcGVnJGZhaWwocGVnJGM4NSk7IH1cbiAgICB9XG4gICAgaWYgKHMxICE9PSBwZWckRkFJTEVEKSB7XG4gICAgICBzMiA9IHBlZyRwYXJzZXdzKCk7XG4gICAgICBpZiAoczIgIT09IHBlZyRGQUlMRUQpIHtcbiAgICAgICAgczMgPSBwZWckcGFyc2VzdHJpbmcoKTtcbiAgICAgICAgaWYgKHMzICE9PSBwZWckRkFJTEVEKSB7XG4gICAgICAgICAgcGVnJHNhdmVkUG9zID0gczA7XG4gICAgICAgICAgczEgPSBwZWckYzg2KHMzKTtcbiAgICAgICAgICBzMCA9IHMxO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIHBlZyRjdXJyUG9zID0gczA7XG4gICAgICAgICAgczAgPSBwZWckRkFJTEVEO1xuICAgICAgICB9XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBwZWckY3VyclBvcyA9IHMwO1xuICAgICAgICBzMCA9IHBlZyRGQUlMRUQ7XG4gICAgICB9XG4gICAgfSBlbHNlIHtcbiAgICAgIHBlZyRjdXJyUG9zID0gczA7XG4gICAgICBzMCA9IHBlZyRGQUlMRUQ7XG4gICAgfVxuICAgIHBlZyRzaWxlbnRGYWlscy0tO1xuICAgIGlmIChzMCA9PT0gcGVnJEZBSUxFRCkge1xuICAgICAgczEgPSBwZWckRkFJTEVEO1xuICAgICAgaWYgKHBlZyRzaWxlbnRGYWlscyA9PT0gMCkgeyBwZWckZmFpbChwZWckYzgzKTsgfVxuICAgIH1cblxuICAgIHJldHVybiBzMDtcbiAgfVxuXG4gIGZ1bmN0aW9uIHBlZyRwYXJzZURJR0lUKCkge1xuICAgIHZhciBzMDtcblxuICAgIGlmIChwZWckYzg3LnRlc3QoaW5wdXQuY2hhckF0KHBlZyRjdXJyUG9zKSkpIHtcbiAgICAgIHMwID0gaW5wdXQuY2hhckF0KHBlZyRjdXJyUG9zKTtcbiAgICAgIHBlZyRjdXJyUG9zKys7XG4gICAgfSBlbHNlIHtcbiAgICAgIHMwID0gcGVnJEZBSUxFRDtcbiAgICAgIGlmIChwZWckc2lsZW50RmFpbHMgPT09IDApIHsgcGVnJGZhaWwocGVnJGM4OCk7IH1cbiAgICB9XG5cbiAgICByZXR1cm4gczA7XG4gIH1cblxuICBmdW5jdGlvbiBwZWckcGFyc2VIRVhESUcoKSB7XG4gICAgdmFyIHMwO1xuXG4gICAgaWYgKHBlZyRjODkudGVzdChpbnB1dC5jaGFyQXQocGVnJGN1cnJQb3MpKSkge1xuICAgICAgczAgPSBpbnB1dC5jaGFyQXQocGVnJGN1cnJQb3MpO1xuICAgICAgcGVnJGN1cnJQb3MrKztcbiAgICB9IGVsc2Uge1xuICAgICAgczAgPSBwZWckRkFJTEVEO1xuICAgICAgaWYgKHBlZyRzaWxlbnRGYWlscyA9PT0gMCkgeyBwZWckZmFpbChwZWckYzkwKTsgfVxuICAgIH1cblxuICAgIHJldHVybiBzMDtcbiAgfVxuXG4gIHBlZyRyZXN1bHQgPSBwZWckc3RhcnRSdWxlRnVuY3Rpb24oKTtcblxuICBpZiAocGVnJHJlc3VsdCAhPT0gcGVnJEZBSUxFRCAmJiBwZWckY3VyclBvcyA9PT0gaW5wdXQubGVuZ3RoKSB7XG4gICAgcmV0dXJuIHBlZyRyZXN1bHQ7XG4gIH0gZWxzZSB7XG4gICAgaWYgKHBlZyRyZXN1bHQgIT09IHBlZyRGQUlMRUQgJiYgcGVnJGN1cnJQb3MgPCBpbnB1dC5sZW5ndGgpIHtcbiAgICAgIHBlZyRmYWlsKHBlZyRlbmRFeHBlY3RhdGlvbigpKTtcbiAgICB9XG5cbiAgICB0aHJvdyBwZWckYnVpbGRTdHJ1Y3R1cmVkRXJyb3IoXG4gICAgICBwZWckbWF4RmFpbEV4cGVjdGVkLFxuICAgICAgcGVnJG1heEZhaWxQb3MgPCBpbnB1dC5sZW5ndGggPyBpbnB1dC5jaGFyQXQocGVnJG1heEZhaWxQb3MpIDogbnVsbCxcbiAgICAgIHBlZyRtYXhGYWlsUG9zIDwgaW5wdXQubGVuZ3RoXG4gICAgICAgID8gcGVnJGNvbXB1dGVMb2NhdGlvbihwZWckbWF4RmFpbFBvcywgcGVnJG1heEZhaWxQb3MgKyAxKVxuICAgICAgICA6IHBlZyRjb21wdXRlTG9jYXRpb24ocGVnJG1heEZhaWxQb3MsIHBlZyRtYXhGYWlsUG9zKVxuICAgICk7XG4gIH1cbn1cblxubW9kdWxlLmV4cG9ydHMgPSB7XG4gIFN5bnRheEVycm9yOiBwZWckU3ludGF4RXJyb3IsXG4gIHBhcnNlOiAgICAgICBwZWckcGFyc2Vcbn07XG4iLCJcbi8qKlxuICogU2VyaWFsaXplIGEgamF2YXNjcmlwdCBvYmplY3QgdG8gQXBwbGVTY3JpcHRcbiAqL1xuZnVuY3Rpb24gc2VyaWFsaXplT2JqZWN0KHZhbHVlKSB7XG5cdGlmICh2YWx1ZSA9PT0gbnVsbCkge1xuXHRcdHJldHVybiAnJztcblx0fVxuXHR2YXIgcmVzdWx0O1xuXHR2YXIgdHlwZU9mID0gdHlwZW9mIHZhbHVlO1xuXG5cdGlmICh0eXBlT2YgPT09ICdvYmplY3QnICYmICh2YWx1ZSAhPT0gbnVsbCkpIHtcblx0XHRyZXN1bHQgPSAneyc7XG5cdFx0aWYgKEFycmF5LmlzQXJyYXkodmFsdWUpKSB7XG5cdFx0XHR2YWx1ZS5mb3JFYWNoKGZ1bmN0aW9uIChhcnJheVZhbHVlLCBpKSB7XG5cdFx0XHRcdGlmIChpICE9PSAwKSB7XG5cdFx0XHRcdFx0cmVzdWx0ICs9ICcsJztcblx0XHRcdFx0fVxuXHRcdFx0XHRyZXN1bHQgKz0gc2VyaWFsaXplT2JqZWN0KGFycmF5VmFsdWUpO1xuXHRcdFx0fSk7XG5cdFx0fSBlbHNlIHtcblx0XHRcdE9iamVjdC5rZXlzKHZhbHVlKS5mb3JFYWNoKGZ1bmN0aW9uIChrZXksIGkpIHtcblx0XHRcdFx0aWYgKGkgIT09IDApIHtcblx0XHRcdFx0XHRyZXN1bHQgKz0gJywnO1xuXHRcdFx0XHR9XG5cdFx0XHRcdHJlc3VsdCArPSBrZXkgKyAnOicgKyBzZXJpYWxpemVPYmplY3QodmFsdWVba2V5XSk7XG5cdFx0XHR9KTtcblx0XHR9XG5cblx0XHRyZXN1bHQgKz0gJ30nO1xuXHR9IGVsc2UgaWYgKHR5cGVPZiA9PT0gJ3N0cmluZycpIHtcblx0XHRyZXN1bHQgPSAnXCInICsgdmFsdWUgKyAnXCInO1xuXHR9IGVsc2UgaWYgKHZhbHVlID09PSB1bmRlZmluZWQpIHtcblx0XHRyZXN1bHQgPSAnbnVsbCc7XG5cdH1cblxuXHRyZXR1cm4gcmVzdWx0IHx8IHZhbHVlO1xufVxuXG5tb2R1bGUuZXhwb3J0cyA9IHtcblx0c2VyaWFsaXplT2JqZWN0OiBzZXJpYWxpemVPYmplY3QsXG4gIC8vIEdlbmVyYXRlIGFwcGxlIHNjcmlwdCBmcm9tIGphdmFzY3JpcHQgb2JqZWN0XG5cdGdlbmVyYXRlOiBmdW5jdGlvbiAob2JqZWN0KSB7XG5cdFx0dmFyIGFTY3JpcHQgPSAnJztcblxuXHRcdE9iamVjdC5rZXlzKG9iamVjdCkuZm9yRWFjaChmdW5jdGlvbiAoa2V5KSB7XG5cdFx0XHRhU2NyaXB0ICs9ICdzZXQgJyArIGtleSArICcgdG8gJyArIHNlcmlhbGl6ZU9iamVjdChvYmplY3Rba2V5XSkgKyAnXFxuJztcblx0XHR9KTtcblxuXHRcdHJldHVybiBhU2NyaXB0O1xuXHR9XG59O1xuIiwidmFyIHNwYXduID0gcmVxdWlyZSgnY2hpbGRfcHJvY2VzcycpLnNwYXduO1xudmFyIGRpcm5hbWUgPSByZXF1aXJlKCdwYXRoJykuZGlybmFtZTtcbnZhciByZWFkRmlsZVN5bmMgPSByZXF1aXJlKCdmcycpLnJlYWRGaWxlU3luYztcblxudmFyIEJ1ZmZlcnMgPSByZXF1aXJlKCdidWZmZXJzJyk7XG5cbnZhciBwYXJzZSA9IHJlcXVpcmUoJy4vb3NhLXBhcnNlcicpLnBhcnNlO1xudmFyIHZhckdlbmVyYXRvciA9IHJlcXVpcmUoJy4vb3NhLXZhcmdlbicpLmdlbmVyYXRlO1xuXG52YXIgYnVmZmVyU3RyZWFtID0gZnVuY3Rpb24gKHN0cmVhbSkge1xuXHR2YXIgYnVmZmVyID0gbmV3IEJ1ZmZlcnMoKTtcblx0c3RyZWFtLm9uKCdkYXRhJywgZnVuY3Rpb24gKGNodW5rKSB7XG5cdFx0YnVmZmVyLnB1c2goY2h1bmspO1xuXHR9KTtcblx0cmV0dXJuIGJ1ZmZlcjtcbn07XG5cbnZhciBleGVjdXRlID0gZnVuY3Rpb24gKHBhdGgsIHNjcmlwdCwgdmFycywgY2IpIHtcblx0aWYgKGNiID09PSB1bmRlZmluZWQpIHtcblx0XHRjYiA9IHZhcnM7XG5cdH1cblx0dmFyIG9wdHM7XG5cdGlmICh0eXBlb2YgcGF0aCA9PT0gJ3VuZGVmaW5lZCcpIHtcblx0XHRvcHRzID0ge307XG5cdH0gZWxzZSB7XG5cdFx0b3B0cyA9IHtjd2Q6IGRpcm5hbWUocGF0aCl9O1xuXHR9XG5cblx0dmFyIGNwID0gc3Bhd24oJ29zYXNjcmlwdCcsIFsnLXNzJywgJy0nXSwgb3B0cyk7XG5cblx0dmFyIG91dEJ1ZmZlciA9IGJ1ZmZlclN0cmVhbShjcC5zdGRvdXQpO1xuXHR2YXIgZXJyQnVmZmVyID0gYnVmZmVyU3RyZWFtKGNwLnN0ZGVycik7XG5cblx0Y3Aub24oJ2Nsb3NlJywgZnVuY3Rpb24gKGNvZGUpIHtcblx0XHR2YXIgZXJyb3I7XG5cdFx0dmFyIHJlc3VsdDtcblxuXHRcdGlmIChjb2RlKSB7XG5cdFx0XHRlcnJvciA9IG5ldyBFcnJvcihlcnJCdWZmZXIudG9TdHJpbmcoKSk7XG5cdFx0fSBlbHNlIHtcblx0XHRcdHRyeSB7XG5cdFx0XHRcdHJlc3VsdCA9IHBhcnNlKG91dEJ1ZmZlci50b1N0cmluZygpKTtcblx0XHRcdH0gY2F0Y2ggKGVycikge1xuXHRcdFx0XHRlcnJvciA9IGVycjtcblx0XHRcdH1cblx0XHR9XG5cblx0XHRpZiAoY2IpIHtcblx0XHRcdGNiKGVycm9yLCByZXN1bHQsIG91dEJ1ZmZlcik7XG5cdFx0fVxuXHR9KTtcblxuXHRpZiAoIXNjcmlwdCkge1xuXHRcdHNjcmlwdCA9IHJlYWRGaWxlU3luYyhwYXRoKTtcblx0fVxuXG5cdGlmICh2YXJzKSB7XG5cdFx0c2NyaXB0ID0gdmFyR2VuZXJhdG9yKHZhcnMpICsgJ1xcbicgKyBzY3JpcHQ7XG5cdH1cblxuXHRjcC5zdGRpbi53cml0ZShzY3JpcHQpO1xuXHRjcC5zdGRpbi5lbmQoKTtcblxuXHRyZXR1cm4gY3A7XG59O1xuXG5tb2R1bGUuZXhwb3J0cyA9IHtcblx0ZXhlY3V0ZTogZnVuY3Rpb24gKHNjcmlwdCwgdmFycywgY2IpIHtcblx0XHRyZXR1cm4gZXhlY3V0ZSh1bmRlZmluZWQsIHNjcmlwdCwgdmFycywgY2IpO1xuXHR9LFxuXHRleGVjdXRlRmlsZTogZnVuY3Rpb24gKHBhdGgsIHZhcnMsIGNiKSB7XG5cdFx0cmV0dXJuIGV4ZWN1dGUocGF0aCwgdW5kZWZpbmVkLCB2YXJzLCBjYik7XG5cdH1cbn07XG4iLCJpbXBvcnQgYXBwbGVzY3JpcHQgZnJvbSAnbm9kZS1vc2FzY3JpcHQnO1xuaW1wb3J0IHsgTGlzdCwgUmVtaW5kZXIgfSBmcm9tIFwic3JjL2ludGVyZmFjZXNcIjtcbmltcG9ydCB7IGxvZ2dlciB9IGZyb20gJ3NyYy90b29scyc7XG5cblxuY29uc3Qgc2NyaXB0cyA9IHtcbiAgICAvL0xpc3RzXG4gICAgZ2V0X2xpc3RzOiAoKSA9PiBgdGVsbCBhcHBsaWNhdGlvbiBcIlJlbWluZGVyc1wiIHRvIHJldHVybiBwcm9wZXJ0aWVzIG9mIGxpc3RzYCxcbiAgICBnZXRfbGlzdF9yZW1pbmRlcnM6IChsaXN0OiBBcHBsZUxpc3QsIGNhbGxiYWNrOiBGdW5jdGlvbikgPT4gYXBwbGVzY3JpcHQuZXhlY3V0ZShgXG4gICAgICAgICAgICB0ZWxsIGxpc3QgbGlzdF9uYW1lIGluIGFwcGxpY2F0aW9uIFwiUmVtaW5kZXJzXCJcbiAgICAgICAgICAgIFx0c2V0IGJ1ZmZlciB0byAoKGN1cnJlbnQgZGF0ZSkgLSBtaW51dGVzICogNSlcbiAgICAgICAgICAgIFx0cmV0dXJuIHByb3BlcnRpZXMgb2YgcmVtaW5kZXJzIHdob3NlIGNvbXBsZXRpb24gZGF0ZSBjb21lcyBhZnRlciBidWZmZXIgb3IgY29tcGxldGVkIGlzIGZhbHNlXHRcbiAgICAgICAgICAgIGVuZCB0ZWxsXG4gICAgYCwgeyBsaXN0X25hbWU6IGxpc3QucHJvcGVydGllcy5uYW1lIH0sIGNhbGxiYWNrKSxcblxuICAgIC8vUmVtaW5kZXJzXG4gICAgZ2V0X3JlbWluZGVyOiAocmVtaW5kZXI6IEFwcGxlUmVtaW5kZXIsIGNhbGxiYWNrOiBGdW5jdGlvbikgPT4gYXBwbGVzY3JpcHQuZXhlY3V0ZShgdGVsbCBhcHBsaWNhdGlvbiBcIlJlbWluZGVyc1wiIHRvIHJldHVybiBwcm9wZXJ0aWVzIG9mIHJlbWluZGVycyB3aG9zZSBuYW1lIGlzIHJlbWluZGVyX25hbWVgLCB7IHJlbWluZGVyX25hbWU6IHJlbWluZGVyLm5hbWUgfSwgY2FsbGJhY2spXG59XG5cbmNvbnN0IGV4ZWN1dG9yID0gKHNjcmlwdDogc3RyaW5nLCB2YXJpYWJsZXM6IHt9LCBjYWxsYmFjazogRnVuY3Rpb24pID0+IHtcbiAgICBsZXQgY2hpbGRQcm9jZXNzID0gYXBwbGVzY3JpcHQuZXhlY3V0ZShzY3JpcHQsIHZhcmlhYmxlcywgKGVycjogYW55LCByZXM6IGFueSwgcmF3OiBhbnkpID0+IHtcbiAgICAgICAgaWYoZXJyKSB0aHJvdyBlcnI7XG4gICAgICAgIGNhbGxiYWNrKHJlcywgcmF3KTtcbiAgICB9KTtcblxuICAgIHNldFRpbWVvdXQoKCkgPT4ge1xuICAgICAgICBjaGlsZFByb2Nlc3Muc3RkaW4ucGF1c2UoKTtcbiAgICAgICAgY2hpbGRQcm9jZXNzLmtpbGwoKTtcbiAgICB9LCAzMDAwMClcbn1cblxuXG5leHBvcnQgY2xhc3MgQXBwbGVMaXN0IHtcbiAgICBwcm9wZXJ0aWVzOiBMaXN0O1xuICAgIHJlbWluZGVycyA9IG5ldyBNYXA8UmVtaW5kZXJbXCJuYW1lXCJdLCBBcHBsZVJlbWluZGVyPigpO1xuICAgIGNsYXNzTmFtZSA9IFwiYXBwbGUtbGlzdFwiO1xuICAgIHN0YWxlOiBib29sZWFuID0gdHJ1ZTtcblxuICAgIGNvbnN0cnVjdG9yKHByb3BlcnRpZXM6IExpc3QpIHtcbiAgICAgICAgdGhpcy5wcm9wZXJ0aWVzID0gcHJvcGVydGllcztcbiAgICAgICAgdGhpcy5zeW5jUmVtaW5kZXJzKCk7XG4gICAgICAgIHNldEludGVydmFsKCgpID0+IHtcbiAgICAgICAgICAgIHRoaXMuc3luY1JlbWluZGVycygpXG4gICAgICAgIH0sIDYwMDAwKTtcbiAgICB9XG5cbiAgICBzeW5jKCkge1xuICAgICAgICByZXR1cm4gbmV3IFByb21pc2U8dGhpcz4oKHJlc29sdmUsIHJlamVjdCkgPT4ge1xuICAgICAgICAgICAgY29uc29sZS5sb2coJ3N5bmNpbmcnKTtcblxuICAgICAgICAgICAgZXhlY3V0b3IoXG4gICAgICAgICAgICAgICAgYHRlbGwgYXBwbGljYXRpb24gXCJSZW1pbmRlcnNcIlxuICAgICAgICAgICAgICAgICAgICB0cnlcbiAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiBwcm9wZXJ0aWVzIG9mIGxpc3QgbGlzdF9uYW1lXG4gICAgICAgICAgICAgICAgICAgIG9uIGVycm9yXG4gICAgICAgICAgICAgICAgICAgICAgICBzZXQgbGlzIHRvIG1ha2UgbmV3IGxpc3RcbiAgICAgICAgICAgICAgICAgICAgICAgIHNldCBuYW1lIG9mIGxpcyB0byBsaXN0X25hbWVcbiAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiBwcm9wZXJ0aWVzIG9mIGxpc1xuICAgICAgICAgICAgICAgICAgICBlbmQgdHJ5XG4gICAgICAgICAgICAgICAgZW5kIHRlbGxgLFxuICAgICAgICAgICAgICAgIHsgbGlzdF9uYW1lOiB0aGlzLnByb3BlcnRpZXMubmFtZSB9LFxuICAgICAgICAgICAgICAgIChyZXM6IExpc3QsIHJhdzogYW55KSA9PiB7XG4gICAgICAgICAgICAgICAgICAgIGxvZ2dlcih0aGlzLCBcIlN5bmNcIiwgeyByZXMsIHJhdyB9KTtcbiAgICAgICAgICAgICAgICAgICAgdmFyIHRlbXAgPSB7IC4uLnRoaXMucHJvcGVydGllcywgLi4ucmVzIH1cbiAgICAgICAgICAgICAgICAgICAgdGhpcy5wcm9wZXJ0aWVzID0gdGVtcDtcbiAgICAgICAgICAgICAgICAgICAgcmVzb2x2ZSh0aGlzKTtcbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgfSk7XG5cbiAgICB9XG5cbiAgICBzeW5jUmVtaW5kZXJzKCkge1xuICAgICAgICByZXR1cm4gbmV3IFByb21pc2U8QXBwbGVSZW1pbmRlcltdPigocmVzb2x2ZSwgcmVqZWN0KSA9PiB7XG4gICAgICAgICAgICBleGVjdXRvcihcbiAgICAgICAgICAgICAgICBgdGVsbCBsaXN0IGxpc3RfbmFtZSBpbiBhcHBsaWNhdGlvbiBcIlJlbWluZGVyc1wiXG4gICAgICAgICAgICBcdCAgICBzZXQgYnVmZmVyIHRvICgoY3VycmVudCBkYXRlKSAtIGhvdXJzICogMSlcbiAgICAgICAgICAgIFx0ICAgIHJldHVybiBwcm9wZXJ0aWVzIG9mIHJlbWluZGVycyB3aG9zZSBjb21wbGV0aW9uIGRhdGUgY29tZXMgYWZ0ZXIgYnVmZmVyIG9yIGNvbXBsZXRlZCBpcyBmYWxzZVx0XG4gICAgICAgICAgICAgICAgZW5kIHRlbGxgLFxuICAgICAgICAgICAgICAgIHsgbGlzdF9uYW1lOiB0aGlzLnByb3BlcnRpZXMubmFtZSB9LFxuICAgICAgICAgICAgICAgIChyZXM6IFJlbWluZGVyW10sIHJhdzogYW55KSA9PiB7XG4gICAgICAgICAgICAgICAgICAgIGlmIChyZXMgJiYgcmVzLmxlbmd0aCA+IDApIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHJlcy5mb3JFYWNoKGVsZW1lbnQgPT4ge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIGxvZ2dlcih0aGlzLCBcIlJlbWluZGVyXCIsIGVsZW1lbnQpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMuYWRkUmVtaW5kZXIoZWxlbWVudCk7XG4gICAgICAgICAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICByZXNvbHZlKEFycmF5LmZyb20odGhpcy5yZW1pbmRlcnMsIChbbmFtZSwgdmFsXSkgPT4gdmFsKSk7XG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgIH0pO1xuICAgIH1cblxuICAgIGdldFJlbWluZGVycygpIHtcbiAgICAgICAgcmV0dXJuIEFycmF5LmZyb20odGhpcy5yZW1pbmRlcnMsIChbbmFtZSwgdmFsXSkgPT4gdmFsKTtcbiAgICB9XG5cbiAgICBhc3luYyB1cGRhdGUocHJvcGVydGllczogTGlzdCkge1xuICAgICAgICByZXR1cm4gdGhpcztcbiAgICB9XG5cbiAgICBhZGRSZW1pbmRlcihyZW1pbmRlcjogUmVtaW5kZXIpIHtcbiAgICAgICAgbGV0IHJlbSA9IHRoaXMucmVtaW5kZXJzLmdldChyZW1pbmRlci5uYW1lKTtcbiAgICAgICAgaWYgKHJlbSkge1xuICAgICAgICAgICAgcmVtLnByb3BlcnRpZXMgPSByZW1pbmRlcjtcbiAgICAgICAgfVxuICAgICAgICBlbHNlXG4gICAgICAgICAgICB0aGlzLnJlbWluZGVycy5zZXQocmVtaW5kZXIubmFtZSwgbmV3IEFwcGxlUmVtaW5kZXIocmVtaW5kZXIsIHRoaXMpKTtcbiAgICB9XG5cbiAgICBhZGRDdXN0b21SZW1pbmRlcihwcm9wZXJ0aWVzOiBSZW1pbmRlcikge1xuICAgICAgICBsb2dnZXIodGhpcywgXCJBZGRpbmcgQ3VzdG9tIFJtZWluZGVyXCIsIHByb3BlcnRpZXMpO1xuICAgICAgICBhcHBsZXNjcmlwdC5leGVjdXRlKGB0ZWxsIGxpc3QgbGlzdF9uYW1lIGluIGFwcGxpY2F0aW9uIFwiUmVtaW5kZXJzXCJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdHJ5XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gcHJvcGVydGllcyBvZiByZW1pbmRlciByZW1pbmRlcl9uYW1lXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIG9uIGVycm9yXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBzZXQgcmVtIHRvIG1ha2UgbmV3IHJlbWluZGVyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBzZXQgbmFtZSBvZiByZW0gdG8gcmVtaW5kZXJfbmFtZVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHByb3BlcnRpZXMgb2YgcmVtXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGVuZCB0cnlcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBlbmQgdGVsbGAsXG4gICAgICAgICAgICB7IGxpc3RfbmFtZTogdGhpcy5wcm9wZXJ0aWVzLm5hbWUsIHJlbWluZGVyX25hbWU6IHByb3BlcnRpZXMubmFtZSB9LFxuICAgICAgICAgICAgKGVycjogYW55LCByZXM6IFJlbWluZGVyLCByYXc6IGFueSkgPT4ge1xuICAgICAgICAgICAgICAgIGlmIChlcnIpIHRocm93IGVycjtcbiAgICAgICAgICAgICAgICBsb2dnZXIodGhpcywgXCJNYWRlIEN1c3RvbSBSZW1pbmRlclwiLCB7IGVyciwgcmVzLCByYXcgfSlcbiAgICAgICAgICAgICAgICB0aGlzLmFkZFJlbWluZGVyKHJlcyk7XG4gICAgICAgICAgICB9XG4gICAgICAgIClcbiAgICB9XG5cbiAgICBnZXRSZW1pbmRlcihuYW1lOiBzdHJpbmcpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMucmVtaW5kZXJzLmdldChuYW1lKTtcbiAgICB9XG5cbiAgICB0b1N0cmluZygpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMucHJvcGVydGllcy50b1N0cmluZygpO1xuICAgIH1cblxufVxuXG5leHBvcnQgY2xhc3MgQXBwbGVSZW1pbmRlciB7XG4gICAgbmFtZTogc3RyaW5nO1xuICAgIGNvbnRhaW5lcjogQXBwbGVMaXN0O1xuICAgIHByb3BlcnRpZXM6IFJlbWluZGVyO1xuXG4gICAgY29uc3RydWN0b3IocHJvcGVydGllczogUmVtaW5kZXIsIHBhcmVudDogQXBwbGVMaXN0KSB7XG4gICAgICAgIHRoaXMuY29udGFpbmVyID0gcGFyZW50O1xuICAgICAgICB0aGlzLnByb3BlcnRpZXMgPSBwcm9wZXJ0aWVzO1xuICAgIH1cblxuICAgIGFzeW5jIHN5bmMoKSB7XG4gICAgICAgIGxvZ2dlcih0aGlzLCBcIlN5bmMgUmVtaW5kZXJcIiwgdGhpcy5wcm9wZXJ0aWVzKTtcbiAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgfVxuXG4gICAgYXN5bmMgdXBkYXRlKHByb3BlcnRpZXM6IFJlbWluZGVyKSB7XG4gICAgICAgIGxvZ2dlcih0aGlzLCBcIk5lZWRzVXBkYXRlXCIsIHsgZnJvbTogdGhpcy5wcm9wZXJ0aWVzLCB0bzogcHJvcGVydGllcyB9KTtcbiAgICAgICAgdmFyIHRlbXAgPSB7IC4uLnRoaXMucHJvcGVydGllcywgLi4ucHJvcGVydGllcyB9O1xuICAgICAgICB0aGlzLnByb3BlcnRpZXMgPSB0ZW1wO1xuICAgICAgICByZXR1cm4gdGhpcztcbiAgICB9XG5cbiAgICBhc3luYyBtYXJrRG9uZSgpIHtcbiAgICAgICAgYXBwbGVzY3JpcHQuZXhlY3V0ZShgdGVsbCBsaXN0IGxpc3RfbmFtZSBpbiBhcHBsaWNhdGlvbiBcIlJlbWluZGVyc1wiXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHNldCByZW0gdG8gcmVtaW5kZXIgcmVtaW5kZXJfbmFtZVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBzZXQgY29tcGxldGVkIGluIHJlbSB0byB0cnVlXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiBwcm9wZXJ0aWVzIG9mIHJlbVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGVuZCB0ZWxsYCxcbiAgICAgICAgICAgIHsgbGlzdF9uYW1lOiB0aGlzLmNvbnRhaW5lci5wcm9wZXJ0aWVzLm5hbWUsIHJlbWluZGVyX25hbWU6IHRoaXMucHJvcGVydGllcy5uYW1lIH0sXG4gICAgICAgICAgICAoZXJyOiBhbnksIHJlczogUmVtaW5kZXIsIHJhdzogYW55KSA9PiB7XG4gICAgICAgICAgICAgICAgbG9nZ2VyKHRoaXMsIFwiTWFya2VkIERvbmVcIiwgeyBlcnIsIHJlcywgcmF3IH0pXG4gICAgICAgICAgICAgICAgdGhpcy5wcm9wZXJ0aWVzID0geyAuLi50aGlzLnByb3BlcnRpZXMsIC4uLnJlcyB9XG4gICAgICAgICAgICB9XG4gICAgICAgIClcbiAgICAgICAgLy8gcmV0dXJuIGF3YWl0IHRoaXMudXBkYXRlKHsgbmFtZTogdGhpcy5wcm9wZXJ0aWVzLm5hbWUsIGNvbXBsZXRlZDogdHJ1ZSB9KTtcbiAgICB9XG5cbiAgICBhc3luYyBtYXJrTm90RG9uZSgpIHtcbiAgICAgICAgYXBwbGVzY3JpcHQuZXhlY3V0ZShgdGVsbCBsaXN0IGxpc3RfbmFtZSBpbiBhcHBsaWNhdGlvbiBcIlJlbWluZGVyc1wiXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHNldCByZW0gdG8gcmVtaW5kZXIgcmVtaW5kZXJfbmFtZVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBzZXQgY29tcGxldGVkIGluIHJlbSB0byBmYWxzZVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gcHJvcGVydGllcyBvZiByZW1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBlbmQgdGVsbGAsXG4gICAgICAgICAgICB7IGxpc3RfbmFtZTogdGhpcy5jb250YWluZXIucHJvcGVydGllcy5uYW1lLCByZW1pbmRlcl9uYW1lOiB0aGlzLnByb3BlcnRpZXMubmFtZSB9LFxuICAgICAgICAgICAgKGVycjogYW55LCByZXM6IFJlbWluZGVyLCByYXc6IGFueSkgPT4ge1xuICAgICAgICAgICAgICAgIGxvZ2dlcih0aGlzLCBcIk1hcmtlZCBOb3QgRG9uZVwiLCB7IGVyciwgcmVzLCByYXcgfSlcbiAgICAgICAgICAgICAgICB0aGlzLnByb3BlcnRpZXMgPSB7IC4uLnRoaXMucHJvcGVydGllcywgLi4ucmVzIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgKVxuICAgIH1cblxuICAgIHRvU3RyaW5nKCkge1xuICAgICAgICByZXR1cm4gdGhpcy5wcm9wZXJ0aWVzLnRvU3RyaW5nKCk7XG4gICAgfVxufVxuIiwiPHNjcmlwdCBsYW5nPVwidHNcIj5cbiAgICBpbXBvcnQgeyBBcHBsZVJlbWluZGVyIH0gZnJvbSBcInNyYy9tb2RlbHMvUmVtaW5kZXJzLmFwcFwiO1xuXG4gICAgZXhwb3J0IGxldCBtb2RlbDogQXBwbGVSZW1pbmRlcjtcblxuICAgICQ6IG0gPSBtb2RlbC5wcm9wZXJ0aWVzO1xuICAgIFxuICAgIHNldEludGVydmFsKCgpID0+IHttID0gbW9kZWwucHJvcGVydGllc30sIDEwMDApXG5cbjwvc2NyaXB0PlxuXG48c3R5bGU+XG4gICAgLmNoZWNrYm94LXJvdW5kIHtcbiAgICAgICAgd2lkdGg6IDEuM2VtO1xuICAgICAgICBoZWlnaHQ6IDEuM2VtO1xuICAgICAgICBiYWNrZ3JvdW5kLWNvbG9yOiByZ2JhKDI1NSwgMjU1LCAyNTUsIDApO1xuICAgICAgICBib3JkZXItcmFkaXVzOiA1MCU7XG4gICAgICAgIHZlcnRpY2FsLWFsaWduOiBtaWRkbGU7XG4gICAgICAgIGJvcmRlcjogMXB4IHNvbGlkIHJnYigxNzAsIDE2OCwgMTY4KTtcbiAgICAgICAgLXdlYmtpdC1hcHBlYXJhbmNlOiBub25lO1xuICAgICAgICBvdXRsaW5lOiBub25lO1xuICAgICAgICBjdXJzb3I6IHBvaW50ZXI7XG4gICAgfVxuXG4gICAgLmNoZWNrYm94LXJvdW5kOmNoZWNrZWQge1xuICAgICAgICBiYWNrZ3JvdW5kLWNvbG9yOiBncmF5O1xuICAgIH1cblxuICAgIC5hcHBsZS1yZW1pbmRlci1uYW1lIHtcbiAgICAgICAgcGFkZGluZy1sZWZ0OiAxcmVtO1xuICAgIH1cbjwvc3R5bGU+XG5cbjxpbnB1dFxuICAgIHR5cGU9XCJjaGVja2JveFwiXG4gICAgY2xhc3M9XCJjaGVja2JveC1yb3VuZFwiXG4gICAgb246Y2hhbmdlPXsoZXZlbnQpID0+IHtcbiAgICAgICAgaWYgKGV2ZW50LnRhcmdldC5jaGVja2VkKSBtb2RlbC5tYXJrRG9uZSgpO1xuICAgICAgICBlbHNlIG1vZGVsLm1hcmtOb3REb25lKCk7XG4gICAgfX0gXG4gICAgY2hlY2tlZD17bS5jb21wbGV0ZWR9XG4gICAgLz5cbjxzcGFuIGNsYXNzPVwiYXBwbGUtcmVtaW5kZXItbmFtZVwiPnttLm5hbWV9PC9zcGFuPlxuIiwiPHNjcmlwdCBsYW5nPVwidHNcIj5cblx0aW1wb3J0IHsgQXBwbGVMaXN0IH0gZnJvbSBcInNyYy9tb2RlbHMvUmVtaW5kZXJzLmFwcFwiO1xuXHRpbXBvcnQgUmVtaW5kZXJIVE1MIGZyb20gXCIuL1JlbWluZGVyLnN2ZWx0ZVwiO1xuXG5cdGV4cG9ydCBsZXQgbW9kZWw6IEFwcGxlTGlzdDtcblxuXHQkOiByZW1zID0gQXJyYXkuZnJvbShtb2RlbC5yZW1pbmRlcnMsIChbbmFtZSwgdmFsXSkgPT4gdmFsKTtcblxuXHRmdW5jdGlvbiByZWZyZXNoKCkge1xuXHRcdC8vIGNvbnNvbGUubG9nKFwiUmVmcmVzaGlnIGxpc3RcIik7XG5cdFx0cmVtcyA9IEFycmF5LmZyb20obW9kZWwucmVtaW5kZXJzLCAoW25hbWUsIHZhbF0pID0+IHZhbCk7XG5cdH1cblxuXHRzZXRJbnRlcnZhbChyZWZyZXNoLCAxMDAwKTtcbjwvc2NyaXB0PlxuXG48c3R5bGU+XG5cdC8qIC5hcHBsZS1saXN0LWFkZCB7IH0gKi9cbjwvc3R5bGU+XG5cbjxkaXYgY2xhc3M9XCJhcHBsZS1saXN0LWNvbnRhaW5lclwiPlxuXHQ8aHIgLz5cblx0PGgyPiA8c3BhbiBzdHlsZT1cImNvbG9yOiB7bW9kZWwucHJvcGVydGllcy5jb2xvcn1cIj57bW9kZWwucHJvcGVydGllcy5uYW1lfTwvc3Bhbj4gPC9oMj5cblxuXHR7I2VhY2ggcmVtcyBhcyByZW1pbmRlciwgaX1cblx0XHQ8UmVtaW5kZXJIVE1MIG1vZGVsPXtyZW1pbmRlcn0gLz48YnIgLz5cblx0ey9lYWNofVxuXHQ8YnIgLz5cblx0PCEtLSA8YnV0dG9uIGNsYXNzPVwiYXBwbGUtbGlzdC1hZGRcIj4rPC9idXR0b24+IC0tPlxuXHQ8YnV0dG9uIG9uOmNsaWNrPXtyZWZyZXNofT5SZWZyZXNoPC9idXR0b24+XG5cdDxociBjbGFzcz1cImFwcGxlLWxpc3QtYm90dG9tLXJ1bGVcIi8+XG48L2Rpdj5cbiIsImltcG9ydCB7IGFkZEljb24sIEFwcCwgUGx1Z2luLCBQbHVnaW5NYW5pZmVzdCwgVEZpbGUgfSBmcm9tIFwib2JzaWRpYW5cIjtcbmltcG9ydCB5YW1sIGZyb20gJ2pzLXlhbWwnO1xuXG5pbXBvcnQgeyBSRU1JTkRFUlNfQ0xBU1MsIFJpYmJvbkljb24gfSBmcm9tIFwiLi9jb25zdGFudHNcIjtcbmltcG9ydCB7IElJbmplY3Rpb24sIFJlbWluZGVyc1NldHRpbmdzLCBQbHVnaW5TZXR0aW5ncyB9IGZyb20gXCIuL2ludGVyZmFjZXNcIjtcbmltcG9ydCB7IGxvZ2dlciB9IGZyb20gXCIuL3Rvb2xzXCI7XG5pbXBvcnQgeyBDYWNoZSwgU3RhdHVzQmFyIH0gZnJvbSBcIi4vaGVscGVyc1wiO1xuaW1wb3J0IExpc3RIVE1MIGZyb20gXCIuL3VpL0xpc3Quc3ZlbHRlXCI7XG5pbXBvcnQgeyBBcHBsZUxpc3QgfSBmcm9tICcuL21vZGVscy9SZW1pbmRlcnMuYXBwJztcbi8vIGltcG9ydCB7IE1haW5JbnRlcmZhY2UgfSBmcm9tICcuL21vZGVscy9NYWluSW50ZXJmYWNlJztcblxuXG5hZGRJY29uKFwicmVtaW5kZXJzLWFwcFwiLCBSaWJib25JY29uKTtcblxuZXhwb3J0IGRlZmF1bHQgY2xhc3MgQXBwbGVSZW1pbmRlcnNQbHVnaW4gZXh0ZW5kcyBQbHVnaW4ge1xuXHRmaWxlOiBURmlsZTtcblx0cmliYm9uSWNvbjogSFRNTEVsZW1lbnQ7XG5cdHN0YXR1c0JhcjogU3RhdHVzQmFyO1xuXHRzZXR0aW5nczogUGx1Z2luU2V0dGluZ3M7XG5cdGNhY2hlOiBDYWNoZTtcblx0cHJpdmF0ZSBvYnNlcnZlcjogTXV0YXRpb25PYnNlcnZlcjtcblx0cHJpdmF0ZSBpbmplY3Rpb25zOiBJSW5qZWN0aW9uW107XG5cdC8vIHByaXZhdGUgdmlldzogTWFpbkludGVyZmFjZTtcblxuXHRsaXN0cyA9IG5ldyBNYXA8c3RyaW5nLCBBcHBsZUxpc3Q+KCk7XG5cblx0Y29uc3RydWN0b3IoYXBwOiBBcHAsIG1hbmlmZXN0OiBQbHVnaW5NYW5pZmVzdCkge1xuXHRcdHN1cGVyKGFwcCwgbWFuaWZlc3QpO1xuXHRcdHRoaXMuc3RhdHVzQmFyID0gbmV3IFN0YXR1c0Jhcih0aGlzLmFkZFN0YXR1c0Jhckl0ZW0oKSk7XG5cdFx0dGhpcy5zdGF0dXNCYXIubWVzc2FnZShcIkFwcGxlIFJlbWluZGVycyBTeW5jIEVuYWJsZWRcIilcblx0XHR0aGlzLmNhY2hlID0gbmV3IENhY2hlKHRoaXMpO1xuXHRcdHRoaXMuaW5qZWN0aW9ucyA9IFtdO1xuXHR9XG5cblx0YXN5bmMgb25sb2FkKCkge1xuXHRcdGxvZ2dlcih0aGlzLCBcIkFwcGxlIFJlbWluZGVycyBQbHVnaW4gaXMgTG9hZGluZy4uLlwiKTtcblx0XHR0aGlzLnJlZ2lzdGVySW50ZXJ2YWwoXG5cdFx0XHR3aW5kb3cuc2V0SW50ZXJ2YWwodGhpcy5pbmplY3RRdWVyaWVzLmJpbmQodGhpcyksIDEwMDApXG5cdFx0KTtcblxuXHRcdC8vIFdlIG5lZWQgdG8gbWFudWFsbHkgY2FsbCBkZXN0cm95IG9uIHRoZSBpbmplY3RlZCBTdmVsdGUgY29tcG9uZW50cyB3aGVuIHRoZXkgYXJlIHJlbW92ZWQuXG5cdFx0dGhpcy5vYnNlcnZlciA9IG5ldyBNdXRhdGlvbk9ic2VydmVyKChtdXRhdGlvbnMsIG9ic2VydmVyKSA9PiB7XG5cdFx0XHRpZiAodGhpcy5pbmplY3Rpb25zLmxlbmd0aCA9PSAwKSB7XG5cdFx0XHRcdHJldHVybjtcblx0XHRcdH1cblxuXHRcdFx0bXV0YXRpb25zLmZvckVhY2goKG11dGF0aW9uKSA9PiB7XG5cdFx0XHRcdG11dGF0aW9uLnJlbW92ZWROb2Rlcy5mb3JFYWNoKChyZW1vdmVkKSA9PiB7XG5cdFx0XHRcdFx0Y29uc3QgcmVtb3ZlZEluZGV4ID0gdGhpcy5pbmplY3Rpb25zLmZpbmRJbmRleChcblx0XHRcdFx0XHRcdChlbGUpID0+IGVsZS53b3Jrc3BhY2VMZWFmID09IHJlbW92ZWRcblx0XHRcdFx0XHQpO1xuXG5cdFx0XHRcdFx0aWYgKHJlbW92ZWRJbmRleCA9PSAtMSkge1xuXHRcdFx0XHRcdFx0cmV0dXJuO1xuXHRcdFx0XHRcdH1cblxuXHRcdFx0XHRcdGNvbnN0IHsgd29ya3NwYWNlTGVhZiwgY29tcG9uZW50IH0gPSB0aGlzLmluamVjdGlvbnNbcmVtb3ZlZEluZGV4XTtcblxuXHRcdFx0XHRcdGxvZ2dlcihcblx0XHRcdFx0XHRcdHRoaXMsXG5cdFx0XHRcdFx0XHRcIlJlbW92aW5nIG1vdW50ZWQgU3ZlbHRlIGNvbXBvbmVudFwiLFxuXHRcdFx0XHRcdFx0e1xuXHRcdFx0XHRcdFx0XHRyb290OiB3b3Jrc3BhY2VMZWFmLFxuXHRcdFx0XHRcdFx0XHRjb21wb25lbnQ6IGNvbXBvbmVudCxcblx0XHRcdFx0XHRcdH1cblx0XHRcdFx0XHQpO1xuXG5cdFx0XHRcdFx0dGhpcy5pbmplY3Rpb25zLnNwbGljZShyZW1vdmVkSW5kZXgsIDEpO1xuXHRcdFx0XHRcdGNvbXBvbmVudC4kZGVzdHJveSgpO1xuXHRcdFx0XHR9KTtcblx0XHRcdH0pO1xuXHRcdH0pO1xuXG5cdFx0Y29uc3Qgd29ya3NwYWNlUm9vdCA9IGRvY3VtZW50LmdldEVsZW1lbnRzQnlDbGFzc05hbWUoXCJ3b3Jrc3BhY2VcIilbMF07XG5cdFx0dGhpcy5vYnNlcnZlci5vYnNlcnZlKHdvcmtzcGFjZVJvb3QsIHsgY2hpbGRMaXN0OiB0cnVlLCBzdWJ0cmVlOiB0cnVlIH0pO1xuXHR9XG5cblx0YXN5bmMgaW5qZWN0UXVlcmllcygpIHtcblx0XHR2YXIgc2V0dGluZ3M6IFJlbWluZGVyc1NldHRpbmdzO1xuXG5cblx0XHRsZXQgc2V0dGluZ3NFbGVtZW50cyA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3JBbGw8SFRNTFByZUVsZW1lbnQ+KGBwcmVbY2xhc3MqPVwiJHtSRU1JTkRFUlNfQ0xBU1N9XCJdYCk7XG5cdFx0Zm9yIChsZXQgaSA9IDA7IGkgPCBzZXR0aW5nc0VsZW1lbnRzLmxlbmd0aDsgKytpKSB7XG5cdFx0XHRsZXQgbm9kZSA9IHNldHRpbmdzRWxlbWVudHNbaV07XG5cblx0XHRcdHNldHRpbmdzID0geWFtbC5sb2FkKG5vZGUuaW5uZXJUZXh0KTtcblxuXHRcdFx0bG9nZ2VyKHRoaXMsIFwiU2V0dGluZ3NcIiwgc2V0dGluZ3MpO1xuXG5cdFx0XHRpZiAoIXNldHRpbmdzLmxpc3QpIHRocm93IChcIk5vIExpc3QgU3BlY2lmaWVkIVwiKTtcblxuXHRcdFx0bGV0IGxzdCA9IHRoaXMubGlzdHMuZ2V0KHNldHRpbmdzLmxpc3QpO1xuXHRcdFx0aWYgKCFsc3QpIHtcblx0XHRcdFx0bHN0ID0gYXdhaXQgKG5ldyBBcHBsZUxpc3QoeyBuYW1lOiBzZXR0aW5ncy5saXN0IH0pKS5zeW5jKCk7XG5cdFx0XHRcdGxvZ2dlcih0aGlzLCBcIkNyZWF0ZWQgTmV3IExpc3RcIiwgbHN0KTtcblx0XHRcdFx0dGhpcy5saXN0cy5zZXQoc2V0dGluZ3MubGlzdCwgbHN0KTtcblx0XHRcdFx0Ly8gdGhpcy52aWV3LmFkZExpc3QobHN0KTtcblx0XHRcdH1cblxuXHRcdFx0aWYgKHNldHRpbmdzLnJlbWluZGVycykge1xuXHRcdFx0XHRzZXR0aW5ncy5yZW1pbmRlcnMuZm9yRWFjaChlbGVtID0+IHtcblx0XHRcdFx0XHRsb2dnZXIodGhpcywgXCJDdXN0b20gUmVtaW5kZXJzXCIsIHsgbmFtZTogZWxlbSwgY29tcGxldGVkOiBmYWxzZSB9KTtcblx0XHRcdFx0XHRsc3QuYWRkQ3VzdG9tUmVtaW5kZXIoeyBuYW1lOiBlbGVtLCBjb21wbGV0ZWQ6IGZhbHNlIH0pO1xuXHRcdFx0XHR9KTtcblx0XHRcdH1cblxuXHRcdFx0bG9nZ2VyKFxuXHRcdFx0XHR0aGlzLFxuXHRcdFx0XHRcIkZvdW5kIE1haW4gUmVtaW5kZXJzLmFwcCBibG9jay5cIixcblx0XHRcdFx0eyBjb250ZXh0OiBub2RlIH1cblx0XHRcdCk7XG5cblx0XHRcdHRoaXMuc3RhdHVzQmFyLm1lc3NhZ2UoXCJGb3VuZCBSZW1pbmRlcnMgQmxvY2tcIiwgMTAwMDApO1xuXG5cdFx0XHRjb25zdCByb290ID0gbm9kZS5wYXJlbnRFbGVtZW50O1xuXHRcdFx0aWYgKHJvb3QpIHtcblx0XHRcdFx0cm9vdC5yZW1vdmVDaGlsZChub2RlKTtcblxuXHRcdFx0XHRsZXQgcXVlcnlOb2RlID0gbmV3IExpc3RIVE1MKHtcblx0XHRcdFx0XHR0YXJnZXQ6IHJvb3QsXG5cdFx0XHRcdFx0cHJvcHM6IHtcblx0XHRcdFx0XHRcdG1vZGVsOiBsc3Rcblx0XHRcdFx0XHR9XG5cdFx0XHRcdH0pO1xuXG5cdFx0XHRcdGNvbnN0IHdvcmtzcGFjZUxlYWYgPSByb290LmNsb3Nlc3QoXCIud29ya3NwYWNlLWxlYWZcIik7XG5cdFx0XHRcdHdvcmtzcGFjZUxlYWYuY2xhc3NMaXN0LmFkZChcImNvbnRhaW5zLXJlbWluZGVyLWxpc3RcIik7XG5cblx0XHRcdFx0Y29uc3QgaW5qZWN0aW9uID0ge1xuXHRcdFx0XHRcdGNvbXBvbmVudDogcXVlcnlOb2RlLFxuXHRcdFx0XHRcdHdvcmtzcGFjZUxlYWY6IHdvcmtzcGFjZUxlYWYsXG5cdFx0XHRcdH07XG5cblx0XHRcdFx0bG9nZ2VyKFxuXHRcdFx0XHRcdHRoaXMsXG5cdFx0XHRcdFx0XCJJbmplY3RlZCBpbnRvIE1haW4gUmVtaW5kZXJzLmFwcCBCbG9jay5cIixcblx0XHRcdFx0XHR7IGNvbnRleHQ6IGluamVjdGlvbiB9XG5cdFx0XHRcdCk7XG5cblx0XHRcdFx0dGhpcy5pbmplY3Rpb25zLnB1c2goaW5qZWN0aW9uKTtcblx0XHRcdH1cblx0XHRcdGVsc2Uge1xuXHRcdFx0XHRsb2dnZXIodGhpcywgXCJVTkRFRklORURcIiwgbm9kZSk7XG5cdFx0XHR9XG5cdFx0fVxuXHR9XG5cblxuXHRvbnVubG9hZCgpIHtcblx0XHRsb2dnZXIodGhpcywgXCJBcHBsZSBSZW1pbmRlcnMgUGx1Z2luIGlzIFVubG9hZGluZy4uLlwiKTtcblx0XHR0aGlzLm9ic2VydmVyLmRpc2Nvbm5lY3QoKTtcblx0XHR0aGlzLm9ic2VydmVyID0gbnVsbDtcblxuXHRcdHRoaXMuaW5qZWN0aW9ucy5mb3JFYWNoKChpbmplY3Rpb24pID0+IGluamVjdGlvbi5jb21wb25lbnQuJGRlc3Ryb3koKSk7XG5cdFx0dGhpcy5pbmplY3Rpb25zID0gW107XG5cblx0XHR0aGlzLmFwcC53b3Jrc3BhY2UuZ2V0TGVhdmVzT2ZUeXBlKFwiYXBwbGUtcmVtaW5kZXJzLWludGVyZmFjZVwiKS5mb3JFYWNoKChsZWFmKSA9PiBsZWFmLmRldGFjaCgpKTtcblx0fVxufSJdLCJuYW1lcyI6WyJZQU1MRXhjZXB0aW9uIiwidHlwZSIsIlR5cGUiLCJTY2hlbWEiLCJyZXF1aXJlJCQwIiwicmVxdWlyZSQkMSIsInJlcXVpcmUkJDIiLCJyZXF1aXJlJCQzIiwicmVxdWlyZSQkNCIsInJlcXVpcmUiLCJfdG9TdHJpbmciLCJfaGFzT3duUHJvcGVydHkiLCJyZXF1aXJlJCQ1IiwicmVxdWlyZSQkNiIsIl9yZXF1aXJlIiwiREVGQVVMVF9GVUxMX1NDSEVNQSIsIk1hcmsiLCJERUZBVUxUX1NBRkVfU0NIRU1BIiwiU3RhdGUiLCJyZXF1aXJlJCQ3IiwieWFtbCIsInBhcnNlIiwiQnVmZmVycyIsImFwcGxlc2NyaXB0IiwiYWRkSWNvbiIsIlBsdWdpbiIsIkxpc3RIVE1MIl0sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7Ozs7O0FBQUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQXFEQTtBQUNPLFNBQVMsU0FBUyxDQUFDLE9BQU8sRUFBRSxVQUFVLEVBQUUsQ0FBQyxFQUFFLFNBQVMsRUFBRTtBQUM3RCxJQUFJLFNBQVMsS0FBSyxDQUFDLEtBQUssRUFBRSxFQUFFLE9BQU8sS0FBSyxZQUFZLENBQUMsR0FBRyxLQUFLLEdBQUcsSUFBSSxDQUFDLENBQUMsVUFBVSxPQUFPLEVBQUUsRUFBRSxPQUFPLENBQUMsS0FBSyxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUMsRUFBRTtBQUNoSCxJQUFJLE9BQU8sS0FBSyxDQUFDLEtBQUssQ0FBQyxHQUFHLE9BQU8sQ0FBQyxFQUFFLFVBQVUsT0FBTyxFQUFFLE1BQU0sRUFBRTtBQUMvRCxRQUFRLFNBQVMsU0FBUyxDQUFDLEtBQUssRUFBRSxFQUFFLElBQUksRUFBRSxJQUFJLENBQUMsU0FBUyxDQUFDLElBQUksQ0FBQyxLQUFLLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxPQUFPLENBQUMsRUFBRSxFQUFFLE1BQU0sQ0FBQyxDQUFDLENBQUMsQ0FBQyxFQUFFLEVBQUU7QUFDbkcsUUFBUSxTQUFTLFFBQVEsQ0FBQyxLQUFLLEVBQUUsRUFBRSxJQUFJLEVBQUUsSUFBSSxDQUFDLFNBQVMsQ0FBQyxPQUFPLENBQUMsQ0FBQyxLQUFLLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxPQUFPLENBQUMsRUFBRSxFQUFFLE1BQU0sQ0FBQyxDQUFDLENBQUMsQ0FBQyxFQUFFLEVBQUU7QUFDdEcsUUFBUSxTQUFTLElBQUksQ0FBQyxNQUFNLEVBQUUsRUFBRSxNQUFNLENBQUMsSUFBSSxHQUFHLE9BQU8sQ0FBQyxNQUFNLENBQUMsS0FBSyxDQUFDLEdBQUcsS0FBSyxDQUFDLE1BQU0sQ0FBQyxLQUFLLENBQUMsQ0FBQyxJQUFJLENBQUMsU0FBUyxFQUFFLFFBQVEsQ0FBQyxDQUFDLEVBQUU7QUFDdEgsUUFBUSxJQUFJLENBQUMsQ0FBQyxTQUFTLEdBQUcsU0FBUyxDQUFDLEtBQUssQ0FBQyxPQUFPLEVBQUUsVUFBVSxJQUFJLEVBQUUsQ0FBQyxFQUFFLElBQUksRUFBRSxDQUFDLENBQUM7QUFDOUUsS0FBSyxDQUFDLENBQUM7QUFDUDs7QUN4RUEsU0FBUyxTQUFTLENBQUMsT0FBTyxFQUFFO0FBQzVCLEVBQUUsT0FBTyxDQUFDLE9BQU8sT0FBTyxLQUFLLFdBQVcsTUFBTSxPQUFPLEtBQUssSUFBSSxDQUFDLENBQUM7QUFDaEUsQ0FBQztBQUNEO0FBQ0E7QUFDQSxTQUFTLFFBQVEsQ0FBQyxPQUFPLEVBQUU7QUFDM0IsRUFBRSxPQUFPLENBQUMsT0FBTyxPQUFPLEtBQUssUUFBUSxNQUFNLE9BQU8sS0FBSyxJQUFJLENBQUMsQ0FBQztBQUM3RCxDQUFDO0FBQ0Q7QUFDQTtBQUNBLFNBQVMsT0FBTyxDQUFDLFFBQVEsRUFBRTtBQUMzQixFQUFFLElBQUksS0FBSyxDQUFDLE9BQU8sQ0FBQyxRQUFRLENBQUMsRUFBRSxPQUFPLFFBQVEsQ0FBQztBQUMvQyxPQUFPLElBQUksU0FBUyxDQUFDLFFBQVEsQ0FBQyxFQUFFLE9BQU8sRUFBRSxDQUFDO0FBQzFDO0FBQ0EsRUFBRSxPQUFPLEVBQUUsUUFBUSxFQUFFLENBQUM7QUFDdEIsQ0FBQztBQUNEO0FBQ0E7QUFDQSxTQUFTLE1BQU0sQ0FBQyxNQUFNLEVBQUUsTUFBTSxFQUFFO0FBQ2hDLEVBQUUsSUFBSSxLQUFLLEVBQUUsTUFBTSxFQUFFLEdBQUcsRUFBRSxVQUFVLENBQUM7QUFDckM7QUFDQSxFQUFFLElBQUksTUFBTSxFQUFFO0FBQ2QsSUFBSSxVQUFVLEdBQUcsTUFBTSxDQUFDLElBQUksQ0FBQyxNQUFNLENBQUMsQ0FBQztBQUNyQztBQUNBLElBQUksS0FBSyxLQUFLLEdBQUcsQ0FBQyxFQUFFLE1BQU0sR0FBRyxVQUFVLENBQUMsTUFBTSxFQUFFLEtBQUssR0FBRyxNQUFNLEVBQUUsS0FBSyxJQUFJLENBQUMsRUFBRTtBQUM1RSxNQUFNLEdBQUcsR0FBRyxVQUFVLENBQUMsS0FBSyxDQUFDLENBQUM7QUFDOUIsTUFBTSxNQUFNLENBQUMsR0FBRyxDQUFDLEdBQUcsTUFBTSxDQUFDLEdBQUcsQ0FBQyxDQUFDO0FBQ2hDLEtBQUs7QUFDTCxHQUFHO0FBQ0g7QUFDQSxFQUFFLE9BQU8sTUFBTSxDQUFDO0FBQ2hCLENBQUM7QUFDRDtBQUNBO0FBQ0EsU0FBUyxNQUFNLENBQUMsTUFBTSxFQUFFLEtBQUssRUFBRTtBQUMvQixFQUFFLElBQUksTUFBTSxHQUFHLEVBQUUsRUFBRSxLQUFLLENBQUM7QUFDekI7QUFDQSxFQUFFLEtBQUssS0FBSyxHQUFHLENBQUMsRUFBRSxLQUFLLEdBQUcsS0FBSyxFQUFFLEtBQUssSUFBSSxDQUFDLEVBQUU7QUFDN0MsSUFBSSxNQUFNLElBQUksTUFBTSxDQUFDO0FBQ3JCLEdBQUc7QUFDSDtBQUNBLEVBQUUsT0FBTyxNQUFNLENBQUM7QUFDaEIsQ0FBQztBQUNEO0FBQ0E7QUFDQSxTQUFTLGNBQWMsQ0FBQyxNQUFNLEVBQUU7QUFDaEMsRUFBRSxPQUFPLENBQUMsTUFBTSxLQUFLLENBQUMsTUFBTSxNQUFNLENBQUMsaUJBQWlCLEtBQUssQ0FBQyxHQUFHLE1BQU0sQ0FBQyxDQUFDO0FBQ3JFLENBQUM7QUFDRDtBQUNBO0FBQ0EsZUFBd0IsUUFBUSxTQUFTLENBQUM7QUFDMUMsY0FBdUIsU0FBUyxRQUFRLENBQUM7QUFDekMsYUFBc0IsVUFBVSxPQUFPLENBQUM7QUFDeEMsWUFBcUIsV0FBVyxNQUFNLENBQUM7QUFDdkMsb0JBQTZCLEdBQUcsY0FBYyxDQUFDO0FBQy9DLFlBQXFCLFdBQVcsTUFBTTs7Ozs7Ozs7Ozs7QUMxRHRDO0FBR0E7QUFDQSxTQUFTLGFBQWEsQ0FBQyxNQUFNLEVBQUUsSUFBSSxFQUFFO0FBQ3JDO0FBQ0EsRUFBRSxLQUFLLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxDQUFDO0FBQ25CO0FBQ0EsRUFBRSxJQUFJLENBQUMsSUFBSSxHQUFHLGVBQWUsQ0FBQztBQUM5QixFQUFFLElBQUksQ0FBQyxNQUFNLEdBQUcsTUFBTSxDQUFDO0FBQ3ZCLEVBQUUsSUFBSSxDQUFDLElBQUksR0FBRyxJQUFJLENBQUM7QUFDbkIsRUFBRSxJQUFJLENBQUMsT0FBTyxHQUFHLENBQUMsSUFBSSxDQUFDLE1BQU0sSUFBSSxrQkFBa0IsS0FBSyxJQUFJLENBQUMsSUFBSSxHQUFHLEdBQUcsR0FBRyxJQUFJLENBQUMsSUFBSSxDQUFDLFFBQVEsRUFBRSxHQUFHLEVBQUUsQ0FBQyxDQUFDO0FBQ3JHO0FBQ0E7QUFDQSxFQUFFLElBQUksS0FBSyxDQUFDLGlCQUFpQixFQUFFO0FBQy9CO0FBQ0EsSUFBSSxLQUFLLENBQUMsaUJBQWlCLENBQUMsSUFBSSxFQUFFLElBQUksQ0FBQyxXQUFXLENBQUMsQ0FBQztBQUNwRCxHQUFHLE1BQU07QUFDVDtBQUNBLElBQUksSUFBSSxDQUFDLEtBQUssR0FBRyxDQUFDLElBQUksS0FBSyxFQUFFLEVBQUUsS0FBSyxJQUFJLEVBQUUsQ0FBQztBQUMzQyxHQUFHO0FBQ0gsQ0FBQztBQUNEO0FBQ0E7QUFDQTtBQUNBLGFBQWEsQ0FBQyxTQUFTLEdBQUcsTUFBTSxDQUFDLE1BQU0sQ0FBQyxLQUFLLENBQUMsU0FBUyxDQUFDLENBQUM7QUFDekQsYUFBYSxDQUFDLFNBQVMsQ0FBQyxXQUFXLEdBQUcsYUFBYSxDQUFDO0FBQ3BEO0FBQ0E7QUFDQSxhQUFhLENBQUMsU0FBUyxDQUFDLFFBQVEsR0FBRyxTQUFTLFFBQVEsQ0FBQyxPQUFPLEVBQUU7QUFDOUQsRUFBRSxJQUFJLE1BQU0sR0FBRyxJQUFJLENBQUMsSUFBSSxHQUFHLElBQUksQ0FBQztBQUNoQztBQUNBLEVBQUUsTUFBTSxJQUFJLElBQUksQ0FBQyxNQUFNLElBQUksa0JBQWtCLENBQUM7QUFDOUM7QUFDQSxFQUFFLElBQUksQ0FBQyxPQUFPLElBQUksSUFBSSxDQUFDLElBQUksRUFBRTtBQUM3QixJQUFJLE1BQU0sSUFBSSxHQUFHLEdBQUcsSUFBSSxDQUFDLElBQUksQ0FBQyxRQUFRLEVBQUUsQ0FBQztBQUN6QyxHQUFHO0FBQ0g7QUFDQSxFQUFFLE9BQU8sTUFBTSxDQUFDO0FBQ2hCLENBQUMsQ0FBQztBQUNGO0FBQ0E7QUFDQSxhQUFjLEdBQUcsYUFBYTs7QUNwQzlCLFNBQVMsSUFBSSxDQUFDLElBQUksRUFBRSxNQUFNLEVBQUUsUUFBUSxFQUFFLElBQUksRUFBRSxNQUFNLEVBQUU7QUFDcEQsRUFBRSxJQUFJLENBQUMsSUFBSSxPQUFPLElBQUksQ0FBQztBQUN2QixFQUFFLElBQUksQ0FBQyxNQUFNLEtBQUssTUFBTSxDQUFDO0FBQ3pCLEVBQUUsSUFBSSxDQUFDLFFBQVEsR0FBRyxRQUFRLENBQUM7QUFDM0IsRUFBRSxJQUFJLENBQUMsSUFBSSxPQUFPLElBQUksQ0FBQztBQUN2QixFQUFFLElBQUksQ0FBQyxNQUFNLEtBQUssTUFBTSxDQUFDO0FBQ3pCLENBQUM7QUFDRDtBQUNBO0FBQ0EsSUFBSSxDQUFDLFNBQVMsQ0FBQyxVQUFVLEdBQUcsU0FBUyxVQUFVLENBQUMsTUFBTSxFQUFFLFNBQVMsRUFBRTtBQUNuRSxFQUFFLElBQUksSUFBSSxFQUFFLEtBQUssRUFBRSxJQUFJLEVBQUUsR0FBRyxFQUFFLE9BQU8sQ0FBQztBQUN0QztBQUNBLEVBQUUsSUFBSSxDQUFDLElBQUksQ0FBQyxNQUFNLEVBQUUsT0FBTyxJQUFJLENBQUM7QUFDaEM7QUFDQSxFQUFFLE1BQU0sR0FBRyxNQUFNLElBQUksQ0FBQyxDQUFDO0FBQ3ZCLEVBQUUsU0FBUyxHQUFHLFNBQVMsSUFBSSxFQUFFLENBQUM7QUFDOUI7QUFDQSxFQUFFLElBQUksR0FBRyxFQUFFLENBQUM7QUFDWixFQUFFLEtBQUssR0FBRyxJQUFJLENBQUMsUUFBUSxDQUFDO0FBQ3hCO0FBQ0EsRUFBRSxPQUFPLEtBQUssR0FBRyxDQUFDLElBQUksMEJBQTBCLENBQUMsT0FBTyxDQUFDLElBQUksQ0FBQyxNQUFNLENBQUMsTUFBTSxDQUFDLEtBQUssR0FBRyxDQUFDLENBQUMsQ0FBQyxLQUFLLENBQUMsQ0FBQyxFQUFFO0FBQ2hHLElBQUksS0FBSyxJQUFJLENBQUMsQ0FBQztBQUNmLElBQUksSUFBSSxJQUFJLENBQUMsUUFBUSxHQUFHLEtBQUssSUFBSSxTQUFTLEdBQUcsQ0FBQyxHQUFHLENBQUMsQ0FBQyxFQUFFO0FBQ3JELE1BQU0sSUFBSSxHQUFHLE9BQU8sQ0FBQztBQUNyQixNQUFNLEtBQUssSUFBSSxDQUFDLENBQUM7QUFDakIsTUFBTSxNQUFNO0FBQ1osS0FBSztBQUNMLEdBQUc7QUFDSDtBQUNBLEVBQUUsSUFBSSxHQUFHLEVBQUUsQ0FBQztBQUNaLEVBQUUsR0FBRyxHQUFHLElBQUksQ0FBQyxRQUFRLENBQUM7QUFDdEI7QUFDQSxFQUFFLE9BQU8sR0FBRyxHQUFHLElBQUksQ0FBQyxNQUFNLENBQUMsTUFBTSxJQUFJLDBCQUEwQixDQUFDLE9BQU8sQ0FBQyxJQUFJLENBQUMsTUFBTSxDQUFDLE1BQU0sQ0FBQyxHQUFHLENBQUMsQ0FBQyxLQUFLLENBQUMsQ0FBQyxFQUFFO0FBQ3pHLElBQUksR0FBRyxJQUFJLENBQUMsQ0FBQztBQUNiLElBQUksSUFBSSxHQUFHLEdBQUcsSUFBSSxDQUFDLFFBQVEsSUFBSSxTQUFTLEdBQUcsQ0FBQyxHQUFHLENBQUMsQ0FBQyxFQUFFO0FBQ25ELE1BQU0sSUFBSSxHQUFHLE9BQU8sQ0FBQztBQUNyQixNQUFNLEdBQUcsSUFBSSxDQUFDLENBQUM7QUFDZixNQUFNLE1BQU07QUFDWixLQUFLO0FBQ0wsR0FBRztBQUNIO0FBQ0EsRUFBRSxPQUFPLEdBQUcsSUFBSSxDQUFDLE1BQU0sQ0FBQyxLQUFLLENBQUMsS0FBSyxFQUFFLEdBQUcsQ0FBQyxDQUFDO0FBQzFDO0FBQ0EsRUFBRSxPQUFPLE1BQU0sQ0FBQyxNQUFNLENBQUMsR0FBRyxFQUFFLE1BQU0sQ0FBQyxHQUFHLElBQUksR0FBRyxPQUFPLEdBQUcsSUFBSSxHQUFHLElBQUk7QUFDbEUsU0FBUyxNQUFNLENBQUMsTUFBTSxDQUFDLEdBQUcsRUFBRSxNQUFNLEdBQUcsSUFBSSxDQUFDLFFBQVEsR0FBRyxLQUFLLEdBQUcsSUFBSSxDQUFDLE1BQU0sQ0FBQyxHQUFHLEdBQUcsQ0FBQztBQUNoRixDQUFDLENBQUM7QUFDRjtBQUNBO0FBQ0EsSUFBSSxDQUFDLFNBQVMsQ0FBQyxRQUFRLEdBQUcsU0FBUyxRQUFRLENBQUMsT0FBTyxFQUFFO0FBQ3JELEVBQUUsSUFBSSxPQUFPLEVBQUUsS0FBSyxHQUFHLEVBQUUsQ0FBQztBQUMxQjtBQUNBLEVBQUUsSUFBSSxJQUFJLENBQUMsSUFBSSxFQUFFO0FBQ2pCLElBQUksS0FBSyxJQUFJLE1BQU0sR0FBRyxJQUFJLENBQUMsSUFBSSxHQUFHLElBQUksQ0FBQztBQUN2QyxHQUFHO0FBQ0g7QUFDQSxFQUFFLEtBQUssSUFBSSxVQUFVLElBQUksSUFBSSxDQUFDLElBQUksR0FBRyxDQUFDLENBQUMsR0FBRyxXQUFXLElBQUksSUFBSSxDQUFDLE1BQU0sR0FBRyxDQUFDLENBQUMsQ0FBQztBQUMxRTtBQUNBLEVBQUUsSUFBSSxDQUFDLE9BQU8sRUFBRTtBQUNoQixJQUFJLE9BQU8sR0FBRyxJQUFJLENBQUMsVUFBVSxFQUFFLENBQUM7QUFDaEM7QUFDQSxJQUFJLElBQUksT0FBTyxFQUFFO0FBQ2pCLE1BQU0sS0FBSyxJQUFJLEtBQUssR0FBRyxPQUFPLENBQUM7QUFDL0IsS0FBSztBQUNMLEdBQUc7QUFDSDtBQUNBLEVBQUUsT0FBTyxLQUFLLENBQUM7QUFDZixDQUFDLENBQUM7QUFDRjtBQUNBO0FBQ0EsUUFBYyxHQUFHLElBQUk7O0FDdkVyQixJQUFJLHdCQUF3QixHQUFHO0FBQy9CLEVBQUUsTUFBTTtBQUNSLEVBQUUsU0FBUztBQUNYLEVBQUUsV0FBVztBQUNiLEVBQUUsWUFBWTtBQUNkLEVBQUUsV0FBVztBQUNiLEVBQUUsV0FBVztBQUNiLEVBQUUsY0FBYztBQUNoQixFQUFFLGNBQWM7QUFDaEIsQ0FBQyxDQUFDO0FBQ0Y7QUFDQSxJQUFJLGVBQWUsR0FBRztBQUN0QixFQUFFLFFBQVE7QUFDVixFQUFFLFVBQVU7QUFDWixFQUFFLFNBQVM7QUFDWCxDQUFDLENBQUM7QUFDRjtBQUNBLFNBQVMsbUJBQW1CLENBQUMsR0FBRyxFQUFFO0FBQ2xDLEVBQUUsSUFBSSxNQUFNLEdBQUcsRUFBRSxDQUFDO0FBQ2xCO0FBQ0EsRUFBRSxJQUFJLEdBQUcsS0FBSyxJQUFJLEVBQUU7QUFDcEIsSUFBSSxNQUFNLENBQUMsSUFBSSxDQUFDLEdBQUcsQ0FBQyxDQUFDLE9BQU8sQ0FBQyxVQUFVLEtBQUssRUFBRTtBQUM5QyxNQUFNLEdBQUcsQ0FBQyxLQUFLLENBQUMsQ0FBQyxPQUFPLENBQUMsVUFBVSxLQUFLLEVBQUU7QUFDMUMsUUFBUSxNQUFNLENBQUMsTUFBTSxDQUFDLEtBQUssQ0FBQyxDQUFDLEdBQUcsS0FBSyxDQUFDO0FBQ3RDLE9BQU8sQ0FBQyxDQUFDO0FBQ1QsS0FBSyxDQUFDLENBQUM7QUFDUCxHQUFHO0FBQ0g7QUFDQSxFQUFFLE9BQU8sTUFBTSxDQUFDO0FBQ2hCLENBQUM7QUFDRDtBQUNBLFNBQVMsSUFBSSxDQUFDLEdBQUcsRUFBRSxPQUFPLEVBQUU7QUFDNUIsRUFBRSxPQUFPLEdBQUcsT0FBTyxJQUFJLEVBQUUsQ0FBQztBQUMxQjtBQUNBLEVBQUUsTUFBTSxDQUFDLElBQUksQ0FBQyxPQUFPLENBQUMsQ0FBQyxPQUFPLENBQUMsVUFBVSxJQUFJLEVBQUU7QUFDL0MsSUFBSSxJQUFJLHdCQUF3QixDQUFDLE9BQU8sQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDLENBQUMsRUFBRTtBQUN2RCxNQUFNLE1BQU0sSUFBSUEsU0FBYSxDQUFDLGtCQUFrQixHQUFHLElBQUksR0FBRyw2QkFBNkIsR0FBRyxHQUFHLEdBQUcsY0FBYyxDQUFDLENBQUM7QUFDaEgsS0FBSztBQUNMLEdBQUcsQ0FBQyxDQUFDO0FBQ0w7QUFDQTtBQUNBLEVBQUUsSUFBSSxDQUFDLEdBQUcsWUFBWSxHQUFHLENBQUM7QUFDMUIsRUFBRSxJQUFJLENBQUMsSUFBSSxXQUFXLE9BQU8sQ0FBQyxNQUFNLENBQUMsWUFBWSxJQUFJLENBQUM7QUFDdEQsRUFBRSxJQUFJLENBQUMsT0FBTyxRQUFRLE9BQU8sQ0FBQyxTQUFTLENBQUMsU0FBUyxZQUFZLEVBQUUsT0FBTyxJQUFJLENBQUMsRUFBRSxDQUFDO0FBQzlFLEVBQUUsSUFBSSxDQUFDLFNBQVMsTUFBTSxPQUFPLENBQUMsV0FBVyxDQUFDLE9BQU8sVUFBVSxJQUFJLEVBQUUsRUFBRSxPQUFPLElBQUksQ0FBQyxFQUFFLENBQUM7QUFDbEYsRUFBRSxJQUFJLENBQUMsVUFBVSxLQUFLLE9BQU8sQ0FBQyxZQUFZLENBQUMsTUFBTSxJQUFJLENBQUM7QUFDdEQsRUFBRSxJQUFJLENBQUMsU0FBUyxNQUFNLE9BQU8sQ0FBQyxXQUFXLENBQUMsT0FBTyxJQUFJLENBQUM7QUFDdEQsRUFBRSxJQUFJLENBQUMsU0FBUyxNQUFNLE9BQU8sQ0FBQyxXQUFXLENBQUMsT0FBTyxJQUFJLENBQUM7QUFDdEQsRUFBRSxJQUFJLENBQUMsWUFBWSxHQUFHLE9BQU8sQ0FBQyxjQUFjLENBQUMsSUFBSSxJQUFJLENBQUM7QUFDdEQsRUFBRSxJQUFJLENBQUMsWUFBWSxHQUFHLG1CQUFtQixDQUFDLE9BQU8sQ0FBQyxjQUFjLENBQUMsSUFBSSxJQUFJLENBQUMsQ0FBQztBQUMzRTtBQUNBLEVBQUUsSUFBSSxlQUFlLENBQUMsT0FBTyxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDLENBQUMsRUFBRTtBQUNqRCxJQUFJLE1BQU0sSUFBSUEsU0FBYSxDQUFDLGdCQUFnQixHQUFHLElBQUksQ0FBQyxJQUFJLEdBQUcsc0JBQXNCLEdBQUcsR0FBRyxHQUFHLGNBQWMsQ0FBQyxDQUFDO0FBQzFHLEdBQUc7QUFDSCxDQUFDO0FBQ0Q7QUFDQSxRQUFjLEdBQUcsSUFBSTs7QUMxRHJCO0FBQ0E7QUFDd0M7QUFDRztBQUNMO0FBQ3RDO0FBQ0E7QUFDQSxTQUFTLFdBQVcsQ0FBQyxNQUFNLEVBQUUsSUFBSSxFQUFFLE1BQU0sRUFBRTtBQUMzQyxFQUFFLElBQUksT0FBTyxHQUFHLEVBQUUsQ0FBQztBQUNuQjtBQUNBLEVBQUUsTUFBTSxDQUFDLE9BQU8sQ0FBQyxPQUFPLENBQUMsVUFBVSxjQUFjLEVBQUU7QUFDbkQsSUFBSSxNQUFNLEdBQUcsV0FBVyxDQUFDLGNBQWMsRUFBRSxJQUFJLEVBQUUsTUFBTSxDQUFDLENBQUM7QUFDdkQsR0FBRyxDQUFDLENBQUM7QUFDTDtBQUNBLEVBQUUsTUFBTSxDQUFDLElBQUksQ0FBQyxDQUFDLE9BQU8sQ0FBQyxVQUFVLFdBQVcsRUFBRTtBQUM5QyxJQUFJLE1BQU0sQ0FBQyxPQUFPLENBQUMsVUFBVSxZQUFZLEVBQUUsYUFBYSxFQUFFO0FBQzFELE1BQU0sSUFBSSxZQUFZLENBQUMsR0FBRyxLQUFLLFdBQVcsQ0FBQyxHQUFHLElBQUksWUFBWSxDQUFDLElBQUksS0FBSyxXQUFXLENBQUMsSUFBSSxFQUFFO0FBQzFGLFFBQVEsT0FBTyxDQUFDLElBQUksQ0FBQyxhQUFhLENBQUMsQ0FBQztBQUNwQyxPQUFPO0FBQ1AsS0FBSyxDQUFDLENBQUM7QUFDUDtBQUNBLElBQUksTUFBTSxDQUFDLElBQUksQ0FBQyxXQUFXLENBQUMsQ0FBQztBQUM3QixHQUFHLENBQUMsQ0FBQztBQUNMO0FBQ0EsRUFBRSxPQUFPLE1BQU0sQ0FBQyxNQUFNLENBQUMsVUFBVSxJQUFJLEVBQUUsS0FBSyxFQUFFO0FBQzlDLElBQUksT0FBTyxPQUFPLENBQUMsT0FBTyxDQUFDLEtBQUssQ0FBQyxLQUFLLENBQUMsQ0FBQyxDQUFDO0FBQ3pDLEdBQUcsQ0FBQyxDQUFDO0FBQ0wsQ0FBQztBQUNEO0FBQ0E7QUFDQSxTQUFTLFVBQVUsaUJBQWlCO0FBQ3BDLEVBQUUsSUFBSSxNQUFNLEdBQUc7QUFDZixRQUFRLE1BQU0sRUFBRSxFQUFFO0FBQ2xCLFFBQVEsUUFBUSxFQUFFLEVBQUU7QUFDcEIsUUFBUSxPQUFPLEVBQUUsRUFBRTtBQUNuQixRQUFRLFFBQVEsRUFBRSxFQUFFO0FBQ3BCLE9BQU8sRUFBRSxLQUFLLEVBQUUsTUFBTSxDQUFDO0FBQ3ZCO0FBQ0EsRUFBRSxTQUFTLFdBQVcsQ0FBQyxJQUFJLEVBQUU7QUFDN0IsSUFBSSxNQUFNLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxDQUFDLElBQUksQ0FBQyxHQUFHLENBQUMsR0FBRyxNQUFNLENBQUMsVUFBVSxDQUFDLENBQUMsSUFBSSxDQUFDLEdBQUcsQ0FBQyxHQUFHLElBQUksQ0FBQztBQUN0RSxHQUFHO0FBQ0g7QUFDQSxFQUFFLEtBQUssS0FBSyxHQUFHLENBQUMsRUFBRSxNQUFNLEdBQUcsU0FBUyxDQUFDLE1BQU0sRUFBRSxLQUFLLEdBQUcsTUFBTSxFQUFFLEtBQUssSUFBSSxDQUFDLEVBQUU7QUFDekUsSUFBSSxTQUFTLENBQUMsS0FBSyxDQUFDLENBQUMsT0FBTyxDQUFDLFdBQVcsQ0FBQyxDQUFDO0FBQzFDLEdBQUc7QUFDSCxFQUFFLE9BQU8sTUFBTSxDQUFDO0FBQ2hCLENBQUM7QUFDRDtBQUNBO0FBQ0EsU0FBUyxNQUFNLENBQUMsVUFBVSxFQUFFO0FBQzVCLEVBQUUsSUFBSSxDQUFDLE9BQU8sSUFBSSxVQUFVLENBQUMsT0FBTyxLQUFLLEVBQUUsQ0FBQztBQUM1QyxFQUFFLElBQUksQ0FBQyxRQUFRLEdBQUcsVUFBVSxDQUFDLFFBQVEsSUFBSSxFQUFFLENBQUM7QUFDNUMsRUFBRSxJQUFJLENBQUMsUUFBUSxHQUFHLFVBQVUsQ0FBQyxRQUFRLElBQUksRUFBRSxDQUFDO0FBQzVDO0FBQ0EsRUFBRSxJQUFJLENBQUMsUUFBUSxDQUFDLE9BQU8sQ0FBQyxVQUFVLElBQUksRUFBRTtBQUN4QyxJQUFJLElBQUksSUFBSSxDQUFDLFFBQVEsSUFBSSxJQUFJLENBQUMsUUFBUSxLQUFLLFFBQVEsRUFBRTtBQUNyRCxNQUFNLE1BQU0sSUFBSUEsU0FBYSxDQUFDLGlIQUFpSCxDQUFDLENBQUM7QUFDakosS0FBSztBQUNMLEdBQUcsQ0FBQyxDQUFDO0FBQ0w7QUFDQSxFQUFFLElBQUksQ0FBQyxnQkFBZ0IsR0FBRyxXQUFXLENBQUMsSUFBSSxFQUFFLFVBQVUsRUFBRSxFQUFFLENBQUMsQ0FBQztBQUM1RCxFQUFFLElBQUksQ0FBQyxnQkFBZ0IsR0FBRyxXQUFXLENBQUMsSUFBSSxFQUFFLFVBQVUsRUFBRSxFQUFFLENBQUMsQ0FBQztBQUM1RCxFQUFFLElBQUksQ0FBQyxlQUFlLElBQUksVUFBVSxDQUFDLElBQUksQ0FBQyxnQkFBZ0IsRUFBRSxJQUFJLENBQUMsZ0JBQWdCLENBQUMsQ0FBQztBQUNuRixDQUFDO0FBQ0Q7QUFDQTtBQUNBLE1BQU0sQ0FBQyxPQUFPLEdBQUcsSUFBSSxDQUFDO0FBQ3RCO0FBQ0E7QUFDQSxNQUFNLENBQUMsTUFBTSxHQUFHLFNBQVMsWUFBWSxHQUFHO0FBQ3hDLEVBQUUsSUFBSSxPQUFPLEVBQUUsS0FBSyxDQUFDO0FBQ3JCO0FBQ0EsRUFBRSxRQUFRLFNBQVMsQ0FBQyxNQUFNO0FBQzFCLElBQUksS0FBSyxDQUFDO0FBQ1YsTUFBTSxPQUFPLEdBQUcsTUFBTSxDQUFDLE9BQU8sQ0FBQztBQUMvQixNQUFNLEtBQUssR0FBRyxTQUFTLENBQUMsQ0FBQyxDQUFDLENBQUM7QUFDM0IsTUFBTSxNQUFNO0FBQ1o7QUFDQSxJQUFJLEtBQUssQ0FBQztBQUNWLE1BQU0sT0FBTyxHQUFHLFNBQVMsQ0FBQyxDQUFDLENBQUMsQ0FBQztBQUM3QixNQUFNLEtBQUssR0FBRyxTQUFTLENBQUMsQ0FBQyxDQUFDLENBQUM7QUFDM0IsTUFBTSxNQUFNO0FBQ1o7QUFDQSxJQUFJO0FBQ0osTUFBTSxNQUFNLElBQUlBLFNBQWEsQ0FBQyxzREFBc0QsQ0FBQyxDQUFDO0FBQ3RGLEdBQUc7QUFDSDtBQUNBLEVBQUUsT0FBTyxHQUFHLE1BQU0sQ0FBQyxPQUFPLENBQUMsT0FBTyxDQUFDLENBQUM7QUFDcEMsRUFBRSxLQUFLLEdBQUcsTUFBTSxDQUFDLE9BQU8sQ0FBQyxLQUFLLENBQUMsQ0FBQztBQUNoQztBQUNBLEVBQUUsSUFBSSxDQUFDLE9BQU8sQ0FBQyxLQUFLLENBQUMsVUFBVSxNQUFNLEVBQUUsRUFBRSxPQUFPLE1BQU0sWUFBWSxNQUFNLENBQUMsRUFBRSxDQUFDLEVBQUU7QUFDOUUsSUFBSSxNQUFNLElBQUlBLFNBQWEsQ0FBQywyRkFBMkYsQ0FBQyxDQUFDO0FBQ3pILEdBQUc7QUFDSDtBQUNBLEVBQUUsSUFBSSxDQUFDLEtBQUssQ0FBQyxLQUFLLENBQUMsVUFBVUMsTUFBSSxFQUFFLEVBQUUsT0FBT0EsTUFBSSxZQUFZQyxJQUFJLENBQUMsRUFBRSxDQUFDLEVBQUU7QUFDdEUsSUFBSSxNQUFNLElBQUlGLFNBQWEsQ0FBQyxvRkFBb0YsQ0FBQyxDQUFDO0FBQ2xILEdBQUc7QUFDSDtBQUNBLEVBQUUsT0FBTyxJQUFJLE1BQU0sQ0FBQztBQUNwQixJQUFJLE9BQU8sRUFBRSxPQUFPO0FBQ3BCLElBQUksUUFBUSxFQUFFLEtBQUs7QUFDbkIsR0FBRyxDQUFDLENBQUM7QUFDTCxDQUFDLENBQUM7QUFDRjtBQUNBO0FBQ0EsVUFBYyxHQUFHLE1BQU07O0FDdkd2QixPQUFjLEdBQUcsSUFBSUUsSUFBSSxDQUFDLHVCQUF1QixFQUFFO0FBQ25ELEVBQUUsSUFBSSxFQUFFLFFBQVE7QUFDaEIsRUFBRSxTQUFTLEVBQUUsVUFBVSxJQUFJLEVBQUUsRUFBRSxPQUFPLElBQUksS0FBSyxJQUFJLEdBQUcsSUFBSSxHQUFHLEVBQUUsQ0FBQyxFQUFFO0FBQ2xFLENBQUMsQ0FBQzs7QUNIRixPQUFjLEdBQUcsSUFBSUEsSUFBSSxDQUFDLHVCQUF1QixFQUFFO0FBQ25ELEVBQUUsSUFBSSxFQUFFLFVBQVU7QUFDbEIsRUFBRSxTQUFTLEVBQUUsVUFBVSxJQUFJLEVBQUUsRUFBRSxPQUFPLElBQUksS0FBSyxJQUFJLEdBQUcsSUFBSSxHQUFHLEVBQUUsQ0FBQyxFQUFFO0FBQ2xFLENBQUMsQ0FBQzs7QUNIRixPQUFjLEdBQUcsSUFBSUEsSUFBSSxDQUFDLHVCQUF1QixFQUFFO0FBQ25ELEVBQUUsSUFBSSxFQUFFLFNBQVM7QUFDakIsRUFBRSxTQUFTLEVBQUUsVUFBVSxJQUFJLEVBQUUsRUFBRSxPQUFPLElBQUksS0FBSyxJQUFJLEdBQUcsSUFBSSxHQUFHLEVBQUUsQ0FBQyxFQUFFO0FBQ2xFLENBQUMsQ0FBQzs7QUNHRixZQUFjLEdBQUcsSUFBSUMsTUFBTSxDQUFDO0FBQzVCLEVBQUUsUUFBUSxFQUFFO0FBQ1osSUFBSUMsR0FBc0I7QUFDMUIsSUFBSUMsR0FBc0I7QUFDMUIsSUFBSUMsR0FBc0I7QUFDMUIsR0FBRztBQUNILENBQUMsQ0FBQzs7QUNaRixTQUFTLGVBQWUsQ0FBQyxJQUFJLEVBQUU7QUFDL0IsRUFBRSxJQUFJLElBQUksS0FBSyxJQUFJLEVBQUUsT0FBTyxJQUFJLENBQUM7QUFDakM7QUFDQSxFQUFFLElBQUksR0FBRyxHQUFHLElBQUksQ0FBQyxNQUFNLENBQUM7QUFDeEI7QUFDQSxFQUFFLE9BQU8sQ0FBQyxHQUFHLEtBQUssQ0FBQyxJQUFJLElBQUksS0FBSyxHQUFHO0FBQ25DLFVBQVUsR0FBRyxLQUFLLENBQUMsS0FBSyxJQUFJLEtBQUssTUFBTSxJQUFJLElBQUksS0FBSyxNQUFNLElBQUksSUFBSSxLQUFLLE1BQU0sQ0FBQyxDQUFDLENBQUM7QUFDaEYsQ0FBQztBQUNEO0FBQ0EsU0FBUyxpQkFBaUIsR0FBRztBQUM3QixFQUFFLE9BQU8sSUFBSSxDQUFDO0FBQ2QsQ0FBQztBQUNEO0FBQ0EsU0FBUyxNQUFNLENBQUMsTUFBTSxFQUFFO0FBQ3hCLEVBQUUsT0FBTyxNQUFNLEtBQUssSUFBSSxDQUFDO0FBQ3pCLENBQUM7QUFDRDtBQUNBLFNBQWMsR0FBRyxJQUFJSixJQUFJLENBQUMsd0JBQXdCLEVBQUU7QUFDcEQsRUFBRSxJQUFJLEVBQUUsUUFBUTtBQUNoQixFQUFFLE9BQU8sRUFBRSxlQUFlO0FBQzFCLEVBQUUsU0FBUyxFQUFFLGlCQUFpQjtBQUM5QixFQUFFLFNBQVMsRUFBRSxNQUFNO0FBQ25CLEVBQUUsU0FBUyxFQUFFO0FBQ2IsSUFBSSxTQUFTLEVBQUUsWUFBWSxFQUFFLE9BQU8sR0FBRyxDQUFDLEtBQUs7QUFDN0MsSUFBSSxTQUFTLEVBQUUsWUFBWSxFQUFFLE9BQU8sTUFBTSxDQUFDLEVBQUU7QUFDN0MsSUFBSSxTQUFTLEVBQUUsWUFBWSxFQUFFLE9BQU8sTUFBTSxDQUFDLEVBQUU7QUFDN0MsSUFBSSxTQUFTLEVBQUUsWUFBWSxFQUFFLE9BQU8sTUFBTSxDQUFDLEVBQUU7QUFDN0MsR0FBRztBQUNILEVBQUUsWUFBWSxFQUFFLFdBQVc7QUFDM0IsQ0FBQyxDQUFDOztBQzdCRixTQUFTLGtCQUFrQixDQUFDLElBQUksRUFBRTtBQUNsQyxFQUFFLElBQUksSUFBSSxLQUFLLElBQUksRUFBRSxPQUFPLEtBQUssQ0FBQztBQUNsQztBQUNBLEVBQUUsSUFBSSxHQUFHLEdBQUcsSUFBSSxDQUFDLE1BQU0sQ0FBQztBQUN4QjtBQUNBLEVBQUUsT0FBTyxDQUFDLEdBQUcsS0FBSyxDQUFDLEtBQUssSUFBSSxLQUFLLE1BQU0sSUFBSSxJQUFJLEtBQUssTUFBTSxJQUFJLElBQUksS0FBSyxNQUFNLENBQUM7QUFDOUUsVUFBVSxHQUFHLEtBQUssQ0FBQyxLQUFLLElBQUksS0FBSyxPQUFPLElBQUksSUFBSSxLQUFLLE9BQU8sSUFBSSxJQUFJLEtBQUssT0FBTyxDQUFDLENBQUMsQ0FBQztBQUNuRixDQUFDO0FBQ0Q7QUFDQSxTQUFTLG9CQUFvQixDQUFDLElBQUksRUFBRTtBQUNwQyxFQUFFLE9BQU8sSUFBSSxLQUFLLE1BQU07QUFDeEIsU0FBUyxJQUFJLEtBQUssTUFBTTtBQUN4QixTQUFTLElBQUksS0FBSyxNQUFNLENBQUM7QUFDekIsQ0FBQztBQUNEO0FBQ0EsU0FBUyxTQUFTLENBQUMsTUFBTSxFQUFFO0FBQzNCLEVBQUUsT0FBTyxNQUFNLENBQUMsU0FBUyxDQUFDLFFBQVEsQ0FBQyxJQUFJLENBQUMsTUFBTSxDQUFDLEtBQUssa0JBQWtCLENBQUM7QUFDdkUsQ0FBQztBQUNEO0FBQ0EsUUFBYyxHQUFHLElBQUlBLElBQUksQ0FBQyx3QkFBd0IsRUFBRTtBQUNwRCxFQUFFLElBQUksRUFBRSxRQUFRO0FBQ2hCLEVBQUUsT0FBTyxFQUFFLGtCQUFrQjtBQUM3QixFQUFFLFNBQVMsRUFBRSxvQkFBb0I7QUFDakMsRUFBRSxTQUFTLEVBQUUsU0FBUztBQUN0QixFQUFFLFNBQVMsRUFBRTtBQUNiLElBQUksU0FBUyxFQUFFLFVBQVUsTUFBTSxFQUFFLEVBQUUsT0FBTyxNQUFNLEdBQUcsTUFBTSxHQUFHLE9BQU8sQ0FBQyxFQUFFO0FBQ3RFLElBQUksU0FBUyxFQUFFLFVBQVUsTUFBTSxFQUFFLEVBQUUsT0FBTyxNQUFNLEdBQUcsTUFBTSxHQUFHLE9BQU8sQ0FBQyxFQUFFO0FBQ3RFLElBQUksU0FBUyxFQUFFLFVBQVUsTUFBTSxFQUFFLEVBQUUsT0FBTyxNQUFNLEdBQUcsTUFBTSxHQUFHLE9BQU8sQ0FBQyxFQUFFO0FBQ3RFLEdBQUc7QUFDSCxFQUFFLFlBQVksRUFBRSxXQUFXO0FBQzNCLENBQUMsQ0FBQzs7QUM3QkYsU0FBUyxTQUFTLENBQUMsQ0FBQyxFQUFFO0FBQ3RCLEVBQUUsT0FBTyxDQUFDLENBQUMsSUFBSSxXQUFXLENBQUMsTUFBTSxDQUFDLElBQUksSUFBSSxRQUFRO0FBQ2xELFVBQVUsQ0FBQyxJQUFJLFdBQVcsQ0FBQyxNQUFNLENBQUMsSUFBSSxJQUFJLFFBQVEsQ0FBQztBQUNuRCxVQUFVLENBQUMsSUFBSSxXQUFXLENBQUMsTUFBTSxDQUFDLElBQUksSUFBSSxRQUFRLENBQUMsQ0FBQztBQUNwRCxDQUFDO0FBQ0Q7QUFDQSxTQUFTLFNBQVMsQ0FBQyxDQUFDLEVBQUU7QUFDdEIsRUFBRSxRQUFRLENBQUMsSUFBSSxXQUFXLENBQUMsTUFBTSxDQUFDLElBQUksSUFBSSxRQUFRLEVBQUU7QUFDcEQsQ0FBQztBQUNEO0FBQ0EsU0FBUyxTQUFTLENBQUMsQ0FBQyxFQUFFO0FBQ3RCLEVBQUUsUUFBUSxDQUFDLElBQUksV0FBVyxDQUFDLE1BQU0sQ0FBQyxJQUFJLElBQUksUUFBUSxFQUFFO0FBQ3BELENBQUM7QUFDRDtBQUNBLFNBQVMsa0JBQWtCLENBQUMsSUFBSSxFQUFFO0FBQ2xDLEVBQUUsSUFBSSxJQUFJLEtBQUssSUFBSSxFQUFFLE9BQU8sS0FBSyxDQUFDO0FBQ2xDO0FBQ0EsRUFBRSxJQUFJLEdBQUcsR0FBRyxJQUFJLENBQUMsTUFBTTtBQUN2QixNQUFNLEtBQUssR0FBRyxDQUFDO0FBQ2YsTUFBTSxTQUFTLEdBQUcsS0FBSztBQUN2QixNQUFNLEVBQUUsQ0FBQztBQUNUO0FBQ0EsRUFBRSxJQUFJLENBQUMsR0FBRyxFQUFFLE9BQU8sS0FBSyxDQUFDO0FBQ3pCO0FBQ0EsRUFBRSxFQUFFLEdBQUcsSUFBSSxDQUFDLEtBQUssQ0FBQyxDQUFDO0FBQ25CO0FBQ0E7QUFDQSxFQUFFLElBQUksRUFBRSxLQUFLLEdBQUcsSUFBSSxFQUFFLEtBQUssR0FBRyxFQUFFO0FBQ2hDLElBQUksRUFBRSxHQUFHLElBQUksQ0FBQyxFQUFFLEtBQUssQ0FBQyxDQUFDO0FBQ3ZCLEdBQUc7QUFDSDtBQUNBLEVBQUUsSUFBSSxFQUFFLEtBQUssR0FBRyxFQUFFO0FBQ2xCO0FBQ0EsSUFBSSxJQUFJLEtBQUssR0FBRyxDQUFDLEtBQUssR0FBRyxFQUFFLE9BQU8sSUFBSSxDQUFDO0FBQ3ZDLElBQUksRUFBRSxHQUFHLElBQUksQ0FBQyxFQUFFLEtBQUssQ0FBQyxDQUFDO0FBQ3ZCO0FBQ0E7QUFDQTtBQUNBLElBQUksSUFBSSxFQUFFLEtBQUssR0FBRyxFQUFFO0FBQ3BCO0FBQ0EsTUFBTSxLQUFLLEVBQUUsQ0FBQztBQUNkO0FBQ0EsTUFBTSxPQUFPLEtBQUssR0FBRyxHQUFHLEVBQUUsS0FBSyxFQUFFLEVBQUU7QUFDbkMsUUFBUSxFQUFFLEdBQUcsSUFBSSxDQUFDLEtBQUssQ0FBQyxDQUFDO0FBQ3pCLFFBQVEsSUFBSSxFQUFFLEtBQUssR0FBRyxFQUFFLFNBQVM7QUFDakMsUUFBUSxJQUFJLEVBQUUsS0FBSyxHQUFHLElBQUksRUFBRSxLQUFLLEdBQUcsRUFBRSxPQUFPLEtBQUssQ0FBQztBQUNuRCxRQUFRLFNBQVMsR0FBRyxJQUFJLENBQUM7QUFDekIsT0FBTztBQUNQLE1BQU0sT0FBTyxTQUFTLElBQUksRUFBRSxLQUFLLEdBQUcsQ0FBQztBQUNyQyxLQUFLO0FBQ0w7QUFDQTtBQUNBLElBQUksSUFBSSxFQUFFLEtBQUssR0FBRyxFQUFFO0FBQ3BCO0FBQ0EsTUFBTSxLQUFLLEVBQUUsQ0FBQztBQUNkO0FBQ0EsTUFBTSxPQUFPLEtBQUssR0FBRyxHQUFHLEVBQUUsS0FBSyxFQUFFLEVBQUU7QUFDbkMsUUFBUSxFQUFFLEdBQUcsSUFBSSxDQUFDLEtBQUssQ0FBQyxDQUFDO0FBQ3pCLFFBQVEsSUFBSSxFQUFFLEtBQUssR0FBRyxFQUFFLFNBQVM7QUFDakMsUUFBUSxJQUFJLENBQUMsU0FBUyxDQUFDLElBQUksQ0FBQyxVQUFVLENBQUMsS0FBSyxDQUFDLENBQUMsRUFBRSxPQUFPLEtBQUssQ0FBQztBQUM3RCxRQUFRLFNBQVMsR0FBRyxJQUFJLENBQUM7QUFDekIsT0FBTztBQUNQLE1BQU0sT0FBTyxTQUFTLElBQUksRUFBRSxLQUFLLEdBQUcsQ0FBQztBQUNyQyxLQUFLO0FBQ0w7QUFDQTtBQUNBLElBQUksT0FBTyxLQUFLLEdBQUcsR0FBRyxFQUFFLEtBQUssRUFBRSxFQUFFO0FBQ2pDLE1BQU0sRUFBRSxHQUFHLElBQUksQ0FBQyxLQUFLLENBQUMsQ0FBQztBQUN2QixNQUFNLElBQUksRUFBRSxLQUFLLEdBQUcsRUFBRSxTQUFTO0FBQy9CLE1BQU0sSUFBSSxDQUFDLFNBQVMsQ0FBQyxJQUFJLENBQUMsVUFBVSxDQUFDLEtBQUssQ0FBQyxDQUFDLEVBQUUsT0FBTyxLQUFLLENBQUM7QUFDM0QsTUFBTSxTQUFTLEdBQUcsSUFBSSxDQUFDO0FBQ3ZCLEtBQUs7QUFDTCxJQUFJLE9BQU8sU0FBUyxJQUFJLEVBQUUsS0FBSyxHQUFHLENBQUM7QUFDbkMsR0FBRztBQUNIO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsRUFBRSxJQUFJLEVBQUUsS0FBSyxHQUFHLEVBQUUsT0FBTyxLQUFLLENBQUM7QUFDL0I7QUFDQSxFQUFFLE9BQU8sS0FBSyxHQUFHLEdBQUcsRUFBRSxLQUFLLEVBQUUsRUFBRTtBQUMvQixJQUFJLEVBQUUsR0FBRyxJQUFJLENBQUMsS0FBSyxDQUFDLENBQUM7QUFDckIsSUFBSSxJQUFJLEVBQUUsS0FBSyxHQUFHLEVBQUUsU0FBUztBQUM3QixJQUFJLElBQUksRUFBRSxLQUFLLEdBQUcsRUFBRSxNQUFNO0FBQzFCLElBQUksSUFBSSxDQUFDLFNBQVMsQ0FBQyxJQUFJLENBQUMsVUFBVSxDQUFDLEtBQUssQ0FBQyxDQUFDLEVBQUU7QUFDNUMsTUFBTSxPQUFPLEtBQUssQ0FBQztBQUNuQixLQUFLO0FBQ0wsSUFBSSxTQUFTLEdBQUcsSUFBSSxDQUFDO0FBQ3JCLEdBQUc7QUFDSDtBQUNBO0FBQ0EsRUFBRSxJQUFJLENBQUMsU0FBUyxJQUFJLEVBQUUsS0FBSyxHQUFHLEVBQUUsT0FBTyxLQUFLLENBQUM7QUFDN0M7QUFDQTtBQUNBLEVBQUUsSUFBSSxFQUFFLEtBQUssR0FBRyxFQUFFLE9BQU8sSUFBSSxDQUFDO0FBQzlCO0FBQ0E7QUFDQSxFQUFFLE9BQU8sbUJBQW1CLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxLQUFLLENBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQztBQUNyRCxDQUFDO0FBQ0Q7QUFDQSxTQUFTLG9CQUFvQixDQUFDLElBQUksRUFBRTtBQUNwQyxFQUFFLElBQUksS0FBSyxHQUFHLElBQUksRUFBRSxJQUFJLEdBQUcsQ0FBQyxFQUFFLEVBQUUsRUFBRSxJQUFJLEVBQUUsTUFBTSxHQUFHLEVBQUUsQ0FBQztBQUNwRDtBQUNBLEVBQUUsSUFBSSxLQUFLLENBQUMsT0FBTyxDQUFDLEdBQUcsQ0FBQyxLQUFLLENBQUMsQ0FBQyxFQUFFO0FBQ2pDLElBQUksS0FBSyxHQUFHLEtBQUssQ0FBQyxPQUFPLENBQUMsSUFBSSxFQUFFLEVBQUUsQ0FBQyxDQUFDO0FBQ3BDLEdBQUc7QUFDSDtBQUNBLEVBQUUsRUFBRSxHQUFHLEtBQUssQ0FBQyxDQUFDLENBQUMsQ0FBQztBQUNoQjtBQUNBLEVBQUUsSUFBSSxFQUFFLEtBQUssR0FBRyxJQUFJLEVBQUUsS0FBSyxHQUFHLEVBQUU7QUFDaEMsSUFBSSxJQUFJLEVBQUUsS0FBSyxHQUFHLEVBQUUsSUFBSSxHQUFHLENBQUMsQ0FBQyxDQUFDO0FBQzlCLElBQUksS0FBSyxHQUFHLEtBQUssQ0FBQyxLQUFLLENBQUMsQ0FBQyxDQUFDLENBQUM7QUFDM0IsSUFBSSxFQUFFLEdBQUcsS0FBSyxDQUFDLENBQUMsQ0FBQyxDQUFDO0FBQ2xCLEdBQUc7QUFDSDtBQUNBLEVBQUUsSUFBSSxLQUFLLEtBQUssR0FBRyxFQUFFLE9BQU8sQ0FBQyxDQUFDO0FBQzlCO0FBQ0EsRUFBRSxJQUFJLEVBQUUsS0FBSyxHQUFHLEVBQUU7QUFDbEIsSUFBSSxJQUFJLEtBQUssQ0FBQyxDQUFDLENBQUMsS0FBSyxHQUFHLEVBQUUsT0FBTyxJQUFJLEdBQUcsUUFBUSxDQUFDLEtBQUssQ0FBQyxLQUFLLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUM7QUFDcEUsSUFBSSxJQUFJLEtBQUssQ0FBQyxDQUFDLENBQUMsS0FBSyxHQUFHLEVBQUUsT0FBTyxJQUFJLEdBQUcsUUFBUSxDQUFDLEtBQUssRUFBRSxFQUFFLENBQUMsQ0FBQztBQUM1RCxJQUFJLE9BQU8sSUFBSSxHQUFHLFFBQVEsQ0FBQyxLQUFLLEVBQUUsQ0FBQyxDQUFDLENBQUM7QUFDckMsR0FBRztBQUNIO0FBQ0EsRUFBRSxJQUFJLEtBQUssQ0FBQyxPQUFPLENBQUMsR0FBRyxDQUFDLEtBQUssQ0FBQyxDQUFDLEVBQUU7QUFDakMsSUFBSSxLQUFLLENBQUMsS0FBSyxDQUFDLEdBQUcsQ0FBQyxDQUFDLE9BQU8sQ0FBQyxVQUFVLENBQUMsRUFBRTtBQUMxQyxNQUFNLE1BQU0sQ0FBQyxPQUFPLENBQUMsUUFBUSxDQUFDLENBQUMsRUFBRSxFQUFFLENBQUMsQ0FBQyxD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R0FBRyxNQUFNLElBQUksRUFBRSxLQUFLLElBQUksU0FBUztBQUNqQyxJQUFJLE9BQU8sR0FBRyxJQUFJLENBQUM7QUFDbkIsSUFBSSxTQUFTLEdBQUcsSUFBSSxDQUFDO0FBQ3JCLElBQUksRUFBRSxHQUFHLEtBQUssQ0FBQyxLQUFLLENBQUMsVUFBVSxDQUFDLEVBQUUsS0FBSyxDQUFDLFFBQVEsQ0FBQyxDQUFDO0FBQ2xEO0FBQ0EsR0FBRyxNQUFNO0FBQ1QsSUFBSSxTQUFTLEdBQUcsR0FBRyxDQUFDO0FBQ3BCLEdBQUc7QUFDSDtBQUNBLEVBQUUsU0FBUyxHQUFHLEtBQUssQ0FBQyxRQUFRLENBQUM7QUFDN0I7QUFDQSxFQUFFLElBQUksVUFBVSxFQUFFO0FBQ2xCLElBQUksR0FBRyxFQUFFLEVBQUUsR0FBRyxLQUFLLENBQUMsS0FBSyxDQUFDLFVBQVUsQ0FBQyxFQUFFLEtBQUssQ0FBQyxRQUFRLENBQUMsQ0FBQyxFQUFFO0FBQ3pELFdBQVcsRUFBRSxLQUFLLENBQUMsSUFBSSxFQUFFLEtBQUssSUFBSSxTQUFTO0FBQzNDO0FBQ0EsSUFBSSxJQUFJLEtBQUssQ0FBQyxRQUFRLEdBQUcsS0FBSyxDQUFDLE1BQU0sRUFBRTtBQUN2QyxNQUFNLE9BQU8sR0FBRyxLQUFLLENBQUMsS0FBSyxDQUFDLEtBQUssQ0FBQyxTQUFTLEVBQUUsS0FBSyxDQUFDLFFBQVEsQ0FBQyxDQUFDO0FBQzdELE1BQU0sRUFBRSxHQUFHLEtBQUssQ0FBQyxLQUFLLENBQUMsVUFBVSxDQUFDLEVBQUUsS0FBSyxDQUFDLFFBQVEsQ0FBQyxDQUFDO0FBQ3BELEtBQUssTUFBTTtBQUNYLE1BQU0sVUFBVSxDQUFDLEtBQUssRUFBRSxvREFBb0QsQ0FBQyxDQUFDO0FBQzlFLEtBQUs7QUFDTCxHQUFHLE1BQU07QUFDVCxJQUFJLE9BQU8sRUFBRSxLQUFLLENBQUMsSUFBSSxDQUFDLFlBQVksQ0FBQyxFQUFFLENBQUMsRUFBRTtBQUMxQztBQUNBLE1BQU0sSUFBSSxFQUFFLEtBQUssSUFBSSxTQUFTO0FBQzlCLFFBQVEsSUFB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RSxJQUFJLEVBQUUsS0FBSyxDQUFDO0FBQ3BEO0FBQ0EsRUFBRSxRQUFRLEdBQUcsUUFBUSxHQUFHLEtBQUssQ0FBQyxhQUFhLEdBQUcsS0FBSyxDQUFDLGFBQWEsQ0FBQztBQUNsRTtBQUNBLEVBQUUsS0FBSyxLQUFLLEdBQUcsQ0FBQyxFQUFFLE1BQU0sR0FBRyxRQUFRLENBQUMsTUFBTSxFQUFFLEtBQUssR0FBRyxNQUFNLEVBQUUsS0FBSyxJQUFJLENBQUMsRUFBRTtBQUN4RSxJQUFJLElBQUksR0FBRyxRQUFRLENBQUMsS0FBSyxDQUFDLENBQUM7QUFDM0I7QUFDQSxJQUFJLElBQUksQ0FBQyxJQUFJLENBQUMsVUFBVSxLQUFLLElBQUksQ0FBQyxTQUFTO0FBQzNDLFNBQVMsQ0FBQyxJQUFJLENBQUMsVUFBVSxLQUFLLENBQUMsT0FBTyxNQUFNLEtBQUssUUFBUSxNQUFNLE1BQU0sWUFBWSxJQUFJLENBQUMsVUFBVSxDQUFDLENBQUMsQ0FBQztBQUNuRyxTQUFTLENBQUMsSUFBSSxDQUFDLFNBQVMsS0FBSyxJQUFJLENBQUMsU0FBUyxDQUFDLE1BQU0sQ0FBQyxDQUFDLEVBQUU7QUFDdEQ7QUFDQSxNQUFNLEtBQUssQ0FBQyxHQUFHLEdBQUcsUUFBUSxHQUFHLElBQUksQ0FBQyxHQUFHLEdBQUcsR0FBRyxDQUFDO0FBQzVDO0FBQ0EsTUFBTSxJQUFJLElBQUksQ0FBQyxTQUFTLEVBQUU7QUFDMUIsUUFBUSxLQUFLLEdBQUcsS0FBSyxDQUFDLFFBQVEsQ0FBQyxJQUFJLENBQUMsR0FBRyxDQUFDLElBQUksSUFBSSxDQUFDLFlBQVksQ0FBQztBQUM5RDtBQUNBLFFBQVEsSUFBSVUsV0FBUyxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsU0FBUyxDQUFDLEtBQUssbUJBQW1CLEVBQUU7QUFDcEUsVUFBVSxPQUFPLEdBQUcsSUFBSSxDQUFDLFNBQVMsQ0FBQyxNQUFNLEVBQUUsS0FBSyxDQUFDLENBQUM7QUFDbEQsU0FBUyxNQUFNLElBQUlDLGlCQUFlLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxTQUFTLEVBQUUsS0FBSyxDQUFDLEVBQUU7QUFDaEUsVUFBVSxPQUFPLEdBQUcsSUFBSSxDQUFDLFNBQVMsQ0FBQyxLQUFLLENBQUMsQ0FBQyxNQUFNLEVBQUUsS0FBSyxDQUFDLENBQUM7QUFDekQsU0FBUyxNQUFNO0FBQ2YsVUFBVSxNQUFNLElBQUlYLFNBQWEsQ0FBQyxJQUFJLEdBQUcsSUFBSSxDQUFDLEdBQUcsR0FBRyw4QkFBOEIsR0FBRyxLQUFLLEdBQUcsU0FBUyxDQUFDLENBQUM7QUFDeEcsU0FBUztBQUNUO0FBQ0EsUUFBUSxLQUFLLENBQUMsSUFBSSxHQUFHLE9BQU8sQ0FBQztBQUM3QixPQUFPO0FBQ1A7QUFDQSxNQUFNLE9BQU8sSUFBSSxDQUFDO0FBQ2xCLEtBQUs7QUFDTCxHQUFHO0FBQ0g7QUFDQSxFQUFFLE9BQU8sS0FBSyxDQUFDO0FBQ2YsQ0FBQztBQUNEO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsU0FBUyxTQUFTLENBQUMsS0FBSyxFQUFFLEtBQUssRUFBRSxNQUFNLEVBQUUsS0FBSyxFQUFFLE9BQU8sRUFBRSxLQUFLLEVBQUU7QUFDaEUsRUFBRSxLQUFLLENBQUMsR0FBRyxHQUFHLElBQUksQ0FBQztBQUNuQixFQUFFLEtBQUssQ0FBQyxJQUFJLEdBQUcsTUFBTSxDQUFDO0FBQ3RCO0FBQ0EsRUFBRSxJQUFJLENBQUMsVUFBVSxDQUFDLEtBQUssRUFBRSxNQUFNLEVBQUUsS0FBSyxDQUFDLEVBQUU7QUFDekMsSUFBSSxVQUFVLENBQUMsS0FBSyxFQUFFLE1BQU0sRUFBRSxJQUFJLENBQUMsQ0FBQztBQUNwQyxHQUFHO0FBQ0g7QUFDQSxFQUFFLElBQUksSUFBSSxHQUFHVSxXQUFTLENBQUMsSUFBSSxDQUFDLEtBQUssQ0FBQyxJQUFJLENBQUMsQ0FBQztBQUN4QztBQUNBLEVBQUUsSUFBSSxLQUFLLEVBQUU7QUFDYixJQUFJLEtBQUssSUFBSSxLQUFLLENBQUMsU0FBUyxHQUFHLENBQUMsSUFBSSxLQUFLLENBQUMsU0FBUyxHQUFHLEtBQUssQ0FBQyxDQUFDO0FBQzdELEdBQUc7QUFDSDtBQUNBLEVBQUUsSUFBSSxhQUFhLEdBQUcsSUFBSSxLQUFLLGlCQUFpQixJQUFJLElBQUksS0FBSyxnQkFBZ0I7QUFDN0UsTUFBTSxjQUFjO0FBQ3BCLE1BQU0sU0FBUyxDQUFDO0FBQ2hCO0FBQ0EsRUFBRSxJQUFJLGFBQWEsRUFBRTtBQUNyQixJQUFJLGNBQWMsR0FBRyxLQUFLLENBQUMsVUFBVSxDQUFDLE9BQU8sQ0FBQyxNQUFNLENBQUMsQ0FBQztBQUN0RCxJQUFJLFNBQVMsR0FBRyxjQUFjLEtBQUssQ0FBQyxDQUFDLENBQUM7QUFDdEMsR0FBRztBQUNIO0FBQ0EsRUFBRSxJQUFJLENBQUMsS0FBSyxDQUFDLEdBQUcsS0FBSyxJQUFJLElBQUksS0FBSyxDQUFDLEdBQUcsS0FBSyxHQUFHLEtBQUssU0FBUyxLQUFLLEtBQUssQ0FBQyxNQUFNLEtBQUssQ0FBQyxJQUFJLEtBQUssR0FBRyxDQUFDLENBQUMsRUFBRTtBQUNuRyxJQUFJLE9BQU8sR0FBRyxLQUFLLENBQUM7QUFDcEIsR0FBRztBQUNIO0FBQ0EsRUFBRSxJQUFJLFNBQVMsSUFBSSxLQUFLLENBQUMsY0FBYyxDQUFDLGNBQWMsQ0FBQyxFQUFFO0FBQ3pELElBQUksS0FBSyxDQUFDLElBQUksR0FBRyxPQUFPLEdBQUcsY0FBYyxDQUFDO0FBQzFDLEdBQUcsTUFBTTtBQUNULElBQUksSUFBSSxhQUFhLElBQUksU0FBUyxJQUFJLENBQUMsS0FBSyxDQUFDLGNBQWMsQ0FBQyxjQUFjLENBQUMsRUFBRTtBQUM3RSxNQUFNLEtBQUssQ0FBQyxjQUFjLENBQUMsY0FBYyxDQUFDLEdBQUcsSUFBSSxDQUFDO0FBQ2xELEtBQUs7QUFDTCxJQUFJLElBQUksSUFBSSxLQUFLLGlCQUFpQixFQUFFO0FBQ3BDLE1BQU0sSUFBSSxLQUFLLEtBQUssTUFBTSxDQUFDLElBQUksQ0FBQyxLQUFLLENBQUMsSUFBSSxDQUFDLENBQUMsTUFBTSxLQUFLLENBQUMsQ0FBQyxFQUFFO0FBQzNELFFBQVEsaUJBQWlCLENBQUMsS0FBSyxFQUFFLEtBQUssRUFBRSxLQUFLLENBQUMsSUFBSSxFQUFFLE9BQU8sQ0FBQyxDQUFDO0FBQzdELFFBQVEsSUFBSSxTQUFTLEVBQUU7QUFDdkIsVUFBVSxLQUFLLENBQUMsSUFBSSxHQUFHLE9BQU8sR0FBRyxjQUFjLEdBQUcsS0FBSyxDQUFDLElBQUksQ0FBQztBQUM3RCxTQUFTO0FBQ1QsT0FBTyxNQUFNO0FBQ2IsUUFBUSxnQkFBZ0IsQ0FBQyxLQUFLLEVBQUUsS0FBSyxFQUFFLEtBQUssQ0FBQyxJQUFJLENBQUMsQ0FBQztBQUNuRCxRQUFRLElBQUksU0FBUyxFQUFFO0FBQ3ZCLFVBQVUsS0FBSyxDQUFDLElBQUksR0FBRyxPQUFPLEdBQUcsY0FBYyxHQUFHLEdBQUcsR0FBRyxLQUFLLENBQUMsSUFBSSxDQUFDO0FBQ25FLFNBQVM7QUFDVCxPQUFPO0FBQ1AsS0FBSyxNQUFNLElBQUksSUFBSSxLQUFLLGdCQUFnQixFQUFFO0FBQzFDLE1BQU0sSUFBSSxVQUFVLEdBQUcsQ0FBQyxLQUFLLENBQUMsYUFBYSxLQUFLLEtBQUssR0FBRyxDQUFDLENBQUMsSUFBSSxLQUFLLEdBQUcsQ0FBQyxHQUFHLEtBQUssQ0FBQztBQUNoRixNQUFNLElBQUksS0FBSyxLQUFLLEtBQUssQ0FBQyxJQUFJLENBQUMsTUFBTSxLQUFLLENBQUMsQ0FBQyxFQUFFO0FBQzlDLFFBQVEsa0JBQWtCLENBQUMsS0FBSyxFQUFFLFVBQVUsRUFBRSxLQUFLLENBQUMsSUFBSSxFQUFFLE9BQU8sQ0FBQyxDQUFDO0FBQ25FLFFBQVEsSUFBSSxTQUFTLEVBQUU7QUFDdkIsVUFBVSxLQUFLLENBQUMsSUFBSSxHQUFHLE9BQU8sR0FBRyxjQUFjLEdBQUcsS0FBSyxDQUFDLElBQUksQ0FBQztBQUM3RCxTQUFTO0FBQ1QsT0FBTyxNQUFNO0FBQ2IsUUFBUSxpQkFBaUIsQ0FBQyxLQUFLLEVBQUUsVUFBVSxFQUFFLEtBQUssQ0FBQyxJQUFJLENBQUMsQ0FBQztBQUN6RCxRQUFRLElBQUksU0FBUyxFQUFFO0FBQ3ZCLFVBQVUsS0FBSyxDQUFDLElBQUksR0FBRyxPQUFPLEdBQUcsY0FBYyxHQUFHLEdBQUcsR0FBRyxLQUFLLENBQUMsSUFBSSxDQUFDO0FBQ25FLFNBQVM7QUFDVCxPQUFPO0FBQ1AsS0FBSyxNQUFNLElBQUksSUFBSSxLQUFLLGlCQUFpQixFQUFFO0FBQzNDLE1BQU0sSUFBSSxLQUFLLENBQUMsR0FBRyxLQUFLLEdBQUcsRUFBRTtBQUM3QixRQUFRLFdBQVcsQ0FBQyxLQUFLLEVBQUUsS0FBSyxDQUFDLElBQUksRUFBRSxLQUFLLEVBQUUsS0FBSyxDQUFDLENBQUM7QUFDckQsT0FBTztBQUNQLEtBQUssTUFBTTtBQUNYLE1BQU0sSUFBSSxLQUFLLENBQUMsV0FBVyxFQUFFLE9BQU8sS0FBSyxDQUFDO0FBQzFDLE1BQU0sTUFBTSxJQUFJVixTQUFhLENBQUMseUNBQXlDLEdBQUcsSUFBSSxDQUFDLENBQUM7QUFDaEYsS0FBSztBQUNMO0FBQ0EsSUFBSSxJQUFJLEtBQUssQ0FBQyxHQUFHLEtBQUssSUFBSSxJQUFJLEtBQUssQ0FBQyxHQUFHLEtBQUssR0FBRyxFQUFFO0FBQ2pELE1BQU0sS0FBSyxDQUFDLElBQUksR0FBRyxJQUFJLEdBQUcsS0FBSyxDQUFDLEdBQUcsR0FBRyxJQUFJLEdBQUcsS0FBSyxDQUFDLElBQUksQ0FBQztBQUN4RCxLQUFLO0FBQ0wsR0FBRztBQUNIO0FBQ0EsRUFBRSxPQUFPLElBQUksQ0FBQztBQUNkLENBQUM7QUFDRDtBQUNBLFNBQVMsc0JBQXNCLENBQUMsTUFBTSxFQUFFLEtBQUssRUFBRTtBQUMvQyxFQUFFLElBQUksT0FBTyxHQUFHLEVBQUU7QUFDbEIsTUFBTSxpQkFBaUIsR0FBRyxFQUFFO0FBQzVCLE1BQU0sS0FBSztBQUNYLE1BQU0sTUFBTSxDQUFDO0FBQ2I7QUFDQSxFQUFFLFdBQVcsQ0FBQyxNQUFNLEVBQUUsT0FBTyxFQUFFLGlCQUFpQixDQUFDLENBQUM7QUFDbEQ7QUFDQSxFQUFFLEtBQUssS0FBSyxHQUFHLENBQUMsRUFBRSxNQUFNLEdBQUcsaUJBQWlCLENBQUMsTUFBTSxFQUFFLEtBQUssR0FBRyxNQUFNLEVBQUUsS0FBSyxJQUFJLENBQUMsRUFBRTtBQUNqRixJQUFJLEtBQUssQ0FBQyxVQUFVLENBQUMsSUFBSSxDQUFDLE9BQU8sQ0FBQyxpQkFBaUIsQ0FBQyxLQUFLLENBQUMsQ0FBQyxDQUFDLENBQUM7QUFDN0QsR0FBRztBQUNILEVBQUUsS0FBSyxDQUFDLGNBQWMsR0FBRyxJQUFJLEtBQUssQ0FBQyxNQUFNLENBQUMsQ0FBQztBQUMzQyxDQUFDO0FBQ0Q7QUFDQSxTQUFTLFdBQVcsQ0FBQyxNQUFNLEVBQUUsT0FBTyxFQUFFLGlCQUFpQixFQUFFO0FBQ3pELEVBQUUsSUFBSSxhQUFhO0FBQ25CLE1BQU0sS0FBSztBQUNYLE1BQU0sTUFBTSxDQUFDO0FBQ2I7QUFDQSxFQUFFLElBQUksTUFBTSxLQUFLLElBQUksSUFBSSxPQUFPLE1BQU0sS0FBSyxRQUFRLEVBQUU7QUFDckQsSUFBSSxLQUFLLEdBQUcsT0FBTyxDQUFDLE9BQU8sQ0FBQyxNQUFNLENBQUMsQ0FBQztBQUNwQyxJQUFJLElBQUksS0FBSyxLQUFLLENBQUMsQ0FBQyxFQUFFO0FBQ3RCLE1BQU0sSUFBSSxpQkFBaUIsQ0FBQyxPQUFPLENBQUMsS0FBSyxDQUFDLEtBQUssQ0FBQyxDQUFDLEVBQUU7QUFDbkQsUUFBUSxpQkFBaUIsQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDLENBQUM7QUFDdEMsT0FBTztBQUNQLEtBQUssTUFBTTtBQUNYLE1BQU0sT0FBTyxDQUFDLElBQUksQ0FBQyxNQUFNLENBQUMsQ0FBQztBQUMzQjtBQUNBLE1BQU0sSUFBSSxLQUFLLENBQUMsT0FBTyxDQUFDLE1BQU0sQ0FBQyxFQUFFO0FBQ2pDLFFBQVEsS0FBSyxLQUFLLEdBQUcsQ0FBQyxFQUFFLE1BQU0sR0FBRyxNQUFNLENBQUMsTUFBTSxFQUFFLEtBQUssR0FBRyxNQUFNLEVBQUUsS0FBSyxJQUFJLENBQUMsRUFBRTtBQUM1RSxVQUFVLFdBQVcsQ0FBQyxNQUFNLENBQUMsS0FBSyxDQUFDLEVBQUUsT0FBTyxFQUFFLGlCQUFpQixDQUFDLENBQUM7QUFDakUsU0FBUztBQUNULE9BQU8sTUFBTTtBQUNiLFFBQVEsYUFBYSxHQUFHLE1BQU0sQ0FBQyxJQUFJLENBQUMsTUFBTSxDQUFDLENBQUM7QUFDNUM7QUFDQSxRQUFRLEtBQUssS0FBSyxHQUFHLENBQUMsRUFBRSxNQUFNLEdBQUcsYUFBYSxDQUFDLE1BQU0sRUFBRSxLQUFLLEdBQUcsTUFBTSxFQUFFLEtBQUssSUFBSSxDQUFDLEVBQUU7QUFDbkYsVUFBVSxXQUFXLENBQUMsTUFBTSxDQUFDLGFBQWEsQ0FBQyxLQUFLLENBQUMsQ0FBQyxFQUFFLE9BQU8sRUFBRSxpQkFBaUIsQ0FBQyxDQUFDO0FBQ2hGLFNBQVM7QUFDVCxPQUFPO0FBQ1AsS0FBSztBQUNMLEdBQUc7QUFDSCxDQUFDO0FBQ0Q7QUFDQSxTQUFTLElBQUksQ0FBQyxLQUFLLEVBQUUsT0FBTyxFQUFFO0FBQzlCLEVBQUUsT0FBTyxHQUFHLE9BQU8sSUFBSSxFQUFFLENBQUM7QUFDMUI7QUFDQSxFQUFFLElBQUksS0FBSyxHQUFHLElBQUlrQixPQUFLLENBQUMsT0FBTyxDQUFDLENBQUM7QUFDakM7QUFDQSxFQUFFLElBQUksQ0FBQyxLQUFLLENBQUMsTUFBTSxFQUFFLHNCQUFzQixDQUFDLEtBQUssRUFBRSxLQUFLLENBQUMsQ0FBQztBQUMxRDtBQUNBLEVBQUUsSUFBSSxTQUFTLENBQUMsS0FBSyxFQUFFLENBQUMsRUFBRSxLQUFLLEVBQUUsSUFBSSxFQUFFLElBQUksQ0FBQyxFQUFFLE9BQU8sS0FBSyxDQUFDLElBQUksR0FBRyxJQUFJLENBQUM7QUFDdkU7QUFDQSxFQUFFLE9BQU8sRUFBRSxDQUFDO0FBQ1osQ0FBQztBQUNEO0FBQ0EsU0FBUyxRQUFRLENBQUMsS0FBSyxFQUFFLE9BQU8sRUFBRTtBQUNsQyxFQUFFLE9BQU8sSUFBSSxDQUFDLEtBQUssRUFBRSxNQUFNLENBQUMsTUFBTSxDQUFDLEVBQUUsTUFBTSxFQUFFRCxZQUFtQixFQUFFLEVBQUUsT0FBTyxDQUFDLENBQUMsQ0FBQztBQUM5RSxDQUFDO0FBQ0Q7QUFDQSxVQUFtQixPQUFPLElBQUksQ0FBQztBQUMvQixjQUF1QixHQUFHLFFBQVE7Ozs7Ozs7QUMxMEJsQyxTQUFTLFVBQVUsQ0FBQyxJQUFJLEVBQUU7QUFDMUIsRUFBRSxPQUFPLFlBQVk7QUFDckIsSUFBSSxNQUFNLElBQUksS0FBSyxDQUFDLFdBQVcsR0FBRyxJQUFJLEdBQUcsb0NBQW9DLENBQUMsQ0FBQztBQUMvRSxHQUFHLENBQUM7QUFDSixDQUFDO0FBQ0Q7QUFDQTtBQUNBLFVBQW1CLGtCQUFrQmIsSUFBeUIsQ0FBQztBQUMvRCxZQUFxQixnQkFBZ0JDLE1BQTJCLENBQUM7QUFDakUsbUJBQThCLE9BQU9DLFFBQW9DLENBQUM7QUFDMUUsZUFBMEIsV0FBV0MsSUFBZ0MsQ0FBQztBQUN0RSxlQUEwQixXQUFXQyxJQUFnQyxDQUFDO0FBQ3RFLHVCQUFrQyxHQUFHSSxZQUF3QyxDQUFDO0FBQzlFLHVCQUFrQyxHQUFHQyxZQUF3QyxDQUFDO0FBQzlFLFVBQW1CLGtCQUFrQixNQUFNLENBQUMsSUFBSSxDQUFDO0FBQ2pELGFBQXNCLGVBQWUsTUFBTSxDQUFDLE9BQU8sQ0FBQztBQUNwRCxjQUF1QixjQUFjLE1BQU0sQ0FBQyxRQUFRLENBQUM7QUFDckQsaUJBQTBCLFdBQVcsTUFBTSxDQUFDLFdBQVcsQ0FBQztBQUN4RCxVQUFtQixrQkFBa0IsTUFBTSxDQUFDLElBQUksQ0FBQztBQUNqRCxjQUF1QixjQUFjLE1BQU0sQ0FBQyxRQUFRLENBQUM7QUFDckQsbUJBQTRCLFNBQVNNLFNBQThCLENBQUM7QUFDcEU7QUFDQTtBQUNBLGtCQUE2QixHQUFHYixRQUFvQyxDQUFDO0FBQ3JFLGVBQTBCLE1BQU1NLFlBQXdDLENBQUM7QUFDekUsa0JBQTZCLEdBQUdDLFlBQXdDLENBQUM7QUFDekU7QUFDQTtBQUNBLFFBQW1CLGFBQWEsVUFBVSxDQUFDLE1BQU0sQ0FBQyxDQUFDO0FBQ25ELFNBQW9CLFlBQVksVUFBVSxDQUFDLE9BQU8sQ0FBQyxDQUFDO0FBQ3BELFdBQXNCLFVBQVUsVUFBVSxDQUFDLFNBQVMsQ0FBQyxDQUFDO0FBQ3RELGtCQUE2QixHQUFHLFVBQVUsQ0FBQyxnQkFBZ0IsQ0FBQzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7QUNoQzVELFlBQWMsR0FBR08sTUFBSTs7QUNGZCxNQUFNLGVBQWUsR0FBRyxXQUFXLENBQUM7QUFHM0M7QUFDTyxNQUFNLFVBQVUsR0FBRyx1M0dBQXUzRzs7U0NEajRHLE1BQU0sQ0FBQyxNQUFhLEVBQUUsR0FBTyxFQUFFLElBQVM7SUFDdkQsSUFBRyxJQUFJO1FBQ04sT0FBTyxDQUFDLEdBQUcsQ0FBQztZQUNYLE1BQU07WUFDTixHQUFHO1lBQ0gsSUFBSTtTQUNKLENBQUMsQ0FBQTs7UUFFQyxPQUFPLENBQUMsR0FBRyxDQUFDLEVBQUMsTUFBTSxFQUFFLEdBQUcsRUFBQyxDQUFDLENBQUM7QUFDaEM7O01DWGEsU0FBUztJQUlsQixZQUFZLFNBQXNCO1FBRmxDLFlBQU8sR0FBRyxJQUFJLEdBQUcsRUFBbUIsQ0FBQztRQUdqQyxJQUFJLENBQUMsU0FBUyxHQUFHLFNBQVMsQ0FBQztLQUM5QjtJQUVELE9BQU8sQ0FBQyxHQUFXLEVBQUUsVUFBbUI7UUFDcEMsTUFBTSxDQUFDLElBQUksRUFBRSxHQUFHLENBQUMsQ0FBQztRQUNsQixJQUFJLFVBQVUsRUFBRTtZQUNaLElBQUksQ0FBQyxTQUFTLENBQUMsT0FBTyxDQUFDLEdBQUcsQ0FBQyxDQUFBO1lBQzNCLFVBQVUsQ0FBQztnQkFDUCxJQUFJLENBQUMsU0FBUyxDQUFDLE9BQU8sQ0FBQyxRQUFRLENBQUMsQ0FBQTthQUNuQyxFQUFFLFVBQVUsQ0FBQyxDQUFDO1NBQ2xCOztZQUVHLElBQUksQ0FBQyxTQUFTLENBQUMsT0FBTyxDQUFDLEdBQUcsQ0FBQyxDQUFBO0tBQ2xDO0lBRUQsT0FBTyxDQUFDLElBQVksRUFBRSxTQUFrQjtRQUNwQyxJQUFJLENBQUMsT0FBTyxDQUFDLEdBQUcsQ0FBQyxJQUFJLEVBQUUsU0FBUyxDQUFDLENBQUM7S0FDckM7Q0FDSjtNQUVZLEtBQUs7SUFLZCxZQUFZLE1BQWM7UUFDdEIsSUFBSSxDQUFDLE1BQU0sR0FBRyxNQUFNLENBQUM7UUFDckIsSUFBSSxDQUFDLEtBQUssR0FBRyxLQUFLLENBQUM7S0FDdEI7SUFFRCxPQUFPO1FBQ0gsT0FBTyxLQUFLLENBQUM7S0FDaEI7SUFFRCxJQUFJO1FBQ0EsT0FBTyxJQUFJLE9BQU8sQ0FBWSxDQUFDLE9BQU8sRUFBRSxNQUFNO1lBQzFDLElBQUksQ0FBQyxNQUFNLENBQUMsUUFBUSxFQUFFLENBQUMsSUFBSSxDQUFDLElBQUk7Z0JBQzVCLElBQUcsSUFBSSxJQUFJLElBQUksRUFBRTtvQkFDYixJQUFJLENBQUMsSUFBSSxHQUFHO3dCQUNSLFFBQVEsRUFBRTs0QkFDTixlQUFlLEVBQUUsa0JBQWtCO3lCQUN0QztxQkFDSixDQUFDO29CQUNGLElBQUksQ0FBQyxLQUFLLEdBQUcsSUFBSSxDQUFDO29CQUNsQixPQUFPLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxDQUFDO29CQUNuQixJQUFJLENBQUMsSUFBSSxFQUFFLENBQUM7aUJBQ2Y7cUJBQ0k7b0JBQ0QsSUFBSSxDQUFDLElBQUksR0FBRyxJQUFJLENBQUM7b0JBQ2pCLElBQUksQ0FBQyxLQUFLLEdBQUcsSUFBSSxDQUFDO29CQUNsQixPQUFPLENBQUMsSUFBSSxDQUFDLENBQUE7aUJBQ2hCO2FBQ0osQ0FBQyxDQUFBO1NBRUwsQ0FBQyxDQUFBO0tBQ0w7SUFFRCxNQUFNLENBQUMsR0FBVyxFQUFFLEtBQVUsS0FBSztJQUVuQyxJQUFJO1FBQ0EsT0FBTyxJQUFJLENBQUMsTUFBTSxDQUFDLFFBQVEsQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLENBQUM7S0FDMUM7OztBQ3ZFTCxTQUFTLElBQUksR0FBRyxHQUFHO0FBZ0JuQixTQUFTLEdBQUcsQ0FBQyxFQUFFLEVBQUU7QUFDakIsSUFBSSxPQUFPLEVBQUUsRUFBRSxDQUFDO0FBQ2hCLENBQUM7QUFDRCxTQUFTLFlBQVksR0FBRztBQUN4QixJQUFJLE9BQU8sTUFBTSxDQUFDLE1BQU0sQ0FBQyxJQUFJLENBQUMsQ0FBQztBQUMvQixDQUFDO0FBQ0QsU0FBUyxPQUFPLENBQUMsR0FBRyxFQUFFO0FBQ3RCLElBQUksR0FBRyxDQUFDLE9BQU8sQ0FBQyxHQUFHLENBQUMsQ0FBQztBQUNyQixDQUFDO0FBQ0QsU0FBUyxXQUFXLENBQUMsS0FBSyxFQUFFO0FBQzVCLElBQUksT0FBTyxPQUFPLEtBQUssS0FBSyxVQUFVLENBQUM7QUFDdkMsQ0FBQztBQUNELFNBQVMsY0FBYyxDQUFDLENBQUMsRUFBRSxDQUFDLEVBQUU7QUFDOUIsSUFBSSxPQUFPLENBQUMsSUFBSSxDQUFDLEdBQUcsQ0FBQyxJQUFJLENBQUMsR0FBRyxDQUFDLEtBQUssQ0FBQyxLQUFLLENBQUMsQ0FBQyxJQUFJLE9BQU8sQ0FBQyxLQUFLLFFBQVEsS0FBSyxPQUFPLENBQUMsS0FBSyxVQUFVLENBQUMsQ0FBQztBQUNsRyxDQUFDO0FBSUQsU0FBUyxRQUFRLENBQUMsR0FBRyxFQUFFO0FBQ3ZCLElBQUksT0FBTyxNQUFNLENBQUMsSUFBSSxDQUFDLEdBQUcsQ0FBQyxDQUFDLE1BQU0sS0FBSyxDQUFDLENBQUM7QUFDekMsQ0FBQztBQW1KRDtBQUNBLFNBQVMsTUFBTSxDQUFDLE1BQU0sRUFBRSxJQUFJLEVBQUU7QUFDOUIsSUFBSSxNQUFNLENBQUMsV0FBVyxDQUFDLElBQUksQ0FBQyxDQUFDO0FBQzdCLENBQUM7QUFDRCxTQUFTLE1BQU0sQ0FBQyxNQUFNLEVBQUUsSUFBSSxFQUFFLE1BQU0sRUFBRTtBQUN0QyxJQUFJLE1BQU0sQ0FBQyxZQUFZLENBQUMsSUFBSSxFQUFFLE1BQU0sSUFBSSxJQUFJLENBQUMsQ0FBQztBQUM5QyxDQUFDO0FBQ0QsU0FBUyxNQUFNLENBQUMsSUFBSSxFQUFFO0FBQ3RCLElBQUksSUFBSSxDQUFDLFVBQVUsQ0FBQyxXQUFXLENBQUMsSUFBSSxDQUFDLENBQUM7QUFDdEMsQ0FBQztBQUNELFNBQVMsWUFBWSxDQUFDLFVBQVUsRUFBRSxTQUFTLEVBQUU7QUFDN0MsSUFBSSxLQUFLLElBQUksQ0FBQyxHQUFHLENBQUMsRUFBRSxDQUFDLEdBQUcsVUFBVSxDQUFDLE1BQU0sRUFBRSxDQUFDLElBQUksQ0FBQyxFQUFFO0FBQ25ELFFBQVEsSUFBSSxVQUFVLENBQUMsQ0FBQyxDQUFDO0FBQ3pCLFlBQVksVUFBVSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxTQUFTLENBQUMsQ0FBQztBQUN2QyxLQUFLO0FBQ0wsQ0FBQztBQUNELFNBQVMsT0FBTyxDQUFDLElBQUksRUFBRTtBQUN2QixJQUFJLE9BQU8sUUFBUSxDQUFDLGFBQWEsQ0FBQyxJQUFJLENBQUMsQ0FBQztBQUN4QyxDQUFDO0FBbUJELFNBQVMsSUFBSSxDQUFDLElBQUksRUFBRTtBQUNwQixJQUFJLE9BQU8sUUFBUSxDQUFDLGNBQWMsQ0FBQyxJQUFJLENBQUMsQ0FBQztBQUN6QyxDQUFDO0FBQ0QsU0FBUyxLQUFLLEdBQUc7QUFDakIsSUFBSSxPQUFPLElBQUksQ0FBQyxHQUFHLENBQUMsQ0FBQztBQUNyQixDQUFDO0FBSUQsU0FBUyxNQUFNLENBQUMsSUFBSSxFQUFFLEtBQUssRUFBRSxPQUFPLEVBQUUsT0FBTyxFQUFFO0FBQy9DLElBQUksSUFBSSxDQUFDLGdCQUFnQixDQUFDLEtBQUssRUFBRSxPQUFPLEVBQUUsT0FBTyxDQUFDLENBQUM7QUFDbkQsSUFBSSxPQUFPLE1BQU0sSUFBSSxDQUFDLG1CQUFtQixDQUFDLEtBQUssRUFBRSxPQUFPLEVBQUUsT0FBTyxDQUFDLENBQUM7QUFDbkUsQ0FBQztBQXNCRCxTQUFTLElBQUksQ0FBQyxJQUFJLEVBQUUsU0FBUyxFQUFFLEtBQUssRUFBRTtBQUN0QyxJQUFJLElBQUksS0FBSyxJQUFJLElBQUk7QUFDckIsUUFBUSxJQUFJLENBQUMsZUFBZSxDQUFDLFNBQVMsQ0FBQyxDQUFDO0FBQ3hDLFNBQVMsSUFBSSxJQUFJLENBQUMsWUFBWSxDQUFDLFNBQVMsQ0FBQyxLQUFLLEtBQUs7QUFDbkQsUUFBUSxJQUFJLENBQUMsWUFBWSxDQUFDLFNBQVMsRUFBRSxLQUFLLENBQUMsQ0FBQztBQUM1QyxDQUFDO0FBMkRELFNBQVMsUUFBUSxDQUFDLE9BQU8sRUFBRTtBQUMzQixJQUFJLE9BQU8sS0FBSyxDQUFDLElBQUksQ0FBQyxPQUFPLENBQUMsVUFBVSxDQUFDLENBQUM7QUFDMUMsQ0FBQztBQWtDRCxTQUFTLFFBQVEsQ0FBQyxJQUFJLEVBQUUsSUFBSSxFQUFFO0FBQzlCLElBQUksSUFBSSxHQUFHLEVBQUUsR0FBRyxJQUFJLENBQUM7QUFDckIsSUFBSSxJQUFJLElBQUksQ0FBQyxTQUFTLEtBQUssSUFBSTtBQUMvQixRQUFRLElBQUksQ0FBQyxJQUFJLEdBQUcsSUFBSSxDQUFDO0FBQ3pCLENBQUM7QUFZRCxTQUFTLFNBQVMsQ0FBQyxJQUFJLEVBQUUsR0FBRyxFQUFFLEtBQUssRUFBRSxTQUFTLEVBQUU7QUFDaEQsSUFBSSxJQUFJLENBQUMsS0FBSyxDQUFDLFdBQVcsQ0FBQyxHQUFHLEVBQUUsS0FBSyxFQUFFLFNBQVMsR0FBRyxXQUFXLEdBQUcsRUFBRSxDQUFDLENBQUM7QUFDckUsQ0FBQztBQXVRRDtBQUNBLElBQUksaUJBQWlCLENBQUM7QUFDdEIsU0FBUyxxQkFBcUIsQ0FBQyxTQUFTLEVBQUU7QUFDMUMsSUFBSSxpQkFBaUIsR0FBRyxTQUFTLENBQUM7QUFDbEMsQ0FBQztBQStDRDtBQUNBLE1BQU0sZ0JBQWdCLEdBQUcsRUFBRSxDQUFDO0FBRTVCLE1BQU0saUJBQWlCLEdBQUcsRUFBRSxDQUFDO0FBQzdCLE1BQU0sZ0JBQWdCLEdBQUcsRUFBRSxDQUFDO0FBQzVCLE1BQU0sZUFBZSxHQUFHLEVBQUUsQ0FBQztBQUMzQixNQUFNLGdCQUFnQixHQUFHLE9BQU8sQ0FBQyxPQUFPLEVBQUUsQ0FBQztBQUMzQyxJQUFJLGdCQUFnQixHQUFHLEtBQUssQ0FBQztBQUM3QixTQUFTLGVBQWUsR0FBRztBQUMzQixJQUFJLElBQUksQ0FBQyxnQkFBZ0IsRUFBRTtBQUMzQixRQUFRLGdCQUFnQixHQUFHLElBQUksQ0FBQztBQUNoQyxRQUFRLGdCQUFnQixDQUFDLElBQUksQ0FBQyxLQUFLLENBQUMsQ0FBQztBQUNyQyxLQUFLO0FBQ0wsQ0FBQztBQUtELFNBQVMsbUJBQW1CLENBQUMsRUFBRSxFQUFFO0FBQ2pDLElBQUksZ0JBQWdCLENBQUMsSUFBSSxDQUFDLEVBQUUsQ0FBQyxDQUFDO0FBQzlCLENBQUM7QUFJRCxJQUFJLFFBQVEsR0FBRyxLQUFLLENBQUM7QUFDckIsTUFBTSxjQUFjLEdBQUcsSUFBSSxHQUFHLEVBQUUsQ0FBQztBQUNqQyxTQUFTLEtBQUssR0FBRztBQUNqQixJQUFJLElBQUksUUFBUTtBQUNoQixRQUFRLE9BQU87QUFDZixJQUFJLFFBQVEsR0FBRyxJQUFJLENBQUM7QUFDcEIsSUFBSSxHQUFHO0FBQ1A7QUFDQTtBQUNBLFFBQVEsS0FBSyxJQUFJLENBQUMsR0FBRyxDQUFDLEVBQUUsQ0FBQyxHQUFHLGdCQUFnQixDQUFDLE1BQU0sRUFBRSxDQUFDLElBQUksQ0FBQyxFQUFFO0FBQzdELFlBQVksTUFBTSxTQUFTLEdBQUcsZ0JBQWdCLENBQUMsQ0FBQyxDQUFDLENBQUM7QUFDbEQsWUFBWSxxQkFBcUIsQ0FBQyxTQUFTLENBQUMsQ0FBQztBQUM3QyxZQUFZLE1BQU0sQ0FBQyxTQUFTLENBQUMsRUFBRSxDQUFDLENBQUM7QUFDakMsU0FBUztBQUNULFFBQVEscUJBQXFCLENBQUMsSUFBSSxDQUFDLENBQUM7QUFDcEMsUUFBUSxnQkFBZ0IsQ0FBQyxNQUFNLEdBQUcsQ0FBQyxDQUFDO0FBQ3BDLFFBQVEsT0FBTyxpQkFBaUIsQ0FBQyxNQUFNO0FBQ3ZDLFlBQVksaUJBQWlCLENBQUMsR0FBRyxFQUFFLEVBQUUsQ0FBQztBQUN0QztBQUNBO0FBQ0E7QUFDQSxRQUFRLEtBQUssSUFBSSxDQUFDLEdBQUcsQ0FBQyxFQUFFLENBQUMsR0FBRyxnQkFBZ0IsQ0FBQyxNQUFNLEVBQUUsQ0FBQyxJQUFJLENBQUMsRUFBRTtBQUM3RCxZQUFZLE1BQU0sUUFBUSxHQUFHLGdCQUFnQixDQUFDLENBQUMsQ0FBQyxDQUFDO0FBQ2pELFlBQVksSUFBSSxDQUFDLGNBQWMsQ0FBQyxHQUFHLENBQUMsUUFBUSxDQUFDLEVBQUU7QUFDL0M7QUFDQSxnQkFBZ0IsY0FBYyxDQUFDLEdBQUcsQ0FBQyxRQUFRLENBQUMsQ0FBQztBQUM3QyxnQkFBZ0IsUUFBUSxFQUFFLENBQUM7QUFDM0IsYUFBYTtBQUNiLFNBQVM7QUFDVCxRQUFRLGdCQUFnQixDQUFDLE1BQU0sR0FBRyxDQUFDLENBQUM7QUFDcEMsS0FBSyxRQUFRLGdCQUFnQixDQUFDLE1BQU0sRUFBRTtBQUN0QyxJQUFJLE9BQU8sZUFBZSxDQUFDLE1BQU0sRUFBRTtBQUNuQyxRQUFRLGVBQWUsQ0FBQyxHQUFHLEVBQUUsRUFBRSxDQUFDO0FBQ2hDLEtBQUs7QUFDTCxJQUFJLGdCQUFnQixHQUFHLEtBQUssQ0FBQztBQUM3QixJQUFJLFFBQVEsR0FBRyxLQUFLLENBQUM7QUFDckIsSUFBSSxjQUFjLENBQUMsS0FBSyxFQUFFLENBQUM7QUFDM0IsQ0FBQztBQUNELFNBQVMsTUFBTSxDQUFDLEVBQUUsRUFBRTtBQUNwQixJQUFJLElBQUksRUFBRSxDQUFDLFFBQVEsS0FBSyxJQUFJLEVBQUU7QUFDOUIsUUFBUSxFQUFFLENBQUMsTUFBTSxFQUFFLENBQUM7QUFDcEIsUUFBUSxPQUFPLENBQUMsRUFBRSxDQUFDLGFBQWEsQ0FBQyxDQUFDO0FBQ2xDLFFBQVEsTUFBTSxLQUFLLEdBQUcsRUFBRSxDQUFDLEtBQUssQ0FBQztBQUMvQixRQUFRLEVBQUUsQ0FBQyxLQUFLLEdBQUcsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO0FBQ3hCLFFBQVEsRUFBRSxDQUFDLFFBQVEsSUFBSSxFQUFFLENBQUMsUUFBUSxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUMsR0FBRyxFQUFFLEtBQUssQ0FBQyxDQUFDO0FBQ3BELFFBQVEsRUFBRSxDQUFDLFlBQVksQ0FBQyxPQUFPLENBQUMsbUJBQW1CLENBQUMsQ0FBQztBQUNyRCxLQUFLO0FBQ0wsQ0FBQztBQWVELE1BQU0sUUFBUSxHQUFHLElBQUksR0FBRyxFQUFFLENBQUM7QUFDM0IsSUFBSSxNQUFNLENBQUM7QUFDWCxTQUFTLFlBQVksR0FBRztBQUN4QixJQUFJLE1BQU0sR0FBRztBQUNiLFFBQVEsQ0FBQyxFQUFFLENBQUM7QUFDWixRQUFRLENBQUMsRUFBRSxFQUFFO0FBQ2IsUUFBUSxDQUFDLEVBQUUsTUFBTTtBQUNqQixLQUFLLENBQUM7QUFDTixDQUFDO0FBQ0QsU0FBUyxZQUFZLEdBQUc7QUFDeEIsSUFBSSxJQUFJLENBQUMsTUFBTSxDQUFDLENBQUMsRUFBRTtBQUNuQixRQUFRLE9BQU8sQ0FBQyxNQUFNLENBQUMsQ0FBQyxDQUFDLENBQUM7QUFDMUIsS0FBSztBQUNMLElBQUksTUFBTSxHQUFHLE1BQU0sQ0FBQyxDQUFDLENBQUM7QUFDdEIsQ0FBQztBQUNELFNBQVMsYUFBYSxDQUFDLEtBQUssRUFBRSxLQUFLLEVBQUU7QUFDckMsSUFBSSxJQUFJLEtBQUssSUFBSSxLQUFLLENBQUMsQ0FBQyxFQUFFO0FBQzFCLFFBQVEsUUFBUSxDQUFDLE1BQU0sQ0FBQyxLQUFLLENBQUMsQ0FBQztBQUMvQixRQUFRLEtBQUssQ0FBQyxDQUFDLENBQUMsS0FBSyxDQUFDLENBQUM7QUFDdkIsS0FBSztBQUNMLENBQUM7QUFDRCxTQUFTLGNBQWMsQ0FBQyxLQUFLLEVBQUUsS0FBSyxFQUFFLE1BQU0sRUFBRSxRQUFRLEVBQUU7QUFDeEQsSUFBSSxJQUFJLEtBQUssSUFBSSxLQUFLLENBQUMsQ0FBQyxFQUFFO0FBQzFCLFFBQVEsSUFBSSxRQUFRLENBQUMsR0FBRyxDQUFDLEtBQUssQ0FBQztBQUMvQixZQUFZLE9BQU87QUFDbkIsUUFBUSxRQUFRLENBQUMsR0FBRyxDQUFDLEtBQUssQ0FBQyxDQUFDO0FBQzVCLFFBQVEsTUFBTSxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUMsTUFBTTtBQUM1QixZQUFZLFFBQVEsQ0FBQyxNQUFNLENBQUMsS0FBSyxDQUFDLENBQUM7QUFDbkMsWUFBWSxJQUFJLFFBQVEsRUFBRTtBQUMxQixnQkFBZ0IsSUFBSSxNQUFNO0FBQzFCLG9CQUFvQixLQUFLLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO0FBQy9CLGdCQUFnQixRQUFRLEVBQUUsQ0FBQztBQUMzQixhQUFhO0FBQ2IsU0FBUyxDQUFDLENBQUM7QUFDWCxRQUFRLEtBQUssQ0FBQyxDQUFDLENBQUMsS0FBSyxDQUFDLENBQUM7QUFDdkIsS0FBSztBQUNMLENBQUM7QUF3a0JELFNBQVMsZ0JBQWdCLENBQUMsS0FBSyxFQUFFO0FBQ2pDLElBQUksS0FBSyxJQUFJLEtBQUssQ0FBQyxDQUFDLEVBQUUsQ0FBQztBQUN2QixDQUFDO0FBSUQsU0FBUyxlQUFlLENBQUMsU0FBUyxFQUFFLE1BQU0sRUFBRSxNQUFNLEVBQUU7QUFDcEQsSUFBSSxNQUFNLEVBQUUsUUFBUSxFQUFFLFFBQVEsRUFBRSxVQUFVLEVBQUUsWUFBWSxFQUFFLEdBQUcsU0FBUyxDQUFDLEVBQUUsQ0FBQztBQUMxRSxJQUFJLFFBQVEsSUFBSSxRQUFRLENBQUMsQ0FBQyxDQUFDLE1BQU0sRUFBRSxNQUFNLENBQUMsQ0FBQztBQUMzQztBQUNBLElBQUksbUJBQW1CLENBQUMsTUFBTTtBQUM5QixRQUFRLE1BQU0sY0FBYyxHQUFHLFFBQVEsQ0FBQyxHQUFHLENBQUMsR0FBRyxDQUFDLENBQUMsTUFBTSxDQUFDLFdBQVcsQ0FBQyxDQUFDO0FBQ3JFLFFBQVEsSUFBSSxVQUFVLEVBQUU7QUFDeEIsWUFBWSxVQUFVLENBQUMsSUFBSSxDQUFDLEdBQUcsY0FBYyxDQUFDLENBQUM7QUFDL0MsU0FBUztBQUNULGFBQWE7QUFDYjtBQUNBO0FBQ0EsWUFBWSxPQUFPLENBQUMsY0FBYyxDQUFDLENBQUM7QUFDcEMsU0FBUztBQUNULFFBQVEsU0FBUyxDQUFDLEVBQUUsQ0FBQyxRQUFRLEdBQUcsRUFBRSxDQUFDO0FBQ25DLEtBQUssQ0FBQyxDQUFDO0FBQ1AsSUFBSSxZQUFZLENBQUMsT0FBTyxDQUFDLG1CQUFtQixDQUFDLENBQUM7QUFDOUMsQ0FBQztBQUNELFNBQVMsaUJBQWlCLENBQUMsU0FBUyxFQUFFLFNBQVMsRUFBRTtBQUNqRCxJQUFJLE1BQU0sRUFBRSxHQUFHLFNBQVMsQ0FBQyxFQUFFLENBQUM7QUFDNUIsSUFBSSxJQUFJLEVBQUUsQ0FBQyxRQUFRLEtBQUssSUFBSSxFQUFFO0FBQzlCLFFBQVEsT0FBTyxDQUFDLEVBQUUsQ0FBQyxVQUFVLENBQUMsQ0FBQztBQUMvQixRQUFRLEVBQUUsQ0FBQyxRQUFRLElBQUksRUFBRSxDQUFDLFFBQVEsQ0FBQyxDQUFDLENBQUMsU0FBUyxDQUFDLENBQUM7QUFDaEQ7QUFDQTtBQUNBLFFBQVEsRUFBRSxDQUFDLFVBQVUsR0FBRyxFQUFFLENBQUMsUUFBUSxHQUFHLElBQUksQ0FBQztBQUMzQyxRQUFRLEVBQUUsQ0FBQyxHQUFHLEdBQUcsRUFBRSxDQUFDO0FBQ3BCLEtBQUs7QUFDTCxDQUFDO0FBQ0QsU0FBUyxVQUFVLENBQUMsU0FBUyxFQUFFLENBQUMsRUFBRTtBQUNsQyxJQUFJLElBQUksU0FBUyxDQUFDLEVBQUUsQ0FBQyxLQUFLLENBQUMsQ0FBQyxDQUFDLEtBQUssQ0FBQyxDQUFDLEVBQUU7QUFDdEMsUUFBUSxnQkFBZ0IsQ0FBQyxJQUFJLENBQUMsU0FBUyxDQUFDLENBQUM7QUFDekMsUUFBUSxlQUFlLEVBQUUsQ0FBQztBQUMxQixRQUFRLFNBQVMsQ0FBQyxFQUFFLENBQUMsS0FBSyxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQztBQUNuQyxLQUFLO0FBQ0wsSUFBSSxTQUFTLENBQUMsRUFBRSxDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUMsR0FBRyxFQUFFLElBQUksQ0FBQyxDQUFDLEtBQUssQ0FBQyxLQUFLLENBQUMsR0FBRyxFQUFFLENBQUMsQ0FBQyxDQUFDO0FBQ3hELENBQUM7QUFDRCxTQUFTLElBQUksQ0FBQyxTQUFTLEVBQUUsT0FBTyxFQUFFLFFBQVEsRUFBRSxlQUFlLEVBQUUsU0FBUyxFQUFFLEtBQUssRUFBRSxLQUFLLEdBQUcsQ0FBQyxDQUFDLENBQUMsQ0FBQyxFQUFFO0FBQzdGLElBQUksTUFBTSxnQkFBZ0IsR0FBRyxpQkFBaUIsQ0FBQztBQUMvQyxJQUFJLHFCQUFxQixDQUFDLFNBQVMsQ0FBQyxDQUFDO0FBQ3JDLElBQUksTUFBTSxXQUFXLEdBQUcsT0FBTyxDQUFDLEtBQUssSUFBSSxFQUFFLENBQUM7QUFDNUMsSUFBSSxNQUFNLEVBQUUsR0FBRyxTQUFTLENBQUMsRUFBRSxHQUFHO0FBQzlCLFFBQVEsUUFBUSxFQUFFLElBQUk7QUFDdEIsUUFBUSxHQUFHLEVBQUUsSUFBSTtBQUNqQjtBQUNBLFFBQVEsS0FBSztBQUNiLFFBQVEsTUFBTSxFQUFFLElBQUk7QUFDcEIsUUFBUSxTQUFTO0FBQ2pCLFFBQVEsS0FBSyxFQUFFLFlBQVksRUFBRTtBQUM3QjtBQUNBLFFBQVEsUUFBUSxFQUFFLEVBQUU7QUFDcEIsUUFBUSxVQUFVLEVBQUUsRUFBRTtBQUN0QixRQUFRLGFBQWEsRUFBRSxFQUFFO0FBQ3pCLFFBQVEsWUFBWSxFQUFFLEVBQUU7QUFDeEIsUUFBUSxPQUFPLEVBQUUsSUFBSSxHQUFHLENBQUMsZ0JBQWdCLEdBQUcsZ0JBQWdCLENBQUMsRUFBRSxDQUFDLE9BQU8sR0FBRyxFQUFFLENBQUM7QUFDN0U7QUFDQSxRQUFRLFNBQVMsRUFBRSxZQUFZLEVBQUU7QUFDakMsUUFBUSxLQUFLO0FBQ2IsUUFBUSxVQUFVLEVBQUUsS0FBSztBQUN6QixLQUFLLENBQUM7QUFDTixJQUFJLElBQUksS0FBSyxHQUFHLEtBQUssQ0FBQztBQUN0QixJQUFJLEVBQUUsQ0FBQyxHQUFHLEdBQUcsUUFBUTtBQUNyQixVQUFVLFFBQVEsQ0FBQyxTQUFTLEVBQUUsV0FBVyxFQUFFLENBQUMsQ0FBQyxFQUFFLEdBQUcsRUFBRSxHQUFHLElBQUksS0FBSztBQUNoRSxZQUFZLE1BQU0sS0FBSyxHQUFHLElBQUksQ0FBQyxNQUFNLEdBQUcsSUFBSSxDQUFDLENBQUMsQ0FBQyxHQUFHLEdBQUcsQ0FBQztBQUN0RCxZQUFZLElBQUksRUFBRSxDQUFDLEdBQUcsSUFBSSxTQUFTLENBQUMsRUFBRSxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsRUFBRSxFQUFFLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxHQUFHLEtBQUssQ0FBQyxFQUFFO0FBQ25FLGdCQUFnQixJQUFJLENBQUMsRUFBRSxDQUFDLFVBQVUsSUFBSSxFQUFFLENBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQztBQUNqRCxvQkFBb0IsRUFBRSxDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUMsQ0FBQyxLQUFLLENBQUMsQ0FBQztBQUN2QyxnQkFBZ0IsSUFBSSxLQUFLO0FBQ3pCLG9CQUFvQixVQUFVLENBQUMsU0FBUyxFQUFFLENBQUMsQ0FBQyxDQUFDO0FBQzdDLGFBQWE7QUFDYixZQUFZLE9BQU8sR0FBRyxDQUFDO0FBQ3ZCLFNBQVMsQ0FBQztBQUNWLFVBQVUsRUFBRSxDQUFDO0FBQ2IsSUFBSSxFQUFFLENBQUMsTUFBTSxFQUFFLENBQUM7QUFDaEIsSUFBSSxLQUFLLEdBQUcsSUFBSSxDQUFDO0FBQ2pCLElBQUksT0FBTyxDQUFDLEVBQUUsQ0FBQyxhQUFhLENBQUMsQ0FBQztBQUM5QjtBQUNBLElBQUksRUFBRSxDQUFDLFFBQVEsR0FBRyxlQUFlLEdBQUcsZUFBZSxDQUFDLEVBQUUsQ0FBQyxHQUFHLENBQUMsR0FBRyxLQUFLLENBQUM7QUFDcEUsSUFBSSxJQUFJLE9BQU8sQ0FBQyxNQUFNLEVBQUU7QUFDeEIsUUFBUSxJQUFJLE9BQU8sQ0FBQyxPQUFPLEVBQUU7QUFDN0IsWUFBWSxNQUFNLEtBQUssR0FBRyxRQUFRLENBQUMsT0FBTyxDQUFDLE1BQU0sQ0FBQyxDQUFDO0FBQ25EO0FBQ0EsWUFBWSxFQUFFLENBQUMsUUFBUSxJQUFJLEVBQUUsQ0FBQyxRQUFRLENBQUMsQ0FBQyxDQUFDLEtBQUssQ0FBQyxDQUFDO0FBQ2hELFlBQVksS0FBSyxDQUFDLE9BQU8sQ0FBQyxNQUFNLENBQUMsQ0FBQztBQUNsQyxTQUFTO0FBQ1QsYUFBYTtBQUNiO0FBQ0EsWUFBWSxFQUFFLENBQUMsUUFBUSxJQUFJLEVBQUUsQ0FBQyxRQUFRLENBQUMsQ0FBQyxFQUFFLENBQUM7QUFDM0MsU0FBUztBQUNULFFBQVEsSUFBSSxPQUFPLENBQUMsS0FBSztBQUN6QixZQUFZLGFBQWEsQ0FBQyxTQUFTLENBQUMsRUFBRSxDQUFDLFFBQVEsQ0FBQyxDQUFDO0FBQ2pELFFBQVEsZUFBZSxDQUFDLFNBQVMsRUFBRSxPQUFPLENBQUMsTUFBTSxFQUFFLE9BQU8sQ0FBQyxNQUFNLENBQUMsQ0FBQztBQUNuRSxRQUFRLEtBQUssRUFBRSxDQUFDO0FBQ2hCLEtBQUs7QUFDTCxJQUFJLHFCQUFxQixDQUFDLGdCQUFnQixDQUFDLENBQUM7QUFDNUMsQ0FBQztBQXlDRCxNQUFNLGVBQWUsQ0FBQztBQUN0QixJQUFJLFFBQVEsR0FBRztBQUNmLFFBQVEsaUJBQWlCLENBQUMsSUFBSSxFQUFFLENBQUMsQ0FBQyxDQUFDO0FBQ25DLFFBQVEsSUFBSSxDQUFDLFFBQVEsR0FBRyxJQUFJLENBQUM7QUFDN0IsS0FBSztBQUNMLElBQUksR0FBRyxDQUFDLElBQUksRUFBRSxRQUFRLEVBQUU7QUFDeEIsUUFBUSxNQUFNLFNBQVMsSUFBSSxJQUFJLENBQUMsRUFBRSxDQUFDLFNBQVMsQ0FBQyxJQUFJLENBQUMsS0FBSyxJQUFJLENBQUMsRUFBRSxDQUFDLFNBQVMsQ0FBQyxJQUFJLENBQUMsR0FBRyxFQUFFLENBQUMsQ0FBQyxDQUFDO0FBQ3RGLFFBQVEsU0FBUyxDQUFDLElBQUksQ0FBQyxRQUFRLENBQUMsQ0FBQztBQUNqQyxRQUFRLE9BQU8sTUFBTTtBQUNyQixZQUFZLE1BQU0sS0FBSyxHQUFHLFNBQVMsQ0FBQyxPQUFPLENBQUMsUUFBUSxDQUFDLENBQUM7QUFDdEQsWUFBWSxJQUFJLEtBQUssS0FBSyxDQUFDLENBQUM7QUFDNUIsZ0JBQWdCLFNBQVMsQ0FBQyxNQUFNLENBQUMsS0FBSyxFQUFFLENBQUMsQ0FBQyxDQUFDO0FBQzNDLFNBQVMsQ0FBQztBQUNWLEtBQUs7QUFDTCxJQUFJLElBQUksQ0FBQyxPQUFPLEVBQUU7QUFDbEIsUUFBUSxJQUFJLElBQUksQ0FBQyxLQUFLLElBQUksQ0FBQyxRQUFRLENBQUMsT0FBTyxDQUFDLEVBQUU7QUFDOUMsWUFBWSxJQUFJLENBQUMsRUFBRSxDQUFDLFVBQVUsR0FBRyxJQUFJLENBQUM7QUFDdEMsWUFBWSxJQUFJLENBQUMsS0FBSyxDQUFDLE9BQU8sQ0FBQyxDQUFDO0FBQ2hDLFlBQVksSUFBSSxDQUFDLEVBQUUsQ0FBQyxVQUFVLEdBQUcsS0FBSyxDQUFDO0FBQ3ZDLFNBQVM7QUFDVCxLQUFLO0FBQ0w7O0FDbmhEQSxXQUFjLEdBQUcsT0FBTyxDQUFDO0FBQ3pCO0FBQ0EsU0FBUyxPQUFPLEVBQUUsSUFBSSxFQUFFO0FBQ3hCLElBQUksSUFBSSxFQUFFLElBQUksWUFBWSxPQUFPLENBQUMsRUFBRSxPQUFPLElBQUksT0FBTyxDQUFDLElBQUksQ0FBQyxDQUFDO0FBQzdELElBQUksSUFBSSxDQUFDLE9BQU8sR0FBRyxJQUFJLElBQUksRUFBRSxDQUFDO0FBQzlCLElBQUksSUFBSSxDQUFDLE1BQU0sR0FBRyxJQUFJLENBQUMsT0FBTyxDQUFDLE1BQU0sQ0FBQyxVQUFVLElBQUksRUFBRSxHQUFHLEVBQUU7QUFDM0QsUUFBUSxPQUFPLElBQUksR0FBRyxHQUFHLENBQUMsTUFBTTtBQUNoQyxLQUFLLEVBQUUsQ0FBQyxDQUFDLENBQUM7QUFDVixDQUFDO0FBQ0Q7QUFDQSxPQUFPLENBQUMsU0FBUyxDQUFDLElBQUksR0FBRyxZQUFZO0FBQ3JDLElBQUksS0FBSyxJQUFJLENBQUMsR0FBRyxDQUFDLEVBQUUsQ0FBQyxHQUFHLFNBQVMsQ0FBQyxNQUFNLEVBQUUsQ0FBQyxFQUFFLEVBQUU7QUFDL0MsUUFBUSxJQUFJLENBQUMsTUFBTSxDQUFDLFFBQVEsQ0FBQyxTQUFTLENBQUMsQ0FBQyxDQUFDLENBQUMsRUFBRTtBQUM1QyxZQUFZLE1BQU0sSUFBSSxTQUFTLENBQUMsNEJBQTRCLENBQUMsQ0FBQztBQUM5RCxTQUFTO0FBQ1QsS0FBSztBQUNMO0FBQ0EsSUFBSSxLQUFLLElBQUksQ0FBQyxHQUFHLENBQUMsRUFBRSxDQUFDLEdBQUcsU0FBUyxDQUFDLE1BQU0sRUFBRSxDQUFDLEVBQUUsRUFBRTtBQUMvQyxRQUFRLElBQUksR0FBRyxHQUFHLFNBQVMsQ0FBQyxDQUFDLENBQUMsQ0FBQztBQUMvQixRQUFRLElBQUksQ0FBQyxPQUFPLENBQUMsSUFBSSxDQUFDLEdBQUcsQ0FBQyxDQUFDO0FBQy9CLFFBQVEsSUFBSSxDQUFDLE1BQU0sSUFBSSxHQUFHLENBQUMsTUFBTSxDQUFDO0FBQ2xDLEtBQUs7QUFDTCxJQUFJLE9BQU8sSUFBSSxDQUFDLE1BQU0sQ0FBQztBQUN2QixDQUFDLENBQUM7QUFDRjtBQUNBLE9BQU8sQ0FBQyxTQUFTLENBQUMsT0FBTyxHQUFHLFlBQVk7QUFDeEMsSUFBSSxLQUFLLElBQUksQ0FBQyxHQUFHLENBQUMsRUFBRSxDQUFDLEdBQUcsU0FBUyxDQUFDLE1BQU0sRUFBRSxDQUFDLEVBQUUsRUFBRTtBQUMvQyxRQUFRLElBQUksQ0FBQyxNQUFNLENBQUMsUUFBUSxDQUFDLFNBQVMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxFQUFFO0FBQzVDLFlBQVksTUFBTSxJQUFJLFNBQVMsQ0FBQywrQkFBK0IsQ0FBQyxDQUFDO0FBQ2pFLFNBQVM7QUFDVCxLQUFLO0FBQ0w7QUFDQSxJQUFJLEtBQUssSUFBSSxDQUFDLEdBQUcsQ0FBQyxFQUFFLENBQUMsR0FBRyxTQUFTLENBQUMsTUFBTSxFQUFFLENBQUMsRUFBRSxFQUFFO0FBQy9DLFFBQVEsSUFBSSxHQUFHLEdBQUcsU0FBUyxDQUFDLENBQUMsQ0FBQyxDQUFDO0FBQy9CLFFBQVEsSUFBSSxDQUFDLE9BQU8sQ0FBQyxPQUFPLENBQUMsR0FBRyxDQUFDLENBQUM7QUFDbEMsUUFBUSxJQUFJLENBQUMsTUFBTSxJQUFJLEdBQUcsQ0FBQyxNQUFNLENBQUM7QUFDbEMsS0FBSztBQUNMLElBQUksT0FBTyxJQUFJLENBQUMsTUFBTSxDQUFDO0FBQ3ZCLENBQUMsQ0FBQztBQUNGO0FBQ0EsT0FBTyxDQUFDLFNBQVMsQ0FBQyxJQUFJLEdBQUcsVUFBVSxHQUFHLEVBQUUsTUFBTSxFQUFFLEtBQUssRUFBRSxHQUFHLEVBQUU7QUFDNUQsSUFBSSxPQUFPLElBQUksQ0FBQyxLQUFLLENBQUMsS0FBSyxFQUFFLEdBQUcsQ0FBQyxDQUFDLElBQUksQ0FBQyxHQUFHLEVBQUUsTUFBTSxFQUFFLENBQUMsRUFBRSxHQUFHLEdBQUcsS0FBSyxDQUFDLENBQUM7QUFDcEUsQ0FBQyxDQUFDO0FBQ0Y7QUFDQSxPQUFPLENBQUMsU0FBUyxDQUFDLE1BQU0sR0FBRyxVQUFVLENBQUMsRUFBRSxPQUFPLEVBQUU7QUFDakQsSUFBSSxJQUFJLE9BQU8sR0FBRyxJQUFJLENBQUMsT0FBTyxDQUFDO0FBQy9CLElBQUksSUFBSSxLQUFLLEdBQUcsQ0FBQyxJQUFJLENBQUMsR0FBRyxDQUFDLEdBQUcsSUFBSSxDQUFDLE1BQU0sR0FBRyxDQUFDLENBQUM7QUFDN0MsSUFBSSxJQUFJLElBQUksR0FBRyxFQUFFLENBQUMsS0FBSyxDQUFDLElBQUksQ0FBQyxTQUFTLEVBQUUsQ0FBQyxDQUFDLENBQUM7QUFDM0M7QUFDQSxJQUFJLElBQUksT0FBTyxLQUFLLFNBQVMsRUFBRTtBQUMvQixRQUFRLE9BQU8sR0FBRyxJQUFJLENBQUMsTUFBTSxHQUFHLEtBQUssQ0FBQztBQUN0QyxLQUFLO0FBQ0wsU0FBUyxJQUFJLE9BQU8sR0FBRyxJQUFJLENBQUMsTUFBTSxHQUFHLEtBQUssRUFBRTtBQUM1QyxRQUFRLE9BQU8sR0FBRyxJQUFJLENBQUMsTUFBTSxHQUFHLEtBQUssQ0FBQztBQUN0QyxLQUFLO0FBQ0w7QUFDQSxJQUFJLEtBQUssSUFBSSxDQUFDLEdBQUcsQ0FBQyxFQUFFLENBQUMsR0FBRyxJQUFJLENBQUMsTUFBTSxFQUFFLENBQUMsRUFBRSxFQUFFO0FBQzFDLFFBQVEsSUFBSSxDQUFDLE1BQU0sSUFBSSxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUMsTUFBTSxDQUFDO0FBQ3RDLEtBQUs7QUFDTDtBQUNBLElBQUksSUFBSSxPQUFPLEdBQUcsSUFBSSxPQUFPLEVBQUUsQ0FBQztBQUVoQztBQUNBLElBQUksSUFBSSxVQUFVLEdBQUcsQ0FBQyxDQUFDO0FBQ3ZCLElBQUk7QUFDSixRQUFRLElBQUksRUFBRSxHQUFHLENBQUM7QUFDbEIsUUFBUSxFQUFFLEdBQUcsT0FBTyxDQUFDLE1BQU0sSUFBSSxVQUFVLEdBQUcsT0FBTyxDQUFDLEVBQUUsQ0FBQyxDQUFDLE1BQU0sR0FBRyxLQUFLO0FBQ3RFLFFBQVEsRUFBRSxHQUFHO0FBQ2IsTUFBTSxFQUFFLFVBQVUsSUFBSSxPQUFPLENBQUMsRUFBRSxDQUFDLENBQUMsT0FBTSxFQUFFO0FBQzFDO0FBQ0EsSUFBSSxJQUFJLEtBQUssR0FBRyxVQUFVLEdBQUcsQ0FBQyxFQUFFO0FBQ2hDLFFBQVEsSUFBSSxLQUFLLEdBQUcsS0FBSyxHQUFHLFVBQVUsQ0FBQztBQUN2QztBQUNBLFFBQVEsSUFBSSxLQUFLLEdBQUcsT0FBTyxHQUFHLE9BQU8sQ0FBQyxFQUFFLENBQUMsQ0FBQyxNQUFNLEVBQUU7QUFDbEQsWUFBWSxPQUFPLENBQUMsSUFBSSxDQUFDLE9BQU8sQ0FBQyxFQUFFLENBQUMsQ0FBQyxLQUFLLENBQUMsS0FBSyxFQUFFLEtBQUssR0FBRyxPQUFPLENBQUMsQ0FBQyxDQUFDO0FBQ3BFO0FBQ0EsWUFBWSxJQUFJLElBQUksR0FBRyxPQUFPLENBQUMsRUFBRSxDQUFDLENBQUM7QUFDbkM7QUFDQSxZQUFZLElBQUksSUFBSSxHQUFHLElBQUksTUFBTSxDQUFDLEtBQUssQ0FBQyxDQUFDO0FBQ3pDLFlBQVksS0FBSyxJQUFJLENBQUMsR0FBRyxDQUFDLEVBQUUsQ0FBQyxHQUFHLEtBQUssRUFBRSxDQUFDLEVBQUUsRUFBRTtBQUM1QyxnQkFBZ0IsSUFBSSxDQUFDLENBQUMsQ0FBQyxHQUFHLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQztBQUNsQyxhQUFhO0FBQ2I7QUFDQSxZQUFZLElBQUksSUFBSSxHQUFHLElBQUksTUFBTSxDQUFDLElBQUksQ0FBQyxNQUFNLEdBQUcsS0FBSyxHQUFHLE9BQU8sQ0FBQyxDQUFDO0FBQ2pFLFlBQVksS0FBSyxJQUFJLENBQUMsR0FBRyxLQUFLLEdBQUcsT0FBTyxFQUFFLENBQUMsR0FBRyxJQUFJLENBQUMsTUFBTSxFQUFFLENBQUMsRUFBRSxFQUFFO0FBQ2hFLGdCQUFnQixJQUFJLEVBQUUsQ0FBQyxHQUFHLE9BQU8sR0FBRyxLQUFLLEVBQUUsR0FBRyxJQUFJLENBQUMsQ0FBQyxFQUFDO0FBQ3JELGFBQWE7QUFDYjtBQUNBLFlBQVksSUFBSSxJQUFJLENBQUMsTUFBTSxHQUFHLENBQUMsRUFBRTtBQUNqQyxnQkFBZ0IsSUFBSSxLQUFLLEdBQUcsSUFBSSxDQUFDLEtBQUssRUFBRSxDQUFDO0FBQ3pDLGdCQUFnQixLQUFLLENBQUMsT0FBTyxDQUFDLElBQUksQ0FBQyxDQUFDO0FBQ3BDLGdCQUFnQixLQUFLLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxDQUFDO0FBQ2pDLGdCQUFnQixPQUFPLENBQUMsTUFBTSxDQUFDLEtBQUssQ0FBQyxPQUFPLEVBQUUsRUFBRSxFQUFFLEVBQUUsQ0FBQyxFQUFFLENBQUMsTUFBTSxDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUM7QUFDdkUsZ0JBQWdCLEVBQUUsSUFBSSxLQUFLLENBQUMsTUFBTSxDQUFDO0FBQ25DLGdCQUFnQixJQUFJLEdBQUcsRUFBRSxDQUFDO0FBQzFCLGFBQWE7QUFDYixpQkFBaUI7QUFDakIsZ0JBQWdCLE9BQU8sQ0FBQyxNQUFNLENBQUMsRUFBRSxFQUFFLENBQUMsRUFBRSxJQUFJLEVBQUUsSUFBSSxDQUFDLENBQUM7QUFDbEQ7QUFDQSxnQkFBZ0IsRUFBRSxJQUFJLENBQUMsQ0FBQztBQUN4QixhQUFhO0FBQ2IsU0FBUztBQUNULGFBQWE7QUFDYixZQUFZLE9BQU8sQ0FBQyxJQUFJLENBQUMsT0FBTyxDQUFDLEVBQUUsQ0FBQyxDQUFDLEtBQUssQ0FBQyxLQUFLLENBQUMsQ0FBQyxDQUFDO0FBQ25ELFlBQVksT0FBTyxDQUFDLEVBQUUsQ0FBQyxHQUFHLE9BQU8sQ0FBQyxFQUFFLENBQUMsQ0FBQyxLQUFLLENBQUMsQ0FBQyxFQUFFLEtBQUssQ0FBQyxDQUFDO0FBQ3RELFlBQVksRUFBRSxHQUFHLENBQUM7QUFDbEIsU0FBUztBQUNULEtBQUs7QUFDTDtBQUNBLElBQUksSUFBSSxJQUFJLENBQUMsTUFBTSxHQUFHLENBQUMsRUFBRTtBQUN6QixRQUFRLE9BQU8sQ0FBQyxNQUFNLENBQUMsS0FBSyxDQUFDLE9BQU8sRUFBRSxFQUFFLEVBQUUsRUFBRSxDQUFDLEVBQUUsQ0FBQyxNQUFNLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQztBQUM5RCxRQUFRLEVBQUUsSUFBSSxJQUFJLENBQUMsTUFBTSxDQUFDO0FBQzFCLEtBQUs7QUFDTDtBQUNBLElBQUksT0FBTyxPQUFPLENBQUMsTUFBTSxHQUFHLE9BQU8sRUFBRTtBQUNyQyxRQUFRLElBQUksR0FBRyxHQUFHLE9BQU8sQ0FBQyxFQUFFLENBQUMsQ0FBQztBQUM5QixRQUFRLElBQUksR0FBRyxHQUFHLEdBQUcsQ0FBQyxNQUFNLENBQUM7QUFDN0IsUUFBUSxJQUFJLElBQUksR0FBRyxJQUFJLENBQUMsR0FBRyxDQUFDLEdBQUcsRUFBRSxPQUFPLEdBQUcsT0FBTyxDQUFDLE1BQU0sQ0FBQyxDQUFDO0FBQzNEO0FBQ0EsUUFBUSxJQUFJLElBQUksS0FBSyxHQUFHLEVBQUU7QUFDMUIsWUFBWSxPQUFPLENBQUMsSUFBSSxDQUFDLEdBQUcsQ0FBQyxDQUFDO0FBQzlCLFlBQVksT0FBTyxDQUFDLE1BQU0sQ0FBQyxFQUFFLEVBQUUsQ0FBQyxDQUFDLENBQUM7QUFDbEMsU0FBUztBQUNULGFBQWE7QUFDYixZQUFZLE9BQU8sQ0FBQyxJQUFJLENBQUMsR0FBRyxDQUFDLEtBQUssQ0FBQyxDQUFDLEVBQUUsSUFBSSxDQUFDLENBQUMsQ0FBQztBQUM3QyxZQUFZLE9BQU8sQ0FBQyxFQUFFLENBQUMsR0FBRyxPQUFPLENBQUMsRUFBRSxDQUFDLENBQUMsS0FBSyxDQUFDLElBQUksQ0FBQyxDQUFDO0FBQ2xELFNBQVM7QUFDVCxLQUFLO0FBQ0w7QUFDQSxJQUFJLElBQUksQ0FBQyxNQUFNLElBQUksT0FBTyxDQUFDLE1BQU0sQ0FBQztBQUNsQztBQUNBLElBQUksT0FBTyxPQUFPLENBQUM7QUFDbkIsQ0FBQyxDQUFDO0FBQ0Y7QUFDQSxPQUFPLENBQUMsU0FBUyxDQUFDLEtBQUssR0FBRyxVQUFVLENBQUMsRUFBRSxDQUFDLEVBQUU7QUFDMUMsSUFBSSxJQUFJLE9BQU8sR0FBRyxJQUFJLENBQUMsT0FBTyxDQUFDO0FBQy9CLElBQUksSUFBSSxDQUFDLEtBQUssU0FBUyxFQUFFLENBQUMsR0FBRyxJQUFJLENBQUMsTUFBTSxDQUFDO0FBQ3pDLElBQUksSUFBSSxDQUFDLEtBQUssU0FBUyxFQUFFLENBQUMsR0FBRyxDQUFDLENBQUM7QUFDL0I7QUFDQSxJQUFJLElBQUksQ0FBQyxHQUFHLElBQUksQ0FBQyxNQUFNLEVBQUUsQ0FBQyxHQUFHLElBQUksQ0FBQyxNQUFNLENBQUM7QUFDekM7QUFDQSxJQUFJLElBQUksVUFBVSxHQUFHLENBQUMsQ0FBQztBQUN2QixJQUFJO0FBQ0osUUFBUSxJQUFJLEVBQUUsR0FBRyxDQUFDO0FBQ2xCLFFBQVEsRUFBRSxHQUFHLE9BQU8sQ0FBQyxNQUFNLElBQUksVUFBVSxHQUFHLE9BQU8sQ0FBQyxFQUFFLENBQUMsQ0FBQyxNQUFNLElBQUksQ0FBQztBQUNuRSxRQUFRLEVBQUUsR0FBRztBQUNiLE1BQU0sRUFBRSxVQUFVLElBQUksT0FBTyxDQUFDLEVBQUUsQ0FBQyxDQUFDLE9BQU0sRUFBRTtBQUMxQztBQUNBLElBQUksSUFBSSxNQUFNLEdBQUcsSUFBSSxNQUFNLENBQUMsQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDO0FBQ25DO0FBQ0EsSUFBSSxJQUFJLEVBQUUsR0FBRyxDQUFDLENBQUM7QUFDZixJQUFJLEtBQUssSUFBSSxFQUFFLEdBQUcsRUFBRSxFQUFFLEVBQUUsR0FBRyxDQUFDLEdBQUcsQ0FBQyxJQUFJLEVBQUUsR0FBRyxPQUFPLENBQUMsTUFBTSxFQUFFLEVBQUUsRUFBRSxFQUFFO0FBQy9ELFFBQVEsSUFBSSxHQUFHLEdBQUcsT0FBTyxDQUFDLEVBQUUsQ0FBQyxDQUFDLE1BQU0sQ0FBQztBQUNyQztBQUNBLFFBQVEsSUFBSSxLQUFLLEdBQUcsRUFBRSxLQUFLLENBQUMsR0FBRyxDQUFDLEdBQUcsVUFBVSxHQUFHLENBQUMsQ0FBQztBQUNsRCxRQUFRLElBQUksR0FBRyxHQUFHLEVBQUUsR0FBRyxHQUFHLElBQUksQ0FBQyxHQUFHLENBQUM7QUFDbkMsY0FBYyxJQUFJLENBQUMsR0FBRyxDQUFDLEtBQUssSUFBSSxDQUFDLEdBQUcsQ0FBQyxDQUFDLEdBQUcsRUFBRSxFQUFFLEdBQUcsQ0FBQztBQUNqRCxjQUFjLEdBQUc7QUFDakIsU0FBUztBQUNUO0FBQ0EsUUFBUSxPQUFPLENBQUMsRUFBRSxDQUFDLENBQUMsSUFBSSxDQUFDLE1BQU0sRUFBRSxFQUFFLEVBQUUsS0FBSyxFQUFFLEdBQUcsQ0FBQyxDQUFDO0FBQ2pELFFBQVEsRUFBRSxJQUFJLEdBQUcsR0FBRyxLQUFLLENBQUM7QUFDMUIsS0FBSztBQUNMO0FBQ0EsSUFBSSxPQUFPLE1BQU0sQ0FBQztBQUNsQixDQUFDLENBQUM7QUFDRjtBQUNBLE9BQU8sQ0FBQyxTQUFTLENBQUMsR0FBRyxHQUFHLFVBQVUsQ0FBQyxFQUFFO0FBQ3JDLElBQUksSUFBSSxDQUFDLEdBQUcsQ0FBQyxJQUFJLENBQUMsSUFBSSxJQUFJLENBQUMsTUFBTSxFQUFFLE1BQU0sSUFBSSxLQUFLLENBQUMsS0FBSyxDQUFDLENBQUM7QUFDMUQsSUFBSSxJQUFJLENBQUMsR0FBRyxDQUFDLEVBQUUsRUFBRSxHQUFHLENBQUMsRUFBRSxFQUFFLEdBQUcsSUFBSSxDQUFDO0FBQ2pDLElBQUksU0FBUztBQUNiLFFBQVEsRUFBRSxHQUFHLElBQUksQ0FBQyxPQUFPLENBQUMsRUFBRSxDQUFDLENBQUM7QUFDOUIsUUFBUSxJQUFJLENBQUMsR0FBRyxFQUFFLENBQUMsTUFBTSxFQUFFO0FBQzNCLFlBQVksT0FBTyxDQUFDLEdBQUcsRUFBRSxFQUFFLEVBQUUsTUFBTSxFQUFFLENBQUMsQ0FBQyxDQUFDO0FBQ3hDLFNBQVMsTUFBTTtBQUNmLFlBQVksQ0FBQyxJQUFJLEVBQUUsQ0FBQyxNQUFNLENBQUM7QUFDM0IsU0FBUztBQUNULFFBQVEsRUFBRSxFQUFFLENBQUM7QUFDYixLQUFLO0FBQ0wsQ0FBQyxDQUFDO0FBQ0Y7QUFDQSxPQUFPLENBQUMsU0FBUyxDQUFDLEdBQUcsR0FBRyxTQUFTLEdBQUcsRUFBRSxDQUFDLEVBQUU7QUFDekMsSUFBSSxJQUFJLEdBQUcsR0FBRyxJQUFJLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxDQUFDO0FBQzFCO0FBQ0EsSUFBSSxPQUFPLElBQUksQ0FBQyxPQUFPLENBQUMsR0FBRyxDQUFDLEdBQUcsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxHQUFHLENBQUMsTUFBTSxDQUFDLENBQUM7QUFDakQsQ0FBQyxDQUFDO0FBQ0Y7QUFDQSxPQUFPLENBQUMsU0FBUyxDQUFDLEdBQUcsR0FBRyxTQUFTLEdBQUcsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFO0FBQzVDLElBQUksSUFBSSxHQUFHLEdBQUcsSUFBSSxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsQ0FBQztBQUMxQjtBQUNBLElBQUksT0FBTyxJQUFJLENBQUMsT0FBTyxDQUFDLEdBQUcsQ0FBQyxHQUFHLENBQUMsQ0FBQyxHQUFHLENBQUMsR0FBRyxDQUFDLE1BQU0sRUFBRSxDQUFDLENBQUMsQ0FBQztBQUNwRCxDQUFDLENBQUM7QUFDRjtBQUNBLE9BQU8sQ0FBQyxTQUFTLENBQUMsT0FBTyxHQUFHLFVBQVUsTUFBTSxFQUFFLE1BQU0sRUFBRTtBQUN0RCxJQUFJLElBQUksUUFBUSxLQUFLLE9BQU8sTUFBTSxFQUFFO0FBQ3BDLFFBQVEsTUFBTSxHQUFHLElBQUksTUFBTSxDQUFDLE1BQU0sQ0FBQyxDQUFDO0FBQ3BDLEtBQUssTUFBTSxJQUFJLE1BQU0sWUFBWSxNQUFNLEVBQUUsQ0FFcEMsTUFBTTtBQUNYLFFBQVEsTUFBTSxJQUFJLEtBQUssQ0FBQyxrQ0FBa0MsQ0FBQyxDQUFDO0FBQzVELEtBQUs7QUFDTDtBQUNBLElBQUksSUFBSSxDQUFDLE1BQU0sQ0FBQyxNQUFNLEVBQUU7QUFDeEIsUUFBUSxPQUFPLENBQUMsQ0FBQztBQUNqQixLQUFLO0FBQ0w7QUFDQSxJQUFJLElBQUksQ0FBQyxJQUFJLENBQUMsTUFBTSxFQUFFO0FBQ3RCLFFBQVEsT0FBTyxDQUFDLENBQUMsQ0FBQztBQUNsQixLQUFLO0FBQ0w7QUFDQSxJQUFJLElBQUksQ0FBQyxHQUFHLENBQUMsRUFBRSxDQUFDLEdBQUcsQ0FBQyxFQUFFLEtBQUssR0FBRyxDQUFDLEVBQUUsTUFBTSxFQUFFLEdBQUcsR0FBRyxDQUFDLENBQUM7QUFDakQ7QUFDQTtBQUNBLElBQUksSUFBSSxNQUFNLEVBQUU7QUFDaEIsUUFBUSxJQUFJLENBQUMsR0FBRyxJQUFJLENBQUMsR0FBRyxDQUFDLE1BQU0sQ0FBQyxDQUFDO0FBQ2pDLFFBQVEsQ0FBQyxHQUFHLENBQUMsQ0FBQyxHQUFHLENBQUM7QUFDbEIsUUFBUSxDQUFDLEdBQUcsQ0FBQyxDQUFDLE1BQU0sQ0FBQztBQUNyQixRQUFRLEdBQUcsR0FBRyxNQUFNLENBQUM7QUFDckIsS0FBSztBQUNMO0FBQ0E7QUFDQSxJQUFJLFNBQVM7QUFDYixRQUFRLE9BQU8sQ0FBQyxJQUFJLElBQUksQ0FBQyxPQUFPLENBQUMsQ0FBQyxDQUFDLENBQUMsTUFBTSxFQUFFO0FBQzVDLFlBQVksQ0FBQyxHQUFHLENBQUMsQ0FBQztBQUNsQixZQUFZLENBQUMsRUFBRSxDQUFDO0FBQ2hCO0FBQ0EsWUFBWSxJQUFJLENBQUMsSUFBSSxJQUFJLENBQUMsT0FBTyxDQUFDLE1BQU0sRUFBRTtBQUMxQztBQUNBLGdCQUFnQixPQUFPLENBQUMsQ0FBQyxDQUFDO0FBQzFCLGFBQWE7QUFDYixTQUFTO0FBQ1Q7QUFDQSxRQUFRLElBQUksSUFBSSxHQUFHLElBQUksQ0FBQyxPQUFPLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7QUFDdEM7QUFDQSxRQUFRLElBQUksSUFBSSxJQUFJLE1BQU0sQ0FBQyxLQUFLLENBQUMsRUFBRTtBQUNuQztBQUNBLFlBQVksSUFBSSxLQUFLLElBQUksQ0FBQyxFQUFFO0FBQzVCLGdCQUFnQixNQUFNLEdBQUc7QUFDekIsb0JBQW9CLENBQUMsRUFBRSxDQUFDO0FBQ3hCLG9CQUFvQixDQUFDLEVBQUUsQ0FBQztBQUN4QixvQkFBb0IsR0FBRyxFQUFFLEdBQUc7QUFDNUIsaUJBQWlCLENBQUM7QUFDbEIsYUFBYTtBQUNiLFlBQVksS0FBSyxFQUFFLENBQUM7QUFDcEIsWUFBWSxJQUFJLEtBQUssSUFBSSxNQUFNLENBQUMsTUFBTSxFQUFFO0FBQ3hDO0FBQ0EsZ0JBQWdCLE9BQU8sTUFBTSxDQUFDLEdBQUcsQ0FBQztBQUNsQyxhQUFhO0FBQ2IsU0FBUyxNQUFNLElBQUksS0FBSyxJQUFJLENBQUMsRUFBRTtBQUMvQjtBQUNBO0FBQ0EsWUFBWSxDQUFDLEdBQUcsTUFBTSxDQUFDLENBQUMsQ0FBQztBQUN6QixZQUFZLENBQUMsR0FBRyxNQUFNLENBQUMsQ0FBQyxDQUFDO0FBQ3pCLFlBQVksR0FBRyxHQUFHLE1BQU0sQ0FBQyxHQUFHLENBQUM7QUFDN0IsWUFBWSxLQUFLLEdBQUcsQ0FBQyxDQUFDO0FBQ3RCLFNBQVM7QUFDVDtBQUNBLFFBQVEsQ0FBQyxFQUFFLENBQUM7QUFDWixRQUFRLEdBQUcsRUFBRSxDQUFDO0FBQ2QsS0FBSztBQUNMLENBQUMsQ0FBQztBQUNGO0FBQ0EsT0FBTyxDQUFDLFNBQVMsQ0FBQyxRQUFRLEdBQUcsV0FBVztBQUN4QyxJQUFJLE9BQU8sSUFBSSxDQUFDLEtBQUssRUFBRSxDQUFDO0FBQ3hCLEVBQUM7QUFDRDtBQUNBLE9BQU8sQ0FBQyxTQUFTLENBQUMsUUFBUSxHQUFHLFNBQVMsUUFBUSxFQUFFLEtBQUssRUFBRSxHQUFHLEVBQUU7QUFDNUQsSUFBSSxPQUFPLElBQUksQ0FBQyxLQUFLLENBQUMsS0FBSyxFQUFFLEdBQUcsQ0FBQyxDQUFDLFFBQVEsQ0FBQyxRQUFRLENBQUMsQ0FBQztBQUNyRDs7QUM1UUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUdBO0FBQ0EsU0FBUyxZQUFZLENBQUMsS0FBSyxFQUFFLE1BQU0sRUFBRTtBQUNyQyxFQUFFLFNBQVMsSUFBSSxHQUFHLEVBQUUsSUFBSSxDQUFDLFdBQVcsR0FBRyxLQUFLLENBQUMsRUFBRTtBQUMvQyxFQUFFLElBQUksQ0FBQyxTQUFTLEdBQUcsTUFBTSxDQUFDLFNBQVMsQ0FBQztBQUNwQyxFQUFFLEtBQUssQ0FBQyxTQUFTLEdBQUcsSUFBSSxJQUFJLEVBQUUsQ0FBQztBQUMvQixDQUFDO0FBQ0Q7QUFDQSxTQUFTLGVBQWUsQ0FBQyxPQUFPLEVBQUUsUUFBUSxFQUFFLEtBQUssRUFBRSxRQUFRLEVBQUU7QUFDN0QsRUFBRSxJQUFJLENBQUMsT0FBTyxJQUFJLE9BQU8sQ0FBQztBQUMxQixFQUFFLElBQUksQ0FBQyxRQUFRLEdBQUcsUUFBUSxDQUFDO0FBQzNCLEVBQUUsSUFBSSxDQUFDLEtBQUssTUFBTSxLQUFLLENBQUM7QUFDeEIsRUFBRSxJQUFJLENBQUMsUUFBUSxHQUFHLFFBQVEsQ0FBQztBQUMzQixFQUFFLElBQUksQ0FBQyxJQUFJLE9BQU8sYUFBYSxDQUFDO0FBQ2hDO0FBQ0EsRUFBRSxJQUFJLE9BQU8sS0FBSyxDQUFDLGlCQUFpQixLQUFLLFVBQVUsRUFBRTtBQUNyRCxJQUFJLEtBQUssQ0FBQyxpQkFBaUIsQ0FBQyxJQUFJLEVBQUUsZUFBZSxDQUFDLENBQUM7QUFDbkQsR0FBRztBQUNILENBQUM7QUFDRDtBQUNBLFlBQVksQ0FBQyxlQUFlLEVBQUUsS0FBSyxDQUFDLENBQUM7QUFDckM7QUFDQSxlQUFlLENBQUMsWUFBWSxHQUFHLFNBQVMsUUFBUSxFQUFFLEtBQUssRUFBRTtBQUN6RCxFQUFFLElBQUksd0JBQXdCLEdBQUc7QUFDakMsUUFBUSxPQUFPLEVBQUUsU0FBUyxXQUFXLEVBQUU7QUFDdkMsVUFBVSxPQUFPLElBQUksR0FBRyxhQUFhLENBQUMsV0FBVyxDQUFDLElBQUksQ0FBQyxHQUFHLElBQUksQ0FBQztBQUMvRCxTQUFTO0FBQ1Q7QUFDQSxRQUFRLE9BQU8sRUFBRSxTQUFTLFdBQVcsRUFBRTtBQUN2QyxVQUFVLElBQUksWUFBWSxHQUFHLEVBQUU7QUFDL0IsY0FBYyxDQUFDLENBQUM7QUFDaEI7QUFDQSxVQUFVLEtBQUssQ0FBQyxHQUFHLENBQUMsRUFBRSxDQUFDLEdBQUcsV0FBVyxDQUFDLEtBQUssQ0FBQyxNQUFNLEVBQUUsQ0FBQyxFQUFFLEVBQUU7QUFDekQsWUFBWSxZQUFZLElBQUksV0FBVyxDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUMsWUFBWSxLQUFLO0FBQ2pFLGdCQUFnQixXQUFXLENBQUMsV0FBVyxDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxHQUFHLEdBQUcsR0FBRyxXQUFXLENBQUMsV0FBVyxDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztBQUNqRyxnQkFBZ0IsV0FBVyxDQUFDLFdBQVcsQ0FBQyxLQUFLLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztBQUNsRCxXQUFXO0FBQ1g7QUFDQSxVQUFVLE9BQU8sR0FBRyxJQUFJLFdBQVcsQ0FBQyxRQUFRLEdBQUcsR0FBRyxHQUFHLEVBQUUsQ0FBQyxHQUFHLFlBQVksR0FBRyxHQUFHLENBQUM7QUFDOUUsU0FBUztBQUNUO0FBQ0EsUUFBUSxHQUFHLEVBQUUsU0FBUyxXQUFXLEVBQUU7QUFDbkMsVUFBVSxPQUFPLGVBQWUsQ0FBQztBQUNqQyxTQUFTO0FBQ1Q7QUFDQSxRQUFRLEdBQUcsRUFBRSxTQUFTLFdBQVcsRUFBRTtBQUNuQyxVQUFVLE9BQU8sY0FBYyxDQUFDO0FBQ2hDLFNBQVM7QUFDVDtBQUNBLFFBQVEsS0FBSyxFQUFFLFNBQVMsV0FBVyxFQUFFO0FBQ3JDLFVBQVUsT0FBTyxXQUFXLENBQUMsV0FBVyxDQUFDO0FBQ3pDLFNBQVM7QUFDVCxPQUFPLENBQUM7QUFDUjtBQUNBLEVBQUUsU0FBUyxHQUFHLENBQUMsRUFBRSxFQUFFO0FBQ25CLElBQUksT0FBTyxFQUFFLENBQUMsVUFBVSxDQUFDLENBQUMsQ0FBQyxDQUFDLFFBQVEsQ0FBQyxFQUFFLENBQUMsQ0FBQyxXQUFXLEVBQUUsQ0FBQztBQUN2RCxHQUFHO0FBQ0g7QUFDQSxFQUFFLFNBQVMsYUFBYSxDQUFDLENBQUMsRUFBRTtBQUM1QixJQUFJLE9BQU8sQ0FBQztBQUNaLE9BQU8sT0FBTyxDQUFDLEtBQUssRUFBRSxNQUFNLENBQUM7QUFDN0IsT0FBTyxPQUFPLENBQUMsSUFBSSxHQUFHLEtBQUssQ0FBQztBQUM1QixPQUFPLE9BQU8sQ0FBQyxLQUFLLEVBQUUsS0FBSyxDQUFDO0FBQzVCLE9BQU8sT0FBTyxDQUFDLEtBQUssRUFBRSxLQUFLLENBQUM7QUFDNUIsT0FBTyxPQUFPLENBQUMsS0FBSyxFQUFFLEtBQUssQ0FBQztBQUM1QixPQUFPLE9BQU8sQ0FBQyxLQUFLLEVBQUUsS0FBSyxDQUFDO0FBQzVCLE9BQU8sT0FBTyxDQUFDLGNBQWMsV0FBVyxTQUFTLEVBQUUsRUFBRSxFQUFFLE9BQU8sTUFBTSxHQUFHLEdBQUcsQ0FBQyxFQUFFLENBQUMsQ0FBQyxFQUFFLENBQUM7QUFDbEYsT0FBTyxPQUFPLENBQUMsdUJBQXVCLEVBQUUsU0FBUyxFQUFFLEVBQUUsRUFBRSxPQUFPLEtBQUssSUFBSSxHQUFHLENBQUMsRUFBRSxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUM7QUFDbkYsR0FBRztBQUNIO0FBQ0EsRUFBRSxTQUFTLFdBQVcsQ0FBQyxDQUFDLEVBQUU7QUFDMUIsSUFBSSxPQUFPLENBQUM7QUFDWixPQUFPLE9BQU8sQ0FBQyxLQUFLLEVBQUUsTUFBTSxDQUFDO0FBQzdCLE9BQU8sT0FBTyxDQUFDLEtBQUssRUFBRSxLQUFLLENBQUM7QUFDNUIsT0FBTyxPQUFPLENBQUMsS0FBSyxFQUFFLEtBQUssQ0FBQztBQUM1QixPQUFPLE9BQU8sQ0FBQyxJQUFJLEdBQUcsS0FBSyxDQUFDO0FBQzVCLE9BQU8sT0FBTyxDQUFDLEtBQUssRUFBRSxLQUFLLENBQUM7QUFDNUIsT0FBTyxPQUFPLENBQUMsS0FBSyxFQUFFLEtBQUssQ0FBQztBQUM1QixPQUFPLE9BQU8sQ0FBQyxLQUFLLEVBQUUsS0FBSyxDQUFDO0FBQzVCLE9BQU8sT0FBTyxDQUFDLEtBQUssRUFBRSxLQUFLLENBQUM7QUFDNUIsT0FBTyxPQUFPLENBQUMsY0FBYyxXQUFXLFNBQVMsRUFBRSxFQUFFLEVBQUUsT0FBTyxNQUFNLEdBQUcsR0FBRyxDQUFDLEVBQUUsQ0FBQyxD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
