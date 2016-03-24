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
    //------------------------ declare game objects-------------------------------
    //basic
    var havePointerLock;
    var element;
    var scene = new Scene(); // Instantiate Scene Object
    var renderer;
    var camera;
    var control;
    var stats;
    var blocker;
    var instructions;
    var spotLight;
    var groundGeometry;
    var ambientLight;
    //physijs
    var groundPhysicsMaterial;
    var ground;
    var clock;
    //controls
    var keyboardControls;
    var mouseControls;
    var isGrounded;
    var velocity = new Vector3(0, 0, 0);
    var prevTime = 0;
    //Player realted variables
    var playerVisual;
    var catEars;
    var catTextures;
    var catMaterials; // sounds creepy, but what to do
    var currentCat; //0-fat,1-fast, 2-royal
    var catMasses;
    var catVelocities;
    var currentCatMaterial;
    var playerGeometry;
    var playerMaterial;
    var player;
    //EaselJS and friends  
    var assests;
    var canvas;
    var stage;
    var scoreLabel;
    var scoreValue;
    var livesLabel;
    var livesValue;
    var TILE_SIZE; //to scale map(walls, hazards,ground and maybe skybox), should be constant
    var manifest = [
        { id: "land", src: "../../Assets/sound/Land.wav" }
    ];
    function setupScoreboard() {
        scoreValue = 0;
        scoreLabel = new createjs.Text("Score: " + scoreValue, "40px Arial", "#FFffFF");
        scoreLabel.x = config.Screen.WIDTH * 0.1;
        scoreLabel.y = (config.Screen.HEIGHT * 0.1) * 0.3;
        stage.addChild(scoreLabel);
    }
    function preload() {
        assests = new createjs.LoadQueue();
        assests.installPlugin(createjs.Sound);
        assests.on("complete", init, this);
        assests.loadManifest(manifest);
    }
    function setupCanvas() {
        canvas = document.getElementById("canvas");
        canvas.setAttribute("width", config.Screen.WIDTH.toString());
        canvas.setAttribute("height", (config.Screen.HEIGHT * 0.1).toString());
        canvas.style.backgroundColor = '#001100';
        stage = new createjs.Stage(canvas);
    }
    function init() {
        setupCanvas();
        scene.setGravity(new Vector3(0, 0, 0));
        // Create to HTMLElements
        blocker = document.getElementById("blocker");
        instructions = document.getElementById("instructions");
        setupCanvas();
        setupScoreboard();
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
        //-------------------------- Scene changes for Physijs-------------------------------------------------------
        scene.name = "Main";
        scene.fog = new THREE.Fog(0xffffff, 0, 750);
        //scene.setGravity(new THREE.Vector3(0, -10, 0));
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
        var groundTexture = new THREE.TextureLoader().load("./Assets/Textures/floor.png");
        groundTexture.wrapS = THREE.RepeatWrapping;
        groundTexture.wrapT = THREE.RepeatWrapping;
        groundTexture.repeat.set(1, 1);
        var groundTextureNormal = new THREE.TextureLoader().load("./Assets/Textures/floorNormal.png");
        groundTextureNormal.wrapS = THREE.RepeatWrapping;
        groundTextureNormal.wrapT = THREE.RepeatWrapping;
        groundTextureNormal.repeat.set(1, 1);
        var groundMaterial = new THREE.MeshPhongMaterial;
        groundMaterial.map = groundTexture;
        groundMaterial.bumpMap = groundTextureNormal;
        groundMaterial.bumpScale = 1.2;
        //double size tiles
        for (var x = 0; x < 23; x++) {
            for (var z = 0; z < 12; z++) {
                //pits first-block
                if ((x == 9 && z == 9) || (x == 9 && z == 10) || (x == 9 && z == 11) ||
                    (x == 10 && z == 10) || (x == 10 && z == 11)) { }
                else if ((x == 2 && z == 4) || (x == 2 && z == 5) || (x == 2 && z == 6)) { }
                else {
                    groundGeometry = new BoxGeometry(TILE_SIZE * 1.999, 0.2, TILE_SIZE * 1.999);
                    groundPhysicsMaterial = Physijs.createMaterial(groundMaterial, 0.1, 0.1);
                    ground = new Physijs.BoxMesh(groundGeometry, groundPhysicsMaterial, 0);
                    ground.receiveShadow = true;
                    ground.position.set((x) * (TILE_SIZE * 2), 0.4, (z) * (TILE_SIZE * 2)); // -1 for exatra tiles around the maze, for the walls
                    ground.name = "Ground";
                    scene.add(ground);
                }
            }
        }
        groundGeometry = new BoxGeometry(TILE_SIZE * 30, 0.1, TILE_SIZE * 50);
        groundPhysicsMaterial = Physijs.createMaterial(new THREE.MeshBasicMaterial({ color: 0x000000 }), 0.1, 0.1);
        var deathGround = new Physijs.BoxMesh(groundGeometry, groundPhysicsMaterial, 0);
        deathGround.position.set((TILE_SIZE * 30) / 2, -TILE_SIZE * 1.5, (TILE_SIZE * 50) / 2);
        deathGround.name = "DeathPlane";
        scene.add(deathGround);
        //ground.position.set(24* TILE_SIZE/2,0,46* TILE_SIZE/2);
        console.log("Added Burnt Ground to scene");
        // -------------------------------------------Player Object-----------------------------------------
        catTextures = new Array(3);
        catMaterials = new Array(3);
        catEars = new Array(2);
        catMasses = new Array(4000, 2, 1);
        catVelocities = new Array(3000000, 1000, 1500);
        catTextures[0] = new THREE.TextureLoader().load("./Assets/Textures/Fur1.png");
        catTextures[1] = new THREE.TextureLoader().load("./Assets/Textures/Fur2.png");
        catTextures[2] = new THREE.TextureLoader().load("./Assets/Textures/Fur3.png");
        currentCat = 0;
        var myPlayerGeometry = new SphereGeometry(2.01, 20, 20);
        catMaterials[0] = new LambertMaterial({ color: 0xFFffFF, map: catTextures[0] });
        catMaterials[1] = new LambertMaterial({ color: 0xFFffFF, map: catTextures[1] });
        catMaterials[2] = new LambertMaterial({ color: 0xFFffFF, map: catTextures[2] });
        currentCatMaterial = catMaterials[0];
        playerVisual = new Mesh(myPlayerGeometry, currentCatMaterial);
        playerVisual.rotation.y = THREE.Math.degToRad(90);
        playerGeometry = new SphereGeometry(2, 20, 20);
        playerMaterial = Physijs.createMaterial(new LambertMaterial({ color: 0xFFffFF }), 0.4, 0);
        player = new Physijs.BoxMesh(playerGeometry, playerMaterial, catMasses[currentCat]);
        player.receiveShadow = true;
        player.castShadow = true;
        player.name = "Player";
        var geometry = new THREE.CylinderGeometry(0.01, 1, 3, 9);
        var material = currentCatMaterial;
        catEars[0] = new THREE.Mesh(geometry, material);
        catEars[1] = new THREE.Mesh(geometry, material);
        catEars[0].position.set(1, 1.47, 0);
        catEars[1].position.set(-1, 1.47, 0);
        player.add(playerVisual);
        player.add(catEars[0]);
        player.add(catEars[1]);
        player.position.set(3, 5, TILE_SIZE * 11);
        player.setAngularFactor(new Vector3(0, 0, 0));
        scene.add(player);
        console.log("Added Player to Scene");
        //---------------------------Level Creation-----------------------------------------------
        //horizontal
        createWall(24, 0, 0, 0, "wall-bottom-border");
        createWall(10, 8, 8, 0, "wall-h-1");
        createWall(22, 12, 0, 0, "wall-h-2");
        createWall(20, 16, 4, 0, "wall-h-3");
        createWall(14, 20, 6, 0, "wall-h-4");
        createWall(6, 24, 0, 0, "wall-h-5");
        createWall(16, 26, 8, 0, "wall-h-6");
        createWall(4, 28, 4, 0, "wall-h-7");
        createWall(18, 32, 0, 0, "wall-h-8");
        createWall(24, 46, 0, 0, "wall-top-border");
        //vertical
        createWall(46, 0, 0, 1, "wall-left-border");
        createWall(8, 0, 8, 1, "wall-v-1");
        createWall(6, 0, 14, 1, "wall-v-2");
        createWall(4, 4, 18, 1, "wall-v-3");
        createWall(4, 8, 22, 1, "wall-v-4");
        createWall(4, 16, 4, 1, "wall-v-5");
        createWall(4, 20, 6, 1, "wall-v-6");
        createWall(2, 26, 8, 1, "wall-v-7");
        createWall(4, 32, 18, 1, "wall-v-8");
        createWall(46, 0, 24, 1, "wall-right-border");
        createBreakableWall(8, 21, 0);
        createBreakableWall(13, 8, 1);
        createBreakableWall(11, 8, 1);
        //------------SETUP THE CAMER:create parent.child for camera-player-------------------------
        setupCamera();
        player.add(camera);
        //------------------------------------------------ Collision Check--------------------------
        player.addEventListener('collision', function (coll) {
            if (coll.name === "Ground") {
                isGrounded = true;
            }
            if (coll.name === "DeathPlane") {
                createjs.Sound.play("hit");
                //livesValue--;
                //livesLabel.text = "LIVES: " + livesValue;
                scene.remove(player);
                player.position.set(3, 5, TILE_SIZE * 11);
                scene.add(player);
            }
        });
        scene.setGravity(new Vector3(0, -10, 0));
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
        wallLenght = TILE_SIZE * wallLenght;
        var thisWallTexture = new THREE.TextureLoader().load("./Assets/Textures/wall.png");
        thisWallTexture.wrapS = THREE.RepeatWrapping;
        thisWallTexture.wrapT = THREE.RepeatWrapping;
        thisWallTexture.repeat.set(wallLenght / 20, 1);
        var thisWallTextureNormal = new THREE.TextureLoader().load("./Assets/Textures/wallNormal.png");
        thisWallTextureNormal.wrapS = THREE.RepeatWrapping;
        thisWallTextureNormal.wrapT = THREE.RepeatWrapping;
        thisWallTextureNormal.repeat.set(wallLenght / 20, 1);
        var thisWallMaterial = new THREE.MeshPhongMaterial;
        thisWallMaterial.map = thisWallTexture;
        thisWallMaterial.bumpMap = thisWallTextureNormal;
        thisWallMaterial.bumpScale = 1.2;
        var thisWallGeometry = new BoxGeometry(wallLenght * vertical + 0.5, 6, wallLenght * (1 - vertical) + 0.5);
        var thisWallPhysicsMaterial = Physijs.createMaterial(thisWallMaterial, 0, 0.1);
        var wall = new Physijs.BoxMesh(thisWallGeometry, thisWallPhysicsMaterial, 0);
        wall.position.set(startTileX * TILE_SIZE - TILE_SIZE + (wallLenght * vertical) / 2, 3, startTileZ * TILE_SIZE - TILE_SIZE + (wallLenght * (1 - vertical)) / 2);
        wall.receiveShadow = true;
        wall.name = "name";
        scene.add(wall);
    }
    function creatCrate(startTileX, startTileZ) {
    }
    function createBreakableWall(startTileX, startTileZ, vertical) {
        var bricksColumns = 9;
        var brickRows = 6;
        var bricksSizeX = 0.99;
        var bricksSizeZ = 0.99;
        var bricksSizeY = 0.9;
        var thisWallTexture = new THREE.TextureLoader().load("./Assets/Textures/wall.png");
        var thisWallMaterial = new THREE.MeshPhongMaterial;
        thisWallMaterial.map = thisWallTexture;
        thisWallTexture.wrapS = THREE.RepeatWrapping;
        thisWallTexture.wrapT = THREE.RepeatWrapping;
        thisWallTexture.repeat.set(0.1, 0.1);
        var thisWallPhysicsMaterial = Physijs.createMaterial(thisWallMaterial, 0, 0);
        for (var i = 0; i < brickRows; i++) {
            for (var j = 0; j < bricksColumns; j++) {
                var thisWallGeometry = new BoxGeometry(bricksSizeX, bricksSizeY, bricksSizeZ);
                var wall = new Physijs.BoxMesh(thisWallGeometry, thisWallPhysicsMaterial, 40);
                wall.position.set(startTileX * TILE_SIZE + bricksSizeX + (bricksSizeX * j * vertical), 0.5 + bricksSizeY / 2 + (bricksSizeY) * i, startTileZ * TILE_SIZE + bricksSizeZ + (bricksSizeZ * j * (1 - vertical)));
                wall.receiveShadow = true;
                wall.name = "name";
                scene.add(wall);
            }
        }
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
        canvas.style.width = "100%";
        stage.update();
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
        stage.update();
        // render using requestAnimationFrame
        requestAnimationFrame(gameLoop);
        // render the scene
        renderer.render(scene, camera);
        //console.log("Camera"
        // +"with x" + camera.rotation.x+" y:" + camera.rotation.y+" z:" + camera.rotation.z);
    }
    function switchCurrentCat() {
        if (keyboardControls.switchCat) {
            console.log("Switch Cat");
            console.log("current mass and velocity" + player.mass + ", " + catVelocities[currentCat]);
            currentCat++;
            if (currentCat == 3)
                currentCat = 0;
            keyboardControls.switchCat = false;
            catEars[0].material = catMaterials[currentCat];
            catEars[1].material = catMaterials[currentCat];
            playerVisual.material = catMaterials[currentCat];
            player.scale.set(1 / (currentCat + 1), 1 / (currentCat + 1), 1 / (currentCat + 1));
            player.mass = catMasses[currentCat];
            console.log("newmass and velocity" + player.mass + ", " + catVelocities[currentCat]);
        }
    }
    //check controls
    function checkControls() {
        if (keyboardControls.enabled) {
            velocity = new Vector3();
            switchCurrentCat();
            var time = performance.now();
            var delta = (time - prevTime) / 1000;
            if (isGrounded) {
                var direction = new Vector3(0, 0, 0);
                if (keyboardControls.moveForward) {
                    velocity.z -= catVelocities[currentCat] * delta;
                }
                if (keyboardControls.moveLeft) {
                    velocity.x -= catVelocities[currentCat] * delta;
                }
                if (keyboardControls.moveBackward) {
                    velocity.z += catVelocities[currentCat] * delta;
                }
                if (keyboardControls.moveRight) {
                    velocity.x += catVelocities[currentCat] * delta;
                }
                if (keyboardControls.jump) {
                    if (currentCat == 0) {
                    }
                    else if (currentCat == 1) {
                        velocity.y += catVelocities[currentCat] * 10 * delta;
                        if (player.position.y > 4) {
                            isGrounded = false;
                        }
                    }
                    else if (currentCat == 2) {
                        velocity.y += catVelocities[currentCat] * 6 * delta;
                        velocity.z -= catVelocities[currentCat] * 10 * delta;
                        if (player.position.y > 3) {
                            isGrounded = false;
                        }
                    }
                }
                player.setDamping(0.7, 0.1);
                // Changing player's rotation
                var tempRot = THREE.Math.clamp(-mouseControls.yaw, -4, 4); //values become crazy(up to 30), have to clamp
                player.setAngularVelocity(new Vector3(0, tempRot, 0));
                //console.log("yaw"+(-mouseControls.yaw));
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
        camera = new PerspectiveCamera(35, config.Screen.RATIO, 0.1, 1000);
        camera.position.set(0, 8, 20);
        //camera.rotation.set(0,0,0);
        //camera.lookAt(player.position);
        console.log("Finished setting up Camera..."
            + "with x" + camera.rotation.x + " y:" + camera.rotation.y + " z:" + camera.rotation.z);
    }
    window.onload = preload;
    return {
        scene: scene
    };
})();

//# sourceMappingURL=game.js.map
