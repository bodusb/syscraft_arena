# Service Communication
?> _TODO_*Add General information related to service communication*

**Some design decisions:**<br>
• Services send regular heartbeat messages with some information on a topic<br>
• Sending a heartbeat message allows for registering the availability of the service to the rest of the system.<br>
• Communication requiring a response should be asynchronous<br>
• Use UUID to identify a communication message<br>
• Unreliable communication is handled by resending commands with the same UUID until we give up or a response has arrived.<br>


## Topics
Add description on which topics are neccessary dependning on agent level e.g. sensorInfo, sensor ect.
### Basic Naming Conventions

<!-- tabs:start -->
#### **JSON**
***Naming scheme*** PREFIX1/PREFIX2/PREFIX3/PREFIX4/SERVICE/#<br>
***For sensors:*** PREFIX1/PREFIX2/PREFIX3/PREFIX4/SERVICE/sensor/SENSOR<br>
***For heartbeat/info messages:*** PREFIX1/PREFIX2/PREFIX3/PREFIX4/SERVICE/XXX<br>

>• *PREFIX1:* naming of context, can be used to have parallel experiments/demos. E.g: waraps-demo-2021, waraps, aiics-testing, and so on.<br>
• *PREFIX2:* In this case service to indicate that it is a service that have heartbeat.<br>
• *PREFIX3:* type of service: virtual. <br>
• *PREFIX4:* Indicate role. Possible values: real, simulation, playback...<br>
• *SERVICE:* Service name<br>
• *SENSOR:* Name or reference to variables published by service.<br>

<!-- tabs:end -->

