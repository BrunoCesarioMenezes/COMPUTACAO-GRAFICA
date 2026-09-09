import * as THREE from  'three';
import {GLTFLoader} from '../../build/jsm/loaders/GLTFLoader.js';
import GUI from '../../libs/util/dat.gui.module.js'
import {initRenderer,
        initDefaultBasicLight,
        onWindowResize,
        createGroundPlaneXZ} from "../../libs/util/util.js";

let scene, renderer, camera, light; // Initial variables
scene = new THREE.Scene();
renderer = initRenderer();
light = initDefaultBasicLight(scene, true);
window.addEventListener( 'resize', function(){onWindowResize(camera, renderer)}, false );

// Camera
camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 1000);
   camera.position.set(0.0, 0.0, 0.0);
   // Para o exercício, a câmera deve estar na posição (0, 0, 0)
   camera.up.set( 0.0, 1.0, 0.0 );
   camera.lookAt(0.0, 0.0, 0.0);
scene.add(camera)

let lerpConfig1 = {
  destination: new THREE.Vector3(0.0, 3.0, 25.0),
  alpha: 0.1,
  move: false,
  quaternion: new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), THREE.MathUtils.degToRad(0))
}

let lerpConfig2 = {
  destination: new THREE.Vector3(15.0, 4.0, 13.0),
  alpha: 0.1,
  move: false,
  quaternion: new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), THREE.MathUtils.degToRad(45))
}

let lerpConfig3 = {
  destination: new THREE.Vector3(20.0, 6.0, 0.0),
  alpha: 0.1,
  move: false,
  quaternion: new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), THREE.MathUtils.degToRad(90))
}


buildScene();
buildInterface();
render();

function render()
{
  if(lerpConfig1.move) {
    camera.position.lerp(lerpConfig1.destination, lerpConfig1.alpha);
    camera.quaternion.slerp(lerpConfig1.quaternion, lerpConfig1.alpha);
  }
  if(lerpConfig2.move) {
    camera.position.lerp(lerpConfig2.destination, lerpConfig2.alpha);
    camera.quaternion.slerp(lerpConfig2.quaternion, lerpConfig2.alpha);
  }
  if(lerpConfig3.move) {
    camera.position.lerp(lerpConfig3.destination, lerpConfig3.alpha);
    camera.quaternion.slerp(lerpConfig3.quaternion, lerpConfig3.alpha);

  }
   requestAnimationFrame(render);
   renderer.render(scene, camera) // Render scene
}


function buildInterface()
{
  var controls = new function ()
  {
    this.movePosition1 = function(){
      lerpConfig1.move = true;
      lerpConfig2.move = false;
      lerpConfig3.move = false;
    };
    this.movePosition2 = function(){
      lerpConfig1.move = false;
      lerpConfig2.move = true;
      lerpConfig3.move = false;
    };
    this.movePosition3 = function(){
      lerpConfig1.move = false;
      lerpConfig2.move = false;
      lerpConfig3.move = true;
    };
  };

  // GUI interface
  var gui = new GUI();
  gui.add(controls, 'movePosition1',true).name("Pos 1");
  gui.add(controls, 'movePosition2',true).name("Pos 2");
  gui.add(controls, 'movePosition3',true).name("Pos 3");
}


// Aux functions
function buildScene()
{
   scene.add( createGroundPlaneXZ(30, 30) );

   // Load external objects
   var loader = new GLTFLoader( );
   loader.load( '../../assets/objects/woodenGoose.glb', function ( gltf ) {
      var obj = gltf.scene;
      obj.traverse( function ( child ) {
         if( child.isMesh ) child.castShadow = true;
         if( child.material ) child.material.side = THREE.DoubleSide;
      });
      obj.scale.set(0.3, 0.3, 0.3);
      obj.rotateY( Math.PI / 2 );
      scene.add ( obj );
    });
}
