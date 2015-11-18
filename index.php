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
  <link rel="stylesheet" type="text/css" href="theme/css/app.css">

  <!-- Modernizr, Fastclick, Rangy Core -->
  <script src="external/basics.js"></script>
  <!--<link rel="stylesheet" type="text/css" href="theme/css/leaflet.css">
  <link rel="stylesheet" href="external/Leaflet.markercluster/dist/MarkerCluster.css" />
  <link rel="stylesheet" href="external/Leaflet.markercluster/dist/MarkerCluster.Default.css" />
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

</body>
</html>
