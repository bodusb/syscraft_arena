# Direct Execution Info
The "direct_execution_info" message should be sent for all level 2 agents and above as it provides information on which [tasks](agent_communication/tasks/tasks.md) an agent is capable of doing. It also works as a heartbeat for the direct execution level.

Publish the direct_execution_info message to:<br>
**TOPIC: UNIT/direct_execution_info**

**Message parameters**<br>
• **name:** The name of the agent<br>
• **rate:** The expected rate the message is sent, written in Hz<br>
• **type:** A type field indicates what type of message it is. In this case direct execution info. <br>
• **stamp:** Epoch time stamp of when the message was sent, in double (time.time() in Python, seconds in double)<br>
• **tasks-available:** List of tasks that are supported by the agent and for each task a list of signals it understands.<br>
• **tasks-executing:** List of tasks agent is currently executing.<br>

```json
{
    "name": "piraya0",
    "rate": 1.0,
    "type": "DirectExecutionInfo",
    "stamp": 1614080836.5142891,
    "tasks-available": [
        {
            "name": "navigate",
            "signals": [
                "$abort",
                "$enough",
                "$pause"
            ]
        },
        {
            "name": "look-at",
            "signals": [
                "$abort",
                "$enough"
            ]
        }
    ],
    "tasks-executing": [
        {
            "task-name": "navigate",
            "task-uuid": "b6161aee-a90f-4f5c-8a22-7d814725a6e2"
        }
    ]
}
```