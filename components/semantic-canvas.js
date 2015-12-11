/* Copyright (c) 2011 Raphaël Velt
 * Licensed under the MIT License
 * Translations by :
 *    Vicenzo Cosenza (Italian)
 *    Eduardo Ramos Ibáñez (Spanish)
 *    Jaakko Salonen (Finnish)
 *    Zeynep Akata (Turkish)
 *    Σωτήρης Φραγκίσκος (Greek)
 *
 * Edited by JR
 */
// Namespace
var GexfJS = {
    lensRadius : 200,
    lensGamma : 0.5,
    graphZone : {
        width : 500,
        height : 500
    },
    oldGraphZone : {},
    params : {
       
    },
    forceReDraw:false,
    oldParams : {},
    minZoom : 0,
    maxZoom : 8,
    overviewWidth : 200,
    offsetLeft:0,
    offsetTop:0,
    overviewHeight : 150,
    baseWidth : 800,
    baseHeight : 700,
    overviewScale : .25,
    totalScroll : 0,
    autoCompletePosition : 0,
    i18n : {
        "en" : {
            "search" : "Search nodes",
            "nodeAttr" : "Attributes",
            "nodes" : "Nodes",
            "inLinks" : "Inbound Links from :",
            "outLinks" : "Outbound Links to :",
            "undirLinks" : "Undirected links with :",
            "lensOn" : "Activate lens mode",
            "lensOff" : "Deactivate lens mode",
            "edgeOn" : "Show edges",
            "edgeOff" : "Hide edges",
            "zoomIn" : "Zoom In",
            "zoomOut" : "Zoom Out",
            "browserErr" : 'Your browser cannot properly display this page.<br />We recommend you use the latest <a href="http://www.mozilla.com/" target="_blank">Firefox</a> or <a href="http://www.google.com/chrome/" target="_blank">Chrome</a> version'
        },
         "de" : {
            "search" : "Suche nach Einträgen",
            "nodeAttr" : "Attribute",
            "nodes" : "Einträge",
            "inLinks" : "Inbound Links from :",
            "outLinks" : "Outbound Links to :",
            "undirLinks" : "Undirected links with :",
            "lensOn" : "Activate lens mode",
            "lensOff" : "Deactivate lens mode",
            "edgeOn" : "Show edges",
            "edgeOff" : "Hide edges",
            "zoomIn" : "Zoom In",
            "zoomOut" : "Zoom Out",
            "browserErr" : 'Your browser cannot properly display this page.<br />We recommend you use the latest <a href="http://www.mozilla.com/" target="_blank">Firefox</a> or <a href="http://www.google.com/chrome/" target="_blank">Chrome</a> version'
        },
       
    },
    lang : "de"
}

function strLang(_str) {
    var _l = GexfJS.i18n[GexfJS.lang];
    return ( _l[_str] ? _l[_str] : ( GexfJS.i18n["en"][_str] ? GexfJS.i18n["en"][_str] : _str.replace("_"," ") ) );
}

