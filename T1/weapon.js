import * as THREE from 'three';

// ================================================================
// BESTA MEDIEVAL E DARDOS (VIROTES)
//
// - A besta é modelada com primitivas e fica presa à câmera.
// - O dardo fica visível sobre o trilho antes do disparo.
// - Após o disparo há um tempo de recarga: a corda volta a ser
//   armada e um novo dardo desliza para o trilho.
// - Os dardos voam com uma leve queda (gravidade), sempre
//   orientados na direção do movimento, e ficam cravados nas
//   superfícies que atingem.
//
// Integração com outros módulos:
//   weaponSystem.onHit = (hit) => boolean
//   Chamado quando um dardo acerta algo. Retorne true se o acerto
//   foi "consumido" (ex.: inimigo); nesse caso o dardo some.
//   Caso contrário, o dardo fica cravado na superfície.
//
// Objetos com userData.noProjectileHit = true são ignorados.
// ================================================================

const BOLT_SPEED = 75;            // unidades por segundo
const BOLT_GRAVITY = 6;           // queda leve da trajetória
const BOLT_MAX_LIFETIME = 4.0;    // segundos em voo
const BOLT_STUCK_TIME = 8.0;      // segundos cravado antes de sumir
const MAX_STUCK_BOLTS = 30;
const BOLT_LENGTH = 0.45;
const PROJECTILE_SCALE = 1.6;     // dardo disparado um pouco maior p/ visibilidade

const FIRE_COOLDOWN = 0.9;        // tempo de recarga entre disparos (s)
const RELOAD_STRING_START = 0.30; // corda começa a ser puxada
const RELOAD_STRING_END = 0.52;   // corda armada
const RELOAD_BOLT_END = 0.85;     // novo dardo no lugar

const AIM_DISTANCE = 300;

// Pontos da corda (espaço local da besta, frente = -Z)
const BOW_Y = 0.048;
const BOW_TIP_LEFT = new THREE.Vector3(-0.36, BOW_Y, -0.34);
const BOW_TIP_RIGHT = new THREE.Vector3(0.36, BOW_Y, -0.34);
const NOCK_DRAWN = new THREE.Vector3(0, BOW_Y, -0.06);
const NOCK_RELEASED = new THREE.Vector3(0, BOW_Y, -0.42);

// Posição do dardo carregado (cauda na trava da corda)
const LOADED_BOLT_POS = new THREE.Vector3(0, BOW_Y + 0.006, -0.06);

const WEAPON_REST_POS = new THREE.Vector3(0.28, -0.29, -0.60);
const WEAPON_REST_ROT = new THREE.Euler(0.02, -0.05, 0);

const COLORS = {
  wood: 'rgb(110, 68, 38)',
  woodDark: 'rgb(62, 38, 22)',
  woodLight: 'rgb(178, 140, 92)',
  iron: 'rgb(70, 72, 76)',
  steel: 'rgb(170, 175, 182)',
  brass: 'rgb(160, 125, 55)',
  string: 'rgb(225, 215, 190)',
  fletchRed: 'rgb(170, 30, 25)',
  fletchWhite: 'rgb(235, 230, 220)'
};

// Materiais compartilhados (Lambert, conforme enunciado)
const MATS = {
  wood: new THREE.MeshLambertMaterial({ color: COLORS.wood }),
  woodDark: new THREE.MeshLambertMaterial({ color: COLORS.woodDark }),
  woodLight: new THREE.MeshLambertMaterial({ color: COLORS.woodLight }),
  iron: new THREE.MeshLambertMaterial({ color: COLORS.iron }),
  steel: new THREE.MeshLambertMaterial({ color: COLORS.steel }),
  brass: new THREE.MeshLambertMaterial({ color: COLORS.brass }),
  string: new THREE.MeshLambertMaterial({ color: COLORS.string }),
  fletchRed: new THREE.MeshLambertMaterial({ color: COLORS.fletchRed, side: THREE.DoubleSide }),
  fletchWhite: new THREE.MeshLambertMaterial({ color: COLORS.fletchWhite, side: THREE.DoubleSide })
};

