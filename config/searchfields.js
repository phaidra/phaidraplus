define(function() {
	return {
		//'alttitle' : new String(), // alternative Titles
		/*'author' : {
								'type' : 'Object',
								'template': { 'forename': '', 'lastname': '' },
								'combinedInput' : true,
							},*/
		'copyright' : {
			'type': 'radio',
			'template': {
				'Ja': 'yes',
				'Nein': 'no'
			}
		},
		//'costs' : new Boolean(),
		//'coverage' : new String(),
		//'datapool' : { 'name': '' }, // attribution to certain organisations
		//'desc' : new String(), // description
		'filesize' : {
			'type': 'Number',
			'min': 0,
		},
		//'height' : new Number(), // height of the image - ? image_height???
		'identifiers' : new String(), // identifiers (like ISBN, DOI)
		'image_height' : {  // object ID - verified
			'type': 'Number',
			'min': 0,
		},
		'image_width' : {  // object ID - verified
			'type': 'Number',
			'min': 0,
		},
		//'inscription' : new String(),
		'keywords' : new String(), // - verified
		'license' : { // - verified
			'template': [
				'Alle Rechte vorbehalten',
				'GPLv3',
				'Public Domain Marke',
				{ 'Namensnennung 2.0': [
						'Namensnennung 2.0 Österreich',
						'Keine kommerzielle Nutzung 2.0 Österreich',
						'Keine kommerzielle Nutzung-Keine Bearbeitung 2.0 Österreich',
						'Keine kommerzielle Nutzung-Weitergabe unter gleichen Bedingungen 2.0 Österreich',
						'Keine Bearbeitung 2.0 Österreich',
						'Weitergabe unter gleichen Bedingungen 2.0 Österreich'
					]},
				{ 'Namensnennung 3.0': [
						'Namensnennung 3.0 Österreich',
						'Keine kommerzielle Nutzung 3.0 Österreich',
						'Keine kommerzielle Nutzung - Keine Bearbeitungen 3.0 Österreich',
						'Keine kommerzielle Nutzung - Weitergabe unter gleichen Bedingungen 3.0 Österreich',
						'Keine Bearbeitungen 3.0 Österreich',
						'Weitergabe unter gleichen Bedingungen 3.0 Österreich'
					]},
				{	'Namensnennung 4.0': [
						'Namensnennung 4.0 International',
						'Nicht-kommerziell 4.0 International',
						'Nicht-kommerziell - Keine Bearbeitungen 4.0 International',
						'Nicht-kommerziell - Weitergabe unter gleichen Bedingungen 4.0 International',
						'Keine Bearbeitung 4.0 International',
						'Weitergabe unter gleichen Bedingungen 4.0 International'
					]}
			],
			'type': 'Enum',
		}, // ???
		//'members' : new Number(),
		//'obj_date' : new Date(), // date of the object (if any)
		//'peer_reviewed' : new Boolean(),
		'pid' : {  // object ID - verified
			'type': 'Number',
			'exact': true,
			'pattern': '[0-9]',
			'min': 0,
		},
		'status' : { // - verified ? other values than allowed
								'type' : 'Enum',
								'template' : [null, 'published', 'unpublished']
							}, // null, published, unpublished
		'subject' : { 'name': '' }, // classifications - verified ? structure ?
		//'subtitle' : new String(), // subtitle_de available but not working with subtitle
		'subtitle_de' : new String(), // subtitle_de available but not working with subtitle
		//'title' : new String(), // title_de available but not working with title
		'title_de' : new String(), // title_de available but not working with title
		'type' : new String(), // - verified ??? add autoComplete
		//'width' : new Number(), // image_width???
	};
});