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

    //------------------------ declare game objects-------------------------------
    //basic
    var havePointerLock: boolean;
    var element: any;
    var scene: Scene = new Scene(); // Instantiate Scene Object
    var renderer: Renderer;
    var camera: PerspectiveCamera;
    var control: Control;
    var stats: Stats;
    var blocker: HTMLElement;
    var instructions: HTMLElement;
    var spotLight: SpotLight;
    var groundGeometry: CubeGeometry;
    var ambientLight: AmbientLight;
    //physijs
    var groundPhysicsMaterial: Physijs.Material;
    var ground: Physijs.Mesh;
    var clock: Clock;
    //controls
    var keyboardControls: objects.KeyboardControls;
    var mouseControls: objects.MouseControls;
    var isGrounded: boolean;
    var velocity: Vector3 = new Vector3(0, 0, 0);
    var prevTime: number = 0;
     //Player realted variables
    var playerVisual:Mesh;
    var catEars: Array<Mesh>;
    var catTextures: Array<Texture>;
    var catMaterials: Array<Material>;// sounds creepy, but what to do
    var currentCat: number;//0-fat,1-fast, 2-royal
    var catMasses: Array<number>;
    var catVelocities: Array<number>;
    var currentCatMaterial: THREE.Material;
    var playerGeometry: SphereGeometry;
    var playerMaterial: Physijs.Material;
    var player: Physijs.BoxMesh;
    //EaselJS and friends  
    var assests: createjs.LoadQueue;
    var canvas: HTMLElement;
    var stage: createjs.Stage;
    var scoreLabel: createjs.Text;
    var scoreValue: number;
    var livesLabel: createjs.Text;
    var livesValue: number;
    
    var TILE_SIZE:number;//to scale map(walls, hazards,ground and maybe skybox), should be constant
    
     var manifest =[
         {id:"land", src:"../../Assets/sound/Land.wav"}
     ];
    
    function setupScoreboard():void {
        scoreValue=0;
        
        scoreLabel=new createjs.Text("Score: "+ scoreValue, "40px Arial","#FFffFF");
        scoreLabel.x = config.Screen.WIDTH*0.1;
        scoreLabel.y = (config.Screen.HEIGHT*0.1)*0.3;
        
        stage.addChild(scoreLabel);
    }
    
    function preload():void {
        assests = new createjs.LoadQueue();
        assests.installPlugin(createjs.Sound);
        assests.on("complete",init,this);
        assests.loadManifest(manifest);
    } 
    function setupCanvas():void {
        canvas = document.getElementById("canvas");
        canvas.setAttribute("width",config.Screen.WIDTH.toString());
        canvas.setAttribute("height",(config.Screen.HEIGHT*0.1).toString());
        canvas.style.backgroundColor='#001100';
        stage =  new createjs.Stage(canvas);
    } 

 

    function init() {
        setupCanvas();
        scene.setGravity(new Vector3(0,0,0));
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
        //scene.setGravity(new THREE.Vector3(0, -10, 0));

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
        var groundTexture:Texture = new THREE.TextureLoader().load( "./Assets/Textures/floor.png" );
        groundTexture.wrapS=THREE.RepeatWrapping;
        groundTexture.wrapT=THREE.RepeatWrapping;
        groundTexture.repeat.set(1,1);
        
               
        var groundTextureNormal: Texture = new THREE.TextureLoader().load( "./Assets/Textures/floorNormal.png" );
        groundTextureNormal.wrapS=THREE.RepeatWrapping;
        groundTextureNormal.wrapT=THREE.RepeatWrapping;
        groundTextureNormal.repeat.set(1,1);
        
         var groundMaterial: THREE.MeshPhongMaterial = new THREE.MeshPhongMaterial;
        groundMaterial.map=groundTexture;
        groundMaterial.bumpMap = groundTextureNormal;
        groundMaterial.bumpScale=1.2;
        
        
        //double size tiles
        for(var x=0;x<23;x++)
        {
             for(var z=0;z<12;z++){
                 
                 //pits first-block
                 if((x==9 && z==9) || (x==9 && z==10) || (x==9 && z==11)||
                    (x==10 && z==10)|| (x==10 && z==11))
                    {}
                 
                 //pits second-block
                 else if((x==2 && z==4) || (x==2 && z==5) || (x==2 && z==6))
                    {}
                 else if(x==6&&z==5||x==7&&z==5)
                 {
                     createUnstableTile(groundMaterial,x,z);
                 }   
                 else{                
                  groundGeometry = new BoxGeometry(TILE_SIZE*1.999, 0.2, TILE_SIZE*1.999);
                  groundPhysicsMaterial = Physijs.createMaterial(groundMaterial, 0.1, 0.1);
                  ground = new Physijs.BoxMesh(groundGeometry, groundPhysicsMaterial, 0);
                  ground.receiveShadow = true;
                  ground.position.set((x)*(TILE_SIZE*2),0.4,(z)*(TILE_SIZE*2)); // -1 for exatra tiles around the maze, for the walls
                  ground.name = "Ground";
                  scene.add(ground);
                 }
             }
        }
        
         groundGeometry = new BoxGeometry(TILE_SIZE*30, 0.1, TILE_SIZE*50);
         groundPhysicsMaterial = Physijs.createMaterial(new THREE.MeshBasicMaterial( {color: 0x000000} ), 10000, 0.1);
         var deathGround = new Physijs.BoxMesh(groundGeometry, groundPhysicsMaterial, 0);
         deathGround.position.set((TILE_SIZE*30)/2,-TILE_SIZE*1.5,(TILE_SIZE*50)/2);
         deathGround.name = "DeathPlane";
         scene.add(deathGround);
         
        
        
       
        //ground.position.set(24* TILE_SIZE/2,0,46* TILE_SIZE/2);
       
       
        console.log("Added Burnt Ground to scene");

        // -------------------------------------------Player Object-----------------------------------------
        catTextures = new Array(3);
        catMaterials = new Array(3);
        catEars = new Array(2);
        catMasses = new Array(4000,2,1);
        catVelocities = new Array(3000000,1000,1500);
        catTextures[0] = new THREE.TextureLoader().load( "./Assets/Textures/Fur1.png" );
        catTextures[1] =  new THREE.TextureLoader().load("./Assets/Textures/Fur2.png");
        catTextures[2] =  new THREE.TextureLoader().load("./Assets/Textures/Fur3.png");
        currentCat=0;
        var myPlayerGeometry = new SphereGeometry(2.01, 20, 20);
        catMaterials[0] = new LambertMaterial({ color: 0xFFffFF, map: catTextures[0]});
        catMaterials[1] = new LambertMaterial({ color: 0xFFffFF, map: catTextures[1]});
        catMaterials[2] = new LambertMaterial({ color: 0xFFffFF, map: catTextures[2]});
        currentCatMaterial=catMaterials[0];
        playerVisual = new Mesh(myPlayerGeometry, currentCatMaterial);
        playerVisual.rotation.y = THREE.Math.degToRad(90);
        playerGeometry = new SphereGeometry(2, 20, 20);
        playerMaterial = Physijs.createMaterial(new LambertMaterial({ color: 0xFFffFF}), 0.4, 0);
        player = new Physijs.SphereMesh(playerGeometry, playerMaterial, catMasses[currentCat]);
        player.receiveShadow = true;
        player.castShadow = true;
        player.name = "Player";
        var geometry = new THREE.CylinderGeometry( 0.01, 1, 3, 9 );
        var material = currentCatMaterial;
        catEars[0] = new THREE.Mesh( geometry, material );
        catEars[1] = new THREE.Mesh( geometry, material );
        catEars[0].position.set(1,1.47,0);
        catEars[1].position.set(-1,1.47,0);
        
        player.add(playerVisual);
        player.add(catEars[0]);
        player.add(catEars[1]);
        player.position.set(3, 5,TILE_SIZE*11);
        player.setAngularFactor(new Vector3(0,0,0));
        
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
        
        createBreakableWall(8,21,0);
        createBreakableWall(13,8,1);
        createBreakableWall(11,8,1);
        
        creatCrate(16,8);
        
        //------------SETUP THE CAMER:create parent.child for camera-player-------------------------
        setupCamera();
        player.add(camera);
        //------------------------------------------------ Collision Check--------------------------
        player.addEventListener('collision', (coll) => {
            if (coll.name === "Ground" ) {
               isGrounded = true;
               //createjs.Sound.play("land");
            }
            if (coll.name === "shakeLand" ) {
                console.log("cat step on shaking land");
               isGrounded = true;
               coll.mass=0.01;
            }
           
            
            if(coll.name === "DeathPlane") {
                createjs.Sound.play("hit");
                //livesValue--;
                //livesLabel.text = "LIVES: " + livesValue;
                scene.remove(player);
                player.position.set(3, 5,TILE_SIZE*11);
                scene.add(player);
            }
        });

        scene.setGravity(new Vector3(0,-10,0));
        // Add framerate stats
        addStatsObject();
        console.log("Added Stats to scene...");

        document.body.appendChild(renderer.domElement);
        gameLoop(); // render the scene	
        scene.simulate();

        window.addEventListener('resize', onWindowResize, false);
        
    }
    //end of init
    function createUnstableTile(groundMaterial: THREE.MeshPhongMaterial,x:number,z:number)
    {
          groundGeometry = new BoxGeometry(TILE_SIZE*1.999, 0.2, TILE_SIZE*1.999);
          groundPhysicsMaterial = Physijs.createMaterial(groundMaterial, 0.1, 0.1);
          ground = new Physijs.BoxMesh(groundGeometry, groundPhysicsMaterial, 0);
          ground.receiveShadow = true;
          ground.position.set((x)*(TILE_SIZE*2),0.4,(z)*(TILE_SIZE*2)); // -1 for exatra tiles around the maze, for the walls
          ground.name = "shakeLand";
          scene.add(ground);
    }
    
    // if not vertical, then horizontal
    function createWall( wallLenght:number, startTileX:number, startTileZ:number,vertical:number, name:string ){
        wallLenght=TILE_SIZE*wallLenght;
        var thisWallTexture:Texture = new THREE.TextureLoader().load( "./Assets/Textures/wall.png" );
        thisWallTexture.wrapS=THREE.RepeatWrapping;
        thisWallTexture.wrapT=THREE.RepeatWrapping;
        thisWallTexture.repeat.set(wallLenght/20,1);
        
               
        var thisWallTextureNormal: Texture = new THREE.TextureLoader().load( "./Assets/Textures/wallNormal.png" );
        thisWallTextureNormal.wrapS=THREE.RepeatWrapping;
        thisWallTextureNormal.wrapT=THREE.RepeatWrapping;
        thisWallTextureNormal.repeat.set(wallLenght/20,1);
        
        var thisWallMaterial: THREE.MeshPhongMaterial = new THREE.MeshPhongMaterial;
        thisWallMaterial.map=thisWallTexture;
        thisWallMaterial.bumpMap = thisWallTextureNormal;
        thisWallMaterial.bumpScale=1.2;
        
        var thisWallGeometry = new BoxGeometry(wallLenght*vertical+0.5, 6, wallLenght*(1-vertical)+0.5);
        var thisWallPhysicsMaterial = Physijs.createMaterial(thisWallMaterial, 0, 0.1);
        var wall = new Physijs.BoxMesh(thisWallGeometry, thisWallPhysicsMaterial, 0);
        
        wall.position.set(startTileX*TILE_SIZE-TILE_SIZE + (wallLenght*vertical)/2,3,startTileZ*TILE_SIZE-TILE_SIZE+(wallLenght*(1-vertical))/2);
        
        wall.receiveShadow = true;
        wall.name = "name";
        
        scene.add(wall);
        
    }
    function creatCrate(startTileX:number, startTileZ:number)
    {
        //var thisCrateTexture: Texture = new THREE.TextureLoader().load("./Assets/Textures/wall.png");
        var thisCrateMaterial: THREE.MeshBasicMaterial = new THREE.MeshBasicMaterial({color: 0xFACEee});
       // thisCrateTexture.map = thisWallTexture;
        //thisWallTexture.wrapS=THREE.RepeatWrapping;
        //thisWallTexture.wrapT=THREE.RepeatWrapping;
      //  thisWallTexture.repeat.set(0.1,0.1);
      

        var thisCratePhysicsMaterial = Physijs.createMaterial(thisCrateMaterial, 10, 0.1);
        var thisCrateGeometry = new BoxGeometry(TILE_SIZE, TILE_SIZE, TILE_SIZE);
        
        var crate = new Physijs.BoxMesh(thisCrateGeometry, thisCratePhysicsMaterial, 100);
        crate.position.set(
                     startTileX*TILE_SIZE+TILE_SIZE/2,
                     0.5+TILE_SIZE/2,
                     startTileZ*TILE_SIZE +TILE_SIZE/2
                );
       crate.receiveShadow = true;
       crate.name = "Ground";
       scene.add(crate);
        
    }
    function createBreakableWall(startTileX: number, startTileZ: number, vertical: number): void {

        var bricksColumns: number = 9;
        var brickRows: number = 6;
        var bricksSizeX: number = 0.99;
        var bricksSizeZ: number = 0.99;
        var bricksSizeY: number = 0.9;

        var thisWallTexture: Texture = new THREE.TextureLoader().load("./Assets/Textures/wall.png");
        var thisWallMaterial: THREE.MeshPhongMaterial = new THREE.MeshPhongMaterial;
        thisWallMaterial.map = thisWallTexture;
        thisWallTexture.wrapS=THREE.RepeatWrapping;
        thisWallTexture.wrapT=THREE.RepeatWrapping;
        thisWallTexture.repeat.set(0.2,0.2);
      

        var thisWallPhysicsMaterial = Physijs.createMaterial(thisWallMaterial, 0, 0);
        for (var i = 0; i < brickRows; i++) {
            for (var j = 0; j < bricksColumns; j++) {
                var thisWallGeometry = new BoxGeometry(bricksSizeX, bricksSizeY, bricksSizeZ);
                var wall = new Physijs.BoxMesh(thisWallGeometry, thisWallPhysicsMaterial, 40);
                wall.position.set(
                     startTileX*TILE_SIZE+bricksSizeX + (bricksSizeX * j * vertical),
                     0.5+bricksSizeY/2+(bricksSizeY)*i,
                     startTileZ*TILE_SIZE +bricksSizeZ + (bricksSizeZ * j * (1 - vertical)) 
                );
                wall.receiveShadow = true;
                wall.name = "name";
                scene.add(wall);
            }

        }
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
        
        canvas.style.width="100%";
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
    function gameLoop(): void {
        stats.update();
        checkControls();
        stage.update();
        
           

        // render using requestAnimationFrame
        requestAnimationFrame(gameLoop);

        // render the scene
        renderer.render(scene, camera);
        
      
    }
    function switchCurrentCat():void {
        
         if(keyboardControls.switchCat)
            {
                currentCat++;
                if(currentCat==3)
                    currentCat=0;
                keyboardControls.switchCat=false; 
                
                catEars[0].material = catMaterials[currentCat];
                catEars[1].material = catMaterials[currentCat];
                playerVisual.material= catMaterials[currentCat];
                player.scale.set(1/(currentCat+1),1/(currentCat+1),1/(currentCat+1)); //!!! Quite unpredictable things happenning here
                player.mass = catMasses[currentCat];
            }
   }
    
    //check controls
    function checkControls():void
    {
        if (keyboardControls.enabled) {
            velocity = new Vector3();
            switchCurrentCat();
            
            var time: number = performance.now();
            var delta: number = (time - prevTime) / 1000;

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
                    if(currentCat==0)
                    {
                        
                    }
                    else if (currentCat==1){
                        velocity.y += catVelocities[currentCat]*10 * delta;
                        if (player.position.y > 4) {
                            isGrounded = false;
                        }
                    }
                    else if(currentCat == 2){
                    velocity.y += catVelocities[currentCat]*5 * delta;
                    velocity.z -= catVelocities[currentCat]* 8 * delta;
                        if (player.position.y > 3) {
                            isGrounded = false;
                        }
                    }
                    
                }

                player.setDamping(0.7, 0.1);
                // Changing player's rotation
                var tempRot = THREE.Math.clamp(-mouseControls.yaw,-4,4);//values become crazy(up to 30), have to clamp
                player.setAngularVelocity(new Vector3(0, tempRot, 0));
              
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
        camera = new PerspectiveCamera(35, config.Screen.RATIO, 0.1, 300);
        camera.position.set(0, 8, 20);
        //camera.rotation.set(0,0,0);
        //camera.lookAt(player.position);
        console.log("Finished setting up Camera..."
         +"with x" + camera.rotation.x+" y:" + camera.rotation.y+" z:" + camera.rotation.z);
    }

    window.onload = preload;

    return {
        scene: scene
    }

})();