const UP = new THREE.Vector3(0, 1, 0);
const FORWARD_Z = new THREE.Vector3(0, 0, 1);


// ================================================================
// FUNÇÕES AUXILIARES DE MODELAGEM
// ================================================================

function part(geometry, material, parent, x = 0, y = 0, z = 0) {
  const obj = new THREE.Mesh(geometry, material);
  obj.position.set(x, y, z);
  parent.add(obj);
  return obj;
}

// Cilindro de altura 1, ajustado entre dois pontos via setBetween()
function createSegment(radius, material, parent) {
  const geo = new THREE.CylinderGeometry(radius, radius, 1, 6);
  const seg = new THREE.Mesh(geo, material);
  parent.add(seg);
  return seg;
}

function setBetween(segment, a, b) {
  const dir = new THREE.Vector3().subVectors(b, a);
  const length = dir.length();

  segment.position.copy(a).addScaledVector(dir, 0.5);
  segment.scale.set(1, length, 1);
  segment.quaternion.setFromUnitVectors(UP, dir.normalize());
}


// ================================================================
// DARDO (VIROTE DE BESTA)
//
// Construído com a ponta apontando para +Z e a cauda em z = 0.
// - haste de madeira
// - ponta "bodkin" (piramidal, de aço) + alvado
// - 3 penas (duas vermelhas e uma branca)
// - entalhe (nock) na cauda
// ================================================================

export function createBolt() {
  const bolt = new THREE.Group();
  bolt.name = 'Dardo';

  const L = BOLT_LENGTH;

  // Haste
  const shaftLength = L - 0.075;
  const shaft = part(
    new THREE.CylinderGeometry(0.0105, 0.0115, shaftLength, 8),
    MATS.woodLight, bolt, 0, 0, 0.01 + shaftLength / 2
  );
  shaft.rotation.x = Math.PI / 2;

  // Alvado (encaixe da ponta)
  const socket = part(
    new THREE.CylinderGeometry(0.0115, 0.0095, 0.035, 8),
    MATS.iron, bolt, 0, 0, L - 0.075
  );
  socket.rotation.x = Math.PI / 2;

  // Ponta piramidal (bodkin)
  const head = part(
    new THREE.ConeGeometry(0.017, 0.07, 4),
    MATS.steel, bolt, 0, 0, L - 0.025
  );
  head.rotation.x = Math.PI / 2;
  head.rotation.y = Math.PI / 4;

  // Penas
  const fletchShape = new THREE.Shape();
  fletchShape.moveTo(0.015, 0);
  fletchShape.lineTo(0.125, 0);
  fletchShape.quadraticCurveTo(0.06, 0.012, 0.035, 0.03);
  fletchShape.lineTo(0.012, 0.03);
  fletchShape.lineTo(0.015, 0);

  const fletchGeo = new THREE.ShapeGeometry(fletchShape);
  fletchGeo.rotateY(-Math.PI / 2); // eixo x da forma => eixo z do dardo

  for (let i = 0; i < 3; i++) {
    const holder = new THREE.Group();
    holder.rotation.z = (i * 2 * Math.PI) / 3;
    bolt.add(holder);

    part(fletchGeo, i === 0 ? MATS.fletchWhite : MATS.fletchRed, holder, 0, 0.009, 0);
  }

  // Entalhe da cauda
  const nock = part(
    new THREE.CylinderGeometry(0.011, 0.011, 0.018, 8),
    MATS.woodDark, bolt, 0, 0, 0.009
  );
  nock.rotation.x = Math.PI / 2;

  bolt.traverse(obj => {
    obj.userData.isProjectile = true;
    obj.userData.noProjectileHit = true;
    obj.userData.noCollision = true;
  });

  return bolt;
}


