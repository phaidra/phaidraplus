<?php 
    $version = "standalone";
    
    $login = false;
    
    if(isset($_POST["login"])) {
      $version = "";
    }
    if(isset($_COOKIE["token"])) {
      $version = "";
    }
    if(isset($_GET["standalone"])) {
      $version = "standalone";
    }
    
  ?><!DOCTYPE html>
<html class="<?php echo $version; ?>">
<head>
  <meta http-equiv="Content-Type" content="text/html; charset=utf-8">
  <title>Phaidra+</title>
  <link id="page_favicon" href="/theme/img/favicon.ico" rel="icon" type="image/x-icon" />  
  <link href='https://fonts.googleapis.com/css?family=Roboto:300,500,400' rel='stylesheet' type='text/css'>
  <link rel="stylesheet" type="text/css" href="theme/css/normalize.css">
  <link rel="stylesheet" type="text/css" href="theme/css/app.css">

  <!-- Modernizr, Fastclick, Rangy Core -->
  <script src="external/basics.js"></script>
  <!--
  <script src="external/modernizr.js"></script>
  <script src="external/fastclick.js"></script>
  <script src="http://rangy.googlecode.com/svn/trunk/currentrelease/rangy-core.js"></script>-->

  <script>
    var require = {
          baseUrl: '.',
           map: {
            '*': {
              'css': 'external/require-plugins/css'
            } 
          },
          paths: {
            'async': 'external/require-plugins/async',
            'font': 'external/require-plugins/font',
            // 'modernizr': 'external/modernizr',
            'xdomainrequest': 'external/jquery.xdomainrequest.min',
            'foundation': 'external/foundation.min',
            'slimscroll': 'external/jquery.slimscroll.min',
            'jquery.cropit':'external/jquery.cropit.min',
            'goog': 'external/require-plugins/goog',
            'gwt-timeline': 'external/timeline',
            'Handlebars': 'external/handlebars',
            'i18n': 'external/require-plugins/i18n',
            'image': 'external/require-plugins/image',
            'jquery': 'external/jquery.min',
            'jquery.cookie': 'external/jquery.cookie',
            'sigma': 'external/sigma.min',
            'sigma.force':'external/sigma.forceatlas2',
            'slick':'external/slick/slick.min',
            'gexfjs' : 'external/gexf-js/js/gexfjs',
            'semantic-canvas' : 'components/semantic-canvas',
            'jquery.mousewheel': 'external/jquery.mousewheel.min',
            'jquery.history': 'external/jquery.history',
            'jquery.lazyload': 'external/jquery.lazyload.min',
            'jqueryui': 'external/jquery-ui/ui/minified/jquery-ui.min',
            'json': 'external/require-plugins/json',
            'leaflet': 'external/leaflet',
            'leaflet-cluster': 'external/Leaflet.markercluster/dist/leaflet.markercluster-src',
            'markdownConverter': 'lib/Markdown.Converter',
            'mdown': 'external/require-plugins/mdown',
            'noext': 'external/require-plugins/noext',
            'propertyParser': 'external/require-plugins/propertyParser',
            'style': 'theme/css',
            'text': 'external/require-plugins/text',
            'waterfall' : "external/waterfall",
            'spin' : "external/spin",
            'imagesLoaded' : "external/imagesloaded.pkgd",
            'timeago': 'external/jquery.timeago',
            'hallo' : 'external/hallo'
          },
          shim: {
            'foundation': {
              'deps': ['jquery'],
              'exports': 'Foundation',
            },
            'slimscroll': {
              'deps': ['jquery']
            },
            'leaflet-cluster': {
              deps: ['leaflet']
            },
            'sigma.force': {
              deps: ['sigma']
            },
            'gwt-timeline': {
              //'deps': ['goog'],
              'exports': 'links'
            },
            'Handlebars': {
              'deps': ['jquery'],
              'exports': 'Handlebars'
            },
            'leaflet': {
              'exports': 'L'
            },
            'hallo': {
              'deps': ['jquery'],
            },
            
            'jquery.history': {
              'deps': ['jquery'],
              'exports': 'History',
            },
            'jquery.lazyload': {
              'deps': ['jquery']
            },
            'waterfall': {
              'deps': ['jquery']
            },
          }
        };
    var resourceMan = null;
    var dataMan = null;
  </script>
  
  <script data-main="<?php echo "app".($version != "" ? "-".$version:$version);?>" src="external/require.js"></script>
