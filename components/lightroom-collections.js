/**
 * @module viewControllers
 * @submodule main
 *
 * ## TODO
 *
 * - Update View when data is changed
 *
 */
define(['jquery', 'Handlebars','hallo','components/basics','components/ppt','text!templates/lightroom-collections.hbs','text!templates/ingest-modal.hbs','i18n!nls/texts', 'components/_P_', 'spin',
				'foundation', 'jquery.cookie'],

	function ($, _H, Hallo, _B, _pptCreatorClass, _template,_ingestTemplate, _texts, _P_, _spinner)
	{
	/**
	 * The lightroom collections class displays the owner's collections on the startpage of phaidra+.
	 *
	 * ## Events Triggered
	 * - changeCollectionProperty
	 * - clearSearchUI
	 * - createCollection
	 * - dataManaged
	 * - deleteCollection
	 * - deleteItemFromCollection
	 * - ingestObject
	 * - updateCollectionOrder
	 *
	 * ## Dependencies
	 * - [basics](basics.html)
	 * - [ppt](ppt.html)
	 * - [resourceManager](resourceManager.html)
	 * - [template:lightroom-collections.hbs](../../templates/lightroom-collections.hbs)
	 *
	 * @class lightroomCollections
	 * @static
	 * @final
	 * @constructor
	 */
		return function lightroomCollections()
		{
			var self = this;
			this.data = null;
			var dataMan;
			this.WALL;
			this.CURWIDTH;
			this.GRIDWIDTH;
			this.LISTWIDTH;
			this.CURSIZE;
			this.CURMODE = "grid";
			var dom;
			var template;
			var curCol;
			var phaidraQue;
			var numVisible = 6;
			var numOwnObjectsVisible = 18;
			var ownerObjects = [];

			this.name = 'collection';

			this.addCollection = function(d) {
				if (typeof d != 'undefined' && d != null) {
					dataMan = d;
				} else {
					dataMan = resourceMan.getResource('gsaData');
				}
			}
			/**
			 * @method create
			 */
			this.create = function (d)
			{
				var COLLECTIONS = [];
				
				$("html").addClass("lightRoomCollectionView");

				if (typeof d != 'undefined' && d != null) {
					dataMan = d;
				} else {
					dataMan = resourceMan.getResource('gsaData');					
				}

				if (dataMan == null) {
					return;
				}
				
				// if we are coming from the single view
				if ($('#container').length) {
					$("#container").fadeIn('400');
					return;
				}

				resourceMan.setConfig('*', 'lightRoomCollections', {
					'deps': ['components/sidebar', 'components/lightroom-collections'],
					'open': { 'scope': self, 'func': self.create },
					'close': { 'scope': self, 'func': self.close }
				});

				// set the lightroom (!not the lightRoomCollections) mode as default for dataManaged
				resourceMan.setConfig('dataManaged', 'default', {
					'deps': ['components/sidebar', 'components/lightroom'],
					'open': { 'scope': 'components_lightroom', 'func': 'show' },
					'close': { 'scope': 'components_lightroom', 'func': 'close' },
				});

				phaidraQue = resourceMan.getResource('phaidra-que');
				
				if(!$("#container").length) {
					$('#mainsection').append($('<div id="container">'));
				}

				if (dom) {
					dom.remove();
					dom = null;
					template = null;
				}

				if (template == null) {
	      			template = _H.compile(_template);
		    	}
				
				dataMan.removeCollection(-1, true);
				COLLECTIONS = dataMan.collections;
				COLLECTIONS.sort(function(a,b){
				 	return a.title.toLowerCase() >= b.title.toLowerCase() ? 1 : -1;
				});
				
				$(COLLECTIONS).each(function (i, e) {
					e.moreentries = e.objects.length-numVisible;
					e.moreentries = Math.max(0,e.moreentries);
					if(!e.updated) e.updated = new Date().getTime();
					e.timeago = _B.timeago(e.updated);
				});


				dom = template({collections:COLLECTIONS});
      			dom = $.parseHTML($.trim(dom));
      			dom = $(dom);

				$("#container").append(dom);

				var COLS = [];
				$(COLLECTIONS).each(function (i, e) {
					self.createCollectionDisplay(e.uid, e.title, e.objects, false, e.updated);
				});

				// attaching to save completed event
				$(resourceMan.getResource('collectionMan')).on('collectionSaved.ph-plus', function(e, i, d) {
					$('#container .collection[data-uid='+d.id+'] .show-date').text(_B.timeago(new Date()));
					return false;
				});

				// getting owner objects
				var adds = { 'sort': 'meta%3Aupload_date%3AD%3ASD' };
				var req = "(type%3AImage|type%3AText|type%3APicture|type%3APDF|type%3APaper)";
				req += '.(ownerID%3A'+$.cookie('username')+')';
				var cb = {
					'scope': self,
					'func': self.ownerObjectsLoaded
				};

				$(window).trigger('rawSearch', ['', req, 0, 100, cb, false, adds]);
				
				
				$("#container").foundation();
				$("#container").show();
				$("body").removeClass("init");
				self.resizeImages(2);
				$(window).trigger('clearSearchUI');

				
				self.updateHandlers();
				
				if(!$.cookie("joyride-lc")) {
					$(window).trigger("showhelp",[{items:["menu-collections","my-collections","my-objects-title",'queryterm-field','main-menu'],endtitle:'',endtext:translate("tour-collections-end")}]);//{items:[{item_id:"menu-collections",title:'',text:"text"}]])	
					$.cookie("joyride-lc",true);
				}
				
			};



			this.ownerObjectsLoaded = function (d)
			{
				var myObjsDom = dom.find('#my-objects');
				var ownerObjectsContainer = myObjsDom.find('.objects');
				
				ownerObjects = [];
				var num = 0;
				for (var i in d) {
					
					var obj = d[i];
					
					if(!obj.MT) {
						log("error no MT")
						continue;
					}
					
					obj = obj.MT;
					
					if (!obj.preview && !obj.file) {
						log("error no file")
						continue;
					}
					
					obj = dataMan.repairData(obj);
					if(!obj) continue;
					
					var p = new _P_(obj);
					
					
					ownerObjects.push(p);

					if(num>=numOwnObjectsVisible) continue;
					
					var cdom = p.createDom("collection", _standalone);
					cdom = cdom.clone();
					cdom
						.data("data", p.data)
						.on('click.ph-plus', function (e) {
							dataMan.selectCollection(-1);
							$(window).trigger("openSingleView",[$(this).data('data'), true]);
							return false;
						})

					ownerObjectsContainer.append(cdom);
					num++;
				}
				// myObjsDom.find("#add-object").on("touchend.ph-plus click.ph-plus",function (e) {
				// 	log("add click")
				// 	log(e)
				// 	$(window).trigger("ingestObject");
				// 	return false;
				// });

				self.updateImageSize(self.CURSIZE,true);

				if (ownerObjects.length) {
					//self.createCollectionDisplay(e.uid, e.title, e.objects, false, e.updated);
					dataMan.createCollection({
						'title': 'Meine Objekte', 'objects': ownerObjects, 'uid': -1,
						'updated':new Date()
					});

					myObjsDom.find('h4').fadeIn('400');

					myObjsDom.find(".open-collection").off(".ph-plus");
					myObjsDom.find(".open-collection").on("click.ph-plus", function (e) {
						dataMan.selectCollection(-1)
						$(window).trigger("dataManaged");
						e.preventDefault();
					});
				} else {
					myObjsDom.find('h4').hide();
				}
			};

			this.showAllOwnObjects = function(bool)
			{
				var myObjsDom = dom.find('#my-objects');
				var ownerObjectsContainer = myObjsDom.find('.objects');

				var objects = ownerObjects;
				//var col = self.getCollection(uid);
				if(bool) {
					for (var i = numOwnObjectsVisible; i < objects.length; i++) {
						var o = objects[i];
						var cdom = o.createDom("collection", _standalone);
						cdom = cdom.clone();
						cdom
						.data("data", o.data)
						.on('click.ph-plus', function (e) {
							dataMan.selectCollection(-1);
							$(window).trigger("openSingleView",[$(this).data('data'), true]);
							return false;
						});

						ownerObjectsContainer.append(cdom);
					};

					self.resizeImages(2);
				} else {
					ownerObjectsContainer.find("li").each(function(i,e){
						if(i>=numOwnObjectsVisible) {
							e.remove();
						}
					});
				}
			}



			this.createCollectionDisplay = function(uid, title, objects, append, updated, isnew)
			{
				append = (typeof append != 'undefined') ? append : true;

				var COLDOM = dom.find("li.collection[data-uid='"+uid+"']");
				
				if (!COLDOM.length || isnew) {
					if (!$("#mainsection li.collection").length) {
						COLDOM = $("<li>");
						COLDOM.addClass("collection");
						COLDOM.append($("#collection-template").html())
					} else {
						COLDOM = dom.find(".collection").eq(0).clone();
						COLDOM.find(".show-date").text("-");
						COLDOM.find(".show-more").text("");
					}

					COLDOM.find(".collection-items").empty();
					COLDOM.attr("data-uid",uid);
					COLDOM.data("uid",uid);
					COLDOM.find(".name").text(title);
					$("#mainsection .collections").prepend(COLDOM);
				}

				COLDOM.data("uid", uid);

				var name = COLDOM.find(".name");
				
				name.hallo();
				
				name
					.on("hallodeactivated", function() {
						var t = $(this).text();
					
						if (!t || t.length < 1) {
							t = "Unbenannt";
							$(this).text(t);
						}

						$(window).trigger('changeCollectionProperty', [$(this).closest(".collection").data("uid"), 'title', t]);
					})
					.on("keypress", function (e) {
						var keycode = (e.keyCode ? e.keyCode : e.which);

						switch(keycode) {
							case 13:
								name.hallo('turnOff');
								name.blur();
								return false;
							break;
						}
					});

				var CURCOL = COLDOM.find(".collection-items");
				
				CURCOL.data("uid", uid);

				if (objects.length) {
					COLDOM.find('.show-all, .download-ppt, .open-collection').removeClass('disabled');
					$(objects).each(function (k, e) {
						if (k>(numVisible-1)) { 
							return;
						}
						
						var cdom = e.createDom("collection", _standalone);
						cdom = cdom.clone();
						self.attachEvents(cdom, e);
						CURCOL.append(cdom);
					});
				} else {
					COLDOM.find('.show-all, .download-ppt, .open-collection').addClass('disabled');
				}
				COLDOM.on('click.ph-plus touchend.ph-plus','.delete-item', function() {
						var myself = $(this).closest('li');
						var cdom = myself
						var ownId = myself.data('pid');
						var collectionId = myself.closest('ul').data('uid');
						log("click delete")
						$(window).trigger('deleteItemFromCollection', [ownId, collectionId, {
							'func': function() {
								var obj = cdom;
								// decreasing counter
								var dp = cdom.closest('.inner').find('a.show-more');
								var c = parseInt(dp.text());
								var n = dp.text().split(' ')[1];
								dp.text((c-1)+' '+n);

								if (cdom.closest('.collection-items').find('.collection-object-view').length == 1) {
									obj = cdom.closest('.collection');
								}

								obj.fadeOut('400', function() {
									obj.remove();
								});
							}
						}]);
						return false;
					});
				return COLDOM;
			};

			this.attachEvents = function(cdom,e)
			{
				cdom
					.data("pid", e.data.pid)
				
			};

			this.showAll = function(uid,bool)
			{
				var objects = dataMan.getCollection(uid).objects;
				var col = self.getCollection(uid);
				if(bool) {
					for (var i = numVisible; i < objects.length; i++) {
						var o = objects[i];
						var cdom = o.createDom("collection");
						cdom = cdom.clone();
						cdom.data("pid",o.data.pid);
						self.attachEvents(cdom,o);
						col.append(cdom);
					};

					self.resizeImages(2);
				} else {
					col.find("li").each(function(i,e){
						if(i>=numVisible) {
							e.remove();
						}
					});
				}
			}

			
			this.getCollection = function(uid)
			{
				var cols = $("#container .collection-items");
				for (var i = cols.length - 1; i >= 0; i--) {
					var col = $(cols[i]);
					if(col.data("uid") == uid) {
						return col;
					}
				};
			}

			this.updateHandlers = function (collection, enable)
			{
				try {
					if (collection) {
						var container = collection;
					} else {
						var container = $("#container");
					}

					container.find("ul.collection-items").on("click",function () {
						$(this).closest(".collection").find(".open-collection").trigger("click.ph-plus");
					});

					if (container.find("ul.collection-items").data('ui-sortable')) {
						container.find("ul.collection-items")
							.sortable("destroy")
							.off("sortupdate");	
						container.find("ul.collections")
							.sortable("destroy")
							.off("sortupdate");
					}
				} catch (e) {
					log('collection error');
					log(e);
				}

				if (enable) {
					if (collection) {
						var container = collection;
					} else {
						var container = $("#container");
					}

					container.find("ul.collection-items").off("click");
					container.find("ul.collection-items").sortable({ scroll: false,helper: "clone",opacity: 0.5 });
					container.find("ul.collections").sortable({handle:".move",scroll:false});
					container.find("ul.collections").on("sortupdate", function () {
						var lis = $(this).find("li.collection");
						var sort = [];
						for (var i = 0; i < lis.length; i++) {
							var li = $(lis[i]);
							sort.push(li.data("uid"));
						};
						dataMan.sortCollections(sort);
					});

					container.find("ul.collection-items").on("sortupdate", function () {

						var uid = $(this).data("uid");
						var lis = $(this).find("li");
						var sort = [];
						for (var i = 0; i < lis.length; i++) {
							var li = $(lis[i]);
							sort.push(li.data("pid"));
						};
						$(window).trigger('updateCollectionOrder', [uid, sort]);
					});
				}

				dom.find(".collection .button").off(".ph-plus");
				dom.find(".open-collection").on("click.ph-plus",function (e) {
					var col = $(this).closest(".collection");
					var uid = col.data("uid");
					dataMan.selectCollection(uid)
					$(window).trigger("dataManaged");
					e.preventDefault();
				});

				dom.find(".delete-collection").on("click.ph-plus", function (e) {
					var col = $(this).closest(".collection");
					var uid = col.data("uid");
					var colContainer = $(this).closest("li");
					var c = confirm($(this).attr("data-warning"));
					if (c) {
						$(window).trigger('deleteCollection', [
							uid,
							{
								'func': function() {
									colContainer.fadeOut(300, function(){
										$(this).remove();
									});
								}
							}
						]);
					}
					e.preventDefault();
				});

				dom.find(".show-more").off("click.ph-plus")
				dom.find(".show-more").on("click.ph-plus",function (e) {
					$(this).closest(".collection").find(".show-all").trigger("click")
					if ($(this).closest(".collection").find(".show-all").hasClass("dark")) {
						$(this).show();
					} else {
						$(this).hide();
					}
					e.preventDefault();
				});

				dom.find('.download-ppt').on("click.ph-plus", function (e) {
					var uid = $(this).closest(".collection").data('uid');
					new _pptCreatorClass(dataMan.getCollection(uid).objects);
					return false;					
				});
				
				dom.find(".show-all").on("click.ph-plus",function (e) {
					var col = $(this).closest(".collection");
					var uid = col.data("uid");
					
					if ($(this).data("active")) {
						$(this).removeClass("active");
						$(".show-more").show();
						col.removeClass("editable");
						self.showAll(uid,false);
						self.updateHandlers(col);
						$(this).attr("title",$(this).attr("data-title"));						
					} else {
						self.showAll(uid,true);
						self.updateHandlers(col,true);
						col.addClass("editable");
						$(this).attr("title",$(this).attr("data-active-title"));
						$(this).addClass("active");
						col.find(".name").trigger("click");
						$(".show-more").hide();						
					}

					$(this).data("active",!$(this).data("active"));					
					e.preventDefault();
				});
				
				dom.find("#add-collection,#add-object").off(".ph-plus");

				dom.find("#add-collection").on("touchend.ph-plus click.ph-plus",function (e) {
					if(dom.find("#add-collection").hasClass("disabled")) return false;
					dom.find("#add-collection").addClass("disabled");
					self.createCollection();
					return false;
				});
				//log(dom.find("#add-object"))
				dom.find("#add-object").on("touchend.ph-plus click.ph-plus",function (e) {
					log("add click")
					log(e)
					$(window).trigger("ingestObject");
					return false;
				});
			}

			this.resizeImages = function(newVal)
			{
				var v = 8 - newVal;
				
				if (self.CURSIZE != v) {
					self.updateImageSize(v);
				}
			}

			this.createCollection = function(d)
			{
				$("#add-collection").off("*.ph-plus")
				$(window).trigger('createCollection', [{
					'func' : self.createCollectionFinished,
					'scope': self,
				}]);
			};

			this.createCollectionFinished = function(colData)
			{
				var o = self.createCollectionDisplay(colData.id, colData.title, colData.objects, false,null,true);

				self.updateImageSize(self.CURSIZE,true);
				self.updateHandlers(o);
				o.hide().fadeIn(400);
				dom.find("#add-collection").removeClass("disabled");
			};

			this.updateImageSize = function(v,force)
			{
				if (self.CURSIZE != v || force) {					
					var cols = $("#container").find("ul.collection-items.grid");

					cols.attr("class","collection-items");
					
					// var c = v+2;
					// c = 6;
					//cols.addClass("medium-block-grid-"+(c));
					// cols.addClass("large-block-grid-3");
					cols.addClass("medium-block-grid-8");
					cols.addClass("large-block-grid-6");
					
					var wh = $(window).width()>=1024?8:6
					var w = ($("#container .collection .collection-object-view .image").width()-10)//-10*wh)/wh;
					
					$("#container").find(".collection-object-view .image").css("height",Math.floor(w))//Math.floor(w*0.8))
				}
			}
			/**
			 * @method show
			 */
			this.show = function() {
				$("#container").fadeIn(400);
			};
			/**
			 * @method close
			 */
			this.close = function (newState)
			{
				$("html").removeClass("lightRoomCollectionView");

				resourceMan.getResource('sidebar').setImageResizeListener(null);				
				$('#mainsection').empty();

				$(resourceMan.getResource('collectionMan')).off('.ph-plus');

				resourceMan.setConfig('*', 'lightRoomCollections', {
					'deps': ['components/lightroom-collections'],
					'open': { 'scope': 'components_lightroomCollections', 'func': 'create' },
					'close': { 'scope': 'components_lightroomCollections', 'func': 'close' },
				});
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
		}
	});