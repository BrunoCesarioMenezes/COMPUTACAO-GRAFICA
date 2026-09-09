import * as THREE from  'three';
import { OrbitControls } from '../../build/jsm/controls/OrbitControls.js';
import {initRenderer,
        initCamera,
        initDefaultBasicLight,
        setDefaultMaterial,
        InfoBox,
        onWindowResize,
        createGroundPlaneXZ} from "../../libs/util/util.js";

let scene, renderer, camera, material, light, orbit; // Initial variables
scene = new THREE.Scene();    // Create main scene
renderer = initRenderer();    // Init a basic renderer
material = setDefaultMaterial("brown"); // create a basic material
light = initDefaultBasicLight(scene); // Create a basic light to illuminate the scene
camera = initCamera(new THREE.Vector3(0, 15, 30)); // Init camera in this position
scene.add(camera); // Add camera to the scene
orbit = new OrbitControls( camera, renderer.domElement ); // Enable mouse rotation, pan, zoom etc.

// Listen window size changes
window.addEventListener( 'resize', function(){onWindowResize(camera, renderer)}, false );

// Show axes (parameter is size of each axis)
let axesHelper = new THREE.AxesHelper( 12 );
scene.add( axesHelper );

// create the ground plane
let plane = createGroundPlaneXZ(20, 20)
scene.add(plane);

// create a cube
let tableGeometry = new THREE.BoxGeometry(11, 0.3, 6);
let table = new THREE.Mesh(tableGeometry, material);
// position the cube
table.translateY(2.9)
// add the cube to the scene
scene.add(table);

let tableLegGeometry = new THREE.CylinderGeometry(0.1, 0.1, 3);

addTableLegs(table, tableLegGeometry, 5, 1.5, 2.5);
addTableLegs(table, tableLegGeometry, -5, 1.5, 2.5);
addTableLegs(table, tableLegGeometry, 5, 1.5, -2.5);
addTableLegs(table, tableLegGeometry, -5, 1.5, -2.5);

render();
function render()
{
  requestAnimationFrame(render);
  renderer.render(scene, camera) // Render scene
}

function addTableLegs(table, tableLegGeometry, translationX, translationY, translationZ){
  let tableLeg = new THREE.Mesh(tableLegGeometry, material);
  tableLeg.translateX(translationX);
  tableLeg.translateY(translationY);
  tableLeg.translateZ(translationZ);
  scene.add(tableLeg);
}