var _standalone = true;
var CDN0 = "https://phaidra-plus.univie.ac.at";
var CDN1 = CDN0//"http://cdn1.r-g.io";
var CDN2 = CDN0//"http://cdn1.r-g.io";

var loginModal,pageModal = null;
var pages = {};

function displayMessage (d) {
	alert(d);
}

String.prototype.capitalize = function() {
  return this.charAt(0).toUpperCase() + this.slice(1);
}

function log(str) {
	if(console) {
		console.log(str)
	}
}

function removeSplashEvent() {
	$('#splashscreen').one('click.ph-plus', function() {
		$(this).fadeOut(400);
	});

	setTimeout(function(){
		$("#splashscreen").trigger("click");
	}, 600);
}

function setScopedInterval(func, millis, scope) {
    return setInterval(function () {
        func.apply(scope);
    }, millis);
}
function setScopedTimeout(func, millis, scope) {
    return setTimeout(function () {
        func.apply(scope);
    }, millis);
}

function hideTopbar () {
	$('nav.top-bar').hide();
}

function showTopbar () {
	$('nav.top-bar').show();
}

function showPage(e,data)
{
	pageModal.empty();
	pageModal.html(pages[data]);
	if(data != "page-intro") {
		pageModal.removeClass("intro small");
		pageModal.append('<a href="#" id="modal-page-close-btn" class="button alert small">Schließen</a>')
		
		pageModal.find("#modal-page-close-btn").on("click",function(){
			$(".page-modal").foundation("reveal", "close");
		})
		pageModal.find("form").off("submit");
	} else {
		pageModal.addClass("intro small");
		pageModal.find("form").on("submit",function(e){
			var t = $(".page-modal input").val();
			//log(t)
			pageModal.foundation("reveal", "close");
			$("#filter-canvas-filter-0").val(t);
			//$("#filter-canvas-filter-0").trigger("keydown").trigger("keyup").trigger("change");
			var q = t;
    		var r = "type%3AImage.installationID%3APhaidraProduction";
    		var s = 0;
    		var n = 50;
    		$(window).trigger('standalone-search', [q, r, s, n]);
    		$("#filter-canvas-filter-0").val(t);
			//$("#start-search-button").trigger("click")
			
			return false;
		})
	}
	pageModal.foundation("reveal", "open");
}

function initTopbar () {
	}

