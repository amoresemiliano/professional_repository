# Vegen Digital - DB DEV RECONCILIATION

Este directorio contiene los archivos necesarios para conciliar manualmente la base de datos DEV (`athcomar_professional_repository_dev`) y recuperar la integridad de los datos sin comprometer la información real del cliente.

## Orden de Ejecución

Por favor, siga este orden exacto en phpMyAdmin:

1. Ejecute el script `PRECHECK.sql` para comprobar el estado actual y confirmar que las tablas/columnas efectivamente faltan.
2. Aplique la migración `backend/migrations/003_add_protected_and_soft_delete.sql`.
3. Aplique la migración `backend/migrations/004_consolidation_verticals_plans_quotes.sql`.
4. Aplique la migración `backend/migrations/005_final_consolidation_fix.sql`.
5. Ejecute el script seeder `php backend/scripts/seed_consolidation.php` desde el terminal para insertar los catálogos base (este script es idempotente y no duplicará datos).
6. Ejecute el script `POSTCHECK.sql` para validar que todas las tablas y columnas están creadas.

## Paso Crítico: Protección Manual de Registros Reales

La migración 003 crea la columna `is_protected` con un valor por defecto de `0`. **Los registros reales del cliente no quedarán protegidos automáticamente.** Para proteger la información, identifique manualmente los IDs del cliente real y del cuestionario asociado, y actualícelos ejecutando las siguientes consultas en phpMyAdmin.

**Reemplace `[ID_DEL_CLIENTE_REAL]` e `[ID_DEL_CUESTIONARIO_REAL]` con los UUIDs correctos (cópielos visualmente de phpMyAdmin). NO ejecute operaciones destructivas o de prueba con estos registros.**

```sql
-- 1. Identificar el cliente real y protegerlo
UPDATE clients
SET is_protected = 1
WHERE id = '[ID_DEL_CLIENTE_REAL]';

-- 2. Identificar el cuestionario real y protegerlo
UPDATE questionnaires
SET is_protected = 1
WHERE id = '[ID_DEL_CUESTIONARIO_REAL]';
```

## Importante

- No elimine (`DROP` o `DELETE`) registros existentes.
- Utilice siempre phpMyAdmin en modo READ / UPDATE cauteloso.
- No añada detalles personales o PII en este repositorio.
