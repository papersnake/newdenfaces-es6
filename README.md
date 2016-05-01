#使用React、Node.js、MongoDB、Socket.IO开发一个角色投票应用的学习过程

本项目是对[使用React、Node.js、MongoDB、Socket.IO开发一个角色投票应用](http://www.kancloud.cn/kancloud/create-voting-app/63977)的学习过程。

>[英文原文:Create a character voting app using React, Node.js, MongoDB and Socket.IO](http://sahatyalkabov.com/create-a-character-voting-app-using-react-nodejs-mongodb-and-socketio/) 
>>[原项目github](https://github.com/sahat/newedenfaces-react)


##学习过程
要想系统的学习些新东西，网上看了很多代码片段，但很少有这样完整的一个系统来学习，基实我本来是比较偏向[Vue](http://vuejs.org.cn/)的但是看到了这个文章，太全面了，对于想入门的人来说，方方面面都有，有前端，有后端，所以忍不住想把它提供的代码全敲一遍。敲代码的过程，虽然只是个抄的过程，但比光看要很很多，有的时候往往看人家代码的时候，感觉是这样的，***"哦，就是这样的啊.so easy,不过如此吗~"***，但一句一句去敲的时候，感觉就是这样的，***"WTF,这是什么鬼，这个函数哪里来的，这个库是干嘛用的，这里这么写到底是为了什么",***所以当你把过程中的这些疑问都搞清楚了，才是真正的提高了，光看很多细节是注意不到的。

###对原有的改动
抄代码是好，但是最好在原来的基础上加点自己的相法，所以我做的改动主要有如下

1. 把所有不是用ES6的代码全部改成ES6的
2. 用数据库从mongodb 改成了mysql
3. 用waterline替换mongoose操作数据库


>改动后的代码，我也全发布在github上了,还没改完，我会不定期commit的
>>[https://github.com/papersnake/newdenfaces-es6](https://github.com/papersnake/newdenfaces-es6)

###改写的过程和遇到的坑
对ES6学也的也不深，改了这么多也发现语法上也只用到了import let const 和=>,希望大家提出更多的改进意见
原文第一步的代码
###原文第一步的改进

```js
var express = require('express');
var path = require('path');
var logger = require('morgan');
var bodyParser = require('body-parser');

var app = express();

app.set('port', process.env.PORT || 3000);
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(express.static(path.join(__dirname, 'public')));

app.listen(app.get('port'), function() {
  console.log('Express server listening on port ' + app.get('port'));
});
```
改写后，变成

```js
import express    from 'express';
import path       from 'path';
import logger     from 'morgan';
import bodyParser from 'body-parser';

let app = express();

app.set('port',process.env.PORT || 3000);
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(express.static(path.join(__dirname, 'public')));

app.listen(app.get('port'),() => {
    console.log('Express server listening on port ' + app.get('port'));
});
```
为了能让它跑起来，要在原有依赖的基础上添加
>npm install --save-dev babel-cli,babel-core,babel-preset-es2015,babel-preset-react,babel-register
有几个依赖是后面才用到的，我这里一并安装了
在根目录新建一个.babelrc文件
```js
{
  "presets": [
    "es2015"
  ]
}
```


>用babel-node server.js 就可以跑起来了

###原文第二步 构建系统的改写

为了节省篇幅，有些全篇的代码我就不粘贴，给出连接吧 [gulpfile.js](https://github.com/sahat/newedenfaces-react/blob/master/gulpfile.js)

gulp 从3.9.0开始支持babel，但是要把文件名改为**gulpfile.babel.js**
改写后的代码

```js

import gulp from 'gulp';
import gutil from 'gulp-util';
import gulpif from 'gulp-if';
import streamify from 'gulp-streamify';
import autoprefixer from 'gulp-autoprefixer';
import cssmin from 'gulp-cssmin';
import less from 'gulp-less';
import concat from 'gulp-concat';
import plumber from 'gulp-plumber';
import source from 'vinyl-source-stream';
import babelify from 'babelify';
import browserify from 'browserify';
import watchify from 'watchify';
import uglify from 'gulp-uglify';

const production = process.env.NODE_ENV === 'production';

const dependencies = [
	'alt',
	'react',
	'react-router',
	'underscore'
];

/*
 |--------------------------------------------------------------------------
 | Combine all JS libraries into a single file for fewer HTTP requests.
 |--------------------------------------------------------------------------
 */
gulp.task('vendor',()=>
	gulp.src([
		'bower_components/jquery/dist/jquery.js',
		'bower_components/bootstrap/dist/bootstrap.js',
		'bower_components/magnific-popup/dist/jquery.magnific-popup.js',
		'bower_components/toastr/toastr.js'
		]).pipe(concat('vendor.js'))
		  .pipe(gulpif(production,uglify({ mangle:false })))
		  .pipe(gulp.dest('public/js'))
	);


/*
 |--------------------------------------------------------------------------
 | Compile third-party dependencies separately for faster performance.
 |--------------------------------------------------------------------------
 */
gulp.task('browserify-vendor', () =>
  browserify()
    .require(dependencies)
    .bundle()
    .pipe(source('vendor.bundle.js'))
    .pipe(gulpif(production, streamify(uglify({ mangle: false }))))
    .pipe(gulp.dest('public/js'))
);

/*
 |--------------------------------------------------------------------------
 | Compile only project files, excluding all third-party dependencies.
 |--------------------------------------------------------------------------
 */
gulp.task('browserify', ['browserify-vendor'], () =>
  browserify('app/main.js')
    .external(dependencies)
    .transform(babelify,{ presets: ["es2015", "react"]}) //注意这里，只有加上presets配置才能正常编译
    .bundle()
    .pipe(source('bundle.js'))
    .pipe(gulpif(production, streamify(uglify({ mangle: false }))))
    .pipe(gulp.dest('public/js'))
);

/*
 |--------------------------------------------------------------------------
 | Same as browserify task, but will also watch for changes and re-compile.
 |--------------------------------------------------------------------------
 */
gulp.task('browserify-watch', ['browserify-vendor'], () =>{
  var bundler = watchify(browserify('app/main.js', watchify.args));
  bundler.external(dependencies);
  bundler.transform(babelify,{ presets: ["es2015", "react"]});
  bundler.on('update', rebundle);
  return rebundle();

  function rebundle() {
    var start = Date.now();
    bundler.bundle()
      .on('error', function(err) {
        gutil.log(gutil.colors.red(err.toString()));
      })
      .on('end', function() {
        gutil.log(gutil.colors.green('Finished rebundling in', (Date.now() - start) + 'ms.'));
      })
      .pipe(source('bundle.js'))
      .pipe(gulp.dest('public/js/'));
  }
});


/*
 |--------------------------------------------------------------------------
 | Compile LESS stylesheets.
 |--------------------------------------------------------------------------
 */
gulp.task('styles', () =>
  gulp.src('app/stylesheets/main.less')
    .pipe(plumber())
    .pipe(less())
    .pipe(autoprefixer())
    .pipe(gulpif(production, cssmin()))
    .pipe(gulp.dest('public/css'))
);

gulp.task('watch', () =>{
  gulp.watch('app/stylesheets/**/*.less', ['styles']);
});

gulp.task('default', ['styles', 'vendor', 'browserify-watch', 'watch']);
gulp.task('build', ['styles', 'vendor', 'browserify']);

```

由于到现在为止，还没有做其他工作，所以看不到打包的实际效果， 但是也是要控制台下运行一下gulp 看看有没有语法错误。

到这里为止没有遇到多大的坑，最多的往往是拼写错误引起的问题，唯一由于拼写导致，但不提示错误的是
```js
app.use(bodyParser.json());
```

我打成了

```js
app.use(bodyParser.json);
```

运行的时候服务器一直没有响应，找了好久才找到这个错误

###原文第十二步
一下子就到十二步了，因为原文件中*react*部分的代码本来就是用ES6写的，没什么好改的，唯一遇到的坑还是拼写

```js
import NavbarActions from '../actions/NavbarActions'';
```
抄成
```js
import NavbarActions from '../Actions/NavbarActions';
```
眼睛不尖的小伙伴这两句的代码差别可以也要找好久，我整整一天没有找出来，
```js
socket.on('onlineUsers', (data) => {
        NavbarActions.updateOnlineUsers(data);
      });
```
按道理应该会触发
**NavbarStore**中的 **onUpdateOlineUsers** 这个事件的，可是就因为我把***actions***敲成了***Actions***,页面执行没有任何错误提示，但是就是不执行**onUpdateOlineUsers**这个事件，通过*chrome*调试发现，我调用的是**updateOnlineUsers1**,这个玩意儿怎么来的，我把原文中的代码复制过来，运行就正常，用自己的怎么能不行，后来我把原文的代码另存一个文件通过*diff*两个文件的不同才发现这个错误的，还好在第二行，diff 很快发现了。

吐完槽，还是开始第十二部分的改动吧，这是开始涉及到数据库了，原文用mongodb,我用mysql,改动就比较大了。
原文中的models是这样的

```js
var mongoose = require('mongoose');

var characterSchema = new mongoose.Schema({
  characterId: { type: String, unique: true, index: true },
  name: String,
  race: String,
  gender: String,
  bloodline: String,
  wins: { type: Number, default: 0 },
  losses: { type: Number, default: 0 },
  reports: { type: Number, default: 0 },
  random: { type: [Number], index: '2d' },
  voted: { type: Boolean, default: false }
});

module.exports = mongoose.model('Character', characterSchema);
```

改用waterline并用es6规范后

```js
import Waterline from 'waterline';

export default Waterline.Collection.extend({
  identity: 'character',
  connection: 'myLocalMysql',
  schema: true,
  attributes: {
    characterId: {type:'string',primaryKey: true, unique: true,index: true},
    name: 'string',
    race: 'string',
    gender: 'string',
    bloodline: 'string',
    wins: {type: 'integer', defaultsTo: 0 },
    losses: {type: 'integer', defaultsTo: 0 },
    reports: {type: 'integer', defaultsTo: 0 },
    voted: {type: 'boolean', defaultsTo: false}
  }
});
```

>注意:我这里去掉了*random*这个字段，原文中这个*random*字段就是用来随机获取数据库中的数据的，但同样的方法无法在mysql中用，所以我就去掉了，实现方法后文里会讲

>waterline 的一些基础用法可以参见我的[《使用 Express 和 waterline 创建简单 Restful API》](https://segmentfault.com/a/1190000004996659)这篇小文，或自行查看[官方文档](https://github.com/balderdashy/waterline-docs)

在根目录下创建 **config.js** 针对waterline的配置文件，以便连接mysql
```js
import mysqlAdapter from 'sails-mysql';

const wlconfig = {
  adapters: {
    'default':mysqlAdapter,
    mysql: mysqlAdapter
  },

  connections: {
    myLocalMysql: {
      adapter : 'mysql',
      host : 'localhost',
      port : 3306,
      user : 'root',
      password : '',
      database : 'test'
    }
  },

  defaults: {
    migrate: 'safe'
  }
};

export default wlconfig;
```

然后回到**server.js**中启用

```js
...
//首先在头部引入相关库和配置文件
import Waterline from 'waterline';
...

import Config from './config';
....

let app = express();
//原来上面这一句后面加上这两行
let orm = new Waterline();
orm.loadCollection(Character);


//在最后面把
/**
  *原来的启动代码
  *
  *server.listen(app.get('port'),() => {
  *    console.log('Express server listening on port ' + app.get('port'));
  *  });
  */
//改成

orm.initialize(Config, (err,models) => {
  if(err) throw err;
  app.models = models.collections;
  //app.set('models',models.collections);
  app.connections = models.connections;

  server.listen(app.get('port'),() => {
    console.log('Express server listening on port ' + app.get('port'));
  });
});

```

>注意：**config.js**中的 *migrate* 属性 一开始的时候可以把它设为 **'alter'** 这样可以省了你自己创建数据库的过程，但写入数据以后一定要改为**'safe'** 不然重启服务会清空清数据的。