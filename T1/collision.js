import * as THREE from 'three';

export const PLAYER_EYE_HEIGHT = 1.6;
export const PLAYER_RADIUS = 0.35;
export const MAX_STEP_HEIGHT = 0.9;

// Configurações da queda e das escadas
const GRAVITY = 20.0;
const MAX_FALL_SPEED = 16.0;
const STAIR_SMOOTH_SPEED = 10.0;
const FLOOR_TOLERANCE = 0.08;
const SUPPORT_MARGIN = 0.08;

let meshes = [];
let currentRoot = null;
let verticalVelocity = 0;
let grounded = true;


// Atualiza os objetos que participam da colisão
function updateMeshes(root) {
    if (root === currentRoot) return;

    currentRoot = root;
    meshes = [];

    root.traverse((obj) => {
        if (obj.isMesh && obj.visible && obj.userData.noCollision !== true) {
            meshes.push(obj);
        }
    });
}


// Retorna a caixa de colisão de um objeto
function getBox(obj) {
    return new THREE.Box3().setFromObject(obj);
}


// Verifica se o personagem está sobre uma caixa
function isOverBox(position, box, margin = 0) {
    return position.x >= box.min.x - margin &&
           position.x <= box.max.x + margin &&
           position.z >= box.min.z - margin &&
           position.z <= box.max.z + margin;
}


// Procura o piso mais alto abaixo do personagem
function getFloorBelow(position) {
    const footY = position.y - PLAYER_EYE_HEIGHT;
    let bestFloor = null;

    for (const obj of meshes) {
        const box = getBox(obj);

        if (!isOverBox(position, box, SUPPORT_MARGIN)) continue;

        const top = box.max.y;

        if (top > footY + FLOOR_TOLERANCE) continue;

        if (bestFloor === null || top > bestFloor) {
            bestFloor = top;
        }
    }

    return bestFloor;
}


// Procura uma superfície que pode ser subida
function getStepSurface(position) {
    const footY = position.y - PLAYER_EYE_HEIGHT;
    let bestStep = null;

    for (const obj of meshes) {
        const box = getBox(obj);

        if (!isOverBox(position, box)) continue;

        const top = box.max.y;
        const difference = top - footY;

        if (difference <= FLOOR_TOLERANCE) continue;

        // Degraus têm uma tolerância maior por causa da subida suave
        if (obj.userData.isStep === true) {
            if (difference <= 1.8 && (bestStep === null || top > bestStep)) {
                bestStep = top;
            }
            continue;
        }

        // Pisos normais só podem ser subidos se forem baixos
        if (difference <= MAX_STEP_HEIGHT && (bestStep === null || top > bestStep)) {
            bestStep = top;
        }
    }

    return bestStep;
}


// Mede quanto o personagem está entrando em objetos sólidos
function collisionAmount(position) {
    const footY = position.y - PLAYER_EYE_HEIGHT;
    const headY = position.y;
    let amount = 0;

    for (const obj of meshes) {
        // Escadas são tratadas como piso
        if (obj.userData.isStep === true) continue;

        const box = getBox(obj);

        if (box.min.y >= headY - 0.05) continue;
        if (box.max.y <= footY + 0.05) continue;
        if (box.max.y <= footY + MAX_STEP_HEIGHT) continue;

        const minX = box.min.x - PLAYER_RADIUS;
        const maxX = box.max.x + PLAYER_RADIUS;
        const minZ = box.min.z - PLAYER_RADIUS;
        const maxZ = box.max.z + PLAYER_RADIUS;

        const insideX = position.x >= minX && position.x <= maxX;
        const insideZ = position.z >= minZ && position.z <= maxZ;

        if (!insideX || !insideZ) continue;

        const penetrationX = Math.min(position.x - minX, maxX - position.x);
        const penetrationZ = Math.min(position.z - minZ, maxZ - position.z);

        amount += Math.max(0, Math.min(penetrationX, penetrationZ));
    }

    return amount;
}


