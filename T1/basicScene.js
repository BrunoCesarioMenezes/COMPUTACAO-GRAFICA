import * as THREE from 'three';
//import { OrbitControls } from '../build/jsm/orbitControls/OrbitControls.js';
import {startOrbitControls, switchCameraMode, initCamera, updateCameraView} from './camera.js';
import { initRenderer, initDefaultBasicLight, onWindowResize } from '../libs/util/util.js';
import { createCastle } from './castle.js';
import { updateDoors, toggleDoorByObject } from './doors.js';
import KeyboardState from '../../libs/util/KeyboardState.js'
import { PointerLockControls } from '../build/jsm/controls/PointerLockControls.js';

let scene, renderer, camera, pointerLockControls, orbitControls, cameraHolder, castle;
const keyboard = new KeyboardState();
const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();

init();
render();

function init() {
  scene = new THREE.Scene();
  scene.background = new THREE.Color('rgb(150, 182, 204)');

  renderer = initRenderer('rgb(150, 182, 204)');
  renderer.shadowMap.enabled = true;

  // Iluminação conforme utilitário utilizado nas aulas.
  initDefaultBasicLight(scene);

  castle = createCastle(scene);

  let cameraData = initCamera(scene);
  camera = cameraData.camera;
  cameraHolder = cameraData.cameraHolder;

  scene.add(camera);

  // OrbitControls existe apenas para inspecionar a modelagem.
  // Não há mecânica de player, tiros ou sistema de colisão nesta versão.
  orbitControls = startOrbitControls(camera, renderer);
  pointerLockControls = new PointerLockControls(camera, renderer.domElement);
  scene.add(pointerLockControls);

  window.addEventListener('click', () => {
      pointerLockControls.lock();
  });


  window.addEventListener('resize', () => onWindowResize(camera, renderer));
  renderer.domElement.addEventListener('pointerdown', onPointerDown);
}

function onPointerDown(event) {
  mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
  mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

  raycaster.setFromCamera(mouse, camera);
  const clickable = castle.doors.map(d => d.panel);
  const hits = raycaster.intersectObjects(clickable, true);

  if (hits.length > 0) {
    toggleDoorByObject(castle.doors, hits[0].object);
  }
}

function keyboardUpdate() {
  keyboard.update();
  if (keyboard.pressed('C')) switchCameraMode(camera, orbitControls);

  // if (keyboard.pressed("down"))    updateCameraView(camera,"z", "position",0.1);
  // if (keyboard.pressed("up"))  updateCameraView(camera,"z", "position",-0.1);
  // if (keyboard.pressed("left"))  updateCameraView(camera,"x", "position",-0.1);
  // if (keyboard.pressed("right")) updateCameraView(camera,"x", "position",0.1);
  // if (keyboard.pressed("pageup"))   updateCameraView(camera,"y", "position",0.1);
  // if (keyboard.pressed("pagedown")) updateCameraView(camera,"y", "position",-0.1);

  // if (keyboard.pressed("S"))    updateCameraView(camera,"z", "position",0.1);
  // if (keyboard.pressed("W"))  updateCameraView(camera,"z", "position",-0.1);
  // if (keyboard.pressed("A"))  updateCameraView(camera,"x", "position",-0.1);
  // if (keyboard.pressed("D")) updateCameraView(camera,"x", "position",0.1);
  // if (keyboard.pressed("Q"))   updateCameraView(camera,"y", "position",0.1);
  // if (keyboard.pressed("E")) updateCameraView(camera,"y", "position",-0.1);

  // // Movimento do Alvo da Câmera (camLook)
  // if (keyboard.pressed("S")) updateCameraView(camera,"z", "lookAt",0.1);
  // if (keyboard.pressed("W")) updateCameraView(camera,"z", "lookAt",-0.1);
  // if (keyboard.pressed("A")) updateCameraView(camera,"x", "lookAt",-0.1);
  // if (keyboard.pressed("D")) updateCameraView(camera,"x", "lookAt",0.1);
  // if (keyboard.pressed("Q")) updateCameraView(camera,"y", "lookAt",0.1);
  // if (keyboard.pressed("E")) updateCameraView(camera,"y", "lookAt",-0.1);

  // if(keyboard.pressed("1")) console.log(camera)

  const moveKeys = { forward: false, backward: false, left: false, right: false };


  if(pointerLockControls.isLocked) {
    window.addEventListener('keydown', (event) => {
        switch (event.code) {
            case 'KeyW': case 'ArrowUp':    moveKeys.forward = true; break;
            case 'KeyS': case 'ArrowDown':  moveKeys.backward = true; break;
            case 'KeyA': case 'ArrowLeft':  moveKeys.left = true; break;
            case 'KeyD': case 'ArrowRight': moveKeys.right = true; break;
        }
    });

    window.addEventListener('keyup', (event) => {
        switch (event.code) {
            case 'KeyW': case 'ArrowUp':    moveKeys.forward = false; break;
            case 'KeyS': case 'ArrowDown':  moveKeys.backward = false; break;
            case 'KeyA': case 'ArrowLeft':  moveKeys.left = false; break;
            case 'KeyD': case 'ArrowRight': moveKeys.right = false; break;
        }
    });
  }
}

function render() {
  requestAnimationFrame(render);
  orbitControls.update();
  keyboardUpdate();
  updateDoors(castle.doors, camera.position);
  renderer.render(scene, camera);
}
