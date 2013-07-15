/**
 * Created with JetBrains WebStorm.
 * User: kono
 * Date: 2013/07/15
 * Time: 15:28
 * To change this template use File | Settings | File Templates.
 */


/*global define*/
'use strict';

define([
    'backbone'
], function (Backbone) {

    var NodeDetails = Backbone.Model.extend({

        getDetails: function (selectedNodeId) {
            if (selectedNodeId === null || selectedNodeId === undefined) {
                //  Do nothing.
                return;
            }

            this.url = '/' + selectedNodeId;
            this.id = selectedNodeId;

            var self = this;
            this.fetch({
                success: function (data) {
                    var attr = data.attributes;
                    for (var key in attr) {
                        self.set(key, attr[key]);
                    }
                }
            });
        }
    });

    return NodeDetails;
});