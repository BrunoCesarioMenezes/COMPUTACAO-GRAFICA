import * as THREE from 'three';
import { showMessage } from './hud.js';

// ================================================================
// CHAVES DO PORTAL
//
// - Cada chave é uma esfera com MeshPhongMaterial e emissive.
// - Chaves soltas pelos inimigos ficam flutuando e são coletadas
//   quando o jogador chega suficientemente perto.
// - O HUD mostra quantas chaves o jogador carrega e quantas já
//   foram colocadas nos pedestais.
// - Tecla 'K': atribui todas as chaves ao jogador. Pressionando
//   'K' novamente, volta à quantidade que ele possuía antes.
//
// Integração:
//   keySystem.dropKey(position)   -> inimigo eliminado
//   keySystem.takeKey()           -> portal consome uma chave
//   keySystem.update(dt, player)  -> a cada frame
// ================================================================

export const TOTAL_KEYS = 4;

const KEY_RADIUS = 0.28;
const PICKUP_DISTANCE = 1.9;   // distância horizontal p/ coletar
const PICKUP_HEIGHT = 3.0;     // diferença vertical máxima
const PICKUP_ANIM_TIME = 0.3;

export const KEY_COLORS = {
  color: 'rgb(255, 214, 90)',
  emissive: 'rgb(255, 170, 20)',
  light: 'rgb(255, 190, 80)'
};

// Textura radial usada no halo de brilho das chaves
let glowTexture = null;

function getGlowTexture() {
  if (glowTexture) return glowTexture;

  const size = 128;
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = size;

  const ctx = canvas.getContext('2d');
  const g = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
  g.addColorStop(0.0, 'rgba(255, 230, 150, 1)');
  g.addColorStop(0.25, 'rgba(255, 190, 60, 0.6)');
  g.addColorStop(1.0, 'rgba(255, 150, 0, 0)');

  ctx.fillStyle = g;
  ctx.fillRect(0, 0, size, size);

  glowTexture = new THREE.CanvasTexture(canvas);
  glowTexture.colorSpace = THREE.SRGBColorSpace;
  return glowTexture;
}


// ================================================================
// MODELO DA CHAVE (esfera emissiva + halo)
// Também usado pelo portal ao posicionar a chave no pedestal.
// ================================================================

export function createKeyOrb() {
  const orb = new THREE.Group();
  orb.name = 'Chave';

  const sphere = new THREE.Mesh(
    new THREE.SphereGeometry(KEY_RADIUS, 32, 24),
    new THREE.MeshPhongMaterial({
      color: KEY_COLORS.color,
      emissive: KEY_COLORS.emissive,
      emissiveIntensity: 1.1,
      specular: 'rgb(255, 255, 255)',
      shininess: 90
    })
  );
  sphere.castShadow = false;
  orb.add(sphere);

  const halo = new THREE.Sprite(new THREE.SpriteMaterial({
    map: getGlowTexture(),
    blending: THREE.AdditiveBlending,
    depthWrite: false,
    transparent: true
  }));
  halo.scale.setScalar(KEY_RADIUS * 6);
  orb.add(halo);

  orb.traverse(obj => {
    obj.userData.noProjectileHit = true;
    obj.userData.noCollision = true;
  });

  return orb;
}


// ================================================================
// SISTEMA DE CHAVES
// ================================================================

export class KeySystem {
  constructor(scene) {
    this.scene = scene;

    this.groundKeys = [];   // chaves soltas no cenário
    this.collecting = [];   // chaves em animação de coleta

    this.realCarried = 0;   // chaves de fato coletadas
    this.placed = 0;        // chaves já colocadas nos pedestais
    this.cheatActive = false;

    this.time = 0;

    this._buildHud();
    this._updateHud();

    window.addEventListener('keydown', event => {
      if (event.code === 'KeyK' && !event.repeat) this.toggleAllKeys();
    });
  }

  // Quantidade de chaves que o jogador tem em mãos
  get carried() {
    if (this.cheatActive) return TOTAL_KEYS - this.placed;
    return Math.min(this.realCarried, TOTAL_KEYS - this.placed);
  }

  // ------------------------------------------------------------
  // CHAVES NO CENÁRIO
  // ------------------------------------------------------------
  dropKey(position) {
    const orb = createKeyOrb();
    orb.position.copy(position);
    this.scene.add(orb);

    this.groundKeys.push({ orb, baseY: position.y, phase: Math.random() * Math.PI * 2 });
  }

