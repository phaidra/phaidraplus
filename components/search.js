/**
 This is a class used as a single instance in the phaidra+ app.
 It creates a search dropdown which includes all UI to configure a search request.
 If any useful search query can be created, the search is executed by triggering **search.ph-plus** event.
 On all other occassions, an error is displayed.

 ### Todo's

 - update search UI depending on search results

 @module search
 @class search
 */
/**
 @event window:error.ph-plus
 @param {String} msg The message to display
 */
/**
 @event window:search.ph-plus
 @param {Array} data An array of search parameter which are a key:value pair object.
 @param {Callback} cb The callback to execute, when the search has been finished.
 */
define(['require', 'jquery', 'components/basics', 'components/search-filter', 'config/searchfields', 'i18n!nls/texts'],
			 function(require, $, _basics, sfClass, searchFieldDefs, _T) {


	/**
	 @constructor
	 */
	var search = function() {

		var currentSearchPage = 0,
		/**
		 The own dom object.

		 @private
		 @property dom
		 @type {Object}
		 */
				dom = null,

		/**
		 The dom object containing the search filters.

		 @private
		 @property filterCanvas
		 @type {Object}
		 */
				filterCanvas = null,

		/**
		 An array containing all [search filters](searchFilter.html).

		 @private
		 @property filters
		 @type {Array}
		 */
				filters = [],

		/**
		 A container object having all private functions.

		 @private
		 @property _p
		 @type {Object}
		 */
				_p = {},

		/**
		 Flag indicating whether there is enough input to start a search or not.

		 @private
		 @property searchable
		 @type {Boolean}
		 */
				searchable = false,
				searchPageSize = 100,
		/**
		 Array containing the search setup if available.

		 @private
		 @type {Array}
		 */
				searchSetup = null,

		/**
		 A copy of this for convienence and to help readability (especially in event handlers).

		 @private
		 @property self
		 @type {Object}
		 */
				self = this,
				totalResultPages = 0;
		
		/**
		 Private event handler executed to add a new search filter to the UI.

		 @chainable
		 @method addFilter
		 @private
		 @return {Object} the private functions container **_p**.
		 */

		_p.addFilter = function(which) {
			var nF = new sfClass(filterCanvas, which, null);

			$(nF).on('enter', function() {
				_p.focusNextFilter(nF);
			}).on('delete', function() {
				_p.removeFilter(nF);
			}).on('filled cleared', function() {
				_p.checkFilter();
			});

			filters.push(nF);
			_p.updateFilterClasses();
			return _p;
		};

		/**
		 Method called by the [search filters](searchFilter.html) to check if current input qualifies for search query.

		 @method checkFilter
		 @private
		 */
		_p.checkFilter = function() {
			var t = '';
			for (var i = 0; i < filters.length; i++) {
				t = t+filters[i].getValue();
			};
			
			_p.searchable(t.length > 0);
		};

		/**
		 Method called by the [search filters](searchFilter.html) when enter is hit on the input.

		 @method focusNextFilter
		 @private
		 */
		_p.focusNextFilter = function(obj) {
			var index = 0;
			for (var i = 0; i < filters.length; i++) {
				if (filters[i].getId() == obj.getId()) {
					index = i;
					i = filters.length;
				}
			}

			if (index+1 >= filters.length) {
				$(obj).blur();
				_p.startSearch();
				return;
			}

			$(filters[index+1]).focus();
		};

		/**
		 Method called by the [search filters](searchFilter.html) when the filter is deleted.

		 @chainable
		 @method removeFilter
		 @private
		 */
		_p.removeFilter = function(obj)
		{
			if (obj.getMetaName() == 'query') {
				return _p;
			}
			
			obj.remove();
			var f = [];
			for (var i = 0; i < filters.length; i++) {
				if (filters[i].getId() != obj.getId()) {
					f.push(filters[i]);
				}
			}
			filters = f;
			_p.updateFilterClasses();
			_p.checkFilter();
			return _p;
		};

		/**
		 Method to controll the UI depending on the possibility to search or not.

		 @method searchable
		 @private
		 @return {Object} the private methods container
		 */
		_p.searchable = function(enable) {
			searchable = enable;
			
			var btn = dom.find('button');
			if (searchable) {
				btn.removeClass('disabled');
			} else {
				btn.addClass('disabled');
			}
			return _p;
		};


		/**
		 Method to enable the search

		 @method enableSearch
		 @private
		 @return {Object} the private methods container
		 */
		_p.enableSearch = function() {
			_p.searchable(true);
		};


		/**
		 Method to reset the UI.

		 @method resetSearch
		 @private
		 @return nothing
		 */
		_p.resetSearch = function() {
			for(var i=0; i<filters.length;i++) {
				_p.removeFilter(filters[i]);
			}
		};


		/**
		 Method to start the search. If not enough input is avaible an error is thrown.
		 Otherwise the search event is fired together with the search data.

		 @method startSearch
		 @private
		 @return {Object} the private methods container
		 */
		_p.startSearch = function(reset)
		{
			if (typeof reset == 'undefined') {
				reset = true;
				currentSearchPage = 0;
			}

			if (!searchable) {
				$(window).trigger('error.ph-plus', ['No search parameters entered!']);
				return false;
			}

			var d = [];
			var toRemove = [];
			for(var i=0; i<filters.length;i++) {
				var n = filters[i].getMetaName();
				var o = {};
				var v = o[n] = filters[i].getValue();
				o['boolean'] = filters[i].getBooleanOperator();

				if (v == null || v == '' || v == '..' || (typeof v == 'string' && v.length == 0)) {
					toRemove.push(filters[i]);
				} else {
					d.push(o);
				}
			}

			if (toRemove.length > 0) {
				for(var i in toRemove) {
					_p.removeFilter(toRemove[i]);
				}
			}
			
			if (d.length == 0) { return _p; }

			searchSetup = d;

			$("#search-dropdown-container").removeClass("open");	
			if (reset) {
				self.clearSearchUI();
			} else {
				$('nav.top-bar').find('.search-previouspage, .search-nextpage').hide();				
				resourceMan.getResource('gsaData').dontClearAll();
			}

			$(window).trigger('search', [d, currentSearchPage, searchPageSize]);
			return _p;
		};

		_p.searchNext = function()
		{
			var n = currentSearchPage+1;
			if (n > totalResultPages) {
				n = totalResultPages;
			}

			if (n != currentSearchPage) {
				currentSearchPage = n;
				_p.startSearch(false);
			}
			return false;
		};

		_p.searchPrevious = function()
		{
			var n = currentSearchPage-1;
			if (n < 0) {
				n = 0;
			}

			if (n != currentSearchPage) {
				currentSearchPage = n;
				_p.startSearch(false);
			}

			return false;
		};

		/**
		 Method to translate the META Tag names into descriptive names.
		 Uses the translation library in  nls depending on the language indicated by the browser.

		 @method translate
		 @param {String} name Name of the META Tag to translate.
		 @private
		 @return {String} the translation, if existing.
		 */
		_p.translate = function(term) {
			if (typeof _T[term] != 'undefined') {
				return _T[term];
			} else {
				return term;
			}
		};

		_p.updatePaginationButtons = function()
		{
			var m = $('#search-info');

			var n = m.find('.search-nextpage a');
			var p = m.find('.search-previouspage a');
			

			if (currentSearchPage == 0) {
				p.addClass('disabled');
			} else {
				p.removeClass('disabled');
				m.show();
			}

			if (currentSearchPage >= totalResultPages-1) {
				n.addClass('disabled');
			} else {
				n.removeClass('disabled');
				m.show();
			}

		};

		_p.updateSearch = function(newData, results, currentPage, pageSize) {
			currentSearchPage = currentPage;
			searchPageSize = pageSize;
			results = (parseInt(results) > 1000) ? 1000 : parseInt(results);
			totalResultPages = Math.ceil(results/pageSize);

			var str = [];

			if (searchSetup) {
				for (var i = 0; i < searchSetup.length; i++) {
					if ('query' in searchSetup[i]) {
						str.push(_p.translate('results-for')+' "'+searchSetup[i].query+'"');
						continue;
					}

					var fieldKey, fieldValue, fieldBool = null;
					for (var key in searchSetup[i]) {
						switch (key) {
							case 'boolean':
								fieldBool = searchSetup[i][key];
								break;
							default:
								fieldKey = key;
								fieldValue = searchSetup[i][key];
								break;
						}
					}
					if(fieldBool) {
						str.push(_p.translate('boolean'+fieldBool.capitalize()));
					}
					str.push(_p.translate(fieldKey)+':"'+fieldValue+'"');
				};
			} else {

				// trying to extract search params from url
				var querySetup = _basics.queryStringToJSON();
				currentSearchPage = (typeof querySetup['start'] != 'undefined') ? parseInt(querySetup['start']) : 0;
				searchPageSize = (typeof querySetup['num'] != 'undefined') ? parseInt(querySetup['num']) : 50;
				filters[0].setValue((typeof querySetup['query'] != 'undefined') ? querySetup['query'] : '');
				totalResultPages = Math.ceil(results/searchPageSize);
				searchable = (filters[0].getValue().length > 0);

				str.push('Geteilte Suche');
			}

			var spc = $('#search-params');
			var pic = $('#pagination-info');

			if (spc.length == 0) {
				spc = $('<li id="search-params">');
				$('nav.top-bar .search-previouspage').before(spc);
	
				if (!_standalone) {
					spc.on('click.ph-plus', function(e) {
						$('nav.top-bar .icon-search').trigger('click');
						return false;
					});
				}
			}

			if (pic.length == 0) {
				pic = $('<li id="pagination-info">');
				spc.after(pic);
				
				if (!_standalone) {
					pic.on('click.ph-plus', function(e) {
						$('nav.top-bar .icon-search').trigger('click');
						return false;
					});
				}
			}

			spc
				.attr("title",str.join(' '))
				.addClass('open');
			
			var t_ofpages = Math.min(results,(currentPage+1)*searchPageSize)
			var t_page = ((currentPage)*searchPageSize);
			pic.find(".suffix").text(pic.find(".suffix").attr("data-title"));
			if(!t_ofpages) {
				pic
				.attr("title",_p.translate("no-results"))
				.attr("data-tooltip","")
				.show()
				.find(".num").text("0");
				$('#search-info').show();
				
				$('.search-previouspage, .search-nextpage').hide();
				var alert = $("<div>");
				alert.addClass("panel alert");
				alert.append("<p>"+_p.translate("no-results")+"</p>");
				$("#mainsection").append(alert)
				return;
			} else {
				t_page +=1
			}
			pic
				.attr("title",str.join(' '))
				.attr("data-tooltip","")
				.show()
				.find(".num").text(t_page+"-"+t_ofpages + '/'+results);
				
			pic.foundation();
			$('#search-info').show();
			$('.search-previouspage, .search-nextpage').show();
			//$('.pagination').show();

			_p.updatePaginationButtons();
		};

		_p.updateFilterClasses = function() {
			var currentType = '';
			var filterDoms = dom.find('.sf');
			for(var i=0;i<filterDoms.length;i++) {
				if (currentType == filterDoms.eq(i).attr('class')) {
					filterDoms.eq(i).addClass('or');
				} else {
					currentType = filterDoms.eq(i).attr('class');
					filterDoms.eq(i).removeClass('or');
				}
			}
			return _p;
		};

		this.clearSearchUI = function()
		{
			//$('#search-info').find('.search-previouspage, .search-nextpage').hide();
			$('#search-info').hide();
			currentSearchPage = 0;
			$('#search-params').removeClass('open');
			//$('#pagination-info').hide();
		};

		this.create = function() {
			// creating dom Base from template
			dom = $('#search-dropdown-container');
			dom.find(".close-dropdown").off("click touchend")
			dom.find(".close-dropdown").on("click touchend",function(e){
				$(this).closest(".f-dropdown").removeClass("open")
				return false;
			})
			dom.removeClass('template');

			filterCanvas = dom.find('#filter-canvas');

			// creating default search field
			_p.addFilter('query');

			// creating select for new search filters
			var label = $('<label class="inline">');
			label.prop('for', 'searchfield-select');
			label.text(_p.translate('search-select-label'));

			var sel = $('<select>');
			sel.prop('id', 'searchfield-select');
			sel.append($('<option value="">'+_p.translate('please-select')+'</option>'));
			for (var key in searchFieldDefs) {
				var option = $('<option>');
				option
					.prop('value', key)
					.text(_p.translate(key));
				sel.append(option);
			}

			// adding event listener to select
			sel.on('change.ph-plus', function() {
				_p.addFilter($(this).val());
				$(this).val('');
			});

			// adding start button + enter event
			var btn = $('<button>');
			btn.prop({ 'id': 'start-search-button', 'type': 'button' })
			   .text(_p.translate('start-search'))
			   .addClass('disabled right')
			   .on('click.ph-plus', _p.startSearch);
			dom.find('#search-canvas')
				 .append(label, sel, btn)
				 .append($('<div class="clearer">'));			
		};

		resourceMan.register('searchFinished', 'searchUI', { 'open': { 'func':_p.updateSearch, 'scope':self }, 'deps': ["components/search"] });
		$(window).on('clearSearchUI.ph-plus', self.clearSearchUI);
		$(window).on('resetSearchUI.ph-plus', _p.resetSearch);
		$(window).on('enableSearchUI.ph-plus', _p.enableSearch);
		$(window).on('searchPreviousPage.ph-plus', _p.searchPrevious);
		$(window).on('searchNextPage.ph-plus', _p.searchNext);

	};

	return search;
});