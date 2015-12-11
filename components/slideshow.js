/*
 * @module resources
 */
define(['jquery', 'spin'], function ($, S)
{

	var slideshow = function()
	{
		var brush1;
		var drawingTool,drawingTool2;
		var curPane = 0;
		var curSlide = 0;
		var numSlides = 0;
		/**
		 * Backreference
		 * 
		 * @property self
		 * @private
		 * @type {Object}
		 */
		var self = this;
		var slideshowHeight = 100;
		var whiteBoard;

		this.s = null;
		/**
		 * Method to register the {{#crossLink "dataManager"}}{{/crossLink}} with the {{#crossLink "resourceManager"}}{{/crossLink}}
		 *
		 * @method create
		 * @chainable
		 * return {Object} self
		 */
		this.create = function()
		{	
			resourceMan.setResource('slideshow', self);
			self.s = new S();
			
			$('#display-slideshow').on('click.ph-plus-slideshow', function (e) {
				if ($(this).hasClass('disabled') || $(this).hasClass('active')) {
					return false;
				}
				if($(this).parent().hasClass("pp-view") && $("html").hasClass("lightRoomCollectionView")) {
					e.preventDefault();
					return false;
				}
				$("body").scrollTop(0);
				$(this).removeClass("secondary");					
				self.createSlideshow();
				$(self).trigger('slideshowOpen');
				return false;
			});
			
			$("#lightroom-whiteboard-close").on("click.ph-plus-slideshow", function (e) {
				self.destroySlideshow();
				$(this).removeClass("secondary");
				$(self).trigger('slideshowClose');
				return false;
			});
			return self;
		};

		this.createSlideshow = function ()
		{
			slidesData = resourceMan.getResource('gsaData').getObjects();
			numSlides = 0;
			curSlide = 0;			

			var slick = $("<div id='slideshow' />");
			slideshowHeight = $(window).height() - 20;

			for(var i=0;i<slidesData.length;i++) {
				var li = $("<div/>");
				li.css("height", slideshowHeight);
				li.addClass("slide");

				var sl = $('<div class="image"></div>');
				var imgCode = '<img src="./theme/img/invis.gif" data-original="';
				imgCode+= slidesData[i].data.preview+'" data-large="';
				imgCode+= slidesData[i].data.preview_large+'" data-small="';
				imgCode+= slidesData[i].data.preview+'" width="';
				imgCode+= slidesData[i].data.image.width+'" height="';
				imgCode+= slidesData[i].data.image.height+'" alt="';
				imgCode+= slidesData[i].data.title+'" class="lazy" />';
				sl.append(imgCode);

				sl.css("height", (slideshowHeight)+"px")
				sl.css("line-height", (slideshowHeight)+"px")
				slick.append(li.append(sl));
				numSlides++;
			};

			slick.css("height", slideshowHeight);
			
			$("#fullsection").before(slick);
			$("#lightroom-whiteboard-actions a").removeClass("active");
			$("#lightroom-whiteboard-single").addClass("active");
			
			$("#lightroom-whiteboard-single, #lightroom-whiteboard-double")
				.off(".ph-plus-lightroom")
				.on("click.ph-plus-lightroom",function (e) {
					if($(this).hasClass("active")) return false;

					$(this).parent().find("a").removeClass("active");
					$(this).addClass("active")

					if($(this).attr("id") == "lightroom-whiteboard-single") {
						self.changeSlideshowViewMode("single");
					} else {
						self.changeSlideshowViewMode("double");
					}
					return false;
				});

			var c = $("#slideshow .slide").eq(0);
			var p = $("#slideshow .slide").eq($("#slideshow .slide").length-1);
			var n = $("#slideshow .slide").eq(0).next();
			
			self.slideshowLoad(c);
			self.slideshowLoad(p);
			self.slideshowLoad(n);

			curPane = c;
			$("#slideshow .slide img").data("curpane",false);
			c.find("img").data("curpane",true)
			
			$("html").addClass("orbit");
			
			self.slideshowSlick($("#slideshow"));			

			$(".slick-slider").css("height", slideshowHeight);
			c.css("opacity",1);

			self.initWhiteboard();
			$("#slideshow .slide").not(".slick-cloned").eq(0).append($("#slideshow").find("canvas"));
		};

		this.slideshowSlick = function(slideshow)
		{
			slideshow.slick({
			  slide:'.slide'
			  ,dots: false
			  ,speed: 1000
			  ,autoplay:false
			  ,lazyLoad:"ondemand"
			  ,autoplaySpeed:7000
			  ,slidesToShow:1
			  ,draggable:false
			  ,slidesToScroll:1
			  ,accessibility:true
			  //,asNavFor: ".slick-nav-"+dom.find('.slick').attr("data-for")
			  ,touchThreshold:12
			  ,cssEase:"ease-in-out"
			  ,useCSS:true
			  ,initialSlide:0
			  ,onAfterChange: function (slide,index) {
			  	curSlide = index;
					curPane = slideshow.find(".slick-active");
					slideshow.find(".slide img").data("curpane",false);
					slideshow.find(".slide").data("curpane",false);
					curPane.find("img").data("curpane",true);
					curPane.data("curpane",true);
				
					var p = slideshow.find(".slide[index='"+(curSlide-1)+"']");
					var n = slideshow.find(".slide[index='"+(curSlide+1)+"']");

					if(curSlide == 0) {
						p = slideshow.find(".slide[index='"+(numSlides-1)+"']");
					}

					if(curSlide >= (numSlides-1)) {
						n = slideshow.find(".slide[index='"+(0)+"']");
					}

					slideshow.find(".slide[index='"+(index)+"']").append(slideshow.find("canvas"));
					self.slideshowLoad(p);
					self.slideshowLoad(n);
			  }
			  ,onBeforeChange: function() {
			  	if(slideshow.attr("id") == "slideshow2") {
			  		drawingTool2.clear();
			  	} else {
			  		drawingTool.clear();
			  	}
			  },
			  onInit:function(){			  
			  }
			});			
		};

		this.changeSlideshowViewMode = function(mode)
		{
			if(mode == "double") {
				$("#slideshow").addClass("double");
				$("#slideshow").slickSetOption("slidesToScroll",1,true);

				var slick2 = $("<div id='slideshow2' />");
				slick2.css("float","right");
				
				$("#slideshow .image").each(function () {
					var sl = $(this).clone();
					sl.wrap('<div/>');
					sl = sl.parent();
					sl
						.css("height", slideshowHeight)
						.addClass("slide");
					slick2.append(sl);
				});

				slick2.addClass("double");
				slick2.css("height", slideshowHeight);
				$("#slideshow").before(slick2);
				self.slideshowSlick(slick2);

				var canvas2 = $("#canvas").clone();
				canvas2.attr("id","canvas2")
				slick2.find(".slick-active").append(canvas2)
				drawingTool2 = new DrawingTool("#canvas2");
				drawingTool2.init();
				drawingTool2.updateBrush(brush1);
				drawingTool2.clear();
				drawingTool.clear();
				
				$("#slideshow").slickSetOption("slidesToScroll",1,true);
				slick2.slickGoTo(1, false);
			} else {
				$("#slideshow2").remove();
				$("#slideshow").removeClass("double");
				$("#slideshow").slickSetOption("slidesToScroll",1,true);
			}
		}
		/*
			LOAD LARGE IMAGE AND CENTER ON SCREEN
		*/
		this.slideshowLoad = function(element)
		{
			var img = element.find("img").eq(0);
			var large = img.attr("data-large");
			var src = img.attr("src");
			
			if(large != src) {
				self.s.spin();
				element.append(self.s.el)
				img.attr("src", large);
			}
		}
		
		this.destroySlideshow = function ()
		{
			// $("#slideshow .slick-slide").not(".slick-cloned").find(".cell").each(function () {
			// 	$("#container").append($(this));
			// });

			$("#slideshow").unslick();
			$("#slideshow").remove();
			$("#slideshow2").unslick();
			$("#slideshow2").remove();
			//$(".orbit-container").remove();
			
			$("html").removeClass("orbit");

			self.destroyWhiteboard();
		};

		this.initWhiteboard = function()
		{
			log("initwhiteboard")
			whiteBoard = $("<canvas/>");
			
			var c = $(".slick-active")//.parent();
			
			whiteBoard.attr("width",c.width()-120);
			whiteBoard.attr("height",c.height()-40);
			whiteBoard.attr("id","canvas");
			$("#slideshow .slide").eq(0).before(whiteBoard);

			drawingTool = new DrawingTool("#canvas");
			drawingTool.init();
			
			brush1 = new Image();
			brush1.src = '/theme/img/pinsel.png';
			brush1.onload = function() {
				drawingTool.updateBrush(brush1);
			};			
		}

		this.destroyWhiteboard = function()
		{
			if (drawingTool) {
				drawingTool.destroy();
			}

			if (drawingTool2) {
				drawingTool2.destroy();
			}
		}

		function DrawingTool (canvasID, brushImage)
		{
			log("init TOOL")
			var dt = this;
			this.renderFunction = (brushImage == null || brushImage == undefined) ? this.updateCanvasByLine : this.updateCanvasByBrush;
			log(this.renderFunction)
			this.brush = brushImage;
			this.touchSupported = Modernizr.touch;
			this.canvasID = canvasID;
			this.mode = false;
			this.states = [];

			this.canvas = $(canvasID);
			this.context = this.canvas.get(0).getContext("2d");	
			this.context.strokeStyle = "#2399ff";
			this.context.strokeStyle = "#2399ff";
			this.context.lineWidth = 3;
			this.lastMousePoint = {x:0, y:0};
		    
			if (this.touchSupported) {
				this.mouseDownEvent = "touchstart.ce";
				this.mouseMoveEvent = "touchmove.ce";
				this.mouseUpEvent = "touchend.ce";
			}
			else {
				this.mouseDownEvent = "mousedown.ce";
				this.mouseMoveEvent = "mousemove.ce";
				this.mouseUpEvent = "mouseup.ce";
			}
			//log(this)
			this.init = function()
			{
				dt.canvas.bind( dt.mouseDownEvent, dt.onCanvasMouseDown());
			};

			this.reinit = function(pane)
			{
				log("reInit Tool")
				log(pane.width())
			};

			this.setMode = function(str) {};

			this.destroy = function (str)
			{
				$(document).unbind( dt.mouseMoveEvent);
				$(document).unbind( dt.mouseUpEvent);
				dt.canvas.unbind( dt.mouseDownEvent);
				dt.canvas.remove();
			};

			this.setMode = function (str)
			{
				dt.mode = str;
				if(dt.mode == "text") {					
					$(document).unbind( dt.mouseMoveEvent);
					$(document).unbind( dt.mouseUpEvent);
					dt.canvas.unbind( dt.mouseDownEvent);
				} else {
					dt.canvas.unbind( dt.mouseDownEvent);
					dt.canvas.bind( dt.mouseDownEvent, function(event) {
						dt.canvas.trigger("change");
						dt.mouseMoveHandler = dt.onCanvasMouseMove();
						dt.mouseUpHandler = dt.onCanvasMouseUp();

						$(document).bind( dt.mouseMoveEvent, dt.mouseMoveHandler );
						$(document).bind( dt.mouseUpEvent, dt.mouseUpHandler );
						
						dt.updateMousePosition( event );
						dt.renderFunction( event );
					});
				}
			}
		
			this.undo = function()
			{
				if(dt.states.length) {
					dt.clear();
					var img = new Image();
					img.src = dt.states.pop();
					dt.context.drawImage(img,0,0);
				}
			};

			this.updateBrush = function(brushImage)
			{				
				var isBrush = (brushImage == null || brushImage == undefined);

				dt.setMode(isBrush ? "brush":"pen");
				dt.renderFunction = isBrush ? dt.updateCanvasByLine : dt.updateCanvasByBrush;
				dt.brush = brushImage;
			};

			this.onCanvasMouseDown = function ()
			{				
				return function (event) {
					dt.canvas.trigger("change");
					dt.mouseMoveHandler = dt.onCanvasMouseMove();
					dt.mouseUpHandler = dt.onCanvasMouseUp();

					$(document).bind( dt.mouseMoveEvent, dt.mouseMoveHandler );
					$(document).bind( dt.mouseUpEvent, dt.mouseUpHandler );
					
					dt.updateMousePosition( event );
					dt.renderFunction( event );
				}
			};

			this.onCanvasMouseMove = function ()
			{				
				return function(event) {
					dt.renderFunction(event);
		     	event.preventDefault();
		    	return false;
				}
			};

			this.onCanvasMouseUp = function (event)
			{				
				return function(event) {
					$(document).unbind( dt.mouseMoveEvent, dt.mouseMoveHandler );
					$(document).unbind( dt.mouseUpEvent, dt.mouseUpHandler );
					
					dt.mouseMoveHandler = null;
					dt.mouseUpHandler = null;
					dt.states.push(dt.toDataURL());

					if(dt.states.length > 5) {
						dt.states.shift();
					}
				}
			};

			this.updateMousePosition = function (event)
			{
			 	var target;
				if (dt.touchSupported) {
					target = event.originalEvent.touches[0];
				} else {
					target = event;
				}

				var offset = dt.canvas.offset();
				dt.lastMousePoint.x = target.pageX - offset.left;
				dt.lastMousePoint.y = target.pageY - offset.top;
			};

			this.updateCanvasByLine = function (event)
			{
				dt.context.beginPath();
				dt.context.moveTo( dt.lastMousePoint.x, dt.lastMousePoint.y );
				dt.updateMousePosition( event );
				dt.context.lineTo( dt.lastMousePoint.x, dt.lastMousePoint.y );
				dt.context.stroke();
			};

			this.updateCanvasByBrush = function (event)
			{
				var halfBrushW = dt.brush.width/2;
				var halfBrushH = dt.brush.height/2;
				
				var start = { x:dt.lastMousePoint.x, y: dt.lastMousePoint.y };
				dt.updateMousePosition( event );
				var end = { x:dt.lastMousePoint.x, y: dt.lastMousePoint.y };
				
				var distance = parseInt( this.distanceBetween2Points( start, end ) );
				var angle = this.angleBetween2Points( start, end );
				
				var x,y;
				
				for ( var z=0; (z<=distance || z==0); z++ )
				{
					x = start.x + (Math.sin(angle) * z) - halfBrushW;
					y = start.y + (Math.cos(angle) * z) - halfBrushH;

					dt.context.drawImage(dt.brush, x, y);
				}
			};

			this.distanceBetween2Points = function ( point1, point2 )
			{
				var dx = point2.x - point1.x;
				var dy = point2.y - point1.y;
				return Math.sqrt( Math.pow( dx, 2 ) + Math.pow( dy, 2 ) );	
			};
			
			this.angleBetween2Points = function ( point1, point2 )
			{			
				var dx = point2.x - point1.x;
				var dy = point2.y - point1.y;	
				return Math.atan2( dx, dy );
			};

			this.toString = function ()
			{
				var dataString = dt.canvas.get(0).toDataURL("image/png");
				var index = dataString.indexOf( "," )+1;
				dataString = dataString.substring( index );
				
				return dataString;
			};

			this.toDataURL = function ()
			{
				return this.canvas.get(0).toDataURL("image/png");
			};

			this.clear = function ()
			{
				var c = this.canvas[0];
				this.context.clearRect( 0, 0, c.width, c.height );
			};
		}
	};

	return slideshow;
});