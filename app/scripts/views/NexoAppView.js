/**
 * Created with JetBrains WebStorm.
 * User: kono
 * Date: 2013/07/15
 * Time: 14:23
 * To change this template use File | Settings | File Templates.
 */

/*global define*/
'use strict';

define([

    'underscore',
    'backbone',
    'EventHelper',
    'ViewEventHelper',
    'models/NexoAppModel',
    'views/CyNetworkView',
    'views/SearchResultTableView',
    'views/NodeDetailsView',
    'views/NetworkManagerView',
    'views/EnrichView'

], function(_, Backbone, EventHelper, ViewEventHelper, NexoAppModel,
            CyNetworkView, SearchResultTableView, NodeDetailsView, NetworkManagerView, EnrichView) {

    var CONFIG_FILE = '/dist/app-config.json';


    var NexoAppView = Backbone.View.extend({

        el: 'body',

        initialize: function () {
            var self = this;


            this.model = new NexoAppModel({settingFileLocation: CONFIG_FILE});

            // Initialize sub components of this view
            var searchView = new SearchResultTableView();
            var summaryView = new NodeDetailsView();
            var subNetworkView = new CyNetworkView();
            var enrichView = new EnrichView();

            this.model.set({
                searchView: searchView,
                summaryView: summaryView,
                subNetworkView: subNetworkView
            });


            this.listenToOnce(this.model, EventHelper.INITIALIZED, function () {

                var currentNetworkView = self.model.get('currentNetworkView');
                searchView.currentNetwork = currentNetworkView.model;

                ViewEventHelper.listenTo(EventHelper, EventHelper.NODES_SELECTED, _.bind(currentNetworkView.selectNodes, currentNetworkView));
                ViewEventHelper.listenTo(searchView.collection, EventHelper.SEARCH_RESULT_SELECTED, _.bind(currentNetworkView.zoomTo, currentNetworkView));
                ViewEventHelper.listenTo(EventHelper, EventHelper.SUBNETWORK_NODE_SELECTED, _.bind(currentNetworkView.zoomTo, currentNetworkView));

                ViewEventHelper.listenTo(currentNetworkView, EventHelper.NODE_SELECTED, _.bind(summaryView.show, summaryView));
                ViewEventHelper.listenTo(currentNetworkView, EventHelper.NODE_SELECTED, _.bind(summaryView.model.getDetails, summaryView.model));

                // Update subnetwork view when a term is selected.
                ViewEventHelper.listenTo(currentNetworkView, EventHelper.NODE_SELECTED, _.bind(subNetworkView.update, subNetworkView));

                //ViewEventHelper.listenTo(searchView, EventHelper.CLEAR, _.bind(currentNetworkView.refresh, currentNetworkView));

                //EventHelper.listenTo(searchView, EventHelper.CLEAR, _.bind(summaryView.hide, summaryView));

                EventHelper.listenTo(EventHelper, EventHelper.CLEAR, _.bind(enrichView.clear, enrichView));

                // Network collection manager
                var networkCollection = self.model.get('networkManager');
                new NetworkManagerView({collection: networkCollection});

                EventHelper.listenTo(networkCollection, EventHelper.NETWORK_SELECTED, _.bind(self.model.loadNetworkDataFile, self.model));
                EventHelper.listenTo(networkCollection, EventHelper.NETWORK_SELECTED, _.bind(subNetworkView.networkSelected, subNetworkView));
                EventHelper.listenTo(networkCollection, EventHelper.NETWORK_SELECTED, _.bind(summaryView.networkSelected, summaryView));

                // Listening to the current network view change event.
                self.listenTo(self.model, 'change:currentNetworkView', self.networkViewSwitched);
                EventHelper.listenTo(self.model, 'change:currentNetworkView', _.bind(searchView.currentNetworkChanged, searchView));

                // For interactions
                EventHelper.listenTo(EventHelper, 'subnetworkRendered', _.bind(summaryView.interactionRenderer, summaryView));

                EventHelper.listenTo(EventHelper, EventHelper.ENRICHED, _.bind(enrichView.processResult, enrichView));

            });

        },

        networkViewSwitched: function () {
            var currentNetworkView = this.model.get('currentNetworkView');
            currentNetworkView.fit();
            this.updateListeners(currentNetworkView);
        },

        updateListeners: function (currentNetworkView) {
            var summaryView = this.model.get('summaryView');
            var subNetworkView = this.model.get('subNetworkView');
            var searchView = this.model.get('searchView');

            ViewEventHelper.stopListening();

            ViewEventHelper.listenTo(EventHelper, EventHelper.NODES_SELECTED, _.bind(currentNetworkView.selectNodes, currentNetworkView));
            ViewEventHelper.listenTo(searchView.collection, EventHelper.SEARCH_RESULT_SELECTED, _.bind(currentNetworkView.zoomTo, currentNetworkView));
            ViewEventHelper.listenTo(EventHelper, EventHelper.SUBNETWORK_NODE_SELECTED, _.bind(currentNetworkView.zoomTo, currentNetworkView));

            ViewEventHelper.listenTo(currentNetworkView, EventHelper.NODE_SELECTED, _.bind(summaryView.show, summaryView));
            ViewEventHelper.listenTo(currentNetworkView, EventHelper.NODE_SELECTED, _.bind(summaryView.model.getDetails, summaryView.model));

            // Update subnetwork view when a term is selected.
            ViewEventHelper.listenTo(currentNetworkView, EventHelper.NODE_SELECTED, _.bind(subNetworkView.update, subNetworkView));
            //ViewEventHelper.listenTo(searchView, EventHelper.CLEAR, _.bind(currentNetworkView.refresh, currentNetworkView));
        }

    });

    return NexoAppView;
});