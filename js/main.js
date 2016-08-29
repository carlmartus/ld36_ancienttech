var lastTime;

var zoom, viewX, viewY, tracking;
var zooming, zAX, zAY, zBX, zBY, zA, zB, zT;
var zoomCb;

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
	texEnemy0,
	texLaser;

var bgStars, bgNebulas;

var planetPos = new PIXI.Point(0, 0);
var gameTime;

var stellarCenter = new PIXI.Point(2000, 2000);
var stellarMax = new PIXI.Point(4000, 4000);

var hudContainer;
var btnZoomOut;
var panelTriggers, panelCommands;


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
		knockout.zoomOutText('Give orders');
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

function restartGame() {
	setupSwarm();
	clearAllState();
	startLevel();
	startGame();
};

function startGame() {
	viewX = 0.0;
	viewY = 0.0;
	zoom = 0.001;
	resetZoom();
};

function animate() {
	let now = Date.now();
	let time = (now - lastTime) * 0.001;
	gameTime += time;

	animateSwarm(time);
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
	setupSwarm();
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
	texLaser = palTexture(2, 5, 1, 1);
};

function setupBackground() {
	bgStars = new PIXI.extras.TilingSprite(texStars, frame.width, frame.height);

	bgStars.alpha = 0.4;
	root.addChild(bgStars);
};


