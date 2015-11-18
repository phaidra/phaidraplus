/**
 * @module resources
 * @submodule basics
 */
define(['jquery', 'spin', 'timeago'], function ($, _S, time) {
	
	/**
	 A collection of helper functions.

	 @class basics
	 @static
	 @final
	 */
	var delayed = {};
	return basics = {
		/**
		 * Method to execute a callback.
		 *
		 * @method executeCallback
		 * @param {Object} Callback Definition of the callback: { 'func': (function), 'scope': (targetScope), 'data': (data for the function*) }
		 * @param {Object} DataBefore Additional data to prepend to the data defined in def
		 * @param {Object} DataAfter Additional data to append to the data defined in def
		 * @return {mixed} Value returned by the called function
		 */
		'executeCallback' : function (def, addDataBefore, addDataAfter)
		{
			var f, s, d = null;
			d = [];
			
			if (typeof def['func'] == 'undefined') {
				return false;
			}
			
			f = def['func'];
			if (typeof def['scope'] != 'undefined') {
				s = def['scope'];
			}
			
			if (typeof def['data'] != 'undefined') {
				d = def['data'];
			}

			if (addDataBefore instanceof Array) {
				d = addDataBefore.concat(d);
			}
			
			if (addDataAfter instanceof Array) {
				d = d.concat(addDataAfter);
			}
			
			return f.apply(s, d);
		},

		'delay':function(func,element,time) {
			var el = element;
			if(delayed[el]) {
				clearTimeout(delayed[el])
			}
			delayed[el] = setTimeout(function(){
				if(el) {
					func(el);
				} 
				clearTimeout(delayed[el]);
				delayed[el] = null;
			},time)
		},

		'noDelay':function(element) {
			clearTimeout(delayed[element]);
			delayed[element] = null;
		},

		/**
		 * Method to extract the query parameters from the current website url query part
		 *
		 * @method queryStringToJSON
		 * @return {json} An object where properties are named according to the query parameter names and receiving the values defined in the query.
		 */
		'queryStringToJSON' : function ()
		{            
	    var pairs = location.search.slice(1).split('&');
	    
	    var result = {};
	    pairs.forEach(function(pair) {
        pair = pair.split('=');
        result[pair[0]] = decodeURIComponent(pair[1] || '');
	    });

	    return JSON.parse(JSON.stringify(result));
		},

		/**
		 * Method to check whether a jQuery has a certain event registered or not. Event namespaces are supported
		 *
		 * @method hasEvent
		 * @param {Object} jQueryObject The Object to check
		 * @param {String} EventName The event which should be checked for
		 * @return {Boolean}
		 */
		'hasEvent': function(jObj, ev)
		{
			ev = ev.split('.');
			var regEvents = jQuery.data(jObj[0], 'events');

			if (regEvents[ev[0]] == undefined) {
				return false;
			}

			if (ev.length == 1) {
				return true;
			}

			for (var i = regEvents[ev[0]].length - 1; i >= 0; i--) {
				if (regEvents[ev[0]][i].namespace == ev[1]) {
					return true;
				}
			};
			return false;
		},

		/**
		 * Method creates a spinner over the specified object. Uses the external/spin.js library.
		 * Attaches a function under 'ph-plus-removeLoader' which can remove the spinner from the object.
		 * If a spinner has already been attached, the spinner is cleared from the object and the object returned.
		 *
		 * @method makeLoading
		 * @param {Object} jQueryObject The target jQuery object where to apply the spinner to.
		 * @return {Object} the manipulated target object
		 */
		'makeLoading' : function(target)
		{
			if (typeof target.data('ph-plus-removeLoader') == 'function') {
				return target;
			}
			
			var spinner = new _S().spin();
			target.append(spinner.el);
			target.data('ph-plus-removeLoader', function() {
				spinner.stop();
				delete spinner;
				target.data('ph-plus-removeLoader', null);
			});
			return target;
		},

		/**
		 * Method to remove the loading spinner from the specified object.
		 * Looks for a function under 'ph-plus-removeLoader' and executes it.
		 *
		 * @method removeLoading
		 * @param {Object} jQueryObject The target jQuery object where to apply the spinner to.
		 * @return {Object} the manipulated target object
		 */
		'removeLoading' : function(target)
		{
			var l = target.data('ph-plus-removeLoader');
			if (typeof l == 'function') { l.apply(); }
			return target;
		},

		/**
		 * Method to turn a string into a camelCased string.
		 * For instance 'ph-plus-removeLoader' gets converted to 'phPlusRemoveLoader'.
		 *
		 * @method toCamel
		 * @param {String} String The string to convert
		 * @return {String}
		 */
		'toCamel' : function(str)
		{
			return str.replace(/(\-[a-z])/g, function($1) { return $1.toUpperCase().replace('-',''); });
		},

		/**
		 * Bridging function for the jquery.timeago plugin (external/jquery.timeago.js)
		 * A plugin that makes it easy to support automatically updating fuzzy timestamps (e.g. "4 minutes ago" or "about 1 day ago").
		 * http://plugins.jquery.com/timeago/
		 *
		 * @method timeago
		 * @param {Datetime} Datetime The datetime to convert into a relative time phrase
		 * @return {String}
		 */
		'timeago': function(datetime)
		{	
			return $.timeago(datetime);
		},

		/**
		 * base64 Helper for IE9
		 *
		 * @method btoa
		 * @param {String} String The string to encode
		 * @return {String}
		 */
		btoa : function (input) {
		    var str = String(input);
  			var chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=';
		    for (
		      // initialize result and counter
		      var block, charCode, idx = 0, map = chars, output = '';
		      // if the next str index does not exist:
		      //   change the mapping table to "="
		      //   check if d has no fractional digits
		      str.charAt(idx | 0) || (map = '=', idx % 1);
		      // "8 - idx % 1 * 8" generates the sequence 2, 4, 6, 8
		      output += map.charAt(63 & block >> 8 - idx % 1 * 8)
		    ) {
		      charCode = str.charCodeAt(idx += 3/4);
		      // if (charCode > 0xFF) {
		      //   throw new InvalidCharacterError("'btoa' failed: The string to be encoded contains characters outside of the Latin1 range.");
		      // }
		      block = block << 8 | charCode;
		    }
		    return output;
		  }


	};
});