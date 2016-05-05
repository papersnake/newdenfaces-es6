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

###原文第十三步，Express API路由

第一个路由是用来创建角色的

```js
app.post('/api/characters',(req,res,next) => {
  let gender = req.body.gender;
  let characterName = req.body.name;
  let characterIdLookupUrl = 'https://api.eveonline.com/eve/CharacterId.xml.aspx?names=' + characterName;

  const parser = new xml2js.Parser();

  async.waterfall([
    function(callback) {
      request.get(characterIdLookupUrl,(err,request,xml) => {
        if(err) return next(err);
        parser.parseString(xml,(err,parsedXml) => {
          try {
            let characterId = parsedXml.eveapi.result[0].rowset[0].row[0].$.characterID;

            app.models.character.findOne({ characterId: characterId},(err,model) => {
              if(err) return next(err);

              if(model) {
                return res.status(400).send({ message: model.name + ' is alread in the database'});
              }

              callback(err,characterId);
            });
          } catch(e) {
            return res.status(400).send({ message: ' xml Parse Error'});
          }
        });
      });
    },
    function(characterId) {
      let characterInfoUrl = 'https://api.eveonline.com/eve/CharacterInfo.xml.aspx?characterID=' + characterId;
      console.log(characterInfoUrl);
      request.get({ url: characterInfoUrl },(err,request,xml) => {
        if(err) return next(err);
        parser.parseString(xml, (err,parsedXml) => {
          if (err) return res.send(err);
          try{
            let name = parsedXml.eveapi.result[0].characterName[0];
            let race = parsedXml.eveapi.result[0].race[0];
            let bloodline = parsedXml.eveapi.result[0].bloodline[0];
            app.models.character.create({
              characterId: characterId,
              name: name,
              race: race,
              bloodline: bloodline,
              gender: gender
            },(err,model) => {
              if(err) return next(err);
              res.send({ message: characterName + ' has been added successfully!'});
            });
          } catch (e) {
            res.status(404).send({ message: characterName + ' is not a registered citizen of New Eden',error: e.message });
          }
        });
      });
    }
  ]);
});
```
是不是看起来和原文的基本一模一样，只不过把var 变成了let 匿名函数变成了ES6的'=>'箭头函数，虽然我用的是**warterline**而原文中用的是**mongoose**但是包括方法名基本都一样，所以我感觉**waterline**是在API上最接近**mongoose**
>顺便说一下，我为什么不喜欢mongodb,仅仅是因为有一次我安装了，只往里面写了几条测试数据，按文本算最多几kb,但第二天重启机器的时候，系统提示我,我的/home分区空间不足了（双系统分区分给linux分小了本来就不大），结果一查mongodb 的data文件 有2G多，我不知道什么原因，可能是配置不对还是别的什么原因，反正，当天我就把它删除了，

完成了这个API我们就可以往数据库里添加东西了，不知道哪些用户名可以用？相当简单，反正我用的全是一名人的名字（英文名），外国人也喜欢抢注名字，嘿嘿嘿

