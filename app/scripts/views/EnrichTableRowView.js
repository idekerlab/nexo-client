/**
 * Created with JetBrains WebStorm.
 * User: kono
 * Date: 2013/08/01
 * Time: 12:43
 * To change this template use File | Settings | File Templates.
 */

/*global define*/
'use strict';

define([

    'underscore',
    'backbone'

], function (_, Backbone) {

    var EnrichTableRowView = Backbone.View.extend({

        render: function () {

            var termId = 'NEXO:' + this.model.get('id');
            var pVal = this.model.get('p-value').toExponential(3);
            var genes = this.model.get('genes');


            var geneString = '';
            _.each(genes, function (gene) {
                    geneString += gene + ' ';
                }
            );

            var newRow = '<tr><td>' + termId + '</td><td>' + geneString + '</td><td>' + pVal + '</td></tr>';

            this.$el.append(newRow);

            return this;
        }
    });

    return EnrichTableRowView;
});