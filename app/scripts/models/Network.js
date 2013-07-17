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
        urlRoot: '/data',

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

            // Empty graph
            this.set('nodes', []);
            this.set('edges', []);

            if (this.get('loadAtInit')) {
                this.loadNetworkData();
            }
        },

        loadNetworkData: function () {
            console.log("Loading network...");
            var self = this;

            // FIXME: do this in view
            //SIGMA_RENDERER.emptyGraph();

            var isNetworkLoaded = self.get('hasNetworkData');

            if (isNetworkLoaded) {
                var graph = this.get('graph');
                this.convertGraph(graph.nodes, graph.edges);
//              this.trigger(EventHelper.NETWORK_LOADED);
                console.log("Fire 1");
                EventHelper.trigger(EventHelper.NETWORK_LOADED);
            } else {
                // Feed data to network only when necessary
                this.fetch({
                    success: function (data) {
                        console.log('Downloading data');
                        self.set({hasNetworkData: true});
                        var attr = data.attributes;
                        self.convertGraph(attr.nodes, attr.edges);
//                        self.trigger(EventHelper.NETWORK_LOADED);
                        console.log("Fire 2");
                        EventHelper.trigger(EventHelper.NETWORK_LOADED);
                    }
                });
            }
        },


        convertGraph: function (nodes, edges) {
            var graph = {
                nodes: [],
                edges: []
            };


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

                // FIXME
                //SIGMA_RENDERER.addNode(node.id, node);
                graph.nodes.push(node);
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
                // FIXME
                //SIGMA_RENDERER.addEdge(edgeId, source, target, newEdge);
                idx++;
            });

            // Save the data to model
//            graph.nodes = nodes;
//            graph.edges = edges;
            this.set({graph: graph});
        }
    });

    return Network;

});