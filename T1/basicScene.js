import * as THREE from 'three';

import {
  setupCamera,
  updateCamera
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

import KeyboardState
  from '../../libs/util/KeyboardState.js';


let scene;
let renderer;
let camera;

let pointerLockControls;
let orbitControls;
let cameraHolder;

let castle;


const keyboard =
  new KeyboardState();


const raycaster =
  new THREE.Raycaster();


const mouse =
  new THREE.Vector2();


const clock =
  new THREE.Clock();


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
  // Somente botão direito interage com as portas
  if (event.button !== 2) return;

  mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
  mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

  raycaster.setFromCamera(mouse,camera);

  const clickable = castle.doors.map(
    door => door.panel
  );

  const hits = raycaster.intersectObjects(
    clickable,
    true
  );

  if (hits.length > 0) {
    toggleDoorByObject(
      castle.doors,
      hits[0].object
    );
  }
}


// ================================================================
// LOOP PRINCIPAL
// ================================================================

function render() {

  requestAnimationFrame(render);


  const delta =
    clock.getDelta();

  updateCamera(delta, castle.root);
  updateDoors(castle.doors);


  renderer.render(scene,camera);
}