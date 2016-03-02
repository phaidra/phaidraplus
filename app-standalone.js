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

var showTour = function(){

	if(!$("html").hasClass("lightRoomCollectionView")) {
		var helpItems=["menu-lightroom","menu-geo","menu-timeline","menu-semantic","display-slideshow","display-options"];
		if(!$("html").hasClass("standalone")) {
			if($.cookie("joyride-lr-login")) {
				return;
			}
			helpItems.push("menu-share");
			helpItems.push("marker-actions");
			$.cookie("joyride-lr-login",true)
			$(window).trigger("showhelp",[{items:helpItems,align:"left"}]);
		} else if(!$.cookie("joyride-lr")) {
			helpItems.push("login-button");
			$.cookie("joyride-lr",true);
			$(window).trigger("showhelp",[{items:helpItems,align:"left"}]);
		} 
	} else {
		$(window).trigger("showhelp",[{items:["menu-collections","my-collections","my-objects-title",'queryterm-field','main-menu'],endtitle:'',endtext:translate("tour-collections-end")}]);//{items:[{item_id:"menu-collections",title:'',text:"text"}]])	
		$.cookie("joyride-lc",true);
	}
	
}



function showPage(e,data)
{
	pageModal.empty();
	pageModal.html(pages[data]);
	pageModal.append('<a href="#" id="modal-page-close-btn" class="button alert small">Schließen</a>')
		
	pageModal.find("#modal-page-close-btn").on("click",function(){
		$(".page-modal").foundation("reveal", "close");
	})
	pageModal.find("form").off("submit");
	
	pageModal.foundation("reveal", "open");
}
var queryTerm;

function initTopbar () {
	}

require([		'jquery', 
				 'Handlebars', 
				 'states-standalone', 
				 'config/general', 

				 'components/resource-manager', 
				 'components/search-request-manager',
				 'components/phaidra-que',
				 'components/download-manager',
				 'components/help-manager',
				 'components/basics',

				 'text!templates/login-modal.hbs',
				 'text!templates/page-modal.hbs',
				 'text!templates/page-intro.hbs',
				 'text!templates/footer.hbs',
				 'text!templates/topbar.hbs',
				 'text!templates/help.hbs', 

				 'text!nls/'+LANGUAGE+'/page-imprint.html',
				 'text!nls/'+LANGUAGE+'/page-contact.html',
				 'i18n!nls/texts',
				 
				 'foundation',
				 'jquery.cookie'],

				 function ($, _H, states, CONF, 
					_ressourceMan, _srm, _phQueClass, _downloadMan, _helpMan, _B, 
					loginTemplate, pageTemplate, introTemplate, footerTemplate, topBarTemplate, helpTemplate,
					pageImprintHTML, pageContactHTML,
					_texts) {
	
	var self = this;

	resourceMan = new _ressourceMan();
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

	var helpMan = new _helpMan();
	resourceMan.setResource('help-man', helpMan);

	$(window)
		.on('showShareLink.ph-plus', srm.showShareLink)
		.on('rawSearch.ph-plus', function (e, q, r, s, n, cb) {
			srm.rawSearch(q, r, s, n, cb);
		})		
		
	
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

	var introPage = _H.compile($.trim(introTemplate));
	introPage = $($.trim(introPage()));
	$("#mainsection").append(introPage);
	$("#intro").find("#introsearch").on("submit",function(e){
		var t = $("#intro input").val();
		$("#filter-canvas-filter-0").val(t);
		queryTerm = t;
		var q = t;
		var r = "installationID%3APhaidraProduction";
		var s = 0;
		var n = 50;
		$(window).trigger('standalone-search', [q, r, s, n]);
		$("#search-info").show();

		$("#intro").fadeOut();
		
		return false;
	})

	var footer = _H.compile($.trim(footerTemplate));
	footer = $($.trim(footer()));
	$("#main").append(footer)

	pageModal = _H.compile($.trim(pageTemplate));
	pageModal = $($.trim(pageModal()));
	pages["page-imprint"] = pageImprintHTML;
	pages["page-contact"] = pageContactHTML;
	
	
	$("#intro a[href='#'], footer a[href='#']").on("click",function(e){
		if($(this).hasClass("submit")) {
			$("#introform").submit();
			return false;
		}
		if($(this).attr("data-page")) {
			$(window).trigger("showpage.ph-plus",[$(this).attr("data-page")]);	
		}
		return false;
	})



	$(window)
		.on('showpage.ph-plus', showPage);

	$(window)
		.on('showTour.ph-plus', showTour);

	
	$('body').append(pageModal);
	$('body').prepend(topBar);

	$(".top-bar .folder").addClass("active")
	$('.top-bar a, #main').on("click",function(e){
		$(".tooltip").hide();
	})

	$(document).on("mouseenter.ph-plus","[data-tooltip]",function(){
		Foundation.libs.tooltip.getTip($(this)).removeClass("show");
		_B.delay(function(e){
			Foundation.libs.tooltip.getTip(e).addClass("show");
		},$(this),500);
	}).on("mouseleave.ph-plus",function(){
		_B.noDelay($(this));
		Foundation.libs.tooltip.getTip($(this)).removeClass("show");
	});


	$(".top-bar a[data-event]").on("click.ph-plus touchend.ph-plus",function(e) {
		if ($(this).hasClass('disabled') || $(this).hasClass('active')) {
			return false;
		}

		
		if($(this).parent().hasClass("pp-view") && $("html").hasClass("lightRoomCollectionView")) {
			e.preventDefault();
			return;
		}

		var eve = $(this).data("event");

		if (!$(this).hasClass('toggle')) {
			$(".top-bar-section a").removeClass("active");

			$(this).addClass("active");
			$(this).closest(".has-dropdown a").addClass("active");
		}

		$(window).trigger(eve);
		return false;
	});


	$(document).foundation();
	
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