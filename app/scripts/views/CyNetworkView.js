/**
 * Created with JetBrains WebStorm.
 * User: kono
 * Date: 2013/07/15
 * Time: 14:33
 * To change this template use File | Settings | File Templates.
 */

/*global define*/
'use strict';

define([

    'backbone',
    'EventHelper',

], function (Backbone, EventHelper) {

    var CyNetworkView = Backbone.View.extend({

        el: "#cy-network",

        events: {},

        render: function () {
            $("#cyjs").cytoscape(this.initSubnetworkView());
        },

        update: function (nodeId) {
            $("#cyjs").empty();

            // TODO: remove dependency!
            // check current network model:
            var currentNetwork = app.model.get("currentNetwork");
            var currentNetworkName = currentNetwork.get("name");
            if (currentNetworkName !== DEFAULT_NETWORK) {
                // No need to update
                return;
            }

            if (this.model === undefined || this.model === null) {
                this.model = new CyNetwork({namespace: "nexo", termId: nodeId});
            } else {
                this.model.set("termId", nodeId);
                this.model.updateURL();
            }

            this.render();
        },

        loadData: function () {
            var self = this;
            $("#cyjs").append(WAITING_BAR);
            this.model.fetch({
                success: function (data) {

                    var graph = data.attributes.graph;
                    var cy = self.model.get("cy");

                    EventHelper.trigger("subnetworkRendered", graph);

                    cy.load(graph.elements,

                        cy.layout((function () {
                            if (graph.elements.edges.length > 600) {
                                return {
                                    name: 'circle'
                                }
                            } else {
                                return {
                                    name: 'arbor',
                                    friction: 0.1,
                                    nodeMass: 2,
//                                        repulsion: 19800,
                                    edgeLength: 5.5
                                }
                            }
                        })()
                        ), function () {
                            console.log("Layout finished.");
                            $("#fadingBarsG").remove();
//                            VIEW_MANAGER.setSubnetwork(cy.elements);

                        });
                }
            });
        },

        initSubnetworkView: function () {

            var self = this;

            var options = {
                showOverlay: false,
                boxSelectionEnabled: false,
                minZoom: 0.1,
                maxZoom: 5,

                style: cytoscape.stylesheet()
                    .selector('node')
                    .css({
                        'font-family': 'Roboto',
                        'font-size': 4,
                        'font-weight': 100,
                        'content': 'data(id)',
                        'text-halign': 'right',
                        'text-valign': 'bottom',
                        'color': 'rgb(235,235,235)',
                        'width': 5,
                        'height': 5,
                        'border-color': 'white',
                        "background-color": "rgba(222,222,222,0.9)",
                        "shape": "ellipse"
                    })
                    .selector(':selected')
                    .css({
                        'background-color': 'rgba(255,94,25,0.7)',
                        'color': 'rgba(255,94,25,0.9)',
                        'font-size': '8px',
                        'line-color': '#000',
                        'font-weight': 700
                    })
                    .selector('edge')
                    .css({
                        'width': 0.5,
                        "line-color": "#00ee11",
                        "opacity": 0.8
                    }),

                elements: {
                    nodes: [],
                    edges: []
                },

                ready: function () {
                    self.model.set("cy", this);
                    self.model.set("options", options);
                    self.loadData();
                }
            };
            return options;
        }
    });


    return CyNetworkView;
});