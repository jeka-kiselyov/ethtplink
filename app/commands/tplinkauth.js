const ETHTPLinkCommand = require('../abstract/eth_tplink_command.js');
const prompt = require('prompt-async');

class Handler extends ETHTPLinkCommand {
    setup() {
        return this.prog.command('tplink auth', 'Auth TP-Link Cloud and save credentials for later use');
    }

    async handle(args, options, logger) {
        let db = await this.db.init();
        let tplink = await db.Rig.getIOTClassInstance(true); /// get tplink instance, but do not sync

        this.logger.info("Going to reset TP-Link Cloud credentials...");

        prompt.start();

        let isCredentialsGood = false;
        do {
            let input = await prompt.get({
                username: {
                    pattern: /^\S+@\S+\.\S+$/,
                    message: 'Usually it is email address',
                    required: true
                },
                password: {
                    hidden: true,
                    required: true
                }
            });

            await tplink.setCredentials(input);

            this.logger.info("Credentials set. Checking connection...");
            isCredentialsGood = await tplink.isOptionsSet(true);

            if (!isCredentialsGood) {
                this.logger.error("Invalid credentials.");                
            }
        } while(!isCredentialsGood);

        this.logger.info("Success");

        this.program.exit();
    }
};

module.exports = Handler;