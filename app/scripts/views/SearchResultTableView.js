/**
 * Created with JetBrains WebStorm.
 * User: kono
 * Date: 2013/07/15
 * Time: 14:50
 * To change this template use File | Settings | File Templates.
 */

/*global define*/
'use strict';
define([

    'bootstrap',
    'underscore',
    'backbone',
    'EventHelper',
    'collections/SearchResults',
    'views/SigmaRenderer',
    'views/SearchResultView'

], function (jquery, _, Backbone, EventHelper, SearchResults, SigmaRenderer, SearchResultView) {

    var ID_SEARCH_RESULTS = '#mainpanel';

    var SearchResultTableView = Backbone.View.extend({

        el: ID_SEARCH_RESULTS,

        isDisplay: false,
        isAdvanced: false,

        currentNetwork: {},

        nameSpace: 'NEXO',

        events: {
            'click #search-button': 'searchButtonPressed',
            'click #clear-button': 'clearButtonPressed',
            'click #help-button': 'helpButtonPressed',
            'keypress #query': 'searchDatabase',
            'click .radio': 'searchModeChanged',

            'click #advanced-button': 'advancedButtonPressed',
            'click #enrich-submit': 'runEnrichment',
            'click #enrich-reset': 'resetButtonPressed',

            'mouseenter': 'show',
            'mouseleave': 'hide',

            'click tr': 'rowClick'
        },

        show: function() {
            this.$el.animate({width: '500px'});
            this.$('#result-table').show(600);
        },

        hide: function() {
            this.$('#result-table').hide(600);
            this.$el.animate({width: '350px'});
        },

        rowClick: function (row) {

            // Clear selection
            var tableObjects = this.$('.res-table');

            _.each(tableObjects, function (tableObject) {
                $(tableObject).find('tr').each(function () {
                    $(this).removeClass('selected');
                });
            });

            $(row.currentTarget).addClass('selected');
            var id = $(row)[0].currentTarget.firstChild.innerText;
            this.collection.trigger(EventHelper.SEARCH_RESULT_SELECTED, id);
        },


        initialize: function () {
            this.collection = new SearchResults();
            var tableObject = this.$('#result-table');
            tableObject.hide();
            var enrich = this.$('#enrich');
            enrich.hide();
        },


        /**
         * This function will be called when user switches the ontology tree.
         */
        currentNetworkChanged: function (e) {
            var currentNetwork = e.get('currentNetwork');

            var networkName = currentNetwork.get('name');
            var parts = networkName.split(' ');
            var nameSpace = parts[0].toUpperCase();
            this.nameSpace = nameSpace;
            this.currentNetwork = currentNetwork;

            // Reset search result when switching ontology tree.
            this.clearButtonPressed();
        },


        render: function (query) {
            var resultTableElement = $('#result-table');
            resultTableElement.empty();

            if (this.collection.size() === 0) {
                this.$('#result-table').append(
                    '<tr><td>' + 'No Match!' + '</td></tr>').slideDown(1000, 'swing');
                return;
            }

            // This should not happen!
            if (query === undefined) {
                return;
            }

            var queryArray = query.queryArray;

            // Check existing nodes
            var nodeMap = {};
            SigmaRenderer
                .iterNodes(function (node) {
                    nodeMap[node.id] = true;
                });


            this.$('#result-table').append('<tr><th>ID</th><th>Term Name</th><th>Matches</th></tr>');

            var labelHits = [];

            this.collection.each(function (result) {
                var id = result.get('name');
                if (nodeMap[id] === true) {
                    var label = result.get('label');
                    _.each(queryArray, function (query) {
                        var regex = new RegExp(query, 'i');
                        if (label.match(regex)) {
                            labelHits.push(result);
                        }
                    });
                }
            });

            var sorted = _.union(labelHits, []);

            this.collection.each(function (result) {
                var id = result.get('name');
                if (nodeMap[id] === true && _.contains(labelHits, result) === false) {
                    sorted.push(result);
                }
            });

            _.each(sorted, function (result) {
                this.renderResult(result, queryArray);
            }, this);

            this.$('#result-table').show(600);
            this.$el.animate({width: '500px'});
        },

        renderResult: function (result, query) {


            var resultView = new SearchResultView({
                model: result
            });

            var rendered = resultView.render(query);
            $('#result-table').append(rendered.$el.html());

        },

        search: function (query, searchByGenes) {
            var self = this;

            // Remove all results.
            this.collection.reset();

            var searchUrl = '';
            if (searchByGenes) {
                searchUrl = '/search/genes/' + query;
            } else {
                searchUrl = '/search/' + this.nameSpace + '/' + query;
            }


            $.getJSON(searchUrl, function (searchResult) {
                var query;

                if (searchResult !== undefined && searchResult.length !== 0) {
                    query = self.filter(searchResult);
                    EventHelper.trigger(EventHelper.NODES_SELECTED, self.collection.models);
                }
                self.render(query);
            });
        },

        filter: function (searchResults) {
            var self = this;

            var keySet = [];
            _.each(searchResults, function (result) {
                var name = result.name;

                if (!_.contains(keySet, name)) {
                    self.collection.add(result);
                }
                keySet.push(name);
            });

            return searchResults[0];
        },

        searchDatabase: function (event) {
            var charCode = event.charCode;

            // Enter key
            if (charCode === 13) {
                var byGenes = $('#byGenes')[0].checked;
                event.preventDefault();
                var query = $('#query').val();
                this.search(query, byGenes);
            }
        },

        searchButtonPressed: function () {
            var originalQuery = $('#query').val();
            var byGenes = $('#byGenes')[0].checked;

            // Ignore empty
            if (!originalQuery || originalQuery === '') {
                return;
            }
            // Validate input
            this.search(originalQuery, byGenes);
        },

        clearButtonPressed: function () {
            var resultTableElement = $('#result-table');

            this.$el.animate({width: '350px'});

            resultTableElement.slideUp(500).empty();
            $('#query').val('');
            EventHelper.trigger(EventHelper.CLEAR);
        },

        helpButtonPressed: function () {
            window.open('../documentation.html');
        },

        advancedButtonPressed: function () {
            var advancedPanel = $('#enrich');
            advancedPanel.slideToggle(500);
            if (this.isAdvanced) {
                this.$('#advanced-button').attr('data-icon', 'd');
                this.isAdvanced = false;
            } else {
                this.$('#advanced-button').attr('data-icon', 'u');
                this.isAdvanced = true;
            }
        },

        resetButtonPressed: function () {
            $('#gene-list').val('');
            $('#enrich-table').slideUp(500).empty();
        },

        runEnrichment: function () {
            var params = this.validateEnrichParams();

            var self = this;
            $.post(
                '/enrich',
                params,
                function (result) {
                    var labelMap = self.currentNetwork.get('nodeLabel2id');
                    var ontology = self.currentNetwork.get('config').ontologyType;

                    _.each(result.results, function (res) {
                        if(ontology === 'NEXO') {
                            res.name = 'NEXO:' + res.id;
                        } else {
                            res.name = res.id;
                        }
                        res.label = labelMap[res.name];
                    });
                    EventHelper.trigger(EventHelper.ENRICHED, result);

                }
            );
        },

        validateEnrichParams: function () {
            var params = {};

            var genes = this.$('#gene-list').val();
            var pval = this.$('#pval').val();
            var minGenes = this.$('#num-genes').val();
            var ontology = this.currentNetwork.get('config').ontologyType;

            if (pval === undefined || pval === '' || pval === null) {
                pval = 0.01;
            } else {
                pval = parseFloat(pval);
            }

            if (minGenes === undefined || minGenes === '' || minGenes === null) {
                minGenes = 2;
            } else {
                minGenes = parseInt(minGenes, 10);
            }

            console.log('CUTOFF = ' + pval);
            console.log('MIN = ' + minGenes);
            console.log(this.currentNetwork);
            console.log(this.currentNetwork.get('config'));
            console.log('ONTOLOGY2 = ' + ontology);

            params.genes = genes;
            params.alpha = pval;
            params.type = ontology;
            params['min-assigned'] = minGenes;

            // Set values to the text boxes
            $('#pval').val(pval);
            $('#num-genes').val(minGenes);

            return params;
        }
    });

    return SearchResultTableView;
});