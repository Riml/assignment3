/// <reference path="_reference.ts"/>
// MAIN GAME FILE
/*
ADVANCED_GRAPHICS_COMP392_A3
CENTENNIAL_COLLEGE_W2016
Author: Ilmir Taychinov 300760705
Based on: Tom Tsiliopoulos template
Created: 7 March 2016
Last Modified: 25 March 2016
*/
// THREEJS Aliases
var Scene = Physijs.Scene;
var Renderer = THREE.WebGLRenderer;
var PerspectiveCamera = THREE.PerspectiveCamera;
var BoxGeometry = THREE.BoxGeometry;
var CubeGeometry = THREE.CubeGeometry;
var PlaneGeometry = THREE.PlaneGeometry;
var SphereGeometry = THREE.SphereGeometry;
var Geometry = THREE.Geometry;
var LambertMaterial = THREE.MeshLambertMaterial;
var MeshBasicMaterial = THREE.MeshBasicMaterial;
var Material = THREE.Material;
var Mesh = THREE.Mesh;
var Object3D = THREE.Object3D;
var SpotLight = THREE.SpotLight;
var AmbientLight = THREE.AmbientLight;
var Color = THREE.Color;
var Vector3 = THREE.Vector3;
var CScreen = config.Screen;
var Clock = THREE.Clock;
var Texture = THREE.Texture;
//Custom Game Objects
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
    var mute = true;
    //Player realted variables
    var myPlayerGeometry;
    var playerVisual;
    var catEars;
    var catTextures;
    var catMaterials; // sounds creepy, but what to do
    var currentCat; //0-fat,1-fast, 2-Spy
    var catMasses;
    var catVelocities;
    var currentCatMaterial;
    var playerGeometry;
    var playerMaterial;
    var player;
    var superVision;
    var superVision2;
    //EaselJS and friends  
    var assests;
    var canvas;
    var stage;
    var scoreLabel;
    var scoreValue;
    var livesLabel;
    var livesValue;
    //Constants    
    var TILE_SIZE; //to scale map(walls, hazards,ground and maybe skybox)
    //NPC
    var finalCatGeometry;
    var finalCatMaterial;
    var finalCat;
    var gameFinished = false;
    var manifest = [
        { id: "land", src: "../../Assets/Sound/Land.wav" },
        { id: "bg_music", src: "../../Assets/Sound/LOUD_RAIN_Gothic.myStory.mp3" }
    ];
    function setupScoreboard() {
        scoreValue = 0;
        livesValue = 3;
        scoreLabel = new createjs.Text("Time: " + scoreValue, "40px Arial", "#FFffFF");
        scoreLabel.x = config.Screen.WIDTH * 0.1;
        scoreLabel.y = (config.Screen.HEIGHT * 0.1) * 0.3;
        livesLabel = new createjs.Text("Lives: " + livesValue, "40px Arial", "#FFffFF");
        livesLabel.x = config.Screen.WIDTH * 0.7;
        livesLabel.y = (config.Screen.HEIGHT * 0.1) * 0.3;
        stage.addChild(scoreLabel);
        stage.addChild(livesLabel);
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
        superVision = new Array(0);
        superVision2 = new Array(0);
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
        spotLight.position.set(5 * TILE_SIZE, 500, 5 * TILE_SIZE);
        spotLight.castShadow = true;
        spotLight.intensity = 1.1;
        spotLight.lookAt(new Vector3(10 * TILE_SIZE, 10, 10 * TILE_SIZE));
        spotLight.shadowCameraNear = 0.1;
        spotLight.shadowCameraFar = 1200;
        spotLight.shadowMapWidth = 2048;
        spotLight.shadowMapHeight = 2048;
        spotLight.shadowDarkness = 1.4;
        spotLight.name = "Spot Light";
        scene.add(spotLight);
        ambientLight = new AmbientLight(0x232323);
        scene.add(ambientLight);
        // ----------------------------------------Ground + Hazards-----------------------------------------------------------
        var groundTexture = new THREE.TextureLoader().load("./Assets/Textures/floor.png");
        groundTexture.wrapS = THREE.RepeatWrapping;
        groundTexture.wrapT = THREE.RepeatWrapping;
        groundTexture.repeat.set(1, 1);
        // var groundTextureNormal: Texture = new THREE.TextureLoader().load( "./Assets/Textures/floorNormal.png" );
        // groundTextureNormal.wrapS=THREE.RepeatWrapping;
        // groundTextureNormal.wrapT=THREE.RepeatWrapping;
        // groundTextureNormal.repeat.set(1,1);
        var groundMaterial = new THREE.MeshLambertMaterial;
        groundMaterial.map = groundTexture;
        //groundMaterial.bumpMap = groundTextureNormal;
        // groundMaterial.bumpScale=1.2;
        //double size tiles
        for (var x = 0; x < 23; x++) {
            for (var z = 0; z < 12; z++) {
                //pits first-block
                if ((x == 9 && z == 9) || (x == 9 && z == 10) || (x == 9 && z == 11) ||
                    (x == 10 && z == 10) || (x == 10 && z == 11)) { }
                else if ((x == 2 && z == 4) || (x == 2 && z == 5) || (x == 2 && z == 6)) { }
                else if ((x == 15 && z == 11) || (x == 15 && z == 10) ||
                    (x == 16 && z == 11) || (x == 16 && z == 10) ||
                    (x == 17 && z == 10) || (x == 17 && z == 11)) { }
                else if ((x == 15 && z == 9) || (x == 16 && z == 9) || (x == 17 && z == 9)) {
                    createInvisibleMiniTile(x, z);
                }
                else if (x == 6 && z == 5 || x == 7 && z == 5 || (z >= 4 && z <= 19 && x >= 16 && x <= 23)) {
                    createUnstableTile(groundMaterial, x, z);
                }
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
        groundGeometry = new BoxGeometry(TILE_SIZE * 60, 0.1, TILE_SIZE * 150);
        groundPhysicsMaterial = Physijs.createMaterial(new THREE.MeshBasicMaterial({ color: 0x000000 }), 10000, 0.1);
        var deathGround = new Physijs.BoxMesh(groundGeometry, groundPhysicsMaterial, 0);
        deathGround.position.set((TILE_SIZE * 60) / 2, -TILE_SIZE * 1.5, (TILE_SIZE * 150) / 2);
        deathGround.name = "DeathPlane";
        scene.add(deathGround);
        //ground.position.set(24* TILE_SIZE/2,0,46* TILE_SIZE/2);
        console.log("Added Burnt Ground to scene");
        // -------------------------------------------Player Object-----------------------------------------
        catTextures = new Array(3);
        catMaterials = new Array(3);
        catEars = new Array(2);
        catMasses = new Array(4000, 2, 1);
        catVelocities = new Array(3000000, 2000, 1300);
        catTextures[0] = new THREE.TextureLoader().load("./Assets/Textures/Fur1.png");
        catTextures[1] = new THREE.TextureLoader().load("./Assets/Textures/Fur2.png");
        catTextures[2] = new THREE.TextureLoader().load("./Assets/Textures/Fur3.png");
        currentCat = 0;
        myPlayerGeometry = new SphereGeometry(1.86, 20, 20);
        catMaterials[0] = new LambertMaterial({ color: 0xFFffFF, map: catTextures[0] });
        catMaterials[1] = new LambertMaterial({ color: 0xFFffFF, map: catTextures[1] });
        catMaterials[2] = new LambertMaterial({ color: 0xFFffFF, map: catTextures[2] });
        currentCatMaterial = catMaterials[0];
        playerVisual = new Mesh(myPlayerGeometry, currentCatMaterial);
        playerVisual.receiveShadow = true;
        playerVisual.castShadow = true;
        playerVisual.rotation.y = THREE.Math.degToRad(0);
        playerGeometry = new SphereGeometry(1.7, 20, 20);
        var playerTransparetMaterial = new LambertMaterial({ color: 0xFFffFF });
        playerTransparetMaterial.transparent = true;
        playerTransparetMaterial.opacity = 0;
        playerMaterial = Physijs.createMaterial(playerTransparetMaterial, 0.4, 0);
        player = new Physijs.SphereMesh(playerGeometry, playerMaterial, catMasses[currentCat]);
        player.name = "Player";
        var geometry = new THREE.CylinderGeometry(0.01, 0.9, 3, 9);
        var material = currentCatMaterial;
        catEars[0] = new THREE.Mesh(geometry, material);
        catEars[1] = new THREE.Mesh(geometry, material);
        catEars[0].position.set(0.9, 1.4, 0);
        catEars[1].position.set(-0.9, 1.4, 0);
        player.add(playerVisual); //0
        playerVisual.add(catEars[0]);
        playerVisual.add(catEars[1]);
        catEars[0].receiveShadow = true;
        catEars[0].castShadow = true;
        catEars[1].receiveShadow = true;
        catEars[1].castShadow = true;
        player.position.set(3, 5, TILE_SIZE * 11);
        player.setAngularFactor(new Vector3(0, 0, 0));
        scene.add(player);
        console.log("Added Player to Scene");
        //add final cat
        var basicFinalCatMaterial = new LambertMaterial({ color: 0xFFffFF, map: new THREE.TextureLoader().load("./Assets/Textures/Cat.png") });
        var basicFinalCatEarsMaterial = new LambertMaterial({ color: 0xFFffFF, map: new THREE.TextureLoader().load("./Assets/Textures/Ears.png") });
        finalCatMaterial = Physijs.createMaterial(basicFinalCatMaterial, 0, 0);
        finalCat = new Physijs.SphereMesh(playerGeometry, finalCatMaterial, 1000);
        var geometry = new THREE.CylinderGeometry(0.01, 0.8, 2, 9);
        var material = currentCatMaterial;
        var ear1 = new THREE.Mesh(geometry, basicFinalCatEarsMaterial);
        var ear2 = new THREE.Mesh(geometry, basicFinalCatEarsMaterial);
        ear1.position.set(0, 1.4, 0.8);
        ear2.position.set(0, 1.4, -0.8);
        finalCat.add(ear1);
        finalCat.add(ear2);
        finalCat.position.set(42 * TILE_SIZE, 5, TILE_SIZE * 2);
        finalCat.rotation.y = THREE.Math.degToRad(-90);
        finalCat.name = "final";
        scene.add(finalCat);
        //---------------------------Level Creation-----------------------------------------------
        //horizontal
        createWall(24, 0, 0, 0, "wall-bottom-border");
        createWall(10, 8, 8, 0, "wall-h-1");
        createWall(22, 12, 0, 0, "wall-h-2");
        createWall(20, 16, 4, 0, "wall-h-3");
        createWall(14, 20, 6, 0, "wall-h-4");
        createWall(6, 24, 0, 0, "wall-h-5");
        createInvisibleWall(4, 26, 8, 0, "invisible");
        createWall(12, 26, 12, 0, "wall-h-6");
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
        createWall(4, 22, 12, 1, "wall-v-6.5");
        createWall(6, 26, 8, 1, "wall-v-7");
        createWall(4, 32, 18, 1, "wall-v-8");
        createWall(46, 0, 24, 1, "wall-right-border");
        createBreakableWall(8, 21, 0);
        createBreakableWall(13, 8, 1);
        createBreakableWall(11, 8, 1);
        creatCrate(16, 8);
        //------------SETUP THE CAMER:create parent.child for camera-player-------------------------
        setupCamera();
        player.add(camera); //1
        //------------------------------------------------ Collision Check--------------------------
        player.addEventListener('collision', function (coll) {
            if (coll.name === "Ground") {
                isGrounded = true;
            }
            if (coll.name === "shakeLand") {
                console.log("cat step on shaking land");
                isGrounded = true;
                coll.mass = 0.01;
            }
            if (coll.name === "final") {
                gameFinished = true;
                scoreLabel.text = " The Cats are safe for now! Thanks to you! your time is " + Math.round(scoreValue);
                livesLabel.text = "";
                return;
            }
            if (coll.name === "DeathPlane") {
                createjs.Sound.play("hit");
                isGrounded = false;
                livesValue--;
                if (livesValue < 0) {
                    scoreLabel.text = " You didn't win, but don't worry - you can try again! (press F5) the Cats are waiting for you! :3 ";
                    livesLabel.text = "";
                    return;
                }
                livesLabel.text = "Lives: " + livesValue;
                scene.remove(player);
                player.rotation.set(0, 0, 0);
                player.setAngularFactor(new Vector3(0, 0, 0));
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
        createjs.Sound.play("bg_music", 0, 1, 0, 1, 0.3);
    }
    //end of init
    function createUnstableTile(groundMaterial, x, z) {
        groundGeometry = new BoxGeometry(TILE_SIZE * 1.999, 0.2, TILE_SIZE * 1.999);
        groundPhysicsMaterial = Physijs.createMaterial(groundMaterial, 0.1, 0.1);
        ground = new Physijs.BoxMesh(groundGeometry, groundPhysicsMaterial, 0);
        ground.position.set((x) * (TILE_SIZE * 2), 0.4, (z) * (TILE_SIZE * 2)); // -1 for exatra tiles around the maze, for the walls
        ground.name = "shakeLand";
        scene.add(ground);
    }
    // if not vertical, then horizontal
    function createWall(wallLenght, startTileX, startTileZ, vertical, name) {
        wallLenght = TILE_SIZE * wallLenght;
        var thisWallTexture = new THREE.TextureLoader().load("./Assets/Textures/wall.png");
        thisWallTexture.wrapS = THREE.RepeatWrapping;
        thisWallTexture.wrapT = THREE.RepeatWrapping;
        thisWallTexture.repeat.set(wallLenght / 10, 1.1);
        //var thisWallTextureNormal: Texture = new THREE.TextureLoader().load( "./Assets/Textures/wallNormal.png" );
        //thisWallTextureNormal.wrapS=THREE.RepeatWrapping;
        //thisWallTextureNormal.wrapT=THREE.RepeatWrapping;
        // thisWallTextureNormal.repeat.set(wallLenght/30,1);
        var thisWallMaterial = new THREE.MeshLambertMaterial;
        thisWallMaterial.map = thisWallTexture;
        //thisWallMaterial.bumpMap = thisWallTextureNormal;
        //thisWallMaterial.bumpScale=1.2;
        var thisWallGeometry = new BoxGeometry(wallLenght * vertical + 0.5, 6, wallLenght * (1 - vertical) + 0.5);
        var thisWallPhysicsMaterial = Physijs.createMaterial(thisWallMaterial, 0, 0.1);
        var wall = new Physijs.BoxMesh(thisWallGeometry, thisWallPhysicsMaterial, 0);
        wall.position.set(startTileX * TILE_SIZE - TILE_SIZE + (wallLenght * vertical) / 2, 3, startTileZ * TILE_SIZE - TILE_SIZE + (wallLenght * (1 - vertical)) / 2);
        wall.receiveShadow = true;
        wall.castShadow = true;
        wall.name = name;
        scene.add(wall);
    }
    function createInvisibleWall(wallLenght, startTileX, startTileZ, vertical, name) {
        wallLenght = TILE_SIZE * wallLenght;
        var thisWallTexture = new THREE.TextureLoader().load("./Assets/Textures/wall.png");
        thisWallTexture.wrapS = THREE.RepeatWrapping;
        thisWallTexture.wrapT = THREE.RepeatWrapping;
        thisWallTexture.repeat.set(wallLenght / 10, 1.1);
        //var thisWallTextureNormal: Texture = new THREE.TextureLoader().load( "./Assets/Textures/wallNormal.png" );
        //thisWallTextureNormal.wrapS=THREE.RepeatWrapping;
        //thisWallTextureNormal.wrapT=THREE.RepeatWrapping;
        // thisWallTextureNormal.repeat.set(wallLenght/30,1);
        var thisWallMaterial = new THREE.MeshLambertMaterial;
        thisWallMaterial.map = thisWallTexture;
        thisWallMaterial.transparent = true;
        //thisWallMaterial.bumpMap = thisWallTextureNormal;
        //thisWallMaterial.bumpScale=1.2;
        var thisWallGeometry = new BoxGeometry(wallLenght * vertical + 0.5, 6, wallLenght * (1 - vertical) + 0.5);
        var wall = new Mesh(thisWallGeometry, thisWallMaterial);
        wall.position.set(startTileX * TILE_SIZE - TILE_SIZE + (wallLenght * vertical) / 2, 3, startTileZ * TILE_SIZE - TILE_SIZE + (wallLenght * (1 - vertical)) / 2);
        wall.receiveShadow = true;
        wall.castShadow = true;
        wall.name = name;
        superVision2.push(wall);
        scene.add(wall);
    }
    function creatCrate(startTileX, startTileZ) {
        //var thisCrateTexture: Texture = new THREE.TextureLoader().load("./Assets/Textures/wall.png");
        var thisCrateMaterial = new THREE.MeshLambertMaterial({ color: 0xFACEee });
        //thisCrateTexture.map = thisWallTexture;
        //thisWallTexture.wrapS=THREE.RepeatWrapping;
        //thisWallTexture.wrapT=THREE.RepeatWrapping;
        //thisWallTexture.repeat.set(0.1,0.1);
        var thisCratePhysicsMaterial = Physijs.createMaterial(thisCrateMaterial, 10, 0.1);
        var thisCrateGeometry = new BoxGeometry(TILE_SIZE * 1.2, TILE_SIZE * 1.2, TILE_SIZE * 1.2);
        var crate = new Physijs.BoxMesh(thisCrateGeometry, thisCratePhysicsMaterial, 100);
        crate.position.set(startTileX * TILE_SIZE + TILE_SIZE / 2, 0.5 + TILE_SIZE / 2, startTileZ * TILE_SIZE + TILE_SIZE / 2);
        crate.receiveShadow = true;
        crate.castShadow = true;
        crate.name = "Ground";
        scene.add(crate);
    }
    function createInvisibleMiniTile(x, z) {
        var groundMaterial = new THREE.MeshPhongMaterial({ color: 0xffFFff });
        groundMaterial.transparent = true;
        groundMaterial.opacity = 0;
        groundGeometry = new BoxGeometry(TILE_SIZE * 2, 0.2, TILE_SIZE * 0.5);
        groundPhysicsMaterial = Physijs.createMaterial(groundMaterial, 0.1, 0.1);
        ground = new Physijs.BoxMesh(groundGeometry, groundPhysicsMaterial, 0);
        ground.position.set((x) * (TILE_SIZE * 2), 0.4, (z) * (TILE_SIZE * 2)); // -1 for exatra tiles around the maze, for the walls
        superVision.push(ground);
        ground.name = "Ground";
        scene.add(ground);
    }
    function createBreakableWall(startTileX, startTileZ, vertical) {
        var bricksColumns = 9;
        var brickRows = 6;
        var bricksSizeX = 0.99;
        var bricksSizeZ = 0.99;
        var bricksSizeY = 0.9;
        var thisWallTexture = new THREE.TextureLoader().load("./Assets/Textures/wall.png");
        var thisWallMaterial = new THREE.MeshLambertMaterial;
        thisWallMaterial.map = thisWallTexture;
        thisWallTexture.wrapS = THREE.RepeatWrapping;
        thisWallTexture.wrapT = THREE.RepeatWrapping;
        thisWallTexture.repeat.set(0.18, 0.18);
        var thisWallPhysicsMaterial = Physijs.createMaterial(thisWallMaterial, 0, 0);
        for (var i = 0; i < brickRows; i++) {
            for (var j = 0; j < bricksColumns; j++) {
                var thisWallGeometry = new BoxGeometry(bricksSizeX, bricksSizeY, bricksSizeZ);
                var wall = new Physijs.BoxMesh(thisWallGeometry, thisWallPhysicsMaterial, 40);
                wall.position.set(startTileX * TILE_SIZE + bricksSizeX + (bricksSizeX * j * vertical), 0.5 + bricksSizeY / 2 + (bricksSizeY) * i, startTileZ * TILE_SIZE + bricksSizeZ + (bricksSizeZ * j * (1 - vertical)));
                wall.castShadow = true;
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
        if (!gameFinished) {
            scoreValue += clock.getDelta();
            scoreLabel.text = "Time: " + Math.round(scoreValue);
            checkControls();
        }
        stats.update();
        stage.update();
        // render using requestAnimationFrame
        requestAnimationFrame(gameLoop);
        // render the scene
        renderer.render(scene, camera);
    }
    function switchCurrentCat() {
        if (keyboardControls.switchCat) {
            currentCat++;
            if (currentCat == 3)
                currentCat = 0;
            if (currentCat == 1) {
                superVision.forEach(function (tile) {
                    tile.material.opacity = 0.2;
                });
                superVision2.forEach(function (tile) {
                    tile.material.opacity = 0.5;
                });
            }
            else {
                superVision.forEach(function (tile) {
                    tile.material.opacity = 0;
                });
                superVision2.forEach(function (tile) {
                    tile.material.opacity = 1;
                });
            }
            keyboardControls.switchCat = false;
            catEars[0].material = catMaterials[currentCat];
            catEars[1].material = catMaterials[currentCat];
            playerVisual.material = catMaterials[currentCat];
            var newSize = 1 / (currentCat * 0.5 + 1);
            player.scale.set(newSize, newSize, newSize); //!!! Quite unpredictable things happenning here
            player.children.forEach(function (element) {
                console.log("children " + element + " " + element.name);
            });
            player.mass = catMasses[currentCat];
        }
    }
    //check controls
    function checkControls() {
        //possible to mute always just in case of really loud sounds
        if (keyboardControls.switchMute) {
            createjs.Sound.muted = mute;
            keyboardControls.switchMute = false;
            mute = !mute;
            console.log("Mute is " + mute);
        }
        if (keyboardControls.enabled) {
            velocity = new Vector3();
            switchCurrentCat();
            var time = performance.now();
            var delta = (time - prevTime) / 1000;
            if (isGrounded) {
                player.setAngularFactor(new Vector3(0, 0, 0));
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
                        velocity.y += catVelocities[currentCat] * 5 * delta;
                        if (player.position.y > 4) {
                            isGrounded = false;
                        }
                    }
                    else if (currentCat == 2) {
                        velocity.y += catVelocities[currentCat] * 5 * delta;
                        velocity.z -= catVelocities[currentCat] * 8 * delta;
                        if (player.position.y > 3) {
                            isGrounded = false;
                        }
                    }
                }
                player.setDamping(0.7, 0.1);
                // Changing player's rotation
                var tempRot = THREE.Math.clamp(-mouseControls.yaw, -4, 4); //values become crazy(up to 30), have to clamp
                player.setAngularVelocity(new Vector3(0, tempRot, 0));
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
        //renderer.shadowMap.enabled = true;
        //renderer.shadowMapEnabled=true;
        console.log("Finished setting up Renderer...");
    }
    // Setup main camera for the scene
    function setupCamera() {
        camera = new PerspectiveCamera(35, config.Screen.RATIO, 0.1, 300);
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
