/**
 * Network Model for the main view.
 *
 */

/*global define*/
'use strict';

define([

    'underscore',
    'backbone',
    'EventHelper'

], function (_, Backbone, EventHelper) {

    // Constants
    var LABEL_LENGTH_TH = 40;

    var Network = Backbone.Model.extend({
        // Only for getting data from fixed file location
        urlRoot: 'data',

        initialize: function () {
            // Config should be given when initialized.
            var networkConfig = this.get('config');
            if(networkConfig === undefined) {
                console.error('Network configuration is undefined.');
                return;
            }

            this.id = networkConfig.networkData;

            // Data status:
            this.set({hasNetworkData: false});

            if (this.get('loadAtInit')) {
                this.loadNetworkData();
            }
        },

        loadNetworkData: function () {
            console.log('Loading network...');
            var self = this;

            var isNetworkLoaded = self.get('hasNetworkData');

            if (isNetworkLoaded) {
                var graph = this.get('graph');
                this.convertGraph(graph.nodes, graph.edges);
                EventHelper.trigger(EventHelper.NETWORK_LOADED);
            } else {
                // Feed data to network only when necessary
                this.fetch({
                    success: function (data) {
                        self.set({hasNetworkData: true});
                        var attr = data.attributes;
                        self.convertGraph(attr.nodes, attr.edges);
                        EventHelper.trigger(EventHelper.NETWORK_LOADED);
                        attr = null;
                        data = null;
                    }
                });
            }
        },


        convertGraph: function (nodes, edges) {
            var graph = {
                nodes: [],
                edges: []
            };

            var id2label = {};

            _.each(nodes, function (node) {
                var nodeLabel = node.label;
                node.fullLabel = nodeLabel;
                // Truncate if long
                if (nodeLabel.length > LABEL_LENGTH_TH) {
                    nodeLabel = nodeLabel.substring(0, LABEL_LENGTH_TH) + '...';
                    node.label = nodeLabel;
                }
                if (node.color === undefined) {
                    node.color = 'rgba(33,30,45,0.4)';
                }
                graph.nodes.push(node);

                id2label[node.id] = node.label;
            });


            var idx = 0;
            _.each(edges, function (edge) {

                var newEdge = {
                    'source': edge.source,
                    'target': edge.target,
                    'weight': edge.weight,
                    'label': edge.relathinship,
                    'id': idx.toString()
                };

                graph.edges.push(newEdge);
                idx++;
            });

            this.set({graph: graph});
            this.set('nodeLabel2id', id2label);

            this.unset('nodes');
            this.unset('edges');
        }
    });

    return Network;
});