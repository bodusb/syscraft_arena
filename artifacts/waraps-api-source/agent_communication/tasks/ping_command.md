# ping command
The "ping" task/command is used to check that an agent is active and ready to receive commands. A response message with "pong" as the response string should be sent by the agent when receiving this command.

<!-- tabs:start -->
## **JSON task example**
```json
{
    "com-uuid": "7300d049-176f-4dcb-b0bf-151980d5611a",
    "command": "ping",
    "sender": "commander"
}
```

## **JSON response example**
```json
{
    "agent-uuid": "3887ced0-4e2d-4be4-aeff-6ba7242853a1",
    "com-uuid": "1c5284da-b803-49d1-8c39-b96ef00603e7",
    "response": "pong",
    "response-to": "29c24bbf-88f0-4de2-97e9-4bd0d5f6bf23"
}
```

## **ROS sending JSON response example**
Code example Python:
```python
def send_response(unit, response_uuid, task_uuid, response, fail_reason=""):
    msg = {}
    msg["com-uuid"] = str(uuid.uuid4())
    msg["response-to"] = response_uuid
    msg["agent-uuid"] = agent_uuid
    msg["task-uuid"] = task_uuid
    msg["response"] = response
    msg["fail-reason"] = fail_reason
    msgstr = json.dumps(msg, sort_keys=True, indent=4, separators=(’,’, ’: ’))
    topic = "exec/response"
    print("send_response:", unit, topic, msgstr)
    try:
        client = rospy.ServiceProxy(’send_topic_msg_to_unit’, SendTopicMsgToUnit)
        resp = client(unit.lstrip("/"), topic, msgstr)
        print("send_response send_topic_msg RESP:", resp)
    except rospy.ServiceException as e:
    print("Service call failed: %s"%e)
```

<!-- tabs:end -->
