import * as THREE from 'three';
import { setDefaultMaterial } from '../libs/util/util.js';

// ================================================================
// SISTEMA DE ARMA E PROJÉTEIS
// ================================================================

const PROJECTILE_SPEED = 55;      // unidades por segundo
const PROJECTILE_LIFETIME = 3.0;  // segundos até desaparecer
const PROJECTILE_RADIUS = 0.18;
const FIRE_COOLDOWN = 0.18;       // intervalo mínimo entre disparos (s)
const PROJECTILE_MAX_DISTANCE = 80;

const PROJECTILE_COLOR = 'rgb(255, 180, 60)';

export class WeaponSystem {
  constructor(camera, scene) {
    this.camera = camera;
    this.scene = scene;

    this.projectiles = [];
    this.cooldown = 0;
    this.raycaster = new THREE.Raycaster();

    this._buildWeapon();
    this._buildMuzzleFlash();
  }

  // ------------------------------------------------------------
  // CONSTRUÇÃO DA ARMA (2 PARALELEPÍPEDOS)
  // ------------------------------------------------------------
  _buildWeapon() {
  this.weapon = new THREE.Group();
  this.weapon.name = 'Arma';

  // Materiais básicos => sempre visíveis, sem depender de luz
  const matBody = new THREE.MeshBasicMaterial({ color: 0x2a2a30 });
  const matBarrel = new THREE.MeshBasicMaterial({ color: 0x141416 });

  // Corpo / coronha
  const body = new THREE.Mesh(
    new THREE.BoxGeometry(0.22, 0.22, 0.75),
    matBody
  );
  body.position.set(0, 0, -0.10);
  this.weapon.add(body);

  // Cano
  const barrel = new THREE.Mesh(
    new THREE.BoxGeometry(0.10, 0.10, 0.85),
    matBarrel
  );
  barrel.position.set(0, 0.02, -0.85);
  this.weapon.add(barrel);

  // Guarda-mão
  const grip = new THREE.Mesh(
    new THREE.BoxGeometry(0.16, 0.32, 0.16),
    matBody
  );
  grip.position.set(0, -0.24, 0.05);
  grip.rotation.x = 0.25;
  this.weapon.add(grip);

  // Boca do cano (origem dos projéteis)
  this.muzzle = new THREE.Object3D();
  this.muzzle.position.set(0, 0.02, -1.30);
  this.weapon.add(this.muzzle);

  // Posição na tela
  this.weapon.position.set(0.35, -0.30, -0.75);
  this.weapon.rotation.y = -0.06;

  this.camera.add(this.weapon);
}

  // ------------------------------------------------------------
  // FLASH DO DISPARO
  // ------------------------------------------------------------
  _buildMuzzleFlash() {
    const geo = new THREE.SphereGeometry(0.09, 8, 8);
    const mat = new THREE.MeshBasicMaterial({
      color: 0xffdd66,
      transparent: true,
      opacity: 0.95
    });

    this.muzzleFlash = new THREE.Mesh(geo, mat);
    this.muzzleFlash.position.copy(this.muzzle.position);
    this.muzzleFlash.visible = false;
    this.weapon.add(this.muzzleFlash);

    this.muzzleFlashTimer = 0;
  }

  // ------------------------------------------------------------
  // DISPARO
  // ------------------------------------------------------------
  shoot() {
    if (this.cooldown > 0) return false;
    this.cooldown = FIRE_COOLDOWN;

    // Direção: do centro da câmera para frente
    const direction = new THREE.Vector3();
    this.camera.getWorldDirection(direction);

    // Posição inicial: boca do cano no mundo
    const origin = new THREE.Vector3();
    this.muzzle.getWorldPosition(origin);

    // Cria o projétil
    const geo = new THREE.SphereGeometry(PROJECTILE_RADIUS, 10, 10);
    const mat = new THREE.MeshBasicMaterial({
      color: PROJECTILE_COLOR
    });

    const proj = new THREE.Mesh(geo, mat);
    proj.position.copy(origin);
    proj.castShadow = false;
    proj.receiveShadow = false;
    proj.userData.isProjectile = true;

    // Pequeno brilho ao redor (halo)
    const haloGeo = new THREE.SphereGeometry(PROJECTILE_RADIUS * 2.2, 8, 8);
    const haloMat = new THREE.MeshBasicMaterial({
      color: PROJECTILE_COLOR,
      transparent: true,
      opacity: 0.25
    });
    const halo = new THREE.Mesh(haloGeo, haloMat);
    halo.userData.isProjectile = true;
    proj.add(halo);

    this.scene.add(proj);

    this.projectiles.push({
      mesh: proj,
      velocity: direction.clone().multiplyScalar(PROJECTILE_SPEED),
      life: PROJECTILE_LIFETIME,
      distance: 0
    });

    // Flash
    this.muzzleFlash.visible = true;
    this.muzzleFlashTimer = 0.06;

    return true;
  }

  _getCollisionObjects() {
    const objects = [];

    this.scene.traverse(obj => {
        if (!obj.isMesh) return;
        if (!obj.visible) return;
        if (obj.userData.isProjectile === true) return;
        if (this.weapon === obj || this.weapon.getObjectById(obj.id)) return;

        objects.push(obj);
    });

    return objects;
}

_checkProjectileCollision(projectile, movement) {
    const distance = movement.length();
    if (distance <= 0) return false;

    const direction = movement.clone().normalize();

    this.raycaster.set(projectile.mesh.position, direction);
    this.raycaster.near = 0;
    this.raycaster.far = distance + PROJECTILE_RADIUS;

    const objects = this._getCollisionObjects();
    const hits = this.raycaster.intersectObjects(objects, false);

    return hits.length > 0;
}

_removeProjectile(index) {
    const projectile = this.projectiles[index];

    this.scene.remove(projectile.mesh);

    projectile.mesh.traverse(obj => {
        if (obj.geometry) obj.geometry.dispose();

        if (obj.material) {
            if (Array.isArray(obj.material)) {
                obj.material.forEach(mat => mat.dispose());
            } else {
                obj.material.dispose();
            }
        }
    });

    this.projectiles.splice(index, 1);
}

  // ------------------------------------------------------------
  // ATUALIZAÇÃO POR FRAME
  // ------------------------------------------------------------
  update(delta) {
    // Cooldown
    if (this.cooldown > 0) {
      this.cooldown -= delta;
      if (this.cooldown < 0) this.cooldown = 0;
    }

    // Flash
    if (this.muzzleFlashTimer > 0) {
      this.muzzleFlashTimer -= delta;
      if (this.muzzleFlashTimer <= 0) {
        this.muzzleFlash.visible = false;
      } else {
        this.muzzleFlash.material.opacity =
          this.muzzleFlashTimer / 0.06;
      }
    }

    // Projéteis
    for (let i = this.projectiles.length - 1; i >= 0; i--) {
      const p = this.projectiles[i];
      const movement = p.velocity.clone().multiplyScalar(delta);
      const movementDistance = movement.length();

      if (this._checkProjectileCollision(p, movement)) {
          this._removeProjectile(i);
          continue;
      }

      p.mesh.position.add(movement);
      p.distance += movementDistance;
      p.life -= delta;

      if (p.life <= 0 || p.distance >= PROJECTILE_MAX_DISTANCE) {
          this._removeProjectile(i);
      }
  }
  }

  // ------------------------------------------------------------
  // VISIBILIDADE (útil ao trocar de modo de câmera)
  // ------------------------------------------------------------
  setVisible(v) {
    this.weapon.visible = v;
  }
}