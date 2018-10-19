const ETHTPLinkCommand = require('../abstract/eth_tplink_command.js');

class Handler extends ETHTPLinkCommand {
    setup() {
        return this.prog.command('daemon', 'Daemon command. Start it with `start` to run in background');
    }

    async handle(args, options, logger) {
        /// no need to show animation in bg proccess
        this.muteSpinner();

        let db = await this.db.init();
        /// sync TPLink Cloud and Ethermine
        try {
            await this.testSettings();
        } catch(e) {

        }

        let rigs = await db.Rig.findAll();
        for (let rig of rigs) {
            if (rig.needToReboot()) {
                this.logger.info("Rebooting rig "+rig.name);
                await rig.reboot();
            } else {
                this.logger.info("No need to reboot rig "+rig.name);                
            }
        }

        let sleep = ms => new Promise(resolve => setTimeout(resolve, ms));
        await sleep(60000);

        this.program.exit();
    }
};

module.exports = Handler;