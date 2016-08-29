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

var FOCUS_NEAREST = 0;
var FOCUS_PLANET = 1;

var stateRefresher;
var spaceContainer, planet, entities, controlEntities, fxs;

function makeTrigger(type, target, extra) {
	return {
		triggerType: type,
		target: target,
		extra: extra,
	};
};

function setupSpace() {

	stateRefresher = 10;
	spaceContainer = new PIXI.Container();

	clearAllState();

	startLevel();

	root.addChild(spaceContainer);
};

function startLevel() {
	planet = createSpeceEntity(texPlanet, "Planet", false, false,
			stellarCenter.x, stellarCenter.y, 0.0, 10, 0);

	// Create player controled  ships
	createSpeceEntity(texShip0, "Anubis", true, ENEMY_FILTER_NONE, 700, 500, 2.0, 1, 800);
	//createSpeceEntity(texShip0, "Horus", true, ENEMY_FILTER_NONE, 1200, 1000, 1.5, 1, 1000);
	//createSpeceEntity(texScanner, "Ra", true, ENEMY_FILTER_NONE, 500, 2200, 0.2, 1, 1500);

	//createSpeceEntity(texEnemy0, "Hittite looter", false, ENEMY_FILTER_SMALL, 0, 0, 1, 1);
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
		ship.animate(time);
	}

	for (let fx of fxs) {
		fx.animate(time);
	}
};

function clearAllState() {
	spaceContainer.removeChildren();
	entities = [];
	controlEntities = [];
	fxs = [];
};

function createSpeceEntity(texture, name, playerControl, isEnemy,
		x, y, topSpeed, scale, fireRange, rotation) {

	let se = new Entity(texture, name, playerControl, isEnemy,
			new PIXI.Point(x, y), topSpeed, scale, fireRange, rotation);

	entities.push(se);
	if (playerControl) controlEntities.push(se);

	spaceContainer.addChild(se.sprite);
	if (se.hitBox) {
		spaceContainer.addChild(se.hitBox);
	}
	return se;
};


function spawnLaser(a, b) {
	let l = new Laser(a, b);
	fxs.push(l);
	spaceContainer.addChild(l.sprite);
};


function kysEntity(entity) {
	if (tracking == entity) {
		resetZoom();
	}

	spaceContainer.removeChild(entity.sprite);
	if (entity.hitBox) {
		spaceContainer.removeChild(entity.hitBox);
	}
	entities.splice(entities.indexOf(entity), 1);
}

function kysFx(fx) {
	spaceContainer.removeChild(fx.sprite);
	fxs.splice(fxs.indexOf(fx), 1);
};

function damageControl(target) {
	if (target.health <= 0) {
		kysEntity(target);
	}
};

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

