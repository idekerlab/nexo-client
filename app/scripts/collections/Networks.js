/**
 * Created with JetBrains WebStorm.
 * User: kono
 * Date: 2013/07/19
 * Time: 12:03
 * To change this template use File | Settings | File Templates.
 */

/*global define*/
'use strict';

define([
    'backbone'
], function (Backbone) {

    var Networks = Backbone.Collection.extend({

        comparator: function (model) {
            return model.get('id');
        }
    });

    return Networks;
});