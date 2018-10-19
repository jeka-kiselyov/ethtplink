const ETHTPLinkCommand = require('../abstract/eth_tplink_command.js');

class Handler extends ETHTPLinkCommand {
    setup() {
        return this.prog.command('stop', 'Stop daemon');
    }

    async handle(args, options, logger) {

        let isCurrentlyRunning = await this.daemon.status();

        if (!isCurrentlyRunning) {
            this.logger.info('EtherTPLink service is currently stopped');
        } else {
            this.spinner.start("Stopping the EtherTPLink service.. %s");
            let stopped = undefined;
            do {
                stopped = await this.daemon.stop();
            } while(stopped === undefined);

            this.spinner.stop();

            this.logger.info('EtherTPLink service successfully stopped');
        }

        this.program.exit();
    }
};

module.exports = Handler;