import * as THREE from 'three';
import { OrbitControls } from '../build/jsm/controls/OrbitControls.js';
import { initRenderer, initDefaultBasicLight, onWindowResize } from '../libs/util/util.js';
import { createCastle } from './castle.js';
import { updateDoors, toggleDoorByObject } from './doors.js';

let scene, renderer, camera, controls, castle;
const clock = new THREE.Clock();
const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();

init();
render();

function init() {
  scene = new THREE.Scene();
  scene.background = new THREE.Color('rgb(150, 182, 204)');

  renderer = initRenderer('rgb(150, 182, 204)');
  renderer.shadowMap.enabled = true;

  camera = new THREE.PerspectiveCamera(
    60,
    window.innerWidth / window.innerHeight,
    0.1,
    500
  );
  camera.position.set(68, 42, 76);
  scene.add(camera);

  // Iluminação conforme utilitário utilizado nas aulas.
  initDefaultBasicLight(scene);

  castle = createCastle(scene);

  // OrbitControls existe apenas para inspecionar a modelagem.
  // Não há mecânica de player, tiros ou sistema de colisão nesta versão.
  controls = new OrbitControls(camera, renderer.domElement);
  controls.target.set(0, 8, 0);
  controls.enableDamping = true;
  controls.dampingFactor = 0.08;
  controls.minDistance = 5;
  controls.maxDistance = 155;
  controls.maxPolarAngle = Math.PI * 0.49;

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

function render() {
  requestAnimationFrame(render);
  const dt = Math.min(clock.getDelta(), 0.05);

  controls.update();
  updateDoors(castle.doors, camera.position, dt);
  renderer.render(scene, camera);
}
