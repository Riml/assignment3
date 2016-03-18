/// <reference path="_reference.ts"/>
// MAIN GAME FILE
// THREEJS Aliases
var Scene = Physijs.Scene;
var Renderer = THREE.WebGLRenderer;
var PerspectiveCamera = THREE.PerspectiveCamera;
var BoxGeometry = THREE.BoxGeometry;
var CubeGeometry = THREE.CubeGeometry;
var PlaneGeometry = THREE.PlaneGeometry;
var SphereGeometry = THREE.SphereGeometry;
var Geometry = THREE.Geometry;
var AxisHelper = THREE.AxisHelper;
var LambertMaterial = THREE.MeshLambertMaterial;
var MeshBasicMaterial = THREE.MeshBasicMaterial;
var LineBasicMaterial = THREE.LineBasicMaterial;
var Material = THREE.Material;
var Line = THREE.Line;
var Mesh = THREE.Mesh;
var Object3D = THREE.Object3D;
var SpotLight = THREE.SpotLight;
var PointLight = THREE.PointLight;
var AmbientLight = THREE.AmbientLight;
var Control = objects.Control;
var GUI = dat.GUI;
var Color = THREE.Color;
var Vector3 = THREE.Vector3;
var Face3 = THREE.Face3;
var Point = objects.Point;
var CScreen = config.Screen;
var Clock = THREE.Clock;
var Texture = THREE.Texture;
//Custom Game Objects
var gameObject = objects.gameObject;
// Setup a Web Worker for Physijs
Physijs.scripts.worker = "/Scripts/lib/Physijs/physijs_worker.js";
Physijs.scripts.ammo = "/Scripts/lib/Physijs/examples/js/ammo.js";
// setup an IIFE structure (Immediately Invoked Function Expression)
var game = (function () {
    // declare game objects
    var havePointerLock;
    var element;
    var scene = new Scene(); // Instantiate Scene Object
    var renderer;
    var camera;
    var control;
    var gui;
    var stats;
    var blocker;
    var instructions;
    var spotLight;
    var groundGeometry;
    var groundPhysicsMaterial;
    var ground;
    var clock;
    var playerGeometry;
    var playerMaterial;
    var player;
    var sphereGeometry;
    var sphereMaterial;
    var sphere;
    var keyboardControls;
    var mouseControls;
    var isGrounded;
    var velocity = new Vector3(0, 0, 0);
    var prevTime = 0;
    var directionLineMaterial;
    var directionLineGeometry;
    var directionLine;
    var playerTexture;
    var ambientLight;
    var TILE_SIZE; //to scale map(walls, hazards,ground and maybe skybox), should be constant
    function init() {
        // Create to HTMLElements
        blocker = document.getElementById("blocker");
        instructions = document.getElementById("instructions");
        //check to see if pointerlock is supported
        havePointerLock = 'pointerLockElement' in document ||
            'mozPointerLockElement' in document ||
            'webkitPointerLockElement' in document;
        // Instantiate Game Controls
        keyboardControls = new objects.KeyboardControls();
        mouseControls = new objects.MouseControls();
        //define basic game values
        TILE_SIZE = 5;
        // Check to see if we have pointerLock
        if (havePointerLock) {
            element = document.body;
            instructions.addEventListener('click', function () {
                // Ask the user for pointer lock
                console.log("Requesting PointerLock");
                element.requestPointerLock = element.requestPointerLock ||
                    element.mozRequestPointerLock ||
                    element.webkitRequestPointerLock;
                element.requestPointerLock();
            });
            document.addEventListener('pointerlockchange', pointerLockChange);
            document.addEventListener('mozpointerlockchange', pointerLockChange);
            document.addEventListener('webkitpointerlockchange', pointerLockChange);
            document.addEventListener('pointerlockerror', pointerLockError);
            document.addEventListener('mozpointerlockerror', pointerLockError);
            document.addEventListener('webkitpointerlockerror', pointerLockError);
        }
        // Scene changes for Physijs
        scene.name = "Main";
        scene.fog = new THREE.Fog(0xffffff, 0, 750);
        scene.setGravity(new THREE.Vector3(0, -10, 0));
        scene.addEventListener('update', function () {
            scene.simulate(undefined, 2);
        });
        // setup a THREE.JS Clock object
        clock = new Clock();
        setupRenderer(); // setup the default renderer
        // --------------------------------------------Add Lights---------------------------------------------------------
        spotLight = new SpotLight(0xffffff);
        spotLight.position.set(20, 80, -15);
        spotLight.castShadow = true;
        spotLight.intensity = 2;
        spotLight.lookAt(new Vector3(0, 0, 0));
        spotLight.shadowCameraNear = 2;
        spotLight.shadowCameraFar = 200;
        spotLight.shadowCameraLeft = -5;
        spotLight.shadowCameraRight = 5;
        spotLight.shadowCameraTop = 5;
        spotLight.shadowCameraBottom = -5;
        spotLight.shadowMapWidth = 2048;
        spotLight.shadowMapHeight = 2048;
        spotLight.shadowDarkness = 0.5;
        spotLight.name = "Spot Light";
        scene.add(spotLight);
        ambientLight = new AmbientLight(0x777777);
        scene.add(ambientLight);
        // ----------------------------------------Burnt Ground-----------------------------------------------------------
        var groundTexture = new THREE.TextureLoader().load("./Assets/Textures/ground1.jpg");
        groundTexture.wrapS = THREE.RepeatWrapping;
        groundTexture.wrapT = THREE.RepeatWrapping;
        groundTexture.repeat.set(2, 2);
        var groundTextureNormal = new THREE.TextureLoader().load("./Assets/Textures/ground1Normal.png");
        groundTextureNormal.wrapS = THREE.RepeatWrapping;
        groundTextureNormal.wrapT = THREE.RepeatWrapping;
        groundTextureNormal.repeat.set(2, 2);
        var groundMaterial = new THREE.MeshPhongMaterial;
        groundMaterial.map = groundTexture;
        groundMaterial.bumpMap = groundTextureNormal;
        groundMaterial.bumpScale = 1.2;
        /*
        for(var x=0;x<24;x++)
        {
             for(var z=0;z<24;z++){
                 
             }
        }
        */
        groundGeometry = new BoxGeometry(24 * TILE_SIZE, 1, 46 * TILE_SIZE);
        groundPhysicsMaterial = Physijs.createMaterial(groundMaterial, 0, 0);
        ground = new Physijs.ConvexMesh(groundGeometry, groundPhysicsMaterial, 0);
        ground.receiveShadow = true;
        ground.name = "Ground";
        scene.add(ground);
        console.log("Added Burnt Ground to scene");
        // -------------------------------------------Player Object-----------------------------------------
        playerTexture = new THREE.TextureLoader().load("./Assets/Textures/Cat.jpg");
        var myPlayer;
        var myPlayerGeometry = new SphereGeometry(2, 20, 20);
        var myPlayerMaterial = new LambertMaterial({ color: 0xFFffFF, map: playerTexture });
        myPlayer = new Mesh(myPlayerGeometry, myPlayerMaterial);
        myPlayer.rotation.y = THREE.Math.degToRad(90);
        playerGeometry = new SphereGeometry(2, 20, 20);
        playerMaterial = Physijs.createMaterial(new LambertMaterial({ color: 0xFFffFF, wireframe: true }), 0.4, 0);
        player = new Physijs.BoxMesh(playerGeometry, playerMaterial, 5);
        player.receiveShadow = true;
        player.castShadow = true;
        player.name = "Player";
        var geometry = new THREE.CylinderGeometry(0.01, 1, 3, 3);
        var material = new THREE.MeshBasicMaterial({ color: 0xffff00, wireframe: true });
        var cylinder1 = new THREE.Mesh(geometry, material);
        var cylinder2 = new THREE.Mesh(geometry, material);
        cylinder1.position.set(1, 1.47, 0);
        cylinder2.position.set(-1, 1.47, 0);
        player.add(myPlayer);
        player.add(cylinder1);
        player.add(cylinder2);
        player.position.set(0, 30, 10);
        scene.add(player);
        console.log("Added Player to Scene");
        //---------------------------Level Creation-----------------------------------------------
        createWall();
        //------------SETUP THE CAMER:create parent.child for camera-player-------------------------
        setupCamera();
        player.add(camera);
        //------------------------------------------------ Collision Check--------------------------
        player.addEventListener('collision', function (event) {
            if (event.name === "Ground") {
                console.log("player hit the ground");
                isGrounded = true;
            }
            if (event.name === "Sphere") {
                console.log("player hit the sphere");
            }
        });
        // -----------------------------------Add DirectionLine------------------------------------
        directionLineMaterial = new LineBasicMaterial({ color: 0xffff00 });
        directionLineGeometry = new Geometry();
        directionLineGeometry.vertices.push(new Vector3(0, 0, 0)); // line origin
        directionLineGeometry.vertices.push(new Vector3(0, 0, -50)); // end of the line
        directionLine = new Line(directionLineGeometry, directionLineMaterial);
        player.add(directionLine);
        console.log("Added DirectionLine to the Player");
        // Sphere Object
        sphereGeometry = new SphereGeometry(2, 32, 32);
        sphereMaterial = Physijs.createMaterial(new LambertMaterial({ color: 0x00ff00 }), 0.4, 0);
        sphere = new Physijs.SphereMesh(sphereGeometry, sphereMaterial, 1);
        sphere.position.set(0, 60, 5);
        sphere.receiveShadow = true;
        sphere.castShadow = true;
        sphere.name = "Sphere";
        //scene.add(sphere);
        //console.log("Added Sphere to Scene");
        //---------------------------------- add controls-----------------------------------------------
        gui = new GUI();
        control = new Control();
        addControl(control);
        // Add framerate stats
        addStatsObject();
        console.log("Added Stats to scene...");
        document.body.appendChild(renderer.domElement);
        gameLoop(); // render the scene	
        scene.simulate();
        window.addEventListener('resize', onWindowResize, false);
    }
    //end of init
    // if not vertical, then horizontal
    function createWall(wallLenght, startTileX, startTileZ, vertical, name) {
        var thisWallTexture = new THREE.TextureLoader().load("./Assets/Textures/ground1.jpg");
        thisWallTexture.wrapS = THREE.RepeatWrapping;
        thisWallTexture.wrapT = THREE.RepeatWrapping;
        thisWallTexture.repeat.set(1, 1);
        var thisWallTextureNormal = new THREE.TextureLoader().load("./Assets/Textures/ground1Normal.png");
        thisWallTextureNormal.wrapS = THREE.RepeatWrapping;
        thisWallTextureNormal.wrapT = THREE.RepeatWrapping;
        thisWallTextureNormal.repeat.set(1, 1);
        var thisWallMaterial = new THREE.MeshPhongMaterial;
        thisWallMaterial.map = thisWallTexture;
        thisWallMaterial.bumpMap = thisWallTextureNormal;
        thisWallMaterial.bumpScale = 1.2;
        var thisWallGeometry = new BoxGeometry(wallLenght * vertical + 0.1, 10, wallLenght * (1 - vertical) + 0.1);
        var thisWallPhysicsMaterial = Physijs.createMaterial(thisWallMaterial, 0, 0);
        var wall = new Physijs.ConvexMesh(thisWallGeometry, thisWallPhysicsMaterial, 0);
        wall.position.set(startTileX * TILE_SIZE - (wallLenght * vertical) / 2, 0, startTileZ * TILE_SIZE - (wallLenght * (1 - vertical)));
        wall.receiveShadow = true;
        wall.name = "name";
        scene.add(wall);
    }
    //PointerLockChange Event Handler
    function pointerLockChange(event) {
        if (document.pointerLockElement === element) {
            // enable our mouse and keyboard controls
            keyboardControls.enabled = true;
            mouseControls.enabled = true;
            blocker.style.display = 'none';
        }
        else {
            // disable our mouse and keyboard controls
            keyboardControls.enabled = false;
            mouseControls.enabled = false;
            blocker.style.display = '-webkit-box';
            blocker.style.display = '-moz-box';
            blocker.style.display = 'box';
            instructions.style.display = '';
            console.log("PointerLock disabled");
        }
    }
    //PointerLockError Event Handler
    function pointerLockError(event) {
        instructions.style.display = '';
        console.log("PointerLock Error Detected!!");
    }
    // Window Resize Event Handler
    function onWindowResize() {
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(window.innerWidth, window.innerHeight);
    }
    function addControl(controlObject) {
        /* ENTER CODE for the GUI CONTROL HERE */
    }
    // Add Frame Rate Stats to the Scene
    function addStatsObject() {
        stats = new Stats();
        stats.setMode(0);
        stats.domElement.style.position = 'absolute';
        stats.domElement.style.left = '0px';
        stats.domElement.style.top = '0px';
        document.body.appendChild(stats.domElement);
    }
    // Setup main game loop
    function gameLoop() {
        stats.update();
        checkControls();
        // render using requestAnimationFrame
        requestAnimationFrame(gameLoop);
        // render the scene
        renderer.render(scene, camera);
    }
    //check controls
    function checkControls() {
        if (keyboardControls.enabled) {
            velocity = new Vector3();
            var time = performance.now();
            var delta = (time - prevTime) / 1000;
            if (isGrounded) {
                var direction = new Vector3(0, 0, 0);
                if (keyboardControls.moveForward) {
                    velocity.z -= 800.0 * delta;
                }
                if (keyboardControls.moveLeft) {
                    velocity.x -= 800.0 * delta;
                }
                if (keyboardControls.moveBackward) {
                    velocity.z += 800.0 * delta;
                }
                if (keyboardControls.moveRight) {
                    velocity.x += 800.0 * delta;
                }
                if (keyboardControls.jump) {
                    velocity.y += 8000.0 * delta;
                    if (player.position.y > 4) {
                        isGrounded = false;
                    }
                }
                player.setDamping(0.7, 0.1);
                // Changing player's rotation
                player.setAngularVelocity(new Vector3(0, -mouseControls.yaw, 0));
                direction.addVectors(direction, velocity);
                direction.applyQuaternion(player.quaternion);
                if (Math.abs(player.getLinearVelocity().x) < 20 && Math.abs(player.getLinearVelocity().y) < 10) {
                    player.applyCentralForce(direction);
                }
                cameraLook();
            } // isGrounded ends
            mouseControls.pitch = 0;
            mouseControls.yaw = 0;
            prevTime = time;
        } // Controls Enabled ends
        else {
            player.setAngularVelocity(new Vector3(0, 0, 0));
        }
    }
    //camera look function 
    function cameraLook() {
        var zenith = THREE.Math.degToRad(5);
        var nadir = THREE.Math.degToRad(-30);
        var cameraPitch = camera.rotation.x - mouseControls.pitch;
        camera.rotation.x = THREE.Math.clamp(cameraPitch, nadir, zenith);
        //constrain camera pitch
    }
    // Setup default renderer
    function setupRenderer() {
        renderer = new Renderer({ antialias: true });
        renderer.setClearColor(0x404040, 1.0);
        renderer.setPixelRatio(window.devicePixelRatio);
        renderer.setSize(CScreen.WIDTH, CScreen.HEIGHT);
        renderer.shadowMap.enabled = true;
        console.log("Finished setting up Renderer...");
    }
    // Setup main camera for the scene
    function setupCamera() {
        camera = new PerspectiveCamera(35, config.Screen.RATIO, 0.1, 100);
        camera.position.set(0, 9, 20);
        camera.lookAt(player.position);
        console.log("Finished setting up Camera...");
    }
    window.onload = init;
    return {
        scene: scene
    };
})();

//# sourceMappingURL=game.js.map
