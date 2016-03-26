/*
ADVANCED_GRAPHICS_COMP392_A3
CENTENNIAL_COLLEGE_W2016
Author: Ilmir Taychinov 300760705
Based on: Tom Tsiliopoulos template
Created: 7 March 2016
Last Modified: 25 March 2016
*/
var objects;
(function (objects) {
    // MouseControls Class +++++++++++++++
    var MouseControls = (function () {
        // CONSTRUCTOR +++++++++++++++++++++++
        function MouseControls() {
            this.enabled = false;
            this.sensitivity = 0.1;
            this.yaw = 0;
            this.pitch = 0;
            document.addEventListener("mousemove", this.OnMouseMove.bind(this), false);
        }
        MouseControls.prototype.OnMouseMove = function (event) {
            this.yaw = event.movementX * this.sensitivity * 4;
            this.pitch = event.movementY * this.sensitivity * 0.02;
        };
        return MouseControls;
    }());
    objects.MouseControls = MouseControls;
})(objects || (objects = {}));

//# sourceMappingURL=mousecontrols.js.map
