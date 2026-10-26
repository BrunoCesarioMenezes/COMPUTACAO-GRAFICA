import * as THREE from 'three';
import { OBJLoader } from '../build/jsm/loaders/OBJLoader.js';
import { MTLLoader } from '../build/jsm/loaders/MTLLoader.js';
import { showMessage } from './hud.js';

// ================================================================
// INIMIGOS
//
// - Dois modelos importados (OBJ + MTL), dois inimigos de cada.
// - Tipo "flutuante" morre com 3 disparos; tipo "rastejante"
//   morre com 5 disparos.
// - Cada inimigo tem uma luz pontual colorida de baixa
//   intensidade e uma barra de energia sobre a cabeça.
// - Ao zerar o HP, o inimigo desaparece com transição de
//   opacidade e solta uma chave (callback onEnemyKilled).
// - Os inimigos só aparecem no turno noturno (setNight).
//
// Integração:
//   const enemies = new EnemyManager(scene);
//   enemies.onEnemyKilled = (enemy, position) => keySystem.dropKey(position);
//   weaponSystem.onHit = hit => enemies.handleHit(hit);
//   lighting.onChange(isNight => enemies.setNight(isNight));
//   enemies.update(dt, camera);
// ================================================================

const ASSET_PATH = './assets/enemies/';

const FADE_TIME = 1.4;          // duração da transição de opacidade (s)
const HIT_FLASH_TIME = 0.15;
const TURN_SPEED = 4.0;
const LIGHT_INTENSITY = 8;
const LIGHT_DISTANCE = 9;

const HEALTH_BAR_WIDTH = 1.6;
const HEALTH_BAR_HEIGHT = 0.16;

// ------------------------------------------------------------
// TIPOS DE INIMIGO
// yawOffset: corrige a direção "para frente" do modelo importado
// ------------------------------------------------------------
export const ENEMY_TYPES = {
  dragon: {
    name: 'Dragão azul',
    obj: 'BlueDragon.obj',
    mtl: 'BlueDragon.mtl',
    height: 2.4,
    maxHp: 3,
    movement: 'float',
    hoverHeight: 1.3,
    speed: 2.4,
    yawOffset: 0,
    lightColor: 'rgb(70, 160, 255)'
  },

  guardian: {
    name: 'Guardião da floresta',
    obj: 'Florest_Guardian.obj',
    mtl: 'Florest_Guardian.mtl',
    height: 3.0,
    maxHp: 5,
    movement: 'crawl',
    hoverHeight: 0,
    speed: 1.3,
    yawOffset: 0,
    lightColor: 'rgb(110, 255, 120)'
  }
};

// ------------------------------------------------------------
// POSIÇÕES PADRÃO (patrulha de ida e volta entre os pontos)
// y = altura do piso onde o inimigo está
// ------------------------------------------------------------
const WALKWAY_Y = 13.45;

export const DEFAULT_SPAWNS = [
  // Sobre a parte caminhável da muralha frontal (oeste do portão)
  { type: 'dragon', path: [[-34, WALKWAY_Y, -42], [-16, WALKWAY_Y, -42]] },

  // Dentro do edifício interno oeste
  { type: 'guardian', path: [[-27, 0, 14.5], [-17, 0, 14.5]] },

  // Pátio
  { type: 'dragon', path: [[8, 0, -26], [16, 0, -4]] },

  // Sobre a muralha leste
  { type: 'guardian', path: [[42, WALKWAY_Y, -30], [42, WALKWAY_Y, -13]] }
];


// ================================================================
// CARREGAMENTO DOS MODELOS (uma vez por tipo)
// ================================================================

const modelCache = new Map();

function loadModel(type) {
  if (modelCache.has(type)) return modelCache.get(type);

  const cfg = ENEMY_TYPES[type];

  const promise = new MTLLoader()
    .setPath(ASSET_PATH)
    .loadAsync(cfg.mtl)
    .then(materials => {
      materials.preload();
      return new OBJLoader()
        .setMaterials(materials)
        .setPath(ASSET_PATH)
        .loadAsync(cfg.obj);
    })
    .then(obj => normalizeModel(obj, cfg.height));

  modelCache.set(type, promise);
  return promise;
}

// Converte materiais para Lambert, escala para a altura desejada
// e coloca a base do modelo em y = 0, centralizado em x/z.
function normalizeModel(obj, height) {
  obj.traverse(child => {
    if (!child.isMesh) return;

    const old = child.material;
    child.material = new THREE.MeshLambertMaterial({
      map: old.map || null,
      color: old.map ? 'white' : old.color
    });

    child.castShadow = true;
    child.receiveShadow = true;
  });

  const box = new THREE.Box3().setFromObject(obj);
  const size = box.getSize(new THREE.Vector3());
  const scale = height / size.y;

  obj.scale.setScalar(scale);

  box.setFromObject(obj);
  const center = box.getCenter(new THREE.Vector3());
  obj.position.set(-center.x, -box.min.y, -center.z);

  const wrapper = new THREE.Group();
  wrapper.add(obj);
  return wrapper;
}

