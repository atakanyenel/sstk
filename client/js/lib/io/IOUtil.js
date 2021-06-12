var csv = require('papaparse');
var _ = require('util/util');

var IOUtil = {};

// Thin wrapper about papaparse (see http://papaparse.com/docs)
function parseDelimited(data, opts) {
  // By default, we assume there is a header, don't want empty lines, and will do dynamicTyping
  opts = _.defaults(Object.create(null), opts || {}, { header: true, skipEmptyLines: true, dynamicTyping: true });
  // Delimiter is not specified
  if (opts.delimiter == null && opts.filename) {
    if (opts.filename.endsWith('.tsv')) {
      opts.delimiter = '\t';
      opts.quoteChar = '\0'; // no quote char
    }
  }
  var parsed = csv.parse(data, opts);
  if (opts.remapFields) {
    parsed.data = _.each(parsed.data, function(d) {
      _.each(opts.remapFields, function(nf,of) {
        d[nf] = d[of];
      });
    });
  }
  if (opts.keyBy) {
    parsed.data = _.keyBy(parsed.data, opts.keyBy);
  }
  return parsed;
}

IOUtil.parseDelimited = parseDelimited;

function parseJsonl(data, opts) {
  opts = opts || {};
  // Parses jsonl into array of json objects
  var objects = [];
  var startIndex = 0;
  var endIndex = -1;
  for (var i = 0; i < data.length; i++) {
    if (data[i] === '\n' || data[i] === '\r') {
      endIndex = i;
      if (endIndex > startIndex) {
        var str = data.substring(startIndex, endIndex);
        str = str.trim();
        if (str.length > 0) {
          objects.push(JSON.parse(str));
        }
      }
      startIndex = endIndex + 1;
    }
  }
  if (opts.flatten) {
    objects = _.flatten(objects);
  }
  return objects;
}

IOUtil.parseJsonl = parseJsonl;

function indexLines(data, opts) {
  opts = opts || {};
  var lines = data.split('\n');
  var labelToIndex = {};
  for (var i = 0; i < lines.length; i++) {
    lines[i] = lines[i].trim();
    if (lines[i]) {
      var fields = opts.delimiter? lines[i].split(opts.delimiter) : [lines[i]];
      if (fields.length > 1) {
        labelToIndex[fields[0]] = parseInt(fields[1]);
      } else {
        labelToIndex[fields[0]] = i;
      }
    }
  }
  return labelToIndex;
}

IOUtil.indexLines = indexLines;

module.exports = IOUtil;
