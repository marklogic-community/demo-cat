(function () {

  'use strict';

  angular.module('ml.search', ['ml.common'])
    .filter('object2Array', object2Array)
    .filter('truncate', truncate);

  function object2Array() {
    return function(input) {
      var out = [];
      for (var name in input) {
        input[name].__key = name;
        out.push(input[name]);
      }
      return out;
    };
  }

  function truncate() {
    return function (text, length, end) {
      length = length || 10;
      // if (isNaN(length)) {
      //   length = 10;
      // }

      end = end || '...';
      // if (end === undefined) {
      //   end = '...';
      // }

      if (text.length <= length || text.length - end.length <= length) {
        return text;
      }
      else {
        return String(text).substring(0, length - end.length) + end;
      }

    };
  }

}());

(function () {

  'use strict';

  angular.module('ml.search')
    .directive('mlDuration', mlDuration);

  function mlDuration() {
    return {
      restrict: 'A',
      transclude: true,
      scope: { mlDuration: '=' },
      link: link
    };
  }

  function link($scope, element, attrs, ctrl, transclude) {
    $scope.$watch('mlDuration', function(newVal, oldVal) {
      if (newVal) {
        angular.extend($scope, {
          duration: parseDuration(newVal)
        });
      }
    });

    transclude($scope, function(clone) {
      element.append(clone);
    });
  }

  function parseDuration(duration) {
    // adapted from https://github.com/dordille/moment-isoduration
    var pattern = [
          'P(',
            '(([0-9]*\\.?[0-9]*)Y)?',
            '(([0-9]*\\.?[0-9]*)M)?',
            '(([0-9]*\\.?[0-9]*)W)?',
            '(([0-9]*\\.?[0-9]*)D)?',
          ')?',
          '(T',
            '(([0-9]*\\.?[0-9]*)H)?',
            '(([0-9]*\\.?[0-9]*)M)?',
            '(([0-9]*\\.?[0-9]*)S)?',
          ')?'
        ],
        regex = new RegExp(pattern.join('')),
        matches = duration.match(regex);

    return {
      years:   parseFloat(matches[3])  || null,
      months:  parseFloat(matches[5])  || null,
      weeks:   parseFloat(matches[7])  || null,
      days:    parseFloat(matches[9])  || null,
      hours:   parseFloat(matches[12]) || null,
      minutes: parseFloat(matches[14]) || null,
      seconds: parseFloat(matches[16]) || null,
      toString: function() {
        return duration;
      }
    };
  }

}());

(function () {

  'use strict';

  angular.module('ml.search')
    .directive('mlFacets', mlFacets);

  function mlFacets() {
    return {
      restrict: 'E',
      scope: {
        facets: '=',
        toggle: '&'
      },
      templateUrl: template
    };
  }

  function template(element, attrs) {
    var url;

    if (attrs.template) {
      if (attrs.template === 'inline') {
        url = '/templates/ml-facets-inline.html';
      } else {
        url = attrs.template;
      }
    }
    else {
      url = '/templates/ml-facets.html';
    }

    return url;
  }

}());

(function () {

  'use strict';

  angular.module('ml.search')
    .directive('mlInput', mlInput);

  function mlInput() {
    return {
      restrict: 'E',
      scope: {
        qtext: '=',
        search: '&',
        suggest: '&'
      },
      templateUrl: template,
      link: link
    };
  }

  function template(element, attrs) {
    var url;

    if (attrs.template) {
      if (attrs.template === 'fa') {
        url = '/templates/ml-input-fa.html';
      } else {
        url = attrs.template;
      }
    }
    else {
      url = '/templates/ml-input.html';
    }

    return url;
  }

  function link($scope, element) {
    $scope.clear = function() {
      $scope.search({ qtext: '' });
    };
  }

}());

(function () {

  'use strict';

  angular.module('ml.search')
    .directive('mlMetrics', mlMetrics);

  var $window = null;

  mlMetrics.$inject = ['$window'];

  function mlMetrics($injectWindow) {
    $window = $injectWindow;

    return {
      restrict: 'E',
      replace: true,
      transclude: true,
      templateUrl: '/templates/ml-metrics.html',
      scope: {
        search: '=',
        showDuration: '=?'
      },
      link: link
    };
  }

  function link($scope, element, attrs, ctrl, transclude) {
    if ($scope.showDuration === undefined) {
      $scope.showDuration = true;
    }

    $scope.$watch('search', function(search) {
      angular.extend($scope, parseSearch(search));
    });

    transclude($scope, function(clone) {
      if (clone.length) {
        element.replaceWith(clone);
      }
    });
  }

  function parseSearch(search) {
    return {
      total: search.total,
      start: search.start,
      pageLength: search['page-length'],
      pageEnd: $window.Math.min(search.start + search['page-length'] - 1, search.total),
      metrics: search.metrics
    };
  }

}());

