'use strict';

var path = require('path');
var Logger = require('../lib/logger');
var logger = Logger.create('info', path.join(__dirname, 'log'), '%s.log');

logger.on('info', function () {
  console.log('on info');
});

logger.on('log', function () {
  console.log('on log');
});

logger.debug('debug message');
logger.info('info message');
logger.notice('notice message');
