/**
 * Created with JetBrains WebStorm.
 * User: kono
 * Date: 2013/07/15
 * Time: 12:56
 * To change this template use File | Settings | File Templates.
 */

/*global define*/
'use strict';

define([

    'backbone'

], function (Backbone) {

    var CyNetwork = Backbone.Model.extend({

        initialize: function () {
            this.updateURL();
        },

        updateURL: function () {
            this.url = '/' + this.get('termId') + '/interactions';
        }

    });

    return CyNetwork;
});
