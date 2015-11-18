define(['jquery', 'Handlebars', 'components/basics', 'text!templates/sidebar.hbs', 'i18n!nls/texts',
				'foundation'],
			 function ($, _H, _B, _tempRaw, _texts) {

	var sidebar = function()
	{
		var dataMan = null;
		var displayed = false;
		var dom = null;
		var imageResizeCb = null;
		var self = this;
		var template = null;

		this.createSidebar = function ()
		{
			if(dom) { return;	}


			dom = template();
			dom = $.parseHTML($.trim(dom));
			dom = $(dom);
					      
			$('body').append(dom);
			$('body').append($("#marker-actions"));

			$("#imagesize").on("change.ph-plus-sidebar", function () {
				if (imageResizeCb != null) {
					_B.executeCallback(imageResizeCb, null, [$(this).val()]);
				}
				$.cookie("imagesize", $(this).val(), { path: "/" });
			});

			if ($.cookie("imagesize")) {
				$("#imagesize").val($.cookie("imagesize"));
				$("#imagesize").trigger("change");
			} else {
				$("#imagesize").trigger("change");
			}

			$("#collection-marker-reverse").on("click.ph-plus-sidebar touchend.ph-plus-sidebar", function (e) {
				resourceMan.getResource('gsaData').reverseMarked();
				return false;
			});

			$("#collection-marker-filter").on("click.ph-plus-sidebar touchend.ph-plus-sidebar", function (e) {
				$(this).toggleClass("active");
				if($(this).hasClass("active")) {
					resourceMan.getResource('gsaData').restrictToMarked();
				} else {
					resourceMan.getResource('gsaData').showAll();
				}
				
				return false;
			});

			$("#collection-marker-add").on("click.ph-plus-sidebar touchend.ph-plus-sidebar", function (e) {
				$(window).trigger('addToCollection', []);
				return false;
			});

			$("#collection-marker-remove").on("click.ph-plus-sidebar touchend.ph-plus-sidebar", function (e) {
				resourceMan.getResource('gsaData').clearMarked();
				return false;
			});

			$('#marker-all').on('click.ph-plus-sidebar touchend.ph-plus-sidebar', function(e) {
				resourceMan.getResource('gsaData').markAll();
				return false;
			});


			$("#keywords select").on("change", function (e) {
				if($(this).val() == "showall") {
					resourceMan.getResource('gsaData').showAll();
				} else {
					dataMan.restrictToKeyword($(this).val());
				}
			});
		};

		this.updateSidebar = function()
		{
			dataMan = resourceMan.getResource('gsaData');

			if(!dom) { return; }

			dom.find('a.keywordbtn').off('.ph-plus-sidebar').remove();
			var opt1 = $("select[name='filterkeywords']").find("option").eq(0);
			$("select[name='filterkeywords']").find("option").remove();
			$("select[name='filterkeywords']").append(opt1);
			
			var curKeyword = "";
			
			if(!dataMan.getSelectedKeyword) {
				log("dataMan.getSelectedKeyword not defined in updateSidebar")
				return;
			};

			if(dataMan.getSelectedKeyword()) {
				curKeyword = dataMan.getSelectedKeyword();
			}
			var optgroup = $("select[name='filterkeywords']").find("optgroup")//$("<optgroup label='Filter nach Begriffen'></optgroup>")
			var allBtn = dom.find('.showall');
			for(var i in dataMan.keywords) {
				var e = dataMan.keywords[i];
				var t = e.substring(0,36);
				var disabled = curKeyword && curKeyword != e ? "disabled" : curKeyword == e ? "active" : "";
				var selected = curKeyword && curKeyword != e ? "" : curKeyword == e ? "selected" : "";
				var a = $('<a href="#" class="keywordbtn '+disabled+'">'+(t + " (" + dataMan.keywordnums["t" + e] + ")")+"</a>");
				var opt = $('<option value="'+e+'" '+selected+'>'+(t + " (" + dataMan.keywordnums["t" + e] + ")")+"</option>");
				a.data('keyword', e);
				var l =$("<li/>");
				l.append(a);
				//allBtn.before(l);
				optgroup.append(opt)
				
			}
			$("select[name='filterkeywords']").append(optgroup);

			if (typeof dataMan['getMarked'] != 'undefined') {
				
				if (!dataMan.getMarked().length) {					
					$('#marker-actions a.action').addClass("disabled");
				} else {
					$('#marker-actions a.action').removeClass("disabled");
				}

				if(dataMan.getDisplayMode() == "marked") {
					$("#collection-marker-filter").addClass("active");
				} else {
					$("#collection-marker-filter").removeClass("active");
				}

				if (dataMan.objects.length && dataMan.getMarked().length != dataMan.objects.length) {
					$('#marker-actions #marker-all').addClass("persistant");
				} else {
					$('#marker-actions #marker-all').removeClass("persistant");
				}
			}

			return self;
		};

		this.updateDisplayMode = function(e,mode)
		{
		}

		this.hide = function()
		{
			if (dom == null) {
				return;
			}
			
			displayed = false;
			dom.removeClass("open");
			return self;
		};

		this.setImageResizeListener = function(cb) {
			imageResizeCb = cb;
			return self;
		};

		this.show = function(d) {
			if (displayed) {
				return self;
			}

			if (typeof d != 'undefined' && d != null) {
				dataMan = d;
			} else {
				dataMan = resourceMan.getResource('gsaData');
			}

			if (dom == null) {
				self.createSidebar();
			}
			
			$(dataMan)
				.off('.ph-plus-sidebar')
				.on('change.ph-plus-sidebar', self.updateSidebar)
				.on('displayModeChanged.ph-plus-sidebar', self.updateDisplayMode);
				
			
			self.updateSidebar();

			if(typeof dataMan["getDisplayMode"] != "undefined" && dataMan.getDisplayMode() == "marked") {	
				//$("#collection-marker-filter").removeClass("secondary");
				$("#collection-marker-filter").addClass("active");
			} else {
				$("#collection-marker-filter").removeClass("active");
			}

			dom.addClass("open");
			displayed = true;
			return self;
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

		resourceMan.setResource('sidebar', self);

		resourceMan.setConfig('*', 'sidebar', {
			'deps': ['components/sidebar', 'components/data-manager'],
			'open': { 'scope': self },
		});

		resourceMan.setConfig('search', 'sidebar', {
			'deps': ['components/sidebar', 'components/data-manager'],
			'open': {
				'func': self.hide,
				'scope': self,
			},
		});

		/*resourceMan.setConfig('dataManaged', 'sidebar', {
			'deps': ['components/sidebar'],
			'open': {
				'func': self.updateSidebar,
				'scope': self,
			},
		});*/

		

		resourceMan.setConfig('*', 'sidebar', {
			'deps': ['components/sidebar', 'components/data-manager'],
			'open': { 'scope': self },
		});

    if (template == null) {
      template = _H.compile(_tempRaw);
    }
	};

	return sidebar;
});