(function () {

  'use strict';

  angular.module('ml.search')
    .directive('mlRemoteInput', mlRemoteInput)
    .controller('MLRemoteInputController', MLRemoteInputController);

  function mlRemoteInput() {
    return {
      restrict: 'E',
      controller: 'MLRemoteInputController',
      scope: {
        searchCtrl: '@',
        template: '@'
      },
      template: template
    };
  }

  function template(element, attrs) {
    var tpl = '';

    if ( attrs.template ) {
      tpl = ' template="' + attrs.template + '"';
    }
    return '<ml-input qtext="qtext" search="search(qtext)" ' +
           'suggest="suggest(val)"' + tpl + '></ml-input>';
  }

  MLRemoteInputController.$inject = ['$scope', '$location', '$route', 'MLSearchFactory', 'MLRemoteInputService'];

  function MLRemoteInputController($scope, $location, $route, factory, remoteInput) {
    var mlSearch = factory.newContext(),
        searchPath;

    $scope.qtext = remoteInput.input;
    remoteInput.initInput($scope, mlSearch);

    /**
     * watch the `searchCtrl` property, and update search path
     * (allows for instrumentation by a parent controller)
     */
    $scope.$watch('searchCtrl', function(val) {
      var oldSearchPath = searchPath;

      val = val || 'SearchCtrl';
      searchPath = remoteInput.getPath( val );

      if ( oldSearchPath && searchPath !== oldSearchPath ) {
        $scope.search('');
      }
    });

    /**
     * Search function for ml-input directive:
     * redirects to the search ctrl if necessary,
     * passes the input qtext to the remoteInput service
     *
     * @param {string} qtext
     */
    $scope.search = function search(qtext) {
      // TODO: clear params if not on the search path
      // if ( $location.path() !== searchPath ) {
      //   $location.search({});
      //   $location.path( searchPath );
      // }

      $location.path( searchPath );
      remoteInput.setInput(qtext);
    };

    /**
     * suggest function for the ml-input directive
     * gets an MLSearchContext instance from the remoteInput service
     * (if possible)
     *
     * @param {string} partial qtext
     * @return {Promise} a promise to be resolved with search suggestions
     */
    $scope.suggest = function suggest(val) {
      mlSearch = remoteInput.mlSearch || mlSearch;
      return mlSearch.suggest(val).then(function(res) {
        return res.suggestions || [];
      });
    };
  }

}());

(function () {

  'use strict';

  angular.module('ml.search')
    .directive('mlResults', mlResults);

  function mlResults() {
    return {
      restrict: 'E',
      scope: {
        results: '=',
        link: '&'
      },
      templateUrl: template,
      link: link
    };
  }

  function template(element, attrs) {
    var url;

    if (attrs.template) {
      url = attrs.template;
    }
    else {
      url = '/templates/ml-results.html';
    }

    return url;
  }

  function link(scope, element, attrs) {
    //default link fn
    if (!attrs.link) {
      scope.link = function(result) {
        //weird object hierarchy because directive methods requiring objects (?)
        return '/detail?uri=' + result.result.uri;
      };
    }

    scope.$watch('results', function (newVal, oldVal) {
      _.each(newVal, function(result) {
        result.link = scope.link({ result: result });
      });
    });
  }

}());