function replaceURLWithHyperlinks(text) {
    if (GexfJS.params.replaceUrls) {
        var _urlExp = /(\b(https?:\/\/)?[-A-Z0-9]+\.[-A-Z0-9.:]+(\/[-A-Z0-9+&@#\/%?=~_|!:,.;]*)?)/ig,
            _protocolExp = /^https?:\/\//i;
        return text.replace(_urlExp, function(_found) {
            return '<a href="'
                + ( _protocolExp.test(_found) ? '' : 'http://' )
                + _found + '" target="_blank">'
                + _found.replace(_protocolExp,'')
                + "</a>";
        });
    }
    return text;
}

function displayNode(_nodeIndex, _recentre) {

    GexfJS.params.currentNode = _nodeIndex;
    if (_nodeIndex != -1) {
        var _d = GexfJS.graph.nodeList[_nodeIndex],
            _b = _d.coords.base
           
        if (_recentre) {
            GexfJS.params.centreX = _b.x;
            GexfJS.params.centreY = _b.y;
        }
        if(!_recentre && GexfJS.graph.nodeList[_nodeIndex].type != "term") {
            $(window).trigger("openPopup.ph-plus-semantic",[GexfJS.graph.nodeList[_nodeIndex]])
        }
        if(GexfJS.graph.nodeList[_nodeIndex].type == "term") {
            $(window).trigger("resetSearchUI");
            $(window).trigger("clearSearchUI");
            $(window).trigger("enableSearchUI");
            
            $("#filter-canvas-filter-0").val(GexfJS.graph.nodeList[_nodeIndex].label);
            
            if(!$("#search-dropdown-container").hasClass("open")) {
                setTimeout(function(){
                    $("#menu-search").trigger("click")
                },200)
            }
        }


        $("#searchinput")
            .val(_d.label)
            .removeClass('grey');
    } else {
        $(window).trigger("closePopup.ph-plus-semantic",[GexfJS.graph.nodeList[_nodeIndex]])
    }
}

function updateWorkspaceBounds() {
    
    var _elZC = $("#zonecentre");
    var _top = {
        top : 0
    }
    _elZC.css(_top);
    _elZC.height($(window).height());

    
    $("#leftcolumn").css(_top);
    GexfJS.graphZone.width = $(window).width()//_elZC.width();
    GexfJS.graphZone.height = $(window).height()//_elZC.height();
    GexfJS.areParamsIdentical = true;
    
    for (var i in GexfJS.graphZone) {
        GexfJS.areParamsIdentical = GexfJS.areParamsIdentical && ( GexfJS.graphZone[i] == GexfJS.oldGraphZone[i] );
    }
    if (!GexfJS.areParamsIdentical || GexfJS.forceReDraw) {
        //if(GexfJS.forceReDraw && !parseInt($(".carte").css("width"))) {
            $(".carte")
            .attr({
                width : GexfJS.graphZone.width,
                height : GexfJS.graphZone.height
            })
            .css({
                width : GexfJS.graphZone.width + "px",
                height : GexfJS.graphZone.height + "px"
            });
       // }
        for (var i in GexfJS.graphZone) {
                GexfJS.oldGraphZone[i] = GexfJS.graphZone[i];
        }
    }
}

function startMove(evt) {
    evt.preventDefault();
    GexfJS.dragOn = true;
    GexfJS.lastMouse = {
        x : evt.pageX,
        y : evt.pageY
    }
    GexfJS.mouseHasMoved = false;
}

function endMove(evt) {
    document.body.style.cursor = "default";
    GexfJS.dragOn = false;
    GexfJS.mouseHasMoved = false;
}

function onGraphClick(evt) {
    endMove();
    if (!GexfJS.mouseHasMoved) {
        displayNode(GexfJS.params.activeNode);
    }
    evt.preventDefault();
    
}

function changeGraphPosition(evt, echelle) {
    document.body.style.cursor = "move";
    var _coord = {
        x : evt.pageX,
        y : evt.pageY
    };
    GexfJS.params.centreX += ( GexfJS.lastMouse.x - _coord.x ) / echelle;
    GexfJS.params.centreY += ( GexfJS.lastMouse.y - _coord.y ) / echelle;
    GexfJS.lastMouse = _coord;
}

function onGraphMove(evt) {
    evt.preventDefault();
    if (!GexfJS.graph) {
        return;
    }
    GexfJS.mousePosition = {
        x : evt.pageX - offsetLeft,
        y : evt.pageY - offsetTop
    }
    if (GexfJS.dragOn) {
        changeGraphPosition(evt,GexfJS.echelleGenerale);
        GexfJS.mouseHasMoved = true;
    } else {
        GexfJS.params.activeNode = getNodeFromPos(GexfJS.mousePosition);
        //document.body.style.cursor = ( GexfJS.params.activeNode != -1 ? "pointer" : "default" );
    }
}

function onOverviewMove(evt) {
    if (GexfJS.dragOn) {
        changeGraphPosition(evt,-GexfJS.overviewScale);
    }
}

function onGraphScroll(evt, delta) {
    
    GexfJS.totalScroll += delta;
    if (Math.abs(GexfJS.totalScroll) >= 1) {
        if (GexfJS.totalScroll < 0) {
            if (GexfJS.params.zoomLevel > GexfJS.minZoom) {
                GexfJS.params.zoomLevel--;
                var _el = $(this),
                    _off = $(this).offset(),
                    _deltaX = evt.pageX - _el.width() / 2 - _off.left,
                    _deltaY = evt.pageY - _el.height() / 2 - _off.top;
                GexfJS.params.centreX -= ( Math.SQRT2 - 1 ) * _deltaX / GexfJS.echelleGenerale;
                GexfJS.params.centreY -= ( Math.SQRT2 - 1 ) * _deltaY / GexfJS.echelleGenerale;
                //$("#zoomSlider").slider("value",GexfJS.params.zoomLevel);
                //$("#zoomSlider").val(GexfJS.params.zoomLevel);
            }
        } else {
            if (GexfJS.params.zoomLevel < GexfJS.maxZoom) {
                GexfJS.params.zoomLevel++;
                GexfJS.echelleGenerale = Math.pow( Math.SQRT2, GexfJS.params.zoomLevel );
                var _el = $(this),
                    _off = $(this).offset(),
                    _deltaX = evt.pageX - _el.width() / 2 - _off.left,
                    _deltaY = evt.pageY - _el.height() / 2 - _off.top;
                GexfJS.params.centreX += ( Math.SQRT2 - 1 ) * _deltaX / GexfJS.echelleGenerale;
                GexfJS.params.centreY += ( Math.SQRT2 - 1 ) * _deltaY / GexfJS.echelleGenerale;
                //$("#zoomSlider").slider("value",GexfJS.params.zoomLevel);
                //$("#zoomSlider").val(GexfJS.params.zoomLevel);
            }
        }
        GexfJS.totalScroll = 0;
    }
    GexfJS.echelleGenerale = Math.pow( Math.SQRT2, GexfJS.params.zoomLevel );
    window.requestAnimationFrame(traceMap);
}
function initializeMap() {
    //clearInterval(GexfJS.timeRefresh);
    
    GexfJS.oldParams = {};
    //GexfJS.overviewScale = 200/GexfJS.graphZone.width
    GexfJS.ctxGraphe.clearRect(0, 0, GexfJS.graphZone.width, GexfJS.graphZone.height);
    
    GexfJS.graphZone.width = $(window).width();//_elZC.width();
    GexfJS.graphZone.height = $(window).height();//_elZC.height();
    $(".carte")
        .attr({
            width : GexfJS.graphZone.width,
            height : GexfJS.graphZone.height
        })
        .css({
            width : GexfJS.graphZone.width + "px",
            height : GexfJS.graphZone.height + "px"
        });
        for (var i in GexfJS.graphZone) {
            GexfJS.oldGraphZone[i] = GexfJS.graphZone[i];
        }
    
    
    $("#overviewzone").css({
        width : GexfJS.overviewWidth + "px",
        height : GexfJS.overviewHeight + "px"
    });
    $("#overview").attr({
        width : GexfJS.overviewWidth,
        height : GexfJS.overviewHeight
    });
    

    GexfJS.graph = null;
    if(GexfJS.params.graphXML) {
        createGraph(GexfJS.params.graphXML)
    } else {
        loadGraph();
    }
}
function createGraph(data) {
    GexfJS.forceReDraw = true;
    var _s = new Date();
    var _g = $(data).find("graph"),
        _nodes = _g.children().filter("nodes").children(),
        _edges = _g.children().filter("edges").children();
    GexfJS.graph = {
        directed : ( _g.attr("defaultedgetype") == "directed" ),
        source : data,
        nodeList : [],
        nodeIndexById : [],
        nodeIndexByLabel : [],
        edgeList : []
    }
    var _xmin = 1e9, _xmax = -1e9, _ymin = 1e9, _ymax = -1e9; _marge = 30;
    $(_nodes).each(function() {
        var _n = $(this),
        _pos = _n.find("viz\\:position,position"),
        _x = Number(_pos.attr("x")),

        _y = Number(_pos.attr("y"));
        _xmin = Math.min(_x, _xmin);
        _xmax = Math.max(_x, _xmax);
        _ymin = Math.min(_y, _ymin);
        _ymax = Math.max(_y, _ymax);
    });

    GexfJS.baseHeight = $(window).height();

    var _echelle = Math.min( ( GexfJS.baseWidth - _marge ) / ( _xmax - _xmin ) , ( GexfJS.baseHeight - _marge ) / ( _ymax - _ymin ) );
    var _deltax = ( GexfJS.baseWidth - _echelle * ( _xmin + _xmax ) ) / 2;
    var _deltay = ( GexfJS.baseHeight - _echelle * ( _ymin + _ymax ) ) / 2;
    
    GexfJS.ctxMini.clearRect(0, 0, GexfJS.overviewWidth, GexfJS.overviewHeight);
    
    $(_nodes).each( function() {
        var _n = $(this),
            _id = _n.attr("id"),
            _label = _n.attr("label") || _id,
            _d = {
                id: _id,
                label: _label
            },
            _image = _n.find("attvalues attvalue").eq(1).attr("value"),
            _type = _n.find("attvalues attvalue").eq(0).attr("value"),
            _pos = _n.find("viz\\:position,position"),
            _x = Number(_pos.attr("x")),
            _y = Number(_pos.attr("y")),
            _size = Number(_n.find("viz\\:size,size").attr("value")),
            _col = _n.find("viz\\:color,color"),
            _r = Number(_col.attr("r")),
            _g = Number(_col.attr("g")),
            _b = Number(_col.attr("b")),
            _attr = _n.find("attvalue");
            
            var img = new Image();
            
            $(img).on("load",function(){
                var $t = $(this);
                var n = $t.data("node");
                
                var w = this.width, 
                h = this.height;
                n.image.loaded = true;
                n.image.ow = w;
                n.image.oh = h;
                calcImageSize(n);
                //GexfJS.forceReDraw = true;
                //window.requestAnimationFrame(traceMap);
                //GexfJS.ctxMini.drawImage(this,$t.data("x"),$t.data("y"),30,30);
            })
            if(_image) {
                 img.src = _image//.replace(/\/\d{3}/,"/160");
            }
            _d.image = {img:img};
            _d.image.w = 0;
            _d.image.h = 0;
            _d.image.loaded = false;
            _d.type = _type;
            $(img).data("node",_d);

        _d.coords = {
            base : {
                x : _deltax + _echelle * _x,
                y : _echelle * (_y-_ymin),//_deltay - _echelle * _y,
                r : _echelle * _size
            }
        }

        _d.color = {
            rgb : {
                r : _r,
                g : _g,
                b : _b
            },
            base : "rgba(" + _r + "," + _g + "," + _b + ",1)",
            active : "rgba(" + _r + "," + _g + "," + _b + ",1)",
            gris : "rgba(" + Math.floor(84 + .33 * _r) + "," + Math.floor(84 + .33 * _g) + "," + Math.floor(84 + .33 * _b) + ",1)",
            overlay : "rgba(" + Math.floor(31) + "," + Math.floor(44) + "," + Math.floor(57) + ",.5)"
        }
        
        _d.attributes = [];
        $(_attr).each(function() {
            var _a = $(this),
                _for = _a.attr("for");                    
            _d.attributes[ _for ? _for : 'attribute_' + _a.attr("id") ] = _a.attr("value");
        });
        GexfJS.graph.nodeIndexById.push(_id);
        GexfJS.graph.nodeIndexByLabel.push(_label.toLowerCase());
        GexfJS.graph.nodeList.push(_d);
        GexfJS.ctxMini.fillStyle = _d.color.base;
        GexfJS.ctxMini.beginPath();
        var scale = (GexfJS.overviewScale)*.9;
        var cx = _d.coords.base.x * scale+10;
        var cy = _d.coords.base.y * scale+10;
        GexfJS.ctxMini.arc( cx , cy , _d.coords.base.r * GexfJS.overviewScale + 1 , 0 , Math.PI*2 , true );
        GexfJS.ctxMini.closePath();
        GexfJS.ctxMini.fill();
        
        
    });
    
    $(_edges).each(function() {
        var _e = $(this),
            _sid = _e.attr("source"),
            _six = GexfJS.graph.nodeIndexById.indexOf(_sid);
            _tid = _e.attr("target"),
            _tix = GexfJS.graph.nodeIndexById.indexOf(_tid);
            _w = 2//_e.find('attvalue[for="weight"]').attr('value') || _e.attr('weight');
            _col = _e.find("viz\\:color,color");
        if (_col.length) {
            var _r = _col.attr("r"),
                _g = _col.attr("g"),
                _b = _col.attr("b");
        } else {
            var _scol = GexfJS.graph.nodeList[_six].color.rgb;
            if (GexfJS.graph.directed) {
                var _r = _scol.r,
                    _g = _scol.g,
                    _b = _scol.b;
            } else {
                var _tcol = GexfJS.graph.nodeList[_tix].color.rgb,
                    _r = Math.floor( .5 * _scol.r + .5 * _tcol.r ),
                    _g = Math.floor( .5 * _scol.g + .5 * _tcol.g ),
                    _b = Math.floor( .5 * _scol.b + .5 * _tcol.b );
            }
        }
        GexfJS.graph.edgeList.push({
            source : _six,
            target : _tix,
            width : Math.max( GexfJS.params.minEdgeWidth, Math.min( GexfJS.params.maxEdgeWidth, ( _w || 1 ) ) ) * _echelle,
            weight : parseFloat(_w || 0),
            color : "rgba(" + _r + "," + _g + "," + _b + ",1)"
        });
    });
    
    GexfJS.imageMini = GexfJS.ctxMini.getImageData(0, 0, GexfJS.overviewWidth, GexfJS.overviewHeight);
    var pixels = GexfJS.overviewWidth*GexfJS.overviewHeight;
    var imageData = GexfJS.imageMini.data; // here we detach the pixels array from DOM
    // while(--pixels){
    //    imageData[4*pixels+0] = r; // Red value
    //    imageData[4*pixels+1] = g; // Green value
    //    imageData[4*pixels+2] = b; // Blue value
    //    imageData[4*pixels+3] = a; // Alpha value
    // }
    GexfJS.imageMini.data = imageData; // And here we attache it back (not needed cf. update)
    //context.putImageData(image, 0, 0);

    window.requestAnimationFrame(traceMap);
}
function loadGraph() {
    GexfJS.forceReDraw = true;
    $.ajax({
        url: ( document.location.hash.length > 1 ? document.location.hash.substr(1) : GexfJS.params.graphFile ),
        dataType: "xml",
        success: function(data) {
            createGraph(data);
        //changeNiveau(0);
        }
    });
}

function getNodeFromPos( _coords ) {
    for (var i = GexfJS.graph.nodeList.length - 1; i >= 0; i--) {
        var _d = GexfJS.graph.nodeList[i];
        if (_d.visible && _d.withinFrame) {
            var _c = _d.coords.actual;
                _r = Math.sqrt( Math.pow( _c.x - _coords.x , 2) + Math.pow( _c.y - _coords.y , 2 ) );
            if ( _r < _c.r ) {
                return i;
            }
        }
    }
    return -1;
}

function calcCoord(x, y, coord) {
    var _r = Math.sqrt( Math.pow( coord.x - x , 2 ) + Math.pow( coord.y - y , 2 ) );
    if ( _r < GexfJS.lensRadius ) {
        var _cos = ( coord.x - x ) / _r;
        var _sin = ( coord.y - y ) / _r;
        var _newr = GexfJS.lensRadius * Math.pow( _r / GexfJS.lensRadius, GexfJS.lensGamma );
        var _coeff = ( GexfJS.lensGamma * Math.pow( ( _r + 1 ) / GexfJS.lensRadius, GexfJS.lensGamma - 1 ) );
        return {
            "x" : Math.floor(x + _newr * _cos),
            "y" : Math.floor(y + _newr * _sin),
            "r" : Math.ceil(_coeff * coord.r)
        }
    }
    else {
        return coord;
    }
}

function traceArc(contexte, source, target) {
    contexte.beginPath();
    contexte.moveTo(source.x, source.y);
    if (GexfJS.params.curvedEdges) {
        if ( ( source.x == target.x ) && ( source.y == target.y ) ) {
            var x3 = source.x + 2.8 * source.r;
            var y3 = source.y - source.r;
            var x4 = source.x;
            var y4 = source.y + 2.8 * source.r;
            contexte.bezierCurveTo(x3,y3,x4,y4,source.x + 1,source.y);
        } else {
            var x3 = .3 * target.y - .3 * source.y + .8 * source.x + .2 * target.x;
            var y3 = .8 * source.y + .2 * target.y - .3 * target.x + .3 * source.x;
            var x4 = .3 * target.y - .3 * source.y + .2 * source.x + .8 * target.x;
            var y4 = .2 * source.y + .8 * target.y - .3 * target.x + .3 * source.x;
            contexte.bezierCurveTo(x3,y3,x4,y4,target.x,target.y);
        }
    } else {
        contexte.lineTo(target.x,target.y);
    }
    contexte.stroke();
}
var frameCount =0;
function traceMap(now) {
    //updateWorkspaceBounds();
    if(!GexfJS.running) {
        return;
    }
    requestAnimationFrame(traceMap);
    frameCount++;
    if(frameCount%3==0) {
        return;
    }
    

    if (!GexfJS.graph) {
        return;
    }
    


    var _identical = GexfJS.areParamsIdentical;
    GexfJS.params.mousePosition = ( GexfJS.params.useLens ? ( GexfJS.mousePosition ? ( GexfJS.mousePosition.x + "," + GexfJS.mousePosition.y ) : "out" ) : null );
    for (var i in GexfJS.params) {
        _identical = _identical && ( GexfJS.params[i] == GexfJS.oldParams[i] );
    }
    _identical = GexfJS.forceReDraw ? false : _identical;
    if (_identical) {

        return;
    } else {
        for (var i in GexfJS.params) {
            GexfJS.oldParams[i] = GexfJS.params[i];
        }
    }
    

    GexfJS.forceReDraw = false;
    
    //GexfJS.echelleGenerale = Math.pow( Math.SQRT2, GexfJS.params.zoomLevel );
    GexfJS.decalageX = ( GexfJS.graphZone.width / 2 ) - ( GexfJS.params.centreX * GexfJS.echelleGenerale );
    GexfJS.decalageY = ( GexfJS.graphZone.height / 2 ) - ( GexfJS.params.centreY * GexfJS.echelleGenerale );
    
    var _sizeFactor = GexfJS.echelleGenerale * Math.pow(GexfJS.echelleGenerale, -.15),
        _edgeSizeFactor = _sizeFactor * GexfJS.params.edgeWidthFactor,
        _nodeSizeFactor = _sizeFactor * GexfJS.params.nodeSizeFactor,
        _textSizeFactor = 1;
    
    GexfJS.ctxGraphe.fillStyle = GexfJS.bgColor;
    GexfJS.ctxGraphe.fillRect(0, 0, GexfJS.graphZone.width, GexfJS.graphZone.height);


    if (GexfJS.params.useLens && GexfJS.mousePosition) {
        GexfJS.ctxGraphe.strokeStyle = "#2c3e50";
        GexfJS.ctxGraphe.lineWidth = 4;
        GexfJS.ctxGraphe.fillStyle = "rgba(0,0,0,0.2)";
        GexfJS.ctxGraphe.beginPath();
        GexfJS.ctxGraphe.arc( GexfJS.mousePosition.x , GexfJS.mousePosition.y , GexfJS.lensRadius , 0 , Math.PI*2 , true );
        GexfJS.ctxGraphe.closePath();
        GexfJS.ctxGraphe.fill();
        GexfJS.ctxGraphe.stroke();
    }
    
    var _centralNode = ( ( GexfJS.params.activeNode != -1 ) ? GexfJS.params.activeNode : GexfJS.params.currentNode );

    for (var i in GexfJS.graph.nodeList) {
        var _d = GexfJS.graph.nodeList[i];
        _d.coords.actual = {
            x : GexfJS.echelleGenerale * _d.coords.base.x + GexfJS.decalageX,
            y : GexfJS.echelleGenerale * _d.coords.base.y + GexfJS.decalageY,
            r : _nodeSizeFactor * _d.coords.base.r 
        }
        _d.withinFrame = ( ( _d.coords.actual.x + _d.coords.actual.r > 0 ) && ( _d.coords.actual.x - _d.coords.actual.r < GexfJS.graphZone.width ) && ( _d.coords.actual.y + _d.coords.actual.r > 0) && (_d.coords.actual.y - _d.coords.actual.r < GexfJS.graphZone.height) );
        _d.visible = ( GexfJS.params.currentNode == -1 || i == _centralNode || GexfJS.params.showEdges );
    }
    
    var _tagsMisEnValeur = [];
    
    if ( _centralNode != -1 ) {
        _tagsMisEnValeur = [ _centralNode ];
    }
    
    var _displayEdges = ( GexfJS.params.showEdges && GexfJS.params.currentNode == -1 );
    


    for (var i in GexfJS.graph.edgeList) {
        var _d = GexfJS.graph.edgeList[i],
            _six = _d.source,
            _tix = _d.target,
            _ds = GexfJS.graph.nodeList[_six],
            _dt = GexfJS.graph.nodeList[_tix];
        var _isLinked = false;
        if (_centralNode != -1) {
            if (_six == _centralNode) {
                _tagsMisEnValeur.push(_tix);
                _coulTag = _dt.color.base;
                _isLinked = true;
                _dt.visible = true;
            }
            if (_tix == _centralNode) {
                _tagsMisEnValeur.push(_six);
                _coulTag = _ds.color.base;
                _isLinked = true;
                _ds.visible = true;
            }
        }

        if ( ( _isLinked || _displayEdges ) && ( _ds.withinFrame || _dt.withinFrame ) &&  _ds.visible && _dt.visible ) {
            GexfJS.ctxGraphe.lineWidth = _edgeSizeFactor * _d.width;
            var _coords = ( ( GexfJS.params.useLens && GexfJS.mousePosition ) ? calcCoord( GexfJS.mousePosition.x , GexfJS.mousePosition.y , _ds.coords.actual ) : _ds.coords.actual );
            _coordt = ( (GexfJS.params.useLens && GexfJS.mousePosition) ? calcCoord( GexfJS.mousePosition.x , GexfJS.mousePosition.y , _dt.coords.actual ) : _dt.coords.actual );
            GexfJS.ctxGraphe.strokeStyle = ( _isLinked ? _d.color : _centralNode != -1 ? "rgba(240,240,240,1)" : _d.color );
            traceArc(GexfJS.ctxGraphe, _coords, _coordt);
        }
    }
    
    
    if (_centralNode != -1) {
        var _dnc = GexfJS.graph.nodeList[_centralNode];
        _dnc.coords.real = ( (GexfJS.params.useLens && GexfJS.mousePosition ) ? calcCoord( GexfJS.mousePosition.x , GexfJS.mousePosition.y , _dnc.coords.actual ) : _dnc.coords.actual );
    }

    var ctx = GexfJS.ctxGraphe;
    var mpi2 = Math.PI*2;
    
    for (var i in GexfJS.graph.nodeList) {
        var _d = GexfJS.graph.nodeList[i];
        if (_d.visible && _d.withinFrame) {
            if (i != _centralNode) {
                _d.coords.real = ( ( GexfJS.params.useLens && GexfJS.mousePosition ) ? calcCoord( GexfJS.mousePosition.x , GexfJS.mousePosition.y , _d.coords.actual ) : _d.coords.actual );
                _d.isTag = ( _tagsMisEnValeur.indexOf(parseInt(i)) != -1 );
                var _isLinked = ( _tagsMisEnValeur.length && !_d.isTag );
                ctx.fillStyle = ( _isLinked ? _d.color.gris : _d.color.base );  
                ctx.beginPath();
                ctx.arc( _d.coords.real.x , _d.coords.real.y , _d.coords.real.r+2 , 0 , mpi2 , true );
                ctx.closePath();
                ctx.fill();
                // //ctx.shadowColor = 'rgba(0,0,0,.1)';
                // //ctx.shadowBlur = 8;
                // //ctx.shadowOffsetX = 0;
                // //ctx.shadowOffsetY = 0;
                 
                
                if(_d.image.loaded) {
                    var img = _d.image;
                    ctx.save();
                    ctx.beginPath();
                    ctx.arc(_d.coords.real.x, _d.coords.real.y, _d.coords.real.r, 0, Math.PI * 2, true);
                    ctx.closePath();
                    ctx.clip();
                    
                    calcImageSize(_d,_d.coords.real.r);
                    //log(img.w,img.h);
                    ctx.drawImage(img.img,Math.floor(_d.coords.real.x+img.marginX),Math.floor(_d.coords.real.y+img.marginY),img.w,img.h);
                    

                    //ctx.beginPath();
                    // ctx.arc(_d.coords.real.x, _d.coords.real.y, _d.coords.real.r*1.5, 0, Math.PI * 2, true);
                    // ctx.clip();
                    // ctx.closePath();
                    ctx.restore();
                    // // //
                    
                    // ctx.beginPath();
                    // ctx.strokeStyle = ctx.fillStyle;
                    // ctx.lineWidth = 2;
                    // ctx.arc( _d.coords.real.x , _d.coords.real.y ,_d.coords.real.r , 0 , Math.PI*2 , true );
                    // ctx.closePath();
                    // ctx.stroke();


                    // if(_isLinked) {
                    //     ctx.beginPath();
                    //     ctx.fillStyle =  _d.color.overlay;
                    //     ctx.arc( _d.coords.real.x , _d.coords.real.y ,_d.coords.real.r , 0 , Math.PI*2 , true );
                    //     ctx.closePath();
                    //     ctx.fill();
                    // }
                    
                }
            }
        }
    }
    //
    
    ctx.fill();
    

    if (_centralNode != -1) {

        GexfJS.ctxGraphe.fillStyle = _dnc.color.active;
        GexfJS.ctxGraphe.beginPath();
        _dnc.coords.real.r*=1.2;
        GexfJS.ctxGraphe.arc( _dnc.coords.real.x , _dnc.coords.real.y , _dnc.coords.real.r , 0 , Math.PI*2 , true );
        GexfJS.ctxGraphe.closePath();
        GexfJS.ctxGraphe.fill();
        GexfJS.ctxGraphe.strokeStyle = _dnc.color.active;
        GexfJS.ctxGraphe.stroke();
        if(_dnc.image.loaded) {
            var img = _dnc.image;
            ctx.save();
            ctx.beginPath();
            ctx.arc(_dnc.coords.real.x, _dnc.coords.real.y, _dnc.coords.real.r, 0, Math.PI * 2, true);
            ctx.closePath();
            ctx.clip();
            calcImageSize(_dnc,_dnc.coords.real.r);
            ctx.drawImage(img.img,_dnc.coords.real.x+img.marginX,_dnc.coords.real.y+img.marginY,img.w,img.h);
            //ctx.drawImage(thumbImg, 0, 0, 50, 50);

            ctx.beginPath();
            ctx.arc(_dnc.coords.real.x, _dnc.coords.real.y, _dnc.coords.real.r, 0, Math.PI * 2, true);
            ctx.clip();
            ctx.closePath();
            ctx.restore();
            //
            ctx.beginPath();
            ctx.strokeStyle = ctx.fillStyle;
            ctx.lineWidth = 2;
            ctx.arc( _dnc.coords.real.x , _dnc.coords.real.y ,_dnc.coords.real.r , 0 , Math.PI*2 , true );
            ctx.closePath();
            ctx.stroke();
        }
        
         var _fs = Math.max(GexfJS.params.textDisplayThreshold + 2, _dnc.coords.real.r * _textSizeFactor) + 2;
        _fs = Math.min(_fs,14);
        ctx.font = "300 " + Math.floor( _fs )*1+"px colfax";
        ctx.textAlign = "left";
        ctx.textBaseline = "middle";
        

        if(_dnc.label.length > 30) {
            _dnc.label = _dnc.label.substr(0,30)+"…";
        }
        var width = ctx.measureText(_dnc.label).width+20;
        width = Math.max(80,width);
        ctx.beginPath();
        ctx.rect( Math.floor(_dnc.coords.real.x-_dnc.coords.real.r-20) , Math.floor(_dnc.coords.real.y-_dnc.coords.real.r-30) , width , 24 );
        ctx.closePath();
        ctx.fill();
        
        ctx.beginPath();
        ctx.moveTo(_dnc.coords.real.x,_dnc.coords.real.y-_dnc.coords.real.r-8);
        ctx.lineTo(_dnc.coords.real.x,_dnc.coords.real.y-_dnc.coords.real.r);
        ctx.lineTo(_dnc.coords.real.x+10,_dnc.coords.real.y-_dnc.coords.real.r-8);
        ctx.fill();

       
        ctx.fillStyle = "rgba(255,255,255,1)";
        //ctx.fillStyle = "#ccc";
        ctx.fillText(_dnc.label, _dnc.coords.real.x-_dnc.coords.real.r+10-20, _dnc.coords.real.y-_dnc.coords.real.r-17);
    }
    

    GexfJS.ctxMini.putImageData(GexfJS.imageMini, 0, 0);
    var _r = GexfJS.overviewScale / GexfJS.echelleGenerale,
        _x = - _r * GexfJS.decalageX,
        _y = - _r * GexfJS.decalageY,
        _w = _r * GexfJS.graphZone.width,
        _h = _r * GexfJS.graphZone.height;
    
    GexfJS.ctxMini.strokeStyle = "#CCC";
    GexfJS.ctxMini.lineWidth = 2;
    GexfJS.ctxMini.fillStyle = "rgba(250,250,250,.5)";
    GexfJS.ctxMini.beginPath();
    GexfJS.ctxMini.fillRect( _x, _y, _w, _h );
    GexfJS.ctxMini.strokeRect( _x, _y, _w, _h );

    
}
//var FPS = new FPSMeter({top:"60px",heat:1,graph:1});

function hoverAC() {
    $("#autocomplete li").removeClass("hover");
    $("#liac_"+GexfJS.autoCompletePosition).addClass("hover");
    GexfJS.params.activeNode = GexfJS.graph.nodeIndexByLabel.indexOf( $("#liac_"+GexfJS.autoCompletePosition).text().toLowerCase() );
}

function changePosAC(_n) {
    GexfJS.autoCompletePosition = _n;
    hoverAC();
}
function calcImageSize(n,s) {
        var sw = 0,
        sh = 0;
        s = s ? s*2 : 80;
        var w = n.image.ow;
        var h = n.image.oh;
        if(w>h) {
            sh = s;
            sw = s/h*w;
        } else {
            sw = s;
            sh = s/w*h;
        }
        n.image.w = Math.floor(sw);
        n.image.h = Math.floor(sh);
        n.image.marginX = Math.floor(-(sw)/2)
        n.image.marginY = Math.floor(-(sh)/2)
}
function updateAutoComplete(_sender) {
    var _val = $(_sender).val().toLowerCase();
    var _ac = $("#autocomplete");
    if (_val != GexfJS.dernierAC || _ac.html() == "") {
        GexfJS.dernierAC = _val;
        var _strAC = "<div><ul>";
        var _n = 0;
        for (var i in GexfJS.graph.nodeIndexByLabel) {
            var _l = GexfJS.graph.nodeIndexByLabel[i];
            if (_l.search(_val) != -1) {
                _strAC += '<li id="liac_' + _n + '" onmouseover="changePosAC(' + _n + ')"><a href="#" onclick="displayNode(\'' + i + '\', true); return false;"><span>' + GexfJS.graph.nodeList[i].label + '</span></a>';
                _n++;
            }
            if (_n >= 20) {
                break;
            }
        }
        GexfJS.autoCompletePosition = 0;
        _ac.html(_strAC + "</ul></div>");
    }
    hoverAC();
    _ac.show();
}

function updateButtonStates() {
    if(GexfJS.params.useLens) {
        $("#lensButton").removeClass("dark")
    } else {
        $("#lensButton").addClass("dark")
    }
    if(GexfJS.params.showEdges) {
        $("#edgesButton").removeClass("dark")
    } else {
        $("#edgesButton").addClass("dark")
    }
    
}

function setParams(paramlist) {
    for (var i in paramlist) {
        GexfJS.params[i] = paramlist[i];
    }
}
function playGEXFJS() {
    GexfJS.running = true;
    requestAnimationFrame(traceMap);
}
function pauseGEXFJS() {
    GexfJS.running = false;
}
function stopGEXFJS() {
    GexfJS.running = false;
    $(document).off("click.semantic");
    $("#overview").off();
    $("#searchinput").off();
    $("#carte").off();

    $("#zoomMinusButton").off();
    $("#zoomPlusButton").off();
    $("#recherche").off();
    $("#lensButton").off();
    $("#edgesButton").off();
}
function initGEXFJS(opts) {

    GexfJS.params = {
        graphFile : "",
        showEdges : true,
        useLens : false,
        zoomLevel : .5,
        curvedEdges : true,
        edgeWidthFactor : .1,
        minEdgeWidth : 1,
        maxEdgeWidth : 2,
        textDisplayThreshold: 13,
        nodeSizeFactor : 2,
        replaceUrls : true,
        showEdgeWeight : false,
        language: "de",
        centreX : 400,
        centreY : 350,
        activeNode : -1,
        currentNode : -1
    }
    
    GexfJS.echelleGenerale = Math.pow( Math.SQRT2, GexfJS.params.zoomLevel );
    GexfJS.running = true;

    $.extend(GexfJS.params,opts);

    var lang = (
        typeof GexfJS.params.language != "undefined" && GexfJS.params.language
        ? GexfJS.params.language
        : (
            navigator.language
            ? navigator.language.substr(0,2).toLowerCase()
            : (
                navigator.userLanguage
                ? navigator.userLanguage.substr(0,2).toLowerCase()
                : "en"
            )
        )
    );
    GexfJS.lang = (GexfJS.i18n[lang] ? lang : "en");
    GexfJS.bgColor = $("body").css("background-color")
    
    if ( !document.createElement('canvas').getContext ) {
        $("#bulle").html('<p><b>' + strLang("browserErr") + '</b></p>');
        return;
    }
    
    updateButtonStates();
    
    GexfJS.ctxGraphe = document.getElementById('carte').getContext('2d');
    GexfJS.ctxMini = document.getElementById('overview').getContext('2d');

    offsetLeft = $("#carte").offset().left;
    offsetTop = $("#carte").offset().top;

    updateWorkspaceBounds();
    
    initializeMap();
    
    $("#searchinput")
        .focus(function() {
            if ( $(this).is('.grey') ) {
                $(this).val('').removeClass('grey');
            }
        })
        .keyup(function(evt) {
            updateAutoComplete(this);
        }).keydown(function(evt){
            var _l = $("#autocomplete li").length;
            switch (evt.keyCode) {
                case 40 :
                    if (GexfJS.autoCompletePosition < _l - 1) {
                        GexfJS.autoCompletePosition++;
                    } else {
                        GexfJS.autoCompletePosition = 0;
                    }
                break;
                case 38 :
                    if (GexfJS.autoCompletePosition > 0) {
                        GexfJS.autoCompletePosition--;
                    } else {
                        GexfJS.autoCompletePosition = _l - 1;
                    }
                break;
                case 27 :
                    $("#autocomplete").slideUp();
                break;
                case 13 :
                    if ($("#autocomplete").is(":visible")) {
                        var _liac = $("#liac_"+GexfJS.autoCompletePosition);
                        if (_liac.length) {
                            $(this).val(_liac.find("span").text());
                        }
                    }
                break;
                default :
                    GexfJS.autoCompletePosition = 0;
                break;
            }
            updateAutoComplete(this);
            if (evt.keyCode == 38 || evt.keyCode == 40) {
                return false;
            }
        });
    $("#recherche").submit(function() {
        if (GexfJS.graph) {
            displayNode( GexfJS.graph.nodeIndexByLabel.indexOf($("#searchinput").val().toLowerCase()), true);
        }
        return false;
    });
    $("#carte")
        .mousemove(onGraphMove)
        .click(onGraphClick)
        .mousedown(startMove)
        .mouseout(function() {
            GexfJS.mousePosition = null;
            endMove();
        })
        .mousewheel(onGraphScroll);
    $("#overview")
        .mousemove(onOverviewMove)
        .mousedown(startMove)
        .mouseup(endMove)
        .mouseout(endMove)
        .mousewheel(onGraphScroll);

    $("#zoomMinusButton").click(function() {
        GexfJS.params.zoomLevel = Math.max( GexfJS.minZoom, GexfJS.params.zoomLevel - 1);
        GexfJS.echelleGenerale = Math.pow( Math.SQRT2, GexfJS.params.zoomLevel );
        //$("#zoomSlider").val(GexfJS.params.zoomLevel);
        return false;
    })
        .attr("title", strLang("zoomOut"));
    $("#zoomPlusButton").click(function() {
        GexfJS.params.zoomLevel = Math.min( GexfJS.maxZoom, GexfJS.params.zoomLevel + 1);
        GexfJS.echelleGenerale = Math.pow( Math.SQRT2, GexfJS.params.zoomLevel );
        //$("#zoomSlider").val(GexfJS.params.zoomLevel);
        return false;
    })
        .attr("title", strLang("zoomIn"));
    $(document).on("click.semantic",function(evt) {
        $("#autocomplete").slideUp();
    });
    
    $("#lensButton").on("click.semantic",function () {
        GexfJS.params.useLens = !GexfJS.params.useLens;
        updateButtonStates();
        return false;
    });
    $("#edgesButton").on("click.semantic",function () {
        GexfJS.params.showEdges = !GexfJS.params.showEdges;
        updateButtonStates();
        return false;
    });
    $("#aUnfold").on("click.semantic",function() {
        var _cG = $("#leftcolumn");
        if (_cG.offset().left < 0) {
            _cG.animate({
                "left" : "0px"
            }, function() {
                $("#aUnfold").attr("class","leftarrow");
                $("#zonecentre").css({
                    left: _cG.width() + "px"
                });
            });
        } else {
            _cG.animate({
                "left" : "-" + _cG.width() + "px"
            }, function() {
                $("#aUnfold").attr("class","rightarrow");
                $("#zonecentre").css({
                    left: "0"
                });
            });
        }
        return false;
    });
}

