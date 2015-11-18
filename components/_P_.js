/**
 * @module resources
 * @submodule helpers
 */
define(['jquery','Handlebars','components/dummydata',
	'text!templates/collection-object.hbs',
	'text!templates/timeline-object.hbs',
	'text!templates/lightroom-object.hbs',
	'text!templates/map-object.hbs'],

 function($, Handlebars, dummydata,_template_collection,_template_timeline,_template_lightroom,_template_map) {
	/**
	 * Phaidra+ Objekt is a generic data container which helps normalize data from the GSA and can render the contents tailored to the needs a certain view.
	 * The templates for each view are stored in the Handlebars templates in the template folder.
	 *
	 * @class phaidraObject
	 * @param {Object} data The GSA Dataset
	 * @param {String} [view] The view to create the HTML Code for
	 * @constructor
	 */
	function _P_(opts, view) {
		this.data = dummydata();
		this.dom = null;
		this.currentView = null;
		this.init(opts,view);
		
	}
	
	_P_.prototype = {
		init : function(opts,view)
		{
			$.extend(this.data,opts);
			
			this.data.description = this.data.description ? this.data.description : this.data.description_de ? this.data.description_de : this.data.description_en ? this.data.description_en : "";
			
			
			if(this.data.description) {
				this.data.description = this.data.description.toString();
				this.data.summary = this.truncateToNearestSpace(this.data.description,200);
			} else {
				this.data.summary = "";
			}

			if(this.data.description) {
				this.data.description = this.linkify(this.data.description);
			}
			

			this.data.title = this.data.title ? this.data.title : this.data.title_de ? this.data.title_de : this.data.title_en ? this.data.title_en : "";

			this.formatDates();

			this.formatFilesize();

			if(!this.data.download) {
				this.createDownloadLinks();
			}
			
			if(view) {
				this.createDom(view);
			}
			return this;
		},

		createDownloadLinks : function()
		{
			var alias = this.data.preview;	

			
		},

		formatDates : function()
		{
			if(this.data.provenance && this.data.provenance[0]) {
				if(this.data.provenance[0].date_from) {
					var d = new Date(this.data.provenance[0].date_from);
					d = d.toLocaleString();
					d = d.split(" ")[0];
					if(d.substr(0,4) == "1.1.") {
						d = d.replace("1.1.","ca. ");
					}
					this.data.provenance[0].date_from = d;
				}
				if(this.data.provenance[0].date_to) {
					var d = new Date(this.data.provenance[0].date_to);
					d = d.toLocaleString()
					d = d.split(" ")[0];
					if(d.substr(0,4) == "1.1.") {
						d = d.replace("1.1.","ca. ");
					}
					this.data.provenance[0].date_to = d;
				}
			}
		},

		linkify : function(str){
			return str.replace(/\{link\}(.*)\{\/link\}/,"<a href='$1' target='_blank'>$1</a>");
		},

		formatFilesize : function()
		{
			if(this.data.filesize) {
				this.data.filesize_human = Math.floor((this.data.filesize/1024/1024)*100)/100+" Mb"
			} else {
				this.data.filesize_human = "";
			}
		},

		truncateToNearestSpace: function(text,maxLen)
    {
      // this may chop in the middle of a word
      var truncated = text.substr(0, maxLen);

      if (/[^\s]$/.test(truncated))
        return truncated.replace(/\s[^\s]+$/, "");
      else
        return truncated.trim();
    },
		/**
		 * Create DOM for a specific View from template, Use Handlebar to insert data
		 *
		 * @method createDom
		 * @param {Enum} view ["timeline","map","full","semantic","lightroom"]
		 * @param {Boolean} [saveMode=false] prevents the object from loading and showing the collection image
		 */
		createDom : function(view, saveMode)
		{
			var self = this;
			saveMode = saveMode || false;
			if(view) {
				var template;
				switch(view) {
					case 'collection':
						template = Handlebars.compile(_template_collection);
						break;
					case 'lightroom':
						template = Handlebars.compile(_template_lightroom);
						break;
					case 'map':
						template = Handlebars.compile(_template_map);
						break;
					case 'collection':
						template = Handlebars.compile(_template_collection);
						break;
				}
				if(this.currentView != view || !this.currentDom) {
					if(this.dom) {
						this.destroyDom();
					}
					this.dom = $(template(this.data));
					if (saveMode) {
						this.dom.find('a.collection-image').remove();
					}
					this.dom.data("object",this);
				}
				this.currentView = view;
			}
			return this.dom;
		},
		/**
		 * Destroy the complete object
		 *
		 * @method destroy
		 */
		destroy : function()
		{
			this.destroyDom();
			this.data = null;
		},
		/**
		 * Destroy exisiting DOM and unbind events / garbage collector
		 *
		 * @method destroyDom
		 */
		destroyDom : function()
		{

			if(this.dom) {
				this.dom.unbind(".p");
				this.dom.unbind("mouseover mouseout mouseleave click mousemove");
				this.dom.remove();
			}
		},

		getFullXML : function()
		{
			//DATA.get(this.data.url+"/getObject");
		}
	}
	return _P_;
})