// ================================================================
// SISTEMA DE ARMA
// ================================================================

export class WeaponSystem {
  constructor(camera, scene) {
    this.camera = camera;
    this.scene = scene;

    this.onHit = null;

    this.flying = [];
    this.stuck = [];

    this.cooldown = 0;
    this.timeSinceShot = Infinity;
    this.recoil = 0;

    this.raycaster = new THREE.Raycaster();

    this._buildCrossbow();
  }

  // ------------------------------------------------------------
  // MODELAGEM DA BESTA
  // ------------------------------------------------------------
  _buildCrossbow() {
    this.weapon = new THREE.Group();
    this.weapon.name = 'Besta';

    const w = this.weapon;

    // Coronha (parte traseira, apoio no ombro)
    const butt = part(new THREE.BoxGeometry(0.075, 0.13, 0.26), MATS.wood, w, 0, -0.035, 0.30);
    butt.rotation.x = -0.12;

    // Corpo / tiller
    part(new THREE.BoxGeometry(0.065, 0.07, 0.62), MATS.wood, w, 0, 0, -0.08);

    // Trilho superior onde o dardo se apoia
    part(new THREE.BoxGeometry(0.03, 0.012, 0.56), MATS.woodDark, w, 0, 0.041, -0.10);

    // Faixas de metal no corpo
    for (const z of [-0.30, 0.10]) {
      part(new THREE.BoxGeometry(0.072, 0.074, 0.018), MATS.iron, w, 0, 0, z);
    }

    // Trava da corda (noz)
    const nut = part(new THREE.CylinderGeometry(0.02, 0.02, 0.07, 12), MATS.brass, w, 0, 0.038, -0.035);
    nut.rotation.z = Math.PI / 2;

    // Gatilho longo (estilo medieval, sob o corpo)
    const trigger = part(new THREE.BoxGeometry(0.014, 0.012, 0.22), MATS.iron, w, 0, -0.045, 0.06);
    trigger.rotation.x = 0.18;

    // Empunhadura frontal
    const grip = part(new THREE.BoxGeometry(0.05, 0.1, 0.06), MATS.woodDark, w, 0, -0.07, -0.18);
    grip.rotation.x = 0.2;

    // Arco (prod) - limbos curvos em aço
    const prodCurve = new THREE.CatmullRomCurve3([
      BOW_TIP_LEFT.clone(),
      new THREE.Vector3(-0.22, BOW_Y, -0.43),
      new THREE.Vector3(0, BOW_Y, -0.46),
      new THREE.Vector3(0.22, BOW_Y, -0.43),
      BOW_TIP_RIGHT.clone()
    ]);
    part(new THREE.TubeGeometry(prodCurve, 32, 0.013, 8, false), MATS.iron, w);

    // Pontas do arco
    for (const tip of [BOW_TIP_LEFT, BOW_TIP_RIGHT]) {
      part(new THREE.SphereGeometry(0.017, 8, 8), MATS.brass, w, tip.x, tip.y, tip.z);
    }

    // Bloco de fixação do arco
    part(new THREE.BoxGeometry(0.09, 0.08, 0.06), MATS.iron, w, 0, 0.01, -0.42);

    // Estribo frontal (apoio do pé para armar a besta)
    const stirrup = part(new THREE.TorusGeometry(0.055, 0.008, 6, 16, Math.PI), MATS.iron, w, 0, -0.01, -0.50);
    stirrup.rotation.z = Math.PI;

    // Mira (alça simples)
    part(new THREE.BoxGeometry(0.012, 0.035, 0.012), MATS.iron, w, 0, 0.06, 0.04);

    // Corda (dois segmentos: ponta esquerda -> noz -> ponta direita)
    this.stringLeft = createSegment(0.0035, MATS.string, w);
    this.stringRight = createSegment(0.0035, MATS.string, w);
    this.nockPoint = NOCK_DRAWN.clone();
    this._updateString();

    // Dardo carregado sobre o trilho
    this.loadedBolt = createBolt();
    this.loadedBolt.rotation.y = Math.PI; // ponta para -Z (frente)
    this.loadedBolt.position.copy(LOADED_BOLT_POS);
    w.add(this.loadedBolt);

    // Origem dos disparos (ponta do dardo carregado)
    this.muzzle = new THREE.Object3D();
    this.muzzle.position.set(0, BOW_Y + 0.006, -0.06 - BOLT_LENGTH);
    w.add(this.muzzle);

    // A arma não projeta sombra e não entra nas colisões
    w.traverse(obj => {
      obj.castShadow = false;
      obj.receiveShadow = false;
      obj.userData.noProjectileHit = true;
      obj.userData.noCollision = true;
    });

    w.position.copy(WEAPON_REST_POS);
    w.rotation.copy(WEAPON_REST_ROT);

    this.camera.add(w);
  }

