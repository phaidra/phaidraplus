/*
 ## changes
 - have all modules use resourceMan to access the current data.
 - close event handler can now have informations on the next state
 - can now use wildcard event handlers
 - can set event handler properties based on name and state as wildcard

 */
var _standalone = false;

var CDN0 = "https://phaidra-plus.univie.ac.at";
var CDN1 = CDN0;
var CDN2 = CDN0;

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
	
	var phaidraQue = resourceMan.getResource('phaidra-que');
	phaidraQue.login(loginModal.find('input[name=user]').val(), loginModal.find('input[name=pswd]').val());
}
function authSuccess() {
	loginModal.foundation("reveal", "close");
}
function showLogin(e){
	if(!loginModal) {
		alert("Bitte laden Sie die Seite erneut");
		return false;
	}
	loginModal.find(".alert").hide();
	$(window).off("authSuccess");
	$(window).on("authSuccess",authSuccess);
	
	if(e && e.type == "authError") {
		loginModal.find(".alert").show();
	}
	loginModal.find('input[name=user]').val('');
	loginModal.find('input[name=pswd]').val('');

	loginModal.foundation("reveal", "open");
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


function loginRequired()
{
	loginModal.foundation("reveal", "close");
	setTimeout(function(){
		loginModal.foundation("reveal", "open");
	},300);
}

require([		'jquery', 
				 'Handlebars', 
				 'states', 
				 'config/general', 

				 'components/resource-manager', 
				 'components/search-request-manager',
				 'components/phaidra-que',
				 'components/download-manager',
				 'components/ingest-manager',
				 'components/help-manager',
				 'components/basics',

				 'text!templates/login-modal.hbs',
				 'text!templates/page-modal.hbs',
				 'text!templates/footer.hbs',
				 'text!templates/topbar.hbs',
				 'text!templates/help.hbs', 

				 'text!nls/'+LANGUAGE+'/page-imprint.html',
				 'text!nls/'+LANGUAGE+'/page-contact.html',
				 'text!nls/'+LANGUAGE+'/page-help.html',
				 'i18n!nls/texts',
				 
				 'foundation',
				 'jquery.cookie'],

				function ($, _H, states, CONF, 
					_ressourceMan, _srm, _phQueClass, _downloadMan, _ingestMan, _helpMan,_B, 
					loginTemplate, pageTemplate, footerTemplate, topBarTemplate, helpTemplate,
					pageImprintHTML, pageContactHTML, pageHelpHTML,
					_texts) {
	
	var self = this;

	resourceMan = new _ressourceMan();
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

	var helpMan = new _helpMan();
	resourceMan.setResource('help-man', helpMan);

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
	loginModal.find("form").on("submit",function(e){
		makeLogin();
		return false;
	})

	pageModal = _H.compile($.trim(pageTemplate));
	pageModal = $($.trim(pageModal()));
	pages["page-imprint"] = pageImprintHTML;
	pages["page-contact"] = pageContactHTML;
	pages["page-help"] = pageHelpHTML;

	
	$(window)
		.on('showpage.ph-plus', showPage);

	$(window)
		.on('showTour.ph-plus', showTour);

	topBar = _H.compile($.trim(topBarTemplate));
	topBar = $($.trim(topBar({login:true})));


	$("body").prepend(topBar);

	$(".top-bar .folder").addClass("active")
	$('.top-bar a, #main').on("click",function(e){
		$(".tooltip").hide();
	})

	$("a[data-page]").on("click touchend",function(e){
		
		if($(this).attr("data-page")) {
			$(window).trigger("showpage.ph-plus",[$(this).attr("data-page")]);	
		}
		return false;
	})

	$(window).on("logout",function(e){
		$.removeCookie('realname'); 
		$.removeCookie('token'); 
		$.removeCookie('username'); 
		$(window).off('.ph-plus');
		window.location.href="/";
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

	$(".top-bar").on("click.ph-plus touchend.ph-plus",".lightRoomCollectionView #main-menu a",function(){
		alert("Um Darstellungsformen zu aktivieren, öffnen Sie einen bestehenden Ordner, oder führen Sie eine Suchabfrage durch.")
	});
	$("#logout-button").on("click touchend",function(){
		$(window).trigger("logout");
		return false;
	})
	$(".top-bar a[data-event], .top-bar-section .username a").on("click.ph-plus, touchend.ph-plus",function(e){

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


	$(document).foundation();
	var phaidraQue = resourceMan.getResource('phaidra-que');

	if($.cookie("token")) {
		phaidraQue.setToken($.cookie("token"))
		phaidraQue.setUser($.cookie("realname"))
		$('.top-bar .login-name').text($.cookie("realname"))
		phaidraQue.execute("proxy/objects", null, { 'func': function(e){}, 'scope': null }, 'GET', true);
		$(window).trigger('init');
	} else {
		// $.removeCookie("joyride");
		// $.removeCookie("joyride-lc");
		// $.removeCookie("joyride-lr");
		// $.removeCookie("joyride-lr-login");
		// $.removeCookie("joyride-mark");

		$(window).on("authError",showLogin);
		showLogin();
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