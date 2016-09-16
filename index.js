'use strict';

// Deps
require('dotenv').config(); // If using this in multi-environment (local and deployed versions) might want to add logic for checking NODE_ENV environment variable to load only if local
var RC = require('ringcentral');
var Helpers = require('ringcentral-helpers');
var http = require('http');
var util = require('util');

// Vars 
var rcServer, rcAppKey, rcAppSecret, rcUsername, rcPassword, rcExtension, rcCachePrefix;

// Set by environment
switch(process.env.RC_ENV) {
    case 'production':
        rcServer        = process.env.PROD_RC_API_BASE_URL;
        rcAppKey        = process.env.PROD_RC_APP_KEY;
        rcAppSecret     = process.env.PROD_RC_APP_SECRET;
        rcUsername      = process.env.PROD_RC_USERNAME;
        rcPassword      = process.env.PROD_RC_PASSWORD;
        rcExtension     = process.env.PROD_RC_EXTENSION;
        rcCachePrefix   = process.env.PROD_RC_CACHE_PREFIX;
    break;

    case 'sandbox':
        rcServer        = process.env.RC_API_BASE_URL;
        rcAppKey        = process.env.RC_APP_KEY;
        rcAppSecret     = process.env.RC_APP_SECRET;
        rcUsername      = process.env.RC_USERNAME;
        rcPassword      = process.env.RC_PASSWORD;
        rcExtension     = process.env.RC_EXTENSION;
        rcCachePrefix   = process.env.RC_CACHE_PREFIX;
    break;
}

// Initialize the RC SDK
var sdk = new RC({
    server: rcServer,
    appKey: rcAppKey,
    appSecret: rcAppSecret,
    cachePrefix: rcCachePrefix
});

// APP VARS
var server = http.createServer();
var Message = Helpers.message();
var platform = sdk.platform();
var subscription = sdk.createSubscription();

// Login to the RingCentral Platform
function login() {
    return platform.login({
            username: rcUsername,
            password: rcPassword,
            extension: rcExtension
        })
        .then(function (response) {
            console.log("Succesfully logged into the RC Account");
            //console.log("The RC auth object is :", JSON.stringify(response.json(), null, 2));
            init();
        })
        .catch(function (e) {
            console.error("ERROR: ", e);
            throw e;
        });
}

login();

function init() {
    var extensions = [];
    var page = 1;

    function getExtensionsPage() {

        return platform
            .get('/account/~/extension/', {
                type: 'User',
                status: 'Enabled',
                page: page,
                perPage: process.env.EXTENSIONS_PER_PAGE //REDUCE NUMBER TO SPEED BOOTSTRAPPING
            })
            .then(function (response) {
                //console.log("The extension response contained:", JSON.stringify(response.json(), null, 2));
                var data = response.json();
                //console.log("************** THE NUMBER OF EXTENSIONS ARE : ***************", data.records.length);
                extensions = extensions.concat(data.records);
                if (data.navigation.nextPage) {
                    page++;
                    return getExtensionsPage(); // this will be chained
                } else {
                    return extensions; // this is the finally resolved thing
                }
            });

    }

    /*
     Loop until you capture all extensions
     */
    return getExtensionsPage()
        .then(createEventFilter)
        .then(startSubscription)
        .catch(function (e) {
            console.error(e);
            throw e;
        });

}

function createEventFilter(extensions) {
    //console.log("********* CREATING EVENT FILTERS ***************");
    var _eventFilters = [];
    for(var i = 0; i < extensions.length; i++) {
        var extension = extensions[i];
        console.log('EXTENSION: ', extension);
        _eventFilters.push(generatePresenceEventFilter(extension));
    }
    //console.log('EVENT FILTERS: ', _eventFilters);
    return _eventFilters;
}

function generatePresenceEventFilter(item) {
    //console.log("The item is :", item);
    if (!item) {
        throw new Error('Message-Dispatcher Error: generatePresenceEventFilter requires a parameter');
    } else {
        console.log("The Presence Filter added for the extension :" + item.id + ' : /account/~/extension/' + item.id + '/presence?detailedTelephonyState=true&aggregated=true');
        return '/account/~/extension/' + item.id + '/presence?detailedTelephonyState=true&aggregated=true';
    }
}

function startSubscription(eventFilters) { //FIXME MAJOR Use devices list somehow
    //console.log("********* STARTING TO CREATE SUBSCRIPTION ON ALL FILTERED DEVICES ***************");
    return subscription
        .setEventFilters(eventFilters)
        .register();
}

// Register Platform Event Listeners
platform.on(platform.events.loginSuccess, handleLoginSuccess);
platform.on(platform.events.loginError, handleLoginError);
platform.on(platform.events.logoutSuccess, handleLogoutSuccess);
platform.on(platform.events.logoutError, handleLogoutError);
platform.on(platform.events.refreshSuccess, handleRefreshSuccess);
platform.on(platform.events.refreshError, handleRefreshError);

// Register Subscription Event Listeners
subscription.on(subscription.events.notification, handleSubscriptionNotification);
subscription.on(subscription.events.removeSuccess, handleRemoveSubscriptionSuccess);
subscription.on(subscription.events.removeError, handleRemoveSubscriptionError);
subscription.on(subscription.events.renewSuccess, handleSubscriptionRenewSuccess);
subscription.on(subscription.events.renewError, handleSubscriptionRenewError);
subscription.on(subscription.events.subscribeSuccess, handleSubscribeSuccess);
subscription.on(subscription.events.subscribeError, handleSubscribeError);

// Define Event Handlers
function handleSubscriptionNotification(msg) {
    console.log('SUBSCRIPTION NOTIFICATION.....');
    console.log(util.inspect(msg, {showHidden: true, depth: null}));
}

function handleRemoveSubscriptionSuccess(data) {
    console.log('REMOVE SUBSCRIPTION SUCCESS DATA: ', data);
}

function handleRemoveSubscriptionError(data) {
    console.log('REMOVE SUBSCRIPTION ERROR DATA: ', data);
}

function handleSubscriptionRenewSuccess(data) {
    console.log('RENEW SUBSCRIPTION SUCCESS DATA: ', data);
}

function handleSubscriptionRenewError(data) {
    console.log('RENEW SUBSCRIPTION ERROR DATA: ', data);
}

function handleSubscribeSuccess(data) {
    console.log('SUBSCRIPTION CREATED SUCCESSFULLY');
}

function handleSubscribeError(data) {
    console.log('FAILED TO CREATE SUBSCRIPTION: ', data);
}

/**
 * Platform Event Handlers
 **/
function handleLoginSuccess(data) {
    // UNCOMMENT TO VIEW LOGIN DATA
    console.log('LOGIN SUCCESS DATA: ', data.json());
}

function handleLoginError(data) {
    console.log('LOGIN FAILURE DATA: ', data);
}

function handleLogoutSuccess(data) {
    console.log('LOGOUT SUCCESS DATA: ', data);
}

function handleLogoutError(data) {
    console.log('LOGOUT FAILURE DATA: ', data);
}

function handleRefreshSuccess(data) {
    console.log('REFRESH SUCCESS DATA: ', data);
}

function handleRefreshError(data) {
    console.log('REFRESH FAILURE DATA: ', data);
    console.log('Initialing Login again :');
    login();
}

server.listen(process.env.PORT);
server.on('listening', function() {
    console.log('Server is listening on port: ', process.env.PORT);
});
server.on('close', function() {
    console.log('Server has closed and is no longer accepting connections');
});
server.on('error', function(err) {
    console.error(err);
});
server.on('request', inboundRequest);

function inboundRequest(req, res) {
    console.log('Inbound Request');
}
