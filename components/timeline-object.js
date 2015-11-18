/**
 * @module viewControllers
 * @submodule helpers
 */
define(['jquery', 'Handlebars', 'text!templates/timeline-object.hbs', 'i18n!nls/texts'],

  function ($, _H, _tempRaw, _texts)
  {
	 	var template = _H.compile(_tempRaw);
		/**
		 * The timeline object class is used to display one datapoint on the timeline including the mouseover dialog. 
		 *
		 * ## Global Events Triggered
		 * - window:addToCollection
		 * - window:downloadSingleObject
		 * - window:openSingleView
		 *
		 * ## Dependencies
		 * - [template:timeline-object.hbs](../../templates/timeline-object.hbs)
		 *
		 * @class timelineObject
		 * @param {Object} timeItem An item from the timeline libary. The DOM Object is of main interest.
		 * @param {Object} data 
		 * @param {Boolean} saveMode Toggle to disable specific functions not supported in standalone mode.
		 * @constructor
		 */
		var timelineObject = function (timeItem, data, saveMode)
		{
			var dataMan = resourceMan.getResource('gsaData');
			var defaultData = {
				'author': { 'forename': '', 'surname': '' },
				'desc': '',
				'preview': null,
				'title': '',
				'thumbnail': null,
			};
			var dom = null;
			var myData = data;
			var self = this;
			var timer = null;

			saveMode = saveMode || false;

			this.data = function ()
			{
				return myData;
			}
			/**
			 * @method destroy
			 */
			this.destroy = function ()
			{
				dom.parent().off('.ph-plus');
				dom.hide()
				   .remove();
				delete dom;
				delete myData;
			};

			this.expand = function ()
			{
				self.stopCounter();
				dom.removeClass('compact').addClass('expanded');
			};
			/**
			 * @method mark
			 */
			this.mark = function (mark)
			{
				var p = dom.parent();

				if (!mark) {
					p.find('.timeline-event-content a').removeClass('fi-star')//.addClass('fi-eye');
					p.find('.timeline-object .mark-image').removeClass('active');
				} else {
					p.find('.timeline-event-content a').addClass('fi-star')//.removeClass('fi-eye').addClass('fi-star');
					p.find('.timeline-object .mark-image').addClass('active');
				}
			};

			this.startCounter = function (e)
			{
				var t = $(e.currentTarget);
				t.find("img.lazy").attr("src",t.find("img.lazy").attr("data-original"));
				timer = window.setTimeout(self.expand, 2500);
			};

			this.stopCounter = function ()
			{
				window.clearTimeout(timer);
			};

			// converting data
			var displayData = {};

			displayData.author = data.author || defaultData.author;
			displayData.desc = data.description || defaultData.desc;
			displayData.preview = data.preview || defaultData.preview;
			displayData.thumbnail = data.thumbnail || defaultData.thumbnail;

			if(data.title && typeof data.title == "object") {
				data.title = data.title.join(", ");
			}
			
			if(displayData.desc && typeof displayData.desc == "object") {
				displayData.desc = displayData.desc.join(", ");
			}

			displayData.desc = displayData.desc.substr(0,80)+"…";
			displayData.title = data.title || defaultData.title;
			
			if(displayData.title) {
				displayData.title = displayData.title.substr(0,50)
			}

			dom = template(displayData);
	    dom = $.parseHTML($.trim(dom));
	    dom = $(dom);
	    dom.addClass('compact');
	    $(timeItem.dom).append(dom);
	    $(timeItem.dom)
	    	.on('mouseover', self.startCounter)
	    	.on('mouseout, mousedown', self.stopCounter);
			self.mark(dataMan.isMarked(myData.pid));

			// enabling event buttons
	  	dom.find('.preview, a.full-image').on("click.ph-plus", function (e) {
				$(window).trigger("openSingleView", [myData]);
				return false;
			});

			dom.find("a.mark-image").on("click.ph-plus", function (e) {
				var _this = $(this);
				var unmark = _this.hasClass('active');
				_this.toggleClass("active");
				dataMan.markObject(myData.pid, unmark);
				self.mark(!unmark);
				return false;
			});

			if (!saveMode) 
			{
				dom.find("a.collection-image").on("click.ph-plus",function (e) {
					$(window).trigger('addToCollection', [myData]);
					return false;
				});
			} else {
				dom.find("a.collection-image").remove();
			}

			dom.find("a.download-image").on("click", function (e) {
				$(window).trigger('downloadSingleObject', [myData]);
				return false;
			});
	  };

		return timelineObject;
	}
);