import * as THREE from 'three';
import { PointerLockControls } from '../build/jsm/controls/PointerLockControls.js';
import { OrbitControls } from '../build/jsm/controls/OrbitControls.js';
import { resolveCollisions } from './collision.js';

export let camera;
let pointerControls, orbitControls;
let isOrbitMode = false;
let crosshairElement;

// Mapeamento de movimentação: WASD e Setas Direcionais
const moveState = {
    forward: false,
    backward: false,
    left: false,
    right: false
};

// Armazenamento do estado da câmera em 1ª pessoa
const savedPosition = new THREE.Vector3();
const savedQuaternion = new THREE.Quaternion();

const MOVE_SPEED = 10.0;

export function setupCamera(renderer, scene) {
    camera = new THREE.PerspectiveCamera(
        75,
        window.innerWidth / window.innerHeight,
        0.1,
        1000
    );
    camera.position.set(0, 1.6, 0); // Posição inicial em altura dos olhos

    pointerControls = new PointerLockControls(camera, renderer.domElement);
    orbitControls = new OrbitControls(camera, renderer.domElement);
    orbitControls.enabled = false;

    camera.lookAt(0, 1.6, -1); // Olhando para frente na altura dos olhos

    
    // Ativa PointerLock ao clicar no canvas
    renderer.domElement.addEventListener('click', () => {
        if (!isOrbitMode && !pointerControls.isLocked) {
            pointerControls.lock();
        }
    });

    createCrosshair();

    // Eventos de teclado e mouse
    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);
    window.addEventListener('mousedown', onMouseDown);

    return camera;
}

function createCrosshair() {
    if (document.getElementById('crosshair')) return;

    // 1. Container centralizado invisível
    crosshairElement = document.createElement('div');
    crosshairElement.id = 'crosshair';
    crosshairElement.style.position = 'absolute';
    crosshairElement.style.top = '50%';
    crosshairElement.style.left = '50%';
    crosshairElement.style.width = '20px';  // Área total da cruz
    crosshairElement.style.height = '20px';
    crosshairElement.style.transform = 'translate(-50%, -50%)';
    crosshairElement.style.pointerEvents = 'none';
    crosshairElement.style.zIndex = '1000';

    // Estilo comum para as barras da cruz
    const barStyle = (bar) => {
        bar.style.position = 'absolute';
        bar.style.backgroundColor = 'white'; // Cor da mira
        bar.style.top = '50%';
        bar.style.left = '50%';
        bar.style.transform = 'translate(-50%, -50%)';
    };

    // 2. Barra Horizontal
    const horizontalBar = document.createElement('div');
    barStyle(horizontalBar);
    horizontalBar.style.width = '16px';  // Largura da mira
    horizontalBar.style.height = '2px';  // Espessura do traço

    // 3. Barra Vertical
    const verticalBar = document.createElement('div');
    barStyle(verticalBar);
    verticalBar.style.width = '2px';   // Espessura do traço
    verticalBar.style.height = '16px'; // Altura da mira

    // Adiciona as barras ao container e o container ao corpo da página
    crosshairElement.appendChild(horizontalBar);
    crosshairElement.appendChild(verticalBar);
    document.body.appendChild(crosshairElement);
}

function onKeyDown(event) {
    switch (event.code) {
        // Movimentação por WASD e Setas Direcionais
        case 'KeyW':
        case 'ArrowUp':
            moveState.forward = true;
            break;
        case 'KeyS':
        case 'ArrowDown':
            moveState.backward = true;
            break;
        case 'KeyA':
        case 'ArrowLeft':
            moveState.left = true;
            break;
        case 'KeyD':
        case 'ArrowRight':
            moveState.right = true;
            break;

        // Alternar modo de câmera via tecla 'c'
        case 'KeyC':
            toggleCameraMode();
            break;
    }
}

function onKeyUp(event) {
    switch (event.code) {
        case 'KeyW':
        case 'ArrowUp':
            moveState.forward = false;
            break;
        case 'KeyS':
        case 'ArrowDown':
            moveState.backward = false;
            break;
        case 'KeyA':
        case 'ArrowLeft':
            moveState.left = false;
            break;
        case 'KeyD':
        case 'ArrowRight':
            moveState.right = false;
            break;
    }
}

function onMouseDown(event) {
    // Disparo: Botão esquerdo (0) ou direito (2)
    if (event.button === 0 || event.button === 2) {
        if (!isOrbitMode && pointerControls.isLocked) {
            shootProjectile();
        }
    }
}

function shootProjectile() {
    console.log("Disparo efetuado na direção da mira!");
}

function toggleCameraMode() {
    isOrbitMode = !isOrbitMode;

    if (isOrbitMode) {
        // 1. Salva rigorosamente a posição e orientação atuais da 1ª pessoa
        savedPosition.copy(camera.position);
        savedQuaternion.copy(camera.quaternion);

        // 2. Desativa os controles de 1ª pessoa
        pointerControls.unlock();
        pointerControls.enabled = false;

        // 3. Posiciona a câmera elevada no ar para inspeção externa do castelo
        camera.position.set(0, 30, -90);

        // 4. Configura o OrbitControls para focar no centro do plano/cenário (0, 0, 0)
        orbitControls.target.set(0, 0, 0);
        orbitControls.enabled = true;
        orbitControls.update();

        // Oculta a mira
        if (crosshairElement) crosshairElement.style.display = 'none';
    } else {
        // 1. Desativa o OrbitControls
        orbitControls.enabled = false;

        // 2. Restaura exatamente a posição e rotação originais da 1ª pessoa
        camera.position.copy(savedPosition);
        camera.quaternion.copy(savedQuaternion);

        // 3. Reativa os controles de 1ª pessoa e o trava-ponteiro
        pointerControls.enabled = true;
        pointerControls.lock();

        // Exibe a mira novamente
        if (crosshairElement) crosshairElement.style.display = 'block';
    }
}

export function updateCamera(delta, castleRoot = null) {
    if (!isOrbitMode && pointerControls.isLocked) {

        const oldPosition = camera.position.clone();

        // Movimento normal do PointerLockControls
        if (moveState.forward) {
            pointerControls.moveForward(MOVE_SPEED * delta);
        }

        if (moveState.backward) {
            pointerControls.moveForward(-MOVE_SPEED * delta);
        }

        if (moveState.left) {
            pointerControls.moveRight(-MOVE_SPEED * delta);
        }

        if (moveState.right) {
            pointerControls.moveRight(MOVE_SPEED * delta);
        }

        // Corrige a posição caso tenha ocorrido uma colisão
        if (castleRoot) {
            resolveCollisions(camera, oldPosition, castleRoot, delta);
        }

    } else if (isOrbitMode) {
        orbitControls.update();
    }
}