// Clona o modelo com materiais próprios (necessário p/ fade e flash)
function cloneModel(source) {
  const model = source.clone(true);

  model.traverse(child => {
    if (child.isMesh) child.material = child.material.clone();
  });

  return model;
}


// ================================================================
// BARRA DE ENERGIA
// ================================================================

function createHealthBar() {
  const group = new THREE.Group();

  const back = new THREE.Mesh(
    new THREE.PlaneGeometry(HEALTH_BAR_WIDTH + 0.08, HEALTH_BAR_HEIGHT + 0.08),
    new THREE.MeshBasicMaterial({ color: 'rgb(15, 15, 18)', transparent: true, opacity: 0.8, fog: false })
  );
  group.add(back);

  // Geometria com origem na borda esquerda => escala só diminui à direita
  const fillGeo = new THREE.PlaneGeometry(HEALTH_BAR_WIDTH, HEALTH_BAR_HEIGHT);
  fillGeo.translate(HEALTH_BAR_WIDTH / 2, 0, 0);

  const fill = new THREE.Mesh(
    fillGeo,
    new THREE.MeshBasicMaterial({ color: 'rgb(80, 220, 90)', transparent: true, fog: false })
  );
  fill.position.set(-HEALTH_BAR_WIDTH / 2, 0, 0.001);
  group.add(fill);

  group.traverse(obj => {
    obj.userData.noProjectileHit = true;
    obj.userData.noCollision = true;
    obj.renderOrder = 10;
  });

  return { group, fill, materials: [back.material, fill.material] };
}

const HP_FULL = new THREE.Color('rgb(80, 220, 90)');
const HP_MID = new THREE.Color('rgb(240, 200, 60)');
const HP_LOW = new THREE.Color('rgb(230, 60, 50)');

function healthColor(ratio, target) {
  if (ratio > 0.5) return target.lerpColors(HP_MID, HP_FULL, (ratio - 0.5) * 2);
  return target.lerpColors(HP_LOW, HP_MID, ratio * 2);
}


// ================================================================
// INIMIGO
// ================================================================

class Enemy {
  constructor(scene, type, path, model) {
    this.cfg = ENEMY_TYPES[type];
    this.type = type;
    this.path = path.map(p => new THREE.Vector3(...p));

    this.hp = this.cfg.maxHp;
    this.state = 'alive';      // alive -> dying -> dead
    this.fade = 0;
    this.flash = 0;
    this.time = Math.random() * 10;

    this.targetIndex = 1;
    this.yaw = 0;

    // root: posição no mundo (sem rotação, p/ a barra de energia)
    // pivot: rotação/balanço do modelo
    this.root = new THREE.Group();
    this.root.name = `Inimigo - ${this.cfg.name}`;
    this.root.position.copy(this.path[0]);
    scene.add(this.root);

    this.pivot = new THREE.Group();
    this.root.add(this.pivot);

    this.model = model;
    this.pivot.add(model);

    this.materials = [];
    model.traverse(child => {
      if (!child.isMesh) return;
      child.userData.noProjectileHit = true;
      this.materials.push(child.material);
    });

    // Caixa de acerto invisível: evita que dardos atravessem
    // partes finas do modelo (asas, galhos)
    const size = new THREE.Box3().setFromObject(model).getSize(new THREE.Vector3());
    const hitbox = new THREE.Mesh(
      new THREE.BoxGeometry(size.x * 0.6, size.y * 0.9, size.z * 0.6),
      new THREE.MeshBasicMaterial({ visible: false })
    );
    hitbox.position.y = size.y / 2;
    hitbox.userData.enemy = this;
    this.pivot.add(hitbox);

    this.healthBar = createHealthBar();
    this.healthBar.group.position.y = this.cfg.height + this.cfg.hoverHeight + 0.55;
    this.root.add(this.healthBar.group);

    // A luz fica fora do root: esconder o inimigo não muda o número
    // de luzes da cena (evita recompilar shaders na troca dia/noite)
    this.light = new THREE.PointLight(this.cfg.lightColor, 0, LIGHT_DISTANCE, 1.5);
    scene.add(this.light);

    this.active = true;
    this._updateHealthBar();
  }

  get alive() {
    return this.state === 'alive';
  }

  // ------------------------------------------------------------
  // DANO
  // ------------------------------------------------------------
  takeDamage(amount = 1) {
    if (!this.alive) return;

    this.hp = Math.max(0, this.hp - amount);
    this.flash = HIT_FLASH_TIME;
    this._updateHealthBar();

    if (this.hp === 0) {
      this.state = 'dying';
      this.fade = 0;

      this.materials.forEach(m => {
        m.transparent = true;
        m.needsUpdate = true;
      });
    }
  }

  _updateHealthBar() {
    const ratio = this.hp / this.cfg.maxHp;
    this.healthBar.fill.scale.x = Math.max(ratio, 0.0001);
    healthColor(ratio, this.healthBar.fill.material.color);
  }

