---REM INSERTING into INTERFACE_TYPES
INSERT INTO INTERFACE_TYPES (INTERFACE_NAME,OFFICE,INTERFACE_TYPE,INTERFACE_SUB_TYPE,REQUEST_DIRECTION,MESSAGE_WAIT_STATUS,INTERFACE_STATUS,MESSAGE_STOP_STATUS,STOP_AFTER_CONN_EXCEPTION,INTERFACE_MONITOR_INDEX,REQUEST_PROTOCOL,REQUEST_CONNECTIONS_POINT,REQUEST_FORMAT_TYPE,REQUEST_SKELETON_XML,REQUEST_STORE_IND,RESPONSE_PROTOCOL,RESPONSE_CONNECTIONS_POINT,RESPONSE_FORMAT_TYPE,RESPONSE_SKELETON_XML,RESPONSE_STORE_IND,UID_INTERFACE_TYPES,TIME_STAMP,NOT_ACTIVE_BEHAVIOUR,EFFECTIVE_DATE,PROFILE_CHANGE_STATUS,REC_STATUS,PENDING_ACTION,ASSOCIATED_SERVICE_NAME,NO_OF_LISTENERS,NON_JMS_RECEPIENT_IND,HANDLER_CLASS,BUSINESS_OBJECT_CLASS,BUSINESS_OPERATION,PMNT_SRC,CUSTOM_PROPERTIES,WAIT_BEHAVIOUR,BATCH_SIZE,SUPPORTED_APP_IDS,BACKOUT_INTERFACE_NAME,BULK_INTERFACE_NAME,APPLICATION_PROTOCOL_TP,REQUEST_GROUP_NM,SEQUENCE_HANDLER_CLASS,RESPONSE_INTERFACE,RESPONSE_TIMEOUT_MILLIS,RESPONSE_TIMEOUT_RETRY_NUM,HEARTBEAT_INTERFACE_NAME,INTERFACE_STOPPED_SOURCE,RESEND_ALLOWED,DESCRIPTION,THROTTLING_TX,THROTTLING_MILLIS,BULKING_PURPOSE,ENABLED_GROUPS,RESUME_SUPPORTED,EVENT_ID_GENERATION,BULK_RESPONSE_BY_ORIG_CHUNK,INVALID_RESPONSE_IN) VALUES ('HKFMSG_IN','------','HKFMSG_IN','HKFMSG_IN','I',null,'ACTIVE',null,9,null,'MQ','jms/Q_NPPMSG_IN','PROPRIETRY',null,null,null,null,null,null,null,'------^--DEPARTMENT--MSG_IN','2016-07-29 13:58:33.877','STOP',to_date('07-SEP-10','DD-MON-RR'),'NO','AC','UP','BusinessFlowSelectorService',1,0,'backend.paymentprocess.interfaces.handlers.ProxyInterfaceHandler','gpp.webservices.businessflowselector.external.BusinessFlowSelectorServiceImpl','executeBusinessFlow','--MOP--',null,null,null,'1,2','BACKOUT',null,null,null,null,null,null,null,null,null,'0',null,null,null,null,null,null,null,null,null) 