require(['jquery', 'Handlebars', 'components/resource-manager', 'states-standalone', 'components/search-request-manager', 'components/phaidra-que', 'components/download-manager', 'text!templates/topbar.hbs', 'i18n!nls/texts','components/basics',
				 'text!templates/login-modal.hbs',
				 'text!templates/page-modal.hbs',
				 'text!templates/footer.hbs',
				 'text!templates/help.hbs',
				 'text!pages/page-imprint.html',
				 'text!pages/page-contact.html',
				 'text!pages/page-help.html',
 				 'text!pages/page-intro.html',
				 'foundation'],
				function ($, _H, resourceManClass, states, _srm, _phQueClass, _downloadMan, topBarTemplate, _texts,_B,
					loginTemplate,
					pageTemplate,
					footerTemplate,
					helpTemplate,
					pageImprintHTML,
					pageContactHTML,
					pageHelpHTML,
					pageIntroHTML
					) {
	
	var self = this;

	resourceMan = new resourceManClass();
	for(var key in states) {
		if (typeof states[key].conf != 'undefined') {
			resourceMan.register(states[key].state, states[key].name, states[key].conf);
		}
	}

	var srm = new _srm();

	resourceMan.setConfig('*', 'search', {
		'open': { 'scope': srm },
	});

	var downloadMan = new _downloadMan();
	resourceMan.setResource('download-man', downloadMan);

	$(window)
		.on('showShareLink.ph-plus', srm.showShareLink)
		.on('rawSearch.ph-plus', function (e, q, r, s, n, cb) {
			srm.rawSearch(q, r, s, n, cb);
		})		
		.on('beforeunload.ph-plus', function(e) {
			var confMessage = self.translate('navigateAwayMessage');

			e.returnValue = confMessage;
			return confMessage;
		});
	
	resourceMan.setResource('phaidra-que', new _phQueClass());

	this.translate = function(term)
	  {
	    if (typeof _texts[term] != 'undefined') {
	      return _texts[term];
	    } else {
	      return term;
	    }      
	  };

	_H.registerHelper('translate', this.translate);

	topBar = _H.compile($.trim(topBarTemplate));
	topBar = $($.trim(topBar({login:false})));

	// removing functions not available in standalone mode
	topBar.find('.collections, .share').remove();
	topBar.find('a.icon-lightroom').data('event', 'openLightroomView'); // adjustment

	var footer = _H.compile($.trim(footerTemplate));
	footer = $($.trim(footer()));
	$("body").append(footer)

	pageModal = _H.compile($.trim(pageTemplate));
	pageModal = $($.trim(pageModal()));
	pages["page-imprint"] = pageImprintHTML;
	pages["page-contact"] = pageContactHTML;
	pages["page-help"] = pageHelpHTML;
	pages["page-intro"] = pageIntroHTML;

	$("footer a[href='#']").on("click",function(){
		if($(this).attr("data-page")) {
			$(window).trigger("showpage.ph-plus",[$(this).attr("data-page")]);	
		}
		return false;
	})
	$(window)
		.on('showpage.ph-plus', showPage);

	
	$('body').append(pageModal);
	$("body").prepend(topBar);

	$(".top-bar .folder").addClass("active")
	$('.top-bar a, #main').on("click",function(e){
		$(".tooltip").hide();
	})

	$(document).on("mouseenter.ph-plus","[data-tooltip]",function(){
		Foundation.libs.tooltip.getTip($(this)).removeClass("show");
		_B.delay(function(e){
			Foundation.libs.tooltip.getTip(e).addClass("show");
		},$(this),1000);
	}).on("mouseleave.ph-plus",function(){
		_B.noDelay($(this));
		Foundation.libs.tooltip.getTip($(this)).removeClass("show");
	});


	$(".top-bar-section ul:first a[data-event]").on("click.ph-plus",function(e) {
		if ($(this).hasClass('disabled') || $(this).hasClass('active')) {
			return false;
		}

		var eve = $(this).data("event");
		if($(this).parent().hasClass("pp-view") && $("html").hasClass("lightRoomCollectionView")) {
			e.preventDefault();
			return;
		}

		if (!$(this).hasClass('toggle')) {
			$(".top-bar-section ul:first a").removeClass("active");

			$(this).addClass("active");
			$(this).closest(".has-dropdown a").addClass("active");
		}

		$(window).trigger(eve);
		return false;
	});


	$(document).foundation();

	showPage(null,"page-intro")

	$(window).trigger('init');
});

(function() {

    var lastTime = 0;
    var vendors = ['ms', 'moz', 'webkit', 'o'];

    for(var x = 0; x < vendors.length && !window.requestAnimationFrame; ++x) {
        window.requestAnimationFrame = window[vendors[x]+'RequestAnimationFrame'];
        window.cancelAnimationFrame = 
          window[vendors[x]+'CancelAnimationFrame'] || window[vendors[x]+'CancelRequestAnimationFrame'];
    }
    
    if (!window.requestAnimationFrame)
        window.requestAnimationFrame = function(callback, element) {
            var currTime = new Date().getTime();
            var timeToCall = Math.max(0, 16 - (currTime - lastTime));
            var id = window.setTimeout(function() { callback(currTime + timeToCall); }, 
              timeToCall);
            lastTime = currTime + timeToCall;
            return id;
        };
 
    if (!window.cancelAnimationFrame)
        window.cancelAnimationFrame = function(id) {
            clearTimeout(id);
        };
}());