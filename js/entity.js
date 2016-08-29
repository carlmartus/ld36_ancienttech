//==============================================================================
// Space entity - The cornerstone of the gameplay
//==============================================================================

function Entity(texture, name, controlable, isEnemy, start, topSpeed, scale, fireRange, rotation) {
	this.position = start.clone();
	this.name = name;
	this.topSpeed = topSpeed;
	this.fireRange = fireRange;
	this.controlable = controlable;
	this.isEnemy = isEnemy;
	this.sprite = new PIXI.Sprite(texture);
	this.sprite.anchor.set(0.5);

	this.weaponCooldown = 0.0;
	this.health = 10;

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
			knockout.setSelected(self.name, true, self.fireRange, self.topSpeed);
			setZoomTarget(self);
		});
	} else if (isEnemy) {
		this.hitBox = new PIXI.Sprite(texEnemyBox);
		this.hitBox.anchor.set(0.5);
		let self = this;

		spriteButton(this.hitBox, function() {
			knockout.setSelected(self.name, false, "No stellar weapons", self.topSpeed);
			setZoomTarget(self);
		});
	}

	this.scale = (scale ? scale : 1.0) * (this.sprite.width / 32.0);
	this.sprite.scale.set(scale);
};

Entity.prototype.animate = function(time) {

	if (this.isEnemy) {
		if (this.setMovement(stellarCenter) < 200) {
			knockout.countLoots(knockout.countLoots() + 1);
			kysEntity(this);
			considerGameOver();
			return;
		}
	}

	if (this.weaponCooldown > 0.0) {
		this.weaponCooldown -= time;
	}

	if (this.controlable && this.activeDecision) {
		this.progressDecision(time);
	}

	if (this.activeSpeed > 0.0) {
		this.position.x += this.activeSpeed * Math.cos(this.sprite.rotation) * time;
		this.position.y += this.activeSpeed * Math.sin(this.sprite.rotation) * time;
	}

	this.sprite.position.copy(this.position);

	if (this.hitBox) {
		this.hitBox.position.copy(this.position);

		minHitScale = 1.0 / zoom;
		this.hitBox.scale.set(Math.max(this.scale*1.5, minHitScale));
	}
};

Entity.prototype.setSpeed = function(speedOn) {
	this.activeSpeed = speedOn ? this.topSpeed : 0.0;
};

Entity.prototype.setRotation = function(rad) {
	this.sprite.rotation = rad;
}

