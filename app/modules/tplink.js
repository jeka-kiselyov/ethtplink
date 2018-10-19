const {Program,Command,LovaClass} = require('lovacli');
const { login } = require("tplink-cloud-api");
const Table = require('cli-table2');

class TPLink extends LovaClass {
	constructor(params) {
		super(params);

		this._connected = false;
		this._tplink = null;
		this._devices = [];

		this._mostRecentSyncTime = null;
	}

	async sync() {
		if (!this._connected) {
			await this.connect();
		}

		// cache getDeviceList for at least a second, to be sure we are not querying it in loops.
		let curTime = new Date();
		if (this._mostRecentSyncTime && Math.abs(curTime.getTime() - this._mostRecentSyncTime.getTime()) < 1000) {
			return true;
		}

		this._devices = [];
		let deviceList = await this._tplink.getDeviceList();
        for (let deviceInfo of deviceList) {
            let device = this._tplink.newDevice(deviceInfo);
            this._devices.push(device);
        }
        this._mostRecentSyncTime = new Date();
	}

	deviceNToDeviceId(deviceN) {
		 /// 1-based, as the only use is for user prompt selection
		if (this._devices[deviceN - 1] !== undefined && this._devices[deviceN - 1].id) {
			return this._devices[deviceN - 1].id;
		}
	}

	deviceIdToDeviceSync(deviceId) {
        for (let device of this._devices) {
        	if (device.id == deviceId) {
        		return device;
        	}
        }
	}

	async deviceIdToDevice(deviceId) {
		await this.sync();

        for (let device of this._devices) {
        	if (device.id == deviceId) {
        		return device;
        	}
        }
	}

	async consoleLogAllDevices() {
        let consoleTable = new Table({
            head: ['ID', 'Type', 'Name', 'Alias', 'Status', 'Device ID']
        });

        let i = 1; /// 1-based, as the only use is for user prompt selection
        for (let device of this._devices) {
            let status = '-';
            if (device.type == 'IOT.SMARTPLUGSWITCH') {
                let isOn = await device.isOn();
                if (isOn) {
                    status = 'On';
                } else {
                    status = 'Off';
                }
            }

            consoleTable.push([
                    i++,
                    device.type,
                    device.name,
                    device.alias,
                    status,
                    device.id
                ]);

        }
 
        console.log(consoleTable.toString());
	}

	async isOptionsSet(tryToConnect = false) {
		let credentials = await this.getCredentials();
		if (!credentials || credentials.username === null || credentials.password === null) {
			return false;
		}

		if (tryToConnect) {
			let connected = await this.connect();
			return connected ? true : false;
		}

		return true;
	}

	async connect() {
		this._connected = false;
		let credentials = await this.getCredentials();
		if (!credentials || !credentials.username || !credentials.password) {
			throw new Error("TPLink Cloud username and/or password are not defined. Run `ethtplink tplink auth` to set them");
		}

		try {
			this._tplink = await login(credentials.username, credentials.password);
			if (this._tplink && this._tplink.getToken()) {
				this._connected = true;
				return true;
			}
		} catch(e) {
			return false;
		}
	}

	async setCredentials(params = {}) {
		let username = params.username || null;
		let password = params.password || null;

		if (username) {
			await this.db.Option.upsert('tplink_username', username);
		}
		if (password) {
			await this.db.Option.upsert('tplink_password', password);		
		}
	};

	async getCredentials() {
		let username = await this.db.Option.findOne({where: {name: 'tplink_username'}});
		let password = await this.db.Option.findOne({where: {name: 'tplink_password'}});
		username = username ? username.value : null;
		password = password ? password.value : null;

		return {
			username: username,
			password: password
		};
	}
}

module.exports = TPLink;