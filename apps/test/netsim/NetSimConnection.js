'use strict';
/* global describe */
/* global beforeEach */
/* global it */

var testUtils = require('../util/testUtils');
testUtils.setupLocale('netsim');
var assert = testUtils.assert;
var assertEqual = testUtils.assertEqual;
var netsimTestUtils = require('../util/netsimTestUtils');
var fakeShard = netsimTestUtils.fakeShard;
var assertTableSize = netsimTestUtils.assertTableSize;

var NetSimLogger = require('@cdo/apps/netsim/NetSimLogger');
var NetSimConnection = require('@cdo/apps/netsim/NetSimConnection');
var NetSimClientNode = require('@cdo/apps/netsim/NetSimClientNode');
var NetSimRouterNode = require('@cdo/apps/netsim/NetSimRouterNode');

describe("NetSimConnection", function () {
  var connection, testShard, testWindow;

  beforeEach(function () {
    NetSimLogger.getSingleton().setVerbosity(NetSimLogger.LogLevel.NONE);
    testShard = fakeShard();
    testWindow = {
      addEventListener: function () {}
    };
    connection = new NetSimConnection({
      window: testWindow,
      enableCleanup: false
    });
  });

  describe("getAllNodes", function () {

    it ("returns an empty array when not connected", function () {
      assert(!connection.isConnectedToShard(), "Not connected");
      assertTableSize(testShard, 'nodeTable', 0);

      var allNodes;
      connection.getAllNodes(function (rows) {
        allNodes = rows;
      });

      assert(allNodes !== undefined, "Set allNodes");
      assertEqual([], allNodes);
    });

    it ("returns list of nodes when connected (should at least include own shard", function () {
      // Ugly manual way of connecting to the fake shard.
      connection.shard_ = testShard;
      connection.createMyClientNode_('Ada');
      assert(connection.isConnectedToShard(), "Connected to test shard");

      assertTableSize(testShard, 'nodeTable', 1);

      var allNodes;
      connection.getAllNodes(function (rows) {
        allNodes = rows;
      });

      assert(allNodes !== undefined, "Set allNodes");
      assertEqual(1, allNodes.length);
    });

    it ("returns correct node types", function () {
      // Ugly manual way of connecting to the fake shard.
      connection.shard_ = testShard;
      connection.createMyClientNode_('Ada');
      assert(connection.isConnectedToShard(), "Connected to test shard");

      connection.addRouterToLobby();

      assertTableSize(testShard, 'nodeTable', 2);

      var allNodes;
      connection.getAllNodes(function (rows) {
        allNodes = rows;
      });

      assertEqual(2, allNodes.length);
      assert(allNodes[0] instanceof NetSimClientNode, 'First node is a client node'); // Own node
      assert(allNodes[1] instanceof NetSimRouterNode, 'Second node is a router node'); // Router we created
    });
  });

});
