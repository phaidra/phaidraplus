require(['QUnit', '../components/search-request-manager'], function(q, srm) {
	QUnit.load();
  QUnit.start();
	module('searchRequestManager tests');

	var o = new srm();
	test('matchValueToObject', 2, function() {
	  deepEqual(o.matchValueToObject({ a:'', b:''}, { a:'b', b:'c' }),
	  					{ a:'b', b:'c' },
	  					"Objects are of same type and are accepted!");
	  deepEqual(o.matchValueToObject({ a:'', c:''}, { a:'b', b:'c' }),
	  					false,
	  					"Objects are not of same type and are rejected!");
	});

	test('matchValueToEnum', 4, function() {
	  equal(o.matchValueToEnum(['a','b',2,'d'], 2), 2, "Value is in the enum range and returned");
	  equal(o.matchValueToEnum(['a','b',2,'d'], 'd'), 'd', "Value is in the enum range and returned");
	  equal(o.matchValueToEnum(['a','b',2,'d'], 3), false, "Value is in the enum range and rejected");
	  equal(o.matchValueToEnum(['a','b',2,'d'], 'c'), false, "Value is in the enum range and rejected");
	});

	test('parseQueryParamValue', function() {
		deepEqual(o.parseQueryParamValue('author', { forename:'asdf', lastname:'qwer' }), { forename:'asdf', lastname:'qwer' }, "Setting author (Object 1) ok.");
		deepEqual(o.parseQueryParamValue('copyright', 'asdf'), 'asdf', "Setting copyright (String) ok.");
		deepEqual(o.parseQueryParamValue('costs', 'asdf'), true, "Setting costs (Boolean 1) ok.");
		deepEqual(o.parseQueryParamValue('costs', 1), true, "Setting costs (Boolean 2) ok.");
		deepEqual(o.parseQueryParamValue('costs', true), true, "Setting costs (Boolean 3) ok.");
		deepEqual(o.parseQueryParamValue('costs', false), false, "Setting costs (Boolean 4) ok.");
		deepEqual(o.parseQueryParamValue('filesize', '1234asdf'), 1234, "Setting filesize (Number 1) ok.");
		deepEqual(o.parseQueryParamValue('filesize', 'asdf1234'), null, "Setting filesize (Number 2) ok.");
		deepEqual(o.parseQueryParamValue('filesize', 1234), 1234, "Setting filesize (Number 3) ok.");
		deepEqual(o.parseQueryParamValue('status', null), null, "Setting enum (null) ok.");
		deepEqual(o.parseQueryParamValue('status', 'published'), 'published', "Setting enum ('published') ok.");
		deepEqual(o.parseQueryParamValue('status', 'unpublished'), 'unpublished', "Setting enum ('unpublished') ok.");
		deepEqual(o.parseQueryParamValue('status', 'asdf'), false, "Setting enum ('asdf') ok.");
	});

	test('setQueryParam', function() {
		o.setQueryParam('alttitle', 'asdf');
		o.setQueryParam('alttitle', 'qwer');
		o.setQueryParam('author', { forename:'asdf', lastname:'qwer' });
		o.setQueryParam('copyright', 'asdf');
		o.setQueryParam('costs', false);
		o.setQueryParam('datapool', { a:'asdf' });
		o.setQueryParam('filesize', 'asdf1234');
		o.setQueryParam('status', 'published');
		deepEqual(o.getQueryMetas(), {
			'alttitle':['asdf', 'qwer'],
			'author': [{ forename:'asdf', lastname:'qwer' }],
			'copyright':['asdf'],
			'costs':[false],
			'status':['published'],
			},
			'Setting multiple values ok.'
		);
	});

	  
	test('createMetaQueryString', function() {
		equal(o.createMetaQueryString(), '(alttitle:asdf|alttitle:qwer).(author:%7B%22forename%22%3A%22asdf%22%2C%22lastname%22%3A%22qwer%22%7D).(copyright:asdf).(costs:false).(status:published)', 'Setting multiple values ok.');
	});

	test('getQuerySetup', function() {
		var comp = o.getRequestDefaults();
		comp.partialfields = '(alttitle:asdf|alttitle:qwer).(author:%7B%22forename%22%3A%22asdf%22%2C%22lastname%22%3A%22qwer%22%7D).(copyright:asdf).(costs:false).(status:published)';

		for(var p in comp) {
			if (comp[p] === '') {
				delete comp[p];
			}
		}

		deepEqual(o.getQuerySetup(), comp, 'Query Setup ok!');
	})
});