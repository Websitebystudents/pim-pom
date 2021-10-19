import * as THREE from "./threeComponents/THREE.js";
import { PointerLockControls } from "./threeComponents/PointerLockControls.js";
import { GLTFLoader } from "./threeComponents/GLTFLoader.js";
import { Euler } from "./threeComponents/build/three.module.js";

// --------------
// VARIABLES
// --------------
const canvas = document.querySelector("#c");
const menu = document.querySelector("#menu");
const loader = document.querySelector("#loader");
const canvasDiv = document.querySelector("body > div");
const mobileControls = document.querySelector("#mobileControls");
const pause = document.querySelector("#pause");
const startButton = document.querySelector("#start");
const videoDiv = document.querySelector("#video");
const crosshair = document.querySelector("#crosshair");
const renderer = new THREE.WebGLRenderer({ canvas });
let loaded = false;

const fov = 45;
const aspect = 2; // the canvas default
const near = 0.1;
const far = 14;
let camera = new THREE.PerspectiveCamera(fov, aspect, near, far);
let cameraFront = new THREE.PerspectiveCamera(fov, aspect, near, 1);
let cameraLeft = new THREE.PerspectiveCamera(fov, aspect, near, 1);
let cameraRight = new THREE.PerspectiveCamera(fov, aspect, near, 1);
let cameraUp = new THREE.PerspectiveCamera(fov, aspect, near, 1);
let cameraDown = new THREE.PerspectiveCamera(fov, aspect, near, 1);

camera.position.set(0, 2, 1);
cameraFront.position.set(0, 1.5, 1);
cameraLeft.position.set(0, 1.5, 1);
cameraRight.position.set(0, 1.5, 1);
cameraUp.position.set(0, 3, 1);
cameraDown.position.set(0, 3, 1);

let root;
let intersects = [];

let controls = new PointerLockControls(camera, canvas);
let controlsFront = new PointerLockControls(cameraFront, canvas);
let controlsLeft = new PointerLockControls(cameraLeft, canvas);
let controlsRight = new PointerLockControls(cameraRight, canvas);
let controlsUp = new PointerLockControls(cameraUp, canvas);
let controlsDown = new PointerLockControls(cameraDown, canvas);

controlsFront.minPolarAngle = 1.6;
controlsFront.maxPolarAngle = 1.6;
controlsLeft.minPolarAngle = 1.6;
controlsLeft.maxPolarAngle = 1.6;
controlsRight.minPolarAngle = 1.6;
controlsRight.maxPolarAngle = 1.6;
controlsUp.minPolarAngle = 0;
controlsUp.maxPolarAngle = 0;
controlsDown.minPolarAngle = Math.PI;
controlsDown.maxPolarAngle = Math.PI;

var currentCamera = camera;

let walkFront = true;
let walkBack = true;
let walkLeft = true;
let walkRight = true;

// --------------
// Gravity
// --------------
let height = 2;
var jumpInterval;
var speedHeight = 1;
var jumping = false;

function jumpTimer() {
  jumping = true;
  speedHeight += -0.12;
  height += speedHeight;
  camera.position.y = height;
  cameraFront.position.y = height - 1;
  cameraLeft.position.y = height - 1;
  cameraRight.position.y = height - 1;
  cameraUp.position.y = height;
  cameraDown.position.y = height;
}

function startJumpInterval() {
  jumpInterval = setInterval(jumpTimer, 25);
}

// --------------
// Drag camera
// --------------

var movementX = 0;
var movementY = 0;
var lastClientX = 0;
var lastClientY = 0;

const scope = { maxPolarAngle: Math.PI, minPolarAngle: 0 };
var _euler = new Euler(0, 0, 0, "YXZ");
var _eulerFront = new Euler(0, 0, 0, "YXZ");
var _eulerLeft = new Euler(0, 0, 0, "YXZ");
var _eulerRight = new Euler(0, 0, 0, "YXZ");
var _eulerUp = new Euler(0, 0, 0, "YXZ");
var _eulerDown = new Euler(0, 0, 0, "YXZ");

const _PI_2 = Math.PI / 2;

