define(['jquery', 'Handlebars', 'text!templates/help.hbs','i18n!nls/texts',
			'foundation',	'jquery.cookie'],
				function($, _H,  _template, _texts) {

	var helpManager = function()
	{
		var currentPage;
		var self = this;
		var dom;
		var dataMan;
		var phaidraQue = null;
		var save = false;

		this.create = function()
		{

			$(window)
				.on("showhelp", function(e,o) {
					self.showOverlay(o);
					e.preventDefault();
				})
				
			return self;
		}

		this.hide = function()
		{
			return self;
		}



		this.show = function()
		{
			return self;
		}

		this.showOverlay = function(d)
		{
			
			save = false;
			
			if(dom) {
				dom.empty();
				if(dom.parent()) {
					dom.remove();
				}
				dom = null;
			}

			var helpItems = {};
			helpItems.items = [];
			helpItems.endtitle = d.endtitle ? d.endtitle:""
			helpItems.endtext = d.endtext ? d.endtext:""
			var lefttip = ["menu-timeline","menu-semantic","display-slideshow","display-options","menu-share"];
			for(var i=0;i<d.items.length;i++) {
				var oh = d.items[i];
				var tippos = "bottom";
				if(lefttip.indexOf(oh) !=-1) {
					tippos = "left"
				}
				helpItems.items.push({item_id:oh,title:translate(oh),text:translate("help-"+oh),tip_position:tippos});
			}
			
			_H.registerHelper('translate', self.translate);

			var help = _H.compile($.trim(_template));

			dom = $($.trim(help(helpItems)));

			$(window).scrollTop(0);

			$("body").append(dom);

			dom = $("body #help").eq(0);
			dom.foundation();
			
			$(".contain-to-grid").removeClass("sticky");

			$(document).foundation({"joyride":{"post_ride_callback":function(){
				$(".contain-to-grid").addClass("sticky");
				$(document).foundation();
			}},tip_location_patterns    : {
    top: ['bottom'],
    bottom: [], // bottom should not need to be repositioned
    left: ['right', 'top', 'bottom'],
    right: ['left', 'top', 'bottom']
  }}).foundation("joyride","start");
			
			return false;
		}

		this.updateHandlers = function()
		{
			
		}
		this.translate = function(term)
		{
	    if (typeof _texts[term] != 'undefined') {
	      return _texts[term];
	    } else {
	      return term;
	    }				
		};
		
		this.create();
	};

	
	return helpManager;
});