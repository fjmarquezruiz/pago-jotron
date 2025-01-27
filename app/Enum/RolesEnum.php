<?php

namespace App\Enum;

/**
 * Enum representing different user roles in the application.
 */
enum RolesEnum: string
{
    /**
     * Admin role.
     */
    case Admin = 'admin';

    /**
     * Commenter role.
     */
    case Commenter = 'commenter';

    /**
     * Editor role.
     */
    case Editor = 'editor';

    /**
     * User role.
     */
    case User = 'user';

    /**
     * Returns an associative array of all roles with their labels.
     *
     * @return array<string, string>
     */
    public static function labels()
    {
        return [
            self::Admin->value => 'Admin',
            self::Commenter->value => 'Commenter',
            self::Editor->value => 'Editor',
            self::User->value => 'User',
        ];
    }

    /**
     * Returns the label for the current role.
     *
     * @return string
     */
    public static function label()
    {
        return match ($this) {
            self::Admin => 'Admin',
            self::Commenter => 'Commenter',
            self::Editor => 'Editor',
            self::User => 'User',
            default => throw new \InvalidArgumentException('Unknown role'),
        };
    }
}
