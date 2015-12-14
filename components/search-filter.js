/**
 @module search
 */
define(['jquery', 'jqueryui', 'components/basics', 'Handlebars', 'text!templates/search-elements.hbs', 'config/searchfields', 'i18n!nls/texts'],
			 function($, jui, _B, _H, _tempRaw, searchFieldDefs, _T) {

	/**
	 The searchFilter class is used to create and manage a certain search input field.
	 The searchFilter supports multiple types:

	 - boolean
	 - date
	 - enum
	 - objects
	 - radio
	 - select with option groups
	 - text

	 ## Todos

	 - add range selections
	 
	 @class searchFilter
	 @constructor
	 @param {Object} dP The DOM parent to insert the filter into
	 @param {String} field The name of the META Tag to represent - according to config/searchfields.js
	 @param {Mixed} [val] The start value assigned to the META Tag
	 */
	/**
	 Event called when the input changes from filled (valid input) to an empty input.

	 @event cleared
	 */
	/**
	 Event fired when the filter is removed from the UI.

	 @event delete
	 */
	/**
	 Event fired when enter is pressed on the input.

	 @event enter
	 */
	/**
	 Event fired when escape is pressed on the input.

	 @event escape
	 */
	/**
	 Event fired when the input changes from empty to an filled state, meaning that some valid content is available.

	 @event filled
	 */
	var searchFilter = function(dP, field, val) {
		var autoCompleteConf = null,
				autoComleteDefaults = {
					close: null,
					minLength: 3,
				},
		/**
		 Property storing the jquery DOM object

		 @private
		 @property dom
		 @type {Object}
		 */
				dom = null,
		/**
		 Property containing the ID of jquery DOM object - for convenience reasons
		 
		 @private
		 @property domId
		 @type {String}
		 */
				domId = null,
		/**
		 Backreference to the jquery DOM object containing the own DOM object.
		 
		 @private
		 @property domParent
		 @type {Object}
		 */
				domParent = dP,
				dontReactOnEnter = false,
		/**
		 Flag indicating whether the current input field has a valid input or is empty.
		 
		 @private
		 @property filled
		 @type {Boolean}
		 */
		 		filled = false,
		/**
		 The html type used to display the current filter.
		 
		 @private
		 @property htmlType
		 @type {String}
		 */
				htmlType = null,
		/**
		 A config variable containing the ID prefix to add to each DOM object
		 
		 @default '-filter-'
		 @private
		 @property idPrefix
		 @type {String}
		 @final
		 */
				idPrefix = '-filter-',
		/**
		 The interal name of the META tag represented - according to config/searchfields.js
		 
		 @private
		 @property metaName
		 @type {String}
		 */
				metaName = null,
		/**
		 Flag indicating whether the selection of multiple values is possible or not
		 
		 @private
		 @property multipleValues
		 @type {Boolean}
		 */
				multipleValues = false,
		/**
		 Property containing a template (either Array or Object) with the possible values (i.e. select, enum, etc.)
		 
		 @private
		 @property possibleValues
		 @type {Array | Object}
		 */
				possibleValues = null,

		/**
		 Backreference
		 
		 @private
		 @property self
		 @type {Object}
		 */
				self = this,
		/**
		 Template Container
		 
		 @private
		 @property template
		 @type {Object}
		 */
				template = null;

		this.addBooleanOps = function()
		{
			if (!dom && !template) { return; }
			var conf = {
				'booleanOperators': true,
				'id': domId,
			}
			var html = template(conf);
			dom.prepend($(html));
			return self;
		};

		this.addFilterToDom = function() {
			dom.addClass(metaName);

			//log(metaName)
			var similar = domParent.find('.'+metaName+':last');
			if (domParent.find('.sf').length > 0) {
				self.addBooleanOps();
			}
			if (similar.length > 0) {
				similar.after(dom);
			} else {
				domParent.append(dom);
			}

			if(metaName=="query") {
				$(".top-bar .suche").prepend(dom)
			}

			return self;
		};
		/**
		 The current value of the filter
		 
		 @private
		 @property value
		 @type {String | Object}
		 */
				value = null;

		this.and = function() {
		};

		/**
		 The method actually creating the HTML representation of the filter.

		 @method createDom
		 @param {String} [type] The HTML type to create. See the supported types in the class description
		 @private
		 @chainable
		 */
		this.createDom = function(type) {
			var d, html,
					type = type || htmlType;
			
			// date
			if (type == 'date') {
				d = { 'label':this.translate(metaName), 'value':'', 'type':'text', 'textType':true };
				d.id = domId;
				if (!searchFieldDefs[metaName]['exact']) {
					d.comparisons = [
						{ 'display': 'beforeThisDate', 'value': 'lt' },
						{ 'display': 'onThisDate', 'value': 'eq' },
						{ 'display': 'afterThisDate', 'value': 'gt' }
					];
				}
				html = template(d);
				dom = $(html);
				dom.find('#'+domId).css('width', 'auto').datepicker();
				self.addFilterToDom();
				return self;
			}

			// enum, select
			if (type == 'enum' || type == 'select') {
				var l = possibleValues;
				if (typeof possibleValues == 'object' && typeof possibleValues['func'] != 'undefined') {
					l = _B.executeCallback(l['callback']);
				}

				if (l.length == 0) {
					return false;
				}

				d = [];
				for(var i=0;i<l.length;i++) {
					if (typeof l[i] == 'object') {
						for(var j in l[i]) {
							if (!l[i].hasOwnProperty(j)) continue;

							d.push({ 'optgroupstart':true, 'label':j });
							for(var k=0;k<l[i][j].length;k++) {
								d.push({ 'value':l[i][j][k], label:l[i][j][k], 'option':true });
							}

							d.push({ 'optgroupend':true });							
						}
					} else {
						d.push({ 'value':l[i], label:l[i], 'option':true });
					}
				}
				d = { 'label':this.translate(metaName), 'options':d, 'selectType':true };
			}

			// number, text
			if (type == 'text' || type == 'number') {
				d = { 'label':this.translate(metaName), 'value':'', 'type':type, 'textType':true };
				
				if (type == 'number') {
					if (!searchFieldDefs[metaName]['exact']) {
						d.comparisons = [
							{ 'display': 'equalTo', 'value': 'eq' },
							{ 'display': 'lessThan', 'value': 'lt' },
							{ 'display': 'greaterThan', 'value': 'gt' },
						];
					}

					if (searchFieldDefs[metaName] && typeof searchFieldDefs[metaName]['min'] != 'undefined') {
						d.min = searchFieldDefs[metaName]['min'];
					}
				
					if (searchFieldDefs[metaName] && typeof searchFieldDefs[metaName]['max'] != 'undefined') {
						d.max = searchFieldDefs[metaName]['max'];
					}
				}
				
				if (searchFieldDefs[metaName] && searchFieldDefs[metaName]['pattern']) {
					d.pattern = searchFieldDefs[metaName]['pattern'];
				}
			}

			// object
			if (type == 'object') {
				var combinedInput = false;

				if (typeof searchFieldDefs[metaName]['combinedInput'] != 'undefined') {
					combinedInput = searchFieldDefs[metaName]['combinedInput'];
				}

				d = {
							'fields' : [],
							'title' : this.translate(metaName),
							'objectType': true,
						};

				if (combinedInput) {
					var newLabel = [];
					for(var key in possibleValues) {
						newLabel.push(this.translate(key));
					}
					newLabel = newLabel.join(' '+this.translate('or')+' ');
					d.fields = [{ 'label': newLabel, 'name':'combined' }];
				} else {
					for(var key in possibleValues) {
						d.fields.push({ 'label':this.translate(key), 'name':key });
					}
				}
			}

			// radio
			if (type == 'radio') {
				d = {	'label' : this.translate(metaName),
							'options' : [],
							'radioType': true,
						};
				for (var key in possibleValues) {
					d.options.push({ 'value' : possibleValues[key], 'label' : this.translate(key) });
				}
			}
			
			d.id = domId;
			html = template(d);
			dom = $(html);

			if (metaName == 'query') {
				dom.attr('id', 'queryterm-field');
			}

			self.addFilterToDom();

			if (autoCompleteConf) {
				dom.find('input')
					.autocomplete(autoCompleteConf)
					.on('focus.ph-plus', function() {
						$(this).autocomplete("search", "");
					});
			}
			return self;
		};
		
		/**
		 Method to remove the HTML of the filter from the DOM.

		 @chainable
		 @method destroyDom
		 @private
		 */
		this.destroyDom = function() {
			if (dom == null) { return self; }
			dom.remove();
			dom = null;
			return self;
		};

		/**
		 Method to display the HTML representation of the filter.

		 @method display
		 @chainable
		 */
		this.display = function() {
			dom.show();
			return self;
		};

		this.preventEnterSearchStart = function(e, ui)
		{
			// in case the menu is closed due to enter pressed turn off the keyup event for one time
			if ((e.charCode ? e.charCode : e.keyCode) == 13) {
				dontReactOnEnter = true;
			}
			return false;
		};

		/**
		 Method to set focus on the filter's input.

		 @method focus
		 @chainable
		 */
		this.focus = function() {
			switch (htmlType) {
				case 'date':
				case 'number':
				case 'object':
				case 'radio':
				case 'text':
					dom.find('input').eq(0).focus();
					break;
				case 'enum':
				case 'select':
					dom.find('select').focus();
					break;
			}
			return self;
		};

		this.getBooleanOperator = function() {
			if (dom.find('.boolean-ops')) {
				return dom.find('.boolean-ops').val();
			}
			return 'and';
		};
		
		/**
		 Method to get data from the dom object. Only working after the dom has been created!

		 @method getData
		 @return {Mixed} null on failure (no dom) or the data stored in the dom.
		 */
		this.getData = function() {
			if (dom == null) { return null; }
			return dom.data('sf-data');
		};

		/**
		 Method to get the ID of dom object.

		 @method getId
		 @return {String} the dom ID
		 */
		this.getId = function() {
			return domId;
		};

		/**
		 Method to get the metatag's name the filter is representing.

		 @method getMetaName
		 @return {String} The name of the tag represented by the filter UI.
		*/
		this.getMetaName = function() {
			return metaName;
		};

		/**
		 Method to retrieve the current value of the filter.

		 @method getValue
		 @return {Mixed} The value stored currently in the filter.
		 */
		this.getValue = function() {
			// date
			if (htmlType == 'date') {
				var v = dom.find('#'+domId).datepicker('getDate');
				if (dom.find('#'+domId+'-comparison')) {
					var compType = dom.find('#'+domId+'-comparison').val();
					if (compType == 'lt') { v = '..'+v; }
					if (compType == 'gt') { v = v+'..'; }
				}
				return v;
			}

			// enum or selects or text
			if (htmlType == 'enum' || htmlType == 'select' || htmlType == 'text' || htmlType == 'number') {
				var d = dom.find('#'+domId);
				var v = d.val();
				
				if (htmlType == 'number') {
					if (v == '-' || v.length == 0) {
						return v;
					}

					if (parseInt(v)+'' != v) {
						d.val('');
						return null;
					}
					v = parseInt(v);

					if (typeof searchFieldDefs[metaName]['min'] != null) {
						if (v < searchFieldDefs[metaName]['min']) {
							d.val('');
							return null;
						}
					}

					if (typeof searchFieldDefs[metaName]['max'] != null) {
						if (v > searchFieldDefs[metaName]['max']) {
							d.val('');
							return null;
						}
					}
				}

				if (htmlType == 'number' && dom.find('#'+domId+'-comparison')) {
					v = v+'';
					v = v.replace(/\,/g, '.');
					var compType = dom.find('#'+domId+'-comparison').val();
					if (compType == 'lt') { v = '..'+v; }
					if (compType == 'gt') { v = v+'..'; }
				}

				return v;
			}

			if (htmlType == 'object') {
				var combinedInput = false;
				var ret = {};

				if (typeof searchFieldDefs[metaName]['combinedInput'] != 'undefined') {
					combinedInput = searchFieldDefs[metaName]['combinedInput'];
				}

				if (combinedInput) {
					var v = dom.find('input').val();
					for(var key in possibleValues) {
						ret[key] = v;
					}
				} else {
					for(var key in possibleValues) {
						ret[key] = dom.find('#'+domId+'-'+key).val();
					}
				}
				return ret;
			}

			// radio
			if (htmlType == 'radio') {
				return dom.find("input:checked").val();
			}

		};
		
		/**
		 Method to hide the HTML representation of the filter.

		 @method hide
		 @chainable
		 */
		this.hide = function() {
			dom.hide();
			return self;
		};
		
		/**
		 Method to destroy the whole filter object.

		 @method remove
		 @chainable
		 */
		this.remove = function() {
			this.destroyDom();
			return self;
		};

		/**
		 Method setting data on the dom object. Only working after the dom has been created!

		 @chainable
		 @method setData
		 @param {Mixed} newData the data to store
		 @return {Mixed} null on failure (no dom) or the object
		 */
		this.setData = function(newData) {
			if (dom == null) { return null; }
			dom.data('sf-data', newData);
			return self;
		};

		/**
		 Method called when filter is first initiated.
		 Sets up the config for HTML, the DOM id, etc.

		 @chainable
		 @method setup
		 @param {String} name Name of the META Tag to represent
		 @param {Mixed} [v] Value of the META Tag
		 @private
		 */
		this.setup = function(name, v) {
			metaName = name;
			multipleValues = false;
			possibleValues = null;

			if (name == 'query') {
				var typeDef = new String();
			} else {
				var typeDef = searchFieldDefs[metaName];
			}
			var ht = (typeDef instanceof String || typeof typeDef == 'string') ? 'text' : null;
			var mt = ht;
			
			if (typeDef instanceof Boolean) {
				mt = mt || 'boolean';
				ht = ht || 'radio';
				possibleValues = { 'yes': 1, 'no':0, };
			}

			if (typeDef instanceof Number || typeof typeDef == 'number') {
				mt = mt || 'number';
				ht = ht || 'number';
			}

			if (typeDef instanceof Date) {
				mt = mt || 'date';
				ht = ht || 'date';
			}

			if (mt == null && typeof typeDef == 'object') {
				mt = 'object';
				ht = 'object'
			}

			if (mt == 'object') {
				if (typeof typeDef['autoComplete'] != 'undefined') {
					autoCompleteConf = typeDef['autoComplete'];
					autoComleteDefaults.close = self.preventEnterSearchStart;
					autoCompleteConf = $.extend({}, autoComleteDefaults, autoCompleteConf);
				}

				if (typeof typeDef['type'] != 'undefined') {
					mt = typeDef['type'].toLowerCase();
					if (mt == 'boolean') { ht = 'radio'; }
					else { ht = mt; }					
				}

				if (typeof typeDef['multiple'] != 'undefined') {
					multipleValues = (mt != 'boolean') ? typeDef['multiple'] : false;
				}

				if (typeof typeDef['template'] != 'undefined') {
					possibleValues = $.extend(true, {}, typeDef['template']);
					if (typeDef['template'] instanceof Array) {
						possibleValues = typeDef['template'].slice();
					}
				} else {
					possibleValues = $.extend(true, {}, typeDef);
				}
			}

			htmlType = ht;

			domId = domParent.data('next-child-id');
			
			if (typeof domId == 'undefined') {
				domId = 0;
			} else {
				domId = parseInt(domId);
			}
			
			domParent.data('next-child-id', domId+1);
			domId = idPrefix+domId;
			
			this.createDom()
					.setValue(v);
			
			// special treatement for q
			if (name == 'query') {
				dom.find('.remove-filter').remove();
			}

			var htmlTag = (htmlType == 'enum' || htmlType == 'select') ? 'select' : 'input';

			dom.find(htmlTag).on('focus.ph-plus', this.startInputManagement)
											 .on('blur.ph-plus', this.stopInputManagement);

			dom.find("a.remove-filter").on('click.ph-plus', function() {
				$(self).trigger('delete');
				return false;
			});

			return self;
		};

		/**
		 Method to set the value of the filter. Updates the input in the created DOM.

		 @method setValue
		 @param {Mixed} [v] Value of the META Tag
		 @chainable
		 */
		this.setValue = function(v) {
			// date
			if (htmlType == 'date') {
				dom.find('#'+domId).datepicker('setDate', new Date(v));
				return self;
			}

			// enum or selects
			if (htmlType == 'enum' || htmlType == 'select') {
				dom.find("#"+domId).val(v);
				return self;
			}

			// object
			if (htmlType == 'object') {
				var combinedInput = false;

				if (typeof searchFieldDefs[metaName]['combinedInput'] != 'undefined') {
					combinedInput = searchFieldDefs[metaName]['combinedInput'];
				}

				if (!combinedInput && typeof v == 'object') {
					for(var key in v) {
						dom.find('#'+domId+'-'+key).val(v[key]);
					}
				} else {
					dom.find('input').val(v);
				}
				return self;
			}

			// radio or text
			if (htmlType == 'radio' || htmlType == 'text') {
				if (htmlType == 'radio' && !(v instanceof Array)) {
					v = [v];
				}
				dom.find("input").val(v);
				return self;
			}
		};

		/**
		 Eventhandler called when the input receives focus.
		 Enables the keyboard event handler to check the states cleared, filled, enter, escape.

		 @method startInputManagement
		 @param {Object} e The event object delivered by the event handler.
		 @private
		 */
		this.startInputManagement = function(e)
		{
			var triggerEvent = 'keyup';
			
			if (htmlType == 'enum' || htmlType == 'select' || htmlType == 'date') {
				triggerEvent = 'change';
			}
			if (htmlType == 'text' && autoCompleteConf) {
				triggerEvent = 'autocompleteclose';
			}

			$(this).on(triggerEvent+'.ph-plus', function(e) {

				var v = $.trim(self.getValue());
				var oldFlag = filled;

				filled = (v != null && v.length > 0);
				if (htmlType == 'object') {
					filled = [];
					for(var key in v) {
						filled.push($.trim(v[key]));
					}
					filled = (filled.join().length > 0);
				}

				if (filled != oldFlag) {
					if (filled) {
						$(self).trigger('filled');
					} else {
						$(self).trigger('cleared');
					}
				}

				if (e.keyCode == 13) {
					if (dontReactOnEnter) {
						dontReactOnEnter = false;
						return false;
					}

					if (self.getValue() == null) {
						return false;
					}

					// filtering selection enter on autocomplete fields
					$(self).trigger('enter');
				}
				if (e.keyCode == 27) {
					$(self).trigger('escape');
					$(this).blur();
				}
				return true;
			});
		};

		/**
		 Eventhandler called when the input looses focus.
		 Disables the keyboard event handler to check the states cleared, filled, enter, escape.

		 @method stopInputManagement
		 @param {Object} e The event object delivered by the event handler.
		 @private
		 */
		this.stopInputManagement = function(e) {
			$(this).off('keyup.ph-plus');
			return true;
		};

		/**
		 Method to translate the META Tag names into descriptive names.
		 Uses the translation library in  nls depending on the language indicated by the browser.

		 @method translate
		 @param {String} name Name of the META Tag to translate.
		 @private
		 @return {String} the translation, if existing.
		 */
		this.translate = function(term) {
			if (typeof _T[term] != 'undefined') {
				return _T[term];
			} 
			return term;
		};

    _H.registerHelper('translate', self.translate);
    template = _H.compile(_tempRaw);

		if (typeof dP != "undefined") {
			idPrefix = domParent.attr('id')+idPrefix;

			if (typeof field != "undefined") {
				this.setup(field, val);
			}
		}
	};

	return searchFilter;
});