Entity.prototype.setMovement = function(trg, addAngle) {
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

Entity.prototype.fireAt = function(target) {

	target.health -= 1;
	this.weaponCooldown = 1.0;
	spawnLaser(this.position, target.position,
			this.fireRange > 1200 ? 0x88ff88 : 0xff0000);

	damageControl(target);
	this.decide();
};

Entity.prototype.progressDecision = function(time) {

	switch (this.activeDecision.triggerType) {

		case TRIGGER_IDLE :
			switch (this.activeDecision.actionIdle) {
				default :
				case IDLE_HALT :	return this.progressIdleHalt();
				case IDLE_PLANET :	return this.progressIdlePlanet();
			} break;

		case TRIGGER_ENEMY_INRANGE :
			this.fireAt(this.activeDecision.target);
			break;

		case TRIGGER_ENEMY_DETECTED :
			switch (this.activeDecision.extra) {
				default :
				case MANEUVER_AGRESSIVE :	return this.progressManeuver(time, 150);
				case MANEUVER_SKIRMISH :	return this.progressManeuver(time, 400);
			}
			break;
	}
};

Entity.prototype.progressIdleHalt = function(time) {
	this.setSpeed(false);
};

Entity.prototype.progressIdlePlanet = function(time) {
	let dx, dy, dist;
	dx = stellarCenter.x - this.position.x;
	dy = stellarCenter.y - this.position.y;
	dist = Math.sqrt(dx*dx + dy*dy);

	let v = Math.atan2(
			stellarCenter.y - this.position.y,
			stellarCenter.x - this.position.x);

	if (dist < 300) {
		v += Math.PI;
	} else if (dist < 400) {
		v += Math.PI*0.5;
	}

	this.setRotation(v);
	this.setSpeed(true);
};

Entity.prototype.progressManeuver = function(time, circleDistance) {
	let dist = this.setMovement(this.activeDecision.target.position);
	if (dist < circleDistance + 100) { // Smooth rotation
		let p = (dist - circleDistance) * 0.01;
		this.setMovement(this.activeDecision.target.position, p*Math.PI*0.5);

	} else if (dist < circleDistance) {
		this.setMovement(this.activeDecision.target.position, Math.PI*0.5);
	}
};

Entity.prototype.decide = function() {
	let ds = this.matchDecision();

	if (!ds || ds.type == TRIGGER_NONE) {
		ds = makeTrigger(TRIGGER_IDLE, null, IDLE_HALT);
	}

	if (
			!this.activeDecision ||
			this.activeDecision.triggerType != ds.triggerType ||
			this.activeDecision.actionIdle != ds.actionIdle ||
			this.activeDecision.enemyFocus != ds.enemyFocus ||
			this.activeDecision.enemyManeuver != ds.enemyManeuver ||
			this.activeDecision.target != ds.target) {
		this.activeDecision = ds;
		//console.log('Change dec', ds.triggerType);
	}
};

Entity.prototype.matchDecision = function() {
	let gws = this.collectGroundWork();

	for (let gw of gws) {
		for (let ds of this.decisions) {
			if (gw.triggerType == ds.triggerType) {
				switch (gw.triggerType) {
					default : return ds;
					case TRIGGER_ENEMY_INRANGE :
					case TRIGGER_ENEMY_DETECTED :
							  if (gw.extra == ds.enemyFocus) {
								  return makeTrigger(gw.triggerType,
										  gw.target, ds.enemyManeuver);
							  }
							  break;
				}
			}
		}
	}
};

Entity.prototype.collectGroundWork = function() {
	let gws = [];

	let nearestDistDirectInRange, nearestEntityDirecInRange;
	let nearestDistDirectTotal, nearestEntityDirectTotal;
	let nearestDistPlanetInRange, nearestEntityPlanetInRange;
	let nearestDistPlanetTotal, nearestEntityPlanetTotal;

	// Enemies?
	for (let e of entities) {
		if (!e.isEnemy) continue;

		let dx, dy, distEntity, distPlanet, v;
		dx = e.position.x - this.position.x;
		dy = e.position.y - this.position.y;
		distEntity = Math.sqrt(dx*dx + dy*dy);

		dx = e.position.x - stellarCenter.x;
		dy = e.position.y - stellarCenter.y;
		distPlanet = Math.sqrt(dx*dx + dy*dy);

		if (!nearestEntityDirectTotal ||
				distEntity < nearestDistDirectTotal) {
			nearestEntityDirectTotal = e;
			nearestDistDirectTotal = distEntity;
		}

		if (!nearestEntityPlanetTotal ||
				distPlanet < nearestDistPlanetTotal) {
			nearestEntityPlanetTotal = e;
			nearestDistPlanetTotal = distPlanet;
		}

		if (distEntity < this.fireRange) {

			if (!nearestEntityDirecInRange ||
					distEntity < nearestDistDirectInRange) {
				nearestEntityDirecInRange = e;
				nearestDistDirectInRange = distEntity;
			}

			if (!nearestEntityPlanetInRange ||
					distPlanet < nearestDistPlanetInRange) {
				nearestEntityPlanetInRange = e;
				nearestDistPlanetInRange = distPlanet;
			}
		}
	}

	if (this.weaponCooldown <= 0.0) {
		if (nearestEntityDirecInRange) {
			gws.push(makeTrigger(TRIGGER_ENEMY_INRANGE, nearestEntityDirecInRange, FOCUS_NEAREST));
		}

		if (nearestEntityPlanetInRange) {
			gws.push(makeTrigger(TRIGGER_ENEMY_INRANGE, nearestEntityPlanetInRange, FOCUS_PLANET));
		}
	}

	if (nearestEntityDirectTotal) {
		gws.push(makeTrigger(TRIGGER_ENEMY_DETECTED, nearestEntityDirectTotal, FOCUS_NEAREST));
	}

	if (nearestEntityPlanetTotal) {
		gws.push(makeTrigger(TRIGGER_ENEMY_DETECTED, nearestEntityPlanetTotal, FOCUS_PLANET));
	}

	// Idle
	gws.push(makeTrigger(TRIGGER_IDLE, stellarCenter, IDLE_PLANET));
	gws.push(makeTrigger(TRIGGER_IDLE, null, IDLE_HALT));

	return gws;
};

