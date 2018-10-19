const { Program, Command } = require('lovacli');
const Spinner = require('../modules/spinner.js');
const Daemon = require('../modules/daemon.js');

class ETHTPLinkCommand extends Command {
    constructor(params) {
        super(params);

        this._daemon = new Daemon({
            program: this.program
        });
        this._spinner = new Spinner({
            program: this.program
        });

        this.on('error',(e)=>{
            try {
                this.spinner.stop();
            } catch(e) {

            }
        });

        this._tplink = null;
    }

    get daemon() {
        return this._daemon;
    }

    get spinner() {
        return this._spinner;
    }

    get tplink() {
        return this._tplink;
    }

    muteSpinner() {
        this.spinner.mute();
    }

    async testSettings() {
        let db = await this.db.init();

        this.spinner.start("Checking connection to Ethermine and doing sync.. %s");
        await db.Rig.syncWithEthermine();
        this.spinner.stop();
        this.logger.info("Ethermine sync: Done.");

        this.spinner.start("Checking connection to TPLink Cloud and doing sync.. %s");
        this._tplink = await db.Rig.syncWithTPLink();
        this.spinner.stop();
        this.logger.info("TPLink Cloud sync: Done.");
    }

    setup() {
        return this.prog.command('ethermine auth', 'Set address of Ethermine miner');
    }

};

module.exports = ETHTPLinkCommand;