function Laser(a, b, tint) {
	this.sprite = new PIXI.Sprite(texLaser);
	this.ttl = 2.0;

	let dx, dy, dist;
	dx = b.x - a.x;
	dy = b.y - a.y;
	dist = Math.sqrt(dx*dx + dy*dy);

	this.sprite.anchor.set(0, 0.5);
	this.sprite.rotation = Math.atan2(dy, dx);
	this.sprite.tint = tint;
	let scale = dist*0.03;
	this.sprite.scale.set(scale, 1);
	this.sprite.position.set( a.x, a.y);
};

Laser.prototype.animate = function(time) {
	this.ttl -= time;

	if (this.ttl < 0.0) {
		return kysFx(this);
	}

	this.sprite.alpha = Math.min(1.0, this.ttl);
};

