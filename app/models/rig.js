const axios = require('axios');
const Table = require('cli-table2');
const TPLink = require('../modules/tplink.js');

module.exports = function(sequelize, DataTypes) {
	var model = sequelize.define('Rig', {
		id: {
			type: DataTypes.INTEGER,
			primaryKey: true,
			autoIncrement: true
		},
		name: {
			type: DataTypes.STRING(255)
		},
		lastSeenTime: {
			type: DataTypes.BIGINT()			
		},
		lastAPITime: {
			type: DataTypes.BIGINT()			
		},
		reportedHashrate: {
			type: DataTypes.BIGINT()			
		},
		currentHashrate: {
			type: DataTypes.BIGINT()			
		},
		validShares: {
			type: DataTypes.BIGINT()			
		},
		staleShares: {
			type: DataTypes.BIGINT()			
		},
		invalidShares: {
			type: DataTypes.BIGINT()			
		},
		lastRebootTime: {
			type: DataTypes.BIGINT(),
			default: null
		},
		assignedIOTDeviceId: {
			type: DataTypes.STRING(255),
			default: ''	
		}
	}, {
		timestamps: false,
		freezeTableName: true,
		tableName: 'rigs'
	});

	// model.someMethod = function() { }    //// db.Sample.someMethod()
	// model.prototype.someMethod = function() { } /// instance.someMethod()
	//
	//
	
	model.prototype.reboot = async function() {
		let currentTime = Math.floor( (new Date().getTime() / 1000) );
		if (this.lastRebootTime > currentTime - 20 * 60) { // reboot at most once per 20 minutes
			return false;
		} else {
			let iotDevice = await this.getIOTDevice();
			if (iotDevice) {
				await iotDevice.powerOff();

				await new Promise(resolve => setTimeout(resolve, 1000));

				await iotDevice.powerOn();
				this.lastRebootTime = Math.floor( (new Date().getTime() / 1000) );
				await this.save();

				return true;
			}
		}

		return false;
	}

	model.prototype.needToReboot = function() {
		let diffInSeconds = this.lastAPITime - this.lastSeenTime;
		/// reboot rig if it did not send shares in last 20 minutes
		/// 
		if (diffInSeconds > 60*20) {
			return true;
		} else {
			return false;
		}
	};

	model.prototype.lastSeenAgoToString = function() {
		let diffInSeconds = this.lastAPITime - this.lastSeenTime;
		return sequelize.db.Rig.secondsAgoToString(diffInSeconds);
	};

	model.prototype.lastRebootAgoToString = function() {
		if (!this.lastRebootTime) {
			return 'never';
		} else {
			let diffInSeconds = (new Date().getTime() / 1000) - this.lastRebootTime;
			return sequelize.db.Rig.secondsAgoToString(Math.ceil(diffInSeconds));
		}
	};

	model.prototype.reportedHashrateToString = function() {
		return sequelize.db.Rig.hashRateToString(this.reportedHashrate);
	};

	model.prototype.currentHashrateToString = function() {
		return sequelize.db.Rig.hashRateToString(this.currentHashrate);
	};

	model.prototype.getIOTDevice = async function() {
		if (!this.assignedIOTDeviceId) {
			return null;
		}

		let tplink = await sequelize.db.Rig.getIOTClassInstance();
		let device = tplink.deviceIdToDeviceSync(this.assignedIOTDeviceId);

		return device ? device : null;
	};

	model.getIOTClassInstance = async function(doNotSync = false) {
		if (sequelize.db.Rig._iotClassInstance !== undefined) {
			return sequelize.db.Rig._iotClassInstance;
		}

		sequelize.db.Rig._iotClassInstance = new TPLink({
			program: sequelize.db.Rig.program
		});

		if (!doNotSync) {
			await sequelize.db.Rig._iotClassInstance.sync();			
		}

		return sequelize.db.Rig._iotClassInstance;
	};

	model.consoleLogAllRigs = async function() {
		let tplink = await this.syncWithTPLink();

        let rigs = await sequelize.db.Rig.findAll();

        let consoleTable = new Table({
            head: ['ID', 'Name', 'Last Seen', 'Last Reboot', 'Reported Hashrate', 'Current Hashrate', 'Stale shares', 'Invalid shares', 'IOT Device']
        });

        for (let rig of rigs) {
        	let iotStr = '';
        	if (rig.assignedIOTDeviceId) {
        		if (tplink) {
        			let device = tplink.deviceIdToDeviceSync(rig.assignedIOTDeviceId);
        			if (device) {
        				iotStr = device.alias;
        			} else {
        				iotStr = 'error';
        			}
        		} else {
        			iotStr = rig.assignedIOTDeviceId;
        		}
        	}

            consoleTable.push([
                    rig.id,
                    rig.name,
                    rig.lastSeenAgoToString(),
                    rig.lastRebootAgoToString(),
                    rig.reportedHashrateToString(),
                    rig.currentHashrateToString(),
                    rig.staleShares,
                    rig.invalidShares,
                    iotStr
                ]);

        }
 
        console.log(consoleTable.toString());
	};

	model.syncWithTPLink = async function() {
		let tplink = await sequelize.db.Rig.getIOTClassInstance();
    	await tplink.sync();

    	return tplink;
	};

	model.syncWithEthermine = async function() {
		/// cache for 2 minutes
		let curTime = new Date();
		let lastSyncTime = await sequelize.db.Option.getValue('ethermineLastSync');

		if (lastSyncTime) {
			lastSyncTime = parseInt(lastSyncTime, 10);
			if (Math.abs(curTime.getTime() - lastSyncTime) < 1000*120) {
				let rigs = await sequelize.db.Rig.findAll();
				return rigs;
			}
		}

		let onPoolData = await this.getWorkersFromPool();

		let minimumAPITime = null;

		let rigs = [];
		if (onPoolData && onPoolData.length) {
			for (let onPoolRig of onPoolData) {
				let rig = await sequelize.db.Rig.findOne({where: {name: onPoolRig.worker}});
				if (!rig) {
					rig = new sequelize.db.Rig;
					rig.name = ''+onPoolRig.worker;
					await rig.save();
				}

				rig.lastSeenTime = onPoolRig.lastSeen;
				rig.lastAPITime = onPoolRig.time;

				rig.reportedHashrate = onPoolRig.reportedHashrate;
				rig.currentHashrate = onPoolRig.currentHashrate;
				rig.validShares = onPoolRig.validShares;
				rig.staleShares = onPoolRig.staleShares;
				rig.invalidShares = onPoolRig.invalidShares;

				if (minimumAPITime === null) {
					minimumAPITime = onPoolRig.time;
				} else if (minimumAPITime > onPoolRig.time) {
					minimumAPITime = onPoolRig.time;
				}

				await rig.save();
				rigs.push(rig);
			}
		}

		let inDBRigs = await sequelize.db.Rig.findAll();
		for (let rig of inDBRigs) {
			if (rig.lastAPITime < minimumAPITime) {
				rig.lastAPITime = minimumAPITime;
				await rig.save();
			}
		}

		sequelize.db.Option.upsert('ethermineLastSync', curTime.getTime());

		return rigs;
	}

	model.getWorkersFromPool = async function() {
		let ethermineAddress = await sequelize.db.Option.getEthermineMinerAddress();
		if (!ethermineAddress) {
			throw new Error('Ethermine address is not defined. Run `ethtplink ethermine auth` to set it');
		}
		let result = await axios.get("https://api.ethermine.org/miner/"+ethermineAddress+"/dashboard");

		let ret = [];
		if (result && result.data && result.data.data && result.data.data.workers) {
			ret = result.data.data.workers;
		}

		return ret;
	};

	model.hashRateToString = function(hashrate) {
		let bases = ['H/s', 'KH/s', 'MH/s', 'GH/s', 'TH/s'];
		let baseI = 0;
		let rem = hashrate;

		do {
			rem = rem / 1000;
			baseI++;
		} while(rem > 1000);

		return parseFloat(rem).toFixed(2)+' '+bases[baseI];
	};

	model.secondsAgoToString = function(diffInSeconds) {
		// thanks to Dan
		// https://stackoverflow.com/questions/8211744/convert-time-interval-given-in-seconds-into-more-human-readable-form
		// TIP: to find current time in milliseconds, use:
		// let  current_time_milliseconds = new Date().getTime();
		// let current_time_seconds = current_time_milliseconds / 1000;

	    function numberEnding (number) {
	        return (number > 1) ? 's' : '';
	    }

	    let years = Math.floor(diffInSeconds / 31536000);
	    if (years) {
	        return years + ' year' + numberEnding(years);
	    }
	    //TODO: Months! Maybe weeks? 
	    let days = Math.floor((diffInSeconds %= 31536000) / 86400);
	    if (days) {
	        return days + ' day' + numberEnding(days);
	    }
	    let hours = Math.floor((diffInSeconds %= 86400) / 3600);
	    if (hours) {
	        return hours + ' hour' + numberEnding(hours);
	    }
	    let minutes = Math.floor((diffInSeconds %= 3600) / 60);
	    if (minutes) {
	        return minutes + ' minute' + numberEnding(minutes);
	    }
	    let seconds = diffInSeconds % 60;
	    if (seconds) {
	        return seconds + ' second' + numberEnding(seconds);
	    }
	    return 'less than a second'; //'just now' //or other string you like;
	}


	return model;
};