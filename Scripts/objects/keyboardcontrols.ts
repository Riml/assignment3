module objects {
    // KeyboardControls Class +++++++++++++++
    export class KeyboardControls {
        // PUBLIC INSTANCE VARIABLES ++++++++++++
        public moveForward:boolean;
        public moveBackward:boolean;
        public moveLeft:boolean;
        public moveRight:boolean;
        public jump:boolean;
        public enabled:boolean;
       
    
        // CONSTRUCTOR ++++++++++++++++++++++++++    
        constructor() {
             document.addEventListener('keydown',this.onKeyDown.bind(this),false);
             document.addEventListener('keyup',this.onKeyUp.bind(this),false);
        }
        
         //PUBLIC METHODS +++++++++++++++++++++++++++++++++++++++
       /* public enabled():void{
            console.log();
             document.addEventListener('keydown',this.onKeyDown.bind(this),false);
             document.addEventListener('keyup',this.onKeyUp.bind(this),false);
        }
        public disabled():void{
             document.removeEventListener('keydown',this.onKeyDown.bind(this),false);
             document.removeEventListener('keyup',this.onKeyUp.bind(this),false);
        }
        */
         
         
        public onKeyDown(event.KeyboardEvent):void{
            switch(event.KeyCode){
               case 38:     //up
               case 87:     //W
               this.moveForward=true;
               break;
               case 37:     //left
               case 65:     //a
               this.moveLeft=true;
               break;
               case 40:     //back
               case 83:     //s
               this.moveBackward=true;
               break;
               case 39:     //up
               case 68:     //W
               this.moveRight=true;
               break;
               case 32:     //Space
               this.jump=true;
               break;
           };
       }
       
       public onKeyUp(event.KeyboardEvent):void{
            switch(event.KeyCode){
               case 38:     //up
               case 87:     //W
               this.moveForward=false;
               break;
               case 37:     //left
               case 65:     //a
               this.moveLeft=false;
               break;
               case 40:     //back
               case 83:     //s
               this.moveBackward=false;
               break;
               
               case 39:     //up
               case 68:     //W
               this.moveRight=false;
               break
               
               case 32:     //Space
               this.jump=false;
               break;
           };
       }
    }
}




