<?php

    $logs = '/var/www/logs';

    $DEFAULT_DIR = [];
    $DEFAULT_DIR[0] = $logs."/logger.log";
    $overFlowDir = "/OLDER_LOGS";
    $MB_LIMIT = 3000000; // 3 MBs

    function checkDirectory(string $dir)
    {
        $regDir = "/^\/var\/www\/logs(\/\w+)+(\.log)$/";
        if(!empty($dir) && !preg_match($regDir, $dir))
        {
            return false;
        }
        return true;
    }
    function checkDirectory2(string $dir)
    {
        $regDir = "/^\/var\/www\/html\/Diagnostics\/logs(\/\w+)+(\.log)$/";
        if(!empty($dir) && !preg_match($regDir, $dir))
        {
            return false;
        }
        return true;
    }

    function getIP()
    {
        $ip = '';
        if(!empty($_SERVER['HTTP_CLIENT_IP'])) {
            $ip = $_SERVER['HTTP_CLIENT_IP']." ";    
        }   
        //if user is from the proxy   
        elseif (!empty($_SERVER['HTTP_X_FORWARDED_FOR'])) {
            $ip = $_SERVER['HTTP_X_FORWARDED_FOR']." ";   
        }   
        //if user is from the remote address   
        elseif (!empty($_SERVER['REMOTE_ADDR'])) {
            $ip = $_SERVER['REMOTE_ADDR']." ";   
        }

        return $ip;
    }

    function fileopen($dir)
    {
        $handle = fopen($dir, 'w');
        if ($handle === false)
        {
            trigger_error("Unable to create the file.".PHP_EOL, E_USER_WARNING);
        }
        else
        {
            fclose($handle);
            exec("sudo chmod 0660 " . escapeshellarg($dir));
            exec("sudo chown www-data:devteam " . escapeshellarg($dir));
        }
    }

    // HOW TO USE:
    // pass a string as: "/var/www/logs/{folder or file}* . (file extention)"
    // example; /var/www/logs/mylog.log
    // example; /var/www/logs/mylogfolder/test.txt
    function setLogDirectory(string $dir)
    {
        global $DEFAULT_DIR;
        global $MB_LIMIT;
        $permissions = 0660;
        $owner = 'www-data';
        $group = 'ubuntu';

        if(!(checkDirectory($dir) || checkDirectory2($dir)))
        {
           echo "dir: $dir".PHP_EOL;
            trigger_error("01: Failed: regEx.".PHP_EOL, E_USER_WARNING);
            return "01: Failed: regEx";
        }
        try
        {
           $subDir = substr($dir,0,strrpos($dir,"/"));//removes filename from dir

            if (!is_dir($subDir))
            {
                if (mkdir($subDir, 0770, false))
                {
                    exec("sudo chmod 0770 " . escapeshellarg($subDir));
                    exec("sudo chown www-data:ubuntu " . escapeshellarg($subDir));
                }
            }

            if (!file_exists($dir))
            {
                fileopen($dir);
            }
            elseif(filesize($dir) > $MB_LIMIT)
            {
                global $overFlowDir;
                $file = substr($dir,strrpos($dir,"/"));
                $folder = substr($subDir,strrpos($subDir,"/"));
                $file = substr($file,0,-4);
                $date = (new DateTime('now', new DateTimeZone('America/New_York')))->format("m_d_y_H:i");
                $newDirectory = logs().$overFlowDir.$folder;
                $newFileName = logs().$overFlowDir.$folder.$file."-$date.log";

                if (!is_dir($newDirectory))
                {
                    if (mkdir($newDirectory, 0770, false))
                    {
                        exec("sudo chmod 0770 " . escapeshellarg($newDirectory));
                        exec("sudo chown www-data:ubuntu " . escapeshellarg($newDirectory));
                    }
                }

                if (copy($dir, $newFileName))
                {
                    exec("sudo chmod 0660 " . escapeshellarg($newFileName));
                    exec("sudo chown www-data:ubuntu " . escapeshellarg($newFileName));

                    fileopen($dir);
                }
                else
                {
                    echo output(['Msg'=>"Failed to move oversized log file: $file. check permissions"]);
                    myError("Failed to move oversized log file: $file. check permissions");
                }
            }
        }
        catch(Exception $e)
        {
            echo output(['Msg'=>"An Exception occured:".$e]);
            myError("An Exception occured:".$e);
        }

        $t = getCallFrom(debug_backtrace()[0]['file']);
        $DEFAULT_DIR[$t] = $dir;
    }

    // HOW TO USE:
    // $input: string that you want to write to file
    // optional: $includeDate: true: include current time/date; false: do not include time/date
    // optional: $includeEOL: true: include end of line after log; False: do not include end of line at end of log
    function myLog(string $input = '', bool $includeDate = true, bool $includeEOL = true, string $dir ='', bool $showCall = true)
    {
        global $DEFAULT_DIR;
        $myDate = '';
        $EOL = '';
        $debug = debug_backtrace()[0];
        $l = $debug['line'];
        $t = getCallFrom($debug['file']);
        //$t = ($debug['file']);
        $s = '';
        $ip = '';
        $agnt = '';
        //$input = trim($input);

        if($showCall)
            $s = " ".$debug['file']."($l):";

        if(!array_key_exists($t, $DEFAULT_DIR))
        {
            $DEFAULT_DIR[$t] = $DEFAULT_DIR[0];
        }

        if(empty($dir) || !checkDirectory($dir))
            $dir = $DEFAULT_DIR[$t];


        if($includeDate)
        {
            $date = new DateTime('now', new DateTimeZone('America/New_York'));
            $myDate = $date->format('[m/d/Y H:i:s]');
            $ip = getIP();
            if(!empty($_SERVER['HTTP_USER_AGENT']))
                $agnt = " : ".$_SERVER['HTTP_USER_AGENT'];
        }
        if($includeEOL)
            $EOL = PHP_EOL;


        $input = $ip."$myDate"."$s $input".$agnt.$EOL;
        error_log($input, 3, $dir);
    }

    function getCallFrom($dir)
    {
        return pathinfo(basename($dir))['filename'];
    }

    // How to use:
    // myLog_full("mycode.php", $var1, $var2, $var3, ['key4'=>'var4']);
    //function myLog_full(string $callFrom, ...$input = [])
    function myLog_full(string $callFrom = null, ...$input)
    {
        $debug = debug_backtrace()[0];
        $l = $debug['line'];
        $t = getCallFrom($debug['file']);

        $callFrom = $callFrom ?? $t;
        global $DEFAULT_DIR;
        
        if(!array_key_exists($t, $DEFAULT_DIR))
        {
            $DEFAULT_DIR[$t] = $DEFAULT_DIR[0];
        }

        $date = new DateTime('now', new DateTimeZone('America/New_York'));
        $myDate = $date->format('[n-d-Y H:i:s]');
        $data = var_export(file_get_contents('php://input'), true);

        error_log(PHP_EOL, 3, $DEFAULT_DIR[$t]);
        error_log("\t   ".$myDate. PHP_EOL, 3, $DEFAULT_DIR[$t]);
        error_log("= = = = = $callFrom"."[$l] = = = = = =". PHP_EOL, 3, $DEFAULT_DIR[$t]);
        error_log("HTTP_USER_AGENT: ".$_SERVER['HTTP_USER_AGENT']. PHP_EOL, 3, $DEFAULT_DIR[$t]);
        error_log("getIP(): "        .getIP()                    . PHP_EOL, 3, $DEFAULT_DIR[$t]);
        error_log("REMOTE_ADDR: "    .$_SERVER['REMOTE_ADDR']    . PHP_EOL, 3, $DEFAULT_DIR[$t]);
        error_log("REQUEST_URI: "    .$_SERVER['REQUEST_URI']    . PHP_EOL, 3, $DEFAULT_DIR[$t]);
        error_log("REQUEST_METHOD: " .$_SERVER['REQUEST_METHOD'] . PHP_EOL, 3, $DEFAULT_DIR[$t]);
        //error_log('$_SERVER: '.var_export($_SERVER,true). PHP_EOL, 3, $DEFAULT_DIR[$t]);
        
        if(isset($data) && strlen($data)>2)
        {
            error_log("- - - - - php://input - - - - - - - ". PHP_EOL, 3, $DEFAULT_DIR[$t]);
            error_log($data. PHP_EOL, 3, $DEFAULT_DIR[$t]);
        }
        if(isset($_GET) && count($_GET) > 0)
        {
            error_log("- - - - - $ _GET - - - - - - - - - ". PHP_EOL, 3, $DEFAULT_DIR[$t]);
            $str = '';
            $c = 1;
            foreach($_GET as $key =>$val)
                $str .= $c++.". $key : $val\n";
            error_log($str, 3, $DEFAULT_DIR[$t]);
        }
        if(isset($_POST) && count($_POST) > 0)
        {
            error_log("- - - - - $ _POST - - - - - - - - -". PHP_EOL, 3, $DEFAULT_DIR[$t]);
            $str = '';
            $c = 1;
            foreach($_POST as $key =>$val)
                $str .= $c++.". $key : $val\n";
            error_log($str, 3, $DEFAULT_DIR[$t]);
        }
        if(isset($input) && count($input) > 0)
        {
            error_log("- - - - - INPUT - - - - - - - - - -". PHP_EOL, 3, $DEFAULT_DIR[$t]);
            error_log(var_export($input, true). PHP_EOL, 3, $DEFAULT_DIR[$t]);
        }
        error_log("= = = = = = = = = = = = = = = = = = =". PHP_EOL, 3, $DEFAULT_DIR[$t]);
    }


    function myLog_frontend(string $input = '', bool $includeDate = true, bool $includeEOL = true, string $dir ='', bool $showCall = true)
    {
        global $DEFAULT_DIR;
        $myDate = '';
        $EOL = '';
        $debug = debug_backtrace()[0];
        $l = $debug['line'];
        $t = getCallFrom($debug['file']);
        $s = '';
        $ip = '';
        $agnt = '';

        if($showCall)
            $s = " ".$debug['file']."($l):";

        if(!array_key_exists($t, $DEFAULT_DIR))
        {
            $DEFAULT_DIR[$t] = $DEFAULT_DIR[0];
        }

        if(empty($dir) || !checkDirectory2($dir))
            $dir = $DEFAULT_DIR[$t];


        if($includeDate)
        {
            $date = new DateTime('now', new DateTimeZone('America/New_York'));
            $myDate = $date->format('[m/d/Y H:i:s]');
            $ip = getIP();
            if(!empty($_SERVER['HTTP_USER_AGENT']))
                $agnt = " : ".$_SERVER['HTTP_USER_AGENT'];
        }
        if($includeEOL)
            $EOL = PHP_EOL;


        $input = $ip."$myDate"."$s $input".$agnt.$EOL;
        error_log($input, 3, $dir);
    }



    function myLog_mid(string $description = null, $dir='')
    {
        global $DEFAULT_DIR;
        $debug = debug_backtrace()[0];
        //$l = $debug['line'];
        $t = getCallFrom($debug['file']);

        $description = $description ?? "FrontEnd App";

        if(!array_key_exists($t, $DEFAULT_DIR))
        {
            $DEFAULT_DIR[$t] = $DEFAULT_DIR[0];
        }

        if(empty($dir) || !checkDirectory2($dir))
            $dir = $DEFAULT_DIR[$t];

        $date = new DateTime('now', new DateTimeZone('America/New_York'));
        $myDate = $date->format('[n-d-Y H:i:s]');
       // $data = var_export(file_get_contents('php://input'), true);

        error_log("".$myDate. PHP_EOL, 3, $dir);
        error_log("= = = = = $description = = = = = =". PHP_EOL, 3, $dir);
        error_log("HTTP_USER_AGENT: ".$_SERVER['HTTP_USER_AGENT']. PHP_EOL, 3, $dir);
        error_log("Client IP: "        .getIP()                    . PHP_EOL, 3, $dir);
        
        if(isset($_POST) && count($_POST) > 0)
        {
            error_log("- - - - - $ _POST - - - - - - - - -". PHP_EOL, 3, $dir);
            $str = '';
            $c = 1;
            foreach($_POST as $key =>$val)
                $str .= $c++.". $key : $val\n";
            error_log($str, 3, $dir);
        }
        error_log("= = = = = = = = = = = = = = = = = = =". PHP_EOL, 3, $dir);
        error_log(PHP_EOL, 3, $dir);
    }

    function myError(string $input = '', bool $includeDate = true, bool $includeEOL = true)
    {
        $dir = logs()."/Error/myError.log";

        $debug = debug_backtrace()[0];
        $l = $debug['line'];
        $t = getCallFrom($debug['file']);

        $s = $debug['file']."($l): $input";

        $trace = debug_backtrace();
        $str = '';

  
        $i = 0;
        do
        {
          if(isset($trace[$i]['file'],$trace[$i]['line']))
            $s .= $trace[$i]['file']."(".$trace[$i]['line'].")".PHP_EOL;
          $i++;
        }
        while($i < count($trace)-1);
  
        if(isset($trace[$i]['file'],$trace[$i]['line']))
          $s .= $trace[$i]['file']."(".$trace[$i]['line'].")";



        myLog($s, $includeDate, $includeEOL, $dir, false);
    }

    function myException(string $input = '', bool $includeDate = true, bool $includeEOL = true)
    {
        $dir = logs()."/Error/myException.log";

        $debug = debug_backtrace()[0];
        $l = $debug['line'];
        $t = getCallFrom($debug['file']);

        $s = $debug['file']."($l): $input";

        myLog($s, $includeDate, $includeEOL, $dir, false);
    }

?>