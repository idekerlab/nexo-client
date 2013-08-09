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

            'click tr': 'rowClick'
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


        currentNetworkChanged: function (e) {
            var currentNetwork = e.get('currentNetwork');

            var networkName = currentNetwork.get('name');
            var parts = networkName.split(' ');
            var nameSpace = parts[0].toUpperCase();
            this.nameSpace = nameSpace;
            this.currentNetwork = currentNetwork;
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
                        if (label.indexOf(query) !== -1) {
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

                    console.log(searchResult);

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

                console.log('## ROW origin = ' + name);
                console.log(keySet);

                if (!_.contains(keySet, name)) {
                    self.collection.add(result);
                }
                keySet.push(name);
            });
            console.log(this.collection.models);

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

        runEnrichment: function () {
            var params = this.validateEnrichParams();

            var self = this;
            $.post(
                '/enrich',
                params,
                function (result) {
                    var labelMap = self.currentNetwork.get('nodeLabel2id');

                    console.log(labelMap);

                    _.each(result.results, function (res) {
                        res.name = 'NEXO:' + res.id;
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

            params.genes = genes;
            params.alpha = pval;
            params['min-assigned'] = minGenes;

            return params;
        }
    });

    return SearchResultTableView;
});