import java.io.DataInputStream;
import java.io.IOException;

import com.ibm.mq.MQC;
import com.ibm.mq.MQEnvironment;
import com.ibm.mq.MQException;
import com.ibm.mq.MQGetMessageOptions;
import com.ibm.mq.MQMessage;
import com.ibm.mq.MQPutMessageOptions;
import com.ibm.mq.MQQueue;
import com.ibm.mq.MQQueueManager;
import java.util.Hashtable;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Paths;

public class MQWrite
{
	private MQQueueManager _queueManager = null;
	private Hashtable params = null;
	public int port = 1422;
	public String hostname = "hostname";
	public String channel = "channel";
	public String qManager = "qManager";
	public String inputQName = "inputQName";
	public String inputFile = "inputFile";

public MQWrite()
{
	super();
}

private boolean allParamsPresent()
{

      boolean b = params.containsKey("-h") && params.containsKey("-p") && params.containsKey("-c") && params.containsKey("-m") && params.containsKey("-f") && params.containsKey("-q");
      if (b)
      {
        try
        {
          port = Integer.parseInt((String) params.get("-p"));
        }
        catch (NumberFormatException e)
        {
          b = false;
        }
        hostname = (String) params.get("-h");
        channel = (String) params.get("-c");
        qManager = (String) params.get("-m");
	 			inputFile = (String) params.get("-f");
	 			inputQName = (String) params.get("-q");
      }
      return b;
}

private void init(String[] args) throws IllegalArgumentException
{
      params = new Hashtable(5);
      if (args.length > 0 && (args.length % 2) == 0)
      {
         for (int i = 0; i < args.length; i += 2)
            params.put(args[i], args[i + 1]);
      }
      else
      {
         throw new IllegalArgumentException();
      }
      if (allParamsPresent())
      {
         MQEnvironment.hostname = hostname;
         MQEnvironment.channel = channel;
         MQEnvironment.port = port;
         MQException.log = null; /* Tell MQ client library not to output anything. */
      }
      else
      {
         throw new IllegalArgumentException();
      }
}


public static void main(String[] args)
{

	MQWrite readQ = new MQWrite();

	try
	{
		readQ.init(args);
		readQ.selectQMgr();		
		readQ.write();
	}
	catch (IllegalArgumentException e)
	{
		System.out.println("Usage: java MQWrite <-h host> <-p port> <-c channel> <-m QueueManagerName> <-q QueueName>");
		System.exit(1);
	}
	catch (MQException e)
	{
		System.out.println(e);
		System.exit(1);
	}
}

private void selectQMgr() throws MQException
{
	_queueManager = new MQQueueManager(qManager);
}

private void write() throws MQException
{
	int lineNum=0;
	int openOptions = MQC.MQOO_OUTPUT + MQC.MQOO_FAIL_IF_QUIESCING;
	try
	{
		MQQueue queue = _queueManager.accessQueue( inputQName,
		openOptions,
		null, 
		null, 
		null ); 

		DataInputStream input = new DataInputStream(System.in);

		System.out.println("MQWrite v1.0 connected");
		System.out.println("and ready for input, terminate with ^Z\n\n");

		
		MQMessage sendmsg = new MQMessage();
		sendmsg.format = MQC.MQFMT_STRING;
		sendmsg.feedback = MQC.MQFB_NONE;
		sendmsg.messageType = MQC.MQMT_DATAGRAM;
		sendmsg.replyToQueueName = "ROGER.QUEUE";
		sendmsg.replyToQueueManagerName = qManager;

		MQPutMessageOptions pmo = new MQPutMessageOptions(); 
		

		String line = new String(Files.readAllBytes(Paths.get(inputFile)));
		
		sendmsg.clearMessage();
		sendmsg.messageId = MQC.MQMI_NONE;
		sendmsg.correlationId = MQC.MQCI_NONE;
		sendmsg.writeString(line);

		

		queue.put(sendmsg, pmo);

		queue.close();
		_queueManager.disconnect();
	}
	catch (com.ibm.mq.MQException mqex)
	{
		System.out.println(mqex);
	}
		catch (java.io.IOException ioex)
	{
		System.out.println("An MQ IO error occurred : " + ioex);
	}
}
}
