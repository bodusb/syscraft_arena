# signal-unit
Send the signal to all running TST nodes on the unit.

<!-- tabs:start -->

## **JSON task example**
```json
{
    "com-uuid": "2b01c8f9-437f-49d1-869b-cd5e3d3bb395",
    "command": "signal-unit",
    "unit": "/dji21",
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