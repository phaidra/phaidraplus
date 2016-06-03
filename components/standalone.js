/**
 * @module viewControllers
 * @submodule main
 */
define(function() {
  /**
   * The standalone class is only used in the standalone mode and is a bridging class to get the query parameters from the calling url
   * into work by starting a standalone-search.
   *
   * ## Global Events Triggered
   * - window:standalone-error
   * - window:standalone-search
   *
   * @class standalone
   * @constructor
   */
  var standalone = function()
  {
  	// from http://stackoverflow.com/a/3867610/2526914
  	var params = {},
        e,
        a = /\+/g,  // Regex for replacing addition symbol with a space
        r = /([^&=]+)=?([^&]*)/g,
        d = function (s) { return decodeURIComponent(s.replace(a, " ")); },
        q = window.location.search.substring(1);

    while (e = r.exec(q))
    {
    	params[d(e[1])] = d(e[2]);
    }

    // the only params we are excepting are query, requiredfields, start and num, where the first is required and the other are optional
    if (typeof params['query'] == undefined || params['query'] == undefined) {
      params['query']= "";
     }

    var q = params['query'];
    var r = params['requiredfields'] || "(type%3AImage|type%3AText|type%3APicture|type%3APDF|type%3APaper)";
    var s = params['start'] || 0;
    var n = params['num'] || 50;
    var view = params['view'] || 'lightRoom';
    var conf = null;

    view = view.toLowerCase();
    view = view.charAt(0).toUpperCase()+view.slice(1);

    switch (view) {
      case 'Collection':
        $(window).trigger('loadCollection', [q, r, s, n]);
        return;
      case 'Geo':
      case 'Lightroom':
      case 'Semantic':
      case 'Timeline':
        conf = resourceMan.states['open'+view+'View'][0];
        break;
      default:
        conf = resourceMan.states['openLightroomView'][0];
        break;
    }

    resourceMan.setConfig('dataManaged', 'default', {
      'deps': conf.deps, //['components/sidebar', 'components/lightroom'],
      'open': conf.open, //{ 'scope': 'components_lightroom', 'func': 'show' },
      'close': conf.close, //{ 'scope': 'components_lightroom', 'func': 'close' },
    });
   
    if (typeof params['query'] == undefined || params['query'] == "") {
      return;
     }
    $(window).trigger('standalone-search', [q, r, s, n]);
	};

	return standalone;
});