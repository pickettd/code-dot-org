/**
 * Copyright 2015 Code.org
 * http://code.org/
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

/**
 * @fileoverview Generator and controller for instance lobby/connection controls.
 */

/* jshint
 funcscope: true,
 newcap: true,
 nonew: true,
 shadow: false,
 unused: true,

 maxlen: 90,
 maxparams: 3,
 maxstatements: 200
 */
/* global $ */
'use strict';

var dom = require('../dom');
var NetSimConnection = require('./NetSimConnection');
var markup = require('./NetSimLobby.html');

/**
 * How often the lobby should be auto-refreshed.
 * @type {number}
 * @const
 */
var AUTO_REFRESH_INTERVAL_MS = 5000;
var CLOSED_REFRESH_INTERVAL_MS = 30000;

/**
 * @param {NetSimConnection} connection - The instance connection that this
 *                           lobby control will manipulate.
 * @constructor
 */
var NetSimLobby = function (connection) {

  /**
   * Instance connection that this lobby control will manipulate.
   * @type {NetSimConnection}
   * @private
   */
  this.connection_ = connection;
  this.connection_.statusChanges.register(this, this.refreshLobby_);

  /**
   * When the lobby should be refreshed next
   * @type {Number}
   * @private
   */
  this.nextAutoRefreshTime_ = Infinity;

  /**
   * Which item in the lobby is currently selected
   * @type {number}
   * @private
   */
  this.selectedID_ = undefined;

  /**
   * Which listItem DOM element is currently selected
   * @type {*}
   * @private
   */
  this.selectedListItem_ = undefined;
};
module.exports = NetSimLobby;

/**
 * Generate a new NetSimLobby object, putting
 * its markup within the provided element and returning
 * the controller object.
 * @param {DOMElement} The container for the lobby markup
 * @param {NetSimConnection} The connection manager to use
 * @return {NetSimLobby} A new controller for the generated lobby
 * @static
 */
NetSimLobby.createWithin = function (element, connection) {
  // Create a new NetSimLobby
  var controller = new NetSimLobby(connection);
  element.innerHTML = markup({});
  controller.initialize();
  return controller;
};

/**
 *
 */
NetSimLobby.prototype.initialize = function () {
  this.bindElements_();
  this.refreshInstanceList_();
};

/**
 * Grab the DOM elements related to this control -once-
 * and bind them to member variables.
 * Also attach method handlers.
 */
NetSimLobby.prototype.bindElements_ = function () {
  this.lobbyOpenDiv_ = document.getElementById('netsim_lobby_open');
  this.lobbyClosedDiv_ = document.getElementById('netsim_lobby_closed');

  this.instanceSelector_ = document.getElementById('netsim_instance_select');
  $(this.instanceSelector_).change(this.onInstanceSelectorChange_.bind(this));

  this.lobbyList_ = document.getElementById('netsim_lobby_list');

  this.addRouterButton_ = document.getElementById('netsim_lobby_add_router');
  dom.addClickTouchEvent(this.addRouterButton_,
      this.addRouterButtonClick_.bind(this));

  this.connectButton_ = document.getElementById('netsim_lobby_connect');
  dom.addClickTouchEvent(this.connectButton_,
      this.connectButtonClick_.bind(this));

  this.disconnectButton_ = document.getElementById('netsim_lobby_disconnect');
  dom.addClickTouchEvent(this.disconnectButton_,
      this.disconnectButtonClick_.bind(this));

  this.connectionStatusSpan_ = document.getElementById('netsim_lobby_statusbar');

  this.refreshLobby_();
};

/**
 *
 */
NetSimLobby.prototype.onInstanceSelectorChange_ = function () {
  if (this.connection_.isConnectedToInstance()) {
    this.connection_.disconnectFromInstance();
    this.nextAutoRefreshTime_ = Infinity;
  }

  if (this.instanceSelector_.value !== '__none') {
    this.connection_.connectToInstance(this.instanceSelector_.value);
  }
};

NetSimLobby.prototype.addRouterButtonClick_ = function () {
  this.connection_.addRouterToLobby();
};

NetSimLobby.prototype.connectButtonClick_ = function () {
  if (!this.selectedID_) {
    return;
  }

  this.connection_.connectToRouter(this.selectedID_);
};

NetSimLobby.prototype.disconnectButtonClick_ = function () {
  this.connection_.disconnectFromRouter();
};

/**
 * Make an async request against the dashboard API to
 * reload and populate the user sections list.
 */
NetSimLobby.prototype.refreshInstanceList_ = function () {
  var self = this;
  // TODO (bbuchanan) : Use unique level ID when generating instance ID
  var levelID = 'demo';
  var instanceSelector = this.instanceSelector_;
  this.getUserSections_(function (data) {
    $(instanceSelector).empty();

    if (0 === data.length){
      // If we didn't get any sections, we must deny access
      $('<option>')
          .val('__none')
          .html('-- NONE FOUND --')
          .appendTo(instanceSelector);
      return;
    } else {
      // If we have more than one section, require the user
      // to pick one.
      $('<option>')
          .val('__none')
          .html('-- PICK ONE --')
          .appendTo(instanceSelector);
    }

    // Add all instances to the dropdown
    data.forEach(function (section) {
      // TODO (bbuchanan) : Put teacher names in sections
      $('<option>')
          .val('netsim_' + levelID + '_' + section.id)
          .html(section.name)
          .appendTo(instanceSelector);
    });

    self.onInstanceSelectorChange_();
  });
};