// Movimento no eixo X
function moveX(camera, wantedPosition) {
    if (wantedPosition.x === camera.position.x) return;

    const testPosition = camera.position.clone();
    testPosition.x = wantedPosition.x;

    const currentCollision = collisionAmount(camera.position);
    const newCollision = collisionAmount(testPosition);

    if (newCollision === 0 || (currentCollision > 0 && newCollision < currentCollision)) {
        camera.position.x = wantedPosition.x;
    }
}


// Movimento no eixo Z
function moveZ(camera, wantedPosition) {
    if (wantedPosition.z === camera.position.z) return;

    const testPosition = camera.position.clone();
    testPosition.z = wantedPosition.z;

    const currentCollision = collisionAmount(camera.position);
    const newCollision = collisionAmount(testPosition);

    if (newCollision === 0 || (currentCollision > 0 && newCollision < currentCollision)) {
        camera.position.z = wantedPosition.z;
    }
}


// Faz a subida da escada de forma suave
function moveUpSmooth(camera, floorY, delta) {
    const targetY = floorY + PLAYER_EYE_HEIGHT;
    const factor = 1 - Math.exp(-STAIR_SMOOTH_SPEED * delta);

    camera.position.y = THREE.MathUtils.lerp(camera.position.y, targetY, factor);

    verticalVelocity = 0;
    grounded = true;
}


// Aplica gravidade durante a queda
function fall(camera, floorY, delta) {
    grounded = false;

    verticalVelocity -= GRAVITY * delta;
    verticalVelocity = Math.max(verticalVelocity, -MAX_FALL_SPEED);

    const nextY = camera.position.y + verticalVelocity * delta;

    // Impede atravessar o piso durante a queda
    if (floorY !== null) {
        const landingY = floorY + PLAYER_EYE_HEIGHT;

        if (nextY <= landingY) {
            camera.position.y = landingY;
            verticalVelocity = 0;
            grounded = true;
            return;
        }
    }

    camera.position.y = nextY;
}


// Controla escadas, chão e queda
function updateVertical(camera, delta) {
    const footY = camera.position.y - PLAYER_EYE_HEIGHT;

    // Primeiro verifica se há uma escada
    const stepY = getStepSurface(camera.position);

    if (stepY !== null && verticalVelocity >= 0) {
        moveUpSmooth(camera, stepY, delta);
        return;
    }

    // Depois procura o chão abaixo
    const floorY = getFloorBelow(camera.position);

    if (floorY === null) {
        fall(camera, null, delta);
        return;
    }

    const distance = footY - floorY;

    // Personagem apoiado no chão
    if (distance >= -FLOOR_TOLERANCE &&
        distance <= FLOOR_TOLERANCE &&
        verticalVelocity <= 0) {

        camera.position.y = floorY + PLAYER_EYE_HEIGHT;
        verticalVelocity = 0;
        grounded = true;
        return;
    }

    // Personagem está acima do chão
    if (distance > FLOOR_TOLERANCE) {
        fall(camera, floorY, delta);
        return;
    }

    // Corrige caso entre um pouco no piso
    if (distance < -FLOOR_TOLERANCE) {
        camera.position.y = floorY + PLAYER_EYE_HEIGHT;
        verticalVelocity = 0;
        grounded = true;
    }
}


// Função principal chamada pelo camera.js
export function resolveCollisions(camera, oldPosition, castleRoot, delta) {
    if (!castleRoot) return;

    updateMeshes(castleRoot);
    castleRoot.updateMatrixWorld(true);

    // Evita saltos grandes na física se houver queda de FPS
    delta = Math.min(delta, 0.05);

    const wantedPosition = camera.position.clone();

    // Volta para a posição antes do movimento
    camera.position.copy(oldPosition);

    // X e Z separados permitem deslizar nas paredes
    moveX(camera, wantedPosition);
    moveZ(camera, wantedPosition);

    // Controla escadas e gravidade
    updateVertical(camera, delta);
}