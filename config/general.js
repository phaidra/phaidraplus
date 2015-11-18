define(function () {
	
	return {
		'defaultRepository': 0,
		'imageServices' : {
			'phaidraproduction': "https://phaidra.univie.ac.at/",
			'phaidratemp': "https://phaidra-temp.univie.ac.at/",
		},
		'maxInmetaLength': 128,
		'maxQueryLength': (2048),
		'minQueryLength': 142,
		'repositories' : ['PhaidraProduction', 'PhaidraTemp'],
		'repositoryMeta' : 'installationID',
	};
});