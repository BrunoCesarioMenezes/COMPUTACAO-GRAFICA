import * as THREE from 'three';
import { OrbitControls } from '../build/jsm/controls/OrbitControls.js';

let cameraConfiguration = {
  cameraParameters: {
    up: null,
    lookAt: null,
    position: null
  },
  orbitMode: true,
}

export function initCamera() {
    let camera = new THREE.PerspectiveCamera(
    60,
    window.innerWidth / window.innerHeight,
    0.1,
    500
    );

    cameraConfiguration.cameraParameters.up = camera.up;
    cameraConfiguration.cameraParameters.lookAt = new THREE.Vector3(0, 8, 0);
    cameraConfiguration.cameraParameters.position = camera.position;

    camera.position.set(68, 42, 76);
    camera.lookAt(0, 8, 0);
    //scene.add(camera);

    let cameraHolder = new THREE.Object3D();
    cameraHolder.add(camera);
    //scene.add(cameraHolder);

    return {camera, cameraHolder};
}

export function startOrbitControls(camera, renderer) {
  // OrbitControls existe apenas para inspecionar a modelagem.
    // Não há mecânica de player, tiros ou sistema de colisão nesta versão.
    let controls = new OrbitControls(camera, renderer.domElement);
    controls.target.set(0, 8, 0);
    controls.enableDamping = true;
    controls.dampingFactor = 0.08;
    controls.minDistance = 5;
    controls.maxDistance = 155;
    controls.maxPolarAngle = Math.PI * 0.49;
    controls.enabled = true;

    return controls;
}

export function switchCameraMode(camera, controls) {
  if (!cameraConfiguration.orbitMode) {
    // Modo OrbitControls
    camera.position.set(68, 42, 76);
    camera.up.set(0, 1, 0);
    camera.lookAt(0, 8, 0);
    controls.enabled = true;

    // cameraConfiguration.cameraParameters = {
    //     up: camera.up,
    //     lookAt: camera.lookAt,
    //     position: camera.position
    // };

    cameraConfiguration.orbitMode = true;
  } else {
    // Modo Player
    camera.position.copy(cameraConfiguration.cameraParameters.position);
    camera.up.copy(cameraConfiguration.cameraParameters.up);
    camera.lookAt(cameraConfiguration.cameraParameters.lookAt);
    controls.enabled = false;
    cameraConfiguration.orbitMode = false;
  }
}

export function updateCameraView(camera, axe, property, modifier) {
    if(cameraConfiguration.orbitMode) return;
    switch(axe){
        case 'x':
            cameraConfiguration.cameraParameters[property].x += modifier;
            let newVectorX = cameraConfiguration.cameraParameters[property];
            property === "position" ? camera.position.copy(newVectorX) : camera.lookAt(newVectorX);
            break;
        case 'y':
            cameraConfiguration.cameraParameters[property].y += modifier;
            let newVectorY = cameraConfiguration.cameraParameters[property];
            property === "position" ? camera.position.copy(newVectorY) : camera.lookAt(newVectorY);
            break;
        case 'z':
            cameraConfiguration.cameraParameters[property].z += modifier;
            let newVectorZ = cameraConfiguration.cameraParameters[property];
            property === "position" ? camera.position.copy(newVectorZ) : camera.lookAt(newVectorZ);
            break;
    }
}