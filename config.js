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