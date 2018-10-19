const {Program,Command,LovaClass} = require('lovacli');
const forever = require('forever');
const path = require('path');

class Daemon extends LovaClass {
	constructor(params) {
		super(params);

		this._uidShift = 0;

		forever.load({
			root: this.program.config.forever.path
		});
	}

	get uid() {
		return 'tplinketherdaemon';
	}

	async start() {
		var child = forever.startDaemon( path.join(__dirname, "../../index.js") , {
			uid: this.uid,
			max: undefined,
			silent: false,
			minUptime: 60000,
			spinSleepTime: 60000,
			args: ['daemon']
		});

		return true;
	}

	async status() {
		try {
	        let resolvePromise = null;
	        let promise = new Promise((res)=>{ 
	        	resolvePromise = res; 
	        });
			forever.list(false, (e,d)=>{
				let isRunning = false;
				if (d && d.length) { 
					for (let pItem of d) {
						if (pItem.uid == this.uid && pItem.running) {
							isRunning = true;
						}
					}
				}
				resolvePromise(isRunning);
			});
	        let success = await promise;
	        return success;
		} catch(e) {
			return false;
		}
	}

	async stop() {
		try {
	        let ee = forever.stop(this.uid);
	        let resolvePromise = null;
	        let promise = new Promise((res)=>{ 
	        	resolvePromise = res; 
	        });

	        ee.on('error', ()=>{
	        	resolvePromise(false);
	        });
	        ee.on('stop', ()=>{
	        	resolvePromise(true);
	        });
	        
	        let timeout = null;
	        let promiseWithTimeout = Promise.race([
				    promise,
				    new Promise(function(resolve, reject) {
						timeout = setTimeout(function() {
						        reject(false);
							}, 2000);
					}),
				]).then(function(success) {
					clearTimeout(timeout);
					return success;
				}, function(err) {
					clearTimeout(timeout);
					return undefined;
				});

	        let success = await promiseWithTimeout;
	        return success;
		} catch(e) {
			return false;
		}
	}

}

module.exports = Daemon;