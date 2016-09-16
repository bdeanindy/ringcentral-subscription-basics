# RingCentral Subscription Basic Demo App

This is a demo application showing how to use RingCentral Push Notifications using the JS SDK. This application will GET all the Extensions (Enabled + User) in your RingCentral account (based on the environment, but defaults to Sandbox) and will add eventFilters in a single Subscription that will then receive Presence Events for these Extensions. The data from these presence events is then logged in the console of the application for you to review, and if you choose, filter and then execute external REST requests using the embedded HTTP server.

This is only a demo application to show how to use Subscriptions properly with the [RingCentral-JS](https://github.com/ringcentral/ringcentral-js) SDK. This code should not be used directly in production, but can be used for PoC development and testing.

## Prerequisites

* Valid RingCentral Account
* Access to [RingCentral Developer Portal](https://developer.ringcentral.com)
* Have created a RingCentral Sandbox Account for development. [Read how to do this here](https://developers.ringcentral.com/library/tutorials/test-account.html)
* Have configured your Sandbox Account to have one or more extensions which allow presence to be monitored. [Read how to setup Presence monitoring here](http://success.ringcentral.com/articles/en_US/RC_Knowledge_Article/How-to-choose-specific-user-extensions-to-monitor-for-Presence)
* Node.js installed locally

[![Deploy](https://www.herokucdn.com/deploy/button.svg)](https://heroku.com/deploy?template=https://github.com/bdeanindy/ringcentral-subscription-basics)

## Local Setup

1. Clone `git clone https://github.com/bdeanindy/ringcentral-subscription-basics` this repository and `cd ringcentral-subscription-basics` into the project directory
2. Install the dependencies `npm install`
3. Configure your environment `cp .env.tmpl .env`
4. Open the `.env` file and copy/paste your API keys and user credentials (admin user) into this file, then save/close it. 
5. Create an application in [RingCentral Developer Portal](https://developers.ringcentral.com/my-account.html#/create-app) with the following parameters:
    * Platform Type: Server-only (No UI)
    * Application Type: Private
    * Permissions Needed: Read Accounts, Read Call Log, Read Presence
    * Name/Description: What you choose, but I always use something easy to identify in lists


## Operation

1. To start the application, `npm start`
2. When you see "Subscription created successfully", you're ready to create a presence event to test
3. Call one of the numbers you have subscribed to in the application (currently this subscribes to all Enabled User extensions in your RingCentral Sandbox account) from your cellular or an outside line.
4. You should see an incoming msg (Notification) when you dial into one of these numbers.

## Troubleshooting

1. Not seeing presence events? Uncomment the console.log() which references `eventFilters` and re-run the application to see what extensions are being monitored
2. Subscription failing to setup? Have you setup extensions in your RingCentral Sandbox account? Have they been enabled to monitor for Presence events?
3. Anything else...add an issue and I will respond as soon as I am able
