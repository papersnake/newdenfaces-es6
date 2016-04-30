"use strict";

/*jshint esversion: 6 */
/*jslint node: true */
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


app.get('/api/characters', (req,res,next) => {
	let choice = ['Female', 'Male'];
	let randomGender = _.sample(choice);
	//res.send([]);
	app.models.character.find()
		.where({'voted': false})
		.where({'gender': randomGender})
		.exec((err,characters) => {
			if(err) return next(err);
			//console.log(characters);
			let randomCharacters = _.sampleSize(characters,2); 
			//console.log(randomCharacters);
			return res.send(randomCharacters);
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
						var characterId = parsedXml.eveapi.result[0].rowset[0].row[0].$.characterID;

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
						var name = parsedXml.eveapi.result[0].characterName[0];
						var race = parsedXml.eveapi.result[0].race[0];
						var bloodline = parsedXml.eveapi.result[0].bloodline[0];
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



orm.initialize(Config,function(err,models){
	if(err) throw err;
	app.models = models.collections;
	//app.set('models',models.collections);
	app.connections = models.connections;

	server.listen(app.get('port'),() => {
		console.log('Express server listening on port ' + app.get('port'));
	});
});
