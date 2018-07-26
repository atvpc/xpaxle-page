/************************************************************
 * Slide
 *
 * A timed slideshow made in Exhibeo
 *
 * Exhibeo: Web galleries – from the future!
 * http://exhibeoapp.com
 * © Copyright Softpress Systems – 2012
 *************************************************************/

(function() {
	/* Globals */
	// Does the browser support CSS Transitions and Animations?
	window.xbTransitions = window.xbTransitions || (function() {
		var body = document.body || document.documentElement;
		return body.style.transition !== undefined 
				|| body.style.WebkitTransition !== undefined
				|| body.style.MozTransition !== undefined 
				|| body.style.MsTransition !== undefined 
				|| body.style.OTransition !== undefined;
	})();
	
	// Does the browser support 3D Transforms
	window.xb3dTransforms = window.xb3dTransforms || (function() {
		var body = document.body || document.documentElement;
		return body.style.perspective !== undefined 
				|| body.style.WebkitPerspective !== undefined
				|| body.style.MozPerspective !== undefined 
				|| body.style.MsPerspective !== undefined 
				|| body.style.OPerspective !== undefined;
	})();
	
	function on(el, evt, fn, bubble) {
		var evts = evt.split(" "),
			i = 0,
			l = evts.length;
		for(i; i < l; i++) {
			evt = evts[i];
			if("addEventListener" in el) { // Standards
				try {
					el.addEventListener(evt, fn, bubble);
				} catch(e) {
					if(typeof fn == "object" && fn.handleEvent) {
						el.addEventListener(evt, function(e){
							fn.handleEvent.call(fn, e);
						}, bubble);
					} else
						throw e;
				}
			}
			else if("attachEvent" in el) { // IE
				if(typeof fn == "object" && fn.handleEvent) {
					el.attachEvent("on" + evt, function(){
						fn.handleEvent.call(fn, window.event);
					});
				} else
					el.attachEvent("on" + evt, fn);
			}
		}
	}
	
	function removeEvt(el, evt, fn, bubble) {
		var evts = evt.split(" "),
			i = 0,
			l = evts.length;
		for(i; i < l; i++) {
			evt = evts[i];
			if("removeEventListener" in el) { // Standards
				try {
					el.removeEventListener(evt, fn, bubble);
				} catch(e) {
					if(typeof fn == "object" && fn.handleEvent) {
						el.removeEventListener(evt, function(e){
							fn.handleEvent.call(fn, e);
						}, bubble);
					} else
						throw e;
				}
			} 
			else if("detachEvent" in el) { // IE
				if(typeof fn == "object" && fn.handleEvent) {
					el.detachEvent("on" + evt, function(){
						fn.handleEvent.call(fn);
					});
				} else
					el.detachEvent("on" + evt, fn);
			}
		}
	}

	Slide = function(element, options) {
		
        // Globals
        this.gTransitionEnd = "transitionend webkitTransitionEnd oTransitionEnd otransitionend transitionEnd";
        this.gPrefixes = {"Webkit": "-webkit-","Moz": "-moz-","O": "-o-","MS": "-ms-"};
        
		options = this.options = options || {};
        this.options.animation = options.animation || "fade";
		this.options.randomImages = options.randomImages || false;
		this.options.sections = options.sections || 6;
		// Set the default slide duration to 5 seconds if no value has been provided
		this.options.duration = options.duration || 5;

		this.options.captions = options.captions || 1;
		
		this.element = element;
		this.id = element.id;
		this.index = 0;
 
        // Sets this.images as an array of image objects (image path, title, description, and url
		this.setImages();
		
		this.animations = ["glide", "fade", "fold", "flip", "shutter"];
		
		this.body = document.body || document.documentElement;
		
		// Get the anchor element
		var figure = element.getElementsByTagName("figure")[0];
		// Get the img element
			img = figure.getElementsByTagName("img")[0];
		
		figure.style.backgroundImage = "url(" + this.images[this.index].image + ")";
	
		on(document, "keydown", this, false);
	
		// Start the timer
		if(img.complete) {
			// Start the timer and pass in the next image, or a random number between 1 and this.length
			this.startTimer();
		}
		else {
			on(img, "load", this, false);
		}
	};
	Slide.prototype = {
        timerInit: function() {
            // Add a timer item
            this.timer = this.element.appendChild(document.createElement("div"));
            this.timer.className = "slide-timer";
            this.timer.id = this.id + "-slide-timer";
        },

        // Start timer
		startTimer: function() {
			this.setNextIndex();
			
			var nextImage = new Image(),
				_this = this;
			
			// Start loading the next image
			nextImage.src = this.images[this.nextIndex].image;
	
			// If transitions are supported, set the next slide to show once complete
			if(window.xbTransitions) {
                on(this.timer, this.gTransitionEnd, this, false);
                this.setDuration(this.options.duration);
				//setTimeout(function() { _this.timer.className = "slide-timer slide-playing" }, 100);
			}
			else { // Otherwise set up a timer manually
				var distance = this.element.clientWidth/(this.options.duration*25), // per second
					delay = 40, // milliseconds
					animate = function() {
						_this.timer.style.width = (_this.timer.clientWidth + Math.ceil(distance)) + "px";
						_this.finished = _this.timer.clientWidth >= _this.element.clientWidth;
						if(!_this.finished)
							_this.timeout = setTimeout(animate, delay);
						else if(_this.finished)
							_this.transitionEnd(_this.timer);
						
					}
					animate();
			}
		},
		
		// Setters
		setNextIndex: function() {
			this.nextIndex = this.options.randomImages ? this.getRandomInt(0, this.length) : this.index + 1;
			
			// Make sure we get a different number to the current index
			while(this.nextIndex == this.index)
				this.nextIndex = this.getRandomInt(0, this.length);
			
			// Check to make sure the next image is in range
			if(this.nextIndex >= this.length)
				this.nextIndex = 0
			else if(this.nextIndex < 0)
				this.nextIndex = this.length-1;
		},
		
		setImages: function() {
			var anchors = this.element.getElementsByTagName("a"),
				images = [],
				initializeTimer = initializeTimer || false;
			
			for(var i = 0, l = anchors.length; i < l; i++) {
				if(!anchors[i].href || anchors[i].parentNode != this.element)
					continue;
				images.push({
					"image": anchors[i].href,
					"title": anchors[i].title,
					"description": anchors[i].getAttribute("data-content"),
					"url": anchors[i].getAttribute("data-url")
				});
			}
			
			this.images = images;
			this.length = images.length;
			
			// Make sure index isn't out of bounds
			if(this.index >= this.length) {
				this.index = this.options.randomImages ? this.getRandomInt(0, this.length) : 0;
			}
			
			// Set the next index to make sure the existing one isn't out of bounds
			this.setNextIndex();
			
			var figure = this.element.getElementsByTagName("figure")[0];
			figure.parentNode.replaceChild(this.makeNextElement(this.index), figure);
            
            this.timerInit();
            this.startTimer();
		},
 
         setDuration: function(duration) {
             this.options.duration = duration;
 
            // Reset the timer
            this.resetTimer();
                
             if(window.xbTransitions) {
                var _this = this;
                setTimeout(function() {
                           style = _this.timer.style;
                           style.webkitTransitionDuration = style.MozTransitionDuration = style.msTransitionDuration = style.OTransitionDuration = style.transitionDuration = duration + "s";
                
                           _this.timer.className = "slide-timer slide-playing";
                        }, 50);
             }
             else {	// Change the timer manually by clearing and resetting intervals
                var _this = this,
                    distance = this.element.clientWidth/(this.options.duration*1000)*10;
                
                this.timer.style.width = "";
                clearInterval(this.timerInterval);
                clearInterval(this.interval);
                this.timerInterval =
                this.interval = undefined;
                
                this.timerInterval = this.timerInterval || setInterval(function() {
                    _this.timer.style.width = (_this.timer.clientWidth + distance) + "px";
                    if(_this.timer.clientWidth >= _this.element.clientWidth)
                        _this.transitionEnd(_this.timer);
                    }, 10);		
             }
         },
        
        /*
         * Animations are:
         *  fade,
         *  glide,
         *  fold,
         *  shutter,
         *  flip,
         *  random
         */
		setAnimation: function(animation) {
			// Check the animation exists
			if(this.animations.indexOf(animation) != -1 || animation == "random")
				this.options.animation = animation;
		},
		
        /*
         * Options are: 
         *  randomImages (bool),
         *  sections (int),
		 *	captions (bool)
         */
		setOption: function(option, value) {
			if(option in this.options)
				this.options[option] = value;
	
			var image = this.images[this.index];
	
			if(option == "captions" && (image.title || image.description)) {
				var captions = document.getElementsByTagName("figcaption");
				if(captions.length) {
					for(var i = 0; i < captions.length; i++)
						captions[i].style.display = value ? "block" : "none";
				}
				else if (!this.animating) {
					var figure = this.element.getElementsByTagName("figure"),
						anchor = figure[0].getElementsByTagName("a"),
						container =  anchor.length ? anchor[0] : figure[0];
					addCaptions(container, image);
				}
			}
		},
        
        // Reset the timer
        resetTimer: function() {
			window.clearTimeout(this.timeout);
            var style = this.timer.style;
            style.webkitTransitionDuration = style.MozTransitionDuration = style.msTransitionDuration = style.OTransitionDuration = style.transitionDuration = "";
            style.width = "";
            this.timer.className = "slide-timer";
 
        },
		
		makeNextElement: function(index) {
			
			var figure = document.createElement("figure"),
				image = this.images[index],
				url = image.url,
				anchor,
				img,
				caption,
				title,
				description;
	
            // If there's a url, add a an anchor wrapper for the image
			if(url) {
				anchor = figure.appendChild(document.createElement("a"));
				anchor.href = url;
				img = anchor.appendChild(new Image());
			}
			else
				img = figure.appendChild(new Image());
			
			
			
			figure.style.backgroundImage = "url('" + image.image.replace(/'/g, "\\\'") + "')";
			img.src = image.image;
			
			this.addCaption((anchor || figure), image);
	
			return figure;
		},
	
		addCaption: function(container, image) {
			// Check if there's a title or description and build a caption, if so.
			if(this.options.captions && (image.title || image.description)) {
				caption = container.appendChild(document.createElement("figcaption"));
				
				if(image.title) {
					title = caption.appendChild(document.createElement("h1"));
					title.appendChild(document.createTextNode(image.title));
				}
				
				if(image.description) {
					description = caption.appendChild(document.createElement("p"));
					description.insertAdjacentHTML("afterbegin", image.description);
					//description.appendChild(document.createTextNode(image.description));
				}
			}
			
		},
		
		// Animations ====================
		// Slide
		glide: function(index) {
		
			// Fall back to a fade if the browser doesn't support transitions
			if(!window.xbTransitions) {
				this.fade(index);
				return;
			}
				
			var container = this.element.appendChild(document.createElement("div")),
				style = container.style,
				oldFigure = this.element.getElementsByTagName("figure")[0].cloneNode(true),
				newFigure = this.makeNextElement(index);
			
			container.className = "slide-container";
			style.position = "absolute";
			style.top = 
			style.left = "0";
			style.width = (this.element.clientWidth * 2) + "px";
			style.height = this.element.clientHeight + "px";

			container.appendChild(oldFigure);
			container.appendChild(newFigure);
			
			oldFigure.style.position =
			newFigure.style.position = "absolute";
			
			oldFigure.style.width =
			newFigure.style.width = this.element.clientWidth + "px";
			
			oldFigure.style.height =
			newFigure.style.height = "100%";
			
			oldFigure.style.left = "0";
			newFigure.style.left = this.element.clientWidth + "px";
			
			style.webkitTransitionDuration = style.MozTransitionDuration = style.msTransitionDuration = style.OTransitionDuration = style.transitionDuration = "1s";
			
			if(window.xbTransitions)
				on(container, this.gTransitionEnd, this, false);
			else
				this.transitionEnd(container);
			
			style.webkitTransform = style.MozTransform = "translate3d(" + -this.element.clientWidth + "px,0,0)";
			style.msTransform = style.OTransform = "translateX(" + -this.element.clientWidth + "px)";
		},
		
		// Fade
		fade: function(index) {
			var oldFigure = this.element.getElementsByTagName("figure")[0],
				newFigure = this.element.insertBefore(this.makeNextElement(index), this.element.firstElementChild || this.element.children[0]);
			
			// Add the transition listener
			if(window.xbTransitions)
				on(oldFigure, this.gTransitionEnd, this, false);
			else
				this.transitionEnd(oldFigure);
				
            // Add the transition listener
            if(window.xbTransitions) {
                on(oldFigure, this.gTransitionEnd, this, false);
                // Start the transition
                oldFigure.className = "slide-fade";
            }
            else {
                oldFigure.className = "slide-fade";
                this.transitionEnd(oldFigure);
            }
		},
		
		// Fold
		fold: function(index) {
			
			// Fall back to a fade if the browser doesn't support transitions or 3dTransforms
			if(!window.xbTransitions || !window.xb3dTransforms) {
				this.fade(index);
				return;
			}
			
			var container = this.element.appendChild(document.createElement("div")),
				style = container.style,
				oldFigure = this.element.getElementsByTagName("figure")[0],
				newFigure = this.makeNextElement(index),
				elWidth = this.element.clientWidth,
				fold, 
				foldPart,
				shadow,
				style,
				i;
			
			this.foldStylesheet;
            this.foldStyles = this.foldStyles || [];
			
			container.className = "slide-fold-container";
			newFigure.className = "slide-fold-new";
			
			for(i = 0; i < this.options.sections * 2; i++) {
				// If we're on an even index make a new fold item
				if(!(i % 2)) {
					fold = container.appendChild(document.createElement("div"));
					fold.className = "slide-fold";
					style = fold.style;
					style.width =  Math.ceil((elWidth / this.options.sections)) + "px";
                    style.height =  this.element.clientHeight + "px";
					
					// Add the first part of the fold
					foldPart = oldFigure.cloneNode(false);
					fold.appendChild(foldPart);
					foldPart.className = "slide-fold-first";
				}
				else {
					// Add the second part of the fold
					foldPart = oldFigure.cloneNode(false);
					fold.appendChild(foldPart);
					foldPart.className = "slide-fold-second";
				}
				
				shadow = foldPart.appendChild(document.createElement("span"));
				shadow.className = "slide-fold-shadow";
				
				// Postion the fold parts
				style = foldPart.style;
				style.position = "absolute";
				style.left = !(i % 2) ? 0 : Math.ceil((elWidth / this.options.sections/2)) + "px";
				style.width = Math.ceil((elWidth / this.options.sections/2)) + "px";
				style.height = "100%";
				style.backgroundPosition = -Math.ceil(((elWidth / this.options.sections/2) * i)) + "px 0";

			}
			
			oldFigure.parentNode.removeChild(oldFigure);

			container.style.width = (elWidth * 2) + "px";
			container.appendChild(newFigure);

			newFigure.style.position = "absolute";
			newFigure.style.width = elWidth + "px";
			newFigure.style.height = this.element.clientHeight + "px";
			newFigure.style.left = elWidth + "px";
			
			if(window.xbTransitions)
				on(container, this.gTransitionEnd, this, false);
			else
				this.transitionEnd(newFigure);
            
            
            // Find a stylesheet to use
			this.foldStylesheet = document.styleSheets[document.styleSheets.length-1] || this.foldStylesheet;
            this.foldStylesAdded = this.foldStylesAdded || false;
            this.oldSections = this.oldSections || this.options.sections;

			if("insertRule" in this.foldStylesheet) {
 
                // If we haven't added the necessary styles, add them
                if(!this.foldStylesAdded || this.oldSections != this.options.sections) {
                    
                    // If the number of folds has changed, remove the old styles
                    if(this.oldSections != this.options.sections) {
                        
                        for(var j = this.foldStyles.length-1; j > -1; j--)
                            this.foldStylesheet.deleteRule(this.foldStyles[j]);
 
                        this.oldSections = this.options.sections;
                        this.foldStyles = [];
                    }
 
                    var prefix;
                    if("Transform" in newFigure.style)
                    	prefix = "";
                    else
						for(var p in this.gPrefixes)
							if(p + "Transform" in newFigure.style)
								prefix = this.gPrefixes[p];
 
                    this.foldStyles.push(this.foldStylesheet.cssRules.length);
                    this.foldStylesheet.insertRule(".slide-fold-active .slide-fold .slide-fold-first {" +
                        prefix + "transform: translate3d(0,0,0) rotate3d(0,1,0,90deg); }", this.foldStylesheet.cssRules.length);
                    this.foldStyles.push(this.foldStylesheet.cssRules.length);
                    this.foldStylesheet.insertRule(".slide-fold-active .slide-fold .slide-fold-second {" +
                        prefix + "transform: translate3d(-" + (elWidth / this.options.sections) + "px,0,0) rotate3d(0,1,0,-90deg); }", this.foldStylesheet.cssRules.length);
                    for(i = 1; i < this.options.sections; i++) {
                        this.foldStyles.push(this.foldStylesheet.cssRules.length);
                        this.foldStylesheet.insertRule(".slide-fold-active .slide-fold:nth-child(" + (i + 1) + ") {" +
                            prefix + "transform: translate3d(-" + ((elWidth / this.options.sections) * i) + "px,0,0);}", this.foldStylesheet.cssRules.length);
                    }
                    this.foldStylesAdded = true;
                }
			}
			
			setTimeout(function() { container.className += " slide-fold-active" }, 1);
		},
		
		flip: function(index) {
			
			// Fall back to a fade if the browser doesn't support transitions or 3dTransforms
			if(!window.xbTransitions || !window.xb3dTransforms) {
				this.fade(index);
				return;
			}
			
			var container = this.element.appendChild(document.createElement("div")),
				style = container.style,
				oldFigure = this.element.getElementsByTagName("figure")[0],
				newFigure = this.makeNextElement(index),
				elWidth = this.element.clientWidth,
				elHeight = this.element.clientHeight,
				flipPart,
				shadow,
				style,
				i;
			
			this.element.style.overflow = "visible";
			this.element.style.webkitTransform = "translateZ(0)";
			
			container.className = "slide-flip-container";
			newFigure.className = "slide-flip-new";

			for(i = 0; i < this.options.sections; i++) {
				
				flipPart = newFigure.cloneNode(false);
				container.appendChild(flipPart);
				flipPart.className = "slide-flip-back";
				style = flipPart.style;
				style.position = "absolute";
				style.top = Math.ceil((elHeight / this.options.sections) * i) + "px";
				style.height = Math.ceil((elHeight / this.options.sections)) + "px";
				style.width = "100%";
				style.backgroundPosition = "0 " + -Math.ceil(((elHeight / this.options.sections) * i)) + "px";
				
				flipPart = oldFigure.cloneNode(false);
				container.appendChild(flipPart);
				flipPart.className = "slide-flip-front";
				style = flipPart.style;
				style.position = "absolute";
				style.top = Math.ceil((elHeight / this.options.sections) * i) + "px";
				style.height = Math.ceil((elHeight / this.options.sections)) + "px";
				style.width = "100%";
				style.backgroundPosition = "0 " + -Math.ceil(((elHeight / this.options.sections) * i)) + "px";
			}
			
			oldFigure.parentNode.removeChild(oldFigure);

			container.style.width = elWidth + "px";
			container.style.height = this.element.clientHeight + "px";
			
			if(window.xbTransitions)
				on(container, this.gTransitionEnd, this, false);
			else
				this.transitionEnd(flipPart);

			setTimeout(function() { container.className += " slide-flip-active" }, 1);
		},
		
		// Shutter
		shutter: function(index) {
			
			// Fall back to a fade if the browser doesn't support transitions or 3dTransforms
			if(!window.xbTransitions || !window.xb3dTransforms) {
				this.fade(index);
				return;
			}
			
			var container = this.element.appendChild(document.createElement("div")),
				style = container.style,
				oldFigure = this.element.getElementsByTagName("figure")[0],
				newFigure = this.makeNextElement(index),
				elWidth = this.element.clientWidth,
				shutterPart,
				shadow,
				style,
				i;
			
			this.element.style.overflow = "visible";
			this.element.style.webkitTransform = "translateZ(0)";
			
			container.className = "slide-shutter-container";
			newFigure.className = "slide-shutter-new";
								
			for(i = 0; i < this.options.sections; i++) {
				
				shutterPart = newFigure.cloneNode(false);
				container.appendChild(shutterPart);
				shutterPart.className = "slide-shutter-back";
				style = shutterPart.style;
				style.position = "absolute";
				style.left = Math.ceil((elWidth / this.options.sections) * i) + "px";
				style.width = Math.ceil((elWidth / this.options.sections)) + "px";
				style.height = "100%";
				style.backgroundPosition = -Math.ceil(((elWidth / this.options.sections) * i)) + "px 0";
				
				shutterPart = oldFigure.cloneNode(false);
				container.appendChild(shutterPart);
				shutterPart.className = "slide-shutter-front";
				style = shutterPart.style;
				style.position = "absolute";
				style.left = Math.ceil((elWidth / this.options.sections) * i) + "px";
				style.width = Math.ceil((elWidth / this.options.sections)) + "px";
				style.height = "100%";
				style.backgroundPosition = -Math.ceil(((elWidth / this.options.sections) * i)) + "px 0";
			}
			
			oldFigure.parentNode.removeChild(oldFigure);

			container.style.width = elWidth + "px";
			container.style.height = this.element.clientHeight + "px";
			
			if(window.xbTransitions)
				on(container, this.gTransitionEnd, this, false);
			else
				this.transitionEnd(shutterPart);

			setTimeout(function() { container.className += " slide-shutter-active" }, 1);
		},
		
		random: function(index) {
			// Pick a random animation from the animations array
			this[this.animations[this.getRandomInt(0, this.animations.length-1)]](index);
		},
		
		// Returns a random integer between min and max
		// Using Math.round() will give you a non-uniform distribution!
		getRandomInt: function(min, max) {
			return Math.floor(Math.random() * (max - min + 1)) + min;
		},
		
		showSlide: function(index) {
	
			this.animating = true;
	
			// Check the index isn't out of bounds
			if(index >= this.length)
				index = 0
			else if(index < 0)
				index = this.length-1;
			
			// Set the index
			this.index = index;
			
			// Reset the timer
            this.resetTimer();
			
            // Call the necessary function for the specified animation
            this[this.options.animation](index);
		},
		
		// An image loaded
		imageLoaded: function(e) {
			this.startTimer();
		},
		
		transitionEnd: function(t) {
			if(/slide-timer/.test(t.className)) {
				this.showSlide(this.nextIndex);
			}
			else if(/slide-fade/.test(t.className)) {
				t.parentNode.removeChild(t);
				this.startTimer();
				this.animating = false;
			}
			else if(/slide-container/.test(t.className)) {
				var oldFigure = this.element.getElementsByTagName("figure")[0],
					newFigure = t.lastElementChild || t.children[t.children.length-1]
				this.element.insertBefore(newFigure, oldFigure);
				newFigure.style.left = "";
				this.element.removeChild(oldFigure);
				t.parentNode.removeChild(t);
				this.startTimer();
				this.animating = false;
			}
			else if(/slide-fold-new/.test(t.className)) {
				var oldFoldContainer = t.parentNode,
					newFigure = t;
					
				this.element.insertBefore(newFigure, this.timer);
				newFigure.style.left = "";
				this.element.removeChild(oldFoldContainer);
				this.startTimer();
				this.animating = false;
			}
			else if(/slide-shutter-front/.test(t.className) || /slide-flip-front/.test(t.className)) {
				var oldContainer = t.parentNode,
					newFigure = this.makeNextElement(this.index),
					img = new Image();
				
				if(!oldContainer.parentNode)
					return;
					
				this.element.insertBefore(newFigure, this.timer);
				
				style = newFigure.style;
				style.backgroundPosition =
				style.left =
				style.top =
				style.width =
				style.height = "";
				
				img.src = this.images[this.index].image;
				newFigure.appendChild(img);
				this.element.removeChild(oldContainer);
				this.element.style.overflow =
				this.element.style.webkitTransform = "";
				this.startTimer();
				this.animating = false;
			}
		},
	
		keydown: function(e) {
			if(/textarea|input|select/.test(document.activeElement.nodeName.toLowerCase()))
				return;
			var key = e.which || e.keyCode;
			if(!this.animating && key == 37) {
				this.showSlide(this.index-1);
			}
			else if(!this.animating && key == 39) {
				this.showSlide(this.index+1);
			}
		},
		
		// Handle events
		handleEvent: function(e) {
			var t;
			switch (e.type) {
				case "click": 
				case "load": 
					this.imageLoaded(e); 
					break;
				case "webkitTransitionEnd":
				case "msTransitionEnd":
				case "oTransitionEnd":
				case "OTransitionEnd":
				case "otransitionend":
				case "transitionEnd":
				case "transitionend": 
					t = (e.target || e.srcElement); 
					this.transitionEnd(t); 
					break;
				case "webkitAnimationEnd": 
				case "mozAnimationEnd": 
				case "oAnimationEnd": 
				case "msAnimationEnd": 
				case "animationEnd": 
					t = (e.target || e.srcElement)
					this.options.animationEnd(t); 
					break;
				case "scroll": 
					this.scroll(e); 
					break;
				case "resize": 
				case "orientationchange": 
					this.resize(e);
				case "keydown":
					this.keydown(e);
			}
		}
	};
})();