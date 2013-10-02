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
    'models/CyNetwork',
    'cytoscape'

], function (Backbone, EventHelper, CyNetwork, cytoscape) {

    var CYTOSCAPE_TAG = '#cyjs';

    var WAITING_BAR = '<div id="fadingBarsG">' +
        '<div id="fadingBarsG_1" class="fadingBarsG"></div>' +
        '<div id="fadingBarsG_2" class="fadingBarsG"></div>' +
        '<div id="fadingBarsG_3" class="fadingBarsG"></div>' +
        '<div id="fadingBarsG_4" class="fadingBarsG"></div>' +
        '<div id="fadingBarsG_5" class="fadingBarsG"></div>' +
        '<div id="fadingBarsG_6" class="fadingBarsG"></div>' +
        '<div id="fadingBarsG_7" class="fadingBarsG"></div>' +
        '<div id="fadingBarsG_8" class="fadingBarsG"></div></div>';

    var CyNetworkView = Backbone.View.extend({

        el: '#cy-network',

        currentOntology: 'NEXO',

        /**
         * Event listener.  If a term is selected, it will update the
         * @param nodeId
         */
        update: function (nodeId) {
            $(CYTOSCAPE_TAG).empty();

            var currentNetwork = '';
            if (this.model !== undefined) {
                currentNetwork = this.model.get('currentNetworkName');
            } else {
                currentNetwork = 'NeXO';
            }

            if (this.currentOntology !== 'NEXO') {
                // No need to update
                return;
            }

            if (this.model === undefined || this.model === null) {
                this.model = new CyNetwork({namespace: 'nexo', termId: nodeId});
                this.model.set('currentNetworkName', 'NeXO');
            } else {
                this.model.set('termId', nodeId);
                this.model.updateURL();
            }

            console.log('TGT = ' + nodeId);
            this.render(nodeId);
        },

        render: function (nodeId) {
            $(CYTOSCAPE_TAG).cytoscape(this.initSubnetworkView(nodeId));
        },

        networkSelected: function (e) {
            var network = e[0];
            var currentNetwork = network.get('name');
            if (this.model !== undefined && currentNetwork !== undefined) {
                this.model.set('currentNetworkName', currentNetwork);
                this.model.set('currentNetwork', network);
            }
            this.currentOntology = network.get('config').ontologyType;

            console.log('**********************************Network Selected: ' + currentNetwork);
        },


        loadData: function () {
            var self = this;
            console.log('Raw Interaction URL ===> ' + this.model.url);

            this.model.fetch({
                success: function (data) {

                    console.log(data);
                    var graph = data.attributes.graph;
                    console.log('Node Count = ' + graph.elements.nodes.length);

                    if (graph.elements.nodes.length === 0) {

                        console.log('Too big to display.');
                        $(CYTOSCAPE_TAG)
                            .append('<h2 style="padding-left: 20; margin-top: 0; color: #ffffff">Too many to display.</h2>');
                        return;
                    }

                    $(CYTOSCAPE_TAG).append(WAITING_BAR);
                    var cy = self.model.get('cy');

                    EventHelper.trigger('subnetworkRendered', graph);


                    cy.load(graph.elements,

                        cy.layout((function () {
                            if (graph.elements.edges.length > 600) {
                                return {
                                    name: 'circle'
                                };
                            } else {
                                return {
                                    name: 'arbor',
                                    friction: 0.1,
                                    nodeMass: 10,
                                    padding: [ 20, 20, 20, 20 ],
                                    edgeLength: 11.5
                                };
                            }
                        })()
                        ), function () {
                            console.log('Layout finished.');
                            self.setNodeSelectedListener();
                            $('#fadingBarsG').remove();
                        });
                }
            });
        },

        setNodeSelectedListener: function () {
            var cy = this.model.get('cy');
            console.log('CY is ***************** ' + cy);
            cy.$('node').on('click', function (evt) {
                console.log('CLICK ' + evt.cyTarget.id());
                EventHelper.trigger(EventHelper.SUBNETWORK_NODE_SELECTED, evt.cyTarget.id());
            });
        },

        initSubnetworkView: function (targetGene) {

            console.log(targetGene);

            var self = this;

            var options = {
                showOverlay: false,
                boxSelectionEnabled: false,
                minZoom: 0.1,
                maxZoom: 15,

                elements: {
                    nodes: [],
                    edges: []
                },

                ready: function () {
                    self.model.set('cy', this);
                    self.model.set('options', options);
                    self.loadData();
                },

                // Visual Style for raw interaction view.
                style: cytoscape.stylesheet()
                    .selector('node')
                    .css({
                        'font-family': 'Roboto',
                        'font-size': '14px',
                        'font-weight': 300,
                        'content': 'data(id)',
                        'text-halign': 'right',
                        'text-valign': 'bottom',
                        'color': 'rgb(235,235,235)',
                        'width': 5,
                        'height': 5,
                        'border-color': 'white',
                        'background-color': 'rgba(222,222,222,0.9)',
                        'shape': 'ellipse'
                    })
                    .selector(':selected')
                    .css({
                        'background-color': 'rgba(255,94,25,0.9)',
                        'color': 'rgba(255,94,25,0.9)',
                        'font-size': '24px',
                        'width': 30,
                        'height': 30,
                        'shape': 'heptagon',
                        'font-weight': 700
                    })
                    .selector('node[sgd = "' + targetGene + '"]')
                    .css({
                        'background-color': '#00ee11',
                        'color': '#00ee11',
                        'font-size': '24px',
                        'width': 30,
                        'height': 30,
                        'shape': 'hexagon',
                        'font-weight': 700
                    })
                    .selector('edge')
                    .css({
                        'width': 0.7,
                        'text-opacity': 0.4,
                        'content': 'data(interaction)',
                        'color': '#999999',
                        'font-size': '4px',
                        'font-weight': 100,
                        'line-color': '#00ee11',
                        'line-style': 'solid',
                        'opacity': 0.8
                    })
                    .selector('edge[interaction = "yeastNet"]')
                    .css({
                        'line-color': '#e8a27c'
                    })
                    .selector('edge[interaction = "genetic"]')
                    .css({
                        'line-style': 'dashed',
                        'line-color': '#FFA103'
                    })
                    .selector('edge[interaction = "co-expression"]')
                    .css({
                        'width': 0.2,
                        'line-style': 'dotted',
                        'line-color': '#00ee11'
                    })
                };

            return options;
        }
    });
    return CyNetworkView;
});