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