</head>

<body class="init">
      
  <div id="search-dropdown-container" data-dropdown-content class="template medium f-dropdown content">
    
    <div id="search-canvas" class="">
      <div id="filter-canvas" class="clearer"></div>
    </div>
  </div>

    <!-- VOLLE BREITE -->
  <section id="fullsection">
  </section>


  <!-- MIT SEITENLEISTE -->
  <div class="row" id="main">
    <section class="columns  medium-12" id="mainsection">
    </section>

  </div>
  <div class="hiddenlogo">
      <svg version="1.1" id="svglogo" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" x="0px" y="0px"
    viewBox="0 0 939.094 225.021"
   xml:space="preserve">
<path fill="none" stroke="#ACACAC" stroke-width="21" stroke-linecap="square" stroke-linejoin="round" stroke-miterlimit="50" d="
  M698.064,88.667c-23.396,0-42.365,19.548-42.365,42.945v41.428"/>
<circle fill="none" stroke="#ACACAC" stroke-width="21" stroke-linecap="square" stroke-linejoin="round" stroke-miterlimit="50" cx="88.873" cy="130.613" r="42.365"/>
<path fill="none" stroke="#ACACAC" stroke-width="21" stroke-linecap="square" stroke-linejoin="round" stroke-miterlimit="50" d="
  M46.385,130.673c0,38.14-26.919,69.055-26.919,69.055"/>
<circle fill="none" stroke="#ACACAC" stroke-width="21" stroke-linecap="square" stroke-linejoin="round" stroke-miterlimit="50" cx="556.787" cy="130.729" r="42.366"/>
<path fill="none" stroke="#ACACAC" stroke-width="21" stroke-linecap="square" stroke-linejoin="round" stroke-miterlimit="50" d="
  M599.276,130.667c0-38.139,26.92-69.054,26.92-69.054"/>
<circle fill="none" stroke="#ACACAC" stroke-width="21" stroke-linecap="square" stroke-linejoin="round" stroke-miterlimit="50" cx="353.548" cy="130.613" r="42.366"/>
<path fill="none" stroke="#ACACAC" stroke-width="21" stroke-linecap="square" stroke-linejoin="round" stroke-miterlimit="50" d="
  M180.699,130.519c0-23.398,19.156-42.271,42.556-42.271c23.396,0,42.553,19.062,42.553,42.461v42.271"/>
<path fill="none" stroke="#ACACAC" stroke-width="21" stroke-linecap="square" stroke-linejoin="round" stroke-miterlimit="50" d="
  M396.034,130.673c0,15.938,4.702,30.619,10.179,42.306"/>
<circle fill="none" stroke="#ACACAC" stroke-width="21" stroke-linecap="square" stroke-linejoin="round" stroke-miterlimit="50" cx="771.864" cy="130.613" r="42.366"/>
<path fill="none" stroke="#ACACAC" stroke-width="21" stroke-linecap="square" stroke-linejoin="round" stroke-miterlimit="50" d="
  M814.23,130.673c0,15.938,4.702,30.619,10.176,42.306"/>
<line fill="none" stroke="#ACACAC" stroke-width="21" stroke-linecap="square" stroke-linejoin="round" stroke-miterlimit="50" x1="180.699" y1="173.04" x2="180.699" y2="47.04"/>
<path fill="none" stroke="#ACACAC" stroke-width="21" stroke-linecap="square" stroke-linejoin="round" stroke-miterlimit="50" d="
  M457.951,88.247l0.129,42.426c0,15.938,4.702,30.619,10.177,42.306"/>
<line fill="none" stroke="#ACACAC" stroke-width="21" stroke-linecap="square" stroke-linejoin="round" stroke-miterlimit="50" x1="457.698" y1="53.04" x2="457.698" y2="51.04"/>
<line fill="none" class="plus" stroke="#1A9DC0" stroke-width="20" stroke-linecap="square" stroke-linejoin="round" stroke-miterlimit="50" x1="869.522" y1="89.04" x2="869.522" y2="29.04"/>
<line fill="none" class="plus" stroke="#1A9DC0" stroke-width="20" stroke-linecap="square" stroke-linejoin="round" stroke-miterlimit="50" x1="838.198" y1="61.246" x2="898.198" y2="61.246"/>
</svg>


  </div>

</body>
</html>
