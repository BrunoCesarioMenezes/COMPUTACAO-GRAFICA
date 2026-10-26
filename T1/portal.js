import * as THREE from 'three';
import { createKeyOrb, KEY_COLORS, TOTAL_KEYS } from './keys.js';
import { showMessage } from './hud.js';

// ================================================================
// PEDESTAIS E ESCOTILHA DO PORTAL
//
// - Plataforma circular de pedra no pátio interno.
// - Escotilha circular no centro, formada por duas folhas
//   semicirculares de madeira reforçadas com ferro.
// - 4 pedestais ao redor da escotilha.
// - Ao se aproximar de um pedestal vazio carregando uma chave,
//   a chave é posicionada sobre ele e acende uma luz pontual.
// - Com as 4 chaves posicionadas, a escotilha se abre revelando
//   o portal luminoso.
//
// Integração:
//   const portal = new Portal(scene, keySystem, { parent: castle.root });
//   portal.update(dt, camera.position);
//   portal.onOpen = () => { ... }   // opcional
//
// Os pedestais e a plataforma são adicionados ao "parent" para
// participarem das colisões do jogador.
// ================================================================

const DEFAULT_POSITION = new THREE.Vector3(0, 0, -13);

const DAIS_RADIUS = 6.4;
const DAIS_HEIGHT = 0.22;
const HATCH_RADIUS = 2.3;
const PEDESTAL_DISTANCE = 4.5;
const PEDESTAL_HEIGHT = 1.6;
const PLACE_DISTANCE = 2.3;

const OPEN_DELAY = 0.8;        // espera após a última chave (s)
const OPEN_DURATION = 2.6;     // duração da abertura (s)
const OPEN_ANGLE = THREE.MathUtils.degToRad(112);

const KEY_DROP_TIME = 0.6;     // chave "pousando" no pedestal
const PEDESTAL_LIGHT_INTENSITY = 6;
const PORTAL_LIGHT_INTENSITY = 30;

const COLORS = {
  stone: 'rgb(150, 143, 126)',
  stoneDark: 'rgb(98, 93, 82)',
  stoneTrim: 'rgb(176, 168, 148)',
  wood: 'rgb(84, 52, 30)',
  iron: 'rgb(48, 48, 46)',
  pit: 'rgb(12, 10, 16)',
  portal: 'rgb(140, 90, 255)',
  portalLight: 'rgb(150, 110, 255)'
};

function part(geometry, material, parent, x = 0, y = 0, z = 0) {
  const obj = new THREE.Mesh(geometry, material);
  obj.position.set(x, y, z);
  obj.castShadow = true;
  obj.receiveShadow = true;
  parent.add(obj);
  return obj;
}

// Textura em espiral para o "vórtice" do portal
function createSwirlTexture() {
  const size = 256;
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = size;
  const ctx = canvas.getContext('2d');
  const c = size / 2;

  const bg = ctx.createRadialGradient(c, c, 0, c, c, c);
  bg.addColorStop(0, '#ffffff');
  bg.addColorStop(0.25, '#c9a8ff');
  bg.addColorStop(0.7, '#5a2bbf');
  bg.addColorStop(1, '#14082e');
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, size, size);

  ctx.strokeStyle = 'rgba(255, 255, 255, 0.55)';
  ctx.lineWidth = 5;

  for (let arm = 0; arm < 5; arm++) {
    ctx.beginPath();
    for (let t = 0; t <= 1; t += 0.01) {
      const angle = arm * (2 * Math.PI / 5) + t * 4.5;
      const r = t * c;
      const x = c + Math.cos(angle) * r;
      const y = c + Math.sin(angle) * r;
      if (t === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
    }
    ctx.stroke();
  }

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}


export class Portal {
  constructor(scene, keySystem, { parent = scene, position = DEFAULT_POSITION } = {}) {
    this.scene = scene;
    this.keySystem = keySystem;
    this.onOpen = null;

    this.root = new THREE.Group();
    this.root.name = 'Portal';
    this.root.position.copy(position);
    parent.add(this.root);

    this.mats = {
      stone: new THREE.MeshLambertMaterial({ color: COLORS.stone }),
      stoneDark: new THREE.MeshLambertMaterial({ color: COLORS.stoneDark }),
      stoneTrim: new THREE.MeshLambertMaterial({ color: COLORS.stoneTrim }),
      wood: new THREE.MeshLambertMaterial({ color: COLORS.wood }),
      iron: new THREE.MeshLambertMaterial({ color: COLORS.iron }),
      pit: new THREE.MeshLambertMaterial({ color: COLORS.pit })
    };

    this.pedestals = [];
    this.state = 'closed';   // closed -> opening -> open
    this.timer = 0;
    this.time = 0;

    this._buildDais();
    this._buildHatch();
    this._buildPortalGlow();
    this._buildPedestals();
  }

