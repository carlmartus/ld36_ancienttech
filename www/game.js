// Globals {{{
var frame, root;
var baseTexture, // Textures
	texStars,
	texNebulas,
	texShip0,
	texScanner,
	texPlanet,
	texButtonFrame,
	texClickBox,
	texEnemyBox,
	texEnemy0;

var bgStars, bgNebulas;

var planetPos = new PIXI.Point(0, 0);
var gameTime;

var stellarCenter = new PIXI.Point(2000, 2000);
var stellarMax = new PIXI.Point(10000, 10000);
var knockout;


// }}}
// Control {{{

var zoom, viewX, viewY, tracking;
var zooming, zAX, zAY, zBX, zBY, zA, zB, zT;
var zoomCb;

function setupView() {
	tracking = null;
	zoom = 1.0;
	viewX = 0.5;
	viewY = 0.5;
};

function setZoom(x, y, level, cb) {
	zooming = true;
	zT = 0.0;
	zAX = viewX;
	zAY = viewY;
	zBX = x;
	zBY = y;
	zA = zoom;
	zB = level;
	zoomCb = cb;
};

function setZoomTarget(entity) {
	tracking = entity;
	if (entity.controlable) {
		putDecisions(tracking.decisions);
		knockout.zoomOutText('Apply settings');
	} else {
		knockout.zoomOutText('Zoom out');
	}

	setZoom(
			entity.position.x,
			entity.position.y,
			1.5);
	knockout.zoomed(true);
};

function resetZoom() {
	setZoom(stellarCenter.x, stellarCenter.y, 0.1);
	knockout.zoomed(false);
	tracking = null;
};

function updateViews(time) {
	let changed = false;

	if (zooming) {
		zT += time;

		if (zT >= 1.0) {
			zT = 1.0;
			zoom = zB;
			viewX = zBX;
			viewY = zBY;
			zooming = false;
			if (zoomCb) {
				let tmp = zoomCb;
				zoomCb = null;
				tmp();
			}
		} else {
			if (tracking) {
				zBX = tracking.position.x;
				zBY = tracking.position.y;
			}

			viewX = zAX + (zBX - zAX)*zT;
			viewY = zAY + (zBY - zAY)*zT;
			zoom = zA + (zB - zA)*zT;
		}

		changed = true;

	} else if (tracking) {
		viewX = tracking.position.x;
		viewY = tracking.position.y;
		changed = true;
	}

	if (changed) {
		bgStars.tilePosition.set(
				0.1*viewX,
				0.1*viewY);
	}
};


// }}}
// Ground work {{{

var TRIGGER_NONE = 0;
var TRIGGER_IDLE = 1;
var TRIGGER_ENEMY_DETECTED = 2;
var TRIGGER_ENEMY_INRANGE = 3;

var ENEMY_FILTER_NONE = 0;
var ENEMY_FILTER_ANY = 0;
var ENEMY_FILTER_SMALL = 1;
var ENEMY_FILTER_BIG = 2;

var IDLE_HALT = 0;
var IDLE_PLANET = 1;

var MANEUVER_AGRESSIVE = 0;
var MANEUVER_SKIRMISH = 1;

function makeTrigger(type, target, extra) {
	return {
		triggerType: type,
		target: target,
		extra: extra,
	};
};


// }}}
// Entities {{{

var stateRefresher;
var spaceContainer, planet, entities, controlEntities;

function setupSpace() {
	stateRefresher = 10;
	spaceContainer = new PIXI.Container();
	entities = [];
	controlEntities = [];

	// Background
	planet = createSpeceEntity(texPlanet, "Planet", false, false,
			stellarCenter.x, stellarCenter.y, 0.0, 10, 0);

	// Create player controled  ships
	createSpeceEntity(texShip0, "Anubis", true, ENEMY_FILTER_NONE, 700, 500, 1.5, 1, 100);
	createSpeceEntity(texShip0, "Horus", true, ENEMY_FILTER_NONE, 1200, 1000, 1.5, 1, 100);
	createSpeceEntity(texScanner, "Ra", true, ENEMY_FILTER_NONE, 500, 2200, 0.2, 1, 400);

	createSpeceEntity(texEnemy0, "Hittite looter", false, ENEMY_FILTER_SMALL, 0, 0, 1, 1);

	root.addChild(spaceContainer);
};

function animateSpace(time) {

	planet.sprite.rotation = gameTime * 0.1;

	spaceContainer.position.set(
			0.5 * frame.width  - zoom * viewX,
			0.5 * frame.height - zoom * viewY);
	spaceContainer.scale.set(zoom);

	let refresh = false;
	if (--stateRefresher) {
		refresh = true;
		stateRefresher = 10;
	}

	for (let ship of entities) {
		if (ship.controlable) ship.decide();
		ship.animate();
	}
};

