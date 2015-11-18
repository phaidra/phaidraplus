/**
 * @module viewControllers
 * @submodule helpers
 */
define(['jquery', 'Handlebars', 'text!templates/uncategorised-objs.hbs', 'text!templates/map-object.hbs'],
			 function ($, _H, _tempRaw, _objTempRaw) {
	/**
	 * If an object has no time or location data it is displayed in the bottom container of the corresponding view.
	 * This class provides the means to do so.
	 *
	 * ## Dependencies
	 * - [template:uncategorised-objs.hbs](../../templates/uncategorised-objs.hbs)
	 * - [template:map-object.hbs](../../templates/map-object.hbs)
	 *
	 * @class uncategorizesObjects
	 * @static
	 * @final
	 * @param {Array} data The uncategorized objects' data.
	 * @param {String} title The title of the bottom container
	 * @constructor
	 */
	var unCatObjs = function(newObjsData, title)
	{
		var dom = null;
		var objs = [];
		var objTemplate = null;
		var self = this;
		var template = null;
		var hideOut;
		var loadTimer;

		this.add = function(objdata)
		{
			var objDom = objTemplate(objdata);
      objDom = $.parseHTML($.trim(objDom));
      objDom = $(objDom);
      objDom.data('originalData', objdata);
      dom.find('.objs-container').append(objDom);
      objDom.data("data",objdata);
      
      objDom.on("click.ph-plus",function(){
      	$(window).trigger("openSingleView",[$(this).data("data")]);
      })
      objs.push(objDom);
    
      var width = 0;
      for(var i=0; i<objs.length; i++) {
      	width += objs[i].outerWidth();
      }

      dom.find('.objs-container').css('width', width);
		};
		
		this.delete = function()
		{	
			clearTimeout(hideOut)
			clearTimeout(loadTimer);
			if(!dom) {
				return;
			}
			dom.hide();
			
			for(var i=0; i<objs.length; i++) {
				objs[i].remove();
				delete objs[i];
			}
			delete objs;
			objs = null;

			dom.remove();
			
			delete dom;
			dom = null;
		};

		this.loadImages = function() {
    		var icons = $(dom).find(".map-object-view").find("[data-original]");
	    	icons.each(function(i,e){
	    		if(i > 5) {
	    			return;
	    		}
	    		$(e).attr("src",$(e).attr("data-original"));
	    		$(e).removeAttr("data-original");
	    	});
	    	loadTimer = setScopedTimeout(function () { self.loadImages(); }, 1000, self);
	    }

		this.insert = function(title)
		{
	      dom = template({ 'title':title});
	      dom = $.parseHTML($.trim(dom));
	      dom = $(dom);
	      dom.addClass("open")
	      $('#mainsection').append(dom);
	      if(hideOut) {

	      	clearTimeout(hideOut)
	      }
	      clearTimeout(loadTimer);
	      hideOut = setTimeout(function(){
	      	$("#uncategorised-objs").removeClass("open");
	      },2500);
		};

	    template = _H.compile(_tempRaw);
	    objTemplate = _H.compile(_objTempRaw);

	    this.insert(title);

	    for(var i=0; i<newObjsData.length; i++) {
	    	this.add(newObjsData[i]);
	    }

		self.loadImages();
	};

	

	return unCatObjs;
});