const onMouseMove = function (event) {
  if (lastClientX !== 0 && lastClientY !== 0) {
    movementX = lastClientX - event.changedTouches[0].clientX;
    movementY = lastClientY - event.changedTouches[0].clientY;

    _euler.setFromQuaternion(camera.quaternion);
    _eulerFront.setFromQuaternion(cameraFront.quaternion);
    _eulerLeft.setFromQuaternion(cameraLeft.quaternion);
    _eulerRight.setFromQuaternion(cameraRight.quaternion);
    _eulerUp.setFromQuaternion(cameraUp.quaternion);
    _eulerDown.setFromQuaternion(cameraDown.quaternion);

    _euler.y -= movementX * 0.002;
    _euler.x -= movementY * 0.002;
    _eulerFront.y -= movementX * 0.002;
    _eulerFront.x -= movementY * 0.002;
    _eulerLeft.y -= movementX * 0.002;
    _eulerLeft.x -= movementY * 0.002;
    _eulerRight.y -= movementX * 0.002;
    _eulerRight.x -= movementY * 0.002;
    _eulerUp.y -= movementY * 0.002;
    _eulerUp.x -= movementY * 0.002;
    _eulerDown.y -= movementY * 0.002;
    _eulerDown.x -= movementY * 0.002;

    _euler.x = Math.max(
      _PI_2 - scope.maxPolarAngle,
      Math.min(_PI_2 - scope.minPolarAngle, _euler.x)
    );
    _eulerFront.x = _euler.x;
    _eulerLeft.x = _euler.x;
    _eulerRight.x = _euler.x;
    _eulerUp.x = _euler.x;
    _eulerDown.x = _euler.x;

    camera.quaternion.setFromEuler(_euler);
    cameraFront.quaternion.setFromEuler(_eulerFront);
    cameraLeft.quaternion.setFromEuler(_eulerLeft);
    cameraRight.quaternion.setFromEuler(_eulerRight);
    cameraUp.quaternion.setFromEuler(_eulerUp);
    cameraDown.quaternion.setFromEuler(_eulerDown);
  }

  lastClientX = event.changedTouches[0].clientX;
  lastClientY = event.changedTouches[0].clientY;
};

canvasDiv.addEventListener("touchmove", function (event) {
  event.stopPropagation();
  event.preventDefault();
});

canvas.addEventListener("touchmove", onMouseMove);

canvas.addEventListener("touchend", function () {
  lastClientX = 0;
  lastClientY = 0;
  movementX = 0;
  movementY = 0;
});

// --------------
// Movement
// --------------

controls.addEventListener("lock", function () {
  menu.classList.add("hidden");
  controls.connect();
  controlsFront.connect();
  controlsLeft.connect();
  controlsRight.connect();
  controlsUp.connect();
  controlsDown.connect();
});

controls.addEventListener("unlock", function () {
  menu.classList.remove("hidden");
  controls.unlock();
  controlsFront.unlock();
  controlsLeft.unlock();
  controlsRight.unlock();
  controlsUp.unlock();
  controlsDown.unlock();
});

document.body.addEventListener(
  "click",
  function () {
    if (
      event.target === startButton ||
      event.target.parentElement === startButton
    ) {
      if (event.pointerType === "touch") {
        document.body.requestFullscreen();
        controls.isLocked = true;
        menu.classList.add("hidden");
        mobileControls.classList.remove("hidden");
        pause.classList.remove("hidden");
      } else {
        controls.lock();
      }
    }
    if (event.target === canvas) {
      if (intersects[0]) {
        intersects.forEach((intersect) => {
          switch (intersect.object.name) {
            case "lijst_68":
              window.open(
                "https://raw.githubusercontent.com/Websitebystudents/pim-pom/main/kleurplaten/kleurplaten%20Pim%20&%20Pom%20staand_1.pdf"
              );
              break;
            case "lijst_70":
              window.open(
                "https://raw.githubusercontent.com/Websitebystudents/pim-pom/main/kleurplaten/kleurplaten%20Pim%20&%20Pom_4.pdf"
              );
              break;
            case "lijst_71":
              window.open(
                "https://raw.githubusercontent.com/Websitebystudents/pim-pom/main/kleurplaten/kleurplaten%20Pim%20&%20Pom_4.pdf"
              );
              break;
            case "lijst_72":
              window.open(
                "https://raw.githubusercontent.com/Websitebystudents/pim-pom/main/kleurplaten/kleurplaten%20Pim%20&%20Pom_1.pdf"
              );
              break;
            case "lijst_67":
              window.open(
                "https://raw.githubusercontent.com/Websitebystudents/pim-pom/main/kleurplaten/kleurplaten%20Pim%20&%20Pom%20staand_2.pdf"
              );
              break;
            case "lijst_66":
              window.open(
                "https://raw.githubusercontent.com/Websitebystudents/pim-pom/main/kleurplaten/kleurplaten%20Pim%20&%20Pom_3.pdf"
              );
              break;
            case "tv":
              videoDiv.classList.remove("hidden");
              menu.classList.remove("hidden");
              startButton.classList.add("lowerStartButton");
              controls.isLocked = false;
              controls.unlock();
              controlsFront.unlock();
              controlsLeft.unlock();
              controlsRight.unlock();
              controlsUp.unlock();
              controlsDown.unlock();
              break;
          }
        });
      }
    }
  },
  false
);

