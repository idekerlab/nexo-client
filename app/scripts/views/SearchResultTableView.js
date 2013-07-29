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

        nameSpace: 'NEXO',

        events: {
            'click #search-button': 'searchButtonPressed',
            'click #clear-button': 'clearButtonPressed',
            'click #help-button': 'helpButtonPressed',
            'keypress #query': 'searchDatabase',
            'click .radio': 'searchModeChanged',

            'click #advanced-button': 'advancedButtonPressed',

            'click tr': 'rowClick'
        },

        rowClick: function(row) {

            // Clear selection
            var tableObject = this.$('#result-table');
            tableObject.find('tr').each(function () {
                $(this).removeClass('selected');
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
            var networkName = e.get('currentNetwork').get('name');
            var parts = networkName.split(' ');
            var nameSpace = parts[0].toUpperCase();
            console.log('Current Namespace = ' + nameSpace);
            this.nameSpace = nameSpace;

        },


        render: function () {
            var resultTableElement = $('#result-table');
            resultTableElement.empty();

            console.log('Rendering table: ' + this.collection.size());
            if (this.collection.size() === 0) {
                this.$('#result-table').append(
                    '<tr><td>' + 'No Match!' + '</td></tr>').slideDown(1000, 'swing');
                return;
            }

            var queryObject = this.collection.at(0);

            // This should not happen!
            if (queryObject === undefined) {
                return;
            }

            var queryArray = queryObject.get('queryArray');

            // Check existing nodes
            var nodeMap = {};
            SigmaRenderer
                .iterNodes(function (node) {
                    nodeMap[node.id] = true;
                });


            this.$('#result-table').append('<tr><th>ID</th><th>Term Name</th><th>Matches</th></tr>');
            this.collection.each(function (result) {
                var name = result.get('name');
                if (result !== queryObject && nodeMap[name]) {
                    this.renderResult(result, queryArray);
                }
            }, this);

            this.$('#result-table').show(600);

            if (this.isDisplay === false) {
                this.$el.animate({width: '+=150px'}, 'slow', 'swing');
                this.isDisplay = true;
            }
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

            this.collection.reset();

            var searchUrl = '';
            if (searchByGenes) {
                searchUrl = '/search/genes/' + query;
            } else {
                searchUrl = '/search/' + this.nameSpace + '/' + query;
            }

            console.log('NS = ' + this.nameSpace);

            $.getJSON(searchUrl, function (searchResult) {
                if (searchResult !== undefined && searchResult.length !== 0) {
                    self.filter(searchResult, self);
                    self.collection.trigger(EventHelper.NODES_SELECTED, self.collection.models);
                }

                self.render();
            });
        },

        filter: function (results, self) {
            var keySet = [];
            _.each(results, function (result) {
                var name = result.name;
                if (!_.contains(keySet, name)) {
                    self.collection.add(result);
                }
                keySet.push(name);
            });
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

            if (this.isDisplay) {
                this.$el.animate({width: '-=150px'}, 'slow', 'swing');
                this.isDisplay = false;
            }
            resultTableElement.slideUp(500).empty();
            $('#query').val('');
            this.trigger(EventHelper.CLEAR);
        },

        helpButtonPressed: function() {
            window.open('../documentation.html');
        },

        advancedButtonPressed: function () {
            var advancedPanel = $('#enrich');
            advancedPanel.slideToggle(500);
            if(this.isAdvanced) {
                this.$('#advanced-button').attr('data-icon','d');
                this.isAdvanced = false;
            } else {
                this.$('#advanced-button').attr('data-icon','u');
                this.isAdvanced = true;
            }
        }
    });

    return SearchResultTableView;
});