  _updateString() {
    setBetween(this.stringLeft, BOW_TIP_LEFT, this.nockPoint);
    setBetween(this.stringRight, this.nockPoint, BOW_TIP_RIGHT);
  }

  // ------------------------------------------------------------
  // DISPARO
  // ------------------------------------------------------------
  shoot() {
    if (this.cooldown > 0 || !this.weapon.visible) return false;

    this.cooldown = FIRE_COOLDOWN;
    this.timeSinceShot = 0;
    this.recoil = 1;

    // Ponto mirado: o que estiver no centro da tela
    const camPos = new THREE.Vector3();
    const camDir = new THREE.Vector3();
    this.camera.getWorldPosition(camPos);
    this.camera.getWorldDirection(camDir);

    this.raycaster.set(camPos, camDir);
    this.raycaster.near = 0;
    this.raycaster.far = AIM_DISTANCE;

    const hits = this.raycaster.intersectObjects(this._getCollisionObjects(), false);
    const aimPoint = hits.length > 0
      ? hits[0].point
      : camPos.clone().addScaledVector(camDir, AIM_DISTANCE);

    const origin = new THREE.Vector3();
    this.muzzle.getWorldPosition(origin);

    const direction = aimPoint.clone().sub(origin).normalize();

    // O dardo do trilho "sai" da arma
    this.loadedBolt.visible = false;
    this.nockPoint.copy(NOCK_RELEASED);
    this._updateString();

    const mesh = createBolt();
    mesh.scale.setScalar(PROJECTILE_SCALE);
    mesh.position.copy(origin);
    mesh.quaternion.setFromUnitVectors(FORWARD_Z, direction);
    this.scene.add(mesh);

    this.flying.push({
      mesh,
      velocity: direction.multiplyScalar(BOLT_SPEED),
      life: BOLT_MAX_LIFETIME
    });

    return true;
  }

  // ------------------------------------------------------------
  // COLISÃO
  // ------------------------------------------------------------
  _isWorldVisible(obj) {
    for (let o = obj; o; o = o.parent) {
      if (!o.visible) return false;
    }
    return true;
  }

  _getCollisionObjects() {
    const objects = [];

    this.scene.traverse(obj => {
      if (!obj.isMesh) return;
      if (obj.userData.noProjectileHit === true) return;
      if (!this._isWorldVisible(obj)) return;

      objects.push(obj);
    });

    return objects;
  }

  _castBolt(bolt, movement, objects) {
    const distance = movement.length();
    if (distance <= 0) return null;

    this.raycaster.set(bolt.mesh.position, movement.clone().normalize());
    this.raycaster.near = 0;
    this.raycaster.far = distance + BOLT_LENGTH * PROJECTILE_SCALE;

    const hits = this.raycaster.intersectObjects(objects, false);
    return hits.length > 0 ? hits[0] : null;
  }