(function () {

  'use strict';

  angular.module('ml.search')
    .service('MLRemoteInputService', MLRemoteInputService);

  MLRemoteInputService.$inject = ['$route'];

  function MLRemoteInputService($route) {
    var service = this;

    service.input = '';
    service.mlSearch = null;
    service.callbacks = [];

    function unsubscribe(idx) {
      service.callbacks.splice(idx);
    }

    /**
     * sets the service.input instance property and invokes the registered callbacks
     *
     * @param {string} input
     */
    service.setInput = function setInput(val) {
      service.input = val;
      _.each(service.callbacks, function(callback) {
        callback(service.input);
      });
    };

    /**
     * registers a callback, returning a de-registration function
     *
     * @param {function} callback
     * @return {function} callback de-registration function
     */
    service.subscribe = function subscribe(callback) {
      var idx = service.callbacks.length;
      service.callbacks.push(callback);
      return function() {
        unsubscribe(idx);
      };
    };

    /**
     * helper function for mlRemoteInput directive
     * registers and de-registers a callback that
     *   - updates the $scope parameter
     *   - updates the mlSearch parameter with the mlSearch instance property
     *     (if it exists)
     *
     * @param {object} $scope
     * @param (object) mlSearch
     */
    service.initInput = function initInput($scope, mlSearch) {
      var unsubscribe = service.subscribe(function(input) {
        $scope.qtext = input;
        mlSearch = service.mlSearch || mlSearch;
      });

      $scope.$on('destroy', unsubscribe);
    };

    /**
     * helper function for Search controller
     *
     * - registers and de-registers a callback that
     *   - updates the qtext property of the model parameter
     *   - invokes the searchCallback
     * - sets the mlSearch instance property
     * - initializes the qtext property of the model parameter
     *   (unless it's already set and the instance input property is not)
     *
     * @param {object} $scope
     * @param {object} search ctrl model
     * @param {MLSearchContext} ctrl mlSearch instance
     * @param {function} search callback
     */
    service.initCtrl = function initCtrl($scope, model, mlSearch, searchCallback) {
      var unsubscribe = service.subscribe(function(input) {
        if (model.qtext !== input) {
          model.qtext = input;

          searchCallback();
        }
      });

      $scope.$on('$destroy', unsubscribe);

      service.mlSearch = mlSearch;

      if ( model.qtext.length && !service.input.length ) {
        service.setInput( model.qtext );
      } else {
        model.qtext = service.input;
      }
    };

    /**
     * gets the path for a specified controller from the $route service
     *
     * @param {string} search ctrl name
     * @return {string} search ctrl path
     */
    service.getPath = function getPath(searchCtrl) {
      var matches = _.where($route.routes, { controller: searchCtrl }),
          route = { originalPath: '/' };

      if ( matches.length === 0 ) {
        // TODO: get route from attr, or throw Error('can\t find Search controller') ?
        console.error('can\t find Search controller: ' + searchCtrl);
      }
      else {
        route = matches[0];

        if ( matches.length > 1 ) {
          console.log('multiple Search controller routes; choosing \'' +
                      route.originalPath + '\'');
        }
      }

      return route.originalPath;
    };

  }

}());

