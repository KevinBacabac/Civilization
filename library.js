//From Guzy's Epic Template v7
//artofzombie.com
///////////////////
///		GRAPHICS
var ctx;
var mx;
var my;

//Unchanging menu variables

const TAU = Math.PI * 2;

const BUTTON_WIDTH = 180;
const PHI = 1.618;
const BUTTON_HEIGHT = Math.round(BUTTON_WIDTH / PHI); //Make a golden rectangle
var w;
var h;

function updateLibMouse(a,b) {
	mx = a;
	my = b;
}

function initializeLib(c) {
	ctx = c;

	w = $("#canvas").width();
	h = $("#canvas").height();
}

//Audio - music code from The Rising
class LoopMusic {
    constructor(path, play = true) {
        var musicVar = new Audio(path);
        musicVar.addEventListener('ended', () => {
            this.currentTime = 0;
            this.play();
        }, false);
        if (play) {
            musicVar.play();
        }
        return musicVar;
    }
}
