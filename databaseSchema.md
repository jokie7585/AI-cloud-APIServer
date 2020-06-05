# AI cloud database design

## workspaceSet_Schema
記錄一個user在ai-cloude服務中的所有資訊
``` javascript
{
    account: String,
    password: String,
    rootPath: String,
    workspaceSet: [workspaceSet_Schema],
    WorkMonitor: workMonitor_Schema
}
```

### workspaceSet_Schema
記錄每個worksapce的詳細資訊：

``` javascript
{
    name: String,
    LastPodName:String,
    config: {
        tensorflowVersion: String,
        GpuNum:Number,
    },
    scheduleList:[String],
    commandList: [],
    workRecord : [
        {
            logPath:String,
            podName:String,
            status:String,
            CreateDate:Date
        }
    ]
}
```

### workMonitor_Schema
推播server依照此schema運作：

``` javascript
{
    LoginInfo: {
        lastIp:String,
        lastDate:Date,
    },
    SocketConnection: {
        // detect is socket alive
        is_connect: Boolean,
        public_Key: String,
        socketuuid: String
    },
    notyfication: [
        {
            type:String,
            Title:String,
            Message:String,
        }
    ]
}
```