/*
 * ## TODOs
 */
define(['jquery', 'Handlebars', 'spin', 'text!templates/lightroom.hbs', 'i18n!nls/texts','slick','foundation','jquery.cookie', 'waterfall','jquery.lazyload','imagesLoaded'],
	function ($, _H,S,_template,_texts)
	{

		return function lightroom()
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
			var dom;
			var template;
			var gutter = 16;

			this.name = 'lightroom';

			this.create = function ()
			{
				if ($("#search-canvas").hasClass("open")) {
					$("#searchdropdown").trigger("click");
				}

				$("html").addClass("lightRoomView");
				$(".top-bar .menu .active").removeClass("active");
				$(".top-bar .lightroom a").addClass("active");

				self.s = new S();

				dataMan = resourceMan.getResource('gsaData');

				var sConf = resourceMan.getResource('sidebarConfig') || { 'title':false, 'desc':false, 'author':false };
				resourceMan.setResource('sidebarConfig', sConf);
				
				self.updateData();
				
				$("body").removeClass("init");
				created = true;
			};

			this.resizeImages = function(newVal)
			{
				var v = 8 - newVal;
				
				if(self.CURSIZE != v) {
					self.updateImageSize(v);

					$('#waterfall-loading, #waterfall-message').remove();
					$('#container').waterfall("option", {
						colWidth: self.CURWIDTH
					});
				}
			};

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
			    dom = template();

			    $("#container").append(dom);
				
				$(dataMan.getObjects()).each(function (i, e) {
					e.createDom("lightroom", _standalone);
					e.dom.addClass("cell");
					e.dom.hide();
					e.dom.attr("data-pid",e.data.pid);
					if (dataMan.isMarked(e.data.pid)) {
						e.dom.addClass("highlight");
					}
					e.dom.css("opacity",0)
					$("#container").append(e.dom);
				});
				selfLoaded = false;
				var cols = 8-$.cookie("imagesize") || 3;
				self.CURSIZE = -1;
				self.updateImageSize(cols);
				$(".cell").on("mouseenter.ph-plus-lightroom", function(e){
					self.showOverlay(e);
				});

				$(".cell").show();
				self.createWall();
				$(".cell").css("opacity",1);
				$(".lazy").lazyload();
				$("#container").foundation();
				self.initSide();
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
				$("input").off("change.ph-plus-lightroom")
				$("#sidebar-attributes-selector input[name=switch-title]").on("change.ph-plus-lightroom", function (e) {
					//console.log("change title")
					var sConf = resourceMan.getResource('sidebarConfig');
					sConf.title = $(this).is(':checked') ? 1 : 0;//($(this).val() == 'true');
					resourceMan.setResource('sidebarConfig', sConf);
					$(".cell .title").toggle();
					
					if(sConf.title || sConf.desc) {
						$(".cell .content").addClass("open")
					} else {
						$(".cell .content").removeClass("open")
					}
					$('#container').waterfall("reLayout");
				});				
				
				$("#sidebar-attributes-selector input[name=switch-desc]").on("change.ph-plus-lightroom", function (e) {
					$(".cell .body").toggle();

					var sConf = resourceMan.getResource('sidebarConfig');
					sConf.desc = $(this).is(':checked') ? 1 : 0;//($(this).val() == 'true');
					resourceMan.setResource('sidebarConfig', sConf);
					if(sConf.title || sConf.desc) {
						$(".cell .content").addClass("open")
					} else {
						$(".cell .content").removeClass("open")
					}
					$('#container').waterfall("reLayout");
				});

				$(resourceMan.getResource('slideshow'))
					.off(".ph-plus-lightroom")
					.on("slideshowOpen.ph-plus-lightroom", function (e) {
					
						lastScrollTop = $("body").scrollTop();
						$("#lightroom-whiteboard-close").data("returnto",curMode);
						$('#container').fadeOut(400);
						curMode = "slideshow";

						return false;
					})
					.on("slideshowClose.ph-plus-lightroom", function (e) {
					
						$("select.displayMode").val($("#lightroom-whiteboard-close").data("returnto"));
						$("select.displayMode").trigger("change");

						return false;
					});

				$("#options select.displayMode").on("change",function(){
					if($(this).val()=="grid") {
						var prevMode = curMode;
						
						curMode = "grid";
						$('#container').show();
						self.resetImageStyles();					
						self.CURSIZE = -1;
						self.resizeImages($.cookie("imagesize"));
						$(".gridoptions").show();

						if(prevMode == "slideshow") {
							log("last scroll "+lastScrollTop)
							$("body").scrollTop(lastScrollTop);
						}

						$(".displayMode").find("a").addClass("secondary");
					} else {
						var prevMode = curMode;
						
						curMode = "list";
						self.resetImageStyles();
						$(".cell").addClass("list-view");						
						self.CURSIZE = -1;
						self.resizeImages(6);
						
						if(prevMode == "slideshow") {
							$("body").scrollTop(lastScrollTop);
						}

						$(".displayMode").find("a").addClass("secondary");						
						$(".gridoptions").hide();											
						$("body").scrollTop(lastScrollTop);
					}
				});				

				if (typeof dataMan.objectsmarked == 'undefined' || !dataMan.objectsmarked.length) {
					$(".markers a").addClass("disabled");
					$(".markers a").addClass("secondary");
				}
			}

			this.resetImageStyles = function()
			{
				$(".cell").removeClass("list-view");
				// $(".cell").removeClass("slideshow-view");
				$(".cell").attr("style","");
				$(".cell").find(".image").attr("style", "");				
			}
			
			this.show = function(d)
			{
				if (typeof d != 'undefined' && d != null) {
					dataMan = d;
				} else {
					dataMan = resourceMan.getResource('gsaData');
				}
				$("html").addClass("lightRoomView");

				resourceMan.setConfig('*', 'lightRoom', {
					'deps': ['components/sidebar', 'components/lightroom'],
					'open': { 'scope': this, 'func': this.show },
					'close': { 'scope': this, 'func': this.close }
				});
				
				resourceMan.setConfig('dataManaged', 'default', {
					'deps': ['components/sidebar', 'components/lightroom'],
					'open': { 'scope': this, 'func': this.show },
					'close': { 'scope': this, 'func': this.close }
				});

				$(dataMan).off('.ph-plus-lightroom')
									.on('changeDisplayed.ph-plus-lightroom', self.updateData)
									.on('marked.ph-plus-lightroom', self.updateMarked);
				resourceMan.getResource('sidebar').setImageResizeListener({ scope: self, func: self.resizeImages });
				
				if (typeof dataMan == 'undefined' || dataMan == null) {
					return;
				}

				if ($("#search-canvas").hasClass("open")) {
					$("#searchdropdown").trigger("click");
				}

				if (created == false) {
					self.create();
				}
				$("#container").fadeIn(400);
				$("body").scrollTop(lastScrollTop);


				// checking last config of the sidebar switches
				var sConf = resourceMan.getResource('sidebarConfig');
				for(var name in sConf) {
					if (sConf[name]) { //($('#sidebar #options input[name=switch-'+name+']').val() == 'true') != sConf[name]) {
						$('#sidebar #options input[name=switch-'+name+']')//([value='+sConf[name]+'])
							.prop('checked', true)
					 		.trigger('change.ph-plus-lightroom');
					}
				}
				
				if(!$.cookie("joyride-lr") || !$.cookie("joyride-lr-login")) {
					$(window).trigger("showTour");
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
				$("html").removeClass("lightRoomView");

				$(dataMan).off('.ph-plus-lightroom');
  				resourceMan.getResource('sidebar').setImageResizeListener(null);				
				
				resourceMan.getResource('slideshow').destroySlideshow();
				$(resourceMan.getResource('slideshow')).off(".ph-plus-lightroom");

				if (newState == 'openSingleView') {					
					return;
				}
				
				$('#mainsection').empty();
				
				created = false;

				resourceMan.setConfig('*', 'lightRoom', {
					'deps': ['components/sidebar', 'components/lightroom'],
					'open': { 'scope': 'components_lightroom', 'func': 'show' },
					'close': { 'scope': 'components_lightroom', 'func': 'close' },
				});
			};

			this.translate = function(term)
		  {
		    if (typeof _texts[term] != 'undefined') {
		      return _texts[term];
		    } else {
		      return term;
		    }      
		  };

			_H.registerHelper('translate', self.translate);
		}		
	});