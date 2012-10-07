var Stream = require('stream');

function createStreamAPI () {
  var stream
    , processEntry
    , done
    , handleError
    , handleFatalError
    , paused = true
    , buffer = []
    ;

  stream = new Stream();
  stream.writable = false;
  stream.readable = true;

  stream.pause = function () {
    paused = true;
  };

  stream.resume = function () {
    paused = false;
    
    // emit all buffered entries, errors and ends
    while (!paused && buffer.length) {
      var msg = buffer.shift();
      this.emit(msg.type, msg.data);
    }
  };

  // called for each entry
  processEntry = function (entry) {
    return paused ? buffer.push({ type: 'data', data: entry }) : stream.emit('data', entry);
  };

  // called with all found entries when directory walk finished
  done = function (err, entries) {
    // since we already emitted each entry and all non fatal errors
    // all we need to do here is to signal that we are done
    stream.emit('end');
  };

  handleError = function (err) {
    return paused ? buffer.push({ type: 'warn', data: err }) : stream.emit('warn', err);
  };

  handleFatalError = function (err) {
    return paused ? buffer.push({ type: 'error', data: err }) : stream.emit('error', err);
  };

  // Allow stream to be returned and handlers to be attached and/or stream to be piped before emitting messages
  // Otherwise we may loose data/errors that are emitted immediately
  process.nextTick(function () { stream.resume(); });

  return { 
      stream           :  stream
    , processEntry     :  processEntry
    , done             :  done
    , handleError      :  handleError
    , handleFatalError :  handleFatalError
  };
}

module.exports = createStreamAPI;