define(function () {
	var states = [
		{
			'state': 'back',
			'name': 'default',
			'conf': {},
		},
		{
			'state': 'init',
			'name': 'init',
			'conf': {
				'deps': ['components/search'],
				'open': {
					'scope': 'components_search',
					'func': 'create',
				}
			}
		},
		{
			'state': 'init',
			'name': 'removeSplashEvent',
			'conf': {
				'deps': ['jquery'],
				'open': {
					'func': 'removeSplashEvent',
				}
			}
		},
		{
			'state': 'init',
			'name': 'dataMan',
			'conf': {
				'deps': ['components/data-manager'],
				'open': {
					'scope': 'components_dataManager',
					'func': 'create',
				}
			}
		},
		{
			'state': 'init',
			'name': 'collectionMan',
			'conf': {
				'deps': ['components/collection-manager', 'components/data-manager'],
				'open': {
					'scope': 'components_collectionManager',
					'func': 'create',
				}
			}
		},
		{
			'state': 'init',
			'name': 'sidebar',
			'conf': {
		 		'deps': ['components/sidebar', 'components/data-manager'],
		 		'open': {
		 			'func': 'show',
		 			'scope': 'components_sidebar',
		 		},
			}
		},
		{
			'state': 'init',
			'name': 'slideshow',
			'conf': {
				'deps': ['components/slideshow'],
				'open': {
					'scope': 'components_slideshow',
					'func': 'create',
				}
			}
		},
		{
			'state': 'openSemanticView',
			'name': 'semanticView',
			'conf': {
				'deps': ['components/sidebar', 'components/semanticnetwork'],
				'open': {
					'scope': 'components_semanticnetwork',
					'func': 'show',
				}
			}
		},		
		{
			'state': 'openGeoView',
			'name': 'geoView',
			'conf': {
				'deps': ['components/sidebar', 'components/geo-view'],
				'open': {
					'scope': 'components_geoView',
					'func': 'show',
				}
			}
		},		
		{
			'state': 'openLightRoom',
			'name': 'lightRoom',
			'conf': {
				'deps': ['components/sidebar', 'components/lightroom'],
				'open': {
					'func':'show',
					'scope':'components_lightroom'
				}
			}
		},
		{
			'state': 'openLightRoomCollections',
			'name': 'default',
			'conf': {
				'deps': ['components/lightroom-collections'],
				'open': {
					'scope': 'components_lightroomCollections',
					'func': "create"
				},
				'close': {
					'scope': 'components_lightroomCollections',
					'func': "close"
				},
			}
		},		
		{
			'state': 'openSingleView',
			'name': 'default',
			'conf': {
				'deps': ['components/single-view'],
				'open': {
					'scope': 'components_singleView',
					'func': 'show',
				},
			}
		},
		{
			'state': 'openSingleView',
			'name': 'sidebar',
			'conf': {
				'deps': ['components/sidebar', 'components/data-manager'],
				'open': {
					'func': 'hide',
					'scope': 'components_sidebar',
				},
			}
		},
		{
			'state': 'openSingleView',
			'name': 'topbar',
			'conf': {
				'deps': ['jquery'],
				'close': {
					'func': 'showTopbar',
				},
				'open': {
					'func': 'hideTopbar',
				},
			}
		}, 		
 		{
			'state': 'openTimelineView',
			'name': 'timeline',
 			'conf': {
				'deps': ['components/sidebar', 'components/timeline'],
 				'open': {
					'scope': 'components_timeline',
 					'func': 'show',
				},
 			}
 		},
		{
			'state': 'phplus-error',
			'name': 'default',
			'conf': {
				'open': {
					'func': 'displayMessage',
				},
			},
			'autorevert': true,
		},
		{
			'state': 'search',
			'name': 'default',
			'conf': {
				'deps': ['components/search-request-manager'],
				'open': {
					'func': 'startSearch',
					'scope': null,
				},
			}
		},
	];

	return states;
});