# ethtplink
node.js daemon to reboot mining rigs using TP-Link HS100/HS110 sockets in case of issues mining on ethermine.org

Reboots rigs (switching off and then on TPLink smart socket) if rig was not active in last 20 minutes.

### Installation

```bash
npm install -g ethtplink
```

#### EACCESS errors on installation

Check this: https://docs.npmjs.com/getting-started/fixing-npm-permissions

### Commands

#### ethtplink status

Display information about daemon status and list of rigs defined.

```
info: EtherTPLink service is currently running
info: Ethermine sync: Done.
info: TPLink Cloud sync: Done.
┌────┬──────┬────────────┬─────────────┬───────────────────┬──────────────────┬──────────────┬────────────────┬────────────┐
│ ID │ Name │ Last Seen  │ Last Reboot │ Reported Hashrate │ Current Hashrate │ Stale shares │ Invalid shares │ IOT Device │
├────┼──────┼────────────┼─────────────┼───────────────────┼──────────────────┼──────────────┼────────────────┼────────────┤
│ 1  │ rig1 │ 5 seconds  │ never       │ 113.32 MH/s       │ 117.78 MH/s      │ 0            │ 0              │ Rig1       │
├────┼──────┼────────────┼─────────────┼───────────────────┼──────────────────┼──────────────┼────────────────┼────────────┤
│ 4  │ rig2 │ 2 minutes  │ 2 days      │ 125.51 MH/s       │ 109.61 MH/s      │ 1            │ 0              │ Rig2       │
└────┴──────┴────────────┴─────────────┴───────────────────┴──────────────────┴──────────────┴────────────────┴────────────┘
```

#### ethtplink tplink auth

Auth ethtplink to TPLink Cloud service. Username is your email address and password is the one you use to sign in to TPLink Kasa application or [Cloud service](https://www.tplinkcloud.com/).

#### ethtplink ethermine auth

Auth ethtplink to Ethermine.org Your mining address (without 0x) is required, nothing more. 

#### ethtplink rigs assign

Assign IOT Devices to Rig names. This command will prompt you for rig ids and IOT ids and display updated information on success.

#### ethtplink start

Start ethtplink daemon. Will run `ethtplink daemon` every minute in background. 

#### ethtplink stop

Stop ethtplink daemon.
