import "./style.css";
import * as THREE from "three";

window.focus();

function collisionDetection(obj1, obj2) {
  return obj1.intersectsBox(obj2);
}

function pickRandom(array) {
  return array[Math.floor(Math.random() * array.length)];
}

function getDistance(coordinate1, coordinate2) {
  const horizontalDistance = coordinate2.x - coordinate1.x;
  const verticalDistance = coordinate2.y - coordinate1.y;
  return Math.sqrt(horizontalDistance ** 2 + verticalDistance ** 2);
}

const vehicleColors = [0xa52523, 0xbdb638, 0x78b14b, 0xff9f1c];

const lawnGreen = "#67C240";
const trackColor = "#546E90";

let health = 100;
let fuel = 100;
let time = 0;
let score = 0;
let fuelDistance = 0;
let speed = 0;
let acceleration = 0.00001;
let opponentSpeed = 0.001;
const playerAngleInitial = Math.PI;
const camAngleInitial = Math.PI / 50;
let playerAngleMoved;
let playerRadius;
let accelerate = false;
let decelerate = false;
let otherVehicles = [];
let lastTimestamp;
let ready;

const trackRadius = 225;
const trackWidth = 45;
const innerTrackRadius = trackRadius - trackWidth;
const outerTrackRadius = trackRadius + trackWidth;

// const scoreElement = document.getElementById("score");
// const buttonsElement = document.getElementById("buttons");
// const instructionsElement = document.getElementById("instructions");
// const resultsElement = document.getElementById("results");

// setTimeout(() => {
//   if (ready) instructionsElement.style.opacity = 1;
//   buttonsElement.style.opacity = 1;
//   youtubeLogo.style.opacity = 1;
// }, 4000);

const insetHeight = window.innerHeight / 4;
const insetWidth = window.innerWidth / 4;

const aspectRatio = window.innerWidth / window.innerHeight;
const cameraWidth = 960;
const cameraHeight = cameraWidth / aspectRatio;

const camera = new THREE.OrthographicCamera(
  cameraWidth / -2,
  cameraWidth / 2,
  cameraHeight / 2,
  cameraHeight / -2,
  50,
  700
);

camera.position.set(0, -210, 300);
camera.lookAt(0, 0, 0);

const thirdPersonCamera = new THREE.PerspectiveCamera(
  90,
  aspectRatio,
  1,
  100000
);

thirdPersonCamera.position.set(-trackRadius, 0, 100);
thirdPersonCamera.lookAt(-trackRadius, 0, 0);

const scene = new THREE.Scene();

const playerCar = Car();
scene.add(playerCar);

for (let i = 0; i < 3; i++) {
  const angle = (i * Math.PI) / 2;
  const bool = Math.random() >= 0.5;
  const radius = bool
    ? trackRadius - (i * trackWidth) / 2
    : trackRadius + (i * trackWidth) / 2;
  const mesh = Car();
  const box = new THREE.Box3().setFromObject(mesh);
  scene.add(mesh);
  otherVehicles.push({ mesh, radius, angle, box });
}

function moveOtherVehicles(timeDelta) {
  otherVehicles.forEach((vehicle) => {
    vehicle.angle -= opponentSpeed * timeDelta;
    const vehicleX = Math.cos(vehicle.angle) * vehicle.radius;
    const vehicleY = Math.sin(vehicle.angle) * vehicle.radius;
    const rotation = vehicle.angle - Math.PI / 2;

    vehicle.mesh.position.x = vehicleX;
    vehicle.mesh.position.y = vehicleY;
    vehicle.mesh.rotation.z = rotation;
  });
}

renderMap(cameraWidth, cameraHeight * 2);

const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
scene.add(ambientLight);

const dirLight = new THREE.DirectionalLight(0xffffff, 0.6);
dirLight.position.set(100, -300, 300);
dirLight.castShadow = true;
dirLight.shadow.mapSize.width = 1024;
dirLight.shadow.mapSize.height = 1024;
dirLight.shadow.camera.left = -400;
dirLight.shadow.camera.right = 350;
dirLight.shadow.camera.top = 400;
dirLight.shadow.camera.bottom = -300;
dirLight.shadow.camera.near = 100;
dirLight.shadow.camera.far = 800;
scene.add(dirLight);

const renderer = new THREE.WebGL1Renderer({
  antialias: true,
  powerPreference: "high-performance",
});
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

reset();

function getPlayerSpeed() {
  if (accelerate) {
    speed += acceleration;
    return speed;
  }
  if (decelerate) {
    speed -= acceleration;
    return speed;
  }
  return speed;
}

