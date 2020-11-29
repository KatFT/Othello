var canvas = document.getElementById("canvas");
var ctx = canvas.getContext("2d");

window.requestAnimFrame = (function (callback) {
    return window.requestAnimationFrame || window.webkitRequestAnimationFrame || window.mozRequestAnimationFrame || window.oRequestAnimationFrame || window.msRequestAnimationFrame || function (callback) {
        window.setTimeout(callback, 1000 / 60);
    };
})();

var startTime = Date.now();
var cycleTime = 15000; // 1000ms X 10 seconds

function animate() {

    requestAnimFrame(animate);
    
    var elapsed = Date.now() - startTime;

    var elapsedCycle = elapsed % cycleTime;

    var elapsedPercent = elapsedCycle / cycleTime;

    var radianRotation = Math.PI * 2 * elapsedPercent;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.beginPath();
    ctx.arc(40, 40, 30, -Math.PI / 2, -Math.PI / 2 + radianRotation, false);
    ctx.strokeStyle = "orange";
    ctx.lineWidth = 11.0;
    ctx.stroke();

    cancelAnimationFrame(animate);

}
