'use strict';

/*global define*/
define([

    'underscore',
    'backbone',
    'EventHelper',
    'collections/EnrichedTerms',
    'views/EnrichTableRowView'

], function (_, Backbone, EventHelper, EnrichedTerms, EnrichTableRowView) {

    var ID_ENRICHED = '#mainpanel';

    var EnrichView = Backbone.View.extend({

        el: ID_ENRICHED,

        initialize: function() {
            this.collection = new EnrichedTerms();
            var tableObject = this.$('#enrich-table');
            tableObject.hide();
        },

        processResult: function(result) {
            var self = this;

            this.collection.reset();
            var results = result.results;

            _.each(results, function(enrichedTerm) {

                var termId = enrichedTerm.id;
                var pVal = enrichedTerm['p-value'];
                var genes = enrichedTerm.genes;
                var name = enrichedTerm.label;

                self.collection.add(enrichedTerm);

                console.log(termId + ', ' + pVal + ', ' + genes + ', ' + name);
            });

            this.collection.sort();
            this.render();
        },

        render: function() {

            var enrichTable = this.$('#enrich-table');
            enrichTable.empty();

            enrichTable.append('<tr><th>ID</th><th>Name</th><th>Genes</th><th>p-value</th></tr>');
            this.collection.each(function (result) {

                var resultView = new EnrichTableRowView({
                    model: result
                });

                var rendered = resultView.render();
                enrichTable.append(rendered.$el.html());
            }, this);


            EventHelper.trigger(EventHelper.NODES_SELECTED, this.collection.models);

            enrichTable.show(600);
            this.$el.animate({width:'550px'});

        },

        clear: function() {
            var enrichTable = this.$('#enrich-table');
            enrichTable.hide();
            enrichTable.empty();
        }

    });

    return EnrichView;
});