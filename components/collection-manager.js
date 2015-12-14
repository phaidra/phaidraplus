/**
 * @module viewControllers
 * @submodule helpers
 */
define(['jquery', 'Handlebars', 'components/_P_', 'text!templates/collection-modal.hbs', 'spin', 'components/basics', 'config/general','i18n!nls/texts',
			'foundation',	'jquery.cookie'],
				function($, H, _P_, _template, S, _B, _conf,_texts) {
	/**
	 * If an object has no time or location data it is displayed in the bottom container of the corresponding view.
	 * This class provides the means to do so.
	 *
	 * ## Defines
	 * - 'collectionMan' in the resourceManager
	 *
	 * ## Events Consumed
	 * - addToCollection.ph-plus
	 * - changeCollectionProperty.ph-plus
	 * - createCollection.ph-plus	 
	 * - deleteCollection.ph-plus
	 * - deleteItemFromCollection.ph-plus
	 * - updateCollectionOrder.ph-plus
	 *
	 * ## Events Triggered
	 * - openLightRoomCollections
	 * - rawSearch
	 * - collectionSaved
	 *
	 * ## Dependencies
	 * - [basics](basics.html)
	 * - [dataManager](dataManager.html)
	 * - [phaidraObject](phaidraObject.html)
	 * - [phaidraQue](phaidraQue.html)
	 * - [resourceManager](resourceManager.html)
	 * - [template:collection-modal.hbs](../../templates/collection-modal.hbs)
	 *
	 * @class collectionManager
	 * @static
	 * @final
	 * @requires phaidraObject
	 * @requires basics
	 * @constructor
	 */
	var collectionManager = function()
	{

		var dataMan = null;
		var defaultRepository = '';
		var currentObjects;
		var self = this;
		var dom;
		var collections = [];
		var phaidraQue = null;
		var partialData = null; // if a collection cannot be loaded at once (gsa query length restriction), data is stored here
		var save = false;

		this.addNewCollectionToModal = function(colData)
		{
			var coldom = dom.find("dd:last").clone();

			coldom.find("ul .col-item").remove();
			coldom.find("ul .add-here").parent().show();
			coldom.find(".name").text(colData.title);
			coldom.find(".num").text(0);

			coldom.find("ul .add-here").attr("data-collection", colData.id);
			coldom.attr("data-collection", colData.id);
			coldom.find("> a").attr("href","#"+colData.id);
			coldom.find("> .content").attr("id", colData.id);

			dom.find("dd:first").before(coldom);

			self.updateHandlers();

			coldom.find("> a").trigger("click");			
		};

		this.addToCollection = function(index, obj)
		{
			collections[index].objects.unshift(obj);
			collections[index].saved = false;
		};

		this.changeCollectionProperty = function(uid, propName, propValue, cb)
		{
			var colIndex = self.findCollectionOnId(uid);

			if (colIndex == -1) { return false; }
			collections[colIndex][propName] = propValue;

			self.collectionChanged(colIndex);
			self.saveCollection(colIndex, false, cb);
		};
		/**
		 * Create the collection manager.
		 *
		 * @method create
		 */
		this.create = function()
		{
			dataMan = resourceMan.getResource('gsaData');

			resourceMan.setResource('collectionMan', self);
			phaidraQue = resourceMan.getResource('phaidra-que');
			//credentials = phaidraQue.getCredentials();

			$(window)
				.on("addToCollection.ph-plus", function(e,o) {
					self.showOverlay(e,o);
				})
				.on("changeCollectionProperty.ph-plus", function(e, uid, propName, propValue, cb) {
					self.changeCollectionProperty(uid, propName, propValue, cb);
				})
				.on("createCollection.ph-plus", function(e, cb) {
					self.createCollection(cb);
				})
				.on("deleteCollection.ph-plus", function(e, uid, cb) {
					self.deleteCollection(uid, cb);
				})
				.on("deleteItemFromCollection.ph-plus", function(e, objId, colId, cb) {
					self.deleteItemFromCollection(objId, colId, cb);
				})
				.on("updateCollectionOrder.ph-plus", function(e, uid, order) {
					self.updateCollectionOrder(uid, order);
				});

			self.loadCollections();
		}

		this.createCollection = function(cb)
		{
			var index = collections.push({
				'description' : "Beschreibung",
				'id'					: 0,
				'loaded'			: false,
				'objects'		  : [],
				'saved'				: false,
				'title' 			: _texts["click-to-edit"],
			});

			self.saveCollection(index-1, false, {
				'func' : self.createCollectionFinished,
				'scope': self,
				'data' : [index-1, cb],
			});
		}

		this.createCollectionFinished = function(index, cb)
		{
			if (cb) {
				_B.executeCallback(cb, null, [collections[index]]);
			}
			return;
		};

		this.collectionChanged = function (index)
		{
			collections[index].saved = false;
		};

		this.deleteCollection = function(uid, cb)
		{
			if (!uid || uid == 0) {
				window.alert('Error: no UID!');
				return;
			}
			_B.makeLoading($('body'));
			phaidraQue.execute(uid+"/", null, { 'func': self.deleteCollectionFinished, 'scope': self, 'data': [uid, cb] }, 'DELETE', true);
		};

		this.collections = function(){
			return collections;
		}

		this.deleteCollectionFinished = function(d, uid, cb)
		{
			_B.removeLoading($('body'));

			var index = self.findCollectionOnId(uid);
			if (index == -1) {
				return;
			}

			collections.splice(index, 1);

			resourceMan.pause();
			self.injectCollections();
			resourceMan.continue();
			_B.executeCallback(cb);
		};

		this.deleteItemFromCollection = function(oId, colId, cb)
		{
			var colIndex = self.findCollectionOnId(colId);
			if (colIndex == -1) {
				window.alert('Error:Collection not found!');
				return false;
			}

			if (collections[colIndex].objects.length == 1) {
				self.deleteCollection(colId, cb);
				return true;
			}

			var objIndex = -1;
			for (var i = collections[colIndex].objects.length - 1; i >= 0; i--) {
				if (collections[colIndex].objects[i].data.pid == oId) {
					objIndex = i;
					break;
				}
			}

			if (objIndex == -1) {
				window.alert('Error: Object in Collection not found!');
				return false;
			}

			collections[colIndex].objects.splice(objIndex, 1);
			self.collectionChanged(colIndex);
			self.saveCollection(colIndex, false, cb);
			return self;
		};

		this.findCollectionOnId = function(id)
		{
			for (var i = collections.length - 1; i >= 0; i--) {
				if (collections[i].id == id) {
					return i;
				}
			}
			return -1;
		};

		this.hide = function()
		{
			return self;
		}

		this.injectCollections = function()
		{
			dataMan.collections = [];
			// feeding dataManager
			for (var i = collections.length - 1; i >= 0; i--) {
				if (!collections[i].loaded) {
					dataMan.manageData(collections[i].objects, false);
					collections[i].objects = dataMan.objects; 
					collections[i].loaded = true;
				}
				dataMan.createCollection({
					'title': collections[i].title, 'objects': collections[i].objects, 'uid': collections[i].id,
					'updated':collections[i].updated
				});
			}
		};

		// function loading all collections of the member from phaidra temp
		this.loadCollections = function()
		{
			_B.makeLoading($('body'));
			phaidraQue.execute('', null, { 'func': self.loadingCollectionsFinished, 'scope': self }, 'GET', true);
		};

		this.loadSingleCollection = function(collectionId, required, start, num)
		{
			if (dataMan == null) {
				dataMan = resourceMan.getResource('gsaData');
			}

			if (phaidraQue == null) {
				phaidraQue = resourceMan.getResource('phaidra-que');
			}

			resourceMan.setResource('collectionMan', self);
			phaidraQue.execute('standalone/'+collectionId, null, { 'func': self.loadingCollectionsFinished, 'scope': self }, 'GET', false);
		};

		this.loadCollectionMembersData = function(which, all)
		{
			which = which || 0;
			all = all || false;

			var col = collections[which].objects;
			// getting all unique
			var ids = [];
			var numOfIds = 0;
			var totalQueryLength = 0;
			for(var i in col) {
				if (typeof col[i]['loaded'] != 'undefined') {
					continue;
				}

				var s = '(pid%3Ao%253a'+col[i].pid.slice(2)+'.'+_conf.repositoryMeta+'%3A'+col[i].repository+')';

				if (totalQueryLength + s.length + 8 < _conf.maxQueryLength - _conf.minQueryLength) {
					ids[col[i].pid] = s;
					numOfIds += 1;
					totalQueryLength += s.length + 8;
					col[i].loaded = true;
				} else {
					break;
				}
			}

			// do not query if collection is empty
			if (numOfIds == 0) {
				self.loadCollectionMembersDataFinished([], which, all);
				return;
			}

			// loading members from gsa
			var requiredFields = '';
			for(var i in ids) {
				requiredFields += ids[i]+'|';
			}
			requiredFields = requiredFields.slice(0, -1);
    	$(window).trigger('rawSearch', ['', requiredFields, null, null, { 'scope':self, 'func': self.loadCollectionMembersDataFinished, 'data':[which, all, numOfIds != col.length] }]);
		};

		this.loadCollectionMembersDataFinished = function(d, current, all, partial)
		{
			partial = (typeof partial == 'undefined') ? false : partial;
			var newlyOrdered = [];
			var keepOnLoading = false;

			if (partial && partialData != null) {
				newlyOrdered = partialData;
			}

			for (var i = collections[current].objects.length - 1; i >= 0; i--) {
				var searchId = collections[current].objects[i].pid;

				for (var j = d.length - 1; j >= 0; j--) {
					if (d[j].MT.pid == searchId) {
						newlyOrdered[collections[current].objects[i].pos] = d[j];
						break;
					}
				};
			};

			var c = 0;
			for(var p in newlyOrdered) { c++; }

			if (c >= collections[current].objects.length) {
				collections[current].objects = newlyOrdered;
				partialData = null;
			} else {
				partialData = newlyOrdered;
				keepOnLoading = true;
			}

			if (keepOnLoading) {
				self.loadCollectionMembersData(current, all);
			}
			else if (all && current < collections.length-1) {
				self.loadCollectionMembersData(current + 1, all);
			} else {
				self.injectCollections();

				_B.removeLoading($('body'));
				if (_standalone) {
					dataMan.selectCollection(collections[0].id);
					$(window).trigger("openLightroomView");
				} else {
					$(window).trigger("openLightRoomCollections");
				}
			}
		};

		this.loadingCollectionsFinished = function(d)
		{
			if (d && d.lists && d.lists.length > 0) {
				for(var i in d.lists) {
					// defaulting repository info
					var objs = [];
					for(var j in d.lists[i].list.members) {
						var o = d.lists[i].list.members[j];
						if (!o['repository']) {
							o['repository'] = defaultRepository;
						}
						objs.push(o);
					}
					
					collections.push({
						'description' : d.lists[i].list.title,
						'id'					: d.lists[i]._id,
						'loaded'			: false,
						'updated'			: d.lists[i].updated,
						'objects'		  : objs,
						'saved'				: true,
						'title' 			: d.lists[i].list.title,
					});
				}

				self.loadCollectionMembersData(0, true);
			} else {
				$('body').data('ph-plus-removeLoader')();
				$(window).trigger('openLightRoomCollections');
			}
		};

		this.saveCollection = function(index, all, cb)
		{
			if (collections[index].saved == true) {
				self.saveCollectionFinished(collections[index], index, all, cb);
				return;
			}

			all = all || false;
			cb = cb || null;
			var members = [];
	
			for (var i = collections[index].objects.length - 1; i >= 0; i--) {
				members.push({
					'namespace': collections[index].objects[i].data.installation.split('.')[0],
					'pid': collections[index].objects[i].data.pid,
					'pos': i,
					'repository': collections[index].objects[i].data[_conf.repositoryMeta],
				});
			};

			var d = {
				'description': collections[index].description,
				'members': members,
				'title': collections[index].title,
			};

			_B.makeLoading($('body'));

			if (collections[index].id != 0) {
				phaidraQue.execute(collections[index].id, d, { 'func': self.saveCollectionFinished, 'scope': self, 'data':[index, all, cb] }, 'POST', true);
			} else {
				phaidraQue.execute('', d, { 'func': self.saveCollectionFinished, 'scope': self, 'data':[index, all, cb] }, 'PUT', true);
			}
		};

		this.saveCollectionFinished = function(d, index, all, cb)
		{
			if (!collections[index].saved) {
				collections[index].saved = true;		
				collections[index].updated = new Date().getTime();
			}

			if (collections[index].id == 0) {
				collections[index].id = d.id;
			}

			$(self).trigger('collectionSaved', [index, collections[index] ]);

			if (index < collections.length-1 && all) {
				self.saveCollection(index+1, all);
				return;
			}

			resourceMan.pause();
			self.injectCollections();
			resourceMan.continue();

			_B.removeLoading($('body'));

			if (cb) {
				_B.executeCallback(cb);
			}
		};

		this.show = function()
		{
			return self;
		}

		this.showOverlay = function(e,d)
		{
			if(typeof d == "object") {
				if(!d.length) {
					if(d.data) {
						currentObjects = [dataMan.getObject(d.data.pid)];
					} else if(d.pid) {
						currentObjects = [dataMan.getObject(d.pid)];
					} else {
						alert("unknown object");
					}
					
				}
			} else {
				currentObjects = dataMan.getMarked();
			}
			save = false;
			$(".tooltip").hide();
			$("#overlay").remove();
			if(dom) {
				dom.empty();
				if(dom.parent()) {
					dom.remove();
				}
				dom = null;
			}
			
			var template = H.compile($.trim(_template));
			
			var COLLECTIONS = dataMan.collections;
			COLLECTIONS.sort(function(a,b){
			 	return a.title.toLowerCase() >= b.title.toLowerCase() ? 1 : -1;
			});
			dom = $($.trim(template({
				"collection": COLLECTIONS
			})));

			$("body").append(dom);

			dom = $("body #modal-collection").eq(0);


			dom.find("#modal-collection-close-btn").on("click.ph-plus", function (e) {
				dom.foundation('reveal', 'close');
				return false;
			});
			
			dom.find("#add-collection").on("click.ph-plus", function (e) {
				self.createCollection({
					'func' : self.addNewCollectionToModal,
					'scope': self,
				});
				return false;
			});
			
			dom.foundation();
			dom.foundation("reveal","open");

			self.updateHandlers();

			dom.find("dd:first > a").trigger("click");
			return false;
		}

		this.updateCollectionOrder = function(uid, order, cb)
		{
			var colIndex = self.findCollectionOnId(uid);

			if (colIndex == -1) {
				return false;
			}

			var col = collections[colIndex];
			var newlyOrdered = [];
			var membersData = [];

			for (var i = order.length - 1; i >= 0; i--) {
				var searchId = order[i];

				for (var j = col.objects.length - 1; j >= 0; j--) {
					if (col.objects[j].data.pid == searchId) {
						newlyOrdered[i] = col.objects[j];
						break;
					}
				};
			};

			col.objects = newlyOrdered;

			self.collectionChanged(colIndex);
			self.saveCollection(colIndex, false);
		};

		this.updateHandlers = function()
		{
			dom.find("a.add-here").off(".ph-plus");
			dom.find("a.add-here").on("click.ph-plus", function (e) {
				$(".tooltip").hide();
				$("#modal-collection a").removeClass("disabled");

				if ($(this).find("img").length) {
					return;
				}

				var section = $(this).closest("dd");
				var list = section.find("ul");
				var uid = $(this).data("collection");
				var colIndex = self.findCollectionOnId(uid);

				for (var i = currentObjects.length - 1; i >= 0; i--) {
					var obj = currentObjects[i];
					var objInCols = dataMan.objectFindCollections(obj);

					if(objInCols.indexOf(uid) != -1) {
						var doublette = list.find("[data-pid='"+obj.data.pid+"']");
						if(doublette.length) {
							doublette.remove();
						}
					}
					
					var link = $('<a href="#" data-tooltip title="'+obj.data.title+'" data-options="disable-for-touch: true" class="has-tip tip-top" />');
					var img = $("<img/>").attr("src", obj.data.preview);
					var li = $("<li/>").addClass("col-item").attr("data-pid",obj.data.pid);
					link.append(img);
					li.append(link);
					list.prepend(li);
					self.addToCollection(colIndex, obj);
				}

				self.collectionChanged(colIndex);
				self.saveCollection(0, true);
				$(this).parent().hide();

				section.find(".title .num").text(section.find("ul li").length-1);
				dom.foundation('reveal', 'close');
				return false;
			});	
		}

		defaultRepository = _conf.repositories[_conf.defaultRepository];
	};

	this.translate = function(term)
	{	
    if (typeof _texts[term] != 'undefined') {
      return _texts[term];
    } else {
      return term;
    }				
	};

	H.registerHelper('translate', self.translate);
	H.registerHelper('each_upto', function(ary, max, options)
	{
    if(!ary || ary.length == 0) { return options.inverse(this); }

    var result = [];
    for(var i = 0; i < max && i < ary.length; ++i) {
      result.push(options.fn(ary[i]));
    }
    return result.join('');
	});
	H.registerHelper('ifCond', function (v1, operator, v2, options) {

    switch (operator) {
      case '==':
        return (v1 == v2) ? options.fn(this) : options.inverse(this);
      case '===':
        return (v1 === v2) ? options.fn(this) : options.inverse(this);
      case '!=':
        return (v1 != v2) ? options.fn(this) : options.inverse(this);
      case '<':
        return (v1 < v2) ? options.fn(this) : options.inverse(this);
      case '<=':
        return (v1 <= v2) ? options.fn(this) : options.inverse(this);
      case '>':
        return (v1 > v2) ? options.fn(this) : options.inverse(this);
      case '>=':
        return (v1 >= v2) ? options.fn(this) : options.inverse(this);
      case '&&':
        return (v1 && v2) ? options.fn(this) : options.inverse(this);
      case '||':
        return (v1 || v2) ? options.fn(this) : options.inverse(this);
      default:
        return options.inverse(this);
    }
	});
	return collectionManager;
});