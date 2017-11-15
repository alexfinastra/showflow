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
import java.nio.file.Files;
import java.nio.file.Paths;
import java.io.*;
import java.text.SimpleDateFormat;
import java.util.Date;

public class MQRead
{
  private MQQueueManager _queueManager = null;
  private Hashtable params = null;
  public int port = 1422;
  public String hostname = "hostname";
  public String channel = "channel";
  public String qManager = "qManager";
  public String inputQName = "inputQName";
  public String outputFolder = "outputFile";

  public MQRead()
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
        outputFolder = (String) params.get("-f");
        inputQName = (String) params.get("-q");
      }
      return b;
  }

  private void init(String[] args) throws IllegalArgumentException
  {
   params = new Hashtable(5);
   if (args.length > 0 && (args.length % 2) == 0)
   {
     for (int i = 0; i < args.length; i+=2)
     {
        params.put(args[i], args[i+1]);
     }
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

   MQRead readQ = new MQRead();

   try
   {
     readQ.init(args);
     readQ.selectQMgr();
     readQ.read();
   }
   catch (IllegalArgumentException e)
   {
     System.out.println("Usage: java MQRead <-h host> <-p port> <-c channel> <-m QueueManagerName> <-q QueueName> <-f folder>");
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

  private void read() throws MQException
  {
   int openOptions = MQC.MQOO_INQUIRE + MQC.MQOO_FAIL_IF_QUIESCING + MQC.MQOO_INPUT_SHARED;

   MQQueue queue = _queueManager.accessQueue( inputQName,
                                   openOptions,
                                   null,           // default q manager
                                   null,           // no dynamic q name
                                   null );         // no alternate user id


   DataInputStream input = new DataInputStream(System.in);

   System.out.println("MQRead v1.0 connected.\n");
   System.out.println("and ready for input, terminate with ^Z\n\n");


   int depth = queue.getCurrentDepth();
   System.out.println("Current depth: " + depth + "\n");
   if (depth == 0)
   {
     return;
   }

   MQGetMessageOptions getOptions = new MQGetMessageOptions();
   getOptions.options = MQC.MQGMO_NO_WAIT + MQC.MQGMO_FAIL_IF_QUIESCING + MQC.MQGMO_CONVERT;
   
   while(true)
   {
     MQMessage message = new MQMessage();
     
     try
     {
      queue.get(message, getOptions);
      byte[] b = new byte[message.getMessageLength()];
      message.readFully(b);

      SimpleDateFormat dateFormat = new SimpleDateFormat("dd_MM_yyyy_HH_mm_ss");      
      Writer fileWriter = new FileWriter(outputFolder + "\\request_" + dateFormat.format(new Date()) + ".txt");
      fileWriter.write(new String(b));
      fileWriter.close();
      
      System.out.println(new String(b));
      message.clearMessage();

     }
     catch (IOException e)
     {
      System.out.println("IOException during GET: " + e.getMessage());
      break;
     }
     catch (MQException e)
     {
      if (e.completionCode == 2 && e.reasonCode == MQException.MQRC_NO_MSG_AVAILABLE) {
        if (depth > 0)
        {
         System.out.println("All messages read.");
        }
      }
      else
      {
        System.out.println("GET Exception: " + e);
      }
      break;
     }
   }
   queue.close();
   _queueManager.disconnect();
  } 
}
