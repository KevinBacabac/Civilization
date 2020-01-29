function collisionRect(object1, object2) {
    return (object1.x < object2.x + object2.width &&
            object1.x + object1.width > object2.x &&
            object1.y < object2.y + object2.height &&
            object1.y + object1.height > object2.y)

}

function collisionPoint(pointX, pointY, rect) {
	return (pointX > rect.x && pointX < rect.right() &&
		    	pointY > rect.y && pointY < rect.bottom());
}

class Rect {
  constructor(x, y, w, h) {
  	this.x = x;
  	this.y = y;

  	this.width = w;
  	this.height = h;
	}

	right() {
		return this.x + this.width;
	}

	bottom() {
		return this.y + this.height;
	}

  pos() {
    return [this.x, this.y];
  }

	center() {
		return [this.centerx(), this.centery()];
	}

	centery() {
		return this.y + this.height / 2;
	}

	centerx() {
		return this.x + this.width / 2;
	}

  dist(rectTwo) {
  	var x1, y1;
    [x1, y1] = this.center();

    var x2, y2;
    [x2, y2] = rectTwo.center();

  	return Math.sqrt(Math.pow((x2 - x1), 2) + Math.pow((y2 - y1), 2));
  }

	draw() {
		ctx.fillRect(Math.round(this.x), Math.round(this.y),
                 Math.round(this.width), Math.round(this.height));
	}

  drawSphere(colour) {
    ctx.fillStyle = colour;
    ctx.beginPath();
    // Radius is slightly smaller than collision rect
    var radius = (this.width + this.height) / 2 - 1;
    ctx.arc(this.centerx(), this.centery(), radius, 0, TAU);
    ctx.fill();
  }

	highlightDraw() {
		//Make button brighter when moused over
		if (this.mouseOver()) {
			ctx.globalAlpha = 0.3;
		} else {
			ctx.globalAlpha = 0;
		}

		ctx.fillStyle = 'white';
		this.draw();

		ctx.globalAlpha = 1;
	}

	mouseOver() {
		return (mx > this.x && mx < this.right() &&
				my > this.y && my < this.bottom());
	}

	inflate(dw, dh) {
		var width = this.width + dw;
		var height = this.height + dh;

		var x = this.centerx() - width / 2;
		var y = this.centery() - height / 2;

		return new Rect(x, y, width, height);
	}

	debug() {
		console.log('x: ' + this.x,
      					'y: ' + this.y,
      					'w: ' + this.width,
      					'h: ' + this.height);
	}

	setCenter(targetRect) {
		this.x = targetRect.centerx() - this.width / 2;
		this.y = targetRect.centery() - this.height / 2;
	}

	setCenterx(centerx) {
		this.x = centerx - this.width / 2;
	}

	setCentery(centery) {
		this.y = centery - this.height / 2;
	}

	setBottom(bottom) {
		this.y = bottom - this.height;
	}

	setRight(right) {
		this.x = right - this.width;
	}
};
