const ETHTPLinkCommand = require('../abstract/eth_tplink_command.js');

class Handler extends ETHTPLinkCommand {
    setup() {
        return this.prog.command('status', 'Status of daemon');
    }

    async handle(args, options, logger) {

        let isCurrentlyRunning = await this.daemon.status();

        if (isCurrentlyRunning) {
            this.logger.info('EtherTPLink service is currently running');
        } else {
            this.logger.info('EtherTPLink service is currently stopped');
        }

        let db = await this.db.init();
        /// sync TPLink Cloud and Ethermine
        await this.testSettings(); 

        await db.Rig.consoleLogAllRigs();

        if (rigsWithNoIOTDevicesAssigned && rigsWithNoIOTDevicesAssigned.length) {
            this.logger.info("There are rig(s) with no IOT device assigned. Run `ethtplink rigs assign` to assign");
        }
        let rigsWithNoIOTDevicesAssigned = await db.Rig.getRigsWithNoIOTDevicesAssigned();

        this.program.exit();
    }
};

module.exports = Handler;