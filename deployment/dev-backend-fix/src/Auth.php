<?php
declare(strict_types=1);

namespace Vegen\Core;

use PDO;

/**
 * Gestor de sesiones y autenticación administrativa.
 */
class Auth
{
    /**
     * Inicializa la sesión con los parámetros seguros configurados.
     */
    public static function startSession(): void
    {
        if (function_exists('Vegen\configureSecureSession')) {
            \Vegen\configureSecureSession();
        }
        if (session_status() === PHP_SESSION_NONE && !headers_sent()) {
            session_start();
        }
    }

    /**
     * Registra el inicio de sesión de un administrador.
     */
    public static function login(string $adminId, string $email, string $organizationId): void
    {
        self::startSession();
        if (session_status() === PHP_SESSION_ACTIVE && !headers_sent()) {
            session_regenerate_id(true);
        }

        $_SESSION['admin_id'] = $adminId;
        $_SESSION['admin_email'] = $email;
        $_SESSION['organization_id'] = $organizationId;
    }

    /**
     * Cierra la sesión activa.
     */
    public static function logout(): void
    {
        self::startSession();
        $_SESSION = [];

        if (ini_get("session.use_cookies") && !headers_sent()) {
            $params = session_get_cookie_params();
            setcookie(
                session_name(),
                '',
                time() - 42000,
                $params["path"],
                $params["domain"],
                $params["secure"],
                $params["httponly"]
            );
        }

        if (session_status() === PHP_SESSION_ACTIVE) {
            session_destroy();
        }
    }

    /**
     * Obtiene los datos del administrador autenticado actualmente.
     */
    public static function getCurrentAdmin(): ?array
    {
        self::startSession();

        $adminId = $_SESSION['admin_id'] ?? null;
        if (!$adminId) {
            return null;
        }

        try {
            $pdo = Database::getConnection();
            $stmt = $pdo->prepare("
                SELECT id, organization_id, email, is_active, last_login_at, created_at
                FROM admin_users
                WHERE id = :id AND is_active = 1
                LIMIT 1
            ");
            $stmt->execute([':id' => $adminId]);
            $admin = $stmt->fetch();

            if (!$admin) {
                // Si el usuario fue desactivado o eliminado, invalidar sesión
                self::logout();
                return null;
            }

            return [
                'id'              => $admin['id'],
                'email'           => $admin['email'],
                'name'            => 'Administrador',
                'role'            => 'admin',
                'organization_id' => $admin['organization_id'],
            ];
        } catch (\Throwable $e) {
            Logger::error('Error verificando sesión de administrador', ['error' => $e->getMessage()]);
            return null;
        }
    }

    /**
     * Exige que la petición provenga de un administrador autenticado.
     * Si no, finaliza de inmediato con error 401.
     */
    public static function requireAdmin(): array
    {
        $admin = self::getCurrentAdmin();
        if (!$admin) {
            Response::error('UNAUTHORIZED', 'Acceso no autorizado. Inicie sesión para continuar.', 401);
        }
        return $admin;
    }
}