  // ------------------------------------------------------------
  // PLATAFORMA
  // ------------------------------------------------------------
  _buildDais() {
    part(
      new THREE.CylinderGeometry(DAIS_RADIUS, DAIS_RADIUS + 0.15, DAIS_HEIGHT, 48),
      this.mats.stone, this.root, 0, DAIS_HEIGHT / 2, 0
    );

    // Anel decorativo ao redor da escotilha
    const ring = part(
      new THREE.TorusGeometry(HATCH_RADIUS + 0.12, 0.16, 10, 48),
      this.mats.stoneTrim, this.root, 0, DAIS_HEIGHT + 0.02, 0
    );
    ring.rotation.x = -Math.PI / 2;
    ring.userData.noCollision = true;
  }

  // ------------------------------------------------------------
  // ESCOTILHA (duas folhas semicirculares)
  // ------------------------------------------------------------
  _buildHatch() {
    const y = DAIS_HEIGHT + 0.07;
    this.leaves = [];

    // side = +1 => folha direita (dobradiça em +X)
    for (const side of [1, -1]) {
      const pivot = new THREE.Group();
      pivot.position.set(side * HATCH_RADIUS, y, 0);
      this.root.add(pivot);

      // Meio disco: theta 0..PI cobre x >= 0; PI..2PI cobre x <= 0
      const geo = new THREE.CylinderGeometry(
        HATCH_RADIUS, HATCH_RADIUS, 0.12, 40, 1, false,
        side > 0 ? 0 : Math.PI, Math.PI
      );
      geo.translate(-side * HATCH_RADIUS, 0, 0);

      part(geo, this.mats.wood, pivot);

      // Cintas de ferro
      for (const z of [-1.2, 0, 1.2]) {
        const halfChord = Math.sqrt(HATCH_RADIUS ** 2 - z ** 2);
        part(
          new THREE.BoxGeometry(halfChord - 0.1, 0.03, 0.16),
          this.mats.iron, pivot, -side * (halfChord / 2 + 0.05), 0.07, z
        );
      }

      // Argola de puxar
      const handle = part(
        new THREE.TorusGeometry(0.18, 0.035, 6, 16),
        this.mats.iron, pivot, -side * (HATCH_RADIUS - 0.45), 0.08, 0
      );
      handle.rotation.x = -Math.PI / 2;

      pivot.traverse(obj => { obj.userData.noCollision = true; });

      this.leaves.push({ pivot, side });
    }
  }

  // ------------------------------------------------------------
  // PORTAL (revelado após a abertura)
  // ------------------------------------------------------------
  _buildPortalGlow() {
    // Fundo escuro do poço
    const pit = part(
      new THREE.CircleGeometry(HATCH_RADIUS, 40),
      this.mats.pit, this.root, 0, DAIS_HEIGHT + 0.005, 0
    );
    pit.rotation.x = -Math.PI / 2;
    pit.userData.noCollision = true;

    // Vórtice luminoso (Lambert com emissive)
    this.swirlMat = new THREE.MeshLambertMaterial({
      color: 'black',
      emissive: COLORS.portal,
      emissiveMap: createSwirlTexture(),
      emissiveIntensity: 0
    });

    this.swirl = part(
      new THREE.CircleGeometry(HATCH_RADIUS - 0.05, 48),
      this.swirlMat, this.root, 0, DAIS_HEIGHT + 0.012, 0
    );
    this.swirl.rotation.x = -Math.PI / 2;
    this.swirl.castShadow = false;
    this.swirl.userData.noCollision = true;

    // Coluna de luz que sobe do portal
    this.beamMat = new THREE.MeshLambertMaterial({
      color: 'black',
      emissive: COLORS.portal,
      transparent: true,
      opacity: 0,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      side: THREE.DoubleSide
    });

    this.beam = part(
      new THREE.CylinderGeometry(HATCH_RADIUS * 0.85, HATCH_RADIUS - 0.1, 9, 40, 1, true),
      this.beamMat, this.root, 0, DAIS_HEIGHT + 4.5, 0
    );
    this.beam.castShadow = false;
    this.beam.receiveShadow = false;
    this.beam.visible = false;
    this.beam.userData.noCollision = true;
    this.beam.userData.noProjectileHit = true;

    this.portalLight = new THREE.PointLight(COLORS.portalLight, 0, 22, 1.6);
    this.portalLight.position.set(0, DAIS_HEIGHT + 1.2, 0);
    this.root.add(this.portalLight);
  }

