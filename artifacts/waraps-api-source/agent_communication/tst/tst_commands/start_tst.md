
# start-tst

The "start-tst" command is sent to an agent to start the delegation of the tasks included in a tree. The command contains the tst tree that the agent should delegate or participate in.

In the following example the command contains a TST tree which contains two "move-to" tasks that are to be delegated by "tst_delegator_name" to two different agents, specified by an alias A and B.
If the tasks were to be executed by specific agents, the alias A should be replaced by "/" and the name of the agent. For example "/drone1".


<!-- tabs:start -->

## **JSON task example**
```json
{
  "com-uuid": "7300d049-176f-4dcb-b0bf-151980d5611a",
  "command": "start-tst",
  "receiver": "tst_delegator_name",
  "sender": "c2",
  "tst": {
    "common_params": {
      "execunit": "/tst_delegator_name",
      "node-uuid": "6e4e360f-7248-47ce-8490-9332afcb91df"
    },
    "name": "conc",
    "params": {},
    "children": [
      {
        "children": [],
        "common_params": {
          "execunit": "A"
        },
        "name": "move-to",
        "meta": {
          "reference": "no_go_beach_A"
        },
        "params": {
          "target-type": "boat",
          "target-size": 2,
          "speed": "fast",
          "waypoint":
            {
              "latitude": 57.761467232936354,
              "longitude": 16.680135220525187,
              "altitude": 0,
              "rostype": "GeoPoint"
            }
        }
      },
      {
        "children": [],
        "common_params": {
          "execunit": "B"
        },
        "name": "move-to",
        "meta": {
          "reference": "nogo__zone-A"
        },
        "params": {
          "target-type": "person",
          "target-size": 2,
          "speed": "fast",
          "waypoint":
            {
              "latitude": 57.76092056857479,
              "longitude": 16.681076220107087,
              "altitude": 0,
              "rostype": "GeoPoint"
            }
        }
      }
    ]
  }
}
```

## **JSON response example**
```json
{
    "root-uuid": "fe1fbcee-1cae-4a69-b9f7-83914454a7a7",
    "com-uuid": "1c5284da-b803-49d1-8c39-b96ef00603e7",
    "response": "running",
    "fail-reason": "",
    "response-to": "7300d049-176f-4dcb-b0bf-151980d5611a"
}
```

<!-- tabs:end -->
