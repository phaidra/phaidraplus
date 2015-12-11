/*
 ## changes
 - have all modules use resourceMan to access the current data.
 - close event handler can now have informations on the next state
 - can now use wildcard event handlers
 - can set event handler properties based on name and state as wildcard

 */
var _standalone = false;

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

function makeLogin()
{
	loginModal.foundation("reveal", "close");
	var phaidraQue = resourceMan.getResource('phaidra-que');

	phaidraQue.login(loginModal.find('input[name=user]').val(), loginModal.find('input[name=pswd]').val());
	//phaidraQue.execute("proxy/objects", null, { 'func': function(e){}, 'scope': null }, 'GET', true);

	$(window).trigger('init');
}

function showPage(e,data)
{
	pageModal.empty();
	pageModal.html(pages[data]);
	pageModal.append('<a href="#" id="modal-page-close-btn" class="button alert small">Schließen</a>')
	
	pageModal.find("#modal-page-close-btn").on("click",function(){
		$(".page-modal").foundation("reveal", "close");
	})
	pageModal.foundation("reveal", "open");
}

function loginRequired()
{
	loginModal.foundation("reveal", "close");
	setTimeout(function(){
		loginModal.foundation("reveal", "open");
	},300);
}

require(['jquery', 'Handlebars', 'components/resource-manager', 'states', 'components/search-request-manager',
				 'components/phaidra-que','components/download-manager','components/ingest-manager', 'text!templates/login-modal.hbs',
				 'text!templates/page-modal.hbs',
				 'text!templates/footer.hbs',
				 'text!templates/help.hbs',
				 'text!pages/page-imprint.html',
				 'text!pages/page-contact.html',
				 'text!pages/page-help.html',
				 'text!templates/topbar.hbs', 'i18n!nls/texts','components/basics',
				 'foundation','jquery.cookie'],
				function ($, _H, resourceManClass, states, _srm, _phQueClass, _downloadMan, _ingestMan, 
					loginTemplate,
					pageTemplate,
					footerTemplate,
					helpTemplate,
					pageImprintHTML,
					pageContactHTML,
					pageHelpHTML,
					topBarTemplate, _texts,_B) {
	
	var self = this;

	resourceMan = new resourceManClass();
	for(var key in states) {
		if (typeof states[key].conf != 'undefined') {
			resourceMan.register(states[key].state, states[key].name, states[key].conf);
		}
	}

	var srm = new _srm();

	resourceMan.setConfig('search', 'default', {
		'open': { 'scope': srm },
	});

	var downloadMan = new _downloadMan();
	resourceMan.setResource('download-man', downloadMan);

	var ingestMan = new _ingestMan();
	resourceMan.setResource('ingest-man', ingestMan);

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

	//
	var footer = _H.compile($.trim(footerTemplate));
	footer = $($.trim(footer()));
	$("body").append(footer)

	
	// asking for login
	loginModal = _H.compile($.trim(loginTemplate));
	loginModal = $($.trim(loginModal()));

	loginModal.find('#login-modal-cancel-btn').one('click.ph-plus', loginRequired);
	//loginModal.find('#login-modal-login-btn').one('click.ph-plus', makeLogin);
	loginModal.find("form").on("submit",function(e){
		makeLogin();
		return false;
	})

	pageModal = _H.compile($.trim(pageTemplate));
	pageModal = $($.trim(pageModal()));
	pages["page-imprint"] = pageImprintHTML;
	pages["page-contact"] = pageContactHTML;
	pages["page-help"] = pageHelpHTML;
	$("footer a[href='#']").on("click",function(){
		if($(this).attr("data-page")) {
			$(window).trigger("showpage.ph-plus",[$(this).attr("data-page")]);	
		}
		return false;
	})
	$(window)
		.on('showpage.ph-plus', showPage);

	topBar = _H.compile($.trim(topBarTemplate));
	topBar = $($.trim(topBar({login:true})));


	$("body").prepend(topBar);

	$(".top-bar .folder").addClass("active")
	$('.top-bar a, #main').on("click",function(e){
		$(".tooltip").hide();
	})

	$(window).on("logout",function(e){
		$.removeCookie('realname'); 
		$.removeCookie('token'); 
		$.removeCookie('username'); 
		//$.removeCookie("joyride");
		$(window).off('.ph-plus');
		window.location.href="/";
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

	
	$("#logout-button").on("click",function(){
		$(window).trigger("logout");
		return false;
	})
	$(".top-bar-section a[data-event], .top-bar-section .username a").on("click.ph-plus, touchend.ph-plus",function(e){
		if ($(this).hasClass('disabled') || $(this).hasClass('active')) {
			return false;
		}
		if($(this).parent().hasClass("pp-view") && $("html").hasClass("lightRoomCollectionView")) {
			e.preventDefault();
			return;
		}
		
		var eve = $(this).attr("data-event");

		if (!$(this).hasClass('toggle')) {
			$(".top-bar-section a").removeClass("active");

			$(this).addClass("active");
			$(this).closest(".has-dropdown a").addClass("active");
		}

		$(window).trigger(eve);
		e.preventDefault();
		return false;
	})

	

	$('body').append(loginModal);
	$('body').append(pageModal);

	if(!$.cookie("joyride")) {
		//HELP
		var help = _H.compile($.trim(helpTemplate));
		help = $($.trim(help()));
		$("body").append(help)
	}

	$(document).foundation();
	var phaidraQue = resourceMan.getResource('phaidra-que');

	if($.cookie("token")) {
		phaidraQue.setToken($.cookie("token"))
		phaidraQue.setUser($.cookie("realname"))
		$('.top-bar .username > a').text($.cookie("realname"))
		phaidraQue.execute("proxy/objects", null, { 'func': function(e){}, 'scope': null }, 'GET', true);
		$(window).trigger('init');
	} else {
		$.removeCookie("joyride");
		//$(window).trigger('init');
		loginModal.foundation("reveal", "open");

	}
	

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