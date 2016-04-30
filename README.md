#newdefaces-es6

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


>用babel-node server.js 就要以跑起来了

###原文第二步分 构建系统的改写

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