function movePlayerCar(timeDelta) {
  const playerSpeed = getPlayerSpeed();
  playerAngleMoved -= playerSpeed * timeDelta;

  const totalPlayerAngle = playerAngleInitial + playerAngleMoved;

  const playerX = Math.cos(totalPlayerAngle) * playerRadius;
  const playerY = Math.sin(totalPlayerAngle) * playerRadius;

  playerCar.position.x = playerX;
  playerCar.position.y = playerY;
  playerCar.rotation.z = totalPlayerAngle - Math.PI / 2;

  const cameraX = Math.cos(totalPlayerAngle + camAngleInitial) * playerRadius;
  const cameraY = Math.sin(totalPlayerAngle + camAngleInitial) * playerRadius;

  // thirdPersonCamera.position.set(cameraX, cameraY, 100);
  thirdPersonCamera.lookAt(playerX, playerY, 20);
}

function reset() {
  playerAngleMoved = 0;
  score = 0;
  health = 100;
  fuel = 100;
  playerRadius = trackRadius;
  movePlayerCar(0);
  lastTimestamp = undefined;

  renderer.setViewport(0, 0, window.innerWidth, window.innerHeight);
  renderer.render(scene, thirdPersonCamera);
  renderer.setScissorTest(true);
  renderer.setScissor(
    16,
    window.innerHeight - insetHeight - 16,
    insetWidth,
    insetHeight
  );
  renderer.setViewport(
    16,
    window.innerHeight - insetHeight - 16,
    insetWidth,
    insetHeight
  );
  renderer.render(scene, camera);
  renderer.setScissorTest(false);
  ready = true;
}

function animation(timestamp) {
  if (!lastTimestamp) {
    lastTimestamp = timestamp;
    return;
  }

  const timeDelta = timestamp - lastTimestamp;

  movePlayerCar(timeDelta);

  const laps = Math.floor(Math.abs(playerAngleMoved) / (Math.PI * 2));

  if (laps != score) {
    score = laps;
    // score.Element.innerText = score;
  }

  moveOtherVehicles(timeDelta);

  renderer.setViewport(0, 0, window.innerWidth, window.innerHeight);
  renderer.render(scene, thirdPersonCamera);
  renderer.setScissorTest(true);
  renderer.setScissor(
    16,
    window.innerHeight - insetHeight - 16,
    insetWidth,
    insetHeight
  );
  renderer.setViewport(
    16,
    window.innerHeight - insetHeight - 16,
    insetWidth,
    insetHeight
  );
  renderer.render(scene, camera);
  renderer.setScissorTest(false);
  lastTimestamp = timestamp;

  opponentCollision();
  handleHUD();
}

function startGame() {
  if (ready) {
    ready = false;
    renderer.setAnimationLoop(animation);
  }
}

function getLineMarkings(mapWidth, mapHeight) {
  const canvas = document.createElement("canvas");
  canvas.width = mapWidth;
  canvas.height = mapHeight;
  const context = canvas.getContext("2d");

  context.fillStyle = trackColor;
  context.fillRect(0, 0, mapWidth, mapHeight);

  context.lineWidth = 2;
  context.strokeStyle = "#E0FFFF";
  context.setLineDash([10, 14]);

  context.beginPath();
  context.arc(mapWidth / 2, mapHeight / 2, trackRadius, 0, Math.PI * 2);
  context.stroke();

  return new THREE.CanvasTexture(canvas);
}

function getIsland() {
  const island = new THREE.Shape();

  island.absarc(0, 0, innerTrackRadius, 0, Math.PI * 2, false);

  return island;
}

function getOuterField(mapWidth, mapHeight) {
  const field = new THREE.Shape();

  field.moveTo(-mapWidth / 2, -mapHeight / 2);
  field.lineTo(0, -mapHeight / 2);
  field.absarc(0, 0, outerTrackRadius, -Math.PI / 2, (3 * Math.PI) / 2, true);
  field.lineTo(0, -mapHeight / 2);
  field.lineTo(mapWidth / 2, -mapHeight / 2);
  field.lineTo(mapWidth / 2, mapHeight / 2);
  field.lineTo(-mapWidth / 2, mapHeight / 2);

  return field;
}

function renderMap(mapWidth, mapHeight) {
  const lineMarkingsTexture = getLineMarkings(mapWidth, mapHeight);

  const planeGeometry = new THREE.PlaneGeometry(mapWidth, mapHeight);
  const planeMaterial = new THREE.MeshLambertMaterial({
    map: lineMarkingsTexture,
  });
  const plane = new THREE.Mesh(planeGeometry, planeMaterial);
  scene.add(plane);

  const island = getIsland();
  const outerFeild = getOuterField(mapWidth, mapHeight);

  const fieldGeometry = new THREE.ExtrudeGeometry([island, outerFeild], {
    depth: 6,
    bevelEnabled: false,
  });

  const fieldMesh = new THREE.Mesh(fieldGeometry, [
    new THREE.MeshLambertMaterial({ color: lawnGreen }),
    new THREE.MeshLambertMaterial({ color: 0x23311c }),
  ]);
  scene.add(fieldMesh);
}

