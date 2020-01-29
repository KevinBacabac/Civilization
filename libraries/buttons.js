class Button { // Base class which other classes inherit
  constructor(text) {
    this.text = text;
    this.underline = false;
  }

	draw() {
		// Draw button
		ctx.fillStyle = this.getColour(); // Can be overwritten by classes via inheritance
		ctx.globalAlpha = 0.4;
		this.rect.draw();
		ctx.globalAlpha = 1;
		// Draw highlight if mouseover
		this.rect.highlightDraw();

		ctx.fillStyle = 'white';

    ctx.fillText(this.text, this.rect.centerx(), this.rect.centery());

    if (this.underline) {
      this.underlineText(this.text, this.rect.centerx(), this.rect.centery())
    }
  }

  underlineText(text, x, y) {
    var width = ctx.measureText(text).width;
    var padding = width * 0.05;

    switch(ctx.textAlign) {
      case "center":
      x -= (width/2); break;
      case "right":
      x -= width; break;
    }

    var height = ctx.measureText('I').width;
    y += height / 2;

    ctx.beginPath();
    ctx.strokeStyle = ctx.fillStyle;
    ctx.moveTo(x-padding,y);
    ctx.lineTo(x+width+padding,y);
    ctx.stroke();

  }

	getColour() {
		return 'white';
	}
}

class MenuButton extends Button {
  constructor(y, text) {
    super(text);

  	// Center button horizontally
  	this.rect = new Rect(w / 2 - BUTTON_WIDTH / 2, y, BUTTON_WIDTH, BUTTON_HEIGHT);
	}
}

class ToggleButton extends MenuButton {
	constructor(y, text) {
	    super(y, text);

        // Make button bigger than default
        this.rect.width += 20;
        this.rect.x -= 10;

        this.prefix = text;
	}

	update(toggleVariable) {
		var suffix;
		if (toggleVariable) {
			suffix = 'On';
		} else {
			suffix = 'Off';
		}

		this.text = this.prefix + ' - ' + suffix;
	}
}

class SmallButton extends Button {
  constructor(x, y, width, height, text) {
    super(text);

  	// Center button horizontally
  	this.rect = new Rect(x, y, width, height);
  }
}
