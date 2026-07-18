# TST Feedback messages
The possible values of the status is:<br>
• not-active<br>
• active<br>
• waiting<br>
• running<br>
• failed<br>
• revoked<br>
• paused<br>
• aborted<br>
• succeeded

**Example 1**:
```json
{
    "com-uuid": "ed3717a6-ffef-4129-ad21-ea577117c706",
    "fail-reason": "",
    "node-uuid": "ff200942-73a2-401f-83e2-8397d28facf8",
    "root-flag": true,
    "status": "active"
}
```
**Example 2**:
```json
{
    "com-uuid": "068d8c73-9f83-4ac7-9fd0-84b8ba6e80da",
    "fail-reason": "",
    "node-uuid": "ff200942-73a2-401f-83e2-8397d28facf8",
    "root-flag": true,
    "status": "waiting"
}
```
**Example 3**:
```json
{
    "com-uuid": "9a1118bb-3b50-4d74-b9e3-deb2c33078f8",
    "fail-reason": "",
    "node-uuid": "ff200942-73a2-401f-83e2-8397d28facf8",
    "root-flag": true,
    "status": "running"
}
```