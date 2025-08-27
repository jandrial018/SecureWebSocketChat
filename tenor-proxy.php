<?php
     header('Content-Type: application/json');

     function conf2()
     {
         return '/var/www/config';
     }
    require(conf2().'/tenor.php');

    $term  = isset($_GET['q']) ? urlencode($_GET['q']) : '';
    $limit = isset($_GET['limit']) ? intval($_GET['limit']) : 20;

    if (empty($term))
    {
        echo json_encode(['error' => 'Missing search term']);
        exit;
    }

    $url = "https://tenor.googleapis.com/v2/search?q={$term}&key={$API_KEY}&limit={$limit}";

    $response = file_get_contents($url);

    echo $response;
