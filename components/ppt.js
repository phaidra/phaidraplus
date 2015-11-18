/**
 * @module viewControllers
 * @submodule helpers
 */
define(['jquery', 'Handlebars', 'text!templates/ppt-modal.hbs', 'i18n!nls/texts', 'components/basics','foundation', 'spin'],

  function($, _H, _tempRaw, _T, _B) {
  /**
   * This helper class is used to create a Powerpoint Presentation on the fly from an array of phaidra objects.
   * The class basically displays a modal dialog and when a PPT is requested, the class calls the pptEndPoint
   * to have the Powerpoint File created. The returned file path is set as the new location of the window and hence
   * the download is started. After this process the class instance is deleted.
   *
   * ## Dependencies
   * - [basics](basics.html)
   * - [template:ppt-modal.hbs](../../templates/ppt-modal.hbs)
   *
   * @class pptCreator
   * @param {Array} collectionData An array of objects - preferably from a collection
   * @constructor
   */
  var pptCreator = function(collectionData)
  {
  	var data = collectionData;
  	var dom = null;
  	var pickupId = 0;
  	var pickupPath = null;
    /**
     * The path to call to have the powerpoint created.
     * 
     * @property pptEndPoint
     * @private
     * @type {String}
     */
  	var pptEndPoint = 'ppt.php';
  	var self = this;

  	this.delete = function()
  	{
			dom.foundation('reveal', 'close');
			dom.remove();
			delete dom;
			delete self;
  	};

  	this.display = function()
  	{
      var template = _H.compile(_tempRaw);

      dom = template();
      dom = $.parseHTML($.trim(dom));
      dom = $(dom);
      dom.find('#modal-ppt-create-btn').one('click.ph-plus', self.fetchPPT);
      dom.find('#modal-ppt-close-btn').one('click.ph-plus', self.delete);
			//
      $("body").append(dom)
      dom.foundation();
			dom.foundation("reveal", "open");
  	};

  	this.fetchPPT = function(e, altData)
  	{
  		var slidesData = altData || { 'slides': JSON.stringify(data) };
			
      //dom.foundation('reveal', 'close');
      dom.find(".button").hide();

			_B.makeLoading(dom.find(".modal-actions"));
      
      var a = $("<a href='#'>Ihre Datei wird vorbereitet</a>");
      a.hide();
      dom.find(".modal-actions").append(a);
      a.fadeIn();

  		$.ajax({
  			'url': pptEndPoint,
  			'type': 'POST',
  			'data': slidesData,
  		})
  		.done(self.fetchPPTFinished)
  		.fail(self.fetchPPTFinishedWithError);
  	};

  	this.fetchPPTFinished = function(data, textStatus, jqXHR)
  	{
      dom.find(".modal-actions a").remove();
      
  		if (typeof data['pickup'] != 'undefined') {
  			self.fetchPPT({ 'pickup': data['pickup'] });

  			return;
  		}

			_B.removeLoading(dom.find(".modal-actions"));
  		
  		if (typeof data['file']) {
        dom.find(".modal-actions").append("<a href='"+data["file"]+"'>Ihre Datei steht zum Download bereit</a>")
        try {
          var fwin = window.open(data['file']);
          //console.log(fwin)
          dom.find(".modal-actions a").on("click",function(){
            self.delete();
          })

          if(!fwin) {
            return;
          }
          $(fwin).on("load",function(){
            console.log("load")
            try {
              fwin.close();
              dom.foundation("hide");
              } catch(e) {
                console.log("load err")
                alert("cannot open popup");
                window.location.href = data['file'];
              }
              
          })
        } catch(e) {
          console.log("win open err")
          alert("cannot open popup");
          window.location.href = data['file'];
        }
  			self.delete();
  		}
  	};

  	this.fetchPPTFinishedWithError = function(jqXHR, textStatus, errorThrown)
  	{
  		alert('A server error occured while processing your request. Please try again later or contact your admin.');
			_B.removeLoading(dom.find(".modal-actions"));
  	};

    this.translate = function(term)
    {
      if (typeof _T[term] != 'undefined') {
        return _T[term];
      } else {
        return term;
      }      
    };

    _H.registerHelper('translate', self.translate);

    // preparing data
    var nd = [];

    for (var i = data.length - 1; i >= 0; i--) {
    	var o = {
		    "desc": data[i].data.description || data[i].data.description_de || data[i].data.description_en || null,
		    "img": data[i].data.preview_large || data[i].data.download || data[i].data.preview || null,
		    "title": data[i].data.title || data[i].data.title_de || data[i].data.title_en || null,
		    "url" : data[i].data.url || null,
    	};

    	if (o.img != null) {
	    	nd.push(o);
    	}

    	if (nd.length >= 50) {
    		break;
    	}
    };

  	data = nd;
    self.display();
  };

  return pptCreator;
});