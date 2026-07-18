# Signal a TST Tree
Send the signal to all TST nodes in the tree by using the uuid of the root node of the tree when sending the signal.

<!-- tabs:start -->

## **JSON task example**
```json
{
    "com-uuid": "2b01c8f9-437f-49d1-869b-cd5e3d3bb395",
    "command": "signal-tst-tree",
    "node-uuid": "ccb261a7-3446-4e7e-9aea-d9d57eaed793",
    "sender": "commander",
    "signal": "$abort"
}
```
## **JSON response example**
```json
{
    "com-uuid": "9dfde776-9d80-4fe9-9e34-32761f5ed545",
    "response": "ok",
    "response-to": "2b01c8f9-437f-49d1-869b-cd5e3d3bb395"
}
```

<!-- tabs:end -->
