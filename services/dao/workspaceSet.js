var mongoose = require('mongoose');

// schema define
var workspaceSet_Schema = new mongoose.Schema({
    name: String,
    config: {
        tensorflowVersion: String,
        GpuNum:Number,
    },
    scheduleList:[String]
});

// add functionality to schema(mongoDocument)
workspaceSet_Schema.methods.is = function({name}) {
    if(name===this.name) return true;
    return false;
};

workspaceSet_Schema.methods.updateConfig = function({tensorflowVersion, GpuNum}) {
    let new_tensorflowVersion = tensorflowVersion| this.config.tensorflowVersion;
    let new_GpuNum = GpuNum| this.config.GpuNum;
    this.config.GpuNum = new_GpuNum;
    this.config.tensorflowVersion = new_tensorflowVersion;
};

workspaceSet_Schema.methods.getConfig = function() {
    let payload = {
        GpuNum:this.config.GpuNum,
        tensorflowVersion:this.config.tensorflowVersion,
    }

    return payload;
};


// compile schema to modle
var workspaceSet = mongoose.model("workspaceSet", workspaceSet_Schema);


// exports
module.exports = {
    workspaceSet,
    workspaceSet_Schema
};
