'use strict';

var path = require('path');
var Logger = require('../lib/logger');
var logger = Logger.create('info', path.join(__dirname, 'log'), '%s.log');

logger.on('INFO', function () {
  console.log('on info');
});

logger.on('LOG', function () {
  console.log('on log');
});

logger.debug('debug message');
logger.info('info message');
logger.notice('notice message');
logger.error('error message');
