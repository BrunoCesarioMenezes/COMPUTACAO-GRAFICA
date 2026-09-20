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
    createControlsMenu();
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

function createControlsMenu() {
    const menu = document.createElement('div');

    menu.innerHTML = `
        <div class="controls-title">CONTROLES</div>
        <div class="control-row"><span><b>W A S D</b></span><span>Movimentar</span></div>
        <div class="control-row"><span><b>Mouse</b></span><span>Olhar</span></div>
        <div class="control-row"><span><b>C</b></span><span>Trocar câmera</span></div>
        <div class="control-row"><span><b>Clique Esquerdo</b></span><span>Atirar</span></div>
        <div class="control-row"><span><b>Clique Esquerdo</b></span><span>Portas (orbital)</span></div>
    `;

    Object.assign(menu.style, {
        position: 'fixed',
        right: '20px',
        bottom: '20px',
        width: '220px',
        padding: '14px 16px',
        background: 'rgba(15, 15, 18, 0.82)',
        color: '#fff',
        fontFamily: 'Arial, sans-serif',
        fontSize: '13px',
        borderRadius: '8px',
        border: '1px solid rgba(255,255,255,0.15)',
        backdropFilter: 'blur(5px)',
        zIndex: '1000',
        userSelect: 'none',
        pointerEvents: 'none'
    });

    document.body.appendChild(menu);

    const title = menu.querySelector('.controls-title');
    Object.assign(title.style, {
        fontSize: '13px',
        fontWeight: 'bold',
        marginBottom: '10px',
        letterSpacing: '1px',
        borderBottom: '1px solid rgba(255,255,255,0.2)',
        paddingBottom: '7px'
    });

    menu.querySelectorAll('.control-row').forEach(row => {
        Object.assign(row.style, {
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginTop: '7px',
            gap: '15px'
        });

        const key = row.querySelector('b');

        Object.assign(key.style, {
            display: 'inline-block',
            padding: '3px 6px',
            background: 'rgba(255,255,255,0.12)',
            border: '1px solid rgba(255,255,255,0.2)',
            borderRadius: '4px',
            fontSize: '11px'
        });
    });
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