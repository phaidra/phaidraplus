define(['jquery', 'Handlebars', 'components/_P_', 'text!templates/ingest-modal.hbs', 'spin', 'components/basics','i18n!nls/texts',
			'foundation',	'jquery.cookie'],
				function($, _H, _P_, _template, S, _B,_texts) {

	var ingestManager = function()
	{
		var currentObjects;
		var self = this;
		var dom;
		var dataMan;
		var phaidraQue = null;
		var save = false;

		this.create = function()
		{

			$(window)
				.on("ingestObject", function(e,o) {
					self.showOverlay(e,o);
				})
				
			return self;
		}

		this.hide = function()
		{
			return self;
		}


		// function loading all collections of the member from phaidra temp
		this.loadZip = function()
		{
			_B.makeLoading($('body'));
			//phaidraQue.execute('', null, { 'func': self.loadingCollectionsFinished, 'scope': self }, 'GET', true);
		};


		this.loadingZipFinished = function(d)
		{	
			$('body').data('ph-plus-removeLoader')();
		};


		this.show = function()
		{
			return self;
		}

		this.showOverlay = function(e,d)
		{
			
			save = false;
			
			if(dom) {
				dom.empty();
				if(dom.parent()) {
					dom.remove();
				}
				dom = null;
			}
			_H.registerHelper('translate', self.translate);
			var template = _H.compile($.trim(_template));
			dom = $($.trim(template()));

			//log(dom)
			$("body").append(dom);

			dom = $("body #modal-ingest").eq(0);

			dom.find("#ingest-modal-close-btn").on("click.ph-plus", function (e) {
				dom.foundation('reveal', 'close');
				return false;
			});
			
			dom.foundation();
			dom.foundation("reveal","open");

			self.updateHandlers();
			e.preventDefault();
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

	
	return ingestManager;
});