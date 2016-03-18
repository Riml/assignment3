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