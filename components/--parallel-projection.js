/*
 - unregister event handlers from buttons in the sidebar on close
 */
define(['jquery', 'Handlebars', 'spin', 'text!templates/parallel.hbs','foundation','jquery.cookie', 'waterfall','jquery.lazyload','imagesLoaded'],
	function ($, _H,S,_template)
	{

		return function parallelProjection()
		{
			var created = false;
			var currentObject;
			var dataMan;
			this.data = null;
			this.WALL;
			this.CURWIDTH;
			this.GRIDWIDTH;
			this.LISTWIDTH;
			this.CURSIZE;
			var curMode = "grid";
			var self = this;
			var selfLoaded = false;
			var s = null;
			var lastScrollTop = 0;
			var curSlide = 0;
			var dom;
			var curPane = 0;
			var template;
			var numSlides = 0;
			var slideshowHeight = 100;
			var gutter = 16;

			this.name = 'parallelProjection';

			this.create = function ()
			{
				if ($("#search-canvas").hasClass("open")) {
					$("#searchdropdown").trigger("click");
				}

				$("html").addClass("parallelProjectionView");
				$(".top-bar .menu .active").removeClass("active");
				$(".top-bar .lightroom a").addClass("active");

				self.s = new S();

				

				dataMan = resourceMan.getResource('gsaData');

				var sConf = resourceMan.getResource('sidebarConfig') || { 'title':false, 'desc':false, 'author':false };
				resourceMan.setResource('sidebarConfig', sConf);
				
				self.updateData() 
				self.initSide();
				
				$("body").removeClass("init");
				created = true;
			};

			this.resizeImages = function(newVal)
			{
				var v = 8 - newVal;
				
				if(self.CURSIZE != v) {
					self.updateImageSize(v);

					$('#container').waterfall("option", {
						colWidth: self.CURWIDTH
					});
				}
			}

			this.updateImageSize = function(v)
			{
				if(self.CURSIZE != v) {
					self.CURSIZE = v;
					var cw = Math.floor(($("#container").width() -40- (v - 1) * 16) / v);
					self.CURWIDTH = cw;

					$(".cell").css("width", cw);
					$(".cell").each(function () {
						var $this = $(this);
						//if(!)
						var w = $this.find("img").attr("width") || $this.find("img").width();
						var h = $this.find("img").attr("height") || $this.find("img").height();
						if(curMode == "grid") {
							$this.find(".image").css("height", Math.floor(h * (self.CURWIDTH)/(w)));
						}
					});
				}
			}

			this.updateData = function()
			{
				$(".cell").off(".ph-plus-lightroom");
				
				$("#container")
					.empty()
					.remove();
				var container = $("<div id='container'/>");
				$("#mainsection").append(container);
				if (template == null) {
			        template = _H.compile(_template);
			    }
			    log(dataMan.getObjects())
			    dom = template({images:dataMan.getObjects(),mainimage:""});

			    $("#container").append(dom);
				
				// $(dataMan.getObjects()).each(function (i, e) {
				// 	//e.createDom("paralell", _standalone);
				// 	//e.dom.addClass("cell");
				// 	//e.dom.hide();
				// 	//e.dom.attr("data-pid",e.data.pid);
				// 	//if (dataMan.isMarked(e.data.pid)) {
				// 	//	e.dom.addClass("highlight");
				// 	//}
				// 	//e.dom.css("opacity",0)
				// 	//$("#container").append(e.dom);
				// });
				selfLoaded = false;
				var cols = 8-$.cookie("imagesize") || 3;
				self.CURSIZE = -1;
				self.updateImageSize(cols);
				// $(".cell").on("mouseenter.ph-plus-lightroom", function(e){
				// 	//$(this).addClass("show");
				// 	self.showOverlay(e);
				// });


				$("#container").foundation();
				$(".cell").show();
				$(".cell").css("opacity",1);
				$(".lazy").lazyload();
			}

			this.updateMarked = function()
			{
				$(dataMan.getObjects()).each(function (i, e) {
					if (dataMan.isMarked(e.data.pid)) {
						e.dom.addClass("highlight");
					} else {
						e.dom.removeClass("highlight");
					}
				});
			};

			this.initSide = function()
			{

				$(".displayMode a").off("click.ph-plus-lightroom");
				$("#display-list").on("click.ph-plus-lightroom", function (e) {
					if (!$(this).hasClass("dark")) { 
						return;
					}
					var prevMode = curMode;
					curMode = "list";

					self.destroySlideshow();
					self.resetImageStyles();

					$(".cell").addClass("list-view");
					
					self.CURSIZE = -1;
					self.resizeImages(6);
					
					if(prevMode == "slideshow") {
						$("body").scrollTop(lastScrollTop);
					}

					$(".displayMode").find("a").addClass("dark");
					$(this).removeClass("dark");

					$(".gridoptions").hide();
					
					
					$("body").scrollTop(lastScrollTop);

					e.preventDefault();
				});

				$("#display-slideshow").on("click.ph-plus-lightroom", function (e) {
					if (!$(this).hasClass("dark")) {
						return;
					}

					lastScrollTop = $("body").scrollTop();

					self.resetImageStyles();

					$(".displayMode").find("a").addClass("dark");
					$(this).removeClass("dark");
					
					$("#lightroom-whiteboard-close").data("returnto",curMode);

					self.createSlideshow();
					curMode = "slideshow";
					e.preventDefault();
				});
				$("#lightroom-whiteboard-close").off("*.ph-plus-lightroom");
				$("#lightroom-whiteboard-close").on("click.ph-plus-lightroom",function(e){
					log($(this).data("returnto"))
					log($("#display-"+$(this).data("returnto")))
					$("#display-"+$(this).data("returnto")).trigger("click.ph-plus-lightroom");
					e.preventDefault();
				})

				$("#display-grid").on("click.ph-plus-lightroom", function (e) {
					
					if (!$(this).hasClass("dark")) {
						return;
					}
					
					var prevMode = curMode;
					curMode = "grid";

					self.destroySlideshow();
					self.resetImageStyles();					

					self.CURSIZE = -1;
					self.resizeImages($.cookie("imagesize"));

					$(".gridoptions").show();

					if(prevMode == "slideshow") {
						log("last scroll "+lastScrollTop)
						$("body").scrollTop(lastScrollTop);
					}

					$(".displayMode").find("a").addClass("dark");
					$(this).removeClass("dark");

					curMode = "grid";
					e.preventDefault();
				});

				if (typeof dataMan.objectsmarked == 'undefined' || !dataMan.objectsmarked.length) {
					$(".markers a").addClass("disabled");
					$(".markers a").addClass("secondary");
				}
			}

			this.resetImageStyles = function()
			{
				$(".cell").removeClass("list-view");
				$(".cell").removeClass("slideshow-view");
				$(".cell").attr("style","");
				$(".cell").find(".image").attr("style", "");
				
			}
			
			this.createSlideshow = function ()
			{
				var orbit = $("<ul id='slideshow' data-orbit />");
				slideshowHeight = $(window).height() - 20;

				numSlides = 0;
				curSlide = 0;

				$("#container .cell").each(function () {
					var li = $("<li/>");
					li.css("height", slideshowHeight)
					orbit.append(li.append($(this)));
					numSlides++;
				})

				orbit.css("height", slideshowHeight);
				
				$("#container").before(orbit);
				$("#container").hide();

				

				var c = $("#slideshow li").eq(0);
				var p = $("#slideshow li").eq($("#slideshow li").length-1);
				var n = $("#slideshow li").eq(0).next();
				
				self.slideshowLoad(c);
				self.slideshowLoad(p);
				self.slideshowLoad(n);

				curPane = c;
				$("#slideshow li img").data("curpane",false);
				c.find("img").data("curpane",true)
				
				
				$(".orbit-container").css("height", slideshowHeight);
				curMode = "slideshow";
				
				

				$("html").addClass("orbit");

				$("#slideshow").foundation('orbit', {
					animation: 'fade',
					bullets: false,
					timer: false,
					variable_height: true,
					before_slide_change: function (e) {
						drawingTool.clear();
					},
					after_slide_change: function (e) {
						curSlide = e;
						curPane = $("#slideshow li").eq(curSlide);
						$("#slideshow li img").data("curpane",false);
						$("#slideshow li").data("curpane",false);
						curPane.find("img").data("curpane",true);
						curPane.data("curpane",true);
						
						var p = $("#slideshow li").eq(e-1);
						var n = $("#slideshow li").eq(e+1);
						if(curSlide == 0) {
							p = $("#slideshow li").eq(numSlides-1);
						}
						if(curSlide == (numSlides-1)) {
							n = $("#slideshow li").eq(0);
						}
						self.slideshowLoad(p);
						self.slideshowLoad(n);
					},
				});
				$(".orbit-prev").remove();
				$(".orbit-next").remove();
				$("<div/>")
				.addClass("orbit-prev")
				.html("&#8249;")
				.appendTo($(".orbit-container"));
				$("<div/>")
				.addClass("orbit-next")
				.html("&#8250;")
				.appendTo($(".orbit-container"));
				// SHOW FIRST, FOUNDATION BUG?
				c.css("opacity",1);

				self.initWhiteboard();
			};
			/*
				LOAD LARGE IMAGE AND CENTER ON SCREEN
			*/
			this.slideshowLoad = function(element){
				var img = element.find("img").eq(0);
				var large = img.attr("data-large");
				var src = img.attr("src");
				self.repositionImage(img);
				if(large != src) {
					self.s.spin();
					element.append(self.s.el)
					//element.find("img").css("opacity",0);
					img.attr("src", large);
					requirejs( [
					  'imagesLoaded',
					], function( imagesLoaded ) {
					  imagesLoaded( element, function(e) { 
					  		var img = e.images[0].img;
					  		if((img.naturalHeight > 480 || img.naturalWidth > 480)) {
							  		self.repositionImage($(img));
									//element.find("img").css("opacity",1);
							}
					  });
					});
				}
			}
			this.repositionImage = function(img) {
				if(curMode != "slideshow") return;

				var element = img.parent();
				var mt = Math.floor(slideshowHeight/2-element.height()/2);
				element.css("margin-top",mt);
				if(img.closest("li").data("curpane")) {
					drawingTool.reInit(curPane);
				}
			}
			
			this.destroySlideshow = function ()
			{
				$("#slideshow .cell").each(function () {
					$("#container").append($(this));
				})
				$("#slideshow").remove();
				$(".orbit-container").remove();
				
				$("#container").show();

				$("html").removeClass("orbit");

				self.destroyWhiteboard();
			};

			this.show = function(d)
			{
				if (typeof d != 'undefined' && d != null) {
					dataMan = d;
				} else {
					dataMan = resourceMan.getResource('gsaData');
				}
				$("html").addClass("parallelProjectionView");

				resourceMan.setConfig('*', 'lightRoom', {
					'deps': ['components/sidebar', 'components/parallel-projection'],
					'open': { 'scope': this, 'func': this.show },
					'close': { 'scope': this, 'func': this.close }
				});
				
				resourceMan.setConfig('dataManaged', 'default', {
					'deps': ['components/sidebar', 'components/parallel-projection'],
					'open': { 'scope': this, 'func': this.show },
					'close': { 'scope': this, 'func': this.close }
				});

				$(dataMan).off('.ph-plus-lightroom')
									.on('changeDisplayed.ph-plus-lightroom', self.updateData)
									.on('marked.ph-plus-lightroom', self.updateMarked);
				resourceMan.getResource('sidebar').setImageResizeListener({ scope: self, func: self.resizeImages });
				
				if (typeof dataMan == 'undefined' || dataMan == null) {
					console.log('error: no data for lightroom!');
					return;
				}


				if (created == false) {
					self.create();
				}
				$("#container").fadeIn(400);
				$("body").scrollTop(lastScrollTop);


				// checking last config of the sidebar switches
				var sConf = resourceMan.getResource('sidebarConfig');
				for(var name in sConf) {
					if (($('#sidebar #options input[name=switch-'+name+']').val() == 'true') != sConf[name]) {
						$('#sidebar #options input[name=switch-'+name+'][value='+sConf[name]+']')
							.prop('checked', true)
							.trigger('change.ph-plus-lightroom');
					}
				}
			};

			this.showOverlay = function (e)
			{
				if (self.CURSIZE == 1 || curMode == "slideshow") {
					return
				}
				
				var target = $(e.currentTarget);
				var data = target.data("object");
				self.currentObject = data;
				
				target.find(".image").off("click");
				target.find(".image").on("click.ph-plus-lightroom",function(e) {
					e.preventDefault();
					$(window).trigger("openSingleView",[self.currentObject.data]);
					return false;
				});

				target.find("a.full-image").off("click");
				target.find("a.full-image").on("click.ph-plus-lightroom", function (e) {
					$(".tooltip").hide();
					$("#overlay").remove();
					e.preventDefault();
					$(window).trigger("openSingleView",[self.currentObject.data]);
					return false;
				});

				target.find("a.mark-image").off("click");
				target.find("a.mark-image").on("click.ph-plus-lightroom", function (e) {
					var unmark = $(this).hasClass('active');
					$(".tooltip").hide();
					$(this).toggleClass("active");
					dataMan.markObject(self.currentObject.data.pid, unmark);
					return false;
				});

				if (dataMan.isMarked(self.currentObject.data.pid)) {
					target.find("a.mark-image").addClass("active");
				}
				
				target.find("a.collection-image").off(".ph-plus");
				target.find("a.collection-image").on("click.ph-plus",function(e) {
					$(".tooltip").hide();
					$(window).trigger('addToCollection', [self.currentObject]);
					return false;
				});

				target.find("a.download-image").off("click");
				target.find("a.download-image").on("click", function (e) {
					$(".tooltip").hide();
					$(window).trigger('downloadSingleObject', [self.currentObject]); // TODO: create event handler
					e.preventDefault();
					return false;
				});
			};

			this.createWall = function ()
			{
				$('#container').waterfall({
					'itemCls': 'cell',
					'prefix': 'waterfall',
					'fitWidth': true,
					'colWidth': self.CURWIDTH,
					'gutterWidth': gutter,
					'gutterHeight': gutter,
					'align': 'center',
					'minCol': 1,
					'maxCol': undefined,
					'maxPage': 1,
					'bufferPixel': -50,
					'containerStyle': {
						'position': 'relative'
					},
					'resizable': true,
					'isFadeIn': false,
					'isAnimated': true,
					'animationOptions': {},
					'isAutoPrefill': false,
					'checkImagesLoaded': true,
					'debug': false,
					'loadingMsg': '<div></div>', // loading html
					'callbacks': {
						loadingStart: function ($loading) {
							log("would load")
						},
						loadingFinished: function ($loading, isBeyondMaxPage) {
							log("would stop")
						},
					},
				});
			};

			this.close = function (newState)
			{
				lastScrollTop = $("body").scrollTop();
				$("#container").hide();
				$("html").removeClass("parallelProjectionView");

				$(dataMan).off('.ph-plus-lightroom');
  				resourceMan.getResource('sidebar').setImageResizeListener(null);
				
				if (newState == 'openSingleView') {
					
					console.log('only hidding');
					return;
				}
				console.log("close parallel")
				
				
				$('#mainsection').empty();
				$("#lightroom-displaymode").remove();
				$("#lightroom-whiteboard-close").remove();
				$("#lightroom-whiteboard-actions").remove();
				created = false;

				resourceMan.setConfig('*', 'parallelProjection', {
					'deps': ['components/sidebar', 'components/parallel-projection'],
					'open': { 'scope': 'components_parallelProjection', 'func': 'show' },
					'close': { 'scope': 'components_parallelProjection', 'func': 'close' },
				});
			};

			
		}
		
	});