let keysDown = [];
let acceptedKeys = ["KeyW", "KeyA", "KeyS", "KeyD", "Space"];
var interval;

const onKeyDown = function (event) {
  if (
    controls.isLocked === true &&
    !keysDown.includes(event.code) &&
    acceptedKeys.includes(event.code)
  ) {
    if (event.code === "Space" && !jumping) {
      startJumpInterval();
    } else {
      keysDown.push(event.code);
      if (!interval) {
        interval = setInterval(myTimer, 25);
      }
    }
  }
};

const onKeyUp = function (event) {
  if (controls.isLocked === true) {
    keysDown = keysDown.filter((key) => key !== event.code);
  }
  if (!keysDown[0] && acceptedKeys.includes(event.code)) {
    clearInterval(interval);
    interval = null;
  }
};

function myTimer() {
  if (controls.isLocked === true) {
    if (keysDown.includes("KeyW") && walkFront === true) {
      controls.moveForward(0.15);
      controlsUp.moveForward(0.15);
      controlsDown.moveForward(0.15);
      controlsFront.moveForward(0.15);
      controlsLeft.moveRight(0.15);
      controlsRight.moveRight(-0.15);
    }
    if (keysDown.includes("KeyA") && walkLeft === true) {
      controls.moveRight(-0.15);
      controlsUp.moveRight(-0.15);
      controlsDown.moveRight(-0.15);
      controlsFront.moveRight(-0.15);
      controlsLeft.moveForward(0.15);
      controlsRight.moveForward(-0.15);
    }
    if (keysDown.includes("KeyS") && walkBack === true) {
      controls.moveForward(-0.15);
      controlsUp.moveForward(-0.15);
      controlsDown.moveForward(-0.15);
      controlsFront.moveForward(-0.15);
      controlsLeft.moveRight(-0.15);
      controlsRight.moveRight(0.15);
    }
    if (keysDown.includes("KeyD") && walkRight === true) {
      controls.moveRight(0.15);
      controlsUp.moveRight(0.15);
      controlsDown.moveRight(0.15);
      controlsFront.moveRight(0.15);
      controlsLeft.moveForward(-0.15);
      controlsRight.moveForward(0.15);
    }
  }
}

document.addEventListener("keyup", onKeyUp);

document.addEventListener("keydown", onKeyDown);

document.addEventListener("touchend", function (event) {
  if (
    !event.target.parentElement.parentElement === mobileControls &&
    !event.target.parentElement.parentElement.parentElement === mobileControls
  ) {
    return;
  } else if (
    event.target.id === "forward" ||
    event.target.parentElement.id === "forward"
  ) {
    onKeyUp({ code: "KeyW" });
  } else if (
    event.target.id === "left" ||
    event.target.parentElement.id === "left"
  ) {
    onKeyUp({ code: "KeyA" });
  } else if (
    event.target.id === "jump" ||
    event.target.parentElement.id === "jump"
  ) {
    onKeyUp({ code: "Space" });
  } else if (
    event.target.id === "right" ||
    event.target.parentElement.id === "right"
  ) {
    onKeyUp({ code: "KeyD" });
  } else if (
    event.target.id === "back" ||
    event.target.parentElement.id === "back"
  ) {
    onKeyUp({ code: "KeyS" });
  }
});

