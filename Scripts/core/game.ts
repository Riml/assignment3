/// <reference path="_reference.ts"/>

// MAIN GAME FILE

// THREEJS Aliases
import Scene = Physijs.Scene;
import Renderer = THREE.WebGLRenderer;
import PerspectiveCamera = THREE.PerspectiveCamera;
import BoxGeometry = THREE.BoxGeometry;
import CubeGeometry = THREE.CubeGeometry;
import PlaneGeometry = THREE.PlaneGeometry;
import SphereGeometry = THREE.SphereGeometry;
import Geometry = THREE.Geometry;
import AxisHelper = THREE.AxisHelper;
import LambertMaterial = THREE.MeshLambertMaterial;
import MeshBasicMaterial = THREE.MeshBasicMaterial;
import LineBasicMaterial = THREE.LineBasicMaterial;
import Material = THREE.Material;
import Line = THREE.Line;
import Mesh = THREE.Mesh;
import Object3D = THREE.Object3D;
import SpotLight = THREE.SpotLight;
import PointLight = THREE.PointLight;
import AmbientLight = THREE.AmbientLight;
import Control = objects.Control;
import GUI = dat.GUI;
import Color = THREE.Color;
import Vector3 = THREE.Vector3;
import Face3 = THREE.Face3;
import Point = objects.Point;
import CScreen = config.Screen;
import Clock = THREE.Clock;
import Texture = THREE.Texture;

//Custom Game Objects
import gameObject = objects.gameObject;

// Setup a Web Worker for Physijs
Physijs.scripts.worker = "/Scripts/lib/Physijs/physijs_worker.js";
Physijs.scripts.ammo = "/Scripts/lib/Physijs/examples/js/ammo.js";