  // ------------------------------------------------------------
  // PEDESTAIS
  // ------------------------------------------------------------
  _buildPedestals() {
    for (let i = 0; i < TOTAL_KEYS; i++) {
      const angle = Math.PI / 4 + i * (Math.PI / 2);

      const group = new THREE.Group();
      group.name = `Pedestal ${i + 1}`;
      group.position.set(
        Math.cos(angle) * PEDESTAL_DISTANCE,
        DAIS_HEIGHT,
        Math.sin(angle) * PEDESTAL_DISTANCE
      );
      group.rotation.y = -angle;
      this.root.add(group);

      // Base em degraus
      part(new THREE.BoxGeometry(1.15, 0.22, 1.15), this.mats.stoneDark, group, 0, 0.11, 0);
      part(new THREE.BoxGeometry(0.9, 0.16, 0.9), this.mats.stone, group, 0, 0.30, 0);

      // Fuste octogonal
      const shaftHeight = PEDESTAL_HEIGHT - 0.38 - 0.28;
      part(
        new THREE.CylinderGeometry(0.28, 0.34, shaftHeight, 8),
        this.mats.stone, group, 0, 0.38 + shaftHeight / 2, 0
      );

      // Capitel
      part(new THREE.BoxGeometry(0.8, 0.14, 0.8), this.mats.stoneTrim, group, 0, PEDESTAL_HEIGHT - 0.21, 0);
      part(new THREE.CylinderGeometry(0.34, 0.28, 0.14, 8), this.mats.stone, group, 0, PEDESTAL_HEIGHT - 0.07, 0);

      // Suporte em anel onde a chave repousa
      const cradle = part(
        new THREE.TorusGeometry(0.2, 0.05, 8, 20),
        this.mats.iron, group, 0, PEDESTAL_HEIGHT + 0.02, 0
      );
      cradle.rotation.x = -Math.PI / 2;
      cradle.userData.noCollision = true;

      // Luz da chave (criada desde o início com intensidade 0
      // para não recompilar shaders quando acender)
      const keyHeight = PEDESTAL_HEIGHT + 0.3;
      const light = new THREE.PointLight(KEY_COLORS.light, 0, 9, 1.5);
      light.position.set(0, keyHeight + 0.2, 0);
      group.add(light);

      this.pedestals.push({ group, light, keyHeight, orb: null, t: 0 });
    }
  }

  // ------------------------------------------------------------
  // LÓGICA
  // ------------------------------------------------------------
  get placedCount() {
    return this.pedestals.filter(p => p.orb).length;
  }

  _placeKey(pedestal) {
    const orb = createKeyOrb();
    orb.position.set(0, pedestal.keyHeight + 1.2, 0);
    pedestal.group.add(orb);

    pedestal.orb = orb;
    pedestal.t = 0;

    const count = this.placedCount;
    showMessage(count < TOTAL_KEYS
      ? `Chave posicionada (${count}/${TOTAL_KEYS})`
      : 'Todas as chaves posicionadas!');

    if (count === TOTAL_KEYS) {
      this.state = 'waiting';
      this.timer = 0;
    }
  }

  update(delta, playerPosition) {
    this.time += delta;

    const tmp = new THREE.Vector3();

    for (const pedestal of this.pedestals) {
      // Posiciona chave quando o jogador se aproxima
      if (!pedestal.orb) {
        pedestal.group.getWorldPosition(tmp);
        const dist = Math.hypot(playerPosition.x - tmp.x, playerPosition.z - tmp.z);

        if (dist <= PLACE_DISTANCE &&
            Math.abs(playerPosition.y - tmp.y) < 4 &&
            this.keySystem.takeKey()) {
          this._placeKey(pedestal);
        }
        continue;
      }

      // Animação: chave desce até o suporte e a luz acende
      pedestal.t = Math.min(pedestal.t + delta / KEY_DROP_TIME, 1);
      const k = THREE.MathUtils.smoothstep(pedestal.t, 0, 1);

      const bob = Math.sin(this.time * 2 + pedestal.group.id) * 0.04;
      pedestal.orb.position.y = pedestal.keyHeight + (1 - k) * 1.2 + bob * k;
      pedestal.light.intensity = PEDESTAL_LIGHT_INTENSITY * k * (0.92 + 0.08 * Math.sin(this.time * 6));
    }

    this._updateHatch(delta);
  }

  _updateHatch(delta) {
    if (this.state === 'closed') return;

    this.timer += delta;

    if (this.state === 'waiting' && this.timer >= OPEN_DELAY) {
      this.state = 'opening';
      this.timer = 0;
      this.beam.visible = true;
      showMessage('O portal foi aberto!', 2.5);
    }

    if (this.state === 'opening' || this.state === 'open') {
      const k = THREE.MathUtils.smootherstep(Math.min(this.timer / OPEN_DURATION, 1), 0, 1);

      // Folhas giram nas dobradiças até ficarem em pé
      for (const leaf of this.leaves) {
        leaf.pivot.rotation.z = -leaf.side * OPEN_ANGLE * k;
        // pequeno tremor no início da abertura
        leaf.pivot.position.y = DAIS_HEIGHT + 0.07 + (k > 0 && k < 0.15 ? Math.sin(this.timer * 60) * 0.01 : 0);
      }

      const pulse = 0.85 + 0.15 * Math.sin(this.time * 3);

      this.swirlMat.emissiveIntensity = 1.6 * k * pulse;
      this.swirl.rotation.z -= delta * 0.8;

      this.beamMat.opacity = 0.14 * k * pulse;
      this.portalLight.intensity = PORTAL_LIGHT_INTENSITY * k * pulse;

      if (this.state === 'opening' && this.timer >= OPEN_DURATION) {
        this.state = 'open';
        if (typeof this.onOpen === 'function') this.onOpen();
      }
    }
  }
}
