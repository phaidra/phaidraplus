/**
 * @module viewControllers
 * @submodule main
 */
define(['jquery', 'Handlebars', 'components/timeline-object', 'components/bottom-objs-container', 'text!templates/timeline.hbs', 'i18n!nls/texts',
				 'gwt-timeline' ],
	function ($, _H, _timeObjClass, bottomContainerClass, _tempRaw, _texts) {
	/**
	 * The timeline class displays the search result on a timeline.
	 *
	 * ## Global Events Consumed
	 * - dataManager:changeDisplayed
   * - dataManager:marked
   * - $(window):resize
	 *
	 * ## Dependencies
	 * - [template:timeline.hbs](../../templates/geo-view.hbs)
	 * - [timelineObject](timelineObject.html)
	 * - [uncategorizesObjects](uncategorizesObjects.html)
	 *
	 * @class timeline
	 * @constructor
	 */
	var timeline = function()
	{
		var bottomContainer = null;
		var closed = true;
		var dataMan = null;
		var dom = null;
		var dataHash = {};
		var notPossitioned = null;
		var _p = {};
		var saveMode = saveMode || false;
		var self = this;
		var template = null;
		var timeline = null;
		var timelineItems = [];

		// see: http://almende.github.io/chap-links-library/js/timeline/doc/#Themeroller
		var timelineSetup = {
			'animate': false,
			/*'animateZoom': true,*/
			'axisOnTop': true,
			//'cluster': true,
			//'clusterMaxItems':8,
			'box.align': 'right',
			'eventMargin': 2,
			'eventMarginAxis': 30,
			/*'dragAreaWidth': 10,
			'editable': false,			
			'groupsChangeable': false,
			'groupsOnRight': false,
			'groupsOrder': true,*/
			'height': 'auto',
			/*'locale': 'en',
			'max': null,
			'min': null,*/
			//'minHeight': 500,
			/*'moveable': true,*/
			'scale': links.Timeline.StepDate.SCALE.YEAR,
			'selectable': false,
			/*'snapEvents': true,
			'stackEvents': true,
			'step': 7,*/
			'style': 'dot',
			'showCurrentTime': true,
			/*'showCustomTime': false,*/
			'showMajorLabels': true,
			'showMinorLabels': true,
			/*'showButtonNew': false,*/
			'showNavigation': true,
			//'unselectable': false,
			'width': '100%',
			'zoomable': false,
			//'zoomMax': 24*60*60*365*1000, // about 10000 years
			//'zoomMin': 24*60*60*7*1000,
		};

		this.name = 'timeline';
		/**
		 * @method close
		 */
		this.close = function (newState)
		{
			dom.hide();
    	$('html').removeClass('timelineView');

			if (newState == 'openSingleView') {
				return;
			}
			
    	$(window).off('.ph-plus-timeline');
    	$(dataMan).off('.ph-plus-timeline');
    	resourceMan.getResource('sidebar').setImageResizeListener(null);

    	resourceMan.getResource('slideshow').destroySlideshow();
			$(resourceMan.getResource('slideshow')).off(".ph-plus-timeline");

    	closed = true;
			self.destroy();
    };

    _p.convertData = function (newData)
    {
    	var d = [];
    	var beginning = end = null;
    	notPossitioned = [];
    	dataHash = {};
    	for (var i = 0; i<newData.length; i++) {
    		if (typeof newData[i].data.obj_date == 'undefined') {
    			notPossitioned.push(newData[i].data);
    			continue;
    		} 

    		var o = {};

    		dataHash["t"+i] = newData[i].data;
    		
    		o.content = '<a class="gen-enclosed" data-data="'+i+'" href="#">'+'<img src="'+newData[i].data.preview+'">'+'</a>';    		
    		o.start = new Date(newData[i].data.obj_date); //new Date(date[2], Number(date[1])-1, date[0]);
    		//o.start.setHours(0, 0, 0, 0);

    		if (beginning == null || beginning > o.start) {
    			beginning = new Date(o.start.getFullYear(), o.start.getMonth(), o.start.getDate(), 0, 0, 0);
    		}

    		if (end == null || end < o.start) {
    			end =  new Date(o.start.getFullYear(), o.start.getMonth(), o.start.getDate(), 0, 0, 0);
    		}

    		d.push(o);
    	}
    	if (beginning && end) {
    		var duration = Math.floor((end.getTime()-beginning.getTime())*.2);

    		timelineSetup.min = new Date(beginning.getTime()-duration);
    		timelineSetup.max = new Date(end.getTime()+duration)
    	} else {
    		beginning = new Date("2013-01-01")
    		end = new Date("2015-02-01")
    		timelineSetup.min = beginning;
    		timelineSetup.max = end;
    	}
    	return d;
    };

   	this.create = function ()
    {
    	$('html').addClass('timelineView');
      dom = template();
      dom = $.parseHTML($.trim(dom));
      dom = $(dom);
      saveMode = _standalone;      
      $('#mainsection').append(dom);
      timeline = new links.Timeline(dom.find('#timeline-container')[0]);

      dom.find('#timeline-zoom-in').on('click.ph-plus', function (e) {
      	timeline.zoom(0.1);
      	return false;
      });

      dom.find('#timeline-zoom-out').on('click.ph-plus', function (e) {
      	timeline.zoom(-0.1);
      	return false;
      });

	  	dom.find(".navigate").on("click",function (e) {
				var dir = $(this).hasClass("left") ? -1 : 1;
				
				timeline.move(dir*.1);
			});
    };

    this.destroy = function ()
    {
    	dom.remove();
    	delete dom;
    	dom = null;
    	dataHash = null;
  		$('#mainsection').empty();
     	delete timeline;

			resourceMan.setConfig('*', 'timeline', {
				'deps': ['components/sidebar', 'components/timeline'],
	    	'open': { 'scope': 'components_timeline', 'func': 'show' },
		  });
    };

    this.detachObjects = function ()
    {
    	for (var i = 0; i < timelineItems.length; i++) {
    		timelineItems[i].destroy();
    		delete timelineItems[i];
    	};

    	delete timelineItems;
	  	timelineItems = [];
    };

		this.resizeImages = function (newVal)
		{
		};
		/**
		 * @method show
		 */
		this.show = function (d)
		{
			if (typeof d != 'undefined' && d != null) {
				dataMan = d;
			} else {
				dataMan = resourceMan.getResource('gsaData');
			}

			resourceMan.setConfig('*', 'timeline', {
				'deps': ['components/sidebar', 'components/timeline'],
				'open': { 'scope': self, 'func': self.show },
				'close': { 'scope': self, 'func': self.close }
			});

			resourceMan.setConfig('dataManaged', 'default', {
				'deps': ['components/sidebar', 'components/timeline'],
				'open': { 'scope': self, 'func': self.show },
				'close': { 'scope': self, 'func': self.close }
			});

			if (typeof dataMan == 'undefined' || dataMan == null) {
				log('error: no data for timeline!');
				return;
			}

			if ($("#search-canvas").hasClass("open")) {
				$("#searchdropdown").trigger("click");
			}

			if (closed == false) {
    		self.close();
      }

      if (dom == null) {
      	self.create();
      }

      $(dataMan)
      	.off('.ph-plus-timeline')
      	.on('changeDisplayed.ph-plus-timeline', _p.updateData)
      	.on('marked.ph-plus-timeline', _p.updateMarked);		      	
      resourceMan.getResource('sidebar').setImageResizeListener({ scope: self, func: self.resizeImages });
      dom.show();      
      _p.updateData();
      resourceMan.getResource('sidebar').show();

      $(window).on('resize.ph-plus-timeline', function() {
      	timeline.checkResize();
      });

      $(resourceMan.getResource('slideshow'))
      	.off('.ph-plus-timeline')
      	.on('slideshowOpen.ph-plus-timeline', function() {
					$('#mainsection').fadeOut(400);
					return false;
      	})
      	.on('slideshowClose.ph-plus-timeline', function() {
					$('#mainsection').fadeIn(400);
					return false;
      	});

      closed = false;
		};

	  _p.translate = function(term)
	  {
	    if (typeof _texts[term] != 'undefined') {
	      return _texts[term];
	    } else {
	      return term;
	    }      
	  };

	  _p.updateData = function()
	  {
	  	self.detachObjects();

	  	var objs = dataMan.getObjects();	  	
	  	var conObjs = _p.convertData(objs);	  	
	  	var th = $(window).height()-30;
	  	
			timelineSetup.minHeight = th;
	  	timeline.draw(conObjs, timelineSetup);
	  	
	  	for (var i = 0; i < timeline.items.length; i++) {
	  		var data = $(timeline.items[i].content).attr("data-data");
	  	
	  		timelineItems.push(new _timeObjClass(timeline.items[i], dataHash["t"+data], saveMode));
	  	};
	  	
	  	_p.updateMarked();

			if (bottomContainer != null) {
				bottomContainer.delete();
				delete bottomContainer;
			}

			if (notPossitioned.length) {
				bottomContainer = new bottomContainerClass(notPossitioned, _p.translate('undatedObjects')+" ("+notPossitioned.length+"/"+objs.length+")");
			}
	  };

	  _p.updateMarked = function()
	  {
	  	for (var i = 0; i < timelineItems.length; i++) {
	  		timelineItems[i].mark(dataMan.isMarked(timelineItems[i].data().pid));
	  	};
	  };

	  _H.registerHelper('translate', _p.translate);
	  template = _H.compile(_tempRaw);
	};

	return timeline;
});