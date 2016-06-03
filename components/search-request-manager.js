/**
 * The search query manager should be used to call the GSA with specific search queries.
 * It provides methods to set a normal search term and search terms for specific meta tags.
 * 
 * The basic process should be like:
 * 
 * 1. create an instance of the searchRequestManager
 * 2. register for 'searchFinished' event.
 * 3. set the query parameters (META Search – method:setQueryParam or Fulltext method:setQueryTerm)
 * 4. load the search results (method:load) or trigger the event 'search' on $(window) and provide search field data, start and pagesize.
 * and repeat with 2. if required
 * 
 * @module resources
 * @class searchRequestManager
 */
define(['jquery', 'xdomainrequest','Handlebars', 'components/basics', 'config/gsa-request', 'config/searchfields', 'text!templates/share-modal.hbs', 'i18n!nls/texts',
				'foundation'],
			 function($,_X, _H, _B, requestDefaults, searchFieldDefs, _rawTemplate, _texts) {
	/**
	 * @constructor
	 */
	var searchRequestManager = function() {
		var _p = {};
		/**
		 * An object containing all META Tags for query
		 * 
		 * @private
		 * @property currentMetas
		 * @type {Object}
		 */
		var currentMetas = null;
		/**
		 * Object containing the config of the current request.
		 * 
		 * @private
		 * @property currentRequest
		 * @type {Object}
		 */
		var currentRequest = null;
		/**
		 * Flag indication whether the object is in the stage of loading at the moment or not.
		 * 
		 * @private
		 * @property loading
		 * @type {Boolean}
		 */
		var loading = false;
		/**
		 * The maximum time for a request. After this time the request is aborted/timed out.
		 * 
		 * @default 6000
		 * @private
		 * @property maxLoadTime
		 * @static
		 * @final
		 * @type {Number}
		 */
		var maxLoadTime = 6000;
		/**
		 * The number of search results to retrieve from the GSA
		 * 
		 * @default 50
		 * @private
		 * @property pageSize
		 * @type {Number}
		 */
		var pageSize = 50;
		/**
		 * The Endpoint of the GSA to call for all requests.
		 * 
		 * @private
		 * @property gsaEndPoint
		 * @type {String}
		 */
		var gsaEndPoint = requestDefaults.endPoint;
		/**
		 * Results can be accessed at result[resultsField]
		 * 
		 * @private
		 * @property resultsField
		 * @type {String}
		 */
		var resultsField = requestDefaults.resultsField; 
		/**
		 * Backreference
		 * 
		 * @private
		 * @property self
		 * @type {Object}
		 */
		var self = this;
		/**
		 * The load timeout handler
		 * 
		 * @private
		 * @property timer
		 * @type {Object}
		 */
		var timer = null;
		/**
		 * Method compacting all set META Tags and search values to a request String.
		 * 
		 * @method createMetaQueryString
		 * @return {String} An encoded String of the search terms for the META Tags
		 */
		this.createMetaQueryString = function()
		{
			var m = self.getQueryMetas();
			if (m == null) { return null; }

			var parts = [];
			var fullquery = [];
			var first = true;
			var boolToQueryTerm = 'and';
			for(var p in m) {
				if (m[p].length == 0) {
					continue;
				}
				var partialquery = [];
				for(var i=0;i<m[p].length;i++) {
					var s = m[p][i].value;
					if (typeof s == "object") {
						s = JSON.stringify(s);
					}

					s = encodeURIComponent(s);
					s = s.replace(/\!/g,'%21')
					s = s.replace(/\'/g,'%27')
					s = s.replace(/\(/g,'%28')
					s = s.replace(/\)/g,'%29')
					s = s.replace(/\*/g,'%2A')
					s = s.replace(/\~/g,'%7E')
					var operator = (s.indexOf('..') != -1) ? ':' : '~';
					partialquery.push(m[p][i].bool.toUpperCase());
					partialquery.push('inmeta:'+p+operator+s);
				}
				if (first) {
					boolToQueryTerm = partialquery.shift();
					first = false;
				}
				fullquery.push(partialquery.join(' '));
			}

			return (fullquery.length > 0) ? [boolToQueryTerm, fullquery.join(' ')] : '';
		};
		/**
		 * Method setting all META Tag search parameters to default values.
		 * 
		 * @method clearMetas
		 * @chainable
		 */
		this.clearMetas = function()
		{
			currentMetas = {};
			for(var p in searchFieldDefs) {
				currentMetas[p] = null;
			}
			return self;
		};
		/**
		 * Creates a copy of the default request object and returns it for own usage.
		 * 
		 * @method getRequestDefaults
		 * @return {Object} a clone of the requestDefaults. See: config/gsa-request.js
		 */
		this.getRequestDefaults = function()
		{
			return $.extend(true, {}, requestDefaults);
		};
		/**
		 * Returns a copy of the current object containing all set search META Tags with their query terms.
		 * 
		 * @method getQueryMetas
		 * @return {Object} the current search query terms associated with their META Tags.
		 */
		this.getQueryMetas = function()
		{
			var o = $.extend(true, {}, currentMetas);
			for(var p in o) {
				if (o[p] instanceof Array) {
					if (o[p].length == 0 || o[p].join('') == '') { delete o[p]; }
					continue;
				}
				if (o[p] === null) {
					delete o[p];
				}
			}
			return o;
		};
		/**
		 * Method to retrieve the overall search query - i.e. the META Tags search setup plus the normal GSA search setup.
		 * All cleaned of non-set properties
		 * 
		 * @method getQuerySetup
		 * @return {Object} the query setup
		 */
		this.getQuerySetup = function()
		{
			var source = currentRequest || requestDefaults;
			var setup = $.extend(true, {}, source);

			setup.partialfields = self.createMetaQueryString();

			var finalSetup = {};
			for(var p in setup) {
				if (setup[p] === '') {
					continue;
				}

				finalSetup[p] = setup[p];
			}
			return finalSetup;
		};
		/**
		 * Method to query the GSA. It creates the AJAX get query and sets a timeout function.
		 * 
		 * @chainable
		 * @method load
		 * @param {String} [q] the normal search term
		 * @param {Number} [start] the index of the first result to load (pagination)
		 * @param {Number} [num] the number of results to load (pagination)
		 */
		this.load = function(q, start, num)
		{
			var setup = self.getQuerySetup();

			if (loading) { return false; }
			if (typeof q == "undefined" || q == null) {
				q = setup.query;
			}
			
			start = (typeof start == 'undefined') ? setup.start : start;
			num = num || pageSize;

			start = (start < 0) ? 0 : start;
			setup.query = q;

			if (typeof setup.partialfields != 'undefined' && setup.partialfields[1].length > 0) {
				if (typeof setup.query == 'undefined' || setup.query.length == 0) {
					setup.query = setup.partialfields[1];
				} else {
					setup.query = setup.query+' '+setup.partialfields[0]+' '+setup.partialfields[1];
				}
				delete setup.partialfields;
			}
			setup.num = num;
			setup.start = start*num;

			setup.requiredfields = requestDefaults.requiredfields;//"(type%3AImage|type%3APicture|type%3APDF|type%3APaper|type%3AText)";

			self.rawLoad(setup);
			return self;
		};
		/**
		 * Method called when GSA returns results successfully.
		 * Triggers ['searchFinished' event](searchRequestManager.html#events).
		 * 
		 * @async
		 * @method loadSuccess
		 * @param {Object} data the result of the GSA call.
		 * @param {Object} callback a callback to execute instead of the event.
		 * @param {Boolean} [reset=true] shall the gsaData be reset?
		 * @chainable
		 */
		this.loadSuccess = function(data, cb, reset)
		{
			loading = false;
			cb = cb || null;
			reset = (typeof reset != 'undefined') ? reset : true;
			window.clearTimeout(timer);
			
			if (!cb && reset) {
				resourceMan.setResource('gsaData', data[resultsField]);
			}

			if (cb == null) {
				$(window).trigger('searchFinished', [data[resultsField], data.TOTAL, data.start, data.num,(data.PARAM ? data.PARAM : null)]);
			} else {
				_B.executeCallback(cb, [data[resultsField]]);
			}
			return self;
		};
		/**
		 * Method called when GSA returned an error.
		 * Triggers ['searchFinished' event](searchRequestManager.html#events).
		 * 
		 * @async
		 * @method loadError
		 * @param {Object} event the event data
		 * @chainable
		 */
		this.loadError = function(e)
		{
			log('loadError', e);
			loading = false;
			window.clearTimeout(timer);
			resourceMan.setResource('gsaData', { 'error':true });
			$(window).trigger('searchFinished', []);
			return self;
		};
		/**
		 * Event handler called when GSA request ended in an timeout.
		 * Triggers ['searchFinished' event](searchRequestManager.html#events).
		 * 
		 * @async
		 * @method loadTimeout
		 * @chainable
		 */
		this.loadTimeout = function()
		{
			log('loadTimeout');
			loading = false;
			resourceMan.setResource('gsaData', { 'timeout':true });
			$(window).trigger('searchFinished', []);
			return self;
		};

		/**
		 * A method to load the next page of the result set. Increases the [currentRequest's](searchRe) start property by one and reloads the search.
		 * 
		 * @chainable
		 * @method loadNextPage
		 * @return {Mixed} Either self or false if still loading another request.
		 */
		this.loadNextPage = function()
		{
			if (loading) { return false; }
			if (currentRequest == null) {
				currentRequest = self.getQuerySetup();
			}
			currentRequest.start++;
			self.load();
			return self;
		};
		/**
		 * A method to load the previous page of the result set.
		 * 
		 * @chainable
		 * @method loadPreviousPage
		 * @return {Mixed} Either self or false if still loading another request.
		 */
		this.loadPreviousPage = function()
		{
			if (loading) { return false; }
			if (currentRequest == null) {
				currentRequest = self.getQuerySetup();
			}
			currentRequest.start--;
			self.load();
			return self;
		};
		/**
		 * A private helper method to check whether a value is boolean
		 * 
		 * @method matchValueToBoolean
		 * @param {Mixed} value The value to test
		 * @private
		 * @return {Mixed} Either null on failure or the value.
		 */
		_p.matchValueToBoolean = function(value)
		{
			return !!value;			
		};
		/**
		 * A method to match a value against a template if the template is an enum|select.
		 * It simply looks in the template array if the value is found.
		 * 
		 * @method matchValueToEnum
		 * @param {Mixed} value The value to test
		 * @param {Array} template The possible values
		 * @private
		 * @return {Mixed} Either null on failure or the value.
		 */
		_p.matchValueToEnum = function(value, template)
		{
			for (var i in template) {
				var ri = parseInt(i);

				if (ri != i && !template.hasOwnProperty(i)) continue;

				if (template[i] == value) return value;

				if (typeof template[i] == 'object') return _p.matchValueToEnum(value, template[i]);
			}

			return null;
		};
		/**
		 * Method to check whether a value is a valid Integer or Float.
		 *
		 * @private
		 * @method matchValueToNumber
		 * @param {Mixed} value The value can be Integer, Float or smaller/greater String (..[Integer]..) - see GSA documentation
		 * @return {Mixed} Either null on validation failure or the value
		 */
		_p.matchValueToNumber = function(value)
		{
			if (typeof value == 'undefined' || value == null || value == '..') {
				return null;
			}

			var ltOrGt = value.indexOf('..');
			if (ltOrGt != -1) {
				value = value.replace(/\.\./g, '');
			}

			var isFloat = (value.indexOf('.') != -1);

			value = new String(value);
			var regEx = (isFloat) ? new RegExp('[+-]?\\d+\\.\\d+', 'g') : new RegExp('[+-]?\\d+', 'g');
			value = value.match(regEx);
			value = (value && value.length > 0) ? value[0] : null;

			value = (isFloat) ? parseFloat(value) : parseInt(value);

			if (isNaN(value)) { value = null; }
			if (ltOrGt != -1) {
				value = (ltOrGt == 0) ? '..'+value : value+'..';
			}
			return value;
		};
		/**
		 * A method to match a value against a template if the template is an object.
		 * It simply compares the properties of both and checks if all are set in the value,
		 * that are required by the template.
		 * 
		 * @method matchValueToObject
		 * @param {Object} template The object representing the template
		 * @param {Object} value The object to test
		 * @private
		 * @return {Mixed} Either null on failure or the value.
		 */
		_p.matchValueToObject = function(value, template)
		{
			if (typeof value == 'undefined' || value == null) {
				return null;
			}

			for(var p in template) {
				if (typeof value[p] == "undefined") { return null; }
			}
			return value;
		};
		/**
		 * Helper function matching a value to be a text (not undefined or null or of zero length)
		 *
		 * @private
		 * @method matchValueToText
		 * @param {String} value 
		 * @return {String} null if not a text or the string
		 */
		_p.matchValueToText = function(value)
		{
			if (typeof value == 'undefined' || value == null || value == '') {
				return null;
			}
			return String(value);
		};
		/**
		 * A method to parse and match a given value against the META Tag definition defined by name.
		 * Gets the type of the META Tag and checks if the given value is possible or not.
		 * 
		 * @method parseQueryParamValue
		 * @param {String} name the name of the META Tag to validate against
		 * @param {Mixed} value the proposed value to check
		 * @return {Mixed} Either false on failure or the value if correct.
		 */
		this.parseQueryParamValue = function(name, value)
		{
			if (searchFieldDefs[name] instanceof Boolean) {
				return _p.matchValueToBoolean(value);
			}

			if (searchFieldDefs[name] instanceof Number) {
				return _p.matchValueToNumber(value);
			}

			if (searchFieldDefs[name] instanceof String) {
				return _p.matchValueToText(value);
			}

			switch(typeof searchFieldDefs[name]) {
				case 'object' :
						var t = "Object";
						var template = typeof searchFieldDefs[name];
						if (typeof searchFieldDefs[name].type != "undefined") {
							t = searchFieldDefs[name].type;
							t = t.substring(0,1).toUpperCase() + t.substring(1);
						}
						if (typeof searchFieldDefs[name].template != "undefined") {
							template = searchFieldDefs[name].template;
						}
						var f = "matchValueTo"+t;

						if (f == 'matchValueToRadio' && template) {
							f = 'matchValueToText';
						}

						value = _p[f](value, template);

						if (value === false && t == 'Object') { value = null; }
						return value;
					break;
			}
			return false;
		};
		/**
		 * Method executing the GSA query setup. Basically starts $.getJSON with the appropriate event handler and adds a loading spinner to the body.
		 * A timeout is started to check for connection timeouts.
		 *
		 * @chainable
		 * @method rawLoad
		 * @param {Object} query The query to execute
		 * @param {Object} [callback] a callback to execute after the result has been loaded
		 * @param {Boolean} [reset=true] shall the gsaData be reset?
		 * @chainable
		 */
		this.rawLoad = function(setup, cb, reset)
		{
			cb = cb || null;
			reset = (typeof reset != 'undefined') ? reset : true;
			currentRequest = setup;

			if (!cb && reset) {
				resourceMan.setResource('gsaData', {});
			}
			if(setup.endPoint) {
				delete setup.endPoint;
			}
			_B.makeLoading($('body'));
			$.support.cors = true;
			
			
			$.getJSON(gsaEndPoint, setup, function(data, textStatus, jqXHR) {
				data.num = setup.num;
				data.start = setup.start/setup.num;

			 	self.loadSuccess(data, cb, reset);
			})
			 .fail(function(jqXHR) {
			 	try {
			 		if(jqXHR.status == 200) {
			 			var r = $.trim(jqXHR.responseText)
			 			
			 			r = r.replace("↵","");
			 			var d = eval("("+r+")");
			 			self.loadSuccess(d, cb, reset);
			 		} else {
			 			self.loadError(jqXHR);
			 		}
			 	} catch(e) {
			 		self.loadError(jqXHR);
			 	}
			 })
			 .always(function() {
			 	_B.removeLoading($('body'));
			 }
			);

			timer = window.setTimeout(self.loadTimeout, maxLoadTime);
			return self;
		};
		/**
		 * Method to start a raw search, meaning the query term has to be provided, but therefore won't be touched
		 *
		 * @chainable
		 * @method rawSearch
		 * @param {String} query The query to execute
		 * @param {String} [required] The requiredfields to use for the query; content types for image, text, picture, pdf and paper are defaults.
		 * @param {Integer} [start=0] the first result object to retrieve
		 * @param {Integer} [number=100] the number of results to fetch; maximum is 100.
		 * @param {Object} [callback] a callback to execute after the result has been loaded
		 * @param {Boolean} [true] flag passed on to rawLoad
		 * @param {Object} [additions] an arbitrary object to extend the load setup to support additional query parameters
		 * @return {Mixed} Either the searchRequestManager or false if currently loading another query.
		 */
		this.rawSearch = function(query, required, start, num, cb, reset, additions)
		{
			cb = cb || null;
			start = start || 0;
			reset = (typeof reset != 'undefined') ? reset : true;
			additions = (typeof additions == 'object') ? additions : {};

			if (loading) { return false; }

			self.clearMetas();
			var setup = self.getQuerySetup();

			setup.num = (num > 0 && num < 101) ? num : 100;
			setup.query = query;
			setup.requiredfields = required || "(type%3AImage|type%3AText|type%3APicture|type%3APDF|type%3APaper)";
			setup.start = ((start < 0) ? 0 : start) * setup.num;

			setup = $.extend(true, setup, additions);			
			self.rawLoad(setup, cb, reset);
			return self;
		};
		/**
		 * Method displaying a link which can be used to display a link in a modal dialog to the current search and view in the standalone version.
		 *
		 * @method showShareLink
		 * @chainable
		 * @return {Mixed} Either self or false on failure
		 */
		this.showShareLink = function()
		{
			var link = '?standalone=true&view=';

			var dataMan = resourceMan.getResource('gsaData');
			var setup = null;

			if (dataMan.getDisplayMode() == 'collection' && dataMan.getSelectedCollection() != null) {
				// exit for own documents
				
				if (dataMan.getSelectedCollection() == -1) {
					return self;
				} else {
					
					setup = {
						'query': dataMan.getSelectedCollection(),
						'start': 0
					};
				}
			} else {
				setup = self.getQuerySetup();
			}
			switch (resourceMan.currentState) {
					case 'dataManaged':
						link += resourceMan.states['dataManaged'][0].open.scope.name;
						break;
					case 'openGeoView':
						link += 'geo';
						break;
					case 'openLightRoom':
						link += 'lightroom';
						break;
					case 'openSemanticView':
						link += 'semantic';
						break;
					case 'openTimelineView':
						link += 'timeline';
						break;
					default:
						return false;
				}
				

		  _H.registerHelper('translate', self.translate);
			
			var template = _H.compile($.trim(_rawTemplate));

			link += '&query='+setup.query;
			link += '&requiredfields=(type%3AImage|type%3AText|type%3APicture|type%3APDF|type%3APaper)';
			link += '&start='+setup.start;
			link += '&num='+pageSize;

			var dom = $($.trim(template({
				"link": location.protocol+'//'+location.host+location.pathname+link
			})));
			$('body').append(dom);

			
			dom.find("input[type=text]").focus();
			dom.find("input[type=text]").select();

			dom.find("#share-modal-close-btn").on("click.ph-plus", function (e) {
				dom.foundation('reveal', 'close');
				return false;
			});

			dom.foundation();
			dom.foundation("reveal", "open");
			return self;
		};

		/**
		 * Method to start a search immediately from scratch.
		 * Provide an  array of field values ({ 'key':value, 'boolean':[AND|OR] }),
		 * the start position of the first item to return and the number of items to fetch.
		 * 
		 * @chainable
		 * @method startSearch
		 * @param {Array} fields An array of key:values pairs representing the search fields.
		 * @param {Number} [start] The first search result to fetch
		 * @return {Number} [size] The number of results to get (maximum).
		 */
		this.startSearch = function(fields, start, size)
		{
			start = start || 0;
			size = size || pageSize;
			currentMetas = null;
			for(var i=0; i<fields.length; i++) {
				if ('query' in fields[i]) {
					self.setQueryTerm(fields[i]['query']);
					continue;
				}
				var fieldKey, fieldValue, fieldBool = null;

				outerloop:
				for (var key in fields[i]) {

					switch (key) {
						case 'boolean':
							fieldBool = fields[i][key];
							break;
						default:
							fieldKey = key;
							fieldValue = fields[i][key];
							break;
					}
				}

				self.setQueryParam(fieldKey, fieldValue, fieldBool);
			}

			self.load(null, start, size);
			return self;
		};

		/**
		 * Method to set the query page size
		 *
		 * @chainable
		 * @method setPageSize
		 * @param {Number} s The new pagesize for the next request.
		 */
		this.setPageSize = function(s)
		{
			currentRequest = currentRequest || self.getQuerySetup();
			currentRequest.num = s;			
			return self;
		};

		/**
		 * Method to set one query string for a META Tag search.
		 * 
		 * @chainable
		 * @method setQueryParam
		 * @param {String} name The name of the META Tag to set.
		 * @param {Mixed} value The query term / object by which to search the META Tag.
		 * @param {String} [bool] The boolean operator to add between the current and before value.
		 * @return {Mixed} Either false on failure (validation of the value fails) or the searchRequestManager object itself (for chaining).
		 */
		this.setQueryParam = function(name, value, bool)
		{
			bool = bool || 'and';
			if (!(name in searchFieldDefs)) {
				return false;
			}

			if (currentMetas == null) {
				self.clearMetas();
			}

			value = self.parseQueryParamValue(name, value);
			if (value != null) {
				if (currentMetas[name] == null) {
					currentMetas[name] = [];
				}
				currentMetas[name].push({ 'value':value, 'bool': bool });
			}
			return self;
		};

		/**
		 * Method to set the general query term for GSA search.
		 * 
		 * @chainable
		 * @method setQueryTerm
		 * @param {String} q The query term.
		 */
		this.setQueryTerm = function(q)
		{
			currentRequest = currentRequest || self.getQuerySetup();
			currentRequest.query = q;
			return self;
		};
		/**
		 * Helper method for Handlebars to translate terms. See [Handlebars.registerHelper](http://handlebarsjs.com/block_helpers.html)
		 * 
		 * @method translate
		 * @param {String} q The query term.
		 * @return {String} the translation result
		 */
		this.translate = function(term)
		{
	    if (typeof _texts[term] != 'undefined') {
	      return _texts[term];
	    } else {
	      return term;
	    }				
		};
	};

	return searchRequestManager;
});