let moveMode = false;
let rotateMode = false;

let moveButton = undefined;
let rotateButton = undefined;

let loadingOverlay = undefined;
let fullscreenOverlay = undefined;
let rotateOverlay = undefined;
let snapOverlay = undefined;
let previewOverlay = undefined;

let positionLog = undefined;
let rotationLog = undefined;
let zoomLog = undefined;

let modelEntity = undefined;  // Updated to modelEntity

const rotationSensitivity = 1.5;
const positionSensitivity = 0.03;
const scaleSensitivity = 0.01;

window.onload = () => {
    // Initialize DOM elements
    positionLog = document.getElementById('positionLog');
    rotationLog = document.getElementById('rotationLog');
    zoomLog = document.getElementById('zoomLog');
    modelEntity = document.getElementById("bananaModel"); // Default to banana model initially
    moveButton = document.getElementById('move-button');
    rotateButton = document.getElementById('rotate-button');

    loadingOverlay = document.getElementById('loading-overlay');
    fullscreenOverlay = document.getElementById('fullscreen-overlay');
    rotateOverlay = document.getElementById('rotate-overlay');
    snapOverlay = document.getElementById('snap-overlay');
    previewOverlay = document.getElementById('preview-overlay');

    makeOverlay('snap', 'hide');
    makeOverlay('preview', 'hide');
    handleOrientation();
    handleFullScreen();

    document.getElementById("save-capture-button").addEventListener('click', () => {
        let link = document.createElement("a");
        let fileName = new Date().toLocaleString().replaceAll(':', '-').replaceAll('/', '-') + " AR.png";
        link.download = fileName;
        link.setAttribute("download", fileName);
        link.setAttribute("href", document.getElementById('preview-img').src);
        link.click();

        makeOverlay('preview', 'hide');
    });

    document.getElementById("retake-button").addEventListener('click', () => {
        makeOverlay('preview', 'hide');
    });

    modelEntity.addEventListener("model-loaded", () => { makeOverlay('loading', 'hide'); });
    window.matchMedia('screen and (orientation:portrait)')
        .addEventListener("change", e => handleOrientation(e));
    window.addEventListener("fullscreenchange", handleFullScreen, false);
    window.addEventListener('resize', () => {
        let newHeight = window.innerHeight + 'px';
        loadingOverlay.style.height = newHeight;
        fullscreenOverlay.style.height = newHeight;
        rotateOverlay.style.height = newHeight;
        snapOverlay.style.height = newHeight;
        previewOverlay.style.height = newHeight;
        document.getElementsByClassName('controls')[0].style.height = newHeight;
    });

    let activeRegion = ZingTouch.Region(document.body, false, false);
    let containerElement = document.getElementsByTagName('a-scene')[0];
    let pinch = new ZingTouch.Distance();
    activeRegion.bind(containerElement, pinch, function (event) {
        let factor = event.detail.change * scaleSensitivity;
        let scale = modelEntity.getAttribute('scale').x;
        scale += factor;
        modelEntity.object3D.scale.set(scale, scale, scale);

        zoomLog.innerText = "Scale: " + scale.toFixed(3);
    });

    let swipe = new ZingTouch.Pan({
        numInputs: 1,
        threshold: 5
    });

    activeRegion.bind(containerElement, swipe, function (event) {
        if (moveMode) {
            let position = modelEntity.getAttribute('position');
            let direction = calculateDirection(event.detail.data[0].currentDirection);

            if (!direction) return;

            switch (direction) {
                case 'up': position.y += positionSensitivity; break;
                case 'left': position.x -= positionSensitivity; break;
                case 'down': position.y -= positionSensitivity; break;
                case 'right': position.x += positionSensitivity; break;
            }

            modelEntity.object3D.position.set(position.x, position.y, position.z);
            positionLog.innerText = "Position: " + position.x.toFixed(3) + ', ' + position.y.toFixed(3) + ', ' + position.z.toFixed(3);
        } else if (rotateMode) {
            let rotation = modelEntity.getAttribute('rotation');
            let direction = calculateDirection(event.detail.data[0].currentDirection);

            if (!direction) return;

            switch (direction) {
                case 'up': rotation.x -= rotationSensitivity; break;
                case 'down': rotation.x += rotationSensitivity; break;
                case 'left': rotation.y -= rotationSensitivity; break;
                case 'right': rotation.y += rotationSensitivity; break;
            }

            modelEntity.object3D.rotation.set(
                THREE.Math.degToRad(rotation.x),
                THREE.Math.degToRad(rotation.y),
                THREE.Math.degToRad(rotation.z)
            );

            rotationLog.innerText = "Rotation: " + rotation.x.toFixed(3) + ', ' + rotation.y.toFixed(3) + ', ' + rotation.z.toFixed(3);
        }
    });

    // Marker detection and model switching
    const bananaMarker = document.querySelector('[id="bananaModel"]');
    const appleMarker = document.querySelector('[id="appleModel"]');

    bananaMarker.addEventListener('markerFound', () => {
        modelEntity.setAttribute('gltf-model', './assets/3d-models/banana.glb'); // Path to the banana model
        modelEntity.object3D.position.set(0, 0, 0); // Reset position if needed
        modelEntity.object3D.rotation.set(0, 0, 0); // Reset rotation if needed
        modelEntity.object3D.scale.set(1, 1, 1);   // Reset scale if needed
        console.log('Banana marker detected');
    });

    appleMarker.addEventListener('markerFound', () => {
        modelEntity.setAttribute('gltf-model', './assets/3d-models/apple.glb'); // Path to the apple model
        modelEntity.object3D.position.set(0, 0, 0); // Reset position if needed
        modelEntity.object3D.rotation.set(0, 0, 0); // Reset rotation if needed
        modelEntity.object3D.scale.set(1, 1, 1);   // Reset scale if needed
        console.log('Apple marker detected');
    });
};

