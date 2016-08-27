// Globals {{{
var frame, root;
var baseTexture, // Textures
	texStars,
	texNebulas,
	texShip0,
	texPlanet,
	texButtonFrame;

var bgStars, bgNebulas;

var planetPos = new PIXI.Point(0, 0);


// }}}
// Control {{{

var zoom, viewX, viewY, tracking;
var zooming, zAX, zAY, zBX, zBY, zA, zB, zT;

function setupView() {
	tracking = null;
	zoom = 1.0;
	viewX = 0.5;
	viewY = 0.5;
};

function setZoom(x, y, level) {
	zooming = true;
	zT = 0.0;
	zAX = x;
	zAY = y;
	zBX = viewX;
	zBY = viewY;
	zA = zoom;
	zB = level;
};

function updateViews(time) {
	var changed = false;

	if (zooming) {
		zT += time;

		if (zT >= 1.0) {
			zT = 1.0;
			zoom = zB;
			viewX = zBX;
			viewY = zBY;
			zooming = false;
		} else {
			viewX = zAX + (zBX - zAX)*zT;
			viewY = zAY + (zBY - zAY)*zT;
			zoom = zA + (zB - zA)*zT;
		}

		changed = true;
	}

	if (changed) {
		bgNebulas.tileScale.set(3 * (2 + zoom));
		bgStars.tileScale.set(0.5 * (3 - zoom));
		//bgStars.tilePosition.set(viewX, viewY*1000);
	}
};


// }}}
// Entities {{{

var spaceContainer;

function setupSpace() {
	spaceContainer = new PIXI.Container();
	root.addChild(spaceContainer);
};

function addShip(ship) {
};

function SpaceEntity() {
};

SpaceEntity.prototype.animate = function(time) {
};


// }}}
// HUD {{{

var hudContainer;

function setupHud() {
	hudContainer = new PIXI.Container();

	var testButton = new PIXI.Sprite(texButtonFrame);
	testButton.interactive = true;
	testButton.buttonMode = true;
	//testButton.visible = false;
	hudContainer.addChild(testButton);

	root.addChild(hudContainer);
};


// }}}
// Game state {{{

function startGame() {
	zoom = 2.0;
	setZoom(0.5, 0.5, 1.0);
};


// }}}
// Entry {{{

var lastTime;

function animate() {
	var now = Date.now();
	var time = (now - lastTime) * 0.001;

	updateViews(time);
	frame.render(root);

	requestAnimationFrame(animate);
	lastTime = now;
};

function start(pal) {
	baseTexture = new PIXI.BaseTexture(pal, PIXI.SCALE_MODES.LINEAR);
	baseTexture.imageUrl = pal.src;

	setupTextures();
	setupBackground();
	setupView();
	setupSpace();
	setupHud();

	lastTime = Date.now();

	startGame();
	animate();
};

function main() {
	// Create frame
	frame = PIXI.autoDetectRenderer(600, 600,
			{ backgroundColor: 0x00000000 });
	document.getElementById('gameArea').appendChild(frame.view);

	root = new PIXI.Container();

	var img = new Image();
	img.src = 'pal.png';
	img.onload = function() {
		start(img);
	};
};


// }}}
// Loading resouces {{{

function palTexture(x, y, w, h) {
	var cell = 32;
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
	texPlanet = palTexture(4, 4, 2, 2);
	texButtonFrame = palTexture(0, 7, 1, 1);
};

function setupBackground() {
	bgStars = new PIXI.extras.TilingSprite(texStars, frame.width, frame.height);
	bgNebulas = new PIXI.extras.TilingSprite(texNebulas, frame.width, frame.height);

	//bgStars.tileScale.set(2);
	bgStars.alpha = 0.4;
	root.addChild(bgStars);

	//bgNebulas.tileScale.set(32);
	bgNebulas.alpha = 0.15;
	root.addChild(bgNebulas);
};


// }}}

