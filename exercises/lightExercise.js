import * as THREE from  'three';
import GUI from '../libs/util/dat.gui.module.js'
import { OrbitControls } from '../build/jsm/controls/OrbitControls.js';
import {initRenderer, 
        setDefaultMaterial,
        initDefaultBasicLight,        
        onWindowResize, 
        createLightSphere} from "../libs/util/util.js";
import {loadLightPostScene} from "../libs/util/utilScenes.js";

let scene, renderer, camera, orbit, material, lightColor;
scene = new THREE.Scene();    // Create main scene
renderer = initRenderer();    // View function in util/utils
   renderer.setClearColor("rgb(30, 30, 42)");
camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 1000);
   camera.lookAt(0, 0, 0);
   camera.position.set(5, 5, 5);
   camera.up.set( 0, 1, 0 );
orbit = new OrbitControls( camera, renderer.domElement ); // Enable mouse rotation, pan, zoom etc.
material = setDefaultMaterial()
lightColor = "rgb(255,255,255)"

renderer.shadowMap.enabled = true
renderer.shadowMap.type = THREE.VSMShadowMap

// Listen window size changes
window.addEventListener( 'resize', function(){onWindowResize(camera, renderer)}, false );

// Show axes (parameter is size of each axis)
let axesHelper = new THREE.AxesHelper( 3 );
  axesHelper.visible = false;
scene.add( axesHelper );

let dirPosition = new THREE.Vector3(2, 2, 4)
const dirLight = new THREE.DirectionalLight('white', 0.2);
dirLight.position.copy(dirPosition);
 //mainLight.castShadow = true;
scene.add(dirLight);

let spotlight = new THREE.SpotLight(lightColor, 5,8,1,0.5,1)
spotlight.position.set(1,4,0)
spotlight.angle = THREE.MathUtils.degToRad(40)
spotlight.castShadow = true
spotlight.target.position.set(3,0,0)

let cubeGeometry = new THREE.BoxGeometry(1, 2, 1);
let cylinderGeometry = new THREE.CylinderGeometry(0.3,0.3,1)

let cube1 = new THREE.Mesh(cubeGeometry, material);
cube1.position.set(3,1,0)

let cube2 = new THREE.Mesh(cubeGeometry, setDefaultMaterial("green"));
cube2.position.set(3,1,3)

let cylinder1 = new THREE.Mesh(cylinderGeometry, setDefaultMaterial("yellow"))
cylinder1.position.set(1,0.5,-3)

let cylinder2 = new THREE.Mesh(cylinderGeometry, setDefaultMaterial("purple"))
cylinder2.position.set(0,0.5,4)

scene.add(cube1)
scene.add(cube2)
scene.add(cylinder1)
scene.add(cylinder2)
scene.add(spotlight)
scene.add(spotlight.target)



// Load default scene
loadLightPostScene(scene)

// REMOVA ESTA LINHA APÓS CONFIGURAR AS LUZES DESTE EXERCÍCIO
//initDefaultBasicLight(scene);

//---------------------------------------------------------
// Load external objects
buildInterface();
render();

function buildInterface()
{
  // GUI interface
  let gui = new GUI();
}

function render()
{
  requestAnimationFrame(render);
  renderer.render(scene, camera)
}
