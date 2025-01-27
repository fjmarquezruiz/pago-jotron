<?php

namespace App\Enum;

/**
 * Enum representing different permissions in the application.
 */
enum PermissionsEnum: string
{
    /**
     * Permission to manage features.
     */
    case ManageFeatures = 'manage_features';

    /**
     * Permission to manage users.
     */
    case ManageUsers = 'manage_users';

    /**
     * Permission to manage roles.
     */
    case ManageRoles = 'manage_roles';

    /**
     * Permission to manage comments.
     */
    case ManageComments = 'manage_comments';

    /**
     * Permission to upvote or downvote.
     */
    case UpvoteDownvote = 'upvote_downvote';

    /**
     * Permission to manage bodegas.
     */
    case ManageBodegas = 'manage_bodegas';

    /**
     * Permission to manage vinos.
     */
    case ManageVinos = 'manage_vinos';

    /**
     * Permission to manage denominaciones.
     */
    case ManageDenominaciones = 'manage_denominaciones';
}
