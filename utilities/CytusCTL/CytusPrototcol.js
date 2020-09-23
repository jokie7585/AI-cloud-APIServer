const CytusEvent = {
    /**
     * Job management
     */
    JOB_UPLOAD : 'JOB_UPLOAD',
    JOB_COMFIRM: 'JOB_COMFIRM',

    /**
     * Cytus API
     */
    SCHDULER_LISTALL: 'SCHDULER_LISTALL'

}

const CytusAppStatus = {
    WAIT : 'waiting',
    PENDING : 'pending',
    RUNNING : 'running',
    COMPLETE : 'completed',
    Terminate: 'terminate',

}

const CytusBatchStatus = {
    WAIT: 'waiting',
    RUNNING : 'running',
    Terminate: 'terminate',
    COMPLETE : 'completed',
    // undefined is used when client first generate branch Record(But not push to Server)
    UNDEFINED : 'undefined',
}

const CytusException = {

}


module.exports = {
    CytusEvent,
    CytusAppStatus,
    CytusBatchStatus
}