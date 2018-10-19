const ETHTPLinkCommand = require('../abstract/eth_tplink_command.js');
const prompt = require('prompt-async');

class Handler extends ETHTPLinkCommand {
    setup() {
        return this.prog.command('ethermine auth', 'Set address of Ethermine miner');
    }

    async handle(args, options, logger) {
        let db = await this.db.init();

        this.logger.info("Going to reset Ethermine miner address...");

        prompt.start();

        let isMinerAddressGood = false;
        do {
            let input = await prompt.get(['address']);
            await db.Option.setEthermineMinerAddress(input.address);

            this.logger.info("Address set. Checking data...");

            let workersFromPool = await db.Rig.getWorkersFromPool();

            if (workersFromPool && workersFromPool.length > 0) {
                isMinerAddressGood = true;
            }
        } while(!isMinerAddressGood);

        this.logger.info("Success");

        this.program.exit();
    }
};

module.exports = Handler;