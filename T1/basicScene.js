import * as THREE from 'three';

import {
    setupCamera,
    updateCamera, setShootHandler, isOrbitCameraMode,
    getIsOrbitMode
} from './camera.js';

import {
  initRenderer,
  initDefaultBasicLight,
  onWindowResize
} from '../libs/util/util.js';

import {
  createCastle
} from './castle.js';

import {
  updateDoors,
  toggleDoorByObject
} from './doors.js';
import { WeaponSystem } from './weapon.js';

import KeyboardState
  from '../../libs/util/KeyboardState.js';;


let scene, renderer, camera, pointerLockControls, orbitControls, cameraHolder, castle;
let weaponSystem;
const keyboard = new KeyboardState();
const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();
const clock = new THREE.Clock();

init();
render();


function init() {

  scene =
    new THREE.Scene();


  scene.background =
    new THREE.Color(
      'rgb(150, 182, 204)'
    );


  renderer =
    initRenderer(
      'rgb(150, 182, 204)'
    );


  renderer.shadowMap.enabled =
    true;


  initDefaultBasicLight(
    scene
  );


  // Cria o castelo.
  // castle.root será utilizado também
  // pelo sistema de colisão.
  castle =
    createCastle(
      scene
    );


  camera =
    setupCamera(
      renderer,
      scene
    );


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
  window.addEventListener(
    'resize',
    () => {

      if (camera) {

        camera.aspect =
          window.innerWidth /
          window.innerHeight;


        camera.updateProjectionMatrix();
      }


      renderer.setSize(
        window.innerWidth,
        window.innerHeight
      );
    }
  );


  renderer.domElement.addEventListener(
    'pointerdown',
    onPointerDown
  );

  renderer.domElement.addEventListener(
    'contextmenu',
    (event) => event.preventDefault()
  );
}


// ================================================================
// CLIQUE NAS PORTAS
// ================================================================

function onPointerDown(event) {
    if (!getIsOrbitMode()) return;
    if (event.button !== 0) return;

    const rect = renderer.domElement.getBoundingClientRect();

    mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

    raycaster.setFromCamera(mouse, camera);

    const clickable = castle.doors.map(door => door.panel);
    const hits = raycaster.intersectObjects(clickable, true);

    if (hits.length > 0) {
        toggleDoorByObject(castle.doors, hits[0].object);
    }
}


// ================================================================
// LOOP PRINCIPAL
// ================================================================

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