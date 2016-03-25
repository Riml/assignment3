/*
ADVANCED_GRAPHICS_COMP392_A3
CENTENNIAL_COLLEGE_W2016
Author: Ilmir Taychinov 300760705
Based on: Tom Tsiliopoulos template 
Created: 7 March 2016
Last Modified: 25 March 2016 
*/
module objects {
    // MouseControls Class +++++++++++++++
    export class MouseControls {
        // PUBLIC INSTANCE VARIABLES +++++++++
        public sensitivity: number;
        public yaw:number;
        public pitch:number;
        public enabled:boolean;
        // CONSTRUCTOR +++++++++++++++++++++++
        constructor() {
            this.enabled=false;
            this.sensitivity=0.1;
            this.yaw=0;
            this.pitch=0;
            
            document.addEventListener("mousemove", this.OnMouseMove.bind(this),false);
            
        }
        
        public OnMouseMove(event: MouseEvent):void{
            this.yaw = event.movementX*this.sensitivity*4;
            
            this.pitch = event.movementY*this.sensitivity*0.05;
        }
    }
}