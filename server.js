"use strict";

import express    from 'express';
import path       from 'path';
import logger     from 'morgan';
import bodyParser from 'body-parser';
import favicon from 'serve-favicon';
import swig from 'swig';
import React from 'react';
import Router from 'react-router';
import Waterline from 'waterline';
import async from 'async';
import request from 'request';
import xml2js from 'xml2js';
import _ from 'lodash';

import routes from './app/routes';
import Config from './config';
import Character from './models/character';

let app = express();
let orm = new Waterline();
orm.loadCollection(Character);

app.set('port',process.env.PORT || 3000);
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(favicon(path.join(__dirname,'public','favicon.png')));
app.use(express.static(path.join(__dirname,'public')));


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

app.post('/api/report', (req,res,next) => {
	var characterId = req.body.characterId;

	app.models.character.findOne({characterId: characterId}, (err,character) => {
		if(err) return next(err);

		if(!character) {
			return res.status(404).send({ message: 'Character not found'});
		}

		character.reports++;

		if(character.reports > 4){
			character.remove();
			return res.send({ message: character.name + ' has been deleted.'});
		}

		character.save(err => {
			if(err) return next(err);
			res.send({ message: character.name + ' has been reported.'})
		});

	});
});

app.get('/api/characters/shame',(req,res,next) => {
	app.models.character.find()
						.sort('losses desc')
						.limit(100)
						.exec((err,characters) =>{
							if(err) return next(err);
							res.send(characters);
						});
});

app.get('/api/characters/top',(req,res,next) => {
	var params = req.query;
	console.log(params);
	//next();
	app.models.character.find(params)
						.sort('wins desc')
						.limit(100)
						.exec((err,characters) => {
							if(err) return next(err);

							characters.sort(function(a, b) {
						    	if (a.wins / (a.wins + a.losses) < b.wins / (b.wins + b.losses)) { return 1; }
						    	if (a.wins / (a.wins + a.losses) > b.wins / (b.wins + b.losses)) { return -1; }
						        return 0;
						      });

							res.send(characters);
						});

});



app.get('/api/characters/search', (req,res,next) => {
	app.models.character.findOne({name:{'contains':req.query.name}}, (err,character) => {
		if(err) return next(err);

		if(!character) {
			return res.status(404).send({ message: 'Character not found.'});
		}

		return res.send(character);
	});
});

app.get('/api/characters/count', (req,res,next) => {
	app.models.character.count({},(err, count) => {
		if(err) return next(err);
		res.send({ count: count });
	});
});

app.get('/api/characters/:id', (req,res,next) => {
	var id = req.params.id;

	app.models.character.findOne({characterId: id}, (err,character) => {
		if(err) return next(err);

		if(!character){
			return res.status(404).send({ message: 'character not found'});
		}

		res.send(character);
	});
});

app.put('/api/characters/', (req, res, next) => {
	let winner = req.body.winner;
	let loser = req.body.loser;

	console.log('winner: ' + winner + '\n');
	console.log('loser: ' + loser +'\n');
	if(!winner || !loser) {
		return res.status(400).send({ message: 'Voting requires two characters.'});
	}

	if(winner === loser) {
		return res.status(400).send({ message: 'Cannot vote for and against the same characters'});
	}

	async.parallel([
		callback => {
			app.models.character.findOne({ characterId: winner }, (err, winner) => {
				callback(err,winner);
			});
		},
		callback => {
			app.models.character.findOne({ characterId: loser}, (err, winner) => {
				callback(err,winner);
			});
		}		
	],
	(err, results) => {
		if(err) return next(err);

		let winner = results[0];
		let loser = results[1];

		if(!winner || !loser) {
			return res.status(404).send({ message: 'One of the characters no longer exists.'});
		}

		if(winner.voted || loser.voted){
			return res.status(200).end();
		}

		async.parallel([
			callback => {
				winner.wins++;
				winner.voted = true
				winner.save(err => {
					callback(err);
				});
			},
			callback => {
				loser.losses++;
				loser.voted = true;
				loser.save(err => {
					callback(err);
				});
			}
		],err => {
			if(err) return next(err);
			res.status(200).end();
		});
	});
});


app.get('/api/characters', (req,res,next) => {
	let choice = ['Female', 'Male'];
	let randomGender = _.sample(choice);
	//原文中是通过nearby字段来实现随机取值，waterline没有实现mysql order by rand(),所以返回所有结果，用lodash来处理
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

			app.models.character.update({},{'voted': false}).exec((err,characters) => {
				if(err) return next(err);
				return res.send([]);
			});
			


		});

});

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


app.use((req,res) => {
	Router.run(routes,req.path, (Handler) => {
		var html = React.renderToString(React.createElement(Handler));
		var page = swig.renderFile('views/index.html', { html: html});
		res.send(page);
	});
});


const server =require('http').createServer(app);
const io = require('socket.io')(server);
let onlineUsers = 0;

io.sockets.on('connection', (socket) => {
	onlineUsers++;
	console.log('curonlieUsers: ' + onlineUsers);
	io.sockets.emit('onlineUsers',{ onlineUsers: onlineUsers });

	socket.on('disconnect', () => {
		onlineUsers--;
		io.sockets.emit('onlineUsers', { onlineUsers: onlineUsers });
	});
});



orm.initialize(Config, (err,models) => {
	if(err) throw err;
	app.models = models.collections;
	//app.set('models',models.collections);
	app.connections = models.connections;

	server.listen(app.get('port'),() => {
		console.log('Express server listening on port ' + app.get('port'));
	});
});
