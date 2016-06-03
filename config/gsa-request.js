define(function () {
	
	return {
		'query' : '',
		'access' : 'a', // search only public (p), only secure (s) or all content (a)
		'as_oq' : '', // use all terms in the query phrase as OR
		'client' : 'phaidra', // name of the phaidra client requesting results ???
		'entqr' : 3, // query expansion policy
		'entqrm' : 2, // query expansion policy for meta tags
		//'entsp' : 0, // the scoring policy
		'filter' : 0, // automatic entity filtering
		'getfields' : '*', // meta tags of the fields to return with the resultset
		'ie' : 'utf8', // encoding of query string
		'lr' : '', // language filter
		'num' : 100, // max. number of results
		'oe' : 'utf8', // encoding of result set
		'output' : 'json', // output format
		'partialfields' : '', // storage for meta-tag based querying
		'proxystylesheet' : '', // XSL stylesheet to transform the output
		//'q' : '', // query string
		'requiredfields' : '(type%3AImage|type%3AText|type%3APicture|type%3APDF|type%3APaper)', 
		'proxyreload':1,
		//'site' : 'phaidra', // the collection to search in ???
		'sort' : '', // sorting order, etc.
		'start' : -1, // the index of the first result element to return
		'resultsField':'RES',
		'endPoint':'https://phaidra-temp.univie.ac.at/google_search'

	};
});