document.addEventListener("touchstart", function (event) {
  if (
    (event.target === pause || event.target.parentElement === pause) &&
    menu.classList.contains("hidden")
  ) {
    menu.classList.remove("hidden");
    controls.isLocked = !controls.isLocked;
  } else if (
    !event.target.parentElement.parentElement === mobileControls &&
    !event.target.parentElement.parentElement.parentElement === mobileControls
  ) {
    return;
  } else if (
    event.target.id === "forward" ||
    event.target.parentElement.id === "forward"
  ) {
    onKeyDown({ code: "KeyW" });
  } else if (
    event.target.id === "left" ||
    event.target.parentElement.id === "left"
  ) {
    onKeyDown({ code: "KeyA" });
  } else if (
    event.target.id === "jump" ||
    event.target.parentElement.id === "jump"
  ) {
    onKeyDown({ code: "Space" });
  } else if (
    event.target.id === "right" ||
    event.target.parentElement.id === "right"
  ) {
    onKeyDown({ code: "KeyD" });
  } else if (
    event.target.id === "back" ||
    event.target.parentElement.id === "back"
  ) {
    onKeyDown({ code: "KeyS" });
  }
});

// --------------
// Shadows and lights
// --------------

const scene = new THREE.Scene();
scene.background = new THREE.Color("black");

{
  const skyColor = 0xb1e1ff;
  const groundColor = 0xb97a20;
  const intensity = 1.7;
  const light = new THREE.HemisphereLight(skyColor, groundColor, intensity);
  scene.add(light);
}

{
  const color = 0xffffff;
  const intensity = 1;
  const light = new THREE.DirectionalLight(color, intensity);
  light.position.set(5, 10, 2);
  scene.add(light);
  scene.add(light.target);
}

{
  const gltfLoader = new GLTFLoader();
  gltfLoader.load(
    "https://raw.githubusercontent.com/Websitebystudents/pim-pom/main/model/pim_pom_clubhuis_8.gltf",
    (gltf) => {
      root = gltf.scene;
      scene.add(root);

      camera.lookAt(0, 2, 0);
      cameraFront.lookAt(0, 0, 0);
      cameraLeft.lookAt(-2000, 0, 0);
      cameraRight.lookAt(2000, 0, 0);
      cameraUp.lookAt(0, 0, 0);
      cameraDown.lookAt(0, 0, 0);
      root.children.forEach((child) => {
        if (child.name === "Floor") {
          var groundMaterial = child.material;
          var mesh = new THREE.Mesh(
            new THREE.PlaneBufferGeometry(15, 15),
            groundMaterial
          );
          mesh.rotation.x = -Math.PI / 2;
          scene.add(mesh);
        }
        if (
          child.name === "lijst_68" ||
          child.name === "lijst_70" ||
          child.name === "lijst_71" ||
          child.name === "lijst_72" ||
          child.name === "lijst_67" ||
          child.name === "lijst_66" ||
          child.name === "tv"
        ) {
          lijstjeslijst.push(child);
        }
      });
      setInterval(clickableInterval, 25);
    }
  );
}

// --------------
//  Making stuff clickable
// --------------

let grow = true;
let size = 1;
let lijstjeslijst = [];

function clickableInterval() {
  if (grow === true) {
    size = size + 0.005;
  } else {
    size = size - 0.005;
  }
  if (size > 1) {
    grow = false;
  } else if (size < 0.9) {
    grow = true;
  }
  lijstjeslijst.forEach((lijst) => {
    lijst.scale.set(size, size, size);
  });
}

// --------------
//  Resize to display size
// --------------

function resizeRendererToDisplaySize(renderer) {
  const canvas = renderer.domElement;
  const width = canvas.clientWidth;
  const height = canvas.clientHeight;
  const needResize = canvas.width !== width || canvas.height !== height;
  if (needResize) {
    renderer.setSize(width, height, false);
  }
  return needResize;
}

// --------------
// Render and raycaster
// --------------

