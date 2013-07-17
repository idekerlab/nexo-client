/*global require*/
'use strict';

require.config({
    shim: {
        underscore: {
            exports: '_'
        },
        backbone: {
            deps: [
                'underscore',
                'jquery'
            ],
            exports: 'Backbone'
        },
        bootstrap: {
            deps: ['jquery'],
            exports: 'jquery'
        },
        sigma: {
            exports: 'sigma'
        }
    },
    paths: {
        jquery: '../bower_components/jquery/jquery',
        backbone: '../bower_components/backbone-amd/backbone',
        underscore: '../bower_components/underscore-amd/underscore',
        bootstrap: 'vendor/bootstrap',
        sigma: 'vendor/sigma/sigma'
    }
});

require([
    'backbone',
    'views/NexoAppView'
], function (Backbone, NexoAppView) {
    new NexoAppView();
    Backbone.history.start();
});