// Globals {{{
var frame, root;
var baseTexture, // Textures
	texStars,
	texNebulas,
	texShip0,
	texScanner,
	texPlanet,
	texButtonFrame;

var bgStars, bgNebulas;

var planetPos = new PIXI.Point(0, 0);
var gameTime;

var stellarCenter = new PIXI.Point(500, 500);
var stellarMax = new PIXI.Point(100, 100);
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
	putDecisions(tracking.decisions);

	setZoom(
			entity.position.x,
			entity.position.y,
			1.5);
};

function resetZoom() {
	setZoom(stellarCenter.x, stellarCenter.y, 0.05);
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
				zBY = tracking.position.x;
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
				0.001*viewX,
				0.001*viewY);
	}
};


// }}}
// Entities {{{

var spaceContainer, planet, entities, controlEntities;

function setupSpace() {
	spaceContainer = new PIXI.Container();
	entities = [];
	controlEntities = [];

	// Background
	planet = createSpeceEntity(texPlanet, "Planet", false, 300, 300, 20, 0);

	// Create player controled  ships
	createSpeceEntity(texShip0, "Combat drone", true, 500, 500, 1);
	createSpeceEntity(texShip0, "Combat drone", true, 1000, 1000, 1);
	createSpeceEntity(texScanner, "Scanner", true, 200, 800, 1);

	root.addChild(spaceContainer);
};

function animateSpace(time) {

	planet.sprite.rotation = gameTime * 0.1;

	spaceContainer.position.set(
			0.5 * frame.width  - zoom * viewX,
			0.5 * frame.height - zoom * viewY);
	spaceContainer.scale.set(zoom);

	for (let ship of entities) {
		ship.animate();
	}
};

function createSpeceEntity(texture, name, playerControl, x, y, scale, rotation) {
	let se = new SpaceEntity(texture, name, playerControl,
			new PIXI.Point(x, y), scale, rotation);

	entities.push(se);
	if (playerControl) controlEntities.push(se);

	spaceContainer.addChild(se.sprite);
	if (se.hitBox) {
		spaceContainer.addChild(se.hitBox);
	}
	return se;
};

function SpaceEntity(texture, name, controlable, start, scale, rotation) {
	this.position = start.clone();
	this.name = name;
	this.controlable = controlable;
	this.controllable = true;
	this.sprite = new PIXI.Sprite(texture);
	this.sprite.anchor.set(0.5);

	if (!rotation) rotation = Math.random() * Math.PI;
	this.sprite.rotation = rotation;

	if (this.controlable) {
		this.decisions = getDecisions();
		this.hitBox = new PIXI.Sprite(texClickBox);
		this.hitBox.anchor.set(0.5);

		let self = this;
		spriteButton(this.hitBox, function() {
			knockout.setSelected(self.name);
			setZoomTarget(self);
		});
	}

	this.scale = (scale ? scale : 1.0) * (this.sprite.width / 32.0);
	this.sprite.scale.set(scale);
};

SpaceEntity.prototype.animate = function(time) {
	this.sprite.position.copy(this.position);

	if (this.controlable) {
		this.hitBox.position.copy(this.position);

		minHitScale = 1.0 / zoom;
		this.hitBox.scale.set(Math.max(this.scale*1.5, minHitScale));
	}
};

function applySettings() {
	if (!tracking) {
		console.log("NOT TRACKING");
		return;
	}

	tracking.decisions = getDecisions();
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

	self.setSelected = function(name) {
		self.selected(true);
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
			data[key] = obj[key]();
		}
		console.log(data.desc);
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
};

function setupBackground() {
	bgStars = new PIXI.extras.TilingSprite(texStars, frame.width, frame.height);
	//bgNebulas = new PIXI.extras.TilingSprite(texNebulas, frame.width, frame.height);

	bgStars.alpha = 0.4;
	root.addChild(bgStars);

	//bgNebulas.alpha = 0.15;
	//root.addChild(bgNebulas);
};


// }}}

