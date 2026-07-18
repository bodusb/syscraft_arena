# TST (Task Specification Tree)
TST stands for **Task Specification Tree** and ... <br>

Link to LiU documentation about TST: https://gitlab.liu.se/lrs2/lrs_doc

With a TST one can specify many tasks and the order in which the tasks should be performed. For every task in the tree one can also speicify which agent should perform the task. This means that if an agent has the ability to recieve a TST through a "start-TST" command, the agent should also be able to delegate tasks to other agents. 

In the Core System we refer to TST as either "**specified**" or "**unspecified**" with the difference being how much of the task informations are specified. <br>
In the case of "specified" TSTs all the information about the mission such as which unit shall perform what task and how ect. are all specified when the mission is sent from the command interface. In the case of "unspecified" TSTs however, the information about the mission is more lacking. An agent that can handle specified trees is of level 3, while an agent that can handle an unspecified tree is of level 4.<br>

For communication with TST:s to work, in addition to the ability to delegate tasks, the agent also needs to save a new uuid for every node in the tree. This so that the commander sending the "start-tst" command can send signals to parts of the tree, or to the whole tree by signaling to the root node of the tree.

**Note that this API is towards the TST/Delegation system.**<br>
• Execution of fully instantiated TST trees<br>
• The Task execution is the same as for level 2 and used internally in the TST system.<br>
• The communication with command and control is different.<br>
• Fully instantiated TST trees (represented in JSON) are sent to the system and the result is: start of execution possibly on more than one platform or direct failure to start.<br>
• Update of progress during execution including report of success or failure for each node in the tree.<br>
• During execution abort/pause/continue/enough can be sent to specific nodes.<br>
• We might have help command to send to all nodes in a tree.<br>

**Topics**<br>
• UNIT/tst/command<br>
• UNIT/tst/response<br>
• UNIT/tst/feedback<br>

The commands are usually sent to op0. So the most common topics to use are:<br>
• op0/tst/command <br>
• op0/tst/response <br>
• op0/tst/feedback<br>
But it is possible to send it directly to an agent also but the agent might not be running so it is safer to send it to the op0.
