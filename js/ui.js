var knockout;

function makeKoDecision(num, firstHalt) {
	return {
		desc: ko.observable(num+1),
		triggerType: ko.observable(firstHalt ? TRIGGER_IDLE : 0),
		actionIdle: ko.observable(0),
		enemyFocus: ko.observable(0),
		enemyManeuver: ko.observable(0),
	};
};

function KnockoutModel() {
	let self = this;

	self.selected = ko.observable(false);
	self.selectedName = ko.observable("N/A");
	self.selectedRange = ko.observable(0);
	self.selectedSpeed = ko.observable(0);
	self.decision = ko.observableArray([
			makeKoDecision(0, true),
			makeKoDecision(1),
			makeKoDecision(2),
			makeKoDecision(3),
	]);

	self.zoomed = ko.observable(false);
	self.zoomOutText = ko.observable();

	self.setSelected = function(name, properties, weaponRange, speed) {
		self.selected(properties);
		self.selectedName(name);
		self.selectedRange(weaponRange);
		self.selectedSpeed(speed);
	};

	self.apply = function() {
		self.selected(false);
		applySettings();
		resetZoom();
	};

	self.settleText = ko.observable('Settle planet');
	self.unSettled = ko.observable(true);
	self.settlePlanet = function() {
		swarmEnabled = true;
		self.unSettled(false);
		self.settleText('Settlement active');
	};

	self.restartGame = function() {
		restartGame();
		self.unSettled(true);
		self.settleText = ko.observable('Try again');
	};
};

function getDecisions() {
	return knockout.decision().map(function(obj) {
		data = {};
		for (let key in obj) {
			data[key] = Number(obj[key]());
		}
		return data;
	}).sort(function(a, b) {
		return b.triggerType > a.triggerType;
	});
};

function putDecisions(d) {
	for (let i=0; i<d.length; i++) {
		let dst = knockout.decision()[i];

		for (let key in d[i]) {
			dst[key](d[i][key]);
		}
	}
};