Checkout [Agent Communication](api_spec/agent_communication.md) on how to publish [Heartbeat](api_spec/agent_communication.md#heartbeat), [SensorInfo](api_spec/agent_communication.md#sensorinfo), [Sensors](api_spec/agent_communication.md#sensors) and [Direct Execution Info](api_spec/agent_communication.md#directexecutioninfo), where UNIT is changed to SERVICE.

## Resource Pool

### Available tasks

#### Request Team Leader
This command is sent to the Resource Pool and is a request for a suitable and
available Team Leader given one or more roles a Team Leader can take on in a
mission (based on capabilities). The request should be published on the topic
.../name of resource pool service/exec/command.

In addition to the direct execution response of the command, the Resource
Pool should also publish a response, with the same UUID v.4 as in the direct
execution response, but with an added name/value pair of the requested Team
Leader. If the task is finished without fail this response should be published on
the topic .../name of resource pool service/sensor/agents.

<!-- tabs:start -->

#### **JSON command example**
```json
{

    "com-uuid": <uuid v4 of command>,
    "command": "start-task",
    "execution-unit": <name of resource pool service>,
    "sender": <name of sender of command>,
    "task": {
        "name": "request-team-leader",
        "meta": {
            "agent": <name of requested agent>,
            "root-uuid": <uuid v4 of tst root node of mission>
            "request": [
                {
                    "alias": <alias for requested agent>,
                    "capabilities": [
                        "start-tst",
                        <wanted capability of agent>,
                        <wanted capability of agent>,
                        ...
                    ]
                },
                {
                    "alias": <alias for requested agent>,
                    "capabilities": [
                        "start-tst",
                        <wanted capability of agent>,
                        <wanted capability of agent>,
                        ...
                    ]
                }
            ]
        }
    },
    "task-uuid": <uuid v4 of task>,
    "time_added": <epoch timestamp of command>
}
```

#### **JSON response example**
```json
{
    "agent-uuid": <uuid v4 of the resource pool>,
    "com-uuid": <uuid v4 of command>,
    "agents": [
        {
        "alias": <alias of the agent>,
        "agent": <name of the agent>
        }
    ],
    "response-to": <uuid v4 of the command that triggered this response>,
    "task-uuid": <uuid of task>,
}
```
<!-- tabs:end -->

#### Request Agents
The purpose of the command "request-agents" is for as Team Leader to
receive suitable and available Team Members for a mission. The request is
a list of requested agents. An agent can be requested either by name or by
capabilities. The command should be published on the topic .../name of
resource pool service/exec/command.

In addition to the direct execution response of the command, the Resource
Pool should also publish a response, with the same UUID v.4 as in the direct
execution response, but with an added name/value pair of the requested agents.
If the task is finished without fail this response should be published on the topic
.../name of resource pool service/sensor/agents.

<!-- tabs:start -->

#### **JSON command example**
```json
{
    "com-uuid": <uuid v4 of command>,
    "command": "start-task",
    "execution-unit": <name of resource pool service recieving task>,
    "sender": <name of sender of command>,
    "task": {
        "name": "request-agents"
        "meta": {
            "root-uuid": <uuid v4 of tst root node of mission>,
            "request": [
                {
                    "agent": "",
                    "alias": "<alias for requested agent>",
                    "capabilities": [
                        <wanted capability of agent>,
                        <wanted capability of agent>,
                        ...
                    ]
                },
                {
                    "agent": <name of requested agent>,
                    "alias": "",
                    "capabilities": [
                        <wanted capability of agent>,
                        <wanted capability of agent>,
                        ...
                    ]
                },
                ...
            ]
        }
    },
    "task-uuid": <uuid v4 of task>,
    "time_added": <epoch timestamp of command>
}
```
#### **JSON response example**

```json
{
    "agent-uuid": <uuid v4 of the resource pool>,
    "com-uuid": <uuid v4 of command>,
    "agents": [
        {
        "alias": <alias of the agent>,
        "agent": <name of the agent>
        },
        {
        "alias": "",
        "agent": <name of the agent>
        },
        ...
    ],
    "response-to": <uuid v4 of the command that triggered this response>,
    "task-uuid": <uuid v4 of task>,
}

```

<!-- tabs:end -->

## Object Detector (Providence)

The orchestrator (Providence) is a central component that efficiently manages and coordinates the deployment of multiple object detection modules running on individual streams. It acts as a conductor, initiating the execution of various modules, which are responsible for detecting objects in real-time video streams.

### Available tasks

#### Start Object Detection

This command is sent to providence (the object detector service) to start an object detection on the stream from the agent which sends the command. 

The Object Detector responds according to [tasks specification](api_spec/agent_communication.md#tasks) in section [Agent Communication](api_spec/agent_communication.md) 

Supported Streams protocol:
* **rtsp**
* **rtmp**
* **http**
* **https**

<!-- tabs:start -->

#### **JSON command example**
```json
{ 
	"com-uuid": <uuid v4 of command>, 
	"command": "start-task", 
	"execution-unit": "simulated_agent", 
	"sender": "commander", 
	"task": { 
		"name": "start-object-detection", 
		"params": { 
			"agent": <agent_name>, 
			"classes": "0", 
			"weights": "yolov7-e6e.pt", 
			"conf-thres": "0.5", 
			"iou-thres": "0.45", 
			"source": "rtmp://rtmp.waraps.org/live/<agent_name>", 
			"output-url": "rtmp://ome.waraps.org/app/'<agent_name>_OD'" 
		}, 
	},
	"task-uuid": <uuid v4 of command>
}
```
#### **JSON response example(s)**

##### Running
```json
{
  "agent-uuid": <uuid v4 of command>,
  "com-uuid": <uuid v4 of command>,
  "fail-reason": "",
  "response": "running",
  "response-to": <uuid v4 of command>,
  "task-uuid": <uuid v4 of command>
}
``` 
##### Failed
Returns failed if a detection is aleady running on that agent/stream
```json
{
  "agent-uuid": <uuid v4 of command>,
  "com-uuid": <uuid v4 of command>,
  "fail-reason": "Detection already running on that stream",
  "response": "failed",
  "response-to": <uuid v4 of command>,
  "task-uuid": <uuid v4 of command>
}
```
<!-- tabs:end -->

#### Stop Object Detection

This command is sent to providence (the object detector service) to stop an object detection on the stream from the agent which sends the command.

<!-- tabs:start -->

#### **JSON command example**

```json
{
  "com-uuid": "12e42b18-94f4-4562-b2ef-33d5817007dd",
  "command": "start-task",
  "execution-unit": "rk_laptop",
  "sender": "commander",
  "task": {
    "name": "stop-object-detection",
    "params": {
      "agent": <agent name>
    }
  },
  "task-uuid": "34ea828c-b922-4245-949e-27ca3f6bda42"
}
```

#### **JSON response example(s)**
##### Running
Returns running if the command was successful in stopping the object detector
```json
{
  "agent-uuid": <uuid v4 of command>,
  "com-uuid": <uuid v4 of command>,
  "fail-reason": "",
  "response": "running",
  "response-to": <uuid v4 of command>,
  "task-uuid": <uuid v4 of command>
}
```
##### Failed
Returns failed if a agent/stream does not have a detection running.
```json
{
  "agent-uuid": <uuid v4 of command>,
  "com-uuid": <uuid v4 of command>,
  "fail-reason": "Stream does not exist or not running a detection on that stream",
  "response": "failed",
  "response-to": <uuid v4 of command>,
  "task-uuid": <uuid v4 of command>
}
```

<!-- tabs:end -->

## U-Space Service Provider (USSP)

A U-Space Service Provider (USSP) is an entity that operates and manages a U-Space system. U-Space refers to the airspace management ecosystem specifically designed for unmanned aircraft systems (UAS), commonly known as drones.

As the use of drones continues to grow, a USSP plays a crucial role in ensuring the safe and efficient integration of these unmanned vehicles into the airspace. The USSP acts as an intermediary between UAS operators and traditional airspace authorities, such as air traffic control.
Coordinate reference system (CRS): EPSG:5849

**NOTE**

This USSP is a **SUPER SIMPLE** example of how a USSP could work. It is not supposed to be used in real life scenarios. More of an example of how communication with an USSP can work. Alot of values and algorithms are static and only used as an examples. 

### Workflow
To start a communicating with the USSP, create a separate channel using the [Start Communication](#start-communication) command
([Start Communication](#start-communication)) &rarr;

All other tasks should be sent on this new topic. 
([Request Height](#request-height)) &rarr;

([Request Plan](#request-plan)) &rarr; ([Get Plan](#get-plan)) &rarr; ([Accept Plan](#accept-plan)) &rarr; ([Activate Plan](#activate-plan)) &rarr; ([End Plan](#end-plan) | [Cancel Plan](#cancel-plan)) &rarr;

([Request Plan](#request-plan)) &rarr; ([Get Plan](#get-plan)) &rarr; ([End Plan](#end-plan) | [Cancel Plan](#cancel-plan)) &rarr;

### Available tasks
#### Start Communication
Creates a new topic for the entity and USSP to communicate on.

<!-- tabs:start -->
#### **JSON command example**
```json
{
    "com-uuid":  <uuid v4 of command>,
    "command": "start-task",
    "execution-unit": <name of receiving unit>,
    "sender":  <name of sender of command>,
    "task": {
        "name": "start-communication",
        "meta": {},
        "params": {
            "name": "<name of requester>"
        }
    },
    "task-uuid": <uuid v4 of command>
}
```
#### **JSON response example**
```json
    {          
        "name": <name of requester>,
        "ussp_topic": <new topic>
    }
```
<!-- tabs:end -->

#### Request Height

<!-- tabs:start -->
#### **JSON command example**
```json
{
    "com-uuid":  <uuid v4 of command>,
    "command": "start-task",
    "execution-unit": <name of receiving unit>,
    "sender":  <name of sender of command>,
    "task": {
        "name": "RequestPlan",
        "meta": {},
        "params": {
            "request": "query ground height"
        }
    },
    "task-uuid": <uuid v4 of command>
}
```
#### **JSON response example**

```json
{
    "reply": "query ground height",
    "height": <height of ground over the Baltic Sea>,
    "response": "query ground height",
    "response-to": <uuid v4 of command>
}
```

<!-- tabs:end -->
#### Request Plan
Request (create) a plan


<!-- tabs:start -->
#### **JSON command example**
```json
{
    "com-uuid": <uuid v4 of command>,
    "command": "start-task",
    "execution-unit": <name of receiving unit>,
    "sender": <name of sender of command>,
    "task": {
        "name": "request-plan",
        "meta": {
        },
        "params": {
            "request": "request plan",
            "operator ID": <operator ID>,
            "UAS ID": <UAS ID>,
            "EPSG": <EPSG reference>,
            "plan": <list of nodes>,
            "when": <when the plan should start>
            "preferred speed": <speed>,
            "preferred rate of ascend": <speed>,
            "preferred rate of descend": <speed>
        }
    },
    "task-uuid": <uuid v4 of command>
}
```
A array of nodes is used in "plan".
```json
{
    "type": "2D path",
    "position": [ latitude, longitude ]
}
```
#### **JSON response example**
```json
{
    "reply": "request plan",
    "plan ID": <plan id>,
    "delay": <delay bofore plan can start>,
    "response": "request plan",
    "response-to": <uuid v4 of command>
}

```

<!-- tabs:end -->

#### Get Plan
When a Plan has been requested (created) by the USSP. It can get fetched withteh "Get Plan" command.

<!-- tabs:start -->

#### **JSON command example**
```json
{
    "com-uuid": <uuid v4 of command>,
    "command": "start-task",
    "execution-unit": <name of receiving unit>,
    "sender": <name of sender of command>,
    "task": {
        "name": "get-plan",
        "meta": {
        },
        "params": {
            "request": "get plan",
            "plan ID": "<plan_id>"
        }
    },
    "task-uuid": <uuid v4 of command>
}
```

#### **JSON response example(s)**

##### Invalid id
Invalid id can trigger from two occurrences
1. Plan id is not a requested plan. (see [Request Plan](#request-plan))
2. The plan should already been started, Time past from "when" in [Request Plan](#request-plan) command.
```json
{
    "reply": "get plan",
    "status": "error",
    "response": "get plan",
    "response-to": <uuid v4 of command>
}
```

##### Error(s)
Error status can be triggerd by several reasons. Check "message" field for more details
```json
{
    "reply": "get plan",
    "status": "error",
    "message": "incorrect plan description (<plan.length> < 2 nodes)",
    "response": "get plan",
    "response-to": <uuid v4 of command>
}
```
"Inccorect plan node type" can trigger for a few reasons.
1. The plan needs a minimum of 2 nodes (start and finish).
2. The wrong node type (see [JSON NODE example](#json-node-example))
```json
{
    "reply": "get plan",
    "status": "error",
    "message": "incorrect plan node type <node_type>",
    "response": "get plan",
    "response-to": com_uuid
}
```
##### Authorized
```json
{
    "reply": "get plan",
    "status": "authorized",
    "plan": <plan>,
    "response": "get plan",
    "response-to": com_uuid
}
```
<!-- tabs:end -->


#### Accept Plan

<!-- tabs:start -->

#### **JSON command example**
```json
{
    "com-uuid": <uuid v4 of command>,
    "command": "start-task",
    "execution-unit": <name of receiving unit>,
    "sender": <name of sender of command>,
    "task": {
        "name": "accept-plan",
        "meta": {
        },
        "params": {
            "request": "accept plan",
            "plan ID": "<plan_id>"
        }
    },
    "task-uuid": <uuid v4 of command>
}
```

#### **JSON response example(s)**
##### Invalid id
The plan has not been Authorized. The plan gets Authorized in the [Get Plan](#get-plan) command.

```json
{
    "reply": "accept plan",
    "status": "invalid id",
    "response": "accept plan",
    "response-to": <uuid v4 of command>
}

```
##### Accepted

```json
{
    "reply": "accept plan",
    "status": "accepted",
    "response": "accept plan",
    "response-to": <uuid v4 of command>
}
```
<!-- tabs:end -->

#### Activate Plan
<!-- tabs:start -->

#### **JSON command example**
```json
{
    "com-uuid": <uuid v4 of command>,
    "command": "start-task",
    "execution-unit": <name of receiving unit>,
    "sender": <name of sender of command>,
    "task": {
        "name": "activate-plan",
        "meta": {
        },
        "params": {
            "request": "activate plan",
            "plan ID": "<plan_id>"
        }
    },
    "task-uuid": <uuid v4 of command>
}
```
#### **JSON response example(s)**
##### Invalid id
The plan has not been Authorized. The plan gets Authorized in the [Get Plan](#get-plan) command.
```json
{
    "reply": "activate plan",
    "status": "invalid id",
    "response": "activate plan",
    "response-to": <uuid v4 of command>
}
```
##### Activated
```json
{
    "reply": "activate plan",
    "status": "activated",
    "response": "activate plan",
    "response-to": <uuid v4 of command>
}
```
<!-- tabs:end -->

#### End Plan
<!-- tabs:start -->

#### **JSON command example**
```json
{
    "com-uuid": <uuid v4 of command>,
    "command": "start-task",
    "execution-unit": <name of receiving unit>,
    "sender": <name of sender of command>,
    "task": {
        "name": "end-plan",
        "meta": {
        },
        "params": {
            "request": "end plan",
            "plan ID": "<plan_id>"
        }
    },
    "task-uuid": <uuid v4 of command>
}
```
#### **JSON response examples**
##### Invalid id
The plan has not been Authorized. The plan gets Authorized in the [Get Plan](#get-plan) command.
```json
{
    "reply": "end plan",
    "status": "invalid id",
    "response": "end plan",
    "response-to": <uuid v4 of command>
}
```
##### Activated
```json
{   
    "reply": "end plan",
    "status": "ended",
    "response": "end plan",
    "response-to": <uuid v4 of command>
}
```
<!-- tabs:end -->

#### Cancel Plan
<!-- tabs:start -->

#### **JSON command example**

```json
{
    "com-uuid": <uuid v4 of command>,
    "command": "start-task",
    "execution-unit": <name of receiving unit>,
    "sender": <name of sender of command>,
    "task": {
        "name": "cancel-plan",
        "meta": {
        },
        "params": {
            "request": "cancel plan",
            "plan ID": "<plan_id>"
        }
    },
    "task-uuid": <uuid v4 of command>
}
```
#### **JSON response example(s)**
##### Invalid id
The plan has not been Authorized. The plan gets Authorized in the [Get Plan](#get-plan) command.
```json
{
    "reply": "end plan",
    "status": "invalid id",
    "response": "end plan",
    "response-to": <uuid v4 of command>
}
```
##### Cancelled
```json
{
    "reply": "cancel plan",
    "status": "cancelled",
    "response": "cancel plan",
    "response-to": <uuid v4 of command>,
}
```
<!-- tabs:end -->
