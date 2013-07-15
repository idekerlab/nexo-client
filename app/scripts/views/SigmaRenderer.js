/**
 * Created with JetBrains WebStorm.
 * User: kono
 * Date: 2013/07/15
 * Time: 12:09
 * To change this template use File | Settings | File Templates.
 */

/*global define*/
'use strict';

define([
    'sigma'
], function(sigma) {

    var SigmaRenderer = sigma.init(document.getElementById('sigma-canvas'));

    return SigmaRenderer;
});

