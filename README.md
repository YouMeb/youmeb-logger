youmeb-logger
=============

    var path = require('path');
    var Logger = require('youmeb-logger');
    var logger = Logger.create('info', path.join(__dirname, 'log'), '%s.log');

    // logger.disable();

    logger.on('info', function (log) {
      console.log('on info');
      console.log(log);
    });

    logger.on('log', function (log) {
      console.log('on log');
      console.log(log);
    });

    logger.info('message');
    logger.debug('message');

Levels

    0 EMERGENCY
    1 ALERT
    2 CRITICAL
    3 ERROR
    4 WARNING
    5 NOTICE
    6 INFO
    7 DEBUG
