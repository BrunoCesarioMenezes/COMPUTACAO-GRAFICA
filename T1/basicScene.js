import * as THREE from 'three';
import { setupCamera, updateCamera, setShootHandler, isOrbitCameraMode } from './camera.js';
import { initRenderer, initDefaultBasicLight, onWindowResize } from '../libs/util/util.js';
import { createCastle } from './castle.js';
import { updateDoors, toggleDoorByObject } from './doors.js';
import { WeaponSystem } from './weapon.js';
import KeyboardState from '../../libs/util/KeyboardState.js';

let scene, renderer, camera, pointerLockControls, orbitControls, cameraHolder, castle;
let weaponSystem;
const keyboard = new KeyboardState();
const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();
const clock = new THREE.Clock();

init();
render();

function init() {
  scene = new THREE.Scene();
  scene.background = new THREE.Color('rgb(150, 182, 204)');

  renderer = initRenderer('rgb(150, 182, 204)');
  renderer.shadowMap.enabled = true;

  initDefaultBasicLight(scene);

  castle = createCastle(scene);

  camera = setupCamera(renderer, scene);

// ✅ Necessário para que a arma (filha da câmera) seja renderizada
  scene.add(camera);
  

  // ------------------------------------------------------------
  // SISTEMA DE ARMA
  // ------------------------------------------------------------
  weaponSystem = new WeaponSystem(camera, scene);

  // Registra o handler de disparo disparado pelo mouse em camera.js
  setShootHandler(() => {
    if (!isOrbitCameraMode()) {
      weaponSystem.shoot();
    }
  });

  window.addEventListener('resize', () => {
    if (camera) {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
    }
    renderer.setSize(window.innerWidth, window.innerHeight);
  });

  renderer.domElement.addEventListener('pointerdown', onPointerDown);
}

function onPointerDown(event) {
  // Portas só respondem ao botão direito (2)
  if (event.button !== 2) return;

  mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
  mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

  raycaster.setFromCamera(mouse, camera);
  const clickable = castle.doors.map(d => d.panel);
  const hits = raycaster.intersectObjects(clickable, true);

  if (hits.length > 0) {
    toggleDoorByObject(castle.doors, hits[0].object);
  }
}

function render() {
  requestAnimationFrame(render);
  const delta = clock.getDelta();

  updateCamera(delta);

  // Atualiza arma/projéteis
  if (weaponSystem) {
    weaponSystem.update(delta);
    // Esconde a arma no modo órbita
    weaponSystem.setVisible(!isOrbitCameraMode());
  }

  updateDoors(castle.doors, camera.position);
  renderer.render(scene, camera);
}