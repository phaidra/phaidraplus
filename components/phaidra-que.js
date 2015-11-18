	/*
 * @module resources
 */
define(['jquery', 'components/basics','jquery.cookie'],
				function($, _B) {

	/**
	 * The phaidra que eases the communication with the phaidra API.
	 * It provides registering queries on a que and execution one after the other.
	 * Callbacks are executed then each query is successfully finished.
	 * 
	 * @class phaidraQue
	 * @constructor
	 */
	/**
	 * Event called when the connection times out.
	 * 
	 * @event phaidraQue:connection-timeout
	 */
	var phaidraQue = function()
	{
		/**
		 * connection timer.
		 * 
		 * @property connectionTimer
		 * @private
		 * @type Integer
		 */
		var connectionTimer = null;
		/**
		 * The user credentials to use with the phaidra endpoint.
		 *
		 *     { 'username': 'XXX', 'password': 'XXX', 'realname': 'XXX' }
		 * 
		 * @property credentials
		 * @private
		 * @type Object
		 */
		var credentials = null;
		/**
		 * The currently run que item. The que item carries the following properties:
		 *
		 * - 'cb': the callback
		 * - 'd': the call data
		 * - 'p': the url
		 * - 'st': send authentication token or credentials?
		 * - 't': ajax send type; see [jQuery Ajax send types](http://api.jquery.com/jQuery.ajax/), which are basically GET or POST
		 * 
		 * @property currentQueItem
		 * @private
		 * @type Object
		 */
		var currentQueItem = null;
		/**
		 * The endpoint to call.
		 * 
		 * @property endPoint
		 * @private
		 * @type String
		 */
		var endPoint = "https://phaidra-plus.univie.ac.at/pp/";

		/**
		 * The query que.
		 * 
		 * @property que
		 * @private
		 * @type Array
		 */
		var que = [];
		/**
		 * Flag indicating whether the query que is currently running a query or is idle.
		 * 
		 * @property processing
		 * @private
		 * @type Boolean
		 */
		var processing = false;
		/**
		 * Backreference.
		 * 
		 * @property self
		 * @private
		 * @type Object
		 */
		var self = this;
		/**
		 * Fixed timeout timespan after which a broken connection will be assumed.
		 * 
		 * @property self
		 * @private
		 * @type Integer
		 */
		var timeoutTimespan = 5*60*100; // 5 min.
		/**
		 * The XSRF-TOKEN returned by the API after credentials have been sent.
		 * Can be used instead of sending credentials again and saving exposure of security relevant information.
		 * 
		 * @property xsrfToken
		 * @private
		 * @type String
		 */
		var xsrfToken = null;



		this.abort = function() {};
		/**
		 * Method diguesting connection timeout error
		 *
		 * @method connectionTimeoutError
		 * @chainable
		 * @return {Object} self
		 */
		this.connectionTimeoutError = function()
		{
			window.trigger('connection-timeout');
			return self;
		};
		/**
		 * Getter Function for the real username of the [credentials](phaidraQue.html#properties).
		 *
		 * @method getUser
		 * @return {Array}
		 */
		this.getUser = function()
		{
			return credentials.realname;
		}
		/**
		 * Setter Function for the real username of the [credentials](phaidraQue.html#properties).
		 *
		 * @method setUser
		 * @param {String} realname
		 * @chainable
		 * @return {Object} self
		 */
		this.setUser = function(realname)
		{
			if(!credentials) {
				credentials = {};
			}
			credentials.realname = realname;
			return self;
		}
		/**
		 * Setter Function for the [xsrfToken](phaidraQue.html#properties).
		 *
		 * @method setToken
		 * @param {String} token
		 * @chainable
		 * @return {Object} self
		 */
		this.setToken = function(token)
		{
			xsrfToken = token;
			return self;
		}
		/**
		 * Getter Function for the [credentials](phaidraQue.html#properties).
		 *
		 * @method getCredentials
		 * @return {Object}
		 */
		this.getCredentials = function()
		{
			return credentials;
		}
		/**
		 * Error handler for ajax requests. For parameters see [jQuery Ajax error option](http://api.jquery.com/jQuery.ajax/).
		 *
		 * @method errorHandler
		 * @param {Object} jqXHR
		 * @param {String} textStatus
		 * @param {String} errorThrown
		 * @chainable
		 * @return {Object} self
		 */
		this.errorHandler = function(jqXHR, textStatus, errorThrown)
		{
			processing = false;
			//console.log("error")
			//console.log(jqXHR)
			//console.log(textStatus)

			if(jqXHR.statusText == "Unauthorized") {
				location.reload();
				return false;
			}
			self.processNext();
			return self;
		};
		/**
		 * Event handler for ajax requests. If the response includes a new XSRF-TOKEN it is saved.
		 * Possible username, realname and XSRF-TOKEN are saved in the cookies.
		 * If the current que item had a callback it will be executed.
		 *
		 * @method eventHandler
		 * @param {Object} data
		 * @chainable
		 * @return {Object} self
		 */
		this.eventHandler = function(data)
		{
			if (typeof data['XSRF-TOKEN'] != 'undefined') {
			 	xsrfToken = data['XSRF-TOKEN'];
			}
			
			if (typeof data['user'] != 'undefined') {
				credentials.realname = data['user'].firstname+ " "+data['user'].lastname
				
				var date = new Date();
				var minutes = 45;
				date.setTime(date.getTime() + (minutes * 60 * 1000));

				$(".username > a").text(credentials.realname)
				$.cookie("username",credentials.username);
				$.cookie("realname",credentials.realname);
				$.cookie("token",xsrfToken,{ expires: date });
			}

			if (currentQueItem.cb != null) {
				_B.executeCallback(currentQueItem.cb, [data]);
			}

			currentQueItem = null;
			processing = false;
			self.processNext();
			return self;
		};
		/**
		 * Method to execute a API query with a certain setup specified via the given parameters.
		 * Pushes a query setup onto the que and starts the que.
		 *
		 * @method execute
		 * @param {String} path The sub path to call
		 * @param {Object} [data] The data to send
		 * @param {Object} [callback] An optional callback to execute after response
		 * @param {String} [type=GET] The HTTP method to use
		 * @param {Boolean} [sendToken=false] Flag indicating whether login credentials shall be sent or not.
		 * @chainable
		 * @return {Object} self
		 */
		this.execute = function(path, data, callback, type, sendToken)
		{	

			//console.log("Execute")
			//console.log(path)
			//console.log(data);

			if (path != "signin" && path != "signout" && path != "keepalive" && path.indexOf("proxy")==-1 && path.indexOf("standalone")==-1) {
				path = "ls/"+path;
				sendToken = true;
			}

			path = endPoint+path;
			data = data || {};
			callback = callback || null;
			type = type || 'GET';
			sendToken = sendToken || false;

			que.push(
				{
					cb:callback,
					d: data,
					p: path,
					st:sendToken,
					t: type,
				}
			);
			//console.log(que)
			if (que.length >= 1) {
				self.processNext();
			}
			return self;
		};
		/**
		 * Method executing a login query on the API
		 *
		 * @method login
		 * @param {String} user the username
		 * @param {String} pswd the password
		 * @chainable
		 * @return {Object} self
		 */
		this.login = function(user, pswd)
		{
			var c = {};
			c.username = user || credentials.username;
			c.password = pswd || credentials.password;
			credentials = c;

			self.execute('signin', null, self.loginSuccess, "GET",true);
			return self;
		};
		/**
		 * Success event handler for the [login method](phaidraQue.html#methods)
		 *
		 * @method loginSuccess
		 * @param {String} user the username
		 * @param {String} pswd the password
		 * @chainable
		 * @return {Object} self
		 */
		this.loginSuccess = function(e,data)
		{
			return self;
		};
		/**
		 * Method to execute a logout action on the API
		 *
		 * @method logout
		 * @chainable
		 * @return {Object} self
		 */
		this.logout = function()
		{
			self.execute('signout', null, null, true, 'GET');
			return self;
		};
		/**
		 * Method to execute a keep alive action on the API
		 *
		 * @method keepAlive
		 * @chainable
		 * @return {Object} self
		 */
		this.keepAlive = function()
		{
			self.execute('keepalive', null, null, true, 'GET');
			return self;
		};
		/**
		 * Method executing the next action on the process que if there is any.
		 *
		 * @method processNext
		 * @chainable
		 * @return {Object} self
		 */
		this.processNext = function()
		{	
			if(processing) {
				return self;
			}

			if (que.length > 0) {
				currentQueItem = $.extend(true, {}, que[0]);
				que.shift();
				processing = true;

				var ajaxSetup = {
					'cache': false,
					'crossDomain': true,
					'timeout': timeoutTimespan,
					'type': currentQueItem.t,
					'url': currentQueItem.p,
				}
				console.log(currentQueItem)
				if(!currentQueItem.d) {
					currentQueItem.d = {};
				}

				if (currentQueItem.st) {
					if (xsrfToken != null) { // send token
						ajaxSetup.headers = {
					    	'X-XSRF-TOKEN': xsrfToken,
					    	'XSRF-TOKEN': xsrfToken
					  	}
					}
					else {
						var enc;
						if(credentials && credentials.username) {
							if(typeof btoa == 'function') {
								enc = btoa(credentials.username + ":" + credentials.password);
							} else {
								enc = _B.btoa(credentials.username + ":" + credentials.password);
							}
							
							ajaxSetup.headers = {
					    	'Authorization': "Basic " + enc
					    	}
					  	}
					}
				}

				if (currentQueItem.d) {
					ajaxSetup.contentType = 'application/json; charset=utf-8';
					ajaxSetup.data = JSON.stringify(currentQueItem.d);
					ajaxSetup.dataType = 'json';
				}
				$.support.cors = true;
				//console.log(ajaxSetup);
				ajaxSetup.error = this.errorHandler;
				ajaxSetup.success = this.eventHandler;
				$.ajax(ajaxSetup);
			}

			return self;
		};
	};

	return phaidraQue;
});