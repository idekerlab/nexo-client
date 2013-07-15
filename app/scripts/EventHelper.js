/**
 * Created with JetBrains WebStorm.
 * User: kono
 * Date: 2013/07/15
 * Time: 12:18
 * To change this template use File | Settings | File Templates.
 */

/*global define*/
'use strict';

define([
    'underscore',
    'backbone'
], function (_, Backbone) {

    var EventHelper = _.extend({
        // Global events.
        NETWORK_LOADED: 'networkLoaded',
        INITIALIZED: 'initialized',
        NODE_SELECTED: 'nodeSelected',
        NODES_SELECTED: 'nodesSelected',
        SEARCH_RESULT_SELECTED: 'searchResultSelected',
        NETWORK_SELECTED: 'networkSelected',
        CLEAR: 'clear'

    }, Backbone.Events);

    return EventHelper;
});