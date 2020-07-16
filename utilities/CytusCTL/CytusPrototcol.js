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
    RUNNING : 'runnung',
    COMPLETE : 'completed'

}

const CytusException = {

}


module.exports = {
    CytusEvent,
    CytusAppStatus
}