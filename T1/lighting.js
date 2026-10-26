import * as THREE from 'three';

// ================================================================
// SISTEMA DE ILUMINAÇÃO - DIA (10h) E NOITE (18h)
//
// - Uma luz direcional principal (Sol ou Lua) que projeta sombra
//   em todo o ambiente.
// - Uma luz direcional de preenchimento, na direção oposta,
//   sem sombra.
// - Uma luz hemisférica (ambiente) para suavizar as áreas escuras.
//
// Tecla 'H' alterna entre os dois horários.
// Outros módulos podem reagir à troca via onChange(callback).
// ================================================================

// Área coberta pela sombra (castelo + entorno)
const SHADOW_HALF_SIZE = 95;
const SHADOW_MAP_SIZE = 4096;
const LIGHT_DISTANCE = 160;

const PRESETS = {
  day: {
    label: '10:00',
    background: 'rgb(150, 190, 225)',
    fog: { color: 'rgb(170, 200, 225)', near: 140, far: 380 },

    // Sol às 10h: vem do leste (+X), um pouco à frente (-Z),
    // bem alto no céu => sombras curtas.
    main: {
      color: 'rgb(255, 244, 222)',
      intensity: 2.6,
      direction: new THREE.Vector3(0.55, 1.0, -0.45)
    },
    fill: {
      color: 'rgb(190, 210, 255)',
      intensity: 0.45
    },
    hemi: {
      sky: 'rgb(200, 225, 255)',
      ground: 'rgb(95, 90, 70)',
      intensity: 1.15
    }
  },

  night: {
    label: '18:00',
    background: 'rgb(14, 20, 40)',
    fog: { color: 'rgb(14, 20, 40)', near: 45, far: 210 },

    // Lua: luz fria e fraca, vinda do lado oposto, ainda alta
    // para não alongar demais as sombras.
    main: {
      color: 'rgb(160, 185, 255)',
      intensity: 1.1,
      direction: new THREE.Vector3(-0.5, 1.0, -0.35)
    },
    fill: {
      color: 'rgb(90, 100, 160)',
      intensity: 0.3
    },
    hemi: {
      sky: 'rgb(80, 100, 170)',
      ground: 'rgb(25, 25, 40)',
      intensity: 0.8
    }
  }
};

export class LightingSystem {
  constructor(scene, renderer, { startAtNight = false } = {}) {
    this.scene = scene;
    this.renderer = renderer;
    this.isNight = startAtNight;
    this.listeners = [];

    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFShadowMap;

    this._buildLights();
    this._buildClockLabel();
    this.apply();

    window.addEventListener('keydown', event => {
      if (event.code === 'KeyH' && !event.repeat) this.toggle();
    });
  }

  // ------------------------------------------------------------
  // LUZES
  // ------------------------------------------------------------
  _buildLights() {
    // Luz principal (Sol / Lua) - única que projeta sombra
    this.mainLight = new THREE.DirectionalLight('white', 1);
    this.mainLight.name = 'Luz principal';
    this.mainLight.castShadow = true;

    const shadow = this.mainLight.shadow;
    shadow.mapSize.set(SHADOW_MAP_SIZE, SHADOW_MAP_SIZE);
    shadow.camera.left = -SHADOW_HALF_SIZE;
    shadow.camera.right = SHADOW_HALF_SIZE;
    shadow.camera.top = SHADOW_HALF_SIZE;
    shadow.camera.bottom = -SHADOW_HALF_SIZE;
    shadow.camera.near = 1;
    shadow.camera.far = LIGHT_DISTANCE * 2;
    shadow.bias = -0.0004;
    shadow.normalBias = 0.05;
    shadow.radius = 2;

    // Luz de preenchimento - direção oposta, sem sombra
    this.fillLight = new THREE.DirectionalLight('white', 1);
    this.fillLight.name = 'Luz de preenchimento';
    this.fillLight.castShadow = false;

    // Luz ambiente
    this.hemiLight = new THREE.HemisphereLight('white', 'black', 1);
    this.hemiLight.name = 'Luz ambiente';

    // As três luzes miram o centro do castelo
    this.mainLight.target.position.set(0, 0, 0);
    this.fillLight.target.position.set(0, 0, 0);

    this.scene.add(
      this.mainLight, this.mainLight.target,
      this.fillLight, this.fillLight.target,
      this.hemiLight
    );
  }

  // Pequeno indicador do horário atual na tela
  _buildClockLabel() {
    this.clockLabel = document.createElement('div');

    Object.assign(this.clockLabel.style, {
      position: 'fixed',
      top: '20px',
      right: '20px',
      padding: '8px 14px',
      background: 'rgba(15, 15, 18, 0.82)',
      color: '#fff',
      fontFamily: 'Arial, sans-serif',
      fontSize: '14px',
      borderRadius: '8px',
      border: '1px solid rgba(255,255,255,0.15)',
      zIndex: '1000',
      userSelect: 'none',
      pointerEvents: 'none'
    });

    document.body.appendChild(this.clockLabel);
  }

  // ------------------------------------------------------------
  // APLICA O HORÁRIO ATUAL
  // ------------------------------------------------------------
  apply() {
    const p = this.isNight ? PRESETS.night : PRESETS.day;

    const dir = p.main.direction.clone().normalize();

    this.mainLight.color.set(p.main.color);
    this.mainLight.intensity = p.main.intensity;
    this.mainLight.position.copy(dir).multiplyScalar(LIGHT_DISTANCE);

    this.fillLight.color.set(p.fill.color);
    this.fillLight.intensity = p.fill.intensity;
    this.fillLight.position.set(-dir.x, dir.y * 0.6, -dir.z).multiplyScalar(LIGHT_DISTANCE);

    this.hemiLight.color.set(p.hemi.sky);
    this.hemiLight.groundColor.set(p.hemi.ground);
    this.hemiLight.intensity = p.hemi.intensity;

    this.scene.background = new THREE.Color(p.background);
    this.renderer.setClearColor(this.scene.background);
    this.scene.fog = new THREE.Fog(p.fog.color, p.fog.near, p.fog.far);

    this.clockLabel.innerHTML =
      `${this.isNight ? '🌙' : '☀️'} <b>${p.label}</b>`;

    this.listeners.forEach(fn => fn(this.isNight));
  }

  toggle() {
    this.setNight(!this.isNight);
  }

  setNight(value) {
    this.isNight = value;
    this.apply();
  }

  // Registra uma função chamada sempre que o horário muda
  onChange(fn) {
    this.listeners.push(fn);
    fn(this.isNight);
  }
}
