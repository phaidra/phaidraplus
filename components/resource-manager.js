/**
 * @module resources
 */
define(['require', 'jquery'], function(require, $) {

	/**
	 * Register global sitewide events and handlers with the resourceManager.
	 *
	 * @class resourceManager
	 * @constructor
	 */
	var resourceManager = function () {
		var stopped = false;
		/**
		 * Property holding the current active state of the resource manager, i.e. the event which has been fired last.
		 *
		 * @property currentState
		 * @type {String}
		 * @default null
		 */
		this.currentState = null;
		/**
		 * A default configuration object. All provided configuration objects get extended by this to get the appropriate default values.
		 *
			{
				'close': { 'func': function() {}, 'scope': null, 'data': null },
				'deps': null,
				'open': { 'func': function() {}, 'scope': null, 'data': null },
			}
		 *
		 * Alternatively func and scope can be a string.
		 *
		 * - If func is a string and scope is null, a global function is assumed and called.
		 * - If scope is a string, then an object of that class is created and func is called as a method of that object.
		 *
		 * @property defaultConf
		 * @type {Object}
		 */
	  this.defaultConf = { 'close': { 'func': function() {}, 'scope': null, 'data': null },
											 		'deps': null,
											 		'open': { 'func': function() {}, 'scope': null, 'data': null },
										 	 };
	  /**
	   * Property containing the list of last states. Used for reverting back to the old state by .back()
	   * 
	   * @property oldStates
	   * @type {Array}
	   */
	  this.oldStates = [];
	  /**
	   * An array containing all registered events and the connected handlers
	   *
	   * @property states
	   * @type {Array}
	   * @default Array()
	   */
		this.states = [];
	  /**
	   * An array containing all registered resources.
	   *
	   * @property resources
	   * @type {Array}
	   * @default Array()
	   */
		this.resources = [];
		/**
		 * Backreference
		 * 
		 * @property self
		 * @private
		 * @type {Object}
		 */
		var self = this;
		/**
		 * Method to enable further state switching. I.e. if a switch gets requested, these will get processed.
		 *
		 * @chainable
		 * @method continue
		 */
		this.continue = function()
		{
			stopped = false;
			return self;
		};
		/**
		 * Method to camelcase a str
		 *
		 * @method createClassName
		 * @param {String} str the String to transform
		 * @return {String} the camelcased String
		 */
		this.createClassName = function(str)
		{
			str = str.replace(/\//g, '_');
			return str.replace(/(\-[a-z])/g, function($1) { return $1.toUpperCase().replace('-',''); });
		};
		/**
		 * Method to switch to a new [state] or close an old one depending on [dir]. Additional data might be appended to the calls.
		 *
		 * @method doState
		 * chainable
		 * @param {String} state the state to open/close
		 * @param {Enum} dir the direction to go (open|close)
		 * @param {Object} addData the data to append
		 */
		this.doState = function(state, dir, addData)
		{
			if (state == null) {
				return;
			}

			for(var i=0; i<this.states[state].length; i++) {

				if (typeof this.states[state][i][dir] == 'undefined') {
					continue;
				}

				var c = this.states[state][i][dir],
						sc = c.scope,
						f = c.func,
						d = c.data || [];

				if (typeof addData != 'undefined') {
					d = d.concat(addData);
				}

				// because in a loop, we have to create an object with its own scope at runtime to contain the correct variable values
				var callback = (function(data, func, scope, dependencies) {
					return function () {
						var cl = {};
						for(var j=0; j<arguments.length; j++) {
							var name = self.createClassName(dependencies[j].toString());
							cl[name] = arguments[j];
						}
						requireCallback(data, func, scope, cl);
					};
				})(d, f, sc, this.states[state][i].deps);

				if (this.states[state][i].deps && this.states[state][i].deps.length > 0) {
					require(this.states[state][i].deps, callback);
				} else {
					require(callback);
				}
			}
		};
		/**
		 * Method to retrieve a set resource by name
		 *
		 * @param {String} name the name of the resource to retrieve
		 * @return {Mixed} the resource if set
		 */
		this.getResource = function(name)
		{
			return this.resources[name];
		};
		/**
		 * Method to pause execution of state switches
		 *
		 * @method pause
		 * @chainable
		 */
		this.pause = function()
		{
			stopped = true;
			return self;
		};
		/**
		 * Method to register a global event and the corresponding handler.
		 * You can add multiple handlers to the same event by altering the name.
		 * The handler configuration will be expanded by the default configuration object of the resource manager.
		 *
		 * @chainable
		 * @method register
		 * @param {String} state the sitewide event to listen to
		 * @param {String} name a name for this specific handler
		 * @param {Object} conf a configuration object following {{#crossLink "resourceManager/currentState:attribute"}}{{/crossLink}}
		 */
		this.register = function (state, name, conf)
		{
			var c = $.extend(true, {}, self.defaultConf);
			c.name = name;

			if (typeof conf.deps != "undefined") {
				c.deps = conf.deps;
			} else {
				delete c.deps;
			}

			if (typeof conf.open != "undefined") {
				c.open = conf.open;
			} else {
				delete c.open
			}

			if (typeof conf.close != "undefined") {
				c.close = conf.close;
			} else {
				delete c.close;
			}

			if (!(state in self.states)) {
				self.states[state] = [];
				$(window).on(state+'.ph-plus', function(e) {
					if (stopped) { return; }
					var d = [];
					for(var i=1; i<arguments.length; i++) { d.push(arguments[i]); }
					self.switch(state, d);
				});
			}

			self.states[state].push(c);
			return self;
		};
		/**
		 * Method to remove an event handler from the handler stack {{#crossLink "resourceManager/states:attribute"}}{{/crossLink}}.
		 *
		 * @chainable
		 * @method remove
		 * @param {String} state the sitewide event to listen to
		 * @param {String} name a name for this specific handler
		 */
		this.remove = function (state, name)
		{
			var index = null,
					i = 0;
			while (index === null && i < this.states[state].length) {
				if (this.states[state][i].name == name) {
					index = i;
				}
				i++;
			}
			this.states[state].splice(index, 1);
			
			if (this.states[state].length == 0) {
				$(window).off(state+'.ph-plus');
				delete this.states[state];
			}
			return this;
		};
		/**
		 * function checking what to call or create for the current state.
		 * The logic is as follows (refering to the object in states.js - property open or close):
		 * 
		 * 'scope' : {String | Object | undefined}
		 * 'func' : {String | Function | undefined}
		 * 
		 * - if neither scope nor function is defined: return;
		 * - if only a scope is defined: create an object of class scope and return it;
		 * - if only a function is defined: execute the function;
		 * - if a scope and a function is defined: create an object and execute the method on the object;
		 *
		 * @method requireCallback
		 * @param {Object} data Parameters for the function/method call
		 * @param {String|Function} func The function/method to execute
		 * @param {String|Object} scope The scope/classname of the method to execute or the class to create
		 * @param {Object} [dependency] a dependecy object containing the class to create
		 */
		var requireCallback = function(d, f, sc, deps)
		{
			if (!f && !sc) {
				return;
			}

			if (typeof sc == "string") {
				sc = eval("new deps."+sc+"()");
			}

			if (sc) {
				if (typeof f == "undefined") {
					return sc;
				}

				if (typeof f == "string") {
					f = sc[f];
				}
			} else {
				sc = null;
				if (typeof f == "string") {
					f = eval(f);
				}				
			}
			f.apply(sc, d);
		};
		/**
		 * Method to set new config settings on a specific state (or wildcard '*') and name in the states array.
		 * Useful to set the instance of an object or similar circumstances when the scope object or function is
		 * not available at startup.
		 * 
		 * @chainable
		 * @method setConfig
		 * @param {String} state the sitewide event to listen to
		 * @param {String} name a name for this specific handler
		 * @param {Object} conf a configuration object following {{#crossLink "resourceManager/currentState:defaultConf"}}{{/crossLink}}
		 * @return {Object} the resource manager itself
		 */
		this.setConfig = function(state, name, conf)
		{
			// wildcard replacements
			if (state == '*') {
				for(var s in self.states) {
					if (self.states.hasOwnProperty(s)) {
						for (var i=0; i<self.states[s].length; i++) {
							if (self.states[s][i].name == name) {
								self.setConfig(s, name, conf);
							}
						}
					}
				}
				return self;
			}
			
			if (typeof self.states[state] == 'undefined') {
				self.register(state, name, conf);
				return self;
			}
			
			var index = null,
					i = 0;
			while (index === null && i < this.states[state].length) {
				if (self.states[state][i].name == name) {
					index = i;
				}
				i++;
			}

			if (index === null) {
				self.register(state, name, conf);
				return this;
			}

			conf.name = name;
			self.states[state][index] = $.extend(true, {}, self.states[state][index], conf);
			return self;
		};
		/**
		 * Method to add a resource to the resourceManager.
		 *
		 * @method setResource
		 * @param {String} name The name of the new resource / resource to overwrite.
		 * @param {Mixed} data The resource(data)
		 * @chainable
		 */
		this.setResource = function(name, data)
		{
			this.resources[name] = data;
			return self;
		};
		/**
		 * Generic event handler called on all global events registered.
		 * The handler calls all __close handlers__ of the current state,
		 * then changes the {{#crossLink "resourceManager/currentState:property"}}{{/crossLink}} property to the new state
		 * and now calls all open handlers for the new state.
		 * Dependencies are loaded using requirejs methods.
		 *  
		 * @method switch
		 * @private
		 * @param {String} newState The new state to switch to
		 * @param {Array} [addData] Additional Data provided by the event handler
		 * @return {Boolean} returns true of newState was not found. false if state switching was successfully started.
		 */
		this.switch = function(newState, addData)
		{
			var back = false;

			if (!(newState in self.states)) {
				return true;
			}
			
			if (self.states[newState].length == 0) {
				return true;
			}

			// closing current state
			if (!(addData instanceof Array)) {
				addData = [];
			}

			self.doState(self.currentState, 'close', [newState]);

			if (newState == 'back' && self.oldStates.length > 0) {
				newState = self.oldStates.pop();
				back = true;
			}

			if (self.currentState != null && !back) {
				self.oldStates.push(self.currentState);
			}
			
			self.currentState = newState;
			self.doState(self.currentState, 'open', addData);

			return false;
		};
	};

	return resourceManager;
});