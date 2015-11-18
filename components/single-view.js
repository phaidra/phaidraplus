/**
 * @module viewControllers
 * @submodule main
 */
define(['jquery', 'Handlebars','spin', 'text!templates/single-view.hbs', 'i18n!nls/texts',
        'foundation', 'imagesLoaded', 'jquery.cropit', 'slimscroll'],
	
  function($, _H, _S, _tempRaw, _T) {
  /**
   * The geo view class displays the search result on a map
   *
   * ## Global Events Triggered
   * - window:addToCollection
   * - window:back
   *
   * ## Dependencies
   * - [template:single-view.hbs](../../templates/single-view.hbs)
   *
   * @class singleView
   * @constructor
   */
  var singleView = function() {

  	var data = null;
    var obj = null;
    var dataMan = null;
    var dom = null;
  	var next = null;
    var loaded = false;
  	var previous = null;
    var propMapping = {
      'annotations': [],
      'collections': [],
      
      'objectdata': ['type','mimetype','filesize_human','desc_language', 'dimensions', 'language', 'latlon','coverage', 'length', 'identifiers', 'pid', 'upload_date'],
      'history': ['roles', 'status', 'provenance'],
      'copyrights': ['costs', 'copyright', 'license'],
      'attributions': [],
      'categories': ['keywords','subject']
    };
    var renderPlugins = {
      'author': function(val) {
        if(val.forename || val.surname) {
          return { 'forename':val.forename, 'surname': val.surname };  
        }
        return null;
      },
      'dbUrl': function(val) {
        return val;
      },
      'title': function(val) {
        return val;
      },
      'title_de': function(val) {
        return val;
      },
      'description': function(val) {
        return val;
      },
      'description_de': function(val) {
        return val;
      },
      'file': function(val) {
        return val;
      },
      'preview': function(val) {
        return val;
      },
      'preview_large': function(val) {
        return val;
      },
      'download': function(val) {
        return val;
      },
      'dimensions': function(val) {
        var str = "";
        if(val.source || val.measurement || val.length || val.height) {

          str = "<dl><dt>"+self.translate("dimensions")+"</dt><dd><dl>";
          for(var key in val) {
            var valStr = ""
            if (typeof val[key] == "object") {
              valStr = self.renderStdObject(val[key]);
            } else if(val[key] && val[key].length) {
              valStr = '<dd>'+val[key]+'</dt>';
            }
            if(valStr) {

              str+= '<dt>'+self.translate(key)+'</dt>';
              str+= valStr;
            }
          }
          str+= '</dl></dd></dl>';
        }
        return str;
      },  
      'roles': function(val) {
        var ret = [];
        var str;
        for(var i=0; i<val.length; i++) {
          str = "";
          if(val[i].entity && val[i].entity.firstname) {
            str = '<dt>'+val[i].role+'</dt><dd>'+val[i].entity.firstname+" "+val[i].entity.lastname+'</dd>';
          } else {
            if(val[i].entity.institution) {
              str = '<dt>'+val[i].role+'</dt><dd>'+val[i].entity.institution+'</dd>';
            }
          }
          if(val[i].date) {
            str += '('+val[i].date+')';
          }
          ret.push(str);
        }
        if(ret.length && ret.join('')) {
          return '<dl>'+ret.join('')+'</dl>';  
        }
        return '';
      },
    };
  	var self = this;
    var template = null;
    var _propMapping = null;
    /**
     * @method close
     */
		this.close = function()
    {
      $(".tooltip").hide();
      dom.remove();
      $('#fullsection').hide().empty();
      $("html").removeClass("singleView");

      resourceMan.setConfig('openSingleView', 'default', {
        'deps': ['components/single-view'],
        'open': { 'scope': 'components_singleView', 'func': 'show' },
      });
    };

    this.create = function(single)
    {
      $("html").addClass("singleView");

      var d = data;
      
      if (template == null) {
        template = _H.compile(_tempRaw);
      }

      d = self.renderObject();
      d.single = single;
      
      if (data.type != "Image") {
        d.showObjectLink = true;
      }
      d.pid = data.pid;
      dom = template(d);
      dom = $.parseHTML($.trim(dom));
      dom = $(dom);
      loaded = false;      

      dom.find(".closeBtn").on("click.ph-plus",function (e) {
        $(window).trigger('back');
        return false;
      });

      dom.find(".nextBtn").on("click.ph-plus",function (e) {
        dataMan.selectNextObject();
        self.show();
        return false;
      });
      
      dom.find(".prevBtn").on("click.ph-plus",function (e) {
        dataMan.selectPreviousObject();
        self.show();
        return false;
      });

      if (_standalone) {
        dom.find('.actions-menu').remove();
      } 
      else {
        dom.find('.actions-menu').on('change.ph-plus', function(e) {
          var action = $(this).val();
          
          switch (action) {
            case 'collection':
              $(window).trigger('addToCollection', [dataMan.getSelectedObject()]);
              break;
            case 'mark':
              var pid = dataMan.getSelectedObject().data.pid;
              dataMan.markObject(pid, dataMan.isMarked(pid));
              self.checkMarking();
              break;
            case 'download':
              
              $(window).trigger('downloadSingleObject', [data]);
              break;
          }
          
          $(this).val('');
          return false;
        });
      }

      var vh = $(window).height()-40;
      
      $('#fullsection').append(dom);
      dom.find("img").css("max-height",vh)
      dom.find(".image-cropper").css("height",vh)
      $('#fullsection').show();
      $('#fullsection').foundation();      
     
      $('.scroll-content').slimScroll({
        color: '#95a5a6',
        size: '10px',
        height: vh,
        alwaysVisible: true
      });
      
      if (data.type == "Image") {
        self.s = new _S().spin();
        dom.find("img").parent().append(self.s.el)

        requirejs(
          ['imagesLoaded','jquery.cropit'],
          function (imagesLoaded) {
            imagesLoaded(dom.find(".image-cropper"), function(e) { 
              self.createZoom();
            });
          }
        );
      } else {
        $(".slider-wrapper").remove();
        $(".image-cropper div").css("opacity", .5);
      }
    };

    this.createZoom = function ()
    {
      var h = dom.find("img").height();

      if(!h || loaded) { return; }
      self.s.stop();
      loaded = true;
      
      var w = dom.find("img").width();

      $(".image-cropper").css("height",h);
      $(".cropit-image-preview").css("height",h);
      
      $(".image-cropper").cropit({
        imageState: {
          height:h,
          width:w,
          src: $(".image-cropper").attr("data-image")
        }
      });

      $(".image-cropper").width(w);
      $(".image-cropper").cropit('previewSize', { width: w, height: h });
    };

    this.checkMarking = function(single)
    {
      if (single) {
        return;
      }
      
      if (dataMan.isMarked(dataMan.getSelectedObject().data.pid)) {
        dom.addClass('marked');
        dom.find('.actions-menu option[value=mark]').text(self.translate('actionsMenuUnmarkObject'));
      } else {
        dom.removeClass('marked');
        dom.find('.actions-menu option[value=mark]').text(self.translate('actionsMenuMarkObject'));
      }
    };

    this.renderObject = function()
    {
      var nd = {};
      
      for(var key in data) {
        // skipping empty fields
        if (typeof data[key] == "string" && $.trim(data[key]).length == 0) {
          continue;
        }

        // transforming the value
        var v = data[key];
        var k = key;

        if (typeof renderPlugins[key] != 'undefined') {
          v = renderPlugins[key].apply(null, [data[key]]);
        } else if (typeof data[key] == "object") {
          v = self.renderStdObject.apply(null, [data[key]]);
        } else if (typeof data[key] == "string") {
          v = data[key];
        }
        //console.log(v,key)
        // mapping the value to the right output fields
        if (typeof _propMapping[key] != 'undefined') {
          k = _propMapping[key];
        }
        
        if (typeof renderPlugins[key] == 'undefined' && typeof data[key] == "string") {
          v = self.renderProperty([key,data[key]]);
        }

        if (v != "<dl></dl>") {
          if (typeof nd[k] != "undefined") { nd[k] += ' '+v; }
          else { nd[k] = v; }
        }
      }
      return nd;
    };

    this.renderProperty = function (obj)
    {
      var str = "<dl>";
    
      str+= '<dt>'+self.translate(obj[0])+'</dt>';
      str+= '<dd>'+obj[1]+'</dt>';
      str+= '</dl>';
      return str;
    };

    this.renderStdObject = function (val)
    {
      var str = "<dl>";

      for(var key in val) {
        var valStr = ""

        if (typeof val[key] == "object") {
          valStr = self.renderStdObject(val[key]);
        } else if(val[key] && val[key].length) {
          valStr = '<dd>'+val[key]+'</dt>';        
        }

        if(valStr) {
          str+= '<dt>'+self.translate(key)+'</dt>';
          str+= valStr;
        }
      }
      
      str+= '</dl>';
      return str;
    };

    this.translate = function (term)
    {
      if (typeof _T[term] != 'undefined') {
        return _T[term];
      } else {
        return term;
      }      
    };
    /**
     * @method show
     */
  	this.show = function (newData, single)
    {
      dataMan = resourceMan.getResource('gsaData');
  		data = newData || dataMan.getSelectedObject().data;
      single = (typeof single == 'undefined') ? false : single;

      if (dom != null) {
        self.close();
      }

      dataMan.selectObject(data);
      self.create(single);
      self.checkMarking(single);

      resourceMan.setConfig('openSingleView', 'default', {
        'deps': ['components/single-view'],
        'open': { 'scope': self, 'func': self.show },
        'close':{ 'scope': self, 'func': self.close },
      });
  	};

    _H.registerHelper('translate', self.translate);

    // reversing the property mapping to have a faster mapping
    _propMapping = {};

    for(var key in propMapping) {
      for(var i=0; i<propMapping[key].length; i++) {
        _propMapping[propMapping[key][i]] = key;
      }
    }
  };

  return singleView;
});