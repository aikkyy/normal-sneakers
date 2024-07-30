// ----> IMPORTS <----

import "./style.css";

// import motion dev
import { animate, inView } from "motion";
// import Three.JS
import {
  AmbientLight,
  Clock,
  DirectionalLight,
  Group,
  Mesh,
  MeshLambertMaterial,
  PerspectiveCamera,
  Scene,
  TorusKnotGeometry,
  WebGLRenderer,
} from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { EffectComposer } from "three/addons/postprocessing/EffectComposer.js";
import { RenderPass } from "three/addons/postprocessing/RenderPass.js";
import { ShaderPass } from "three/addons/postprocessing/ShaderPass.js";
import { NoiseShader } from "./noise-shader";
import { OutputPass } from "three/addons/postprocessing/OutputPass.js";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";

// ----> TAG SELECTION <----

const sneakerTag = document.querySelector("section.sneaker");
const loaderTag = document.querySelector("div.loader");

// ----> VARIABLES <----

let currentEffect = 0;
let aimEffect = 0;
let timeoutEffect;

// ----> ANIMATION <----

// content fade in
animate("section.content p, section.content img", {
  opacity: 0,
});
inView("section.content", (info) => {
  animate(
    info.target.querySelectorAll("p, img"),
    { opacity: 1 },
    { duration: 1, delay: 1 }
  );
});

// ----> 3D OBJECT <----

// create clock
const clock = new Clock();

// create scene
const scene = new Scene();

// create camera
const camera = new PerspectiveCamera(
  75,
  window.innerWidth / window.innerHeight,
  0.1,
  1000
);

// create renderer
const renderer = new WebGLRenderer();
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setClearColor(0x000000, 0);
sneakerTag.appendChild(renderer.domElement);

// LIGHTING

// ambient light
const ambienceLight = new AmbientLight(0x404040);
camera.add(ambienceLight);
// key light
const keyLight = new DirectionalLight(0xffffff, 1);
keyLight.position.set(-1, 1, 3);
camera.add(keyLight);
// fill light
const fillLight = new DirectionalLight(0xffffff, 0.5);
keyLight.position.set(1, 1, 3);
camera.add(fillLight);
// fill light
const backLight = new DirectionalLight(0xffffff, 1);
keyLight.position.set(-1, 3, -1);
camera.add(backLight);

// add camera to scene
scene.add(camera);

// OBJECT IMPORT

const gltfloader = new GLTFLoader();

// set position on load
const loadGroup = new Group();
loadGroup.position.y = -10;

// create animation on scroll
const scrollGroup = new Group();
scrollGroup.add(loadGroup);

// add 3D object group to scene
scene.add(scrollGroup);

animate("header", { y: -100, opacity: 0 });
animate("section.new-drop", { y: -100, opacity: 0 });

gltfloader.load(
  "sneaker.glb",
  (gltf) => {
    loadGroup.add(gltf.scene);

    // header fade in
    animate(
      "header",

      {
        y: [-100, 0],

        opacity: [0, 1],
      },

      { duration: 1, delay: 2.5 }
    );

    // new drop section fade in
    animate(
      "section.new-drop",

      {
        y: [-100, 0],

        opacity: [0, 1],
      },

      { duration: 1, delay: 2 }
    );

    // 3D object appears (from bottom to top)
    animate(
      (t) => {
        loadGroup.position.y = -10 + 10 * t;
      },

      { duration: 2, delay: 1 }
    );

    // preloader disappears (from top to bottom)
    animate(
      "div.loader",

      {
        y: "-100%",
      },

      { duration: 1, delay: 1 }
    );
  },

  (xhr) => {
    const p = Math.round((xhr.loaded / xhr.total) * 100);

    loaderTag.querySelector("span").innerHTML = p + "%";
  },

  (error) => {
    console.error(error);
  }
);

// CONTROLS

const controls = new OrbitControls(camera, renderer.domElement);
controls.enableZoom = false;
controls.enablePan = false;
controls.autoRotate = true;
controls.autoRotateSpeed = 2;
controls.update();

camera.position.z = 2;

// POST PROCESSING

// create composer (renderer)
const composer = new EffectComposer(renderer);

const renderPass = new RenderPass(scene, camera);
composer.addPass(renderPass);

// custom pass (custom shader)
const noisePass = new ShaderPass(NoiseShader);
noisePass.uniforms.time.value = clock.getElapsedTime();
noisePass.uniforms.effect.value = currentEffect;
noisePass.uniforms.aspectRatio.value = window.innerWidth / window.innerHeight;
composer.addPass(noisePass);

const outputPass = new OutputPass();
composer.addPass(outputPass);

// ----> RENDER <----

const render = () => {
  // add controls to animation
  controls.update();

  // add animation on scroll
  scrollGroup.rotation.set(0, window.scrollY * 0.001, 0);

  // update effect
  currentEffect += (aimEffect - currentEffect) * 0.05;
  // update time on noise effect
  noisePass.uniforms.time.value = clock.getElapsedTime();
  // update effect on noise effect
  noisePass.uniforms.effect.value = currentEffect;

  composer.render();
};

// RESPONSIVE ANIMATION

const resize = () => {
  // change camera aspect ratio
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();

  noisePass.uniforms.aspectRatio.value = window.innerWidth / window.innerHeight;

  // change the size of the renderer
  renderer.setSize(window.innerWidth, window.innerHeight);
};

// SCROLL

const scroll = () => {
  clearTimeout(timeoutEffect);

  aimEffect = 1;

  timeoutEffect = setTimeout(() => {
    aimEffect = 0;
  }, 300);
};

// render
renderer.setAnimationLoop(render);

// update window size
window.addEventListener("resize", resize);
// scroll controls noise effect
window.addEventListener("scroll", scroll);
