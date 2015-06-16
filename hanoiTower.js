;(function(root, factory) {

  if (typeof define === 'function' && define.amd) {
    define(factory);
  } else if (typeof exports === 'object') {
    module.exports = factory();
  } else {
    root.Hanoi = factory();
  }

})(this, function() {

	function Hanoi(el) {

		this.canvas = el;
		this.ctx = this.canvas.getContext('2d');
		this.disks = [{x:22,y:250,w:85,h:20}, {x:34,y:230,w:60,h:20}, {x:45,y:210,w:40,h:20}];
	    this.rods = [{x:62,y:170,w:5,h:100}, {x:142,y:170,w:5,h:100}, {x:222,y:170,w:5,h:100}];
        this.disks_on_rod = [[{x:22,y:250,w:85,h:20}, {x:34,y:230,w:60,h:20}, {x:45,y:210,w:40,h:20}], [], []];
        this.polygons = this.disks.concat(this.rods);
        this.dragging;
        this.droppable;
        this.mouseX;
        this.mouseY;
        this.dragIndex;
        this.dropIndex;
        this.savedPosition;
        this.from;
        this.empty = true;
		
		this.initEvents();

	}

	Hanoi.prototype.drawPolygons = function() {

		for(var i=0; i<this.polygons.length; i++) {
        
        this.ctx.fillStyle = "#000";
        this.ctx.beginPath();
        this.ctx.fillRect(this.polygons[i].x, this.polygons[i].y, this.polygons[i].w, this.polygons[i].h);
        this.ctx.closePath();
        this.ctx.fill();
    }

	};

	Hanoi.prototype.drawScene = function() {
	    this.ctx.clearRect(0,0,this.canvas.width,this.canvas.height);
		this.ctx.fillStyle = "#fff";
		this.ctx.strokeStyle = "#000"
		this.ctx.strokeRect(0,0,this.canvas.width,this.canvas.height);
		
		this.drawPolygons();		
	};
	
	Hanoi.prototype.initEvents = function() {
		
		this.mouseDown = this.mouseDownListener.bind(this);
		this.mouseUp = this.mouseUpListener.bind(this);
		this.mouseMove = this.mouseMoveListener.bind(this);
		
		this.canvas.addEventListener('mousedown', this.mouseDown, false);
		this.canvas.addEventListener('touchstart', this.DragEvent, false);
	
	};

	Hanoi.prototype.DragEvent = function(e) {

		var touches = e.changedTouches,
			first = touches[0],
			type = '';

		switch(e.type) {

			case 'touchstart':
			type = 'mousedown';
			break;
	 
		  case 'touchmove':
			type = 'mousemove';
			e.preventDefault();
			break;
	 
		  case 'touchend':
			type = 'mouseup';
			break;
		
		  default:
			return;
		}

		var simulateEvent = new MouseEvent(type, {

			'view': window,
			'bubbles': true
		});

		first.target.dispatchEvent(simulateEvent);
	}

	Hanoi.prototype.mouseDownListener = function(e) {

		e.preventDefault();

        var bRect = this.canvas.getBoundingClientRect();
       
        this.mouseX = (e.clientX - bRect.left)*(this.canvas.width/bRect.width);
        this.mouseY = (e.clientY - bRect.top)*(this.canvas.height/bRect.height);

        for (var i=0; i<this.disks.length; i++) {
            
            if(this.hitTest(this.disks[i], this.mouseX, this.mouseY)) {
				    
					this.dragHoldX = this.mouseX - this.disks[i].x;
					this.dragHoldY = this.mouseY - this.disks[i].y;
					this.dragIndex = i;
					this.savePosition(this.disks[this.dragIndex]);
					this.empty = false;

					for (var k=0; k < this.rods.length; k++) {
			    
			            if (this.intersect(this.rods[k], this.disks[this.dragIndex])) {
			        
			                this.from = k;

			                if (this.isTop(this.from, this.disks[this.dragIndex])) {

			                	this.dragging = true;
			                }

			            }
			        }	   
			}
        }
        
        if(this.droppable) { this.droppable = false; }
        
        if(this.dragging) {
            window.addEventListener('mousemove', this.mouseMove, false);
            window.addEventListener('touchmove', this.DragEvent, false);
        }
        
        window.addEventListener('mouseup', this.mouseUp, false);
        window.addEventListener('touchend', this.DragEvent, false);
        this.canvas.removeEventListener('mousedown', this.mouseDown, false);
        this.canvas.removeEventListener('touchstart', this.DragEvent, false);
	};

	Hanoi.prototype.mouseUpListener = function() {

		this.canvas.addEventListener("mousedown", this.mouseDown, false);
		this.canvas.addEventListener('touchstart', this.DragEvent, false);
	    window.removeEventListener("mouseup", this.mouseUp, false);
	    window.removeEventListener('touchend', this.DragEvent, false);  
	    
		if (this.dragging) {
			this.dragging = false;
			window.removeEventListener("mousemove", this.mouseMove, false);
		}
		

        for (var j=0; j<this.rods.length; j++) {
		    
		    if(this.intersect(this.rods[j], this.disks[this.dragIndex])) {

		        this.dropIndex = j;
		        if (this.canDrop(this.dropIndex, this.disks[this.dragIndex])) {
		        		this.droppable = true;
		        	} else {
		        		this.droppable = false;
		        	}
		    } 
		}
	    
		if (this.droppable && !this.empty) {
		    
		    this.fit(this.dropIndex, this.rods[this.dropIndex], this.disks[this.dragIndex]);
		    this.removeDisk(this.from);
		    this.addDisk(this.dropIndex, this.disks[this.dragIndex]);

		} else {
		    this.backward(this.disks[this.dragIndex]);
		}
		
		if (this.disks_on_rod[2].length === 3) {
		    
		    alert('You are winner!');
		    this.canvas.removeEventListener('mousedown', this.mouseDown, false);
		}
	};

	Hanoi.prototype.mouseMoveListener = function(e) {

		var posX;
		var posY;
		
		var minX = 0;
		var maxX = this.canvas.width - this.disks[this.dragIndex].w;
		var minY = 0;
		var maxY = this.canvas.height - this.disks[this.dragIndex].h;
		
		var bRect = this.canvas.getBoundingClientRect();
		this.mouseX = (e.clientX - bRect.left)*(this.canvas.width/bRect.width);
		this.mouseY = (e.clientY - bRect.top)*(this.canvas.height/bRect.height);
		
		posX = this.mouseX - this.dragHoldX;
		posX = (posX < minX) ? minX : ((posX > maxX) ? maxX : posX);
		posY = this.mouseY - this.dragHoldY;
		posY = (posY < minY) ? minY : ((posY > maxY) ? maxY : posY);
		
		this.disks[this.dragIndex].x = posX;
		this.disks[this.dragIndex].y = posY;
	};

	Hanoi.prototype.hitTest = function(shape,mx,my) {
		
		return (shape.x <= mx) && (shape.x + shape.w >= mx) && (shape.y <= my) && (shape.y + shape.h >= my);
	};
	
    
    Hanoi.prototype.intersect = function(shape1,shape2) {
        
        var XSect=false;
        var YSect=false;

        if ((shape1.x + shape1.w >= shape2.x) && (shape1.x <= shape2.x + shape2.w)) XSect = true;
        if ((shape1.y + shape1.h >= shape2.y) && (shape1.y <= shape2.y + shape2.h)) YSect = true;

        if (XSect&YSect){return true;}
        return false;
    };
    
    Hanoi.prototype.fit = function(to, rod, disk) {
        
		var top = this.getTop(to);
		
		if (top) {

			disk.y = top.y - disk.h;
			
		} else {

			disk.y = rod.y + rod.h - disk.h;
		}
		
		rod.center = rod.x + (rod.w/2);
		disk.x = rod.center - disk.w/2;
    };
	
	Hanoi.prototype.addDisk = function(to, disk) {

		this.disks_on_rod[to].push(disk);
	};

	Hanoi.prototype.removeDisk = function(from) {

		this.disks_on_rod[from].pop();
	};


	Hanoi.prototype.getTop = function(dropIndex) {

		var lastDisk = this.disks_on_rod[dropIndex].length - 1;

		return this.disks_on_rod[dropIndex][lastDisk] || null;
	};
	
	Hanoi.prototype.savePosition = function(disk) {
	    
	    this.savedPosition = {x: disk.x, y: disk.y};
	};
	
	Hanoi.prototype.backward = function(disk) {
	    
	    disk.x = this.savedPosition.x;
	    disk.y = this.savedPosition.y;
	};
	
	Hanoi.prototype.canDrop = function(dropIndex, disk) {
	    
	    var top = this.getTop(dropIndex);
	    
	    if(top) { return disk.w < top.w; } else { return true;}
	};
	
	Hanoi.prototype.isTop = function(from, disk) {
	    
	    var top = this.getTop(from);

	    if (top.y !== disk.y) return false;
	    
	    return true;
	};

	var Hanoi = new Hanoi(document.getElementById('canvas'));

	setInterval(function() {Hanoi.drawScene();}, 30);

});