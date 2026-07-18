# start-task
The "start-task" command is, as the name implies, used to command the agent to start a "task", specified in the commands "task" parameter. The "task" is in the form of a json object containing the specifics of the task such as its name and what parameters it operates from. <br>


Although "start-task" is the command, as the task it contain can be any one from a multitude of different task objects, the task can be seen as the core command as it is that performance of the task that is truly of interest. The "start-task" syntax can bee seen as the standard way of forwarding a task.

**start-task command syntax:**<br>
```json
{
    "com-uuid": <uuid v4 of command>,
    "command": "start-task",
    "execution-unit": <name of unit to execute the command>,
    "sender": <name of sender of command>,
    "task": {
        "name": <task name>,
        "params": {
            <specifics of the task e.g. waypoint, speed ect.>
        }
    },
    "task-uuid": <uuid v4 of task>
}
```

In the following sections, common tasks along with their task parameters and examples will be listed.

Each task section will contain:<br>
• **Description** - Describes what the task specifies the agent should do.<br>

• **Tags** - States what type of agents are relevant for the command, standard is "vehicle" mening all agents with mobility can perform the task.<br>

• **Task Parameters** - Specifies which task parameters will be included in the sent command and thus need to be managed by the agent in order for it to perform the command correctly.