function createSpeceEntity(texture, name, playerControl, isEnemy,
		x, y, topSpeed, scale, fireRange, rotation) {

	let se = new SpaceEntity(texture, name, playerControl, isEnemy,
			new PIXI.Point(x, y), topSpeed, scale, fireRange, rotation);

	entities.push(se);
	if (playerControl) controlEntities.push(se);

	spaceContainer.addChild(se.sprite);
	if (se.hitBox) {
		spaceContainer.addChild(se.hitBox);
	}
	return se;
};

function SpaceEntity(texture, name, controlable, isEnemy, start, topSpeed, scale, fireRange, rotation) {
	this.position = start.clone();
	this.name = name;
	this.topSpeed = topSpeed;
	this.fireRange = fireRange;
	this.controlable = controlable;
	this.isEnemy = isEnemy;
	this.sprite = new PIXI.Sprite(texture);
	this.sprite.anchor.set(0.5);

	this.activeSpeed = 0.0;

	if (!rotation) rotation = Math.random() * Math.PI;
	this.sprite.rotation = rotation;

	if (this.controlable) {
		this.activeDecision = null;
		this.decisions = getDecisions();
		this.hitBox = new PIXI.Sprite(texClickBox);
		this.hitBox.anchor.set(0.5);

		let self = this;
		spriteButton(this.hitBox, function() {
			knockout.setSelected(self.name, true);
			setZoomTarget(self);
		});
	} else if (isEnemy) {
		this.hitBox = new PIXI.Sprite(texEnemyBox);
		this.hitBox.anchor.set(0.5);
		let self = this;

		spriteButton(this.hitBox, function() {
			knockout.setSelected(self.name, false);
			setZoomTarget(self);
		});
	}

	this.scale = (scale ? scale : 1.0) * (this.sprite.width / 32.0);
	this.sprite.scale.set(scale);
};

SpaceEntity.prototype.animate = function(time) {

	if (this.isEnemy) {
		if (this.setMovement(stellarCenter) < 200) {
			return kys(this);
		}
	}

	if (this.controlable && this.activeDecision) {
		this.progressDecision(time);
	}

	if (this.activeSpeed > 0.0) {
		this.position.x += this.activeSpeed * Math.cos(this.sprite.rotation);
		this.position.y += this.activeSpeed * Math.sin(this.sprite.rotation);
	}

	this.sprite.position.copy(this.position);

	if (this.hitBox) {
		this.hitBox.position.copy(this.position);

		minHitScale = 1.0 / zoom;
		this.hitBox.scale.set(Math.max(this.scale*1.5, minHitScale));
	}
};

SpaceEntity.prototype.setSpeed = function(speedOn) {
	this.activeSpeed = speedOn ? this.topSpeed : 0.0;
};

SpaceEntity.prototype.setRotation = function(rad) {
	this.sprite.rotation = rad;
}

SpaceEntity.prototype.setMovement = function(trg, addAngle) {
	let dx, dy, dist;
	dx = trg.x - this.position.x;
	dy = trg.y - this.position.y;
	dist = Math.sqrt(dx*dx + dy*dy);

	let v = Math.atan2(dy, dx);
	if (addAngle) v += addAngle;
	this.setRotation(v);
	this.setSpeed(true);
	return dist;
};

SpaceEntity.prototype.progressDecision = function(time) {

	switch (this.activeDecision.triggerType) {
		case TRIGGER_ENEMY_DETECTED :
			switch (this.activeDecision.extra) {
				case MANEUVER_AGRESSIVE :	return this.progressManeuver(time, 150);
				case MANEUVER_SKIRMISH :	return this.progressManeuver(time, 400);
			} break;
		case TRIGGER_IDLE :
			switch (this.activeDecision.actionIdle) {
				case IDLE_HALT :	return this.progressIdleHalt();
				case IDLE_PLANET :	return this.progressIdlePlanet();
			} break;
	}
};

SpaceEntity.prototype.progressIdleHalt = function(time) {
	this.setSpeed(false);
};

SpaceEntity.prototype.progressIdlePlanet = function(time) {
	let dx, dy, dist;
	dx = stellarCenter.x - this.position.x;
	dy = stellarCenter.y - this.position.y;
	dist = Math.sqrt(dx*dx + dy*dy);

	let v = Math.atan2(
			stellarCenter.y - this.position.y,
			stellarCenter.x - this.position.x);

	if (dist < 400) {
		v += Math.PI;
	} else if (dist < 700) {
		v += Math.PI*0.5;
	}

	this.setRotation(v);
	this.setSpeed(true);
};