(function () {
  'use strict';

  // capture injected services for access throughout this module
  var $q = null,
      $location = null,
      mlRest = null,
      qb = null;

  angular.module('ml.search')
    .factory('MLSearchFactory', MLSearchFactory);

  MLSearchFactory.$inject = ['$q', '$location', 'MLRest', 'MLQueryBuilder'];

  /**
   * Creates a new instance of MLSearchFactory
   *
   * @constructor
   * @this {MLSearchFactory}
   */
  function MLSearchFactory($injectQ, $injectLocation, $injectMlRest, $injectQb) {
    $q = $injectQ;
    $location = $injectLocation;
    mlRest = $injectMlRest;
    qb = $injectQb;

    return {
      newContext: function newContext(options) {
        return new MLSearchContext(options);
      }
    };
  }

  /**
   * Creates a new instance of MLSearchContext
   *
   * @constructor
   * @this {MLSearchContext}
   * @param {options} provided object properties will override defaults
   */
  function MLSearchContext(options) {
    // MLQueryBuilder} from ml.common
    this.qb = qb;

    // cache search results from the last search call
    this.results = {};

    // cache stored search options by name
    this.storedOptions = {};

    // active facet selections
    this.activeFacets = {};

    // namespace uri / prefix hash for results metadata transformation
    this.namespaces = {};

    // boosting queries to be added to the current query
    this.boostQueries = [];

    // additional queries to be added to the current query
    this.additionalQueries = [];

    // search results transformation name
    this.searchTransform = null;

    // current search phrase
    this.qtext = null;

    // current pagination offset
    this.start = 1;

    // configuration options
    this.options = _.merge( _.cloneDeep(this.defaults), options );
  }

  angular.extend(MLSearchContext.prototype, {

    /************************************************************/
    /**************** MLSearchContext properties ****************/
    /************************************************************/

    /**
     * default options
     *
     * pass an object (to MLSearchFactory.newContest)
     * with any of these properties to override their values
     */
    defaults: {
      // stored search options name
      queryOptions: 'all',

      // page length
      pageLength: 10,

      // results transform operator state name
      snippet: 'compact',

      // sort operator state name
      sort: null,

      // combine facets with an `and-query` or an `or-query`
      facetMode: 'and',

      // include document properties in queries
      includeProperties: false,

      // URL params settings
      params: {
        separator: ':',
        qtext: 'q',
        facets: 'f',
        negatedFacets: 'n',
        sort: 's',
        page: 'p',
        prefix: null,
        prefixSeparator: null
        // TODO: queryOptions?
      }
    },

    /************************************************************/
    /******** MLSearchContext instance getters/setters **********/
    /************************************************************/

    /**
     * Gets the hash of active facets
     *
     * @return {object} this.activeFacets
     */
    getActiveFacets: function getActiveFacets() {
      return this.activeFacets;
    },

    /**
     * Get namspace prefix by URI
     *
     * @param {string} uri
     * @return {string} prefix
     */
    getNamespacePrefix: function getNamespacePrefix(uri) {
      return this.namespaces[ uri ];
    },

    /**
     * Get namspace URI by prefix
     *
     * @param {string} prefix
     * @return {string} uri
     */
    getNamespaceUri: function getNamespacePrefix(prefix) {
      return _.chain(this.namespaces)
        .map(function(nsPrefix, uri) {
          if (prefix === nsPrefix) {
            return uri;
          }
        })
        .compact()
        .valueOf()[0];
    },

    /**
     * Gets namespace objects
     *
     * @return {array} namespace objects
     */
    getNamespaces: function getNamespaces() {
      var namespaces = [];
      _.forIn(this.namespaces, function(prefix, uri) {
        namespaces.push({ prefix: prefix, uri: uri });
      });
      return namespaces;
    },

    /**
     * Sets namespace objects
     *
     * @param {array} namespace objects
     * @return {this}
     */
    setNamespaces: function setNamespaces(namespaces) {
      _.each(namespaces, this.addNamespace, this);
      return this;
    },

    /**
     * Adds a namespace object
     *
     * @param {object} namespace
     * @return {this}
     */
    addNamespace: function addNamespace(namespace) {
      this.namespaces[ namespace.uri ] = namespace.prefix;
      return this;
    },

    /**
     * Clears namespaces
     *
     * @return {this}
     */
    clearNamespaces: function clearNamespaces() {
      this.namespaces = {};
      return this;
    },

    /**
     * Gets the boost queries
     *
     * @return {object} this.activeFacets
     */
    getBoostQueries: function getBoostQueries() {
      return this.boostQueries;
    },

    /**
     * Adds a boost query
     *
     * @param {object} boost query
     * @return {Object} this
     */
    addBoostQuery: function addBoostQuery(query) {
      this.boostQueries.push(query);
      return this;
    },

    /**
     * Clear the boost queries
     *
     * @return {Object} this
     */
    clearBoostQueries: function clearBoostQueries() {
      this.boostQueries = [];
      return this;
    },

    /**
     * Gets the additional queries
     *
     * @return {object} this.additionalQueries
     */
    getAdditionalQueries: function getAdditionalQueries() {
      return this.additionalQueries;
    },

    /**
     * Adds a additional query
     *
     * @param {object} additional query
     * @return {Object} this
     */
    addAdditionalQuery: function addAdditionalQuery(query) {
      this.additionalQueries.push(query);
      return this;
    },

    /**
     * Clear the additional queries
     *
     * @return {Object} this
     */
    clearAdditionalQueries: function clearAdditionalQueries() {
      this.additionalQueries = [];
      return this;
    },

    /**
     * Gets the search transform name
     *
     * @return {string} transform name
     */
    getTransform: function getTransform(transform) {
      return this.searchTransform;
    },

    /**
     * Sets the search transform name
     *
     * @param {string} transform name
     * @return {Object} this
     */
    setTransform: function setTransform(transform) {
      this.searchTransform = transform;
      return this;
    },

    /**
     * Gets the current search phrase
     *
     * @return {string} search phrase
     */
    getText: function getText() {
      return this.qtext;
    },

    /**
     * Sets the current search phrase
     *
     * @param {string} search phrase
     * @return {object} this
     */
    setText: function setText(text) {
      if (text !== '') {
        this.qtext = text;
      } else {
        this.qtext = null;
      }
      return this;
    },

    /**
     * Gets the current search page
     *
     * @return {number} search page
     */
    getPage: function getPage() {
      //TODO: $window.Math
      var page = Math.floor(this.start / this.options.pageLength) + 1;
      return page;
    },

    /**
     * Sets the current search page
     *
     * @param {number} search page
     * @return {object} this
     */
    setPage: function setPage(page) {
      this.start = 1 + (page - 1) * this.options.pageLength;
      return this;
    },

    /************************************************************/
    /********* MLSearchContext options getters/setters **********/
    /************************************************************/

    /**
     * Gets the current queryOptions (name of stored params)
     *
     * @return {string} queryOptions
     */
    getQueryOptions: function getQueryOptions() {
      return this.options.queryOptions;
    },

    //TODO: setQueryOptions ?

    /**
     * Gets the current page length
     *
     * @return {number} page length
     */
    getPageLength: function getPageLength() {
      return this.options.pageLength;
    },

    /**
     * Sets the current page length
     *
     * @param {number} page length
     * @return {object} this
     */
    setPageLength: function setPageLength(pageLength) {
      this.options.pageLength = pageLength;
      return this;
    },

    /**
     * Gets the current results transform operator state name
     *
     * @return {string} operator state name
     */
    getSnippet: function getSnippet() {
      return this.options.snippet;
    },

    /**
     * Sets the current results transform operator state name
     *
     * @param {string} operator state name
     * @return {object} this
     */
    setSnippet: function setSnippet(snippet) {
      this.options.snippet = snippet;
      return this;
    },

    /**
     * Resets the current results transform operator state name to its default value
     *
     * @return {object} this
     */
    clearSnippet: function clearSnippet() {
      this.options.snippet = this.defaults.snippet;
      return this;
    },

    /**
     * Gets the current sort operator state name
     *
     * @return {string} sort operator state name
     */
    getSort: function getSort() {
      return this.options.sort;
    },

    /**
     * Sets the current sort operator state name
     *
     * @param {string} sort operator state name
     * @return {object} this
     */
    setSort: function setSort(sort) {
      this.options.sort = sort;
      return this;
    },

    /**
     * Resets the current sort operator state name to its default value
     *
     * @return {object} this
     */
    clearSort: function clearSort() {
      this.options.sort = this.defaults.sort;
      return this;
    },

    /**
     * Gets the current facet mode name (and|or)
     *
     * @return {string} facet mode
     */
    getFacetMode: function getFacetMode() {
      return this.options.facetMode;
    },

    /**
     * Sets the current facet mode name
     *
     * @param {string} facet mode (and|or)
     * @return {object} this
     */
    setFacetMode: function setFacetMode(facetMode) {
      this.options.facetMode = facetMode;
      return this;
    },

    /**
     * Gets the current URL params config object
     *
     * @return {string} facet mode
     */
    getParamsConfig: function getParamsConfig() {
      return this.options.params;
    },

    /**
     * Gets the key of the enabled URL params
     * @method MLSearchContext#getParamsKeys
     *
     * @return {Array<String>} URL params keys
     */
    getParamsKeys: function getParamsKeys() {
      var prefix = this.getParamsPrefix();
      return _.chain( this.options.params )
        .omit(['separator', 'prefix', 'prefixSeparator'])
        .map(function(value) {
          return prefix + value;
        })
        .compact()
        .value();
    },

    /**
     * Gets the URL params prefix
     * @method MLSearchContext#getParamsPrefix
     *
     * @return {String} the defined params prefix + separator
     */
    getParamsPrefix: function getParamsPrefix() {
      var prefix = '';

      if ( this.options.params.prefix !== null ) {
        prefix = this.options.params.prefix + (
                   this.options.params.prefixSeparator ||
                   this.options.params.separator
                 );
      }

      return prefix;
    },

    //TODO: setParamsConfig ?

    /************************************************************/
    /************** MLSearchContext query builders **************/
    /************************************************************/

    /**
     * Constructs a structured query from the current state
     *
     * @return a structured query object
     */
    getQuery: function getQuery() {
      var query = qb.and();

      if ( _.keys(this.activeFacets).length ) {
        query = this.getFacetQuery();
      }

      if ( this.qtext ) {
        query = qb.and( query, qb.text( this.qtext ) );
      }

      if ( this.boostQueries.length ) {
        query = qb.boost(query, this.boostQueries);
      }

      if ( this.additionalQueries.length ) {
        query = qb.and(query, this.additionalQueries);
      }

      if ( this.options.includeProperties ) {
        query = qb.or(query, qb.properties(query));
      }

      query = qb.query(query);

      if ( this.options.sort ) {
        // TODO: this assumes that the sort operator is called "sort", but
        // that isn't necessarily true. Properly done, we'd get the options
        // from the server and find the operator that contains sort-order
        // elements
        query.query.queries.push( qb.operator('sort', this.options.sort) );
      }

      if ( this.options.snippet ) {
        // same problem as `sort`
        query.query.queries.push( qb.operator('results', this.options.snippet) );
      }

      return query;
    },

    /**
     *
     */
    getFacetQuery: function getFacetQuery() {
      var self = this,
          queries = [],
          query = {},
          constraintFn;

      _.forIn( self.activeFacets, function(facet, facetName) {
        if ( facet.values.length ) {
          constraintFn = function(values) {
            return qb.constraint( facet.type )( facetName, values );
          };

          if ( self.options.facetMode === 'or' ) {
            queries.push( constraintFn( facet.values ) );
          } else {
            queries = queries.concat( _.map(facet.values, constraintFn) );
          }
        }
      });

      if ( self.options.facetMode === 'or' ) {
        query = qb.or(query);
      } else {
        query = qb.and(queries);
      }

      return query;
    },

    /**
     * Construct a combined query from the current state
     *
     * @return a {Promise} resolved with the combined query
     */
    getCombinedQuery: function getCombinedQuery() {
      var d = $q.defer(),
          combined = { query: this.getQuery() };

      this.getStoredOptions(this.options.queryConfig).then(function(options) {
          combined.options = options;
          d.resolve(combined);
        },
        function(reason) {
          d.reject(reason);
        });

      return d.promise;
    },

    /************************************************************/
    /************** MLSearchContext facet methods ***************/
    /************************************************************/

    /**
     * Check if the facet/value combination is already selected
     *
     * @param {string} facet name
     * @param {string} facet value
     * return {boolean} isSelected
     */
    isFacetActive: function isFacetActive(name, value) {
      var active = this.activeFacets[name];
      return active && _.contains(active.values, value);
    },

    /**
     * Add the facet/value/type combination to the activeFacets list
     *
     * @param {string} facet name
     * @param {string} facet value
     * @param {string} facet type
     * return {object} this
     */
    selectFacet: function selectFacet(name, value, type) {
      if (/^"(.*)"$/.test(value)) {
        value = value.replace(/^"(.*)"$/, '$1');
      }
      var active = this.activeFacets[name];

      if ( active && !_.contains(active.values, value) ) {
        active.values.push(value);
      } else {
        this.activeFacets[name] = { type: type, values: [value] };
      }

      return this;
    },

    /**
     * Remove the facet/value combination from the activeFacets list
     *
     * @param {string} facet name
     * @param {string} facet value
     * return {object} this
     */
    clearFacet: function clearFacet(name, value) {
      var active = this.activeFacets[name];

      active.values = _.filter( active.values, function(facetValue) {
        return facetValue !== value;
      });

      if ( !active.values.length ) {
        delete this.activeFacets[name];
      }

      return this;
    },

    /**
     * If facet/value combination is active, remove it from the activeFacets list
     *   otherwise, find it's type, and add it.
     *
     * @param {string} facet name
     * @param {string} facet value
     * return {object} this
     */
    toggleFacet: function toggleFacet(name, value) {
      var type;

      if ( this.isFacetActive(name, value) ) {
        this.clearFacet(name, value);
      } else {
        type = this.results.facets[name].type;
        this.selectFacet(name, value, type);
      }

      return this;
    },

    /**
     * Reset the activeFacets list
     *
     * return {object} this
     */
    clearAllFacets: function clearAllFacets() {
      this.activeFacets = {};
      return this;
    },

    /************************************************************/
    /************ MLSearchContext URL params methods ************/
    /************************************************************/

    /**
     * Construct a URL query params object from the current state
     *
     * @return a URL query params object
     */
    getParams: function getParams() {
      var page = this.getPage(),
          facets = [],
          params = {};

      facets = this.getFacetParams();

      if ( facets.length ) {
        params[ this.options.params.facets ] = facets;
      }

      if ( page > 1 ) {
        params[ this.options.params.page ] = page;
      }

      if ( this.qtext ) {
        params[ this.options.params.qtext ] = this.qtext;
      }

      if ( this.options.sort ) {
        params[ this.options.params.sort ] = this.options.sort;
      }

      return params;
    },

    /**
     * @private
     */
    getFacetParams: function getFacetParams() {
      var self = this,
          facetQuery = self.getFacetQuery(),
          queries = [],
          facets = [];

      queries = ( facetQuery['or-query'] || facetQuery['and-query'] ).queries;

      _.each(queries, function(query) {
        var constraint = query[ _.keys(query)[0] ],
            name = constraint['constraint-name'];

        _.each( constraint.value || constraint.uri, function(value) {
          // quote values with spaces
          if (/\s+/.test(value) && !/^"(.*)"$/.test(value)) {
            value = '"' + value + '"';
          }
          facets.push( name + self.options.params.separator + value );
        });
      });

      return facets;
    },

    /**
     * Gets the current search related URL params (excluding any params not controlled by {@link MLSearchContext})
     * @method MLSearchContext#getCurrentParams
     *
     * @param {Object} [params] - URL params (defaults to `$location.search()`)
     * @return {Object} search-related URL params
     */
    getCurrentParams: function getCurrentParams(params) {
      var prefix = this.getParamsPrefix();

      params = _.pick(
        params || $location.search(),
        this.getParamsKeys()
      );

      _.chain(this.options.params)
      .pick(['facets', 'negatedFacets'])
      .values()
      .each(function(key) {
        var name = prefix + key;

        if ( params[ name ] ) {
          params[ name ] = asArray(params[ name ]);
        }
      })
      .value();

      return params;
    },

    /**
     * Update the current state based on the provided URL query params object
     *
     * @param {params} a URL query params object
     * @return a {Promise} resolved once the params have been applied
     */
    fromParams: function fromParams(params) {
      var self = this,
          d = $q.defer(),
          qtextP, facetsP, pageP, sortP;

      params = params || $location.search();
      qtextP = params[ this.options.params.qtext ] || null;
      pageP = params[ this.options.params.page ];
      sortP = params[ this.options.params.sort ];
      facetsP = params[ this.options.params.facets ];

      self.setText(qtextP);

      if ( pageP ) {
        pageP = parseInt(pageP) || 1;
        self.setPage( pageP );
      } else if ( this.options.params.page ) {
        self.setPage(1);
      }

      if (sortP) {
        self.setSort( decodeParam(sortP) );
      }

      self.clearAllFacets();

      if (facetsP) {
        if (self.results.facets) {
          self.fromFacetParam(facetsP);
          d.resolve();
        } else {
          self.getStoredOptions().then(function(options) {
            self.fromFacetParam(facetsP, options);
            d.resolve();
          });
        }
      } else {
        d.resolve();
      }

      return d.promise;
    },

    /**
     * @private
     */
    fromFacetParam: function fromFacetParam(param, storedOptions) {
      var self = this,
          values = _.map( asArray(param), decodeParam );

      _.each(values, function(value) {
        var tokens = value.split( self.options.params.separator ),
            facetName = tokens[0],
            facetValue = tokens[1],
            type = null;

        if ( storedOptions ) {
          type = getFacetConfig( storedOptions, facetName ).type;
        } else if ( self.results.facets ) {
          type = self.results.facets[facetName].type;
        } else {
          console.error('don\'t have facets or options for \'' + facetName +
                        '\', falling back to un-typed range queries');
        }

        self.selectFacet( facetName, facetValue, type );
      });
    },

    /**
     * Examines the current state, and determines if a new search is needed.
     *   (intended to be triggered on {$locationChangeSuccess})
     *
     * @param {newUrl} the target URL of a location change
     * @param {oldUrl} the original URL of a location change
     * @param {params} the search params of the target URL
     *
     * @return a {Promise} resolved after calling {this.fromParams} (if a new search is needed)
     */
    locationChange: function locationChange(newUrl, oldUrl, params) {
      params = this.getCurrentParams( params );

      // still on the search page, but there's a new query
      var shouldUpdate = pathsEqual(newUrl, oldUrl) &&
                         !_.isEqual( this.getParams(), params );

      if ( !shouldUpdate ) {
        return $q.reject();
      }

      return this.fromParams(params);
    },

    /************************************************************/
    /********** MLSearchContext data retrieval methods **********/
    /************************************************************/

    /**
     * Retrieves stored search options, caching the result in {this.storedOptions}
     *
     * @param {name} [this.options.queryOptions] the name of the options to retrieve
     * @return a {Promise} resolved with the stored options
     */
    getStoredOptions: function getStoredOptions(name) {
      var self = this,
          d = $q.defer();

      name = name || self.options.queryOptions;

      if ( self.storedOptions[name] ) {
        d.resolve( self.storedOptions[name] );
      } else {
        mlRest.queryConfig(name).then(function(response) {
            //TODO: transform?
            self.storedOptions[name] = response.data;
            d.resolve( self.storedOptions[name] );
          },
          function(reason) {
            d.reject(reason);
          });
      }

      return d.promise;
    },

    /**
     * Retrieves stored search options, caching the result in {this.storedOptions}
     *
     * @param {names} the names of the options to retrieve
    *
     * @return a {Promise} resolved with {this.storedOptions}
     */
    getAllStoredOptions: function getAllStoredOptions(names) {
      var self = this,
          d = $q.defer(),
          result = {};

      // cache any options not already loaded
      $q.all( _.map(names, self.getStoredOptions) ).then(function() {
        // return only the names requested
        _.each(names, function(name) {
          result[name] = self.storedOptions[name];
        });
        d.resolve( result );
      });

      return d.promise;
    },

    /**
     * Gets search phrase suggestions based on the current state
     *
     * @param {qtext} the partial-phrase to match
     * @return {Promise} resolved with the search phrase suggestions
     */
    suggest: function suggest(qtext) {
      var d = $q.defer(),
          //TODO: figure out why getCombinedQuery errors
          combined = {
            search: { query: this.getQuery() }
          },
          params = {
            'partial-q': qtext,
            format: 'json',
            options: this.options.queryOptions
          };

      mlRest.suggest(params, combined).then(function(response) {
          d.resolve(response.data);
        },
        function(reason) {
          d.reject(reason);
        });

      return d.promise;
    },

    /**
     * Runs a search based on the current state
     *
     * @return a {Promise} resolved with the search results
     */
    search: function search() {
      var self = this,
          d = $q.defer();

      mlRest.search({
        options: self.options.queryOptions,
        structuredQuery: self.getQuery(),
        start: self.start,
        pageLength: self.options.pageLength,
        transform: self.searchTransform
      })
      .then(
        function(response) {
          self.results = response.data;
          self.transformMetadata();
          self.annotateActiveFacets();
          d.resolve(self.results);
        },
        function(reason) {
          d.reject(reason);
        });

      return d.promise;
    },

    /**
     * Annotate the facets in the search results object with the selects from this.activeFacets
     *
     * @param {object} facets [this.results.facets]
     */
    annotateActiveFacets: function annotateActiveFacets(facets) {
      var self = this;

      facets = facets || self.results.facets;

      _.forIn( facets, function(facet, name) {
        var selected = self.activeFacets[name];

        if ( selected ) {
          _.forEach(
            _.filter(facet.facetValues, function(value) {
              return _.contains( selected.values, value.name );
            }),
            function(value) {
              facet.selected = value.selected = true;
            }
          );
        }
      });
    },

    /**
     * Transform each search result's metadata object from an array of objects to an object
     *
     * @param {object} results [this.results.results]
     */
    transformMetadata: function transformMetadata(result) {
      var self = this,
          metadata;

      result = result || this.results.results;

      if ( _.isArray(result) ) {
        _.each(result, this.transformMetadata, self);
        return;
      }

      metadata = result.metadata;
      result.metadata = {};

      _.each(metadata, function(obj) {
        var key = _.without(_.keys(obj), 'metadata-type')[0],
            type = obj[ 'metadata-type' ],
            value = obj[ key ],
            shortKey = null,
            prefix = null,
            ns = null;

        ns = key.replace(/^\{([^}]+)\}.*$/, '$1');
        prefix = self.getNamespacePrefix(ns);


        if ( prefix ) {
          shortKey = key.replace(/\{[^}]+\}/, prefix + ':');
        } else {
          shortKey = key;
        }

        if ( !result.metadata[ shortKey ] ) {
          result.metadata[ shortKey ] = { 'metadata-type': type, values: [] };
        }

        result.metadata[ shortKey ].values.push(value);
      });
    },

    /**
     * @deprecated
     * @see this.getQuery
     */
    getStructuredQuery: function getStructuredQuery() {
      return this.getQuery();
    },

    /**
     * @deprecated
     * @see this.getParams
     */
    serializeStructuredQuery: function serializeStructuredQuery() {
      return this.getParams();
    }

  });

  function decodeParam(value) {
    return decodeURIComponent(value.replace(/\+/g, '%20'));
  }

  function pathsEqual(newUrl, oldUrl) {
    // TODO: use $$urlUtils.urlResolve(), once it's available
    // see: https://github.com/angular/angular.js/pull/3302
    // from: https://stackoverflow.com/questions/21516891
    function pathName(href) {
      var x = document.createElement('a');
      x.href = href;
      return x.pathname;
    }

    return pathName(newUrl) === pathName(oldUrl);
  }

  // this function get's called in a tight loop, so loading the options async won't work
  // (could end up requesting the options over and over ...)
  function getFacetConfig(storedOptions, name) {
    var constraint = _.where( storedOptions.options.constraint, { name: name } )[0];

    constraint.type = constraint.collection ? 'collection' :
                      constraint.custom ? 'custom' :
                      constraint.range.type;

    return constraint;
  }

  //TODO: move to util module
  function asArray() {
    var args;

    if ( arguments.length === 0 ) {
      args = [];
    } else if ( arguments.length === 1) {
      if (Array.isArray( arguments[0] )) {
        args = arguments[0];
      } else {
        args = [ arguments[0] ];
      }
    } else {
      args = [].slice.call(arguments);
    }

    return args;
  }

})();