  // ------------------------------------------------------------
  // ATUALIZAÇÃO
  // ------------------------------------------------------------
  update(delta, camera) {
    if (this.state === 'dead') return null;

    this.time += delta;

    if (this.alive) this._patrol(delta);
    this._animate(delta);

    // Barra de energia sempre voltada para a câmera
    this.healthBar.group.quaternion.copy(camera.quaternion);

    // Flash vermelho ao receber dano
    if (this.flash > 0) this.flash = Math.max(0, this.flash - delta);
    const flash = this.flash / HIT_FLASH_TIME;
    this.materials.forEach(m => m.emissive.setRGB(flash * 0.9, flash * 0.1, flash * 0.05));

    // Luz acompanha o inimigo
    this.light.position.copy(this.root.position);
    this.light.position.y += this.cfg.hoverHeight + this.cfg.height * 0.6;

    let lightFactor = this.active ? 1 : 0;

    if (this.state === 'dying') {
      this.fade += delta / FADE_TIME;
      const opacity = Math.max(0, 1 - this.fade);

      this.materials.forEach(m => { m.opacity = opacity; });
      this.healthBar.materials.forEach(m => { m.opacity = opacity * 0.8; });
      this.pivot.position.y += delta * 0.6;
      lightFactor *= opacity;

      if (this.fade >= 1) {
        this.state = 'dead';
        this.root.visible = false;
        this.light.intensity = 0;

        // Chave aparece onde o inimigo estava, na altura do peito
        const drop = this.root.position.clone();
        drop.y += 1.2;
        return drop;
      }
    }

    this.light.intensity = LIGHT_INTENSITY * lightFactor * (0.9 + 0.1 * Math.sin(this.time * 4));
    return null;
  }

  // Ida e volta entre os pontos do caminho
  _patrol(delta) {
    const target = this.path[this.targetIndex];
    const pos = this.root.position;

    const toTarget = new THREE.Vector3().subVectors(target, pos);
    const dist = toTarget.length();

    if (dist < 0.1) {
      this.targetIndex = (this.targetIndex + 1) % this.path.length;
      return;
    }

    const step = Math.min(dist, this.cfg.speed * delta);
    pos.addScaledVector(toTarget.normalize(), step);

    // Gira suavemente para a direção do movimento
    const desiredYaw = Math.atan2(toTarget.x, toTarget.z);
    let diff = desiredYaw - this.yaw;
    diff = Math.atan2(Math.sin(diff), Math.cos(diff));
    this.yaw += diff * Math.min(1, TURN_SPEED * delta);
  }

  _animate() {
    const t = this.time;
    this.pivot.rotation.set(0, this.yaw + this.cfg.yawOffset, 0);

    if (this.cfg.movement === 'float') {
      // Flutua: sobe e desce e balança levemente
      if (this.state === 'alive') {
        this.pivot.position.y = this.cfg.hoverHeight + Math.sin(t * 2.0) * 0.3;
      }
      this.pivot.rotation.z = Math.sin(t * 1.3) * 0.08;
      this.pivot.rotation.x = 0.1 + Math.sin(t * 2.0 + 1) * 0.05;
    } else {
      // Rasteja: comprime e estica, arrastando-se no chão
      const s = Math.sin(t * 5.0);
      this.pivot.scale.set(1 - s * 0.04, 1 + s * 0.06, 1 - s * 0.04);
      this.pivot.rotation.z = Math.sin(t * 2.5) * 0.05;
    }
  }

  setActive(active) {
    this.active = active;
    if (this.state !== 'dead') this.root.visible = active;
    if (!active) this.light.intensity = 0;
  }
}


// ================================================================
// GERENCIADOR DE INIMIGOS
// ================================================================

export class EnemyManager {
  constructor(scene, spawns = DEFAULT_SPAWNS) {
    this.scene = scene;
    this.enemies = [];
    this.onEnemyKilled = null;
    this.isNight = true;

    this.ready = Promise.all(spawns.map(async spawn => {
      const source = await loadModel(spawn.type);
      const enemy = new Enemy(scene, spawn.type, spawn.path, cloneModel(source));
      enemy.setActive(this.isNight);
      this.enemies.push(enemy);
    })).catch(err => console.error('Erro ao carregar inimigos:', err));
  }

  // Inimigos só aparecem à noite
  setNight(isNight) {
    this.isNight = isNight;
    this.enemies.forEach(e => e.setActive(isNight));
  }

  // Chamado pela arma. Retorna true se o dardo atingiu um inimigo.
  handleHit(hit) {
    let enemy = null;

    for (let o = hit.object; o && !enemy; o = o.parent) {
      enemy = o.userData.enemy || null;
    }

    if (!enemy || enemy.state === 'dead') return false;

    enemy.takeDamage(1);
    return true;
  }

  get remaining() {
    return this.enemies.filter(e => e.alive).length;
  }

  update(delta, camera) {
    for (const enemy of this.enemies) {
      const drop = enemy.update(delta, camera);

      if (drop) {
        showMessage(`${enemy.cfg.name} eliminado! Uma chave caiu.`);
        if (typeof this.onEnemyKilled === 'function') this.onEnemyKilled(enemy, drop);
      }
    }
  }
}