  // Consome uma chave (usado pelo portal). Retorna true se havia chave.
  takeKey() {
    if (this.carried <= 0) return false;

    if (!this.cheatActive) this.realCarried--;
    this.placed++;

    this._updateHud();
    return true;
  }

  toggleAllKeys() {
    this.cheatActive = !this.cheatActive;

    if (this.cheatActive) {
      showMessage('Todas as chaves atribuídas (K)');
    } else {
      this.realCarried = Math.min(this.realCarried, TOTAL_KEYS - this.placed);
      showMessage('Chaves restauradas (K)');
    }

    this._updateHud();
  }

  // ------------------------------------------------------------
  // ATUALIZAÇÃO
  // ------------------------------------------------------------
  update(delta, playerPosition) {
    this.time += delta;

    for (let i = this.groundKeys.length - 1; i >= 0; i--) {
      const key = this.groundKeys[i];

      // Flutuação suave
      key.orb.position.y = key.baseY + Math.sin(this.time * 2.2 + key.phase) * 0.15;

      const dx = playerPosition.x - key.orb.position.x;
      const dz = playerPosition.z - key.orb.position.z;
      const dy = Math.abs(playerPosition.y - key.orb.position.y);

      if (Math.hypot(dx, dz) <= PICKUP_DISTANCE && dy <= PICKUP_HEIGHT) {
        this.groundKeys.splice(i, 1);
        this.collecting.push({ orb: key.orb, t: 0, start: key.orb.position.clone() });

        this.realCarried++;
        this._updateHud();
        showMessage('Chave coletada!');
      }
    }

    // Animação de coleta: a chave voa até o jogador e encolhe
    for (let i = this.collecting.length - 1; i >= 0; i--) {
      const c = this.collecting[i];
      c.t += delta / PICKUP_ANIM_TIME;

      const k = Math.min(c.t, 1);
      const target = playerPosition.clone();
      target.y -= 0.6;

      c.orb.position.lerpVectors(c.start, target, k);
      c.orb.scale.setScalar(1 - k * 0.9);

      if (c.t >= 1) {
        this.scene.remove(c.orb);
        this.collecting.splice(i, 1);
      }
    }
  }

  // ------------------------------------------------------------
  // HUD
  // ------------------------------------------------------------
  _buildHud() {
    this.hud = document.createElement('div');

    Object.assign(this.hud.style, {
      position: 'fixed',
      top: '20px',
      left: '20px',
      padding: '10px 14px',
      background: 'rgba(15, 15, 18, 0.82)',
      color: '#fff',
      fontFamily: 'Arial, sans-serif',
      fontSize: '13px',
      borderRadius: '8px',
      border: '1px solid rgba(255,255,255,0.15)',
      zIndex: '1000',
      userSelect: 'none',
      pointerEvents: 'none'
    });

    this.hud.innerHTML = `
      <div style="font-weight:bold;letter-spacing:1px;margin-bottom:8px">CHAVES</div>
      <div class="key-icons" style="display:flex;gap:8px"></div>
      <div class="key-status" style="margin-top:8px;font-size:12px;opacity:0.8"></div>
    `;

    this.icons = [];
    const iconRow = this.hud.querySelector('.key-icons');

    for (let i = 0; i < TOTAL_KEYS; i++) {
      const icon = document.createElement('div');
      Object.assign(icon.style, {
        width: '18px',
        height: '18px',
        borderRadius: '50%',
        transition: 'all 0.2s'
      });
      iconRow.appendChild(icon);
      this.icons.push(icon);
    }

    this.statusLine = this.hud.querySelector('.key-status');
    document.body.appendChild(this.hud);
  }

  _updateHud() {
    const carried = this.carried;

    this.icons.forEach((icon, i) => {
      const filled = i < carried;

      Object.assign(icon.style, filled
        ? {
          background: 'radial-gradient(circle at 35% 35%, #fff6c8, #ffc83a 45%, #c77a00)',
          border: '1px solid #ffd76a',
          boxShadow: '0 0 8px 2px rgba(255, 190, 60, 0.75)'
        }
        : {
          background: 'rgba(255,255,255,0.06)',
          border: '1px dashed rgba(255,255,255,0.35)',
          boxShadow: 'none'
        });
    });

    this.statusLine.textContent =
      `Pedestais: ${this.placed}/${TOTAL_KEYS}` + (this.cheatActive ? '  ·  modo K' : '');
  }
}
