<?php

namespace App\Services;

use Cloudinary\Cloudinary;
use Exception;
use Illuminate\Support\Facades\Log;

/**
 * Service class for handling Cloudinary image operations.
 */
class CloudinaryService
{
    protected $cloudinary;

    /**
     * Constructor to initialize the Cloudinary instance.
     */
    public function __construct()
    {
        $this->cloudinary = new Cloudinary([
            'cloud' => [
                'cloud_name' => env('CLOUDINARY_CLOUD_NAME'),
                'api_key' => env('CLOUDINARY_API_KEY'),
                'api_secret' => env('CLOUDINARY_API_SECRET'),
            ],
        ]);
    }

    /**
     * Upload an image to Cloudinary and return the secure URL and public ID.
     *
     * @param  string  $imagePath - The path to the image file to be uploaded.
     * @return array - An associative array containing the public ID and secure URL.
     */
    public function uploadImage($imagePath)
    {
        try {
            $result = $this->cloudinary->uploadApi()->upload($imagePath);
            return [
                'public_id' => $result['public_id'],
                'url' => $result['secure_url'],
            ];
        } catch (Exception $e) {
            Log::error('Failed to upload image: ' . $e->getMessage());
            throw $e; // Re-throw the exception to be handled by the caller
        }
    }

    /**
     * Delete an image from Cloudinary using its public ID.
     *
     * @param  string  $publicId - The public ID of the image to be deleted.
     * @return void
     */
    public function deleteImage($publicId)
    {
        if ($publicId) {
            try {
                $this->cloudinary->uploadApi()->destroy($publicId);
            } catch (Exception $e) {
                Log::warning('Failed to delete image: ' + $e->getMessage());
            }
        }
    }
}
