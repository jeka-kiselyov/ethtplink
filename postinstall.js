const fs = require('fs');
const path = require('path');
const os = require("os");

const workingDataPath = path.join(os.homedir(), '.ethtplink');
const settingsPath = path.join(os.homedir(), '.ethtplink/data');

if (!fs.existsSync(workingDataPath)) fs.mkdirSync(workingDataPath,'0755', true);
if (!fs.existsSync(settingsPath)) fs.mkdirSync(settingsPath,'0755', true);