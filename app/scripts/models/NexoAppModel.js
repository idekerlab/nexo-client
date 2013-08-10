/**
 * Created with JetBrains WebStorm.
 * User: kono
 * Date: 2013/07/15
 * Time: 13:48
 * To change this template use File | Settings | File Templates.
 */

/*global define*/
'use strict';

define([

    'underscore',
    'backbone',
    'EventHelper',
    'models/Network',
    'collections/Networks',
    'views/NetworkView'

], function (_, Backbone, EventHelper, Network, Networks, NetworkView) {

    var DEFAULT_NETWORK = 'NeXO';

    var NexoAppModel = Backbone.Model.extend({

        networkViewManager: {},

        initialize: function () {
            var self = this;
            $.getJSON(self.get('settingFileLocation'), function (configObject) {
                self.set('appConfig', configObject);

                var networkManager = new Networks();
                self.set('networkManager', networkManager);

                // Load networks
                self.loadNetworkSettings();

                // Fire event: Application is ready to use.
                self.trigger(EventHelper.INITIALIZED);

                console.log(networkManager);
            });
        },

        loadNetworkSettings: function () {
            var networks = this.get('appConfig').networks;

            var nexoTree = {};
            for (var i = 0; i < networks.length; i++) {
                var network = networks[i];
                var tree = {};
                if (network.name === DEFAULT_NETWORK) {

                    tree = new Network({name: network.name, config: network, loadAtInit: true});
                    nexoTree = tree;
                } else {
                    tree = new Network({name: network.name, config: network, loadAtInit: false});
                }
                this.get('networkManager').add(tree);
            }

            // Initialize NeXO view only.
            $('#network-title').html(nexoTree.get('name'));

            console.log(nexoTree);
            var nexoView = new NetworkView({model: nexoTree});
            this.networkViewManager[nexoTree.get('name')] = nexoView;

            // Set current
            this.set('currentNetwork', nexoTree);
            this.set('currentNetworkView', nexoView);
        },

        loadNetworkDataFile: function (targetNetwork) {

            console.log(targetNetwork);
            var network = targetNetwork[0];
            var networkName = network.get('name');
            console.log('GOT Network Selected ===> ' + networkName);
            var networkView = this.networkViewManager[networkName];

            console.log(networkView);

            network.loadNetworkData();
            if (networkView === undefined || networkView === null) {
                console.log('Need to create view ===> ' + networkName);
                networkView = new NetworkView({model: network});
                this.networkViewManager[networkName] = networkView;
            }

            networkView.render();

            $('#network-title').html(networkName);

            // Set current
            this.set('currentNetwork', network);
            this.set({currentNetworkView: networkView});
        }
    });


    return NexoAppModel;
});