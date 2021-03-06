#!/usr/bin/env node

const {Program,Command,LovaClass} = require('lovacli');
const path = require('path');
const os = require("os");

const workingDataPath = path.join(os.homedir(), '.ethtplink');
const pjson = require(path.join(__dirname, 'package.json'));

let program = new Program({
		"name": "TP-Link HS100/HS110 Rigs Controller",
		"debug": false,
		"version": pjson.version,
		"paths": {
			"models": path.join(__dirname, "app/models"),
			"commands": path.join(__dirname, "app/commands"),
			"tests": path.join(__dirname, "app/tests")
		},
		"database": {
			"dialect": "sqlite",
			"storage": path.join(workingDataPath, "data/data.dat"),
			"sync": true
		},
		"forever": {
			"path": path.join(workingDataPath, "forever")
		}
	});

program.init();