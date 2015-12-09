/*
 ## ERROR
 - after recalculating the network (selecting a keyword) does not show any graph
 ## todo
 - highligh objects in network
 - show calculation display
 */
define(['jquery', 'Handlebars','semantic-canvas','text!templates/semantic-view.hbs','text!templates/semantic-popup.hbs','text!templates/gephi-node.hbs','text!templates/gephi-edge.hbs','i18n!nls/texts','spin','sigma', 'foundation', 'jquery.cookie','sigma.force','jquery.mousewheel'],
	function ($, _H,_G,_gephiview_template,_popuptemplate,_nodetemplate,_edgetemplate,_texts,S)
	{

		return function semanticnetwork()
		{
			var self = this;
			var created = false;
			this.data = null;
			this.WALL;
			this.CURWIDTH;
			this.GRIDWIDTH;
			this.LISTWIDTH;
			this.CURSIZE;
			this.CURMODE = "grid";
			this.EDGES = new Array();
			this.EDGEHASH = {};
			this.NODES = new Array();
			this.NODEHASH = {};
			this.SUBJECTS = new Array();
			this.SUBJECTHASH = {};
			this.nodecount = 1;
			this.cw = 100;
			this.ch = 100;
			this.color1 = "#AAA";
			var SIGMA;
			var dataMan = null;
			var currentObject;
			this.dom = null;

			this.name = 'semantic';

			this.create = function ()
			{

				if (self.dom != null) {
					self.dom.remove();
			  }

				$(dataMan).on('changeDisplayed.ph-plus', self.updateData);
				$("body").on("scroll.semantic",function(e){
					e.preventDefault();
				})
				$(window).on("openPopup.ph-plus-semantic",function(e,d){
					self.openPopup(e,d)
				}).on("closePopup.ph-plus-semantic",function(e,d){
					self.closePopup(e,d)
				});

				self.updateData();
				created = true;
			};

			this.updateData = function()
			{
				$('#mainsection').empty();
				
				//$("#container").remove();
				var container = $('<div id="container"/>');
				
				$('#mainsection').append(container);
				$("#container").show();
				self.s = new S().spin();
				$("#container").append(self.s.el);			
				resourceMan.setResource("semantic",self);
				self.calculateGraph();

				var main = _H.compile(_gephiview_template);
				self.dom = $(main());				
			};

			this.loadCollectionMembersDataFinished = function() {
			};

			this.init = function(GEXF){
				$('#container').append(self.dom);
				initGEXFJS({graphXML:GEXF});

				$('#container').fadeIn(500);
			}

			this.openPopup = function(e,d) {
				$(".semantic-popup").remove();
				var pop = _H.compile(_popuptemplate);
				var c = d.coords.actual;
				var x = c.x-220;
				var y = c.y;
				
				if(self.NODEHASH[d.id].type != "term") {
					var dom = pop(self.NODEHASH[d.id].data.data);
					var obj = self.NODEHASH[d.id].data.data;
				} else {
					var dom = pop({"label":self.NODEHASH[d.id].label,"description":""})
				}
				dom = $(dom);
				if (_standalone) {
					dom.find('a.collection-image').remove();
				}
				dom.css("left",x+"px");
				dom.css("top",y+"px");
				dom.addClass("semantic-popup")
				$("#container").append(dom);
				dom.css("margin-top",-dom.height()-10+"px");

				if(obj) {
					this.enablePopupActions(obj)
				}
			}	
			this.closePopup = function(e,d) {
				$(".semantic-popup").remove();
			}

			this.randx = function(){
				return Math.random()*self.cw;
			}
			this.randy = function(){
				return Math.random()*self.ch;
			}
			
			this.show = function(d)
			{
				if (typeof d != 'undefined' && d != null) {
					dataMan = d;

				} else {
					dataMan = resourceMan.getResource('gsaData');
				}

				resourceMan.setConfig('*', 'semanticView', {
					'deps': ['components/sidebar', 'components/semanticnetwork'],
					'open': { 'scope': self, 'func': self.show },
					'close': { 'scope': self, 'func': self.close }
				});

				resourceMan.setConfig('dataManaged', 'default', {
					'deps': ['components/semanticnetwork'],
					'open': { 'scope': self, 'func': self.show },
					'close': { 'scope': self, 'func': self.close }
				});

				if ($("#search-canvas").hasClass("open")) {
					$("#searchdropdown").trigger("click");
				}

				$("html").addClass("semanticView");

				if (created == false) {
					self.create();
				}
				
				playGEXFJS();

				$("#container").fadeIn(400, function() {
					resourceMan.getResource('sidebar').show();
				});

	      $(resourceMan.getResource('slideshow'))
	      	.off('.ph-plus-semantic')
	      	.on('slideshowOpen.ph-plus-semantic', function() {
						$('#mainsection').fadeOut(400);
						return false;
	      	})
	      	.on('slideshowClose.ph-plus-semantic', function() {
						$('#mainsection').fadeIn(400);
						return false;
	      	});

			};

			this.createGEXF = function() {
				var gexf = "<?xml version='1.0'?>";
				gexf+='<gexf xmlns="http://www.gexf.net/1.2draft" version="1.2" xmlns:viz="http://www.gexf.net/1.2draft/viz" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xsi:schemaLocation="http://www.gexf.net/1.2draft http://www.gexf.net/1.2draft/gexf.xsd">';
				gexf += '<graph defaultedgetype="undirected" mode="static">';

				gexf += "<nodes>";
				var nodes = self.SIGMA._core.graph.nodes;
				var gn = _H.compile(_nodetemplate);
				for (var i = nodes.length - 1; i >= 0; i--) {
					var n = nodes[i];
					
					if(n.attr && n.attr.data) {
						n.preview = n.attr.data.data.preview.replace("/480","/80");
					}
					log(n.preview)
					n.type = n.attr.type;
					n.nid = n.attr.nid;
					var rgb = sigma.tools.getRGB(n.color);
					n.r = rgb.r;
					n.g = rgb.g;
					n.b = rgb.b;
					var xml = gn(n);
					gexf += xml;
				};
				gexf += "</nodes>";
				nodes = null;
				gn = null;

				gexf += "<edges>";
				var edges = self.SIGMA._core.graph.edges;
				var en = _H.compile(_edgetemplate);
				for (var i = edges.length - 1; i >= 0; i--) {
					var e = edges[i];
					var ec = {
							id:e.id,
							source:e.source.id,
							target:e.target.id
					};
					var xml = en(ec);
					gexf += xml;
				};
				gexf += "</edges>";
				gexf+='</graph></gexf>';
				//log(gexf);
				return gexf;

			}

			this.calculateGraph = function (){
				self.color1 = $(".top-bar .active").css("color");
				var container = $('#container');
				container.css("width","100%");
				container.height($(window).height()-55);
				
				container.css("margin","0");
				
				var sigRoot = document.getElementById('container');
				self.SIGMA = sigma.init(sigRoot);
				container.find("canvas").css("opacity",0);

				self.cw = container.width();
				self.ch = container.height();
				var objs = dataMan.getObjects();
				self.NODEHASH = {};
				self.SUBJECTHASH = {};
				self.NODES = [];
				self.EDGES = [];
				self.NODEEDGES = {};
				
				$(objs).each(function (i, e) {
					
					var node = {id:self.nodecount,label:e.data.title,nid:e.data.pid,type:"node",x:self.randx(),y:self.randy(),size:3,color:'#AAA',data:e};
					self.NODES.push(node);
					self.NODEHASH["h"+node.id] = self.NODES[self.NODES.length-1];
					self.nodecount++;
					for (var i = e.data.subject.length - 1; i >= 0; i--) {
						var sub = e.data.subject[i];
						if(!sub || !sub.taxon) continue;
						var path = sub.taxon;
						if(!path || !path.length) continue;
						if (typeof path == "string") {
							path = [path];
						}
						for (var k = path.length - 1;k >= path.length - 3;k--) {
							var term = path[k];
							if($.trim(term).length < 4) {
								continue;
							}
							if(!self.SUBJECTHASH["h"+term]) {
								var termNode= {id:self.nodecount,label:term,nid:term,type:"term",x:self.randx(),y:self.randy(),size:1,color:"#0173CA"};//C94504
								self.NODES.push(termNode);
								if(!self.NODEEDGES["h"+termNode.id]) {
									self.NODEEDGES["h"+termNode.id] = 0;
								}
								self.NODEHASH["h"+termNode.id] = self.NODES[self.NODES.length-1];
								self.SUBJECTHASH["h"+term]= self.NODES[self.NODES.length-1];
								self.NODEEDGES["h"+termNode.id]++;
								self.nodecount++;
							} else {
								var termNode = self.SUBJECTHASH["h"+term];
								if(!self.NODEEDGES["h"+termNode.id]) {
									self.NODEEDGES["h"+termNode.id] = 0;
								}
								self.NODEEDGES["h"+termNode.id]++;
							}

							if(termNode && termNode.id) {
								self.EDGES.push({source:node.id,target:termNode.id});
							}
						}
					};
				});

				for (var i = self.NODES.length - 1; i >= 0; i--) {
					var n = self.NODES[i];

					if(n.type == "term" && self.NODEEDGES["h"+n.id] && self.NODEEDGES["h"+n.id] > 1) {
						self.SIGMA.addNode("h"+n.id,n);
					} else if(n.type == "term") {
						delete self.NODEHASH["h"+n.id]
					} else if(n.type == "node") {
						self.SIGMA.addNode("h"+n.id,n);	
					}
					//self.SIGMA.addEdge(i,"h"+n.id,"h"+search.id,{color:"#BDC3C7"});
					
				};
				
				for (var i = self.EDGES.length - 1; i >= 0; i--) {
					var e = self.EDGES[i];					
					if((self.NODEHASH["h"+e.source] && self.NODEHASH["h"+e.target])) {
						if(e.source && e.target) self.SIGMA.addEdge(i,"h"+e.source,"h"+e.target,{color:"#BDC3C7"});
					}
				};

				self.SIGMA.drawingProperties({
				  defaultLabelColor: '#ccc',
				  font: 'Arial',
				  edgeColor: 'source',
				  defaultEdgeType: 'curve'
				}).graphProperties({
				  minNodeSize: 2,
				  maxNodeSize: 16
				});
				
				self.SIGMA.startForceAtlas2({
					 adjustSizes:true
					//, barnesHutOptimize:true
					, gravity:.1
					, outboundAttractionDistribution:false
					, jitterTolerance:.1
				});
				self.intervalCount = 0;
				self.stopRender = false;
				window.requestAnimationFrame(self.render);

				setTimeout(function(){
					self.stopRender = true;
				},3000)
				//},300)

			}
			this.render = function(){
				//self.interval = setInterval(function(){
				if(!self.dom) {
					return;
				}
				var i = 0;
				while(i < 100) {
					self.SIGMA.step();
					self.intervalCount++;
					i++;
				}
				
				if(self.intervalCount > 4000 || self.stopRender) {

					self.SIGMA.stopForceAtlas2();
					self.SIGMA.refresh();
					var gexf = self.createGEXF();
					self.SIGMA.emptyGraph();
					$("#container").empty();
					self.init(gexf);
				} else {
					window.requestAnimationFrame(self.render);
				}
					
			};
			this.enablePopupActions = function(obj)
				{
					currentObject = obj;
					enabledObject = obj;

					$(".image").unbind("click");
					
					$(".image, a.full-image").on("click",function(e) {
						$("html").addClass("singleView");
						var data = currentObject;
						e.preventDefault();
						$(window).trigger("openSingleView",[data]);
						return false;
					});

					$("a.mark-image").unbind("click");
					$("a.mark-image").on("click",function (e) {
						var unmark = !!dataMan.isMarked(currentObject.pid);
						$(".tooltip").hide();
						$(this).toggleClass("dark");
						dataMan.markObject(currentObject.pid, unmark);
						return false;
					});

					if (!_standalone) {
						$("a.collection-image").unbind("click");
						$("a.collection-image").on("click",function(e) {
							$(".tooltip").hide();
							$(window).trigger('addToCollection', [currentObject]); // TODO: create Collection event
							return false;
						});
					}

					$("a.download-image").unbind("click");
					$("a.download-image").on("click", function (e) {
						$(window).trigger('downloadSingleObject', [currentObject]); // TODO: create event handler
						return false;
					});
				};


			this.close = function (newState)
			{
				$("#container").hide();
				$("html").removeClass("semanticView");
				
				$(dataMan).off('.ph-plus');
				resourceMan.getResource('sidebar').setImageResizeListener(null);
				pauseGEXFJS();

				resourceMan.getResource('slideshow').destroySlideshow();
				$(resourceMan.getResource('slideshow')).off(".ph-plus-semantic");

				if (newState == 'openSingleView') {
					return;
				}

				stopGEXFJS();
				$("body").off("scroll.semantic");
				resourceMan.setResource("semantic",null);
				$(window).off(".ph-plus-semantic");

				if(self.dom) { self.dom.remove(); }
				self.dom = null;
				
				$('#mainsection').empty();
				created = false;

				
				resourceMan.setConfig('*', 'semanticView', {
					'deps': ['components/semanticnetwork'],
					'open': { 'scope': 'components_semanticnetwork', 'func': 'show' },
					'close': { 'scope': 'components_semanticnetwork', 'func': 'close' },
				});


			};
			this.translate = function(term)
			  {
			    if (typeof _texts[term] != 'undefined') {
			      return _texts[term];
			    } else {
			      return term;
			    }      
			  };

			_H.registerHelper('translate', self.translate);
			
		}
	});