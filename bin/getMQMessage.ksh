#!/bin/ksh
###############################################################
# Name: checkMQConnection.ksh
# Date: 03/10/2012
# Description: Check MQ client connection
#
# Revision History
# 03-OCT-2012   Avi Veltz	Initial version
###############################################################

#-----------------------------------#
usage()
#-----------------------------------#
{
   if [ -z "$PROFILE" ]; then
      echo "Usage: getMQMessage <profileName> <Queue Name> <Message File>"
      exit
   fi
}
#-----------------------------------#
loadEnv()
#-----------------------------------#
{
   . $TPAT_HOME/scripts/setProfileEnv.ksh
}
#-----------------------------------#
getMessage()
#-----------------------------------#
{
   JV1=`$JAVA_HOME/bin/java -version 2>&1 | grep "java version" | awk -F"\"" '{print $2}'`
   JV=`echo $JV1 | head -c 3`

   export CLASSPATH=${TPAT_HOME}/scripts/util/MQUtil_${JV}:${TPAT_HOME}/scripts/util/MQLIB/com.ibm.mq.commonservices.jar:${TPAT_HOME}/scripts/util/MQLIB/com.ibm.mq.headers.jar:${TPAT_HOME}/scripts/util/MQLIB/com.ibm.mq.jar:${TPAT_HOME}/scripts/util/MQLIB/com.ibm.mq.jmqi.jar:${TPAT_HOME}/scripts/util/MQLIB/com.ibm.mq.pcf.jar:${TPAT_HOME}/scripts/util/MQLIB/connector.jar
 
   ${JAVA_HOME}/bin/java MQRead -h ${QMGR_HOSTNAME} -p ${QMGR_PORT} -c ${QMGR_CHANNEL} -m ${QMGR_NAME} -q ${QUEUE} -f ${MESSAGEFILE}
   return $?
   echo ""
}
#-----------------------------------#
# MAIN
#-----------------------------------#
{
   PROFILE=$1
   QUEUE=$2
   MESSAGEFILE=$3
   usage   
   loadEnv
   checkProfile $PROFILE true
   getMessage
   return $?
}