const raycaster = new THREE.Raycaster();
const raycasterFront = new THREE.Raycaster();
const raycasterLeft = new THREE.Raycaster();
const raycasterRight = new THREE.Raycaster();
const raycasterUp = new THREE.Raycaster();
const raycasterDown = new THREE.Raycaster();

raycasterFront.far = 1;
raycasterLeft.far = 1;
raycasterRight.far = 1;
raycasterUp.far = 1;
raycasterDown.far = 3;

function render() {
  if (resizeRendererToDisplaySize(renderer)) {
    const canvas = renderer.domElement;
    camera.aspect = canvas.clientWidth / canvas.clientHeight;
    cameraFront.aspect = canvas.clientWidth / canvas.clientHeight;
    cameraLeft.aspect = canvas.clientWidth / canvas.clientHeight;
    cameraRight.aspect = canvas.clientWidth / canvas.clientHeight;
    cameraUp.aspect = canvas.clientWidth / canvas.clientHeight;
    cameraDown.aspect = canvas.clientWidth / canvas.clientHeight;
  }

  if (root) {
    raycaster.setFromCamera({ x: 0, y: 0 }, camera);
    raycasterFront.setFromCamera({ x: 0, y: 0 }, cameraFront);
    raycasterLeft.setFromCamera({ x: 0, y: 0 }, cameraLeft);
    raycasterRight.setFromCamera({ x: 0, y: 0 }, cameraRight);
    raycasterDown.setFromCamera({ x: 0, y: 0 }, cameraDown);
    raycasterUp.setFromCamera({ x: 0, y: 0 }, cameraUp);

    intersects = raycaster.intersectObjects(root.children, true);
    renderer.render(scene, cameraFront);
    const intersectsFront = raycasterFront.intersectObjects(
      root.children,
      true
    );
    renderer.render(scene, cameraLeft);
    const intersectsLeft = raycasterLeft.intersectObjects(root.children, true);
    renderer.render(scene, cameraRight);
    const intersectsRight = raycasterRight.intersectObjects(
      root.children,
      true
    );
    renderer.render(scene, cameraUp);
    const intersectsUp = raycasterUp.intersectObjects(root.children, true);
    renderer.render(scene, cameraDown);
    const intersectsDown = raycasterDown.intersectObjects(root.children, true);

    raycasterLeft.setFromCamera({ x: -200, y: 0 }, cameraLeft);
    raycasterRight.setFromCamera({ x: 200, y: 0 }, cameraRight);
    const intersectsBackLeft = raycasterLeft.intersectObjects(
      root.children,
      true
    );
    const intersectsBackRight = raycasterRight.intersectObjects(
      root.children,
      true
    );

    if (intersects[0] && loaded === false) {
      loader.classList.add("hidden");
      startButton.classList.remove("hidden");
      crosshair.classList.remove("hidden");
      loaded = true;
    }

    if (intersects[0]) {
      intersects.forEach((intersect) => {
        if (
          intersect.object.name === "lijst_68" ||
          intersect.object.name === "lijst_70" ||
          intersect.object.name === "lijst_71" ||
          intersect.object.name === "lijst_72" ||
          intersect.object.name === "lijst_67" ||
          intersect.object.name === "lijst_66" ||
          intersect.object.name === "tv"
        ) {
          intersect.object.scale.set(1.1, 1.1, 1.1);
        }
      });
    }

    walkFront = intersectsFront[0] ? false : true;
    walkBack = intersectsBackLeft[0] && intersectsBackRight[0] ? false : true;
    walkLeft = intersectsLeft[0] ? false : true;
    walkRight = intersectsRight[0] ? false : true;
    if (intersectsUp[0]) {
      speedHeight = 0;
    }

    if (intersectsDown[0] || height <= 2.2 || camera.position.y <= 2.2) {
      if (speedHeight <= 0.1) {
        camera.position.y = 2;
        height = 2;
        clearInterval(jumpInterval);
        speedHeight = 1;
        jumping = false;
      }
    } else {
      if (camera.position.y > 5 && speedHeight === 1 && !jumping) {
        speedHeight = 0;
        jumping = true;
        startJumpInterval();
      }
    }
  }
  renderer.render(scene, currentCamera);

  requestAnimationFrame(render);
}

requestAnimationFrame(render);
