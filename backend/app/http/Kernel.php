<?php

namespace app\http;

use Illuminate\Foundation\http\Kernel as httpKernel;

class Kernel extends httpKernel
{
    protected $middleware = [];

    protected $middlewareGroups = [
        'web' => [],
        'api' => [],
    ];

    protected $routeMiddleware = [];
}