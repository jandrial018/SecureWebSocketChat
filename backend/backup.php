<?php
    define('ENABLE_HISTORY', true);

    // Helper functions for paths
    function root()
    {
        return '/var/www';
    }
    function letsencrypt()
    {
        return '/etc/letsencrypt/live';
    }
    function logs()
    {
        return '/var/www/logs';
    }

    require  root().'/html/vendor/autoload.php';
    require root().'/Secure-Web-Socket-Chat/backend/logger.php';

    use Workerman\Worker;
    use Workerman\Connection\TcpConnection;
    //use Workerman\Lib\Timer;
    use Workerman\Timer;
    use Workerman\Protocols\Websocket;
    use Workerman\Protocols\Http\Request;
    

    setLogDirectory(logs()."/Server/chat.log");

    $context = [
        'ssl' => [
            'local_cert'  => '/etc/letsencrypt/live/websocketchat.com/fullchain.pem', // Full chain
            'local_pk'    => '/etc/letsencrypt/live/websocketchat.com/privkey.pem',   // Private key
            'verify_peer' => false,
        ]
    ];

    $wsWorker = new Worker('websocket://0.0.0.0:8443', $context);
    $wsWorker->transport = 'ssl';
    //$wsWorker->protocol = Websocket::class;
    Worker::$logFile = logs().'/Server/ChatSocket.log';

    $wsWorker->clients = [];
    $wsWorker->colors = ['#DCF8C6','#E1FFC7','#5ba9ff','#A7F3D0','#2E7D32','#B3E5FC','#1976D2','#f4e8ab','#b4d2e9','#f3b9cc','#adadad','#eec5ef','#ff82cf','#E6E6E6','#93b4f6'];
    $wsWorker->usedColors = [];
    $wsWorker->History = [];

    function calculateLuminance($color)
    {
        // Remove '#' if present
        $color = ltrim($color, '#');
        // Parse hex color
        $rgb = hexdec($color);
        $r = ($rgb >> 16) & 0xFF;
        $g = ($rgb >> 8) & 0xFF;
        $b = $rgb & 0xFF;
        return (0.299 * $r + 0.587 * $g + 0.114 * $b) / 255;
    }

    function setTextColor($backgroundColor)
    {
        $luminance = calculateLuminance($backgroundColor);
        return $luminance > 0.5 ? '#000000' : '#ffffff';
    }


    function HandSanitizer(&$data)
    {
         $vowels = array('%', '^', '$', '  ', '~', '`',  '*', '&', ';', '*',  
                         '|', '<', '>', '\\', '...', '../', '…', 'bin/sh', 'cgi-bin');

        $validKeys = ['color','font','id','source','name','ping'];//to be conntinued

        if(isset($data))
        {
            foreach($data as $key => $value)/*clean all _POST values*/
            {
                if(!is_array($value))
                {
                    $value = str_replace($vowels, "", $value);
                    $value = htmlspecialchars($value, ENT_QUOTES, 'UTF-8');
                    $value = substr((string)$value, 0, 50);
                    $value = trim($value);
                    $data[$key] = $value;
                }
                else
                {
                    unset($data[$key] );
                   // $data[$key] = null;
                }
            }
        }
    }


    function censorIp($ip, $visibleSegments = 1, $maskChar = '*')
    {
        if (filter_var($ip, FILTER_VALIDATE_IP, FILTER_FLAG_IPV4))
        {
            $parts = explode('.', $ip);
            $totalParts = count($parts);
            for ($i = $visibleSegments; $i < $totalParts; $i++)
            {
                $parts[$i] = "**".substr($parts[$i], -1);
            }
            return implode('.', $parts);

        } 
        elseif (filter_var($ip, FILTER_VALIDATE_IP, FILTER_FLAG_IPV6))
        {
            $parts = explode(':', $ip);
            $totalParts = count($parts);

            for ($i = $visibleSegments; $i < $totalParts; $i++) {
                if ($parts[$i] !== '')
                { 
                    	$parts[$i] = "***".substr($parts[$i], -1);
                }
            }
            return implode(':', $parts);
        }
        return false;
    }

    $wsWorker->onWebSocketConnect = function (TcpConnection $conn, Request $request) use (&$wsWorker)
    {
        $uri = $request->uri();

        $ipFilter = ['73.57.234.19'];
        $ip = $conn->getRemoteIp();

        $query = parse_url($uri, PHP_URL_QUERY);
        parse_str($query, $queryParams);
       
        HandSanitizer($queryParams);

        $conn->source = $queryParams['source'] ?? null;
        $conn->name   = $queryParams['name']   ?? null;
        $conn->isConnected = true;
        if(isset($queryParams['id'] ))
        {
            $conn->id = $queryParams['id'] ?? null;
        }

        if ($conn->source === 'extention')
        {
            $conn->color = '#FFFFF';
            $wsWorker->clients['extention'][$conn->id] = $conn;
            return;
        }
        
        if (count($wsWorker->colors) > 1)
        {
            $i = array_rand($wsWorker->colors);
            $conn->color = $wsWorker->colors[$i];
            $wsWorker->usedColors[] = $conn->color;
            array_splice($wsWorker->colors, $i, 1);
        } 
        else
        {
            $wsWorker->colors = $wsWorker->usedColors;
            $i = array_rand($wsWorker->colors);
            $conn->color = $wsWorker->colors[$i];
            unset($wsWorker->usedColors);
        }

        if(isset($wsWorker->clients['user'][$conn->id]))
        {
            $wsWorker->clients['user'][$conn->id][] = $conn;
        }
        else
            $wsWorker->clients['user'][$conn->id] = [$conn];

        $count = count($wsWorker->clients['user']);

        echo "New connection: {$ip}\n";

        
        $msg = [
            'name'    => (empty($conn->name))?'new user connected' : $conn->name,
            'message' => (empty($conn->name))?censorIp($ip) : "has connected",
            'color'   => $conn->color,
            'count'   => $count,
            'font'    => setTextColor($conn->color)
        ];
        $msg2 = [
            'init'  => 'init',
            'color' => $conn->color,
            'count' => $count,
            'id'    => $conn->id,
            'font'  => setTextColor($conn->color),
            'display' => (in_array($ip,$ipFilter))?true:false
        ];

        //$wsWorker->clients[$conn->source][$conn->id]->isConnected = true;

        foreach ($wsWorker->clients as $roles)//user, extension, unknown
        {
            foreach ($roles as $id => $clients)//conn-ids
            {
                if($id != $conn->$id)
                {
                    foreach ($clients as $client)//conn
                    {
                        sendToClient($client, $msg);
                    } 
                }         
                else
                {
                    foreach ($clients as $client)//conn
                    {
                        if ($client === $conn)
                        {
                            sendToClient($client, $msg2);
                        }
                    }
                }
            }
        }
    };

    $wsWorker->onMessage = function (TcpConnection $from, $data) use (&$wsWorker)
    {
        if(!isset($wsWorker->clients[$from->source][$from->id]))
            $wsWorker->clients[$from->source][$from->id] = [$from];

        $conn = $wsWorker->clients[$from->source][$from->id];
        $decode = json_decode($data, true);

        if (isset($decode['ping']))
        {
            foreach($conn as $con)
                sendToClient($con, $decode);
            return;
        }

        if(ENABLE_HISTORY)
        {
            if(isset($decode['GetHistory']))
            {
                if(isset($wsWorker->History)&& !empty($wsWorker->History))
                    sendToClient($from, ['History'=>$wsWorker->History]);
                else
                {
                    $data = [
                        [
                            'message' => "Hello, Welcome to the Secure WebSocket Chat🐱"
                        ],
                        [
                            'message' => "https://media.tenor.com/Ph_t9JAKkyEAAAAC/ralph-hi.gif"
                        ],
                        [
                            'message' => "Message are anonymous and encrypted using SSL/TLS encryption.\nMessages will remain visible to others until the 'Clear' btn is pressed, which will remove them from the back-end"
                        ],
                        [
                            'message' => "This is a passion project and under development. Check back again for feature updates"
                        ],
                        [
                            'message' => "add a name at the top right and start chatting. Images/videos can be shared by pasting the source URL along with your msg. working on emojis"
                        ]
                    ];
                    foreach($data as $val)
                    {
                        $val['id'] = 0;
                        $val['color'] = "#e1f0ff";
                        $val['font'] = "#000000ff";
                        $val['name'] = "";
                        $val['time'] = getCurrentUTCTime();
                        $wsWorker->History[] = ['id'=>0,'data'=>$val];
                        sendToClient($from, $val);
                    }
                }
                return;
            }
            elseif(isset($decode['ClearHistory']))
            {
                unset($wsWorker->History);
                return;
            }
            // $tz = new DateTimeZone('America/New_York');
            // $dt = new DateTime('now', $tz);
            // $decode['time'] = $dt->format('Y-m-d H:i:s');
            $decode['time'] = getCurrentUTCTime();
            $wsWorker->History[] = ['id'=>$from->id,'data'=>$decode];
            if(count($wsWorker->History)>999)
                array_shift($wsWorker->History);
        }

        $decode['color'] = $conn[0]->color ?? '#FFFFFF';

        foreach ($wsWorker->clients as $roles)//roles
        {
            foreach ($roles as $id => $client)//conn->ids
            {
                if ($id !== $conn[0]->id)
                {
                    foreach($client as $con)
                        sendToClient($con, $decode);
                } 
                else 
                {
                    $data = ['received' => $decode['messageID'] ?? -1];
                    echo "sending: ".json_encode($data, true)."\n";
                    foreach($client as $con)
                    {
                        sendToClient($con, $data);
                    }
                }
            }
        }
        
        myLog(json_encode([$from->id, "message"=>$decode['message']??'']),showCall:false);
    };

    $wsWorker->onClose = function (TcpConnection $from) use (&$wsWorker)
    {
         if(!isset($from->source))
         {
            e("does not have source:");
            e(output($from));
            return;
         }
         else
         {
            e('has souce: '.$from->source);
         }

        if(!isset($wsWorker->clients[$from->source][$from->id]))
            $wsWorker->clients[$from->source][$from->id] = [$from];

        $conns = $wsWorker->clients[$from->source][$from->id];
        foreach($conns as $key => $conn)
        {
            if($conn == $from)
            {
                $index = $key;
                $from->isConnected = false;
                $from->index = $key;
            }
        }

        Timer::add(1.5, function() use (&$wsWorker, $from)
        {
            if($wsWorker->clients[$from->source][$from->id][$from->index]->isConnected)
                return;

            echo "Connection closed: {$from->getRemoteIp()}\n";

            if(!isset($from->id, $from->source, $wsWorker->clients[$from->source][$from->id]))
            {
                echo "Unknow connection\n";
                return;
            }
            $conn = $wsWorker->clients[$from->source][$from->id]??$from;

            if (isset($conn->source) && $conn->source === 'extention')
            {
                unset($wsWorker->clients[$conn->source][$conn->id]);
                return;
            }

            $count = count($wsWorker->clients['user'])-1;
            $msg = [
                'closed'  => 'closed',
                'source'  => $conn->source ?? '',
                'name'    => $conn->name ?? censorIp($conn->getRemoteIp()),
                'message' => "has disconnected",
                'color'   => $conn->color ?? '#e1f0ff',
                'count'   => $count
            ];

            foreach ($wsWorker->clients as $roles)
            {
                foreach ($roles as $client)
                {
                    if ($client !== $conn)
                    {
                        sendToClient($client, $msg);
                    }
                }
            }

            if(isset($conn->color))
            {
                $used = array_flip($wsWorker->usedColors);
                if (isset($used[$conn->color]))
                {
                    $wsWorker->colors[] = $conn->color;
                    $i = $used[$conn->color];
                    array_splice($wsWorker->usedColors, $i, 1);
                }
            }
            unset($wsWorker->clients[$from->source][$conn->id]);
        }, [], false);
    };

    $wsWorker->onError = function (TcpConnection $conn, $code, $msg) {
        echo "Error: $msg\n";
        sendToClient($conn, ['error' => $msg]);
        $conn->close();
    };

    function getCurrentUTCTime()
    {
        $dt = new DateTime("now", new DateTimeZone("UTC"));
        return $dt->format(DateTime::ATOM); 
    }

    function sendToClient($client, $array)
    {
        if(!isset($array['time']))
        {
            $array['time'] = getCurrentUTCTime();
           // $array['time'] = time();
        }
        $client->send(json_encode($array, true));
    }

    echo "WebSocket server (Workerman) started on wss://{yourdomain}:8443\n";

    if (function_exists('posix_getuid') && posix_getuid() !== 0) {
        echo "Remember to run script with sudo privileges\n";
    } elseif (!function_exists('posix_getuid')) {
        echo "POSIX functions not available.\n";
    }


    Worker::runAll();

?>