window.addEventListener("keydown", function (event) {
  if (event.key === "w") {
    startGame();
    accelerate = true;
    return;
  }
  if (event.key === "s") {
    decelerate = true;
    return;
  }
  if (event.key === "R" || event.key === "r") {
    reset();
    return;
  }
  if (event.key === "a" && playerRadius <= trackRadius + trackWidth) {
    playerRadius += 1;
    return;
  }
  if (event.key === "d" && playerRadius >= trackRadius - trackWidth) {
    playerRadius -= 1;
    return;
  }
});

window.addEventListener("keyup", function (event) {
  if (event.key === "w") {
    accelerate = false;
    return;
  }
  if (event.key === "s") {
    decelerate = false;
    return;
  }
});

function getCarFrontTexture() {
  const canvas = document.createElement("canvas");
  canvas.width = 64;
  canvas.height = 32;
  const context = canvas.getContext("2d");

  context.fillStyle = "#ffffff";
  context.fillRect(0, 0, 64, 32);

  context.fillStyle = "#666666";
  context.fillRect(8, 8, 48, 24);

  return new THREE.CanvasTexture(canvas);
}

function getCarSideTexture() {
  const canvas = document.createElement("canvas");
  canvas.width = 128;
  canvas.height = 32;
  const context = canvas.getContext("2d");

  context.fillStyle = "#ffffff";
  context.fillRect(0, 0, 128, 32);

  context.fillStyle = "#666666";
  context.fillRect(10, 8, 38, 24);
  context.fillRect(58, 8, 60, 24);

  return new THREE.CanvasTexture(canvas);
}

function Wheel() {
  const wheel = new THREE.Mesh(
    new THREE.BoxBufferGeometry(12, 33, 12),
    new THREE.MeshLambertMaterial({ color: 0x333333 })
  );
  wheel.position.z = 6;
  return wheel;
}

function Car() {
  const car = new THREE.Group();

  const color = pickRandom(vehicleColors);

  const main = new THREE.Mesh(
    new THREE.BoxBufferGeometry(60, 30, 15),
    new THREE.MeshLambertMaterial({ color })
  );
  main.position.z = 12;
  main.castShadow = true;
  main.receiveShadow = true;
  car.add(main);

  const carFrontTexture = getCarFrontTexture();
  carFrontTexture.center = new THREE.Vector2(0.5, 0.5);
  carFrontTexture.rotation = Math.PI / 2;

  const carBackTexture = getCarFrontTexture();
  carBackTexture.center = new THREE.Vector2(0.5, 0.5);
  carBackTexture.rotation = -Math.PI / 2;

  const carRightSideTexture = getCarSideTexture();

  const carLeftSideTexture = getCarSideTexture();
  carLeftSideTexture.flipY = false;

  const cabin = new THREE.Mesh(new THREE.BoxBufferGeometry(33, 24, 12), [
    new THREE.MeshLambertMaterial({ map: carFrontTexture }),
    new THREE.MeshLambertMaterial({ map: carBackTexture }),
    new THREE.MeshLambertMaterial({ map: carLeftSideTexture }),
    new THREE.MeshLambertMaterial({ map: carRightSideTexture }),
    new THREE.MeshLambertMaterial({ color: 0xffffff }),
    new THREE.MeshLambertMaterial({ color: 0xffffff }),
  ]);
  cabin.position.x = -6;
  cabin.position.z = 25.5;
  cabin.castShadow = true;
  cabin.receiveShadow = true;
  car.add(cabin);

  const backWheel = Wheel();
  backWheel.position.x = -18;
  car.add(backWheel);

  const frontWheel = Wheel();
  frontWheel.position.x = 18;
  car.add(frontWheel);

  return car;
}

function opponentCollision() {
  for (let i = 0; i < otherVehicles.length; i++) {
    var box1 = new THREE.Box3().setFromObject(playerCar);
    var box2 = new THREE.Box3().setFromObject(otherVehicles[i].mesh);
    if (collisionDetection(box1, box2)) {
      health -= 1;
      console.log(health);
    }
  }
}

function handleHUD() {
  document.getElementById("healthValue").innerHTML = health;
  document.getElementById("fuelValue").innerHTML = fuel;
  document.getElementById("timeValue").innerHTML = time;
  document.getElementById("scoreValue").innerHTML = score;
  document.getElementById("fuelDistanceValue").innerHTML = fuelDistance;
}