![add character ui](http://box.kancloud.cn/2015-09-14_55f643eff052d.jpg)


###原文第十三步，Home组件
基本保持和原文一样，只是用**lodash** 替换了 **underscore**
>一开始我看到网上介绍**lodash**是可以无缝替换**underscore**，中要修改引用就可以，但是我用的版本是*4.11.2*已经有很多方法不一样了，还去掉了不少方法（没有去关注underscore是不是也在最新版本中有同样的改动）

原文中：
```js
......
import {first, without, findWhere} from 'underscore';
......

var loser = first(without(this.state.characters, findWhere(this.state.characters, { characterId: winner }))).characterId;

......

```
修改为:
```js
......
import {first, filter} from 'lodash';
......

let loser = first(filter(this.state.characters,item => item.characterId != winner )).characterId;
```

>findWhere 在最新版本的lodash中已经不存正，我用了filter来实现相同功能。

###第十四步：Express API 路由（2/2）
####GET /api/characters

原文的实现方法
```js
/**
 * GET /api/characters
 * Returns 2 random characters of the same gender that have not been voted yet.
 */
app.get('/api/characters', function(req, res, next) {
  var choices = ['Female', 'Male'];
  var randomGender = _.sample(choices);

  Character.find({ random: { $near: [Math.random(), 0] } })
    .where('voted', false)
    .where('gender', randomGender)
    .limit(2)
    .exec(function(err, characters) {
      if (err) return next(err);

      if (characters.length === 2) {
        return res.send(characters);
      }

      var oppositeGender = _.first(_.without(choices, randomGender));

      Character
        .find({ random: { $near: [Math.random(), 0] } })
        .where('voted', false)
        .where('gender', oppositeGender)
        .limit(2)
        .exec(function(err, characters) {
          if (err) return next(err);

          if (characters.length === 2) {
            return res.send(characters);
          }

          Character.update({}, { $set: { voted: false } }, { multi: true }, function(err) {
            if (err) return next(err);
            res.send([]);
          });
        });
    });
});

```
可以看到原文中用***{ random: { $near: [Math.random(), 0] } }***做为查询条件从而在数据库里取出两条随机的记录返回给页面进行PK，前文说过**random**的类型在**mysql**没有类似的，所以我把这个字段删除了。本来**mysql**,可以用***order by rand()*** 之类的方法但是，**waterline**的***sort(order by rand())***不被支持，所以我是把所有符合条件的记录取出来，能过**lodash**的***sampleSize***方法从所有记录中获取两天随机记录。

```js
app.get('/api/characters', (req,res,next) => {
  let choice = ['Female', 'Male'];
  let randomGender = _.sample(choice);
  //原文中是通过nearby字段来实现随机取值，waterline没有实现mysql order by rand()返回随机记录,所以返回所有结果，用lodash来处理
  app.models.character.find()
    .where({'voted': false})
    .exec((err,characters) => {
      if(err) return next(err);
      
      //用lodash来取两个随机值
      let randomCharacters = _.sampleSize(_.filter(characters,{'gender': randomGender}),2); 
      if(randomCharacters.length === 2){
      //console.log(randomCharacters);
        return res.send(randomCharacters);
      }

      //换个性别再试试
      let oppsiteGender = _.first(_.without(choice, randomGender));
      let oppsiteCharacters = _.sampleSize(_.filter(characters,{'gender': oppsiteGender}),2); 

      if(oppsiteCharacters === 2) {
        return res.send(oppsiteCharacters);
      }
      //没有符合条件的character，就更新voted字段，开始新一轮PK
      app.models.character.update({},{'voted': false}).exec((err,characters) => {
        if(err) return next(err);
        return res.send([]);
      });
      


    });

});
```
>在数据量大的情况下，这个的方法性能上肯定会有问题，好在我们只是学习过程，数据量也不大。将就用一下，能实现相同的功能就可以了。


####GET /api/characters/search
这个API之前还有两个API，和原文基本一样，所做的修改只是用了ES6的语法，就不浪费篇幅了，可以去我的[github](https://github.com/papersnake/newdenfaces-es6/blob/master/server.js)看

这一个也只是一点**mongoose**和**waterline**的一点点小区别
原文中mongoose的模糊查找是用正则来做的，mysql好像也可以，但是**warterline**中没有找到相关方法（它的文档太简陋了）
所以原文中

```js
app.get('/api/characters/search', function(req, res, next) {
  var characterName = new RegExp(req.query.name, 'i');

  Character.findOne({ name: characterName }, function(err, character) {
    ......
```

我改成了

```js
app.get('/api/characters/search', (req,res,next) => {
  app.models.character.findOne({name:{'contains':req.query.name}}, (err,character) => {
    .....
```
通过***contains***来查找，其实就是***like %sometext%***的方法来实现
下面还有两个方法修改的地方也大同小异，就不仔细讲了，看代码吧

####GET /api/stats
这个是原文最后一个路由了，
原文中用了一串的函数来获取各种统计信息，原作者也讲了可以优化，哪我们就把它优化一下吧

```js
app.get('/api/stats', (req,res,next) => {
  let asyncTask = [];
  let countColumn = [
        {},
        {race: 'Amarr'},
        {race: 'Caldari'},
        {race: 'Gallente'},
        {race: 'Minmatar'},
        {gender: 'Male'},
        {gender: 'Female'}
      ];
  countColumn.forEach(column => {
    asyncTask.push( callback => {
      app.models.character.count(column,(err,count) => {
        callback(err,count);
      });
    })
  });

  asyncTask.push(callback =>{
    app.models.character.find()
              .sum('wins')
              .then(results => {
                callback(null,results[0].wins);
              });
  } );

  asyncTask.push(callback => {
    app.models.character.find()
              .sort('wins desc')
              .limit(100)
              .select('race')
              .exec((err,characters) => {
                if(err) return next(err);

                let raceCount = _.countBy(characters,character => character.race);
                console.log(raceCount);
                let max = _.max(_.values(raceCount));
                console.log(max);
                let inverted = _.invert(raceCount);
                let topRace = inverted[max];
                let topCount = raceCount[topRace];

                

                callback(err,{race: topRace, count: topCount});
              });
  });

  asyncTask.push(callback => {
    app.models.character.find()
              .sort('wins desc')
              .limit(100)
              .select('bloodline')
              .exec((err,characters) => {
                if(err) return next(err);

                let bloodlineCount = _.countBy(characters,character => character.bloodline);
                let max = _.max(_.values(bloodlineCount));
                let inverted = _.invert(bloodlineCount);
                let topBloodline = inverted[max];
                let topCount = bloodlineCount[topBloodline];

                callback(err,{bloodline: topBloodline, count: topCount});
              });
  });

  async.parallel(asyncTask,(err,results) => {
    if(err) return next(err);
    res.send({
      totalCount: results[0],
          amarrCount: results[1],
          caldariCount: results[2],
          gallenteCount: results[3],
          minmatarCount: results[4],
          maleCount: results[5],
          femaleCount: results[6],
          totalVotes: results[7],
          leadingRace: results[8],
          leadingBloodline:results[9]
    });
  }) 
});
```
我把要统计数据的字段放入一个数组***countColumn***通过**forEach**把push到***asyncTask***，最后两个统计方法不一样的函数，单独push,最后用***async.parallel***方法执行并获得结果。
>underscore的max方法可以从｛a:1,b:6,d:2,e:3｝返回最大值，但是lodash新版中的不行，只能通过_.max(_.values(bloodlineCount))这样的方式返回最大值。