  _stick(bolt, hit) {
    const dir = bolt.velocity.clone().normalize();

    // Ponta levemente cravada na superfície
    bolt.mesh.position.copy(hit.point)
      .addScaledVector(dir, -BOLT_LENGTH * PROJECTILE_SCALE * 0.85);
    bolt.mesh.quaternion.setFromUnitVectors(FORWARD_Z, dir);

    // Prende o dardo ao objeto atingido (acompanha portas, por exemplo)
    hit.object.attach(bolt.mesh);

    this.stuck.push({ mesh: bolt.mesh, life: BOLT_STUCK_TIME });

    if (this.stuck.length > MAX_STUCK_BOLTS) {
      this._dispose(this.stuck.shift().mesh);
    }
  }

  _dispose(mesh) {
    mesh.removeFromParent();
  }

  // ------------------------------------------------------------
  // ATUALIZAÇÃO POR FRAME
  // ------------------------------------------------------------
  update(delta) {
    this._updateReload(delta);
    this._updateRecoil(delta);
    this._updateFlying(delta);
    this._updateStuck(delta);
  }

  _updateReload(delta) {
    if (this.cooldown > 0) this.cooldown = Math.max(0, this.cooldown - delta);
    if (this.timeSinceShot === Infinity) return;

    this.timeSinceShot += delta;
    const t = this.timeSinceShot;

    // 1) Corda é puxada de volta até a trava
    if (t >= RELOAD_STRING_START) {
      const k = THREE.MathUtils.smoothstep(t, RELOAD_STRING_START, RELOAD_STRING_END);
      this.nockPoint.lerpVectors(NOCK_RELEASED, NOCK_DRAWN, k);
      this._updateString();
    }

    // 2) Novo dardo desliza por trás até o trilho
    if (t >= RELOAD_STRING_END) {
      const k = THREE.MathUtils.smoothstep(t, RELOAD_STRING_END, RELOAD_BOLT_END);
      this.loadedBolt.visible = true;
      this.loadedBolt.position.copy(LOADED_BOLT_POS);
      this.loadedBolt.position.z += (1 - k) * 0.3;
      this.loadedBolt.position.y -= (1 - k) * 0.05;
    }

    if (t >= RELOAD_BOLT_END) {
      this.loadedBolt.position.copy(LOADED_BOLT_POS);
      this.timeSinceShot = Infinity;
    }
  }

  // Coice da arma ao disparar, com retorno suave
  _updateRecoil(delta) {
    this.recoil *= Math.exp(-9 * delta);

    this.weapon.position.copy(WEAPON_REST_POS);
    this.weapon.position.z += this.recoil * 0.09;
    this.weapon.position.y += this.recoil * 0.02;

    this.weapon.rotation.copy(WEAPON_REST_ROT);
    this.weapon.rotation.x += this.recoil * 0.14;
  }

  _updateFlying(delta) {
    if (this.flying.length === 0) return;

    const objects = this._getCollisionObjects();

    for (let i = this.flying.length - 1; i >= 0; i--) {
      const bolt = this.flying[i];

      bolt.velocity.y -= BOLT_GRAVITY * delta;
      const movement = bolt.velocity.clone().multiplyScalar(delta);

      const hit = this._castBolt(bolt, movement, objects);

      if (hit) {
        this.flying.splice(i, 1);

        const consumed = typeof this.onHit === 'function' && this.onHit(hit) === true;

        if (consumed) this._dispose(bolt.mesh);
        else this._stick(bolt, hit);

        continue;
      }

      bolt.mesh.position.add(movement);
      bolt.mesh.quaternion.setFromUnitVectors(FORWARD_Z, bolt.velocity.clone().normalize());

      bolt.life -= delta;
      if (bolt.life <= 0) {
        this.flying.splice(i, 1);
        this._dispose(bolt.mesh);
      }
    }
  }

  _updateStuck(delta) {
    for (let i = this.stuck.length - 1; i >= 0; i--) {
      const s = this.stuck[i];
      s.life -= delta;

      if (s.life <= 0) {
        this._dispose(s.mesh);
        this.stuck.splice(i, 1);
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
