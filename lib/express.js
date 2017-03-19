/*!
 * express
 * Copyright(c) 2009-2013 TJ Holowaychuk
 * Copyright(c) 2013 Roman Shtylman
 * Copyright(c) 2014-2015 Douglas Christopher Wilson
 * MIT Licensed
 */

'use strict';

/**
 * Module dependencies.
 */

var EventEmitter = require('events').EventEmitter;
var mixin = require('merge-descriptors'); // 在 descriptor 的层面上复制 JS Object
var proto = require('./application');   // 把 app.__proto__ 的声明放到了独自的文件夹中
var Route = require('./router/route');  
var Router = require('./router');
var req = require('./request');   // http.IncomingMessage 的实例
var res = require('./response');  // http.ServerResponse 的实例

/**
 * Expose `createApplication()`.
 */

exports = module.exports = createApplication;

/**
 * Create an express application.
 * createApplication 方法会返回一个 app 实例，实例是一个 function。
 * 并且该实例会在 app.listen(arguments) 中通过 http.createServer(app).listen(arguments) 的方式，启动 http server。
 * 
 * @return {Function}
 * @api public
 */

function createApplication() {
  var app = function(req, res, next) {

    // handle 方法在 mixin(app, proto, false) 的过程中初始化，声明在 `lib/application.js` 中
    // handle 会作为每个 http 请求的第一个入口。
    app.handle(req, res, next);
  };

  // 复制 EventEmitter.prototype 的成员到 app 中，false 参数表示不覆盖同名成员
  mixin(app, EventEmitter.prototype, false);  
  // 复制 proto 的成员到 app 中
  mixin(app, proto, false); 

  // expose the prototype that will get set on requests
  // req 对象会成为 app.request 对象的原型，即 app.request.__proto__ = req, 并且在 req 中保留全局对象的 app 的引用。
  // 这样做的原因是，能使在中间中的 req 和 res 对象中读取 app ，提取所需内容。
  app.request = Object.create(req, {
    app: { configurable: true, enumerable: true, writable: true, value: app }
  })

  // expose the prototype that will get set on responses
  // 同上。
  app.response = Object.create(res, {
    app: { configurable: true, enumerable: true, writable: true, value: app }
  })

  // init() 的声明在 lib/application.js 中，
  app.init();
  return app;
}

/**
 * Expose the prototypes.
 */
// application 
exports.application = proto;
// req 是 http.IncomingMessage 的实例
exports.request = req;
// res 是 http.ServerResponse 的实例
exports.response = res;

/**
 * Expose constructors.
 */

exports.Route = Route;
exports.Router = Router;

/**
 * Expose middleware
 */

// 在 4.x 之后，express 分离了大部分中间件，只保留了 query, static.
// 而 query 中间件是 express 源码包含，负责解析 http 请求中的路径所包含的参数，然后存储到 req.query 中。
// static 中间件，由第三方模块包含，通过识别 http 请求中的路径，来读取指定文件夹的文件，实现静态文件服务。
exports.query = require('./middleware/query');
exports.static = require('serve-static');

/**
 * Replace removed middleware with an appropriate error message.
 */

[
  'json',
  'urlencoded',
  'bodyParser',
  'compress',
  'cookieSession',
  'session',
  'logger',
  'cookieParser',
  'favicon',
  'responseTime',
  'errorHandler',
  'timeout',
  'methodOverride',
  'vhost',
  'csrf',
  'directory',
  'limit',
  'multipart',
  'staticCache',
].forEach(function (name) {
  Object.defineProperty(exports, name, {
    get: function () {
      throw new Error('Most middleware (like ' + name + ') is no longer bundled with Express and must be installed separately. Please see https://github.com/senchalabs/connect#middleware.');
    },
    configurable: true
  });
});
