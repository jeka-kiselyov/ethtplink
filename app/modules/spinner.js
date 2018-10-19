const {Program,Command,LovaClass} = require('lovacli');
const CliSpinner = require('cli-spinner').Spinner;

class Spinner extends LovaClass {
	constructor(params) {
		super(params);
		this._spinner = null;
		this._muted = false;
	}

	mute() {
		this._muted = true;
		this.stop(true);
	}

	start(text = '') {
		if (this._muted) {
			return false;
		}

		if (text.indexOf('%s') === -1) {
			text = text+'%s';
		}
		this._spinner = new CliSpinner(text);
		this._spinner.setSpinnerString('|/-\\');
		this._spinner.start();
	}

	stop(clearLine = true) {
		if (this._spinner) {
			this._spinner.stop(clearLine);
			this._spinner = null;			
		}
	}


}

module.exports = Spinner;