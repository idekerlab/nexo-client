/**
 * Created with JetBrains WebStorm.
 * User: kono
 * Date: 2013/07/15
 * Time: 13:01
 * To change this template use File | Settings | File Templates.
 */

/*global define*/
'use strict';

define([
    'bootstrap',
    'underscore',
    'backbone',
    'EventHelper',
    'views/SigmaRenderer'
], function (jquery, _, Backbone, EventHelper, SigmaRenderer) {

    // Constants
    var DIM_COLOR = 'rgba(220,220,220,0.7)';
    var SELECTED_NODE_COLOR = 'rgba(70,130,180,0.9)';
    var QUERY_NODE_COLOR = 'rgb(255,94,25)';

    var NetworkView = Backbone.View.extend({

        el: '#sigma-canvas',

        events: {
            'dblclick': 'refresh'
        },

        initialize: function () {
            var self = this;

            SigmaRenderer.bind('upnodes', function (nodes) {
                var selectedNodeId = nodes.content[0];
                var networkName = self.model.get('name');
                // TODO: use current network name
                if (networkName === $('#network-title').text()) {
                    self.findPath(selectedNodeId);
                    self.trigger(EventHelper.NODE_SELECTED, selectedNodeId);
                }
            });
            self.bindCommands();

            // Render the network once its model is ready.
            EventHelper.listenToOnce(EventHelper, EventHelper.NETWORK_LOADED, _.bind(this.render, this));
        },

        render: function () {
            // Clear all data
            SigmaRenderer.emptyGraph();

            // Load data from model
            var graph = this.model.get('graph');
            if (graph === undefined) {
                return;
            }

            _.each(graph.nodes, function (node) {
                SigmaRenderer.addNode(node.id, node);
            });

            _.each(graph.edges, function (edge) {
                SigmaRenderer.addEdge(edge.id, edge.source, edge.target, edge);
            });

            var networkConfig = this.model.get('config');
            var drawingProps = networkConfig.sigma.drawingProperties;
            var graphProps = networkConfig.sigma.graphProperties;
            var mouseProps = networkConfig.sigma.mouseProperties;

            SigmaRenderer.
                drawingProperties(drawingProps).
                graphProperties(graphProps).
                mouseProperties(mouseProps);

            SigmaRenderer.refresh();
            SigmaRenderer.draw();
        },


        selectNodes: function (selectedNodes) {
            console.log(selectedNodes);

            if (selectedNodes === undefined) {
                // Invalid parameter.
            } else if (selectedNodes instanceof Array === false) {

                // Single node selection
                var id = this.model.get('nodeLabel2id')[selectedNodes];
                this.highlight([id], true);
            } else {
                var targetNodes = [];
                _.each(selectedNodes, function (node) {
                    var id = node.get('name');
                    var sigmaNode = SigmaRenderer._core.graph.nodesIndex[id];
                    if (sigmaNode !== undefined) {
                        targetNodes[sigmaNode.id] = true;
                    }
                });

                this.highlight(targetNodes, true);
            }
        },

        zoomTo: function (id) {
            // Do nothing if ID is invalid.
            if (id === undefined) {
                return;
            } else if(this.model.get('nodeLabel2id')[id] !== undefined) {
                id = this.model.get('nodeLabel2id')[id];
            }

            var lastNode = this.model.get('lastSelected');
            console.log('Last = ' + lastNode);
            console.log('Zooming to ' + id);
            if (lastNode !== undefined && lastNode !== null) {
                // Clear last selection
                lastNode.color = lastNode.originalColor;
                lastNode.originalColor = null;
            }
            var node = SigmaRenderer._core.graph.nodesIndex[id];
            node.originalColor = node.color;
            node.color = QUERY_NODE_COLOR;

            SigmaRenderer.position(0, 0, 1).draw();
            SigmaRenderer.zoomTo(node.displayX, node.displayY, 40);
            SigmaRenderer.draw(2, 2, 2);
            this.model.set('lastSelected', node);
        },


        bindCommands: function () {
            var self = this;
            var sigmaView = SigmaRenderer;
            var commands = $('#commands');

            commands.find('div.z').each(function () {

                var zoomButton = $(this);
                var zoomCommand = zoomButton.attr('rel');

                zoomButton.tooltip({delay: { show: 200, hide: 100 }});

                zoomButton.click(function () {

                    if (zoomCommand === 'center') {
                        // Fit to window
                        sigmaView.position(0, 0, 1).draw();
                    } else {
                        // Zoom in/out
                        var sigmaCore = sigmaView._core;
                        var ratio = 1;

                        if (zoomCommand === 'in') {
                            ratio = 1.2;
                        } else if (zoomCommand === 'out') {
                            ratio = 0.8;
                        }

                        sigmaView.zoomTo(
                            sigmaCore.domElements.nodes.width / 2,
                            sigmaCore.domElements.nodes.height / 2,
                            sigmaCore.mousecaptor.ratio * ratio
                        );
                    }

                });
            });

            commands.find('div.s').each(function () {

                var button = $(this);
                var command = button.attr('rel');

                button.popover({
                    html: true,
                    placement: 'top'
                });

                if (command === 'refresh') {
                    button.click(function () {
                        console.log('Refresh called');
                        self.refresh();
                    });
                }

            });
        },

        findPath: function (nodeId) {
            var self = this;

            var url = '/' + nodeId + '/path';
            $.getJSON(url, function (path) {
                self.showPath(path);
                console.log('Path found:');
                console.log(path);
            });
        },


        /**
         * Add edges to the first neighbour of query node (if does not exist in the tree.)
         *
         * @param pathArray
         */
        addHiddenEdges: function (pathArray) {

            // Query node is ALWAYS idx 0 of list.
            var source = pathArray[0][0];
            var targets = [];

            _.each(pathArray, function (path) {
                targets.push(path[1]);
            });

            // Reset current state
            var edgeNames = {};
            SigmaRenderer
                .iterEdges(function (edge) {
                    if (edge.label === 'extra') {
                        SigmaRenderer.dropEdge(edge.id);
                    } else {
                        var edgeName = edge.source + '-' + edge.target;
                        edgeNames[edgeName] = true;
                    }
                });

            var extraEdges = [];

            _.each(targets, function (target) {
                var edgeName = source + '-' + target;
                if (!edgeNames[edgeName]) {
                    // Edge does not exists.  Add to view
                    if (SigmaRenderer._core.graph.nodesIndex[source] &&
                        SigmaRenderer._core.graph.nodesIndex[target]) {

                        // Add edge
                        var newEdge = {
                            source: source,
                            target: target,
                            weight: 0.8,
                            size: 0.8,
                            label: 'extra',
                            id: edgeName,
                            type: 'curve',
                            attr: {
                                type: 'extra'
                            }
                        };
                        if (!SigmaRenderer._core.graph.edgesIndex[edgeName]) {
                            SigmaRenderer.addEdge(edgeName, source, target, newEdge);
                            extraEdges.push(newEdge);
                        }
                    }
                }
            });
            this.model.set('extraEdges', extraEdges);
            return edgeNames;
        },


        /**
         *
         * @param pathArray - Array of lists.  Each list contains sequence of Term IDs.
         */
        showPath: function (pathArray) {

            // Ignore if path data is not available.
            if (pathArray === undefined || pathArray.length === 0) {
                return;
            }

            console.log('@showpath called: number of path = ' + pathArray.length);
            // Add edges from DAG (1st neighbours only)
            var edgeExists = this.addHiddenEdges(pathArray);

            // Valid path - all nodes exists on the current view.
            var validPaths = [];
            var targetNodes = {};
            _.each(pathArray, function (path) {
                targetNodes[path[1]] = true;
                // neighbours are always valid.
                var isValidPath = true;
                var pathLength = path.length;
                for (var i = 0; i < pathLength - 1; i++) {
                    var edge = edgeExists[[path[i] + '-' + path[i + 1]]];
                    if (edge === undefined) {
                        isValidPath = false;
                        break;
                    }
                }
                if (isValidPath) {
                    validPaths.push(path);
                }
            });


            _.each(validPaths, function (path) {
                _.each(path, function (pathNode) {
                    targetNodes[pathNode] = true;
                });
            });

            console.log(targetNodes);
            this.highlight(targetNodes, false, pathArray[0][0]);
        },

        refresh: function () {
            SigmaRenderer
                .iterEdges(function (edge) {
                    if (edge.label === 'extra') {
                        SigmaRenderer.dropEdge(edge.id);
                    }
                    edge.color = edge.attr.originalColor;
                    edge.attr.grey = false;
                })
                .iterNodes(function (node) {
                    node.color = node.attr.originalColor;
                    node.attr.grey = false;
                    node.forceLabel = false;
                });
            this.fit();
        },

        fit: function () {
            SigmaRenderer.position(0, 0, 1).draw();
        },

        highlight: function (targetNodes, nodesOnly, queryNode) {

            if (nodesOnly === false) {
                SigmaRenderer.iterEdges(function (edge) {
                    if (edge.color !== SELECTED_NODE_COLOR && edge.color !== DIM_COLOR) {
                        edge.attr.originalColor = edge.color;
                    }
                    var sourceId = edge.source;
                    var targetId = edge.target;

                    if (targetNodes[sourceId] === undefined || targetNodes[targetId] === undefined) {
                        // Not on the path.  DIM all of those.
                        if (!edge.attr.grey) {
                            edge.color = DIM_COLOR;
                            edge.attr.grey = true;
                        }
                    } else if (edge.label === 'extra') {
                        edge.color = 'rgba(255,94,25,0.7)';
                        edge.attr.grey = false;
                    } else {
                        edge.color = SELECTED_NODE_COLOR;
                        edge.attr.grey = false;
                    }
                });
            } else {
                SigmaRenderer.iterEdges(function (edge) {
                    if (edge.color !== SELECTED_NODE_COLOR && edge.color !== DIM_COLOR) {
                        edge.attr.originalColor = edge.color;
                    }

                    edge.color = DIM_COLOR;
                    edge.attr.grey = true;

                });
            }

            SigmaRenderer.iterNodes(function (node) {
                if (node.color !== SELECTED_NODE_COLOR && node.color !== DIM_COLOR && node.color !== QUERY_NODE_COLOR) {
                    node.attr.originalColor = node.color;
                }

                if (queryNode !== undefined && node.id === queryNode) {
                    node.color = QUERY_NODE_COLOR;
                    node.attr.grey = false;
                    node.forceLabel = true;
                } else if (!targetNodes[node.id]) {
                    node.color = DIM_COLOR;
                    node.attr.grey = true;
                    node.forceLabel = false;
                } else {
                    node.color = SELECTED_NODE_COLOR;
                    node.attr.grey = false;
                    node.forceLabel = true;
                }
            }).draw(2, 2, 2);
        }
    });

    return NetworkView;

});