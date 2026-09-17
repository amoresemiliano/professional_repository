<?php
declare(strict_types=1);

namespace Vegen\Core;

use PDO;

/**
 * Controlador de Autenticación de Administradores.
 */
class AuthController
{
    /**
     * POST /api/auth/login
     */
    public static function login(): void
    {
        $input = self::getJsonBody();
        $email = trim((string)($input['email'] ?? ''));
        $password = (string)($input['password'] ?? '');

        if ($email === '' || $password === '') {
            Response::error('INVALID_CREDENTIALS', 'Credenciales inválidas.', 401);
        }

        try {
            $pdo = Database::getConnection();
            $stmt = $pdo->prepare("
                SELECT id, organization_id, email, password_hash, is_active
                FROM admin_users
                WHERE email = :email
                LIMIT 1
            ");
            $stmt->execute([':email' => $email]);
            $user = $stmt->fetch();

            // Comprobación defensiva: usuario inexistente, inactivo o contraseña errónea
            if (!$user || (int)$user['is_active'] !== 1 || !password_verify($password, $user['password_hash'])) {
                Logger::warning('Intento de login fallido', ['email' => $email]);
                Response::error('INVALID_CREDENTIALS', 'Credenciales inválidas.', 401);
            }

            // Actualizar last_login_at
            $upd = $pdo->prepare("UPDATE admin_users SET last_login_at = NOW() WHERE id = :id");
            $upd->execute([':id' => $user['id']]);

            // Iniciar sesión y regenerar session ID
            Auth::login($user['id'], $user['email'], $user['organization_id']);

            Response::success([
                'user' => [
                    'id'    => $user['id'],
                    'email' => $user['email'],
                    'name'  => 'Administrador',
                    'role'  => 'admin',
                ],
            ]);
        } catch (\Throwable $e) {
            Logger::error('Error en proceso de login', ['error' => $e->getMessage()]);
            Response::error('SERVER_ERROR', 'Error interno al procesar el inicio de sesión.', 500);
        }
    }

    /**
     * POST /api/auth/logout
     */
    public static function logout(): void
    {
        Auth::logout();
        Response::success(['message' => 'Sesión cerrada exitosamente.']);
    }

    /**
     * GET /api/auth/me
     */
    public static function me(): void
    {
        $admin = Auth::getCurrentAdmin();
        if (!$admin) {
            Response::error('UNAUTHORIZED', 'No autenticado.', 401);
        }

        Response::success(['user' => $admin]);
    }

    /**
     * POST /api/auth/change-password
     */
    public static function changePassword(): void
    {
        $admin = Auth::requireAdmin();
        $input = self::getJsonBody();

        $currentPassword = (string)($input['current_password'] ?? '');
        $newPassword = (string)($input['new_password'] ?? '');
        $confirmation = (string)($input['new_password_confirmation'] ?? '');

        if ($currentPassword === '' || $newPassword === '' || $confirmation === '') {
            Response::error('VALIDATION_ERROR', 'Todos los campos son obligatorios.', 422);
        }

        if (strlen($newPassword) < 8) {
            Response::error('PASSWORD_TOO_SHORT', 'La nueva contraseña debe tener al menos 8 caracteres.', 422);
        }

        if ($newPassword !== $confirmation) {
            Response::error('PASSWORD_MISMATCH', 'La nueva contraseña y su confirmación no coinciden.', 422);
        }

        if ($newPassword === $currentPassword) {
            Response::error('PASSWORD_IDENTICAL', 'La nueva contraseña no puede ser idéntica a la actual.', 422);
        }

        try {
            $pdo = Database::getConnection();
            $stmt = $pdo->prepare("SELECT password_hash FROM admin_users WHERE id = :id LIMIT 1");
            $stmt->execute([':id' => $admin['id']]);
            $hash = $stmt->fetchColumn();

            if (!$hash || !password_verify($currentPassword, $hash)) {
                Response::error('INVALID_CURRENT_PASSWORD', 'La contraseña actual no es correcta.', 400);
            }

            $newHash = password_hash($newPassword, PASSWORD_DEFAULT);
            $upd = $pdo->prepare("
                UPDATE admin_users
                SET password_hash = :hash, updated_at = NOW()
                WHERE id = :id
            ");
            $upd->execute([
                ':hash' => $newHash,
                ':id'   => $admin['id'],
            ]);

            // Regenerar ID de sesión tras cambio de credenciales
            session_regenerate_id(true);

            Logger::info('Contraseña de administrador actualizada con éxito', ['admin_id' => $admin['id']]);

            Response::success(['message' => 'Contraseña actualizada exitosamente.']);
        } catch (\Throwable $e) {
            Logger::error('Error al cambiar contraseña', ['error' => $e->getMessage()]);
            Response::error('SERVER_ERROR', 'Error interno al actualizar la contraseña.', 500);
        }
    }

    /**
     * Decodifica y valida el payload JSON entrante.
     */
    private static function getJsonBody(): array
    {
        $raw = file_get_contents('php://input');
        if (empty($raw)) {
            return $_POST ?? [];
        }

        $decoded = json_decode($raw, true);
        return is_array($decoded) ? $decoded : [];
    }
}
