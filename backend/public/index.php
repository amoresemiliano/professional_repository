<?php
declare(strict_types=1);

/**
 * VEGEN DIGITAL — FRONT CONTROLLER / API ROUTER
 */

// 1. Cargar bootstrap
require_once dirname(__DIR__) . '/src/bootstrap.php';

define('VEGEN_BOOTSTRAPPED', true);

use Vegen\Core\Response;
use Vegen\Core\AuthController;
use Vegen\Core\AdminController;
use Vegen\Core\QuestionnaireController;

// 2. Determinar método y URI
$method = strtoupper($_SERVER['REQUEST_METHOD'] ?? 'GET');
$requestUri = $_SERVER['REQUEST_URI'] ?? '/';
$parsedPath = parse_url($requestUri, PHP_URL_PATH) ?? '/';

// 3. Normalizar la ruta eliminando prefijos de subdirectorios de servidor
$path = '/' . ltrim($parsedPath, '/');

if (strpos($path, '/api/') !== false) {
    $path = substr($path, strpos($path, '/api/'));
} elseif (str_ends_with($path, '/api')) {
    $path = '/api';
} elseif ($path === '/health' || str_ends_with($path, '/health')) {
    $path = '/api/health';
}

// 4. Despacho de rutas

// --- HEALTH CHECK ---
if ($path === '/api/health') {
    require __DIR__ . '/health.php';
    exit;
}

// --- AUTH ---
if ($path === '/api/auth/login' && $method === 'POST') {
    AuthController::login();
}

if ($path === '/api/auth/logout' && $method === 'POST') {
    AuthController::logout();
}

if ($path === '/api/auth/me' && $method === 'GET') {
    AuthController::me();
}

if ($path === '/api/auth/change-password' && $method === 'POST') {
    AuthController::changePassword();
}

// --- ADMIN CLIENTS ---
if ($path === '/api/admin/clients') {
    if ($method === 'GET') {
        AdminController::getClients();
    } elseif ($method === 'POST') {
        AdminController::createClient();
    }
}

if (preg_match('#^/api/admin/clients/([a-zA-Z0-9_-]+)/archive$#', $path, $matches)) {
    if ($method === 'POST' || $method === 'DELETE') {
        AdminController::archiveClient($matches[1]);
    }
}

if (preg_match('#^/api/admin/clients/([a-zA-Z0-9_-]+)$#', $path, $matches)) {
    if ($method === 'GET') {
        AdminController::getClient($matches[1]);
    } elseif ($method === 'PUT' || $method === 'PATCH' || $method === 'POST') {
        AdminController::updateClient($matches[1]);
    } elseif ($method === 'DELETE') {
        AdminController::archiveClient($matches[1]);
    }
}

// --- ADMIN QUESTIONNAIRES ---
if ($path === '/api/admin/questionnaires') {
    if ($method === 'GET') {
        AdminController::getQuestionnaires();
    } elseif ($method === 'POST') {
        AdminController::createQuestionnaire();
    }
}

if (preg_match('#^/api/admin/questionnaires/([a-zA-Z0-9_-]+)/archive$#', $path, $matches)) {
    if ($method === 'POST' || $method === 'DELETE') {
        AdminController::archiveQuestionnaire($matches[1]);
    }
}

if (preg_match('#^/api/admin/questionnaires/([a-zA-Z0-9_-]+)$#', $path, $matches)) {
    if ($method === 'GET') {
        AdminController::getQuestionnaireDetail($matches[1]);
    } elseif ($method === 'PUT' || $method === 'PATCH' || $method === 'POST') {
        AdminController::updateQuestionnaire($matches[1]);
    } elseif ($method === 'DELETE') {
        AdminController::archiveQuestionnaire($matches[1]);
    }
}

// --- PUBLIC QUESTIONNAIRES (TOKEN) ---
if (preg_match('#^/api/q/([a-zA-Z0-9_-]+)/submit$#', $path, $matches)) {
    if ($method === 'POST') {
        QuestionnaireController::submit($matches[1]);
    }
}

if (preg_match('#^/api/q/([a-zA-Z0-9_-]+)/save$#', $path, $matches)) {
    if ($method === 'POST' || $method === 'PUT') {
        QuestionnaireController::save($matches[1]);
    }
}

if (preg_match('#^/api/q/([a-zA-Z0-9_-]+)$#', $path, $matches)) {
    if ($method === 'GET') {
        QuestionnaireController::getByToken($matches[1]);
    } elseif ($method === 'PUT' || $method === 'POST') {
        QuestionnaireController::save($matches[1]);
    }
}

// Si ninguna ruta coincide
Response::error('ROUTE_NOT_FOUND', "El recurso '{$method} {$path}' no fue encontrado.", 404);