NetSimLobby.prototype.refreshLobby_ = function () {
  var self = this;
  var lobbyList = this.lobbyList_;

  if (this.connection_.isConnectedToRouter()) {
    // Just show the status line and the disconnect button
    $(this.lobbyClosedDiv_).show();
    $(this.lobbyOpenDiv_).hide();
    $(this.connectionStatusSpan_).html(this.connection_.status_ + ' ' +
        this.connection_.getStatusDetail());

  } else {
    // Show the lobby and connection selector
    $(this.lobbyOpenDiv_).show();
    $(this.lobbyClosedDiv_).hide();

    if (!this.connection_.isConnectedToInstance()) {
      $(lobbyList).empty();
      $(this.connectButton_).hide();
      return;
    }

    this.connection_.fetchLobbyListing(function (lobbyData) {
      $(lobbyList).empty();
      $(self.connectButton_).show();

      lobbyData.sort(function (a, b) {
        if (a.name === b.name) {
          return 0;
        } else if (a.name > b.name) {
          return 1;
        }
        return -1;
      });

      self.selectedListItem_ = undefined;
      lobbyData.forEach(function (connection) {
        var item = $('<li>');
        $('<a>')
            .attr('href', '#')
            .html(connection.name + ' : ' +
                connection.status + ' ' +
                connection.statusDetail)
            .appendTo(item);

        // Style rows by row type.
        if (connection.id === self.connection_.myLobbyRowID_) {
          item.addClass('own_row');
        } else if (connection.type === NetSimConnection.LobbyRowType.ROUTER) {
          item.addClass('router_row');
        } else {
          item.addClass('user_row');
        }

        // Preserve selected item across refresh.
        if (connection.id === self.selectedID_) {
          item.addClass('selected_row');
          self.selectedListItem_ = item;
        }

        dom.addClickTouchEvent(item[0], self.onRowClick_.bind(self, item, connection));
        item.appendTo(lobbyList);
      });

      self.onSelectionChange();

      if (self.nextAutoRefreshTime_ === Infinity) {
        self.nextAutoRefreshTime_ = 0;
      }
    });
  }
};

/**
 *
 * @param {*} connectionTarget - Lobby row for clicked item
 * @private
 */
NetSimLobby.prototype.onRowClick_ = function (listItem, connectionTarget) {
  // Can't select own row
  if (this.connection_.myLobbyRowID_ === connectionTarget.id) {
    return;
  }

  var oldSelectedID = this.selectedID_;
  var oldSelectedListItem = this.selectedListItem_;

  // Deselect old row
  if (oldSelectedListItem) {
    oldSelectedListItem.removeClass('selected_row');
  }
  this.selectedID_ = undefined;
  this.selectedListItem_ = undefined;

  // If we clicked on a different row, select the new row
  if (connectionTarget.id !== oldSelectedID) {
    this.selectedID_ = connectionTarget.id;
    this.selectedListItem_ = listItem;
    this.selectedListItem_.addClass('selected_row');
  }

  this.onSelectionChange();
};

NetSimLobby.prototype.onSelectionChange = function () {
  this.connectButton_.disabled = (this.selectedListItem_ === undefined);
};

/**
 * Send a request to dashboard and retrieve a JSON array listing the
 * sections this user belongs to.
 * @param callback
 * @private
 */
NetSimLobby.prototype.getUserSections_ = function (callback) {
  // TODO (bbuchanan) : Get owned sections as well, to support teachers.
  // TODO (bbuchanan) : Handle failure case nicely.  Maybe wrap callback
  //                    and nicely pass list to it.
  // TODO (bbuchanan): Wrap this away into a shared library for the v2/sections api
  $.ajax({
    dataType: 'json',
    url: '/v2/sections/membership',
    success: callback
  });
};

/**
 *
 * @param {RunLoop.Clock} clock
 */
NetSimLobby.prototype.tick = function (clock) {
  if (clock.time >= this.nextAutoRefreshTime_) {
    this.refreshLobby_();
    var refreshInterval = this.connection_.isConnectedToRouter() ?
        CLOSED_REFRESH_INTERVAL_MS : AUTO_REFRESH_INTERVAL_MS;

    // TODO (bbuchanan) : Extract "interval" method generator for this and connection.
    if (this.nextAutoRefreshTime_ === 0) {
      this.nextAutoRefreshTime_ = clock.time + refreshInterval;
    } else {
      // Stable increment
      while (this.nextAutoRefreshTime_ < clock.time) {
        this.nextAutoRefreshTime_ += refreshInterval;
      }
    }
  }
};