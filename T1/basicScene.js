import * as THREE from 'three';
import { setupCamera, updateCamera, setShootHandler, getIsOrbitMode } from './camera.js';
import { initRenderer, initDefaultBasicLight } from '../libs/util/util.js';
import { createCastle } from './castle.js';
import { updateDoors, toggleDoorByObject } from './doors.js';
import { WeaponSystem } from './weapon.js';

let scene, renderer, camera, castle, weaponSystem;

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

    scene.add(camera);

    weaponSystem = new WeaponSystem(camera, scene);

    setShootHandler(() => {
        if (!getIsOrbitMode()) weaponSystem.shoot();
    });

    renderer.domElement.addEventListener('pointerdown', onPointerDown);
    renderer.domElement.addEventListener('contextmenu', event => event.preventDefault());

    window.addEventListener('resize', () => {
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(window.innerWidth, window.innerHeight);
    });
}

function onPointerDown(event) {
    if (!getIsOrbitMode() || event.button !== 0) return;

    const rect = renderer.domElement.getBoundingClientRect();

    mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

    raycaster.setFromCamera(mouse, camera);

    const clickable = castle.doors.map(door => door.panel);
    const hits = raycaster.intersectObjects(clickable, true);

    if (hits.length > 0) toggleDoorByObject(castle.doors, hits[0].object);
}

function render() {
    requestAnimationFrame(render);

    const delta = clock.getDelta();

    updateCamera(delta, castle.root);
    updateDoors(castle.doors, camera, getIsOrbitMode());

    if (weaponSystem) {
        weaponSystem.update(delta);
        weaponSystem.setVisible(!getIsOrbitMode());
    }

    renderer.render(scene, camera);
}