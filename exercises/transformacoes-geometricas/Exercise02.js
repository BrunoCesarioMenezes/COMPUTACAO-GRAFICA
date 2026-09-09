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

// create a sphere
let sphereGeometry = new THREE.SphereGeometry(0.5, 32, 32);

createCircleOfSpheres(sphereGeometry, 8, 12);

render();
function render()
{
  requestAnimationFrame(render);
  renderer.render(scene, camera) // Render scene
}

function createCircleOfSpheres(sphereGeometry, radius, numberOfSpheres){
  const angleFactor = (2 * Math.PI) / numberOfSpheres;
  for(let i = 0; i < numberOfSpheres; i++){
    let sphere = new THREE.Mesh(sphereGeometry, material);
    sphere.rotateY(i * angleFactor);
    sphere.translateX(radius);
    sphere.translateY(0.5);
    scene.add(sphere);
  }
}
