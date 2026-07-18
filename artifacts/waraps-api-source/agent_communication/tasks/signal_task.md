# signal-task
Each task/command activated via the command "start-task" should have built-in signals that can effect the performance of the task.<br>
The built-in signals are: <br>
• **$enough** - commands agent to stop it"s task. The sender no longer needs it done.<br> 
• **$pause** - commands agent to pause in perfoming its task.<br> 
• **$continue** - commands agent to continue with the current paused task.<br>
• **$abort** - commands agent to stop it"s task. The sender has determined the task failed and is aborting it.<br>

Signal names starting with **$** are system signals. Other names are specific for the task.


<!-- tabs:start -->
## **JSON task example**
```json
{
    "com-uuid": "7300d049-176f-4dcb-b0bf-151980d5611a",
    "command": "signal-task",
    signal: $abort,
    "sender": "commander",
    "task-uuid": "9b4c701c-e8a2-4a92-9370-87c8f57e0dcd"
}
```

## **JSON response example**
```json
{
    "agent-uuid": "3887ced0-4e2d-4be4-aeff-6ba7242853a1",
    "com-uuid": "1c5284da-b803-49d1-8c39-b96ef00603e7",
    "response": "ok",
    "response-to": "7300d049-176f-4dcb-b0bf-151980d5611a"
}
```

<!-- tabs:end -->