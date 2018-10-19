const ETHTPLinkCommand = require('../abstract/eth_tplink_command.js');

class Handler extends ETHTPLinkCommand {
    setup() {
        return this.prog.command('start', 'Start daemon');
    }

    async handle(args, options, logger) {
      
        let isCurrentlyRunning = await this.daemon.status();

        if (isCurrentlyRunning) {
            this.logger.info('EtherTPLink service is currently running');
        } else {
            this.spinner.start("Starting the EtherTPLink service.. %s");
            let started = undefined;
            do {
                started = await this.daemon.start();
            } while(started === undefined);

            this.spinner.stop();

            this.logger.info('EtherTPLink service successfully started');
        }

        this.program.exit();
    }
};

module.exports = Handler;