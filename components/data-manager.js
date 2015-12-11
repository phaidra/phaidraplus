/*
 * @module resources
 */
define(['jquery', 'components/_P_', 'config/general','spin', 'jquery.cookie'], function ($, _P_,CONF, S) {
	
	/**
	 * The data manager gets the raw data from a search request, transform it into usable and displayable objects
	 * and provides useful methods to sort, restrict data or manipulate it.

	 @class dataManager
	 @constructor
	 */
	/**
	 Event called when something changes in the data manager

	 @event dataManager:change
	 @param {Object} self the data manager instance
	 */
	/**
	 Event called when something changes in the data manager

	 @event dataManager:changeDisplayed
	 @param {Object} self the data manager instance
	 */
	/**
	 Event called when a collection is added, changed or removed

	 @event dataManager:collections
	 @param {Array} collections the available collections
	 */
	/**
	 Event called when the preferred set of objects to be displayed changes

	 @event dataManager:displayModeChanged
	 @param {String} mode the new display mode
	 */
	/**
	 Event called when the keywords of an object are changed

	 @event dataManager:keywords
	 @param {Array} keywords the available keywords
	 */
	/**
	 Event called when an object is marked or unmarked

	 @event dataManager:marked
	 @param {Array} marked the currently marked objects
	 */
	/**
	 Event called when objects are added, changed or removed

	 @event dataManager:objects
	 @param {Array} objects the currently available objects
	 */
	var dataManager = function()
	{
		/**
		 * Property containing all objects loaded over multiple pages 
		 * 
		 * @property allLoadedObjects
		 * @type {Array}
		 */
		this.allLoadedObjects = [];
		/**
		 * Property containing all objects of the current page
		 * 
		 * @property objects
		 * @type {Array}
		 */
		this.objects = [];
		/**
		 * Array containing all unique keywords of the objects
		 * 
		 * @property keywords
		 * @type {Array}
		 */
		this.keywords = [];
		/**
		 * Object referencing elements from the objects array by its keywords.
		 * References start with 't', i.e. 'tMyTerm': {object}
		 * 
		 * @property keywordhash
		 * @type {Object}
		 */
		this.keywordhash = {};
		/**
		 * Object containing a keyword count by term.
		 * References start with 't', i.e. 'tMyTerm': {object}
		 * 
		 * @property keywordnums
		 * @type {Object}
		 */
		this.keywordnums = {};
		/**
		 * Array containing the collections found in the {{#crossLink "dataManager:objects"}}objects Array{{/crossLink}}.
		 * References start with 't', i.e. 'tMyTerm': {object}
		 * 
		 * @property collections
		 * @type {Object}
		 */
		this.collections = [];
		/**
		 * Object containing the maximum geographic boundary of the objects found in the {{#crossLink "dataManager:objects"}}objects Array{{/crossLink}}.
		 * Object according to { southWest: { south: [Integer], west: [Integer] }, northEast: { north: [Integer], east: [Integer] }}
		 * 
		 * @property bounds
		 * @type {Object}
		 */
		this.bounds = {};
		/**
		 * Array containing all objects stared/marked by the user.
		 * 
		 * @property objectsmarked
		 * @type {Object}
		 */
		this.objectsmarked = [];
		/**
		 * Flag indicating whether the stack of all loaded objects shall be wipped or not.
		 * 
		 * @property saveLoadedObjects
		 * @type {Boolean}
		 */
		this.saveLoadedObjects = false;
		/**
		 * Backreference
		 * 
		 * @property self
		 * @private
		 * @type {Object}
		 */
		var self = this;
		/**
		 * Flag indicating which displaymode is currently active (null|all|marked|collection|keyword)
		 * 
		 * @property displayMode
		 * @private
		 * @type {Enum}
		 */
		var displayMode = 'all'; // null, all, marked, collection, keyword
		/**
		 * The UID of the currently selected collection if dataManager:displayMode is collection.
		 * 
		 * @property selectedCollection
		 * @default 'all'
		 * @private
		 * @type {String}
		 */
		var selectedCollection = null;
		/**
		 * The currently selected keyword if dataManager:displayMode is keyword.
		 * 
		 * @property selectedKeyword
		 * @private
		 * @type {String}
		 */
		var selectedKeyword = null;
		/**
		 * Index of the currently selected Object in the dataManager:currentObjects Array.
		 * 
		 * @property selectedObject
		 * @private
		 * @type {Integer}
		 */
		var selectedObject = 0;
		/**
		 * Array containing the currently selected objects resulting from changes in the dataManager:displayMode.
		 * 
		 * @property currentObjects
		 * @private
		 * @type {Array}
		 */
		var currentObjects = [];		
		/**
		 * Method to clear all marked objects in the result set.
		 * Sets display mode to 'all'. Triggers  {{#crossLink "dataManager/marked:event"}}{{/crossLink}},
		 * {{#crossLink "dataManager/changeDisplayed:event"}}{{/crossLink}} and {{#crossLink "dataManager/change:event"}}{{/crossLink}} if appropriate.
		 *
		 * @method clearMarked
		 * @chainable
		 * return {Object} self
		 */
		this.clearMarked = function()
		{
			var wasMarkedMode = false;

			self.markObjects(false);

			if (displayMode == 'marked') {
				wasMarkedMode = true;
				setDisplayMode('all');
			}

			$(self).trigger('marked', []);
			if (wasMarkedMode) {
				$(self).trigger('changeDisplayed', [self]);	
			}
			$(self).trigger('change', [self]);
			return self;
		};
		/**
		 * Helper method to convert an angle in degrees, minutes and seconds to full degrees
		 *
		 * @method convertDMSToDD
		 * @param {Float} degrees
		 * @param {Float} minutes
		 * @param {Float} seconds
		 * @param {Enum} direction (S|W|N|E)
		 * @return {Float}
		 */
		this.convertDMSToDD = function(degrees, minutes, seconds, direction)
		{
	    var dd = parseInt(degrees) + minutes/60 + seconds/(60*60);
	    if (direction == "S" || direction == "W") {
	        dd = dd * -1;
	    } // Don't do anything for N or E
	    return dd;
		}
		/**
		 * Method reseting all important attributes.
		 *
		 * @method clear
		 * @chainable
		 * return {Object} self
		 */
		this.clear = function()
		{
			self.keywords = [];
			self.keywordhash = {};
			self.keywordnums = {};
			self.objects = [];
			self.objectsmarked = [];
			selectedObject = 0;
			currentObjects = [];

			if (!self.saveLoadedObjects) {
				self.allLoadedObjects = [];
				selectedCollection = 0;
				setDisplayMode('all', true);
			}
			self.saveLoadedObjects = false;

			self.bounds = { southWest: { south: 40, west:-4 }, northEast: { north:52, east:30 }}; // (lat) north positive, south negative, (lon) east: positive, west: negative

			self.updateKeywords();
			return self;
		};
		/**
		 * Method to register the {{#crossLink "dataManager"}}{{/crossLink}} with the {{#crossLink "resourceManager"}}{{/crossLink}}
		 *
		 * @method create
		 * @chainable
		 * return {Object} self
		 */
		this.create = function()
		{	
			resourceMan.setResource('gsaData', self);
			self.clear();
			
			resourceMan.setConfig('searchFinished', 'parseData', {
				'deps': ['components/data-manager'],
				'open': { 'scope': self, 'func': self.manageSearchData },
				'close': { 'scope': self, 'func': self.done },
			});

			return self;
		};

		this.done = function()
		{
		};

		this.dontClearAll = function()
		{
			self.saveLoadedObjects = true;
		};

		/**
		 * Method returns an array of all collection the object belongs to.
		 *
		 * @method objectFindCollections
		 * @param {Object} object
		 * @return {Array} An Array of UIDs the object is already member of
		 */
		this.objectFindCollections = function(obj)
		{
			var cols = [];
			for (var i = self.collections.length - 1; i >= 0; i--) {
				var collection = self.collections[i];
				for (var k = collection.objects.length - 1; k >= 0; k--) {
					var o = collection.objects[k];
					if(o.data.pid == obj.data.pid) {
						cols.push(collection.uid);
					}
				};
			};
			return cols;
		}
		/**
		 * Method to sort the collections depending on the sort array (uids).
		 *
		 * @method sortCollections
		 * @param {Array} sort An array of uids
		 * @chainable
		 * return {Object} self
		 */
		this.sortCollections = function(sort)
		{
			var newSort = [];

			for (var i = 0; i < sort.length; i++) {
				var uid = sort[i];
				var index = self.getCollectionIndex(uid);
				newSort.push(self.collections[index]);
			};
			self.collections = newSort;
			return self;
		}
		/**
		 * Method to retrieve a collection's index in the {{#crossLink "dataMan/collections:attribute"}}{{/crossLink}} array based on its UID.
		 *
		 * @method getCollectionIndex
		 * @return {Integer} the index in the array or -1 if not found
		 */
		this.getCollectionIndex = function(uid)
		{
			for (var i = self.collections.length - 1; i >= 0; i--) {
				if(self.collections[i].uid == uid) {
					return i;
				}
			}
			return -1;
		};
		/**
		 * Method to clear and add new objects to the allLoadedObjects array
		 *
		 * @method copyToAllLoadedObjects
		 * @param {Array} objects The objects to store
		 * @param {Boolean} clear Flag whether to clear the objects or not.
		 * @chainable
		 * return {Object} self
		 */
		this.copyToAllLoadedObjects = function(objs, clear)
		{
			if (clear) {
				this.allLoadedObjects = [];
			}

			for(var i=0; i<objs.length; i++) {
				this.allLoadedObjects[objs[i].data.pid] = objs[i];
			}

			return this;
		};
		/**
		 * Method to create/register a collection with certain data.
		 *
		 *	data = { objects: [], d.uid: new String(), title: new String(), updated: new Date() }
		 *
		 * The data is converted and stored in the {{#crossLink "dataMan/collections:attribute"}}{{/crossLink}} array.
		 *
		 * @method createCollection
		 * @param {Object} data The data to create/store a collection from
		 * @chainable
		 * return {Object} self
		 */
		this.createCollection = function(d)
		{
			var n = new Array();
			for(var i=0;i<d.objects.length;i++) {
				var p = new _P_(d.objects[i].data);
				n.push(p);
			}
			var uid;
			
			if(d.uid) {
				uid = d.uid;
			} else {
				uid = "c"+new Date().getTime()
			}

			self.collections.unshift({title:d.title,"objects":n,uid:uid,updated:d.updated});
			return self;
		}
		/**
		 * Method to get a collection depending on the collection's title.
		 *
		 * @method getCollection
		 * @param {String} title
		 * @return {Array} The collection or null if not found
		 */
		this.getCollection = function(title)
		{
			for(var i in self.collections) {
				if (self.collections[i].title == title) {
					return self.collections[i];
				}
			}
			for(var i in self.collections) {
				if (self.collections[i].uid == title) {
					return self.collections[i];
				}
			}
			return null;
		};
		/**
		 * Get a specific object from the result set by its PID.
		 *
		 * @method getObject
		 * @param {String} pid
		 * @return {String} The object or null if not found.
		 */
		this.getObject = function(pid, searchInAll)
		{
			searchInAll = (typeof searchInAll == 'undefined' || searchInAll == null) ? false : searchInAll;
			for(var i in self.objects) {
				if (self.objects[i].data.pid == pid) {
					return self.objects[i];
				}
			}

			if (searchInAll && typeof self.allLoadedObjects[pid] == 'object') {
				return self.allLoadedObjects[pid];
			}

			return null;
		};
		/**
		 * Getter Function for {{#crossLink "dataManager/currentObjects:attribute"}}{{/crossLink}}.
		 *
		 * @method currentObjects
		 * @return {Array}
		 */
		this.getObjects = function()
		{
			return currentObjects;
		};
		/**
		 * Method updating the the {{#crossLink "dataManager/keywords:attribute"}}{{/crossLink}},
		 * {{#crossLink "dataManager/keywordshash:attribute"}}{{/crossLink}} and {{#crossLink "dataManager/keywordnums:attribute"}}{{/crossLink}} arrays.
		 * 
		 * @method updateKeywords
		 * @chainable
		 * return {Object} self
		 */
		this.updateKeywords = function()
		{
			self.keywords = [];
			self.keywordhash = {};
			self.keywordnums = {};
			
			var objs = self.getObjects();
			for(var i in objs) {
				var o = objs[i];
				self.getKeywords(o.data);
			}
			return self;
		}
		/**
		 * Method extracting the keyword of an object and adding it to the {{#crossLink "dataManager/keywords:attribute"}}{{/crossLink}},
		 * {{#crossLink "dataManager/keywordshash:attribute"}}{{/crossLink}} and {{#crossLink "dataManager/keywordnums:attribute"}}{{/crossLink}} arrays.
		 * 
		 * @method getKeywords
		 * @param {Object} object The object to check
		 * @chainable
		 * return {Object} self
		 */
		this.getKeywords = function(obj)
		{
			if(!obj.subject) return self;

			for (var i = obj.subject.length - 1; i >= 0; i--) {
				var s = obj.subject[i];
				if(!s || !s.taxon) continue;
				var path = s.taxon;
				if(!path || !path.length) continue;

				if (typeof path == "string") {
					path = [path];
				}
				
				var term = path[path.length-1];
				if(!term || $.trim(term).length < 3) continue;

				if(self.keywords.indexOf(term) == -1) {
					self.keywords.push(term);
					self.keywordhash["t"+term] = s;
					self.keywordnums["t"+term] = 1;
				} else {
					self.keywordnums["t"+term]++;
				}
			}
			return self;
		}
		/**
		 * Getter method for the {{#crossLink "dataManager/objectsmarked:attribute"}}{{/crossLink}} array.
		 *
		 * @method getMarked
		 * @return {Array}
		 */
		this.getMarked = function()
		{
			return self.objectsmarked;
		};
		/**
		 * Method to retrieve all objects in the result set for a certain keyword (regex).
		 *
		 * @method getObjectsForKeyword
		 * @param {String} term the keyword term
		 * @return {Array} An array of matching objects from the result set.
		 */
		this.getObjectsForKeyword = function(term)
		{
			var objs = [];
			var re = new RegExp("\\|\\|"+term+"$", "i"); // double escaping (for string and for regex)!!!
			var cobjs = self.objects;
			for(var i in cobjs) {
				var o = cobjs[i];
				if (typeof o.data.subject == 'undefined' || o.data.subject == null || o.data.subject.length <= 0) { continue; }
				
				for(var s in o.data.subject) {
					var tax = o.data.subject[s].taxon;

					if (tax && tax[tax.length-1] == term) {
						objs.push(o);
					}
				}
			}
			return objs;
		};
		/**
		 * Getter function for the currently selected collection (uid).
		 *
		 * @method getSelectedObject
		 * @return {Object}
		 */
		this.getSelectedCollection = function()
		{
			return selectedCollection;
		};
		/**
		 * Extended Getter function to retrieve the currently selected object.
		 *
		 * @method getSelectedObject
		 * @return {Object}
		 */
		this.getSelectedObject = function()
		{
			return currentObjects[selectedObject];
		};
		/**
		 * Method called after data has been loaded from the GSA.
		 * Checks the results, repairs the data and creates _P_ objects from the data.
		 * After successful conversation, sets itself as the resource 'gsaData' with the resource manager and triggers all events of the class.
		 * 
		 * @method manageData
		 * @param {Object} Data The result data to convert into a result set.
		 * @param {Boolean} [alert=true] Shall there be an alert when no results were returned?
		 * @chainable
		 * return {Object} self
		 */
		this.manageData = this.manageSearchData = function(d, alert)
		{			
			// for (var i = 0; i < self.objects.length; i++) {
			// 	self.objects[i].destroy();
			// };
			alert = (typeof alert == 'undefined') ? true : alert;
			self.clear();

			if (typeof d == 'undefined' || d.length == 0) {
				if (alert) {
					//window.alert('Sorry, this search resulted in ZERO results. Please alter your search parameters...');
					$("#mainsection").append("<h1 class='alert'>Sorry, this search resulted in ZERO results. Please alter your search parameters...</h1>")
					setTimeout(function(){
						$("#mainsection h1.alert").fadeOut(function(){
							$("#mainsection h1.alert").remove();
						});
					},2000)
				}
				//return;
			}
			

			for(var i in d) {
				var obj = d[i];
				
				if(!obj.MT) {
					log("error no MT");
					continue;
				}
				
				obj = obj.MT;
				
				if(!obj.preview && !obj.file) {
					log("error no file")
					continue;
				}
				
				obj = self.repairData(obj);
				
				if(!obj) {
					continue;
				}
				
				var p = new _P_(obj);
				p._marked = false;

				if (typeof self.allLoadedObjects[p.data.pid] == 'object') {
					p._marked = self.allLoadedObjects[p.data.pid]._marked;
				} else {
					self.allLoadedObjects[p.data.pid] = p;
				}

				self.objects.push(p);
			}

			currentObjects = self.objects;
			self.updateKeywords();
			self.updateMarked();

			resourceMan.setResource('gsaData', self);

			$(self).trigger('objects', [self.objects]);
			$(self).trigger('collections', [self.collections]);
			$(self).trigger('marked', [self.getMarked()]);
			$(self).trigger('keywords', [self.keywords]);
			$(self).trigger('displayModeChanged', [displayMode]);
			$(self).trigger('changeDisplayed', [self]);
			$(self).trigger('change', [self]);

			$(window).trigger("dataManaged", [self]);
			return self;
		};
		/**
		 * Method to mark all currently displayed objects.
		 * Triggers  {{#crossLink "dataManager/marked:event"}}{{/crossLink}},
		 * {{#crossLink "dataManager/changeDisplayed:event"}}{{/crossLink}} and {{#crossLink "dataManager/change:event"}}{{/crossLink}} if appropriate.
		 *
		 * @method markObject
		 * @chainable
		 * return {Object} self
		 */
		this.markAll = function()
		{
			this.markObjects(true);
			self.updateMarked();
			currentObjects = self.getMarked();

			$(self).trigger('marked', [self.getMarked()]);
			if (displayMode == 'marked') {
				$(self).trigger('changeDisplayed', [self]);	
			}
			$(self).trigger('change', [self]);
			return self;
		};
		/**
		 * Method to mark a specific object identified by its pid.
		 * Triggers  {{#crossLink "dataManager/marked:event"}}{{/crossLink}},
		 * {{#crossLink "dataManager/changeDisplayed:event"}}{{/crossLink}} and {{#crossLink "dataManager/change:event"}}{{/crossLink}} if appropriate.
		 *
		 * @method markObject
		 * @param {String} PID The pid of the object to mark
		 * @param {Boolean} [unmark=false] Shall the object be unmarked or marked?
		 * @return {String} An encoded String of the search terms for the META Tags
		 */
		this.markObject = function(pid, unmark)
		{
			if (typeof unmark == 'undefined' || unmark == null) {
				unmark = false;
			}

			var obj = self.getObject(pid);
			var modeChanged = false;
			if (obj != null) {
				obj._marked = !unmark;
				self.allLoadedObjects[obj.data.pid]._marked = obj._marked;
			}

			self.updateMarked();

			if (displayMode == 'marked') {
				if (self.getMarked().length == 0) {
					setDisplayMode('all');
					modeChanged = true;
				} else {
					currentObjects = self.getMarked();
				}
			}

			$(self).trigger('marked', [self.getMarked()]);
			if (displayMode == 'marked' || modeChanged) {
				$(self).trigger('changeDisplayed', [self]);	
			}
			$(self).trigger('change', [self]);
			return self;
		};
		/**
		 * Method extending the raw objects with the _marked flag and sets it value according to 'how'.
		 *
		 * @method markObjects
		 * @param {Boolean} how the value the flag shall be set to.
		 * @chainable
		 * return {Object} self
		 */
		this.markObjects = function(how) {
			for(var i in self.objects) {
				self.objects[i]._marked = how;
			}

			for(var i in self.allLoadedObjects) {
				self.allLoadedObjects[i]._marked = how;
			}

			if (how) {
				self.objectsmarked = self.allLoadedObjects;
			} else {
				self.objectsmarked = [];
			}

			return self;
		};
		/**
		 * Method checking whether an object is marked or not. Object is referenced by its PID.
		 * 
		 * @method isMarked
		 * @param {String} PID
		 * @return {Boolean} returns the current marking state of the object or null if the object is not found.
		 */
		this.isMarked = function(pid)
		{
			var obj = this.getObject(pid, true);
			if (obj == null) {
				return null;
			}

			return self.isObjMarked(obj);
		};
		/**
		 * Method checking whether an object is marked or not
		 * 
		 * @method isObjMarked
		 * @param {Object} Object
		 * @return {Boolean}
		 */
		this.isObjMarked = function(obj)
		{
			return obj._marked;
		};
		/**
		 * Method removing a collection from the collection array
		 *
		 * @method removeCollection
		 * @chainable
		 * @param {Number|String} uid Uid of the colleciton
		 * @param {Boolean} silent Flag whether to trigger events on the dataManager (objects, collections, changeDisplayed, change)
		 */
		this.removeCollection = function (uid, silent)
		{
			silent = (typeof silent == 'undefined') ? false : true;

			if (self.getSelectedCollection() == uid) {
				selectedCollection = 0;
				setDisplayMode('all', silent);
			}

			var index = self.getCollectionIndex(uid);
			
			if (index == -1) {
				return self;
			}

			self.collections.splice(index, 1);

			if (silent) {
				return self;
			}

			$(self).trigger('objects', [self.objects]);
			$(self).trigger('collections', [self.collections]);
			$(self).trigger('changeDisplayed', [self]);
			$(self).trigger('change', [self]);
			return self;
		};
		/**
		 * Method performing various data transformations on a result object.
		 *
		 * @method repairData
		 * @param {Object} object The raw object to repair.
		 * @return {Object} The repaired object.
		 */
		this.repairData = function(obj)
		{
			if (!obj.title) {
				if (obj.title_languages) {
					obj.title = obj["title_"+obj.title_languages];
				} else {
					obj.title = "Kein Titel";
				}
			}

			obj.description = null;
			if (!obj.description) {
				if (obj.description_languages) {
					if (obj.description_languages) {
						obj.description = obj["description_"+obj.description_languages];
					} else {
						obj.description = "Keine Beschreibung vorhanden";
					}
				}
			}

			if (obj.keywords && typeof obj.keywords == "string") {
			 	var keys = obj.keywords.split(",").join(";").split(";");
			 	//
			 	if (!obj.subject) {
	 				obj.subject = [];
	 			}
	 			
	 			if (!(obj.subject instanceof Array)) {
	 				obj.subject = [obj.subject];
	 			}
	 			
			 	for (var i = 0; i<keys.length; i++) {
			 		var key = $.trim(keys[i]);
			 		
			 		if(key) {
			 			obj.subject.push({source:"Freie Beschlagwortung",taxon:[key]})
			 		}
			 	};			 	
			};
			
			if (obj.roles) {
				if(obj.roles.entity) {
					obj.roles = [obj.roles];
				}
			}

			obj.isImage = false;
			obj.isDocument = false;

			if(obj.type == "Image") {
				obj.isImage = true;
				obj.preview = "preview/"+obj.pid+"/ImageManipulator/boxImage/480/jpg";
			} else {
				obj.isDocument = true;
				if (obj.preview) {
					obj.preview = "preview/"+obj.pid+"/Document/preview/480";
					obj.image = {'width':384,'height':480};
				} else if(obj.file) {
					obj.preview = "preview/"+obj.pid+"/Document/preview/480";
					obj.image = {'width':384,'height':480};
				} else {
					return null;
				}
			}

			var instanceURL = obj.installationID.toLowerCase() == "phaidratemp" ? "phaidra-temp" : "phaidra";
			var preview = obj.preview;

			obj.dbUrl = 'https://'+instanceURL+".univie.ac.at/"+obj.pid;
			obj.instance = instanceURL.replace("-t","T").replace("ph","Ph");
			obj.preview = 'https://'+instanceURL+".univie.ac.at/"+obj.preview;
			obj.preview_large = obj.preview.replace(/\/\d{3}/,"/1600");
			obj.thumbnail = obj.preview.replace(/\/\d{3}/,"/120");
			
			obj.download_original = instanceURL+"/download/"+"/get/"+obj.pid+"/bdef:Content/download";
			obj.download = instanceURL+"/download/"+"/"+preview;
			obj.download_medium = instanceURL+"/download/"+"/"+preview.replace(/\/\d{3}/,"/480");
			obj.download_small = obj.download_medium.replace("/960","/480");

			
			if (obj.latlon) {
				var p = obj.latlon.lat;
				if (typeof p['split'] != 'undefined') {
					p = p.split(/[^\d\w]+/);
					obj.latlon.lat = self.convertDMSToDD(p[0], p[1], p[2], p[3]);
				}
				p = obj.latlon.lon;
				if (typeof p['split'] != 'undefined') {
					p = p.split(/[^\d\w]+/);
					obj.latlon.lon = self.convertDMSToDD(p[0], p[1], p[2], p[3]);
				}
			}
			// RANDOM LOCATION
			// if(!obj.latlon) {
			// 	if (Math.random() > 0.2) {
			// 		obj.latlon = {};
			// 		var bounds = self.bounds;
			// 		obj.latlon.lat = bounds.southWest.south+(bounds.northEast.north-bounds.southWest.south)*Math.random();
			// 		obj.latlon.lon = bounds.southWest.west+(bounds.southWest.west+bounds.northEast.east)*Math.random();
			// 	}
			// }

			if (typeof obj.obj_date != 'undefined' || typeof obj.DATE != 'undefined') {
				var date = null;
				try {
					date = new Date(obj.obj_date || obj.DATE);
					date.getYear();
				} catch (e) {
					log("invalid date");
					log(e)
				}
				obj.obj_date = date;
			}
			
			if (typeof obj.provenience != 'undefined' && typeof obj.provenience.contribute != 'undefined') {
				var date = null;
				try {
					var prov = obj.provenience.contribute;
					if(typeof prov == "object" && typeof prov[0] == "object") {
						prov = prov[0];
					}
					var from = new Date(prov.date_from);
					var to = prov.date_to;
					if(to) {
						to = new Date(to);
						to = to.getTime();
						from = from.getTime();
						date = from+(to-from)/2
					}
					date = new Date(date);
					date.getYear();
				} catch (e) {
					log("invalid date or other error with provenience date");
					log(e)
				}
				obj.obj_date = date;
			}
			if(obj.obj_date) {
				try {
					var year = obj.obj_date.getYear();
					if (year == 1970) {
						//throw("error","");
					}
				} catch (e) {

				}
			}
			return obj;
		}

		this.randomDate = function(from,to){
		    if (!from) {
		        from = new Date(1900, 0, 1).getTime();
		    } else {
		        from = from.getTime();
		    }
		    if (!to) {
		        to = new Date(2100, 0, 1).getTime();
		    } else {
		        to = to.getTime();
		    }
		    return new Date(from + Math.round(Math.random() * (to - from)));
		}
		/*
		 * Method sets display mode to 'marked' and restricts object to objects having the selected keyword.
		 * Triggers {{#crossLink "dataManager/changeDisplayed:event"}}{{/crossLink}} and {{#crossLink "dataManager/change:event"}}{{/crossLink}}.
		 * 
		 * @method restrictToKeyword
		 * @param {String} Keyword The keyword to use for restriction of the current result set.
		 * @chainable
		 * return {Object} self
		 */
		this.restrictToKeyword = function(keyword)
		{
			selectedKeyword = keyword;
			setDisplayMode('keyword');
			$(self).trigger('changeDisplayed', [self]);
			$(self).trigger('change', [self]);
			return self;
		};
		/**
		 * Getter function for {{#crossLink "dataManager/selectedKeyword:attribute"}}{{/crossLink}}.
		 * 
		 * @method getSelectedKeyword
		 * @return {String} The currently selected keyword
		 */
		this.getSelectedKeyword = function() {
			return selectedKeyword;
		};
		/*
		 * Method sets display mode to 'marked' and restricts object to all currently marked.
		 * Triggers {{#crossLink "dataManager/changeDisplayed:event"}}{{/crossLink}} and {{#crossLink "dataManager/change:event"}}{{/crossLink}}.
		 * 
		 * @method restrictToMarked
		 * @chainable
		 * return {Object} self
		 */
		this.restrictToMarked = function()
		{
			setDisplayMode('marked');
			$(self).trigger('changeDisplayed', [self]);
			$(self).trigger('change', [self]);
			return self;
		};
		/**
		 * Method to invert the marked objects. So all marked objects get unmarked and vice versa.
		 * Triggers {{#crossLink "dataManager/changeDisplayed:event"}}{{/crossLink}} and {{#crossLink "dataManager/change:event"}}{{/crossLink}}.
		 * 
		 * @method reverseMarked
		 * @chainable
		 * return {Object} self
		 */
		this.reverseMarked = function()
		{
			for(var i in self.objects) {
				if (self.isObjMarked(self.objects[i])) {
					self.objects[i]._marked = false;
				} else {
					self.objects[i]._marked = true;
				}

				self.allLoadedObjects[self.objects[i].data.pid]._marked = self.objects[i]._marked;
			}

			self.updateMarked();

			if ((self.getMarked().length == 0 ||
				   self.getMarked().length == self.objects.length ) &&
					 displayMode == 'marked') {
				setDisplayMode('all');
			}

			if (displayMode == 'marked') {
				currentObjects = self.getMarked();
			}

			$(self).trigger('marked', [self.getMarked()]);
			if (displayMode == 'marked') {
				$(self).trigger('changeDisplayed', [self]);	
			}
			$(self).trigger('change', [self]);
			return self;
		};
		/**
		 * Getter for {{#crossLink "dataManager/displayMode:attribute"}}{{/crossLink}}
		 *
		 * @method getDisplayMode
		 * @return {String} displayMode The currently used display mode.
		 */
		this.getDisplayMode = function()
		{
			return displayMode;
		}
		/**
		 * Method to select a collection to be displayed. Sets display mode to 'collection'
		 * Triggers {{#crossLink "dataManager/changeDisplayed:event"}}{{/crossLink}} and {{#crossLink "dataManager/change:event"}}{{/crossLink}}.
		 * 
		 * @method selectCollection
		 * @chainable
		 * @param {String} Collection-uid The title of the collection to display.
		 * return {Object} self
		 */
		this.selectCollection = function(which)
		{
			if (selectedCollection != which) {
				self.markObjects(false);
			}

			selectedCollection = which;
			setDisplayMode('collection');
			$(self).trigger('changeDisplayed', [self]);
			$(self).trigger('change', [self]);
			
			return self;
		};
		/**
		 * Method to select the next object in the resultset.
		 * 
		 * @method selectNextObject
		 * @return {Object} Object The resulting object delivered from {{#crossLink "dataManager/selectObject:method"}}{{/crossLink}}
		 */
		this.selectNextObject = function(which)
		{
			return this.selectObject(++selectedObject);			
		};
		/**
		 * Method select an object from the result set either by its index number or by the object's PID number.
		 * 
		 * @method selectObject
		 * @param {Number|Object} Identifier Either the object index or the object to select (i.e. a js object with pid attribute)
		 * @return {Object}
		 */
		this.selectObject = function(which)
		{
			if (typeof which == 'number') {
				if (which < 0) {
					which = currentObjects.length + which;
				}

				if (which >= currentObjects.length) {
					which = which - currentObjects.length;
				}

				selectedObject = which;
				return currentObjects[selectedObject];
			}

			if (typeof which == 'object' && typeof which['pid'] != 'undefined') {
				for(var i in currentObjects) {
					if (currentObjects[i].data.pid == which['pid']) {
						selectedObject = i;
						return currentObjects[selectedObject];
					}
				}
			}
		};
		/**
		 * Method to select the previous object in the resultset.
		 * 
		 * @method selectPreviousObject
		 * @return {Object} Object The resulting object delivered from {{#crossLink "dataManager/selectObject:method"}}{{/crossLink}}
		 */
		this.selectPreviousObject = function()
		{
			return this.selectObject(--selectedObject);
		};
		/**
		 * Set a specific display mode (all|marked|collection|keyword).
		 * If set to 'collection' the value of {{#crossLink "dataManager/selectedCollection:attribute"}}{{/crossLink}} is used.
		 * If set to 'keyword' the value of {{#crossLink "dataManager/selectedKeyword:attribute"}}{{/crossLink}} is used.
		 * Triggers {{#crossLink "dataManager/displayModeChanged:event"}}{{/crossLink}}
		 * 
		 * @method setDisplayMode
		 * @chainable
		 * @param {Enum} Enum The display mode to set (all|marked|collection|keyword)
		 * return {Object} self
		 */
		var setDisplayMode = function(mode, silent)
		{
			silent = (typeof silent == 'undefined') ? false : silent;
			displayMode = mode;

			if (mode == 'all') {
				selectedKeyword = null;
				currentObjects = self.objects;
				self.updateKeywords();
			}

			if (mode == 'marked') {
				selectedKeyword = null;
				currentObjects = self.getMarked();
			}

			if (mode == 'collection') {
				selectedKeyword = null;
				
				var col = self.getCollection(selectedCollection);
				if (col == null) { return setDisplayMode('all', silent); }

				currentObjects = col.objects;
				self.objects = col.objects;
				self.copyToAllLoadedObjects(self.objects, true);
				self.updateKeywords();
			}

			if (mode == 'keyword') {
				currentObjects = self.getObjectsForKeyword(selectedKeyword);
			}

			if (!silent) {
				$(self).trigger('displayModeChanged', [mode]);
			}
			
			return self;
		};
		/**
		 * Method to remove all display restrictions and show all objects of the current result set.
		 * Triggers {{#crossLink "dataManager/changeDisplayed:event"}}{{/crossLink}} and {{#crossLink "dataManager/change:event"}}{{/crossLink}}.
		 * If the former display mode was 'marked' it also triggers {{#crossLink "dataManager/marked:event"}}{{/crossLink}}.
		 * 
		 * @method showAll
		 * @chainable
		 * return {Object} self
		 */
		this.showAll = function()
		{
			if (displayMode == 'all') {
				return self;
			}
			selectedKeyword = null;
			var formerMode = displayMode;
			
			setDisplayMode('all');

			if (formerMode == 'marked') {
				$(self).trigger('marked', [self.getMarked()]);
			}
			$(self).trigger('changeDisplayed', [self]);
			$(self).trigger('change', [self]);
			return self;
		};
		/**
		 * Method updating the currently marked objects array (dataManager:objectsmarked).
		 * Uses {{#crossLink "dataManager/isObjMarked:method"}}{{/crossLink}} to check whether an object was stared/marked.
		 *
		 * @method updateMarked
		 * @chainable
		 * @return {Object} self
		 */
		this.updateMarked = function()
		{
			self.objectsmarked = [];
			for(var i in self.allLoadedObjects) {
				if (self.allLoadedObjects[i]._marked) {
					self.objectsmarked.push(self.allLoadedObjects[i]);
				}
			}
			return self;
		};
	}

	return dataManager;
});