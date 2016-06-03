YUI.add("yuidoc-meta", function(Y) {
   Y.YUIDoc = { meta: {
    "classes": [
        "basics",
        "collectionManager",
        "dataManager",
        "downloadManager",
        "geoView",
        "lightroomCollections",
        "phaidraObject",
        "phaidraQue",
        "pptCreator",
        "resourceManager",
        "search",
        "searchFilter",
        "searchRequestManager",
        "singleView",
        "standalone",
        "timeline",
        "timelineObject",
        "uncategorizesObjects"
    ],
    "modules": [
        "basics",
        "helpers",
        "main",
        "main\n\n## TODO\n\n- Update View when data is changed",
        "resources",
        "search",
        "viewControllers"
    ],
    "allModules": [
        {
            "displayName": "basics",
            "name": "basics",
            "description": "A collection of helper functions."
        },
        {
            "displayName": "helpers",
            "name": "helpers",
            "description": "Phaidra+ Objekt is a generic data container which helps normalize data from the GSA and can render the contents tailored to the needs a certain view.\nThe templates for each view are stored in the Handlebars templates in the template folder."
        },
        {
            "displayName": "main",
            "name": "main",
            "description": "The geo view class displays the search result on a map\n\n## Global Events Consumed\n- changeDisplayed\n- marked\n\n## Global Events Triggered\n- addToCollection\n- downloadSingleObject\n- openSingleView\n\n## Dependencies\n- [resourceManager](resourceManager.html)\n- [template:geo-view.hbs](../../templates/geo-view.hbs)\n- [template:marker.hbs](../../templates/marker.hbs)\n- [uncategorizesObjects](uncategorizesObjects.html)"
        },
        {
            "displayName": "main\n\n## TODO\n\n- Update View when data is changed",
            "name": "main\n\n## TODO\n\n- Update View when data is changed",
            "description": "The lightroom collections class displays the owner's collections on the startpage of phaidra+.\n\n## Events Triggered\n- changeCollectionProperty\n- clearSearchUI\n- createCollection\n- dataManaged\n- deleteCollection\n- deleteItemFromCollection\n- ingestObject\n- updateCollectionOrder\n\n## Dependencies\n- [basics](basics.html)\n- [ppt](ppt.html)\n- [resourceManager](resourceManager.html)\n- [template:lightroom-collections.hbs](../../templates/lightroom-collections.hbs)"
        },
        {
            "displayName": "resources",
            "name": "resources",
            "description": "The search query manager should be used to call the GSA with specific search queries.\nIt provides methods to set a normal search term and search terms for specific meta tags.\n\nThe basic process should be like:\n\n1. create an instance of the searchRequestManager\n2. register for 'searchFinished' event.\n3. set the query parameters (META Search – method:setQueryParam or Fulltext method:setQueryTerm)\n4. load the search results (method:load) or trigger the event 'search' on $(window) and provide search field data, start and pagesize.\nand repeat with 2. if required"
        },
        {
            "displayName": "search",
            "name": "search",
            "description": "This is a class used as a single instance in the phaidra+ app.\nIt creates a search dropdown which includes all UI to configure a search request.\nIf any useful search query can be created, the search is executed by triggering **search.ph-plus** event.\nOn all other occassions, an error is displayed.\n\n### Todo's\n\n- update search UI depending on search results"
        },
        {
            "displayName": "viewControllers",
            "name": "viewControllers"
        }
    ]
} };
});