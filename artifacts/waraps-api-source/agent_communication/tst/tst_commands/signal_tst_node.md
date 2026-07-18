# signal-tst-node
This command is used to send a signal to a specific node in the tree. The node can hold children of its own and the signal will then affect the child nodes as well.

<!-- tabs:start -->

## **JSON task example**
```json
{
    "com-uuid": "2b01c8f9-437f-49d1-869b-cd5e3d3bb395",
    "command": "signal-tst-node",
    "node-uuid": "ccb261a7-3446-4e7e-9aea-d9d57eaed793",
    "sender": "commander",
    "signal": "$abort"
}
```

## **JSON response example**

**Example**:
```json
{
    "com-uuid": "9dfde776-9d80-4fe9-9e34-32761f5ed545",
    "response": "ok",
    "response-to": "2b01c8f9-437f-49d1-869b-cd5e3d3bb395"
}
```
<!-- tabs:end -->