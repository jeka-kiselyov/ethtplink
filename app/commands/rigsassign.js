// const { Program, Command } = require('lovacli');
// const Table = require('cli-table2');
// const TPLink = require('../modules/tplink.js');

const ETHTPLinkCommand = require('../abstract/eth_tplink_command.js');
const prompt = require('prompt-async');

class Handler extends ETHTPLinkCommand {
    setup() {
        return this.prog.command('rigs assign', 'Assign Ethermine rig to TP-Link IOT Device');
    }

    async handle(args, options, logger) {
        let db = await this.db.init();
        
        /// sync TPLink Cloud and Ethermine
        /// note: also assigns this._tplink, this.tplink (see ETHTPLinkCommand)
        await this.testSettings(); 

        this.logger.info("Select the rig to assign IOT device to:");

        await db.Rig.consoleLogAllRigs();

        prompt.start();

        let rig = null;
        let isGoodRigId = false;
        do {
            let input = await prompt.get(['RigID']);
            rig = await db.Rig.findOne({where: {id: input.RigID}});

            if (rig) {
                isGoodRigId = true;
            } else {
                this.logger.error('Invalid Rig ID');
            }
        } while(!isGoodRigId);

        if (rig.assignedIOTDeviceId) {
            this.logger.error('You are going to re-assign IOT device for rig "'+rig.name+'"');
        } else {
            this.logger.error('You are going to assign IOT device for rig "'+rig.name+'"');
        }

        this.logger.info('Fetching IOT devices information...');

        await this.tplink.consoleLogAllDevices();
        this.logger.info('Select the IOT device to assign to rig "'+rig.name+'":');

        let toAssignIOTDevice = null;
        let isGoodIOTDeviceId = false;
        do {
            let input = await prompt.get(['DeviceId']);
            let deviceId = this.tplink.deviceNToDeviceId(input.DeviceId);
            toAssignIOTDevice = this.tplink.deviceIdToDeviceSync(deviceId);

            if (!toAssignIOTDevice) {
                this.logger.error('Invalid DeviceId');
            } else if (toAssignIOTDevice.type != 'IOT.SMARTPLUGSWITCH') {
                this.logger.error('Device should be of type IOT.SMARTPLUGSWITCH');
            } else {
                isGoodIOTDeviceId = true;
            }
        } while(!isGoodIOTDeviceId);

        rig.assignedIOTDeviceId = toAssignIOTDevice.id;
        await rig.save();

        this.logger.info('IOT Device assigned.');   

        await db.Rig.consoleLogAllRigs();     

        this.program.exit();
    }
};

module.exports = Handler;