var SWARM_TICK = 10; // Secands between swarm spawns
var SWARM_SPAWN_OFFSET = 200;

var SWARM_SPAWNS = [
	new PIXI.Point(0, 0),
	new PIXI.Point(0, stellarMax.y) ];

var swarmAccum;
var swarmTick;
var swarmEnabled;

function setupSwarm() {
	swarmEnabled = false;
	swarmAccum = -1.0;
	swarmTick = -2;
};

function animateSwarm(time) {
	if (!swarmEnabled) return;

	swarmAccum += time;
	let tick = Math.floor(swarmAccum / SWARM_TICK);
	if (tick != swarmTick) {
		swarmTick = tick;

		if (swarmTick >= 0) {
		newWave();
		}
	};
};

function newWave() {
	let spawnPos = SWARM_SPAWNS[Math.floor(swarmTick / 5) & 1];
	let count = Math.max(1, (swarmTick % 5));

	for (let i=0; i<count; i++) {
		let x, y;
		x = spawnPos.x + 2*(Math.random() - 0.5) * SWARM_SPAWN_OFFSET;
		y = spawnPos.y + 2*(Math.random() - 0.5) * SWARM_SPAWN_OFFSET;
		createSpeceEntity(texEnemy0, "Hittite looter", false,
				ENEMY_FILTER_SMALL,
				x, y,
				1, 1);
	}
};