// setup an IIFE structure (Immediately Invoked Function Expression)
var game = (() => {

    // declare game objects
    var havePointerLock: boolean;
    var element: any;
    var scene: Scene = new Scene(); // Instantiate Scene Object
    var renderer: Renderer;
    var camera: PerspectiveCamera;
    var control: Control;
    var gui: GUI;
    var stats: Stats;
    var blocker: HTMLElement;
    var instructions: HTMLElement;
    var spotLight: SpotLight;
    var groundGeometry: CubeGeometry;
    var groundPhysicsMaterial: Physijs.Material;
    var ground: Physijs.Mesh;
    var clock: Clock;
    var playerGeometry: SphereGeometry;
    var playerMaterial: Physijs.Material;
    var player: Physijs.Mesh;
   
    var sphereGeometry: SphereGeometry;
    var sphereMaterial: Physijs.Material;
    var sphere: Physijs.Mesh;
    var keyboardControls: objects.KeyboardControls;
    var mouseControls: objects.MouseControls;
    var isGrounded: boolean;
    var velocity: Vector3 = new Vector3(0, 0, 0);
    var prevTime: number = 0;
    var directionLineMaterial: LineBasicMaterial;
    var directionLineGeometry: Geometry;
    var directionLine: Line;
    var playerTexture: Texture;
    var ambientLight: AmbientLight;
    
    var TILE_SIZE:number;//to scale map(walls, hazards,ground and maybe skybox), should be constant


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
        TILE_SIZE=5;

        // Check to see if we have pointerLock
        if (havePointerLock) {
            element = document.body;

            instructions.addEventListener('click', () => {

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
        scene.setGravity(new THREE.Vector3(0, -10, 0));

        scene.addEventListener('update', () => {
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
        var groundTexture:Texture = new THREE.TextureLoader().load( "./Assets/Textures/ground1.jpg" );
        groundTexture.wrapS=THREE.RepeatWrapping;
        groundTexture.wrapT=THREE.RepeatWrapping;
        groundTexture.repeat.set(2,2);
        
               
        var groundTextureNormal: Texture = new THREE.TextureLoader().load( "./Assets/Textures/ground1Normal.png" );
        groundTextureNormal.wrapS=THREE.RepeatWrapping;
        groundTextureNormal.wrapT=THREE.RepeatWrapping;
        groundTextureNormal.repeat.set(2,2);
        
         var groundMaterial: THREE.MeshPhongMaterial = new THREE.MeshPhongMaterial;
        groundMaterial.map=groundTexture;
        groundMaterial.bumpMap = groundTextureNormal;
        groundMaterial.bumpScale=1.2;
        
        /*
        for(var x=0;x<24;x++)
        {
             for(var z=0;z<24;z++){
                 
             }
        }
        */
        
        groundGeometry = new BoxGeometry(24* TILE_SIZE*4, 1, 46* TILE_SIZE*4);
        groundPhysicsMaterial = Physijs.createMaterial(groundMaterial, 0, 0);
        ground = new Physijs.ConvexMesh(groundGeometry, groundPhysicsMaterial, 0);
        ground.receiveShadow = true;
        //ground.position.set(24* TILE_SIZE/2,0,46* TILE_SIZE/2);
        ground.name = "Ground";
        scene.add(ground);
        console.log("Added Burnt Ground to scene");

        // -------------------------------------------Player Object-----------------------------------------
        playerTexture = new THREE.TextureLoader().load( "./Assets/Textures/Cat.jpg" );
           
        
        var myPlayer:Mesh;
        
        var myPlayerGeometry = new SphereGeometry(2.01, 20, 20);
        var myPlayerMaterial = new LambertMaterial({ color: 0xFFffFF, map: playerTexture});

        myPlayer = new Mesh(myPlayerGeometry, myPlayerMaterial);
        myPlayer.rotation.y = THREE.Math.degToRad(90);
        
        
        playerGeometry = new SphereGeometry(2, 20, 20);
        playerMaterial = Physijs.createMaterial(new LambertMaterial({ color: 0xFFffFF}), 0.4, 0);

        player = new Physijs.BoxMesh(playerGeometry, playerMaterial, 0.8);
        player.receiveShadow = true;
        player.castShadow = true;
       
               
        player.name = "Player";
        
        var geometry = new THREE.CylinderGeometry( 0.01, 1, 3, 3 );
        var material = new THREE.MeshBasicMaterial( {color: 0xffff00 , wireframe:true} );
        var cylinder1 = new THREE.Mesh( geometry, material );
        var cylinder2 = new THREE.Mesh( geometry, material );
        cylinder1.position.set(1,1.47,0);
        cylinder2.position.set(-1,1.47,0);
        
        player.add(myPlayer);
        player.add(cylinder1);
        player.add(cylinder2);
        player.position.set(0, 30, 20);
        
        
        scene.add(player);
        console.log("Added Player to Scene");
        //---------------------------Level Creation-----------------------------------------------
            //horizontal
        createWall(24,0,0,0,"wall-bottom-border");
        createWall(10,8,8,0,"wall-h-1");
        createWall(22,12,0,0,"wall-h-2");
        createWall(20,16,4,0,"wall-h-3");
        createWall(14,20,6,0,"wall-h-4");
        createWall(6,24,0,0,"wall-h-5");
        createWall(16,26,8,0,"wall-h-6");
        createWall(4,28,4,0,"wall-h-7"); 
        createWall(18,32,0,0,"wall-h-8"); 
        createWall(24,46,0,0,"wall-top-border"); 
           //vertical
         
       
        createWall(46,0,0,1,"wall-left-border");
        createWall(8,0,8,1,"wall-v-1");
        createWall(6,0,14,1,"wall-v-2");
        createWall(4,4,18,1,"wall-v-3");
        createWall(4,8,22,1,"wall-v-4");
        createWall(4,16,4,1,"wall-v-5");
        createWall(4,20,6,1,"wall-v-6");
        createWall(2,26,8,1,"wall-v-7");
        createWall(4,32,18,1,"wall-v-8");
        
        createWall(46,0,24,1,"wall-right-border");
        
        //------------SETUP THE CAMER:create parent.child for camera-player-------------------------
        setupCamera();
        player.add(camera);
        //------------------------------------------------ Collision Check--------------------------
        player.addEventListener('collision', (event) => {
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
    function createWall( wallLenght:number, startTileX:number, startTileZ:number,vertical:number, name:string ){
        wallLenght=TILE_SIZE*wallLenght;
        var thisWallTexture:Texture = new THREE.TextureLoader().load( "./Assets/Textures/ground1.jpg" );
        thisWallTexture.wrapS=THREE.RepeatWrapping;
        thisWallTexture.wrapT=THREE.RepeatWrapping;
        thisWallTexture.repeat.set(1,1);
        
               
        var thisWallTextureNormal: Texture = new THREE.TextureLoader().load( "./Assets/Textures/ground1Normal.png" );
        thisWallTextureNormal.wrapS=THREE.RepeatWrapping;
        thisWallTextureNormal.wrapT=THREE.RepeatWrapping;
        thisWallTextureNormal.repeat.set(1,1);
        
         var thisWallMaterial: THREE.MeshPhongMaterial = new THREE.MeshPhongMaterial;
        thisWallMaterial.map=thisWallTexture;
        thisWallMaterial.bumpMap = thisWallTextureNormal;
        thisWallMaterial.bumpScale=1.2;
        
        var thisWallGeometry = new BoxGeometry(wallLenght*vertical+0.2, 10, wallLenght*(1-vertical)+0.2);
        var thisWallPhysicsMaterial = Physijs.createMaterial(thisWallMaterial, 0, 0.1);
        var wall = new Physijs.BoxMesh(thisWallGeometry, thisWallPhysicsMaterial, 0);
        
        wall.position.set(startTileX*TILE_SIZE + (wallLenght*vertical)/2-5,0.501,startTileZ*TILE_SIZE+(wallLenght*(1-vertical))/2-5);
        
        wall.receiveShadow = true;
        wall.name = "name";
        
        scene.add(wall);
        
    }

    //PointerLockChange Event Handler
    function pointerLockChange(event): void {
        if (document.pointerLockElement === element) {
            // enable our mouse and keyboard controls
            keyboardControls.enabled = true;
            mouseControls.enabled = true;
            blocker.style.display = 'none';
        } else {
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
    function pointerLockError(event): void {
        instructions.style.display = '';
        console.log("PointerLock Error Detected!!");
    }

    // Window Resize Event Handler
    function onWindowResize() {
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(window.innerWidth, window.innerHeight);
    }

    function addControl(controlObject: Control): void {
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
    function gameLoop(): void {
        stats.update();
        checkControls();
        
           

        // render using requestAnimationFrame
        requestAnimationFrame(gameLoop);

        // render the scene
        renderer.render(scene, camera);
        
        console.log("Camera"
         +"with x" + camera.rotation.x+" y:" + camera.rotation.y+" z:" + camera.rotation.z);
    }
    
    //check controls
    function checkControls():void
    {
        if (keyboardControls.enabled) {
            velocity = new Vector3();

            var time: number = performance.now();
            var delta: number = (time - prevTime) / 1000;

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
           mouseControls.pitch=0;
           mouseControls.yaw=0;
           
           
            prevTime = time;
        } // Controls Enabled ends
        else {
            player.setAngularVelocity(new Vector3(0, 0 , 0));   
        }
    }
    
    //camera look function 
    function cameraLook():void {
        var zenith:number = THREE.Math.degToRad(5);
        var nadir:number = THREE.Math.degToRad(-30);
        
        var cameraPitch:number = camera.rotation.x -mouseControls.pitch;
        
        camera.rotation.x= THREE.Math.clamp(cameraPitch,nadir,zenith)
        
        //constrain camera pitch
       
    }

    // Setup default renderer
    function setupRenderer(): void {
        renderer = new Renderer({ antialias: true });
        renderer.setClearColor(0x404040, 1.0);
        renderer.setPixelRatio(window.devicePixelRatio);
        renderer.setSize(CScreen.WIDTH, CScreen.HEIGHT);
        renderer.shadowMap.enabled = true;
        console.log("Finished setting up Renderer...");
    }

    // Setup main camera for the scene
    function setupCamera(): void {
        camera = new PerspectiveCamera(35, config.Screen.RATIO, 0.1, 100);
        camera.position.set(0, 9, 20);
        //camera.rotation.set(0,0,0);
        //camera.lookAt(player.position);
        console.log("Finished setting up Camera..."
         +"with x" + camera.rotation.x+" y:" + camera.rotation.y+" z:" + camera.rotation.z);
    }

    window.onload = init;

    return {
        scene: scene
    }

})();

