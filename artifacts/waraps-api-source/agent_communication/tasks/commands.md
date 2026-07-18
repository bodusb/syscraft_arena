# Commands
Commands, are messages sent to level 2 and above agents commanding them to perform certain tasks. They are sent to a subtopic of the agent that the agent itself subscribe to, namely: **"UNIT/exec/command"**.

There are *four* types of **commands**, namely:<br>
• **[ping](agent_communication/tasks/ping_command.md)**<br>
• **[signal-task](agent_communication/tasks/signal_task.md)**<br>
• **query-status**: return the status of the task (running, failed, success, unknown)<br>
• **[start-task](agent_communication/tasks/start_task.md)**<br>

**Standard operating protocol:** <br>
• task-uuid should be optionally sent in start-task and if not sent, a generated task-uuid will be returned in the response message. <br>
• If a response has not arrived re-send the command with the same com-uuid. <br>
• The receiver of commands has to keep track of the history of commands so it can answer if a command is unknown or finished when recieving the command "query-status".<br> 
• Use the changing agent-uuid when rebooting to detect that the agent has lost its history of commands.

The commands are sent in a command message which:<br>
• Can optionally contain start and end time (more in later versions).<br>
• If no start time or end time is given, just execute directly and as fast as possible but you do not need to optimize. Regular as fast as possible.

When an agent recievs a command it will send back a response as well as feedback to that message via publishing to the topics **"UNIT/exec/response"** respectively **"UNIT/exec/feedback"**.


**Response message**: - Returns agent-uuid, task-uuid, com-uuid, a string for failure reason and a response string field. Possible response string values are: "running", "failed"and "finished". 

**Feedback messages**: - Update of the status of the task - Should contain agent-uuid, com-uuid, task-uuid and status. The possible status strings are: <br>
• running <br>
• failed <br>
• aborted <br>
• paused <br>
• finished <br>
• starting <br>
• task specific strings <br>

Task specific strings can be any other status message that makes sence in the context of the agents actions.

<!-- tabs:start -->
## **JSON feedback response example**
```json
{
    "agent-uuid": "8309d3ef-56fc-4ab0-86b0-9d9705ccf043",
    "com-uuid": "b3c90b08-622c-41b5-948c-80ca0abb49dc",
    "status": "running",
    "task-uuid": "49fb88b8-4d4a-4268-a69a-35e620a1a5f4"
}
```
## **ROS sending JSON feedback example**
Code example Python:
```python
def send_feedback(unit, task_uuid, status):
    msg = {}
    msg["com-uuid"] = str(uuid.uuid4())
    msg["agent-uuid"] = agent_uuid
    msg["task-uuid"] = task_uuid
    msg["status"] = status
    msgstr = json.dumps(msg, sort_keys=True, indent=4, separators=(’,’, ’: ’))
    # print(msgstr)
    topic = "exec/feedback"
    print("Send feedback on topic:", topic)
    try:
        client = rospy.ServiceProxy(’send_topic_msg_to_unit’, SendTopicMsgToUnit)
        resp = client(unit.lstrip("/"), topic, msgstr)
        print("send_feedback send_topic_msg RESP:", resp)
    except rospy.ServiceException as e:
    print("Service call failed: %s"%e)
```
<!-- tabs:end -->