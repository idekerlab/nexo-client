/**
 * Created with JetBrains WebStorm.
 * User: kono
 * Date: 2013/07/19
 * Time: 12:01
 * To change this template use File | Settings | File Templates.
 */

/*global define*/
'use strict';

define([

    'backbone',
    'EventHelper',

], function (Backbone, EventHelper) {

    var NetworkManagerView = Backbone.View.extend({

        el: "#commands",

        events: {
            "click .popover-content .networkName": "networkSelected"
        },


        initialize: function () {
            console.log("############ network manager");
            console.log(this.collection);

            this.render();

        },

        render: function () {
            var trees = $("#trees");
            trees.empty();

            var listString = "<ul class='nav nav-pills nav-stacked'>";
            var treeCount = this.collection.length;
            for (var i = 0; i < treeCount; i++) {
                var network = this.collection.at(i);
                var networkName = network.get("config").name;
                console.log(networkName);
                listString += "<li class='networkName'>" + networkName + "</li>";
            }

            listString += "</ul>";
            trees.attr("data-content", listString);
        },

        networkSelected: function (e) {
            var selectedNetworkName = e.currentTarget.textContent;
            var selectedNetwork = this.collection.where({name: selectedNetworkName});
            this.collection.trigger(EventHelper.NETWORK_SELECTED, selectedNetwork);

            // Hide popover
            this.$el.find("#trees").popover("hide");

        }
    });

    return NetworkManagerView;
});