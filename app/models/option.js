const { login } = require("tplink-cloud-api");
const Table = require('cli-table2');

module.exports = function(sequelize, DataTypes) {
	var model = sequelize.define('Option', {
		id: {
			type: DataTypes.INTEGER,
			primaryKey: true,
			autoIncrement: true
		},
		name: {
			type: DataTypes.STRING(255)
		},
		value: {
			type: DataTypes.STRING(255)			
		}
	}, {
		timestamps: false,
		freezeTableName: true,
		tableName: 'options'
	});

	// model.someMethod = function() { }    //// db.Sample.someMethod()
	// model.prototype.someMethod = function() { } /// instance.someMethod()

	model.upsert = async function(name, value) {
		let found = await sequelize.db.Option.findOne({where: {name: name}});
		if (found) {
			found.value = value;
			await found.save();
			return found;
		} else {
			let option = new sequelize.db.Option;
			option.name = name;
			option.value = value;
			await option.save();
			return option;
		}
	};

	model.getValue = async function(name) {
		let found = await sequelize.db.Option.findOne({where: {name: name}});
		if (found) {
			return found.value;
		} else {
			return null;
		}
	};


	model.setEthermineMinerAddress = async function(address) {
		address = (''+address);
		if (address) {
			await sequelize.db.Option.upsert('ethermine_address', address);	
		}
	};

	model.getEthermineMinerAddress = async function() {
		let address = await sequelize.db.Option.findOne({where: {name: 'ethermine_address'}});
		return address ? address.value : null;
	};

	return model;
};