SpaceEntity.prototype.progressManeuver = function(time, circleDistance) {
	let dist = this.setMovement(this.activeDecision.target.position);
	if (dist < circleDistance) {
		this.setMovement(this.activeDecision.target.position, Math.PI*0.5);
	}
};

SpaceEntity.prototype.decide = function() {
	let ds = this.matchDecision();

	if (!ds || ds.type == TRIGGER_NONE) return;

	if (
			!this.activeDecision ||
			this.activeDecision.triggerType != ds.triggerType ||
			this.activeDecision.actionIdle != ds.actionIdle ||
			this.activeDecision.enemyFilter != ds.enemyFilter ||
			this.activeDecision.enemyManeuver != ds.enemyManeuver ||
			this.activeDecision.target != ds.target) {

		console.log('Change decision', ds);
		this.activeDecision = ds;
	}
};

SpaceEntity.prototype.matchDecision = function() {
	let gws = this.collectGroundWork();

	for (let gw of gws) {
		for (let ds of this.decisions) {
			if (gw.triggerType == ds.triggerType) {
				switch (gw.triggerType) {
					default : return ds;
					case TRIGGER_ENEMY_INRANGE :
					case TRIGGER_ENEMY_DETECTED : {
						let dx, dy, dist;
						dx = gw.target.position.x - this.position.x;
						dy = gw.target.position.y - this.position.y;
						dist = Math.sqrt(dx*dx + dy*dy);

						if (
								gw.triggerType == TRIGGER_ENEMY_INRANGE &&
								dist < this.fireRange) {

							return makeTrigger(TRIGGER_ENEMY_INRANGE,
									gw.target, ds.enemyManeuver);
						} else if (
							   gw.triggerType == TRIGGER_ENEMY_DETECTED) {

							return makeTrigger(TRIGGER_ENEMY_DETECTED,
									gw.target, ds.enemyManeuver);
						}
					} break;
				}
				return ds;
			}
		}
	}
};

SpaceEntity.prototype.collectGroundWork = function() {
	let gws = [];

	// Enemies?
	for (let e of entities) {
		if (e.isEnemy) {
			let dx, dy, dist, v;
			dx = e.position.x - this.position.x;
			dy = e.position.y - this.position.y;
			dist = Math.sqrt(dx*dx + dy*dy);
			v = Math.atan2(dy, dx);

			if (dist < this.fireRange) {
				gws.push(makeTrigger(TRIGGER_ENEMY_INRANGE, e, v));
			}
			gws.push(makeTrigger(TRIGGER_ENEMY_DETECTED, e, v));
		}
	}

	// Idle
	gws.push(makeTrigger(TRIGGER_IDLE, stellarCenter, IDLE_PLANET));
	gws.push(makeTrigger(TRIGGER_IDLE, null, IDLE_HALT));

	return gws;
};

function kys(entity) {
	if (tracking == entity) {
		resetZoom();
	}

	spaceContainer.removeChild(entity.sprite);
	if (entity.hitBox) {
		spaceContainer.removeChild(entity.hitBox);
	}
	entities.splice(entities.indexOf(entity), 1);
}

function applySettings() {
	if (!tracking) {
		console.log("NOT TRACKING");
		return;
	}

	tracking.decisions = getDecisions();
	tracking.decide();
	tracking = null;
};


// }}}
// HUD {{{

var hudContainer;
var btnZoomOut;
var panelTriggers, panelCommands;

function setupHud() {
	hudContainer = new PIXI.Container();

	// Zoom out button
	let zoomOutFrame = spritePanel(10, 10, 4, 1);
	spriteButton(zoomOutFrame, function() {
		resetZoom();
	});
	btnZoomOut = coupleOverlayText(zoomOutFrame, 'Zoom out', false);
	hudContainer.addChild(btnZoomOut);

	// Panel 1: Triggers
	let triggers = coupleOverlayText(
			spritePanel(0, 0, 4, 6),
			'Triggers', true);
	panelTriggers = new PIXI.Container();
	panelTriggers.addChild(triggers);
	panelTriggers.position.set(100, 200);
	hudContainer.addChild(panelTriggers);
	panelTriggers.visible = false;

	// Panel 2: Commands
	let commands = coupleOverlayText(
			spritePanel(0, 0, 4, 6),
			'Commands', true);
	panelCommands = new PIXI.Container();
	panelCommands.addChild(commands);
	panelCommands.position.set(260, 200);
	hudContainer.addChild(panelCommands);
	panelCommands.visible = false;

	root.addChild(hudContainer);
};

