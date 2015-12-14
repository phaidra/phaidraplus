/**
 * @module viewControllers
 * @submodule main
 */
define(['jquery', 'leaflet', 'Handlebars', 'components/bottom-objs-container', 'text!templates/geo-view.hbs', 'text!templates/marker.hbs', 'i18n!nls/texts',
				  'foundation','leaflet-cluster'],
			 function ($, _L, _H, bottomContainerClass, _tempRaw, _markerTemplate, _texts) {
	/**
	 * The geo view class displays the search result on a map
	 *
	 * ## Global Events Consumed
	 * - changeDisplayed
	 * - marked
	 *
	 * ## Global Events Triggered
	 * - addToCollection
	 * - downloadSingleObject
	 * - openSingleView
	 *
	 * ## Dependencies
	 * - [resourceManager](resourceManager.html)
	 * - [template:geo-view.hbs](../../templates/geo-view.hbs)
	 * - [template:marker.hbs](../../templates/marker.hbs)
	 * - [uncategorizesObjects](uncategorizesObjects.html)
	 *
	 * @class geoView
	 * @constructor
	 */
	var geoView = function()
	{

		var bottomContainer = null;
		var currentMarker = null;
		var currentObject = null;
		var curSize = 44;
		var dataMan = null;
		var dom = null;
		var enabledObject = null;
		var icons = null;
		var map = null;
		var markerTemplate = null;
		var self = this;
		var streetLayer = null;
		var template = null;
		var watercolorLayer = null;
		var loadTimer = null;

		this.name = 'geo';
		/**
		 * @method close
		 */
		this.close = function(newState)
		{
			$("#geo-view-container").hide();
  			$("html").removeClass("geoView");

			$(dataMan).off('.ph-plus-geoview');
			resourceMan.getResource('sidebar').setImageResizeListener(null);

			resourceMan.getResource('slideshow').destroySlideshow();
			$(resourceMan.getResource('slideshow')).off(".ph-plus-geoview");				

			if(loadTimer) {
				clearTimeout(loadTimer);
			}

			if (newState == 'openSingleView') {
				return;
			}

			if(map && icons.length) {
				map.remove();
				icons = [];
			}

			if(dom) {
	    		dom.remove();
	    		delete dom;
	    		dom = null;
	  		}

  			$('#mainsection').empty();
  		
			resourceMan.setConfig('*', 'geoView', {
				'deps': ['components/sidebar', 'components/geo-view'],
				'open': { 'scope': 'components_geoView', 'func': 'show' },
			});
    };
		/**
		 * @method create
		 */
   	this.create = function()
    {
      if (template == null) {
        template = _H.compile(_tempRaw);
      }

      $("html").addClass("geoView");
      
      dom = template();
      dom = $.parseHTML($.trim(dom));
      dom = $(dom);
      
      $('#mainsection').append(dom);
      dom.find('#view-modi').val('map');
      $(dom).foundation();      
    };

    this.loadImages = function() {
    	var icons = $(dom).find(".mapicon[data-original]");
    	icons.each(function(i,e){
    		if(i > 5) {
    			return;
    		}
    		$(e).attr("style","background-image:url('"+$(e).attr("data-original")+"')");
    		$(e).removeAttr("data-original");
    	});
    	loadTimer = setScopedTimeout(function () { self.loadImages(); }, 1000, self);
    }

		this.enablePopupActions = function(obj)
		{
			currentObject = obj;
			enabledObject = obj;
			
			$(".image").off(".ph-plus-geoview");
			$(".image, a.full-image").on("click.ph-plus-geoview",function(e) {
				e.preventDefault();
				$(window).trigger("openSingleView",[currentObject]);
				return false;
			});

			$("a.mark-image").off(".ph-plus-geoview");
			$("a.mark-image").on("click.ph-plus-geoview",function (e) {
				var unmark = !$(this).hasClass('active');
				$(".tooltip").hide();
				$(this).toggleClass("active");
				dataMan.markObject(currentObject.pid, unmark);
				map.closePopup();
				return false;
			});

			if(dataMan.isMarked(currentObject.pid)) {
				$("a.mark-image").removeClass("active");
			} else {
				$("a.mark-image").addClass("active");
			}
			$(".leaflet-popup [data-original]").attr("src",$(".leaflet-popup [data-original]").attr("data-original"));
			$(".leaflet-popup [data-original]").removeAttr("data-original")
			$("a.collection-image")
				.off(".ph-plus-geoview")
				.on("click.ph-plus-geoview",function(e) {
				$(".tooltip").hide();
				$(window).trigger('addToCollection', [currentObject]); // TODO: create Collection event
				return false;
			});

			$("a.download-image").off("click");
			$("a.download-image").on("click", function (e) {
				$(".tooltip").hide();
				$(window).trigger('downloadSingleObject', [currentObject]); // TODO: create event handler
				return false;
			});
		};

		this.resizeImages = function(newVal)
		{
			var v = 8 - newVal;
			var cw = ((8 - v) * 6) + 44;
			var pane = $('#map .leaflet-marker-pane');
			self.curSize = cw;

			pane.find(".mapicon").css({
				"width": cw,
				//"margin-left": -cw / 2,
				"height": cw,
				//"margin-top": -cw / 2,
			});

			for(var i in icons) {
				icons[i].update();
			}			
		};
		/**
		 * @method show
		 */
		this.show = function(d)
		{
			if (typeof d != 'undefined' && d != null) {
				dataMan = d;
			} else {
				dataMan = resourceMan.getResource('gsaData');
			}

			var sidebar = resourceMan.getResource('sidebar');

			if (dom != null) {
    		self.close();
  		}

			$("html").addClass("geoView");
			
			resourceMan.setConfig('*', 'geoView', {
				'deps': ['components/sidebar', 'components/geo-view'],
				'open': { 'scope': self, 'func': self.show },
				'close': { 'scope': self, 'func': self.close }
			});

			resourceMan.setConfig('dataManaged', 'default', {
				'deps': ['components/sidebar', 'components/geo-view'],
				'open': { 'scope': self, 'func': self.show },
				'close': { 'scope': self, 'func': self.close }
			});

			resourceMan.setConfig('*', 'sidebar', {
				'deps': ['components/sidebar'],
				'open': { 'scope': sidebar, 'func': sidebar.show },
			});

			if (typeof dataMan == 'undefined' || dataMan == null) {
				console.log('error: no data for geoview!');
				return;
			}

			if ($("#search-canvas").hasClass("open")) {
				$("#searchdropdown").trigger("click");
			}

      self.create();
      $(dataMan).off('.ph-plus-geoview')
      					.on('changeDisplayed.ph-plus-geoview', self.updateData)
								.on('marked.ph-plus-geoview', self.updateMarked);
      resourceMan.getResource('sidebar').setImageResizeListener({ scope: self, func: self.resizeImages });

      var v = 8-$("#imagesize").val();
		  self.curSize = ((8-v)*6)+44;

      if (markerTemplate == null) {
      	markerTemplate = _H.compile(_markerTemplate);
      }

      /***  little hack starts here ***/
      _L.Map = _L.Map.extend({
	  		openPopup: function(popup) {
	    		if(this._popup && this._popup != popup) {
	        	map.closePopup();
	        }

	        if(this._popup == popup) {
	        	return;
	        }
					this._popup = popup;

					var marker = popup;
					var data = marker._source.options.data.obj;
					currentObject = data;
			
	        return this.addLayer(popup).fire('popupopen', {
            popup: this._popup
	        });
		    }
			});

  		map = new _L.Map('map');

			 streetLayer = _L.tileLayer('http://api.tiles.mapbox.com/v3/jrgio.jgoi4gh8/{z}/{x}/{y}.png', {
			 	attribution: '&copy; <a href="http://osm.org/copyright">OpenStreetMap</a> contributors, Design: Julian Roedelius'
			 });
			// streetLayer = _L.tileLayer('/tiles/{z}/{x}/{y}.png', {
			// 	attribution: '&copy; <a href="http://osm.org/copyright">OpenStreetMap</a> contributors'
			// });
			streetLayer.addTo(map);

			markerCluster = _L.markerClusterGroup({
				'maxClusterRadius': 40,
				'zoomToBoundsOnClick': false,
				'iconCreateFunction': function (cluster) {
					var markers = cluster.getAllChildMarkers();
    			var iconHTML = markers[0].options.icon.options.html;
    			// iconHTML = $(iconHTML);
    			// var src = iconHTML.find(".mapicon").attr("data-original");
    			// if(src && src != 0) {
    			// 	iconHTML.find(".mapicon").attr("style",src);
    			// 	iconHTML.find(".mapicon").attr("data-original",0);
    			// }
          			
    			return L.divIcon({ 
        		'html': iconHTML+"<div class='number'>"+markers.length+"</div>",
        		'className': 'mycluster', 
            'iconSize': [function() { return self.curSize; }, function() { return self.curSize; }],
						'iconAnchor': [0, 0],
					});
    		},
			});

			markerCluster.on("clusterclick",function(m){
			   m.layer.spiderfy();
				return false;
			});

			markerCluster.on("click",function(m){
				if(m && m.layer.options && m.layer.options.data) {
				  $(m.layer._icon).trigger("click")
				}
				return false;
			});

  		self.updateData();

      $(resourceMan.getResource('slideshow'))
      	.off('.ph-plus-geoview')
      	.on('slideshowOpen.ph-plus-geoview', function() {
					$('#mainsection').fadeOut(400);
					return false;
      	})
      	.on('slideshowClose.ph-plus-geoview', function() {
					$('#mainsection').fadeIn(400);
					return false;
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

	  this.updateData = function()
	  {
	  	var objs = dataMan.getObjects();

	  	if (icons != null && icons.length > 0) {
	  		for(var i in icons) {
	  			markerCluster.removeLayer(icons[i]);
	  		}
	  	}

			icons = [];
			var notPossitioned = [];
			var bounds = { southWest: { south: 36, west:-4 }, northEast: { north:50, east:20 }}; // (lat) north positive, south negative, (lon) east: positive, west: negative
			var testData = [];
			
			for(var i=0;i<objs.length;i++) {
				var obj = objs[i].data;

				if (typeof obj.latlon == 'undefined') {
					notPossitioned.push(obj);
					continue;
				}

				if (typeof obj.latlon.lat == 'undefined' || typeof obj.latlon.lon == 'undefined') {
					notPossitioned.push(obj);
					continue;
				}

				if (obj.latlon.lat > bounds.northEast.north) {
					bounds.northEast.north = obj.latlon.lat;
				}

				if (obj.latlon.lat < bounds.southWest.south) {
					bounds.southWest.south = obj.latlon.lat;
				}

				if (obj.latlon.lon > bounds.northEast.east) {
					bounds.northEast.east = obj.latlon.lon;
				}

				if (obj.latlon.lon < bounds.southWest.west) {
					bounds.southWest.west = obj.latlon.lon;
				}

				var dm = objs[i].createDom("map", _standalone);
				var imageIcon = _L.divIcon({
					iconAnchor: [ function() { return self.curSize/2; },
												function() { return self.curSize/2; }
											],
					iconSize: [ function() { return self.curSize; },
											function() { return self.curSize; }
										],
					'html': '<div class="mapicon" data-original="'+obj.thumbnail+'" data-pid="'+obj.pid+'"></div>',
				});

				var marker = _L.marker([obj.latlon.lat, obj.latlon.lon], {
				 		'data': { "obj": obj},
					 	'icon': imageIcon,
					})
					.bindPopup(dm[0], {
						'closePopupOnClick': true,
				 		'maxWidth':"480"
				 	});
				
				markerCluster.addLayer(marker);
				icons.push(marker);
			}

			bounds.southWest = new _L.LatLng(bounds.southWest.south, bounds.southWest.west);
			bounds.northEast = new _L.LatLng(bounds.northEast.north, bounds.northEast.east);
			bounds = new _L.LatLngBounds(bounds.southWest, bounds.northEast);
			map.fitBounds(bounds);
			map.addLayer(markerCluster);
			map.on('popupopen', function(e) {
				if(enabledObject != currentObject) {
					self.enablePopupActions(currentObject);
				}
			});

			self.updateMarked();
			if(loadTimer) {
				clearTimeout(loadTimer);
			}
			self.loadImages();

			if (bottomContainer != null) {
				bottomContainer.delete();
				delete bottomContainer;
			}
			if (notPossitioned.length) {
				bottomContainer = new bottomContainerClass(notPossitioned, self.translate('unlocatedObjects')+" ("+notPossitioned.length+"/"+objs.length+")");
			}
	  };

	  this.updateMarked = function()
	  {
	  	var pane = $('#map .leaflet-marker-pane');
			for(var i in icons) {
				var o = icons[i].options.data.obj;
				if (dataMan.isMarked(o.pid)) {
					pane.find(".mapicon[data-pid=\"" + o.pid + "\"]").addClass("highlight");
				} else {
					pane.find(".mapicon[data-pid=\"" + o.pid + "\"]").removeClass("highlight");
				}
			}			
	  };

	  _H.registerHelper('translate', self.translate);
	};

	return geoView;
});