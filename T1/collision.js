import * as THREE from 'three';

export const PLAYER_EYE_HEIGHT = 2;
export const PLAYER_RADIUS = 0.35;
export const MAX_STEP_HEIGHT = 0.9;

const GRAVITY = 20.0;
const MAX_FALL_SPEED = 16.0;
const STAIR_SMOOTH_SPEED = 14.0;
const STAIR_EXIT_SMOOTH_SPEED = 10.0;
const FLOOR_TOLERANCE = 0.08;
const SUPPORT_MARGIN = 0.08;

let meshes = [];
let currentRoot = null;
let verticalVelocity = 0;
let grounded = true;
let stairMode = false;
let stairTargetY = null;

function updateMeshes(root) {
    if (root === currentRoot) return;
    currentRoot = root;
    meshes = [];
    root.traverse(obj => {
        if (obj.isMesh && obj.visible && obj.userData.noCollision !== true) meshes.push(obj);
    });
}

function getBox(obj) {
    return new THREE.Box3().setFromObject(obj);
}

function isOverBox(position, box, margin = 0) {
    return position.x >= box.min.x - margin && position.x <= box.max.x + margin &&
           position.z >= box.min.z - margin && position.z <= box.max.z + margin;
}

function getFloorBelow(position) {
    const footY = position.y - PLAYER_EYE_HEIGHT;
    let bestFloor = null;

    for (const obj of meshes) {
        const box = getBox(obj);
        if (!isOverBox(position, box, SUPPORT_MARGIN)) continue;

        const top = box.max.y;
        if (top > footY + FLOOR_TOLERANCE) continue;
        if (bestFloor === null || top > bestFloor) bestFloor = top;
    }

    return bestFloor;
}

function getStepSurface(position) {
    const footY = position.y - PLAYER_EYE_HEIGHT;
    let bestStep = null;

    for (const obj of meshes) {
        const box = getBox(obj);
        if (!isOverBox(position, box)) continue;

        const top = box.max.y;
        const difference = top - footY;

        if (difference <= FLOOR_TOLERANCE) continue;

        if (obj.userData.isStep === true) {
            if (difference <= 1.8 && (bestStep === null || top > bestStep)) bestStep = top;
            continue;
        }

        if (difference <= MAX_STEP_HEIGHT && (bestStep === null || top > bestStep)) bestStep = top;
    }

    return bestStep;
}

function isOnStep(position) {
    const footY = position.y - PLAYER_EYE_HEIGHT;

    for (const obj of meshes) {
        if (obj.userData.isStep !== true) continue;

        const box = getBox(obj);
        if (!isOverBox(position, box, SUPPORT_MARGIN)) continue;

        if (Math.abs(footY - box.max.y) <= MAX_STEP_HEIGHT + 0.15) return true;
    }

    return false;
}

function collisionAmount(position) {
    const footY = position.y - PLAYER_EYE_HEIGHT;
    const headY = position.y;
    let amount = 0;

    for (const obj of meshes) {
        if (obj.userData.isStep === true) continue;

        const box = getBox(obj);

        if (box.min.y >= headY - 0.05) continue;
        if (box.max.y <= footY + 0.05) continue;
        if (box.max.y <= footY + MAX_STEP_HEIGHT) continue;

        const minX = box.min.x - PLAYER_RADIUS;
        const maxX = box.max.x + PLAYER_RADIUS;
        const minZ = box.min.z - PLAYER_RADIUS;
        const maxZ = box.max.z + PLAYER_RADIUS;

        if (position.x < minX || position.x > maxX ||
            position.z < minZ || position.z > maxZ) continue;

        const penetrationX = Math.min(position.x - minX, maxX - position.x);
        const penetrationZ = Math.min(position.z - minZ, maxZ - position.z);

        amount += Math.max(0, Math.min(penetrationX, penetrationZ));
    }

    return amount;
}

function moveX(camera, wantedPosition) {
    if (wantedPosition.x === camera.position.x) return;

    const test = camera.position.clone();
    test.x = wantedPosition.x;

    const current = collisionAmount(camera.position);
    const next = collisionAmount(test);

    if (next === 0 || (current > 0 && next < current)) camera.position.x = wantedPosition.x;
}

function moveZ(camera, wantedPosition) {
    if (wantedPosition.z === camera.position.z) return;

    const test = camera.position.clone();
    test.z = wantedPosition.z;

    const current = collisionAmount(camera.position);
    const next = collisionAmount(test);

    if (next === 0 || (current > 0 && next < current)) camera.position.z = wantedPosition.z;
}

function smoothToHeight(camera, targetY, speed, delta) {
    const factor = 1 - Math.exp(-speed * delta);
    camera.position.y = THREE.MathUtils.lerp(camera.position.y, targetY, factor);
}

function moveUpSmooth(camera, floorY, delta) {
    const targetY = floorY + PLAYER_EYE_HEIGHT;

    stairMode = true;

    if (stairTargetY === null || targetY > stairTargetY) {
        stairTargetY = targetY;
    }

    smoothToHeight(camera, stairTargetY, STAIR_SMOOTH_SPEED, delta);

    verticalVelocity = 0;
    grounded = true;
}

function fall(camera, floorY, delta) {
    stairMode = false;
    stairTargetY = null;
    grounded = false;

    verticalVelocity -= GRAVITY * delta;
    verticalVelocity = Math.max(verticalVelocity, -MAX_FALL_SPEED);

    const nextY = camera.position.y + verticalVelocity * delta;

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

function updateVertical(camera, delta) {
    const footY = camera.position.y - PLAYER_EYE_HEIGHT;
    const stepY = getStepSurface(camera.position);

    if (stepY !== null && verticalVelocity >= 0) {
        moveUpSmooth(camera, stepY, delta);
        return;
    }

    const floorY = getFloorBelow(camera.position);

    if (floorY === null) {
        fall(camera, null, delta);
        return;
    }

    const onStep = isOnStep(camera.position);

    if (stairMode && onStep) {
        const targetY = floorY + PLAYER_EYE_HEIGHT;

        if (stairTargetY !== null && stairTargetY > targetY) {
            smoothToHeight(camera, stairTargetY, STAIR_SMOOTH_SPEED, delta);
        } else {
            smoothToHeight(camera, targetY, STAIR_EXIT_SMOOTH_SPEED, delta);
        }

        verticalVelocity = 0;
        grounded = true;
        return;
    }

    if (stairMode && !onStep) {
        stairMode = false;
        stairTargetY = null;
    }

    const distance = footY - floorY;

    if (distance >= -FLOOR_TOLERANCE && distance <= FLOOR_TOLERANCE && verticalVelocity <= 0) {
        camera.position.y = floorY + PLAYER_EYE_HEIGHT;
        verticalVelocity = 0;
        grounded = true;
        return;
    }

    if (distance > FLOOR_TOLERANCE) {
        fall(camera, floorY, delta);
        return;
    }

    if (distance < -FLOOR_TOLERANCE) {
        camera.position.y = floorY + PLAYER_EYE_HEIGHT;
        verticalVelocity = 0;
        grounded = true;
    }
}

export function resolveCollisions(camera, oldPosition, castleRoot, delta) {
    if (!castleRoot) return;

    updateMeshes(castleRoot);
    castleRoot.updateMatrixWorld(true);

    delta = Math.min(delta, 0.05);

    const wantedPosition = camera.position.clone();

    camera.position.copy(oldPosition);

    moveX(camera, wantedPosition);
    moveZ(camera, wantedPosition);
    updateVertical(camera, delta);
}