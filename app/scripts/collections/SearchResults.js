/**
 * Created with JetBrains WebStorm.
 * User: kono
 * Date: 2013/07/15
 * Time: 14:57
 * To change this template use File | Settings | File Templates.
 */

/*global define*/
'use strict';

define([
    'backbone'
], function (Backbone) {

    var SearchResults = Backbone.Collection.extend({

        comparator: function (model) {
            var label = model.get('label');

            if(label !== undefined && label !== '' ) {
                return label;
            } else {
                return undefined;
            }
        }
    });

    return SearchResults;
});