/**
 * Created with JetBrains WebStorm.
 * User: kono
 * Date: 2013/08/01
 * Time: 13:08
 * To change this template use File | Settings | File Templates.
 */

/*global define*/
'use strict';

define([
    'backbone'
], function (Backbone) {

    var EnrichedTerms = Backbone.Collection.extend({

        comparator: function (model) {
            return model.get('p-value');
        }
    });

    return EnrichedTerms;
});