function spritePanel(x, y, w, h) {
	let p = new PIXI.Sprite(texButtonFrame);
	p.position.set(x, y);
	p.scale.set(w, h);
	return p;
};

function spriteButton(sprite, cb) {
	sprite.interactive = true;
	sprite.buttonMode = true;
	sprite.on('click', cb);
};

function coupleOverlayText(sprite, text, topMost) {
	let spriteText = new PIXI.Text(
			text, {
				font: 'bold 20px Arial', fill: 'black', align: 'center' });
	spriteText.anchor.set(0.5);
	spriteText.position.x = 0.5*sprite.width;
	spriteText.position.y = 0.5*(topMost ? spriteText.height : sprite.height);

	let couple = new PIXI.Container();
	couple.position.copy(sprite.position);
	sprite.position.set(0, 0);

	couple.addChild(sprite);
	couple.addChild(spriteText);
	return couple;
};


// }}}
// Game state {{{

function startGame() {
	viewX = 0.0;
	viewY = 0.0;
	zoom = 0.001;
	resetZoom();
};


// }}}
// Entry {{{

var lastTime;

function animate() {
	let now = Date.now();
	let time = (now - lastTime) * 0.001;
	gameTime += time;

	animateSpace(time);
	updateViews(time);

	frame.render(root);

	requestAnimationFrame(animate);
	root.visible = true;
	lastTime = now;
};

function start(pal) {
	baseTexture = new PIXI.BaseTexture(pal, PIXI.SCALE_MODES.NEAREST);
	baseTexture.imageUrl = pal.src;

	setupTextures();
	setupBackground();
	setupView();
	setupSpace();
	//setupHud();

	lastTime = Date.now();

	startGame();
	root.visible = false;
	animate();
};

function main() {
	gameTime = 0.0;

	// Create frame
	frame = PIXI.autoDetectRenderer(400, 540,
			{ backgroundColor: 0x00000000 });
	document.getElementById('gameArea').appendChild(frame.view);

	root = new PIXI.Container();

	let img = new Image();
	img.src = 'pal.png';
	img.onload = function() {
		start(img);
	};

	knockout = new KnockoutModel();
	ko.applyBindings(knockout);
	putDecisions(getDecisions());
};


// }}}
// Knockout {{{

function makeKoDecision(num) {
	return {
		desc: ko.observable(num+1),
		triggerType: ko.observable(0),
		actionIdle: ko.observable(0),
		enemyFilter: ko.observable(0),
		enemyManeuver: ko.observable(0),
	};
};

function KnockoutModel() {
	let self = this;

	self.selected = ko.observable(false);
	self.selectedName = ko.observable("N/A");
	self.decision = ko.observableArray([
			makeKoDecision(0),
			makeKoDecision(1),
			makeKoDecision(2),
			makeKoDecision(3),
			makeKoDecision(4),
			makeKoDecision(5),
	]);

	self.zoomed = ko.observable(false);
	self.zoomOutText = ko.observable();

	self.setSelected = function(name, properties) {
		self.selected(properties);
		self.selectedName(name);
	};

	self.apply = function() {
		self.selected(false);
		applySettings();
		resetZoom();
	};
};

function getDecisions() {
	return knockout.decision().map(function(obj) {
		data = {};
		for (let key in obj) {
			data[key] = Number(obj[key]());
		}
		return data;
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


// }}}
// Loading resouces {{{

function palTexture(x, y, w, h) {
	let cell = 32;
	return new PIXI.Texture(baseTexture,
			new PIXI.Rectangle(
				cell*x,
				cell*y,
				cell*w,
				cell*h));
};

function setupTextures() {
	texStars = palTexture(0, 0, 4, 4);
	texNebulas = palTexture(4, 0, 4, 4);
	texShip0 = palTexture(0, 4, 1, 1);
	texScanner = palTexture(0, 5, 1, 1);
	texPlanet = palTexture(4, 4, 2, 2);
	texButtonFrame = palTexture(0, 7, 1, 1);
	texClickBox = palTexture(1, 4, 1, 1);
	texEnemyBox = palTexture(2, 4, 1, 1);
	texEnemy0 = palTexture(1, 5, 1, 1);
};

function setupBackground() {
	bgStars = new PIXI.extras.TilingSprite(texStars, frame.width, frame.height);

	bgStars.alpha = 0.4;
	root.addChild(bgStars);
};


// }}}

